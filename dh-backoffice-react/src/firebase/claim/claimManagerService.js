import { cancelActionService } from './cancelActionService';
import { returnActionService } from './returnActionService';
import { claimActionService } from './claimActionService';

// Facade for backward compatibility and easy imports
export const claimManagerService = {
  
  approveRequest: async (task, ...args) => {
    let adminUid = args[0];
    let adminName = args[1];
    let payload = null;

    // Support polymorphic signature: (task, roleOrType, adminId, adminName, payload)
    if (args[0] === 'cancel' || args[0] === 'manager') {
      adminUid = args[1];
      adminName = args[2];
      payload = args[3];
    }

    const taskObj = payload ? { ...task, payload: { ...(task.payload || {}), ...payload } } : task;

    if (taskObj.type.startsWith('CANCEL_')) {
      return await cancelActionService.approveCancel(taskObj, adminUid, adminName);
    }
    if (taskObj.type === 'RETURN_APPROVAL') {
      return await returnActionService.approveRequest(taskObj, adminUid, adminName);
    }
    if (taskObj.type === 'CLAIM_APPROVAL' || taskObj.type === 'EXCHANGE_APPROVAL') {
      return await claimActionService.approveRequest(taskObj, adminUid, adminName);
    }
    throw new Error('Unknown task type for approval');
  },

  markArrived: async (task, adminUid, adminName) => {
    if (task.type === 'RETURN_APPROVAL') {
        return await returnActionService.markArrived(task, adminUid, adminName);
    }
    if (task.type === 'CLAIM_APPROVAL' || task.type === 'EXCHANGE_APPROVAL') {
        return await claimActionService.markArrived(task, adminUid, adminName);
    }
    throw new Error('Unknown task type for marking arrived');
  },

  completeRequest: async (task, adminUid, adminName) => {
    if (task.type === 'RETURN_APPROVAL') {
        return await returnActionService.completeRequest(task, adminUid, adminName);
    }
    if (task.type === 'CLAIM_APPROVAL' || task.type === 'EXCHANGE_APPROVAL') {
        return await claimActionService.completeRequest(task, adminUid, adminName);
    }
    throw new Error('Unknown task type for completion');
  },

  rejectRequest: async (task, ...args) => {
    let reason = args[0];
    let adminUid = args[1];
    let adminName = args[2];

    // Support polymorphic signature: (task, roleOrType, reason, adminId, adminName)
    if (args[0] === 'cancel' || args[0] === 'manager') {
      reason = args[1];
      adminUid = args[2];
      adminName = args[3];
    }

    if (task.type.startsWith('CANCEL_')) {
      return await cancelActionService.rejectCancel(task, reason, adminUid, adminName);
    }
    if (task.type === 'RETURN_APPROVAL') {
      return await returnActionService.rejectRequest(task, reason, adminUid, adminName);
    }
    if (task.type === 'CLAIM_APPROVAL' || task.type === 'EXCHANGE_APPROVAL') {
      return await claimActionService.rejectRequest(task, reason, adminUid, adminName);
    }
    throw new Error('Unknown task type for rejection');
  }
};
