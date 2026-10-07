import { adManagementService } from './adManagementService';
import { historyService } from './historyService';
import { auth } from './config';
import { claimManagerService } from './claim/claimManagerService';
import { CLAIM_TASK_TYPES } from './managerTodoService';

// ----------------------------------------------------------------------
// 📦 Manager Action Service
// Handles all approval/rejection logic for the Manager Dashboard.
// Extracts business logic from UI components to adhere to SRP (Single Responsibility Principle).
// ----------------------------------------------------------------------
export const managerActionService = {

  handleApproval: async (taskId, type, payload, originalTask, adminId) => {
    // 0. CLAIM / RETURN / EXCHANGE / CANCEL APPROVALS (Clean Architecture Unified Facade)
    if (CLAIM_TASK_TYPES.includes(type)) {
      const adminName = auth.currentUser?.displayName || 'Manager';
      const isCancel = type.startsWith('CANCEL_');
      const roleOrType = isCancel ? 'cancel' : 'manager';
      const task = originalTask || { id: taskId, type, payload };

      await claimManagerService.approveRequest(task, roleOrType, adminId, adminName, payload);

      const actionName = isCancel ? 'ApproveCancelClaim' : 'ApproveClaim';
      const detailMsg = isCancel 
        ? `อนุมัติการยกเลิกคำขอ: ${type} (${task.title || taskId})`
        : `อนุมัติคำขอ: ${type} (${task.title || taskId})`;
      await historyService.addLog('ManagerAction', actionName, taskId, detailMsg, adminId || auth.currentUser?.uid);

      const targetStatus = isCancel ? 'cancelled' : 'waiting_item';
      return { success: true, newStatus: targetStatus, status: targetStatus };
    }

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

    // 6. CUSTOMER_DELETE_APPROVAL (CRIT-02: ดำเนินการลบข้อมูลลูกค้าจริง)
    if (type === 'CUSTOMER_DELETE_APPROVAL') {
      const { deleteCustomer } = await import('./customerAdminService');
      const targetId = payload?.customerId || originalTask?.targetUid || originalTask?.payload?.customerId || originalTask?.targetId;
      const customerName = payload?.name || originalTask?.payload?.name || originalTask?.title || 'ลูกค้า';

      if (!targetId) {
        throw new Error("ไม่พบรหัสลูกค้าที่ต้องการลบในคำขอ");
      }

      await deleteCustomer(targetId, customerName);
      await historyService.addLog('ManagerAction', 'ApproveCustomerDelete', targetId, `อนุมัติการลบข้อมูลลูกค้า: ${customerName} (ID: ${targetId})`, auth.currentUser?.uid);
      return { success: true, newStatus: 'completed' };
    }

    // Default fallback
    await historyService.addLog('ManagerAction', 'ApproveTask', taskId, `อนุมัติคำขอ: ${type}`, auth.currentUser?.uid);
    return { success: true, newStatus: 'completed' };
  },

  handleRejection: async (taskId, type, payload, originalTask, adminId, reason) => {
    // 0. CLAIM / RETURN / EXCHANGE / CANCEL REJECTIONS (Clean Architecture Unified Facade)
    if (CLAIM_TASK_TYPES.includes(type)) {
      const adminName = auth.currentUser?.displayName || 'Manager';
      const isCancel = type.startsWith('CANCEL_');
      const roleOrType = isCancel ? 'cancel' : 'manager';
      const task = originalTask || { id: taskId, type, payload };

      await claimManagerService.rejectRequest(task, roleOrType, reason, adminId, adminName);

      const actionName = isCancel ? 'RejectCancelClaim' : 'RejectClaim';
      const detailMsg = isCancel
        ? `ปฏิเสธการขอยกเลิก: ${type} เหตุผล: ${reason || 'ไม่มีระบุ'}`
        : `ปฏิเสธคำขอ: ${type} เหตุผล: ${reason || 'ไม่มีระบุ'}`;
      await historyService.addLog('ManagerAction', actionName, taskId, detailMsg, auth.currentUser?.uid);

      const targetStatus = isCancel ? (originalTask?.originalStatus || 'processing') : 'rejected';
      return { success: true, newStatus: targetStatus, status: targetStatus };
    }

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
