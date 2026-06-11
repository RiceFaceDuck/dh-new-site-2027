/* eslint-disable */
import { MANAGER_TASK_TYPES } from './managerTodoService';

// 🚀 THE FIX [Clean Architecture]: Facade Pattern
// นำเข้า Service ย่อยต่างๆ ที่ถูกแยกการทำงานตามหลัก Single Responsibility
import { todoQueryService } from './todo/todoQueryService';
import { todoActionService } from './todo/todoActionService';
import { todoPaymentService } from './todo/todoPaymentService';
import { todoWholesaleService } from './todo/todoWholesaleService';
import { todoWalletService } from './todo/todoWalletService';
import { todoStaffService } from './todo/todoStaffService';
import { todoInventoryService } from './todo/todoInventoryService';

export const todoService = {
  // Query
  subscribePendingTodos: todoQueryService.subscribePendingTodos,
  getCompletedTodos: todoQueryService.getCompletedTodos,

  // Action
  startTask: todoActionService.startTask,
  completeTask: todoActionService.completeTask,
  rejectTask: todoActionService.rejectTask,
  deleteTask: todoActionService.deleteTask,
  createManualTask: todoActionService.createManualTask,

  // Feature Specific
  verifyPaymentSlip: todoPaymentService.verifyPaymentSlip,
  approveWholesaleRequest: todoWholesaleService.approveWholesaleRequest,
  rejectWholesale: todoWholesaleService.rejectWholesale,
  processWalletWithdrawal: todoWalletService.processWalletWithdrawal,
  createStaffApprovalTask: todoStaffService.createStaffApprovalTask,
  requestProductDeletion: todoInventoryService.requestProductDeletion,

  // Helper Function
  isManagerTask: (taskType) => {
      return MANAGER_TASK_TYPES.includes(taskType);
  }
};