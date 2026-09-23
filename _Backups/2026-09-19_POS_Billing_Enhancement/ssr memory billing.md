# 📜 SSR Local Grimoire — Billing Dashboard & POS System

<grimoire>
  <workflow>
    1. Billing Dashboard Flow:
       - Displays sales orders fetched via `useBillingOrders` hook from collection `orders`.
       - Header (`OrderFilterBar.jsx`) provides single-row controls: filter pills (ทั้งหมด, ชำระแล้ว, บิลร่าง, ยกเลิก), search input with shortcut '/', date range selector (all, today, yesterday, 7 days, 30 days, custom), refresh button, guide modal trigger, and '+ สร้างบิลใหม่' action.
       - Virtualized table (`OrderListTable.jsx`) renders paginated order rows with page size dropdown (21, 50, 100, 250) and first/prev/page/next/last pagination controls.
       - Order detail modal (`OrderDetailModal.jsx`) supports inspecting order details, receipts, after-sales history, printing, and voiding.
    2. POS (Point of Sale) Billing Flow:
       - Multi-tab management in `PosHeader.jsx`: supports creating, closing, and switching cart tabs. Reuses empty tabs instead of creating redundant blank bills.
       - Cart & Barcode scanning (`SearchArea.jsx`, `CartTable.jsx`): supports F3 barcode scanning, product lookup, line-item quantity/discount adjustments.
       - Summary & Calculations (`BillSummary.jsx`): summarizes item subtotal, discounts, shipping fee with breakdown modal, VAT calculation with explanation modal, wallet deductions, and converts total payable amount to Thai text format `(ศูนย์บาทถ้วน)`.
       - Payment & Checkout (`PaymentMethods.jsx`, `PaymentActions.jsx`): supports Transfer (with bank accounts and slip upload/OCR), Cash (with quick cash presets and change calculation), and On Account (Credit). Submits to Firestore with transactional stock locking.
  </workflow>

  <core_schema>
    1. Order Schema (Collection: `orders`):
       - `orderId`: string (e.g., 'DH-26-0048')
       - `orderStatus` / `status`: 'draft' | 'paid' | 'approved' | 'completed' | 'cancelled' | 'void'
       - `paymentStatus`: 'paid' | 'unpaid' | 'draft' | 'refunded'
       - `paymentMethod`: 'Transfer' | 'Cash' | 'Credit' | 'OnAccount'
       - `fulfillmentType`: 'Delivery' | 'StorePickup'
       - `shippingMethod`: 'standard' | 'pickup' | 'zeer' | string
       - `shippingFee` / `shippingCost`: number
       - `vatType`: 'included' | 'excluded' | 'exempt' | 'none'
       - `vatRate`: number (default: 7)
       - `vatAmount`: number
       - `netTotal`: number
       - `customer`: { id, name, shopName, phone, taxId, address, ... }
       - `items`: Array<{ productId, sku, name, price, qty, discount, ... }>
       - `refundsAndClaims` / `claims` / `returns` / `afterSales`: Array<{ type, qty, ... }>
       - `createdAt`: Timestamp
       - `updatedAt`: Timestamp
    2. Status Badge Representation Matrix:
       - `cancelled` / `void` -> `ยกเลิกแล้ว` (text-rose-600, Ban icon)
       - `draft` -> `ฉบับร่าง (Draft)` (text-purple-700, Clock icon)
       - `completed` -> `ส่งออก 🚚` (text-blue-700)
       - `approved` -> `print แล้ว 🖨️ / หักสต๊อคแล้ว 📤` (text-indigo-700)
       - `isPaid` -> `โอนแล้ว ✅ / หักสต๊อคแล้ว 📤` (text-teal-700)
       - default -> `รอดำเนินการ` (text-amber-700, Clock icon)
    3. After-sales Tags:
       - `📄 ใบกำกับภาษี`: solid purple badge (`bg-purple-600 text-white font-black text-[10px]`)
       - `เคลม {qty}`: orange badge (`bg-orange-500/10 text-orange-600`)
       - `เปลี่ยน {qty}`: blue badge (`bg-blue-500/10 text-blue-600`)
       - `คืน {qty}`: purple badge (`bg-purple-500/10 text-purple-600`)
  </core_schema>

  <rules_and_conditions>
    1. Absolute Deployment Ban: Never auto-deploy or run hosting/functions deployment commands.
    2. Pure UI & Design Parity: Keep UI in lockstep with the production deployed bundle (`BillingMain-BH-MV3Vj.js`). Never drift UI styling without alignment.
    3. Distinction of After-Sales: Keep Claim (CLM), Exchange (EXC), and Return (RTN) strictly differentiated.
    4. Safe Fallbacks: Maintain defensive checks for timestamps (`toDate()`, `seconds`, `number`, or Date strings) and customer name resolution (`getCustomerDisplayName`).
  </rules_and_conditions>

  <techniques>
    1. Single-Row Header Architecture: Header combines title, quick status filters, search input with keyboard shortcut `/`, date dropdown, refresh, guide, and CTA button in a single cohesive flex row.
    2. Thai Baht Text Conversion: Accurate phonetic Thai numbers without UTF-8 / Mojibake corruption (`"ศูนย์บาทถ้วน"`, `"หนึ่ง"`, `"ยี่สิบ"`).
    3. Empty Cart Tab Reuse: When '+ เปิดบิลใหม่' is clicked, verify if an existing empty, unsaved tab exists before pushing a new one to prevent clutter.
    4. POS Settings Panel Architecture: Header `bg-[#283254]` (`ตั้งค่าบิลขาย`), panel body `bg-[#35416C]` with white text labels. Order of sections: Customer -> Logistics (`🏷️ ราคาขาย` `[ ร้านช่าง ] [ ปลีก ]`) -> Promotions (`โปรโมชั่นและของแถม`) -> Discounts (`ลดท้ายบิล & ยอดอื่นๆ`) -> Notes.
    5. Payment Panel Docked Tab: Dark navy docked tab `bg-[#2A305A]` at top-right with gold lock icon (`text-amber-300`) and chevron, outer container `border-t-2 border-[#2A305A]`, right column `bg-[#F8FAFC]`.
    6. Transfer Method Bank Account: `BAY` (`เข้าบัญชี: กรุงศรี (default)`) as default with inline `Landmark` icon.
    7. Typography Standard (Sarabun): Ensure Google Font `Sarabun` is linked in `index.html` and configured as `--font-sans` and `body` font in `index.css` to match production typography.
    8. Order Limit Alignment & Pagination Parity: In `useBillingOrders.js`, default query limit is set to 50 items (`limitAmount = 50`), matching production display `แสดง 1 - 21 จากทั้งหมด 50 รายการ (หน้า 1 / 3)`. Table partitions into 21 items per page.
    9. Customer Directory Lazy Scoping: `useCustomerData()` is scoped inside `PosViewWrapper` in `BillingMain.jsx` so that entering the Order List dashboard triggers 0 customer directory Firestore reads.
    10. Bundled Recent Orders Catalog & (Cache & Overwrite): Implemented single-document aggregated catalog `catalogs/recent_orders` holding top 50 order headers (~15KB, well below 1MB cliff). Client hook `useBillingOrders` checks local session cache first (0ms, 0 reads), subscribes to `catalogs/recent_orders` (1 read), and overwrites cache when version changes. Seamless fallback to direct collection query ensures zero downtime if the bundled document is missing.
  </techniques>

  <lessons_learned>
    1. ⚠️ Mojibake in Currency Formatting: Previously, `convertToThaiBahtText` suffered from encoding degradation resulting in strings like `"เธจเธนเธ™เธขเนŒเธšเธฒเธ—เธ–เน‰เธงเธ™"`. Solved by replacing with clean Thai unicode strings.
    2. ⚠️ Status Column Styling Regression: The local code drifted to capsule pills (`bg-emerald-500/10`) while production utilized bold icon-annotated text (`โอนแล้ว ✅ / หักสต๊อคแล้ว 📤` and `print แล้ว 🖨️ / หักสต๊อคแล้ว 📤`). Restored to production standard.
    3. ⚠️ Hardcoded Pagination Count: Pagination previously hardcoded `21` items per page without user control. Upgraded to support dynamic page sizes (21, 50, 100, 250) and full navigation buttons.
    4. ⚠️ POS Settings Order & Pricing Label Drift: Local had `B2B` instead of `ร้านช่าง`, and had discounts placed before promotions. Restored to match production bundle `BillingMain-BH-MV3Vj.js` and live site.
    5. ⚠️ Mojibake in POS Tab Title & Modals: Corrected `เธšเธดเธฅ` -> `บิล`, `เธฅเธนเธ เธ„เน‰เธฒ` -> `ลูกค้า` in `PosSystem.jsx` (`getTabTitle`), along with all corrupted Thai strings in `QuickAddCustomerModal.jsx` and POS `GuideModal`. Ensured 100% clean UTF-8 Thai text throughout all billing components.
    6. ⚠️ Unbounded Customer Preloading on Order Dashboard: Previously, `useCustomerData()` was invoked at the top-level of `BillingMain.jsx`, downloading all customers even when the user only viewed the order list. Isolated into `PosViewWrapper` to eliminate unnecessary Firestore reads.
    7. ⚠️ Default Order Limit Mismatch: `limitAmount` was previously set to 21, preventing pagination from showing 3 pages (50 items total) as seen on production. Set to 50 with safe timestamp descending sort fallback.
    8. ⚠️ High Read Cost on Billing Direct Query: Querying `collection('orders')` directly with `limit(50)` causes 50 document reads per mount. Solved via `orderCacheService` (Cache & Overwrite on `catalogs/recent_orders`) slashing reads from 50 to 1 (or 0 reads on warm cache).
    9. ⚠️ Cold-Start Catalog Hydration & Undefined activeProducts: When POS is mounted without passing `products` prop and `posState.products` starts as `[]` during cache hydration (0-100ms), evaluating `(posState.products && posState.products.length > 0) ? posState.products : products` returned `undefined`. Scans or Enter key presses during hydration triggered unhandled TypeError on `.find()`. Solved by enforcing empty array fallback `((posState.products && posState.products.length > 0) ? posState.products : products) || []` and reusing `findExactCatalogMatch` which provides robust `Array.isArray` null guards.
  </lessons_learned>
</grimoire>
