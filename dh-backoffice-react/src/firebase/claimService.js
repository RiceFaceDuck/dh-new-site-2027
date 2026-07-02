import { collection, doc, addDoc, getDocs, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

const COLLECTION_NAME = 'claims';

export const claimService = {
  // สร้างรายการเคลมใหม่
  createClaim: async (claimData) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...claimData,
        status: 'Pending', // Pending, InProgress, Completed, Rejected
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, ...claimData };
    } catch (error) {
      console.error("Error creating claim:", error);
      throw error;
    }
  },

  // ดึงข้อมูลรายการเคลมทั้งหมด
  getClaims: async () => {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const claims = [];
      querySnapshot.forEach((doc) => {
        claims.push({ id: doc.id, ...doc.data() });
      });
      return claims;
    } catch (error) {
      console.error("Error getting claims:", error);
      throw error;
    }
  },

  // อัปเดตสถานะการเคลม
  updateClaimStatus: async (claimId, newStatus, resolution = '') => {
    try {
      const claimRef = doc(db, COLLECTION_NAME, claimId);
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };
      
      if (resolution) {
        updateData.resolution = resolution;
      }
      
      await updateDoc(claimRef, updateData);
      return true;
    } catch (error) {
      console.error("Error updating claim status:", error);
      throw error;
    }
  }
};