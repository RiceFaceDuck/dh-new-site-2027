<grimoire>
<flow_and_entry>
- Entry: `pages/managers/RefundManagement.jsx` (Route: `/managers/refund`) & `pages/managers/WalletManagement.jsx` (clean alias re-export).
- Controller: `pages/managers/wallet/hooks/useWalletManagement.js` with Cache & Overwrite (5-min TTL).
- Services: `todoService.processWalletWithdrawal` (approvals) and `creditCoreService.adjustUserWallet` (adjustments).
</flow_and_entry>

<core_schema>
- `users/{uid}`: { walletBalance: number (>=0), pendingWithdrawal: number (>=0), customerCode: string, phone: string }
- `users/{uid}/wallet_transactions/{txId}`: { transactionId: string, type: string, amount: number, status: string, note: string, refId: string, timestamp: serverTimestamp }
- `todos/{taskId}`: { taskType: 'WALLET_WITHDRAWAL', status: 'PENDING'|'completed'|'rejected', withdrawalDetails: { amount: number, bankName: string, accountNumber: string, accountName: string } }
- `system_logs`: { actionType: 'WALLET_WITHDRAWAL_APPROVED'|'WALLET_WITHDRAWAL_REJECTED', taskId: string, createdBy: string }
</core_schema>

<business_rules>
- Absolute Deployment Ban: Zero deployment to production/hosting. All changes remain strictly on localhost:3168.
- Financial Idempotency: All wallet balance adjustments MUST pass a unique UUID `refId` to eliminate duplicate balance mutations.
- Atomic Transactions: Withdrawal approval/rejection must be wrapped in `runTransaction` with `pendingWithdrawal` decrement and balance restoration guards.
- Read-Only Safeguard: Production Firestore collections are inspected in read-only mode during local development.
</business_rules>

<cross_impact>
- QuickAccessTools (`case 'refund'` / `AVAILABLE_MENUS.refund`): Navigates directly to this view from `/managers`.
- Orders & POS Checkout: Uses customer `walletBalance` during payment deductions.
- Claims & Returns: Refunds from returned/defective products replenish `walletBalance`.
</cross_impact>

<pitfalls_and_lessons>
- ⚠️ Specific Ad-hoc Cloning Context: Local machine files lagged behind production; ad-hoc cloning restored parity to allow localhost:3168 to run with real Firestore data.
- ⚠️ Agnostic Grimoire Rule: Grimoires must document core architectural truth and domain models without coupling instructions to hosting, preventing future confusion when hosting needs updates.
- ⚠️ Watchlist Resolved (Firestore Cost & Duplication): Consolidated dual queries to single query and added 5-minute Memory Cache & Overwrite in `useWalletManagement.js`, reducing repeat reads to 0. Deduplicated `WalletManagement.jsx` via clean re-export.
</pitfalls_and_lessons>
</grimoire>
