# 📜 SSR Local Grimoire — Billing Dashboard & POS System

<grimoire>
  <flow_and_entry>
    1. Entry Points: `BillingMain.jsx` (Dashboard & Orders Table) and `PosSystem.jsx` / `PosHeader.jsx` (Cashier Checkout).
    2. Data Flow: Hydrates catalog locally (`idb-keyval` -> `catalogs/search_index`) -> Cashier scans barcode with `findExactCatalogMatch` -> Multi-tab cart in `usePosState.js`.
    3. Checkout Lifecycle: `billingTransactionService.js` atomically allocates sequence (`DH-26-xxxx`), deducts stock, deducts wallet, updates `catalogs/recent_orders`, and writes `orders/{orderId}`.
  </flow_and_entry>

  <core_schema>
    1. Order (`orders/{orderId}`): `orderId` ('DH-YY-XXXX'), `orderStatus` ('draft'|'paid'|'completed'|'void'), `paymentMethod` ('Cash'|'Transfer'|'Credit'), `netTotal`, `customer` ({ id, name, phone, taxId }), `items` (Array<{ sku, name, price, qty, discount }>), bank slip fields (`transactionRef`, `slipUrl`, `slipStoragePath`).
    2. Receipt Counter (`counters/receipt_sequence_global`): `currentNumber`, `prefix` ('DH'), `year` (26).
    3. Loyalty Config (`settings/credit_config`): `pointsEarningRate`, `skuBonusRules`, `tiers`.
    4. Smart Customer 2-Step Schema: `parseCustomerAddress` (`dh-shared`), `QuickAddCustomerModal`, and `CustomerDuplicateComparisonModal` (`checkPotentialDuplicates`).
    5. Legal In-App Schema: `VatInfoModal` (Sec 86/4, 79(1), P.86) and `ShippingInfoModal` (P.120, Sec 77/2, 82/3).
  </core_schema>

  <business_rules>
    1. Domain Separation: เคลม (CLM - ส่งซ่อม/เปลี่ยนตัวเดิม ห้ามเปิดบิลขายใหม่), เปลี่ยน (EXC - สลับข้าม SKU ตัดสต็อกในใบเดียว ห้ามสร้างบิลขาย POS ซ้ำซ้อน), คืน (RTN - คืนเงินเข้า Wallet ไม่จ่ายของใหม่). ห้ามเหมารวมเป็น "เคลมเปลี่ยน".
    2. Absolute Deployment Ban: All operations strictly local; zero auto-deploy to hosting, functions, or rules.
    3. Satang Precision Arithmetic: Financial totals and VAT round to 2 decimal places (`Math.round(x * 100) / 100`).
    4. Stock Allocation & Draft Bypass: Split-line SKU demand is aggregated; if demand > stock, 'Paid' checkout is blocked. 'Draft' checkout explicitly bypasses stock block for quotes.
    5. Centralized Test Hub: All verification scripts strictly live under `Management System/tests/`.
  </business_rules>

  <cross_impact>
    1. Inventory Module: Atomic stock decrements on checkout touch `products` collection directly.
    2. Customer Wallet & Points: Wallet balance deductions and credit accrual update `customers/{id}` ledger.
    3. Cloud Functions: No background triggers on orders in functions/index.js (receipt PDFs handled via client-side iframe print).
    4. Recent Orders Catalog: Updates `catalogs/recent_orders` to keep dashboard warm (0 reads).
    5. Shared Utils: `dh-shared/src/utils/thaiAddressParser.js` consumed across backoffice and customer management.
  </cross_impact>

  <pitfalls_and_lessons>
    1. ⚠️ Cold-Start Catalog Hydration: `products` prop must fallback to `[]` when `posState.products` hydrates to prevent TypeError on `.find()`.
    2. ⚠️ Unbounded Customer Scanning: Do not call `useCustomerData()` at `BillingMain.jsx` root; keep isolated in `PosViewWrapper` to prevent read storm.
    3. ⚠️ Server Parity on Shipping VAT: POS UI (`usePosPayment.js`) and backend (`billingTransactionService.js`) must align `vatOnShipping` logic using `Boolean(...)` defaulting to false to avoid price discrepancy rejections.
    4. ⚠️ High Read on Direct Query: Querying `collection('orders')` causes 50 reads; always use `orderCacheService` (`catalogs/recent_orders`) for 0-read warm dashboard.
    5. ⚠️ Zebra Striping & Virtual Scrolling: Do not rely on `even:bg-black/5` on light surfaces (imperceptible 0.4% delta). Calculate parity via `data-item-index` for stable `bg-white` vs `bg-[#F4F6F9]` enterprise contrast.
    6. ⚠️ Address Regex Parsing: When cleaning address labels, match both newline and inline prefixes `(?:\s+|^|\n)(?:ที่อยู่|ที่อยู่จัดส่ง)\s*:?` to avoid mangling customer names when addresses are pasted on single line.
    7. ⚠️ Navigation & Global Event Handlers: Handle `dh_open_new_bill` and `dh_resume_draft` CustomEvents in `BillingMain.jsx` and guard tab creation with `isNewBillHandledRef` to prevent tab duplication loops.
    8. ⚠️ Signature Asymmetrical UI Corners: POS Settings panel uses DH signature tech-tab aesthetic where corners are exclusively rounded on top-right (`rounded-none rounded-tr-md` or `rounded-tr-xl`) while other 3 corners remain sharp square. Do not replace with symmetric `rounded-md`/`rounded-lg`.
    9. ⚠️ Split-Line SKU Aggregation: In `billingTransactionService.js` and `billingStatusTransaction.js`, cart lines must be aggregated by SKU via `Map<sku, totalQty>` before querying and updating `products`. Otherwise, multiple lines of the same SKU trigger duplicate Firestore writes that overwrite previous deductions and corrupt inventory.
    10. ⚠️ Deduplicated Catalog Sync: `orderSyncService.js` protects Firestore read quota using `inFlightSyncPromise` and a 600ms throttle window, preventing concurrent checkout hooks from triggering duplicate 50-read queries.
    11. ⚠️ Deep Search Quota Fallback: Direct searches in `billingQueryService.js` must query in-memory `readCachedOrders()` first (0 reads) before hitting Firestore, and cap direct fallback query limit to 50 (instead of 300) to protect read quotas.
    12. ⚠️ On-Demand Order History: `OrderDetailModal.jsx` loads order timeline on-demand in `OrderHistoryTab.jsx` combining synthesized intrinsic lifecycle events and Firestore `history_logs`, avoiding redundant full-collection listeners.
    13. ⚠️ A5 Receipt Print Parity: `ReceiptTemplate.jsx` must adhere strictly to production layout: 8-row financial breakdown with VAT breakdown, fixed 68px SKU column in `ReceiptItems.jsx`, strikethrough original prices, proportional multi-page pagination (8 items/page), bank account mapping (`bankConstants.js`), and tax invoice/courier badges in `ReceiptHeader.jsx`.
    14. ⚠️ Order Detail Parity & Audit Trail Guard: `OrderDetailModal.jsx` formats date using `{ dateStyle: 'short', timeStyle: 'short' }` to render full `DD/M/YY HH:mm` without `.split(' ')`. `OrderSummaryTotals.jsx` requires Order Value row and dynamic `minimumFractionDigits` satang formatting. Order deletion is strictly restricted to `canDeleteOrder` on `draft`/`pending` orders; `cancelled` orders are immutable to preserve audited transactions.
    15. ⚠️ Modal Backdrop & Sidebar POS Triggers: Modal wrappers (`OrderDetailModal.jsx`, `ReceiptTemplate.jsx`) require `onClick` handler on backdrop and `e.stopPropagation()` on content bodies to allow backdrop dismissal without bubbling. Sidebar navigation item for `/billing` embeds a direct `(+)` button dispatching `dh_open_new_bill` and routing `{ state: { newBill: true } }`.
  </pitfalls_and_lessons>
</grimoire>
