import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  startAfter, 
  runTransaction,
  serverTimestamp,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from './config';

export const productReviewService = {
  /**
   * ดึงรายการรีวิวแบบ Pagination (ประหยัด Reads)
   * @param {string} productId รหัสสินค้า
   * @param {number} pageSize จำนวนรีวิวต่อหน้า
   * @param {object} lastDoc Document Snapshot ล่าสุดสำหรับ Start After
   */
  async getReviews(productId, pageSize = 5, lastDoc = null) {
    try {
      const reviewsRef = collection(db, 'product_reviews');
      
      let q = query(
        reviewsRef,
        where('productId', '==', productId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(
          reviewsRef,
          where('productId', '==', productId),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      
      const reviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert timestamp to readable time string (naive approach, better done in component or utils)
        timeAgo: this.timeSince(doc.data().createdAt?.toDate() || new Date())
      }));

      const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMore = snapshot.docs.length === pageSize;

      return { reviews, lastDoc: newLastDoc, hasMore };
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  },

  /**
   * เพิ่มรีวิวใหม่ พร้อมใช้ Transaction อัปเดตคะแนนเฉลี่ยที่ตัวสินค้า
   * @param {string} productId รหัสสินค้า
   * @param {object} reviewData ข้อมูลรีวิว
   * @param {object} user ข้อมูลผู้ใช้งานที่ล็อกอิน (auth.currentUser)
   */
  async addReview(productId, reviewData, user) {
    if (!user) throw new Error('You must be logged in to review.');
    if (!productId) throw new Error('Product ID is missing.');

    const productRef = doc(db, 'products', productId);
    const newReviewRef = doc(collection(db, 'product_reviews'));

    try {
      await runTransaction(db, async (transaction) => {
        // 1. อ่านข้อมูลสินค้าปัจจุบัน
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) {
          throw new Error('Product does not exist!');
        }

        const productData = productDoc.data();
        const currentCount = productData.reviewCount || 0;
        const currentTotalScore = (productData.averageRating || 0) * currentCount;
        
        // 2. คำนวณคะแนนใหม่
        const newCount = currentCount + 1;
        const newTotalScore = currentTotalScore + reviewData.rating;
        const newAverageRating = parseFloat((newTotalScore / newCount).toFixed(1));

        // 3. เตรียมข้อมูลรีวิว
        const newReview = {
          productId,
          userId: user.uid,
          userName: user.displayName || 'ลูกค้า DH Notebook',
          userAvatar: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'U'}&background=0D8ABC&color=fff`,
          rating: reviewData.rating,
          text: reviewData.text,
          likes: 0,
          verified: false, // ตั้งค่าเริ่มต้นเป็น false 
          createdAt: serverTimestamp()
        };

        // 4. บันทึกข้อมูล
        transaction.set(newReviewRef, newReview);
        transaction.update(productRef, {
          reviewCount: newCount,
          averageRating: newAverageRating
        });
      });

      return { success: true, id: newReviewRef.id };
    } catch (error) {
      console.error('Transaction failed: ', error);
      throw error;
    }
  },

  /**
   * กด Like ให้รีวิว
   */
  async likeReview(reviewId) {
    try {
      const reviewRef = doc(db, 'product_reviews', reviewId);
      await updateDoc(reviewRef, {
        likes: increment(1)
      });
      return true;
    } catch (error) {
      console.error('Error liking review:', error);
      throw error;
    }
  },

  // Helper สำหรับแปลงเวลา (ใช้ชั่วคราว)
  timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " ปีที่แล้ว";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " เดือนที่แล้ว";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " วันที่แล้ว";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " ชั่วโมงที่แล้ว";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " นาทีที่แล้ว";
    return "เพิ่งโพสต์";
  }
};
