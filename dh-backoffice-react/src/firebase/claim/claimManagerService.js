import { cancelActionService } from './cancelActionService';
import { returnActionService } from './returnActionService';
import { claimActionService } from './claimActionService';

// Facade for backward compatibility and easy imports
export const claimManagerService = {
  
  approveRequest: async (task, adminUid, adminName) => {
    if (task.type.startsWith('CANCEL_')) {
      return await cancelActionService.approveCancel(task, adminUid, adminName);
    }
    if (task.type === 'RETURN_APPROVAL') {
      return await returnActionService.approveRequest(task, adminUid, adminName);
    }
    if (task.type === 'CLAIM_APPROVAL') {
      return await claimActionService.approveRequest(task, adminUid, adminName);
    }
    throw new Error('Unknown task type for approval');
  },

  markArrived: async (task, adminUid, adminName) => {
    if (task.type === 'RETURN_APPROVAL') {
        return await returnActionService.markArrived(task, adminUid, adminName);
    }
    if (task.type === 'CLAIM_APPROVAL') {
        return await claimActionService.markArrived(task, adminUid, adminName);
    }
    throw new Error('Unknown task type for marking arrived');
  },

  completeRequest: async (task, adminUid, adminName) => {
    if (task.type === 'RETURN_APPROVAL') {
        return await returnActionService.completeRequest(task, adminUid, adminName);
    }
    if (task.type === 'CLAIM_APPROVAL') {
        return await claimActionService.completeRequest(task, adminUid, adminName);
    }
    throw new Error('Unknown task type for completion');
  },

  rejectRequest: async (task, reason, adminUid, adminName) => {
    if (task.type.startsWith('CANCEL_')) {
      return await cancelActionService.rejectCancel(task, reason, adminUid, adminName);
    }
    if (task.type === 'RETURN_APPROVAL') {
      return await returnActionService.rejectRequest(task, reason, adminUid, adminName);
    }
    if (task.type === 'CLAIM_APPROVAL') {
      return await claimActionService.rejectRequest(task, reason, adminUid, adminName);
    }
    throw new Error('Unknown task type for rejection');
  }
};
