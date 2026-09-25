import { doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from './config';

const COLLECTION_NAME = 'orders';

export const billingPrintService = {
  updatePrintCount: async (docId, currentCount) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, docId);
      await updateDoc(docRef, {
        printCount: increment(1), 
        lastPrintedAt: serverTimestamp()
      });
      return true;
    } catch (error) { 
      console.error("🔥 Error updating print count:", error);
      return false; 
    }
  }
};
