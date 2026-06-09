import { billingQueryService } from './billingQueryService';
import { billingTransactionService } from './billingTransactionService';
import { billingUpdateService } from './billingUpdateService';

export const billingService = {
  ...billingQueryService,
  ...billingTransactionService,
  ...billingUpdateService
};