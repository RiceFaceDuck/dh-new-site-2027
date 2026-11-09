import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

/**
 * ⭐ Partner Review Service (Infrastructure Layer)
 * Clean Architecture & SRP: Encapsulates all Firestore queries and mutations
 * for partner store reviews (`partner_reviews/{partnerId}/comments`).
 */

/**
 * Subscribes to real-time review updates for a partner store.
 *
 * @param {string} partnerId - Partner ID
 * @param {function(Array): void} onUpdate - Callback with fetched reviews array
 * @param {function(Error): void} onError - Error callback
 * @param {number} [limitCount=15] - Maximum reviews to fetch
 * @returns {function(): void} Unsubscribe function
 */
export const subscribeToPartnerReviews = (partnerId, onUpdate, onError, limitCount = 15) => {
  if (!partnerId) return () => {};

  const reviewsRef = collection(db, getCollectionPath('partner_reviews'), partnerId, 'comments');
  const q = query(reviewsRef, orderBy('createdAt', 'desc'), limit(limitCount));

  return onSnapshot(
    q,
    (snapshot) => {
      const fetchedReviews = [];
      snapshot.forEach((docSnap) => {
        fetchedReviews.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (typeof onUpdate === 'function') {
        onUpdate(fetchedReviews);
      }
    },
    (err) => {
      console.error('[partnerReviewService] Error listening to partner reviews:', err);
      if (typeof onError === 'function') {
        onError(err);
      }
    }
  );
};

/**
 * Adds a new review for a partner store.
 *
 * @param {string} partnerId
 * @param {Object} reviewData
 * @param {string} reviewData.userId
 * @param {string} [reviewData.userName]
 * @param {string} [reviewData.userPhoto]
 * @param {number} reviewData.rating
 * @param {string} reviewData.comment
 * @returns {Promise<string>} Created review document ID
 */
export const addPartnerReview = async (partnerId, { userId, userName, userPhoto, rating, comment }) => {
  if (!partnerId) throw new Error('Missing partnerId');
  if (!userId) throw new Error('Missing userId');
  if (!comment || !comment.trim()) throw new Error('Comment cannot be empty');

  const reviewsRef = collection(db, getCollectionPath('partner_reviews'), partnerId, 'comments');
  const docRef = await addDoc(reviewsRef, {
    userId,
    userName: userName || 'ผู้ใช้งาน',
    userPhoto: userPhoto || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop',
    rating: Math.max(1, Math.min(5, Number(rating) || 5)),
    comment: comment.trim(),
    createdAt: serverTimestamp(),
    ownerLiked: false,
    ownerReply: null
  });

  return docRef.id;
};

/**
 * Toggles owner heart/like on a review comment.
 *
 * @param {string} partnerId
 * @param {string} reviewId
 * @param {boolean} currentStatus
 * @returns {Promise<boolean>}
 */
export const toggleReviewHeart = async (partnerId, reviewId, currentStatus) => {
  if (!partnerId || !reviewId) return false;

  const reviewRef = doc(db, getCollectionPath('partner_reviews'), partnerId, 'comments', reviewId);
  await updateDoc(reviewRef, {
    ownerLiked: !currentStatus
  });
  return true;
};

/**
 * Submits an owner reply to a customer review.
 *
 * @param {string} partnerId
 * @param {string} reviewId
 * @param {string} replyText
 * @returns {Promise<boolean>}
 */
export const addReviewReply = async (partnerId, reviewId, replyText) => {
  if (!partnerId || !reviewId || !replyText || !replyText.trim()) return false;

  const reviewRef = doc(db, getCollectionPath('partner_reviews'), partnerId, 'comments', reviewId);
  await updateDoc(reviewRef, {
    ownerReply: {
      text: replyText.trim(),
      createdAt: new Date().toISOString()
    }
  });
  return true;
};
