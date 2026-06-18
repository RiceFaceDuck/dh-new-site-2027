import { getUserTier, formatCredit, calculateEarnedPoints } from './credit/creditFormatService';
import { adjustUserCredit, handlePaymentCompletion, clawbackPoints } from './credit/creditActionService';

// ==========================================
// ⚙️ Core Credit Service (Facade Pattern)
// ==========================================
// This file has been refactored to follow the Single Responsibility Principle.
// It now acts as a facade, delegating calls to specific credit modules.

export const creditCoreService = {
  formatCredit,
  getUserTier,
  calculateEarnedPoints,
  adjustUserCredit,
  handlePaymentCompletion,
  clawbackPoints
};
