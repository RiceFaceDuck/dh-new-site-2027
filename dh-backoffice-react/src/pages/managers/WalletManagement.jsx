/**
 * WalletManagement (Alias Component)
 * 
 * 💡 [Deduplication Refactor]: Re-exports RefundManagement as the single source
 * of truth for Wallet & Refund Operations, eliminating duplicate maintenance overhead
 * while keeping route '/managers/wallet' fully backward-compatible.
 */

export { default } from './RefundManagement';