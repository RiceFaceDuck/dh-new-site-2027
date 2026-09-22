<grimoire>
<flow_and_entry>
- Entry: `CreditDashboard/index.jsx` -> renders integrated top Banner (Event Logs + Security Badges), `LedgerStatsCards.jsx`, and `DashboardTabs.jsx`.
- Data Flow: `useLedgerStats.js` queries `settings/credit_config` + aggregates `users.creditPoints` -> cached in `creditCacheManager` -> updates 4 Stats Cards.
- Tab Routing: 5 Tabs (`partners`: Ledger, `history`: Audit Trail, `adjust`: Operations, `settings`: Rules & Configs, `calculator`: Smart Calculator).
</flow_and_entry>

<core_schema>
- `settings/credit_config`: { ledger: { totalAllocated: number, systemPoolMax: number, status: 'SECURE'|'WARNING'|'BREACHED' }, config: { pointsEarningRate: number, adImpressionCost: number, adImpressionCount: number, adClickCost: number, partnerRankingCost: number, maxTransactionLimit: number, skuBonusRules: string } }
- `settings/knowledge_config`: { compatibleCreditReward: number }
- `users/{uid}`: { creditPoints: number, totalAccumulatedPoints: number, accountId: string, customerCode: string, role: string }
- `credit_transactions/{txId}`: { transactionId: string, uid: string, partnerName: string, type: 'add'|'deduct', amount: number, balanceAfter: number, timestamp: timestamp }
</core_schema>

<business_rules>
- Accounting Discrepancy Rule: `discrepancy = abs(totalAllocated - totalUserCredits)`. If discrepancy == 0, status MUST be green 'ตรงกัน (Match)'. Never subtract from `systemPoolMax`.
- Remaining Pool Rule: `remainingPool = systemPoolMax - totalAllocated` (budget available for minting/rewarding).
- Quota & Zero-Write Rule: System health checks must NEVER write `addDoc` to `system_logs`. Read ping only with in-memory live logs.
- Strict Read-Only Mode: AI must only read Firestore data; no direct DB mutations or deploys permitted.
</business_rules>

<cross_impact>
- Route: `/managers/credit-dashboard` (managed via `AdminLayout.jsx` and `ManagersOverview/index.jsx`).
- Shared Service: `creditCoreService.js` and `creditActionService.js` serve both Backoffice Operations and Frontend Order Points awarding.
- Cache Invalidation: Calling `creditCacheManager.invalidateAll()` on transaction commit clears stale session caches across all tabs.
</cross_impact>

<pitfalls_and_lessons>
- ⚠️ Do NOT create a separate 4-col right rail: Hosting integrates Event Logs and Security tags inside the header banner to preserve 12-col full width for tabs.
- ⚠️ Discrepancy Math: Mistaking `systemPoolMax - totalUserCredits` as discrepancy causes a catastrophic false 9.9M red alarm.
- ⚠️ Realtime Snapshot Leaks: Do not use `onSnapshot` for heavy transaction history; use cached pagination + manual refresh button.
- ⚠️ Smart UID Resolution: Must support 8-char short ID, phone number, and customerCode before querying full UID.
</pitfalls_and_lessons>
</grimoire>
