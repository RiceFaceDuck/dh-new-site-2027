<grimoire>
<flow_and_entry>
- Entry: `pages/managers/RefundManagement.jsx` (Route: `/managers/refund`) & `pages/managers/WalletManagement.jsx` (clean alias re-export).
- Controller: `pages/managers/wallet/hooks/useWalletManagement.js` with Cache & Overwrite (5-min TTL).
- Services: `todoService.processWalletWithdrawal` (approvals) and `creditCoreService.adjustUserWallet` (adjustments).
</flow_and_entry>

<core_schema>
- `users/{uid}`: { walletBalance: number (>=0), pendingWithdrawal: number (>=0), lastWalletTxId: string, customerCode: string, phone: string }
- `users/{uid}/wallet_transactions/{txId}`: { transactionId: string, type: string, amount: number, balanceAfter: number, status: string, note: string, refId?: string, timestamp: serverTimestamp }
- `todos/{taskId}`: { taskType: 'WALLET_WITHDRAWAL', status: 'PENDING'|'completed'|'rejected', withdrawalDetails: { amount: number, bankName: string, accountNumber: string, accountName: string } }
- `system_logs`: { actionType: 'WALLET_WITHDRAWAL_APPROVED'|'WALLET_WITHDRAWAL_REJECTED', taskId: string, createdBy: string }
</core_schema>

<business_rules>
- Absolute Deployment Ban: Zero deployment to production/hosting. All changes remain strictly on localhost:3168.
- Financial Idempotency: All wallet balance adjustments MUST pass a unique UUID `refId` to eliminate duplicate balance mutations.
- Atomic Transactions: Withdrawal approval/rejection must be wrapped in `runTransaction` with `pendingWithdrawal` decrement and balance restoration guards.
- Read-Only Safeguard: Production Firestore collections are inspected in read-only mode during local development.
- Rule Schema Strictness: Client `SPEND` in `wallet_transactions` strictly requires `balanceAfter` and deterministic doc ID matching `transactionId`.
</business_rules>

<cross_impact>
- QuickAccessTools (`case 'refund'` / `AVAILABLE_MENUS.refund`): Navigates directly to this view from `/managers`.
- Orders & POS Checkout: Uses customer `walletBalance` during payment deductions.
- Claims & Returns: Refunds from returned/defective products replenish `walletBalance`.
- Storefront Checkout (`dh-frontend`): Client wallet deduction must strictly comply with firestore.rules.
</cross_impact>

<pitfalls_and_lessons>
- ⚠️ Storefront Wallet Security Rules Bug: Client checkout previously used random doc ID and omitted `balanceAfter`, causing permission-denied; fixed by aligning doc ID with `TXW-${orderId}` and recording `balanceAfter`.
- ⚠️ Drawer Refund vs Todos Sync: `CustomerRefundModal` (`customerRefundService.js`) clears `pendingWithdrawal` on user doc but requires syncing status to `todos` to avoid stuck tasks.
- ⚠️ Watchlist Resolved (Firestore Cost & Aggregation): In `useWalletManagement.js`, replaced `limit(100)` looping with `getAggregateFromServer` (1 read for exact system-wide total & count) and `limit(20)` for initial user list, matching `TotalLiabilityDashboard` and saving 79 reads per cold load. Deduplicated `WalletManagement.jsx` via clean re-export.
</pitfalls_and_lessons>
</grimoire>
