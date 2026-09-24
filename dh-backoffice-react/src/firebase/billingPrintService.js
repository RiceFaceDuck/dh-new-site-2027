import { doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const COLLECTION_NAME = getCollectionPath('orders');

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
