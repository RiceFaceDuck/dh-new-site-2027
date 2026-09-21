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
    3. Cloud Functions: Writes to `orders/{orderId}` trigger background notifications and receipt PDF generation.
    4. Recent Orders Catalog: Updates `catalogs/recent_orders` to keep dashboard warm (0 reads).
  </cross_impact>

  <pitfalls_and_lessons>
    1. ⚠️ Cold-Start Catalog Hydration: `products` prop must fallback to `[]` when `posState.products` hydrates to prevent TypeError on `.find()`.
    2. ⚠️ Unbounded Customer Scanning: Do not call `useCustomerData()` at `BillingMain.jsx` root; keep isolated in `PosViewWrapper` to prevent read storm.
    3. ⚠️ Server Parity on Shipping VAT: POS UI (`usePosPayment.js`) and backend (`billingTransactionService.js`) must align `vatOnShipping` logic to avoid price discrepancy rejections.
    4. ⚠️ High Read on Direct Query: Querying `collection('orders')` causes 50 reads; always use `orderCacheService` (`catalogs/recent_orders`) for 0-read warm dashboard.
    5. ⚠️ Zebra Striping & Virtual Scrolling: Do not rely on `even:bg-black/5` on light surfaces (imperceptible 0.4% delta). Calculate parity via `data-item-index` for stable `bg-white` vs `bg-[#F4F6F9]` enterprise contrast.
  </pitfalls_and_lessons>
</grimoire>
