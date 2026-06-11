import { doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../config';
import { todoService } from '../todoService';

export const inventorySourcingService = {
  reportNonExisting: async (reportData, uid) => {
    if (!reportData || !reportData.keyword || !reportData.keyword.trim()) return;
    try {
      const slugId = reportData.keyword.trim().toLowerCase().replace(/[^a-z0-9ก-๙]/g, '-');
      const docRef = doc(db, 'sourcing_requests', slugId);
      
      await setDoc(docRef, {
        keyword: reportData.keyword.trim(),
        category: reportData.category || '',
        customerName: reportData.customerName || '',
        referenceLink: reportData.referenceLink || '',
        sampleImage: reportData.sampleImage || '', 
        demandCount: increment(1),
        lastRequestedAt: serverTimestamp(),
        status: 'pending'
      }, { merge: true });
      
    } catch (error) {
      console.error("🔥 Error reporting non-existing product:", error);
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
