import { z } from 'zod';

/**
 * 🛡️ Centralized Zod Schema for Credit Points & Transactions (DH Notebook System)
 * Enforces strict type checking, null guards, and data integrity for all credit writes.
 */

export const creditTransactionTypeSchema = z.enum(['add', 'deduct']);

export const creditTransactionSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  uid: z.string().min(1, 'User UID is required'),
  type: creditTransactionTypeSchema,
  amount: z.number().min(0, 'Amount must be non-negative'),
  balanceAfter: z.number().optional(),
  referenceId: z.string().optional(),
  note: z.string().optional(),
  remark: z.string().optional(),
  partnerName: z.string().nullable().optional(),
  userEmail: z.string().nullable().optional(),
  recordedBy: z.string().optional(),
  operatorUid: z.string().optional(),
  action: z.string().optional(),
  category: z.string().optional(),
  module: z.string().optional(),
  deltaViews: z.number().optional(),
  deltaClicks: z.number().optional(),
  timestamp: z.any().optional()
}).passthrough();

export const creditLedgerSchema = z.object({
  totalAllocated: z.number().default(0),
  systemPoolMax: z.number().default(10000000),
  status: z.enum(['SECURE', 'WARNING', 'BREACHED']).default('SECURE'),
  lastAuditTime: z.any().optional()
}).passthrough();

export const creditConfigMapSchema = z.object({
  pointsEarningRate: z.number().positive().default(100),
  adImpressionCost: z.number().min(0).default(0.1),
  adImpressionCount: z.number().positive().default(1000),
  adClickCost: z.number().min(0).default(10),
  partnerRankingCost: z.number().min(0).default(50),
  maxTransactionLimit: z.number().positive().optional(),
  skuBonusRules: z.string().optional(),
  tiers: z.array(z.any()).optional()
}).passthrough();

export const creditConfigDocSchema = z.object({
  ledger: creditLedgerSchema.optional(),
  config: creditConfigMapSchema.optional(),
  updatedAt: z.any().optional()
}).passthrough();

/**
 * Validates a credit transaction payload before committing to Firestore.
 * @param {Object} data 
 * @returns {{ success: boolean, data?: Object, error?: z.ZodError }}
 */
export const validateCreditTransaction = (data) => {
  return creditTransactionSchema.safeParse(data);
};

/**
 * Validates a credit config document payload.
 * @param {Object} data 
 * @returns {{ success: boolean, data?: Object, error?: z.ZodError }}
 */
export const validateCreditConfig = (data) => {
  return creditConfigDocSchema.safeParse(data);
};
