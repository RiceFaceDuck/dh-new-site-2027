import { adManagementService } from './adManagementService';

// ----------------------------------------------------------------------
// 📦 Manager Action Service
// Handles all approval/rejection logic for the Manager Dashboard.
// Extracts business logic from UI components to adhere to SRP (Single Responsibility Principle).
// ----------------------------------------------------------------------
export const managerActionService = {

  handleApproval: async (taskId, type, payload, originalTask, adminId) => {
    // 1. STAFF_APPROVAL
    if (type === 'STAFF_APPROVAL') {
      const { auth } = await import('./config');
      const { userService } = await import('./userService');
      
      const currentAdminId = adminId || auth.currentUser?.uid || 'Admin';
      const targetUid = payload.targetUid;
      const newRole = payload.metadata?.requestedRole || 'staff';
      
      await userService.updateUserRole(currentAdminId, targetUid, newRole);
      await userService.updateUserProfile(targetUid, { 
          isStaff: true, 
          isActive: true, 
          roles: [newRole.charAt(0).toUpperCase() + newRole.slice(1)] 
      });
      return { success: true, newStatus: 'completed' };
    }

    // 2. PRODUCT_KNOWLEDGE_APPROVAL
    if (type === 'PRODUCT_KNOWLEDGE_APPROVAL') {
      const { productKnowledgeAdminService } = await import('./productKnowledgeAdminService');
      await productKnowledgeAdminService.approveKnowledgeTask(originalTask, adminId);
      // Status is already updated by the service's transaction
      return { success: true, newStatus: null }; 
    }

    // 3. AD_APPROVAL (Partner, User SKU, Billboard)
    if (['AD_APPROVAL', 'USER_SKU_APPROVAL', 'BILLBOARD_APPROVAL'].includes(type)) {
      // payload in TodoItem is usually the adPayload, but the adId is typically stored in targetSkuId
      // In StoreProfileForm.jsx, targetSkuId is set to adId.
      const adId = originalTask.targetSkuId || originalTask.payload?.adId || originalTask.adPayload?.id || originalTask.id;
      
      const result = await adManagementService.approveAd(adId, taskId);
      if (!result.success) throw new Error(result.message);
      
      // Status is updated within the approveAd batch
      return { success: true, newStatus: null };
    }

    // Default fallback
    return { success: true, newStatus: 'completed' };
  },

  handleRejection: async (taskId, type, payload, originalTask, adminId, reason) => {
    // 1. AD_APPROVAL
    if (['AD_APPROVAL', 'USER_SKU_APPROVAL', 'BILLBOARD_APPROVAL'].includes(type)) {
      const adId = originalTask.targetSkuId || originalTask.payload?.adId || originalTask.adPayload?.id || originalTask.id;
      const result = await adManagementService.rejectAd(adId, taskId, reason);
      if (!result.success) throw new Error(result.message);
      
      return { success: true, newStatus: null };
    }

    // Default fallback
    return { success: true, newStatus: 'rejected' };
  }
};
