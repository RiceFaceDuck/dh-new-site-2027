import { adManagementService } from './adManagementService';
import { historyService } from './historyService';
import { auth } from './config';

// ----------------------------------------------------------------------
// 📦 Manager Action Service
// Handles all approval/rejection logic for the Manager Dashboard.
// Extracts business logic from UI components to adhere to SRP (Single Responsibility Principle).
// ----------------------------------------------------------------------
export const managerActionService = {

  handleApproval: async (taskId, type, payload, originalTask, adminId) => {
    // 1. STAFF_APPROVAL
    if (type === 'STAFF_APPROVAL') {
      const { auth: dynamicAuth } = await import('./config');
      const { userService } = await import('./userService');
      
      const currentAdminId = adminId || dynamicAuth.currentUser?.uid || 'Admin';
      const targetUid = payload.targetUid;
      const newRole = payload.metadata?.requestedRole || 'staff';
      
      await userService.updateUserRole(currentAdminId, targetUid, newRole);
      await userService.updateUserProfile(targetUid, { 
          isStaff: true, 
          isActive: true, 
          roles: [newRole.charAt(0).toUpperCase() + newRole.slice(1)] 
      });

      await historyService.addLog('ManagerAction', 'ApproveStaff', targetUid, `อนุมัติคำขอแต่งตั้งพนักงานเป็น ${newRole}`, auth.currentUser?.uid);
      return { success: true, newStatus: 'completed' };
    }

    // 2. PRODUCT_KNOWLEDGE_APPROVAL
    if (type === 'PRODUCT_KNOWLEDGE_APPROVAL') {
      const { productKnowledgeAdminService } = await import('./productKnowledgeAdminService');
      await productKnowledgeAdminService.approveKnowledgeTask(originalTask, adminId);
      
      await historyService.addLog('ManagerAction', 'ApproveKnowledge', originalTask.id, `อนุมัติข้อมูลความรู้สินค้า: ${originalTask.title}`, auth.currentUser?.uid);
      return { success: true, newStatus: null }; 
    }

    // 3. AD_APPROVAL (Partner, User SKU, Billboard)
    if (['AD_APPROVAL', 'USER_SKU_APPROVAL', 'BILLBOARD_APPROVAL', 'APPROVE_PARTNER_AD', 'APPROVE_BILLBOARD_AD', 'BUSINESS_CARD_AD_APPROVAL'].includes(type)) {
      const adId = originalTask.targetSkuId || originalTask.payload?.adId || originalTask.adPayload?.id || originalTask.id;
      
      const result = await adManagementService.approveAd(adId, taskId);
      if (!result.success) throw new Error(result.message);
      
      await historyService.addLog('ManagerAction', 'ApproveAd', adId, `อนุมัติคำขอโฆษณา: ${type}`, auth.currentUser?.uid);
      return { success: true, newStatus: null };
    }

    // 4. LEAVE_APPROVAL
    if (type === 'LEAVE_APPROVAL') {
      await historyService.addLog('ManagerAction', 'ApproveLeave', originalTask.id, `อนุมัติลางานให้ ${originalTask.payload?.staffName || 'พนักงาน'} (${originalTask.payload?.leaveType})`, auth.currentUser?.uid);
      return { success: true, newStatus: 'approved' };
    }

    // 5. WHOLESALE_APPROVAL / wholesale_request
    if (type === 'wholesale_request' || type === 'WHOLESALE_REQUEST' || type === 'WHOLESALE_APPROVAL') {
      const { todoService } = await import('./todoService');
      const orderId = payload.orderId;
      if (!orderId) throw new Error("ไม่พบรหัสออเดอร์ในคำขอ");

      const newTotals = {
        ...originalTask.payload?.originalTotals,
        netTotal: payload.newNetTotal,
        subtotal: payload.calculatorMetadata?.wholesaleSubtotal || originalTask.payload?.originalTotals?.subtotal || 0,
        discount: (originalTask.payload?.originalTotals?.discount || 0) + (payload.extraManualDiscount || 0) + (payload.calculatorMetadata?.itemLevelDiscount || 0),
        grandTotal: payload.newNetTotal,
        displayTotal: payload.calculatorMetadata?.wholesaleSubtotal || originalTask.payload?.originalTotals?.subtotal || 0
      };

      const newItems = (originalTask.payload?.items || []).map((item, idx) => {
        const matched = payload.itemsWithNewPrices?.[idx];
        if (matched) {
          const approvedPrice = matched.wholesalePriceApproved;
          return {
            ...item,
            price: approvedPrice,
            priceAtPurchase: approvedPrice,
            wholesalePriceApproved: approvedPrice
          };
        }
        return item;
      });

      const result = await todoService.approveWholesaleRequest(taskId, orderId, newTotals, newItems, { uid: adminId });
      if (!result.success) throw new Error(result.message || "เกิดข้อผิดพลาดในการอนุมัติราคาส่ง");

      return { success: true, newStatus: 'completed' };
    }

    // Default fallback
    await historyService.addLog('ManagerAction', 'ApproveTask', taskId, `อนุมัติคำขอ: ${type}`, auth.currentUser?.uid);
    return { success: true, newStatus: 'completed' };
  },

  handleRejection: async (taskId, type, payload, originalTask, adminId, reason) => {
    // 1. AD_APPROVAL
    if (['AD_APPROVAL', 'USER_SKU_APPROVAL', 'BILLBOARD_APPROVAL', 'APPROVE_PARTNER_AD', 'APPROVE_BILLBOARD_AD', 'BUSINESS_CARD_AD_APPROVAL'].includes(type)) {
      const adId = originalTask.targetSkuId || originalTask.payload?.adId || originalTask.adPayload?.id || originalTask.id;
      const result = await adManagementService.rejectAd(adId, taskId, reason);
      if (!result.success) throw new Error(result.message);
      
      await historyService.addLog('ManagerAction', 'RejectAd', adId, `ปฏิเสธคำขอโฆษณา: ${type} เหตุผล: ${reason}`, auth.currentUser?.uid);
      return { success: true, newStatus: null };
    }

    // 2. LEAVE_APPROVAL
    if (type === 'LEAVE_APPROVAL') {
      await historyService.addLog('ManagerAction', 'RejectLeave', originalTask.id, `ไม่อนุมัติลางานให้ ${originalTask.payload?.staffName || 'พนักงาน'} เหตุผล: ${reason}`, auth.currentUser?.uid);
      return { success: true, newStatus: 'rejected' };
    }

    // 3. WHOLESALE_APPROVAL / wholesale_request
    if (type === 'wholesale_request' || type === 'WHOLESALE_REQUEST' || type === 'WHOLESALE_APPROVAL') {
      const { todoService } = await import('./todoService');
      const orderId = payload.orderId;
      if (!orderId) throw new Error("ไม่พบรหัสออเดอร์ในคำขอ");
      
      const result = await todoService.rejectWholesale(taskId, orderId, reason, { uid: adminId });
      if (!result.success) throw new Error(result.message || "เกิดข้อผิดพลาดในการปฏิเสธคำขอราคาส่ง");
      return { success: true, newStatus: 'rejected' };
    }

    // Default fallback
    await historyService.addLog('ManagerAction', 'RejectTask', taskId, `ปฏิเสธคำขอ: ${type} เหตุผล: ${reason}`, auth.currentUser?.uid);
    return { success: true, newStatus: 'rejected' };
  }
};
