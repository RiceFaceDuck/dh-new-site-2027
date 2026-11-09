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
- 🎯 Ad View vs Click Dual Pricing Rule (Rules & Configs Invariant): หน้า `/managers/credit-dashboard` กำหนดกฎการตัดแต้มโฆษณา 2 มิติชัดเจน:
  1) `AD IMPRESSION COST & RATE`: จำนวนครั้ง (Count) = 100 ครั้ง, แต้มที่หัก (Points) = 15 PT (หักล่วงหน้าเติมโควต้า 100 วิว)
  2) `Ad Click Cost`: แต้มที่หัก ต่อการคลิกเข้าชมโปรไฟล์ 1 ครั้ง = 15 แต้ม (ตัดแต้มเมื่อมีการกดคลิกเข้าชมรายละเอียด)
  *ห้ามเดาหรือถามผู้ใช้ซ้ำเรื่องราคาคลิก เพราะระบบผูกกับการตั้งค่าในหน้านี้ 100%*
- ⚠️ Do NOT create a separate 4-col right rail: Hosting integrates Event Logs and Security tags inside the header banner to preserve 12-col full width for tabs.
- ⚠️ Discrepancy Math: Mistaking `systemPoolMax - totalUserCredits` as discrepancy causes a catastrophic false 9.9M red alarm.
- ⚠️ Realtime Snapshot Leaks: Do not use `onSnapshot` for heavy transaction history; use cached pagination + manual refresh button.
- ⚠️ Smart UID Resolution: Must support 8-char short ID, phone number, and customerCode before querying full UID.
- ⚠️ Currency Symbol (Phase 3): Replaced confusing ฿ prefix with Pts across dashboard cards, tables, and storefront wallet history.
- ⚠️ Multiplexed Listeners (Phase 3): Removed eager top-level listeners in creditFormatService and routed listenToUserCredit through userDocumentSubscriptionManager.
- ⚠️ Safe Remaining Pool (Phase 3): Factored user liabilities into remaining pool calculation and queried creditPoints != 0 to net negative balances.
- ⚠️ Config Unwrapping (Phase 2): Standardized with `unwrapCreditConfig` in `dh-shared` across Backoffice and Frontend consumers.
- ⚠️ Return Reversal & Clawback (Phase 2): `cancelActionService` restores clawed-back loyalty points inside transaction; `clawbackPoints` passes type `'clawback'` to allow safe clamping without throwing.
- ⚠️ Rules Hardening (Phase 2): `credit_transactions` is append-only (immutable); `settings/credit_config` read requires auth and nested `.config` map writes are guarded.
- ⚠️ Ad Settlement Deduction (Phase 1): Deductions must target `users.creditPoints` directly; `heldCreditPoints` is uninitialized.
- ⚠️ 100x Point Inflation Fix (Phase 1): `walletFunctions.js` previously saved unpaid THB cash directly to `pendingCredits`; fixed to convert 100 THB = 1 Pt with `statusWalletHandler` zero-trust guard.
- ⚠️ Ledger Parity (Phase 1): `ga4AdSyncCron` & frontend order awards must sync `settings/credit_config.ledger.totalAllocated` in 1:1 parity with `users.creditPoints`.
- ⚠️ Cursor Pagination (Watchlist): PartnerCredits & CreditHistory use 50-doc batching with Firestore `startAfter(cursor)` and attach `lastDoc`/`hasMore` to preserve array method compatibility while slashing initial reads by 6x and 2x.
- ⚠️ Ad Credit Parity (Phase 4): `adCreditService.js` (`deductPartnerCredit` & `consumeAdCreditWithTransaction`) must sync `settings/credit_config.ledger.totalAllocated` inside transactions; otherwise, ad impressions and clicks desynchronize the master ledger and trigger discrepancy alarms.
- ⚠️ Precision Drift: Always round `newTotalAllocated` and `totalAccumulated` with `Math.round(val * 100) / 100` in creditActionService and adCreditService to prevent IEEE-754 decimal drift on master ledger.
- ⚠️ Return Clawback Accuracy: Calculate return clawback proportionally to order `earnedPoints` or tier multipliers instead of hardcoded 100 THB = 1 Pt.
- ⚠️ GA4 Ad Sync Default Parity: Fallback values in `ga4AdSyncCron` aligned with `creditUtils` standard (0.1 Pt / 1000 views).
- ⚠️ Listener Multiplexing & Unsubscribe: Lifted financial listeners to DetailPanel and unsubscribed Map listeners on dh_auth_logout to eliminate dual-listener leaks.
- ⚠️ Symbol & Decimal Parity: Standardized PT/THB to Pts in CreditAdjustTab/CreditCalculatorTab and enabled maximumFractionDigits: 2 in frontend creditFormatService.
- ⚠️ Schema & Type Validation (Phase 3): Centralized COLLECTIONS.CREDIT_TRANSACTIONS in schemaKeys.js and guarded all write transactions with Zod schema validation (creditSchema.js).
- ⚠️ Partner Ad Auto-Restore & Directory Parity (Self-Healing): ร้านที่เคยแต้มหมดแล้วถูกระงับเป็น OUT_OF_CREDIT และลบออกจาก ActivePartners เมื่อผู้จัดการเติมเครดิตใหม่ผ่าน adjustUserCredit ระบบจะปลดล็อกโฆษณานามบัตรกลับเป็น active, คืนข้อมูลลง ActivePartners และซิงค์แต้มลง catalogs/customers_directory อัตโนมัติ ป้องกันปัญหาแต้มไม่ขึ้นในตารางและโฆษณาหายหน้าบ้าน
- ⚠️ Case-Insensitive UID Prefix & Hyphenated Phone Search (Self-Healing): UID ใน Firestore ขึ้นต้นด้วยตัวพิมพ์เล็กหรือใหญ่ได้ (เช่น iclu...) แต่รหัสแสดงผล 8 ตัวถูกแปลงเป็น uppercase (ICLUEDVL) ทำให้ range query documentId() แบบเคสเดียวหาไม่เจอ ต้องค้นหาทั้ง upper และ lower prefix และสกัดตัวเลขเบอร์โทร (.replace(/\D/g, '')) ก่อนค้นหา phone/phoneNumber เสมอ พร้อม auto-heal accountId/customerCode ลง userDoc เมื่อมีการทำรายการ
- ⚠️ Variable Scope Invariant in Transaction (TDZ Guard): ใน adjustUserCreditWithTransaction ต้องประกาศ const userData = userSnap.data() || {} ไว้บนสุดทันทีหลังตรวจ userSnap.exists() ห้ามเรียกใช้ userData ในบล็อก auto-heal ก่อนบรรทัดประกาศเด็ดขาด ป้องกัน ReferenceError (Cannot access before initialization)
</pitfalls_and_lessons>
</grimoire>
