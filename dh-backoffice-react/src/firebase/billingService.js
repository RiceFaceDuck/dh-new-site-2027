import { billingQueryService } from './billingQueryService';
import { billingTransactionService } from './billingTransactionService';
import { billingStatusTransaction } from './billingStatusTransaction';
import { billingDeleteService } from './billingDeleteService';
import { billingPrintService } from './billingPrintService';

export const billingService = {
  ...billingQueryService,
  ...billingTransactionService,
  ...billingStatusTransaction,
  ...billingDeleteService,
  ...billingPrintService
};