# üö® SYSTEM CAUTIONS (Critical Risk Log)

This document is used to log **Critical Risks (CAUTION!)** or **Breaking Changes** detected by the AI Agent. It serves as a warning for Agents and developers to exercise extreme caution in the future.

## üìÖ [2026-07-24] Firestore Queries Inside Transactions & Orphaned Data Risk
**Related Systems:** `dh-backoffice-react` (`billingStatusTransaction.js`, `billingDeleteService.js`)
**Severity:** üî¥ Critical (Data Orphaned & Locking Bug)

**Details:**
- **Firestore v9 Client SDK DOES NOT support running queries (`getDocs(query)`) inside a `runTransaction` block.** 
- Doing so will either throw an error or break the atomic lock mechanism.
- If a transaction requires modifying documents based on a query (e.g. deleting orphaned To-dos related to a cancelled bill), you MUST execute the `getDocs(query)` **BEFORE** entering the `runTransaction` block to collect the `doc.ref`s, and then iterate through them inside the transaction to perform `transaction.update(ref)` or `transaction.delete(ref)`.

---

## üìÖ [2026-07-24] Defect Stock Reversion on Claim Rejection
**Related Systems:** `dh-backoffice-react` (`claimActionService.js`, `returnActionService.js`)
**Severity:** üü° Caution (Defect Stock Leak)

**Details:**
- When processing Claims, if the item has already arrived (`markArrived`) the `defectQuantity` is incremented. If a manager subsequently **rejects** the claim (`rejectRequest`), the `defectQuantity` MUST be rolled back (`increment(-qty)`).
- When fully returning an item and refunding to Wallet (`returnActionService`), ALWAYS claw back `creditPoints` proportionally (`Math.floor(refundAmount / 100)`) within the same transaction to prevent point accumulation loopholes.

---

## üìÖ [2026-07-24] TableVirtuoso Header/Body Misalignment with Paginated Tables
**Related Systems:** `dh-backoffice-react` (`ClaimTable.jsx`, `ClaimTableRow.jsx`)
**Severity:** üü° Caution (UI/UX Layout Misalignment)

**Details:**
- When pagination is enabled (e.g. 21 items per page), avoid using `TableVirtuoso` which renders two separate `<table>` DOM elements for header and body. Independent layout calculation in two separate `<table>` tags can cause horizontal misalignment between header `<th>` and body `<td>` cells.
- Standard single `<table>` elements with `thead` and `tbody` guarantee 100% pixel-perfect column alignment across all screen sizes.

---

## üìÖ [2026-07-23] 30D Paid Out Base Reset & Paid-Only Filter
**Related Systems:** `dh-backoffice-react` (`customerOrderStatsService.js`, `useCustomerData.js`)
**Severity:** üü° Caution (Financial Data Presentation Discrepancy)

**Details:**
- Batch order statistics queries for customer list must initialize `sales30Days` to `0` during calculation to avoid adding 30-day order totals on top of legacy `totalSales` or lifetime purchase amounts stored on `user` documents.
- Only orders with valid paid/completed statuses (`isPaid === true` or status `paid`, `completed`, `success`, `approved`, `delivered`, `shipped`) must be counted towards 30D Paid Out.

---

## üìÖ [2026-07-23] Document-First Transaction Logging & Strict Firestore Query Gating
**Related Systems:** `dh-backoffice-react` (`GenerateSyncDetails.jsx`, `useTransactionDetailsData.js`, `billingQueryService.js`)
**Severity:** üî¥ Critical (Data Integrity, Performance & Zero-Flicker Architecture)

**Details:**
- Stock movement and transaction logs must NOT attempt to synthesize artificial fallback IDs (such as `BILL-20260722-001`) from raw stock diffs.
- Transaction queries MUST enforce **Strict Firestore Query Gating**: query constraints (`where('createdAt', '>=', queryStartDate)`) MUST be applied at the Firestore query level to prevent fetching ungated historical datasets (e.g. 50-100 old bills) into browser memory.
- UI components MUST implement a **Readiness Guard (`isInitialReady`)** to block rendering until the query gate and snapshot baseline are fully established, guaranteeing ZERO data leaks and ZERO visual flickering on initial mount or hard reloads (`Ctrl+Shift+R`).

---

## üìÖ [2026-07-23] Pause Wallet Withdrawal Logic from Todo Center
**Related Systems:** `dh-backoffice-react` (`todoWalletService.js`, `managerTodoService.js`)
**Severity:** üü° Caution (Business Workflow Policy Change)

**Policy & Instruction:**
- Paused/Shelved `WALLET_WITHDRAWAL` handling from the Todo Center until explicit user instruction is given when a supporting system is ready.
- All wallet refund transactions must be performed directly at the Customer Detail Drawer / Wallet Management pages instead of generating or processing tasks in the Todo Center.

---

## üìÖ [2026-07-22] Warehouse Buffer Synchronization Discrepancy
**Related Systems:** `dh-frontend`, `dh-backoffice-react`, `dh-staff-app`
**Severity:** üî¥ Critical (Overselling Risk)

**Details:**
- A major bug was found where the Frontend Checkout ignored the `settings/inventory` Global Buffer if a product lacked an override value. This allowed customers to bypass the buffer and drain stock to 0. 
- The Frontend product catalog was also hardcoding buffer logic, causing UI inconsistencies.
- POS systems in the backoffice should be allowed to bypass stock limits (Oversell Bypass) because physical stock presence overrides system counts.

**Resolution Policy:**
- ALWAYS fetch `settings/inventory` within transactions that involve stock deductions if the logic requires checking global thresholds.
- DO NOT hardcode buffer values in the Frontend. Fetch and cache them from the settings collection.

---

## üìÖ [2026-07-09] POS Server-Side Price Calculation Bug (Price Override) & ISSUES.md Reference
**Related Systems:** `dh-backoffice-react`, `usePosActions.js`, `billingTransactionService.js`
**Severity:** üî¥ Critical (Financial transaction discrepancy)

**Details:**
- A bug was discovered where Server-side Validation in `billingTransactionService.js` always enforced `retailPrice`. This caused B2B wholesale prices calculated on the POS screen to be overwritten with retail prices when saved to Firestore.
- This and other issues found during POS testing have been logged separately in [ISSUES.md](file:///c:/DH%20Notebook/Management%20System/ISSUES.md) at the root folder for future reference and resolution.

---

## üìÖ [2026-07-06] Major Dependency Upgrade Caution
**Related Systems:** `dh-backoffice-react`, `dh-frontend`, `dh-staff-app`
**Severity:** üî¥ Critical (Breaking Changes)

**Details:**
Running the command `npm audit fix --force` to resolve security vulnerabilities forces major version upgrades across the board:
- `react` and `react-dom` from version 18 ‚û°Ô∏è 19
- `firebase` from version 10 ‚û°Ô∏è 12
- `vite` from version 5/6 ‚û°Ô∏è 8

**Impact if violated:**
- Authentication and Firestore (especially the Compat Layer) will likely break and fail to run.
- Vite configurations might need to be completely rebuilt.
- High risk of Custom Hooks relying on React 18 behaviors failing unexpectedly.

**Resolution Policy:**
Do NOT use the `--force` flag for updates. Use targeted Patch/Minor updates to patch vulnerabilities (which has already been done) until the development team has time to perform dedicated QA on a separate Branch to properly support these new major versions.

---

## üìÖ [2026-07-22] POS Auto Promotion State Desync Bug
**Related Systems:** `dh-backoffice-react`, `usePromotionLogic.js`, `usePosPayment.js`, `PromotionSettings.jsx`
**Severity:** üü° High (Promotion & Discount calculation failure)

**Details:**
- Disabling an Auto-Promotion toggle (`autoPromoEnabled = false`) did not clear stored promotion IDs and discounts from active cart tabs, leaving promotions stuck on the bill.
- Dual promotion engines in hooks caused desynchronized values between UI modals and background recalculations.

**Resolution Policy:**
- When toggling off auto-promotion features or removing applied promotions, explicitly clear `appliedPromoId`, `promoDiscount`, and `appliedPromoDetails` in the active cart state.

---

## üìÖ [2026-07-24] SKU Search Indexing in GAS History Outbox Logs
**Related Systems:** `dh-backoffice-react` (`billingTransactionService.js`, `inventoryAdjustmentService.js`, `gasHistoryService.js`)
**Severity:** üü° Caution (Audit Log Searchability Bug)

**Details:**
- When logging transactions (sales, stock changes) into `gas_outbox`, the `legacy_details` text string MUST explicitly embed the product `[SKU]` (e.g. `[LED14009] ‡∏Ç‡∏≤‡∏¢‡∏≠‡∏≠‡∏Å‡∏ö‡∏¥‡∏• DH-26-0013`).
- Searching logs by SKU via Google Apps Script (GAS) text search relies on keyword presence in text fields. Omitting the SKU code from `legacy_details` causes log search queries for that SKU to return empty results.
- Ensure `usePromotionLogic` clears stale promo states when items or totals no longer qualify.

### üî¥ To-Do Collection Mismatch Bug
- **Issue:** Frontend (dh-frontend) was submitting ad requests to central_todos while Backoffice (dh-backoffice-react) listens to 	odos, causing ghost/stuck requests.
- **Rule:** ALL task submissions MUST go to 	odos collection. The central_todos collection is deprecated and should not be written to.

- **ÀÈ“¡‡¥“ ÿË¡∏ÿ√°‘®®“°™◊ËÕ Route/URL (Absolute No-Hallucination):** ÀÈ“¡¡‚π √ÿªø—ß°Ï™—π√–∫∫‡Õß‡¥Á¥¢“¥ ‡™Ëπ ‡ÀÁπ URL /squad ·≈È«¡‚π«Ë“‡ªÁπ 'ÀπÈ“®—¥∑’¡™Ë“ß' ∑—Èß∑’Ë‚§È¥®√‘ß§◊Õ¡‘π‘‡°¡øÿµ∫Õ≈ µÈÕßµ√«® Õ∫ÀπÈ“µ“·≈–‚§È¥®√‘ß°ËÕπÕ∏‘∫“¬≈Ÿ°§È“‡ ¡Õ
