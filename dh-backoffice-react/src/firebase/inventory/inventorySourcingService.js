import { doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../config';
import { todoService } from '../todoService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export const inventorySourcingService = {
  reportNonExisting: async (reportData, uid) => {
    const cleanKeyword = reportData?.keyword?.trim();
    if (!cleanKeyword) return;
    try {
      let slugId = cleanKeyword.toLowerCase().replace(/[^a-z0-9ก-๙]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (!slugId) {
        slugId = `req-${Date.now()}`;
      }
      const docRef = doc(db, getCollectionPath('sourcing_requests'), slugId);
      
      await setDoc(docRef, {
        keyword: cleanKeyword,
        category: reportData.category?.trim() || '',
        customerName: reportData.customerName?.trim() || '',
        referenceLink: reportData.referenceLink?.trim() || '',
        sampleImage: reportData.sampleImage || '', 
        lastRequestedAt: serverTimestamp()
      }, { merge: true });
      
    } catch (error) {
      console.error("🔥 Error reporting non-existing product:", error);
      throw error;
    }
  },

  submitKnowledgeUpdate: async (sku, productName, modelOrPart, type, uid) => {
    try {
      await todoService.requestKnowledgeApproval(sku, productName, modelOrPart, type, uid);
    } catch (error) {
      console.error("🔥 Error submitting knowledge:", error);
      throw error;
    }
  }
};
