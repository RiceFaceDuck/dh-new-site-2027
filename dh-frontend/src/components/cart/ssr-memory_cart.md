# SSR Local Grimoire — Storefront Cart & Purchase Order (`/cart`)

<usage_workflow>
1. ลูกค้าเลือกสินค้าจากหน้า Storefront / Catalog / Product Detail และกด "หยิบใส่ตะกร้า"
2. ระบบบันทึกรายการลง localStorage (`dh_cart` สำหรับ Guest) และซิงค์ลง Firestore `carts/{uid}` (สำหรับสมาชิกที่ Login) แบบ Debounce 500ms
3. เข้าสู่หน้า Purchase Order (`/cart`):
   - ตรวจสอบความถูกต้องของสินค้าและสต็อกคงเหลือ (Stock Validation against Global & Item Buffer)
   - คำนวณยอดรวมสินค้า (Subtotal), ตรวจสอบโปรโมชันอัตโนมัติ (Active Promotions) และสิทธิ์ของแถม (Freebie Progress)
   - คำนวณแต้มสะสมที่จะได้รับ (Loyalty Points Preview)
4. ลูกค้ากดปุ่ม "ดำเนินการสั่งซื้อ" -> ระบบ Re-validate สต็อกและราคาแบบ Real-time อีกรอบก่อนนำทางไปหน้า `/checkout`
</usage_workflow>

<domain_rules>
- **Variant Integrity:** สินค้าที่มีตัวเลือก (Variant Products) ต้องนำ `parentId` ไปค้นหา Document แม่ใน Firestore เสมอ และต้องแตก `p.variants` เพื่อตรวจสอบสต็อกของ SKU ตัวลูกอย่างแม่นยำ
- **Buffer Stock Rule:** ใช้ `resolveEffectiveBuffer(itemBuffer, globalBuffer)` ในการกันสต็อกเสมอ สินค้าขายได้เมื่อ `stockQuantity - buffer >= currentQty`
- **Zero Broken Links:** ห้ามมี Dead Placeholder URLs (`@your_line_id`, `your_page_name`) ในหน้าสรุปยอดเด็ดขาด ต้องใช้ Official Contact Channels ของร้านเสมอ
- **Client Security Guard:** ลูกค้าทั่วไป (Guest/User) ห้ามยิง API เขียน `system_logs` ตรงโดยไม่มี `category: 'client_warning'` และ `module: 'Marketing'` เพื่อป้องกัน `permission-denied` จาก Firestore Rules
- **Deployment Lockdown:** ห้าม Deploy ขึ้น Cloud / Hosting / Rules โดยเด็ดขาด การทำงานทั้งหมดจำกัดเฉพาะ Local Environment เท่านั้น
</domain_rules>

<core_schema>
- **Entry Points:** 
  - Page: `dh-frontend/src/pages/Cart.jsx` (Route: `/cart`)
  - Hook: `dh-frontend/src/hooks/useCartLogic.js`
  - Context: `dh-frontend/src/context/CartProvider.jsx` & `CartContext.jsx`
  - Service: `dh-frontend/src/firebase/cartService.js`
- **Storage Keys:**
  - `localStorage['dh_cart']`: Array of `{ id, sku, parentId, variantAttributes, name, price, salePrice, image, qty }`
  - `localStorage['dh_checkout_state_{uid}']`: Object of `{ appliedPromotions, qualifiedFreebies, discountAmount, useWallet, ... }`
  - Firestore `carts/{uid}`: `{ uid, items, total, totalQty, updatedAt }`
  - Firestore `freebies/{freebieId}` & `promotions/{promoId}`
</core_schema>

<third_party>
- **LINE Official:** เชื่อมต่อเพื่อนผ่าน `https://line.me/R/ti/p/@dhnotebook`
- **Facebook Messenger:** เชื่อมต่อแชทผ่าน `https://m.me/dhnotebook`
- **Google Analytics (GA4):** ติดตามอีเวนต์โปรโมชัน `view_promotion` ผ่าน `promotionAnalyticsService.js`
</third_party>

<pitfalls_and_solutions>
- ⚠️ **Variant Products Checkout Blocker:**
  - *ปัญหา:* `handleProceedToCheckout` ใน `useCartLogic.js` เดิมไม่ได้รวม `item.parentId` และไม่ได้แปลงแคช `p.variants` ทำให้สินค้าตัวเลือกติดสถานะ "สินค้านี้ไม่มีในระบบแล้ว" และบล็อกการไปหน้าชำระเงิน
  - *วิธีแก้:* รวมศูนย์ logic การทำ Indexing สินค้าและ Variants ไว้ใน `resolveProductCacheFromList` และเรียกใช้ร่วมกันทั้งตอนโหลดและตอนกดปุ่มสั่งซื้อ
- ⚠️ **Dead Contact Links on Out of Stock:**
  - *ปัญหา:* เมื่อสินค้าติดปัญหาในตะกร้า ปุ่มสั่งซื้อสลับเป็นปุ่ม LINE/Messenger ที่มีลิงก์ตาย `@your_line_id`
  - *วิธีแก้:* เปลี่ยนไปใช้ลิงก์ทางการของร้าน `@dhnotebook`
- ⚠️ **Cart Service Schema Drift:**
  - *ปัญหา:* `cartService.js` เดิมตกหล่นฟิลด์ `parentId`, `variantAttributes`, `salePrice` และคิดผลรวมราคาจาก `price` แทน `effectivePrice` ทำให้ข้อมูลโปรโมชันและตัวเลือกหายเมื่อเซฟผ่าน service
  - *วิธีแก้:* ซิงค์โครงสร้าง item ใน `addToCart` และ `mergeGuestCart` ให้ตรงกับ `CartProvider` และใช้ `effectivePrice` เสมอ
- ⚠️ **Promotion Rounding Precision Mismatch:**
  - *ปัญหา:* `usePromotions.js` ใช้ `Math.floor` ในขณะที่ `dh-shared/priceEngine.js` ใช้ `Math.round(val * 100) / 100` ทำให้เกิดเศษสตางค์ไม่ตรงกันระหว่างหน้า Cart กับระบบ Checkout Transaction
  - *วิธีแก้:* ปรับ `usePromotions.js` ให้ใช้ `Math.round(discount * 100) / 100` สอดคล้องกันทั้งระบบ
- ⚠️ **Duplicate Freebies Collection Reads:**
  - *ปัญหา:* `useCartLogic.js` ยิง `getDocs` ดึงคอลเลกชัน `freebies` ซ้ำซ้อนกับ `onSnapshot` ใน `usePromotions.js` ทำให้เปลืองโควต้าอ่าน 2 เท่าทุกครั้งที่เปิดหน้า Cart
  - *วิธีแก้:* ตัด query ซ้ำซ้อนออกจาก `useCartLogic.js` ให้ `CartFreebieProgress.jsx` รับข้อมูลผ่าน `usePromotions()` โดยตรง พร้อมเพิ่ม Cache Guard ป้องกันการ fetch รายละเอียดสินค้าของแถมซ้ำ
- ⚠️ **Guest Checkout Unauthenticated Bypass & Silent Route Bounce:**
  - *ปัญหา:* ผู้ใช้ทั่วไปที่ยังไม่ได้ล็อกอินเมื่อกด "ดำเนินการสั่งซื้อ" ถูก navigate เข้า `/checkout` โดยตรงแล้วดีดไปหน้า `/profile` โดยไม่มีแจ้งเตือน หรือไม่มีการพากลับมาหน้าเดิมหลังล็อกอินเสร็จ
- ⚠️ **Freebies Per-Item Calculation Discrepancy on Storefront:**
  - *ปัญหา:* กฎของแถมในระบบรองรับ `distributionMode: 'per_item'` (คูณตามจำนวนชิ้นที่ซื้อ เช่น ซื้อจอ 2 จอ แถม 2 หลอด) แต่หน้าบ้านเดิม (`usePromotions.js`, `CartFreebieProgress.jsx`, `PrivilegeSelector.jsx`, `CheckoutSummaryDetails.jsx`) ดึงค่า `qty` ดิบๆ ซึ่งเป็น 1 ไปแสดงผลตรงๆ ทำให้หน้าเว็บและในออเดอร์โชว์ `x1` ชิ้นตลอด
  - *วิธีแก้:* เพิ่มการคำนวณ `calculatedQty` ใน `evaluateFreebie` โดยคูณ `(qty || 1) * eligibleQty` เมื่อ `distributionMode === 'per_item'` และคุมเพดาน `maxPerBill` พร้อมส่ง `calculatedQty` ให้คอมโพเนนต์หน้า Cart, Checkout และ `checkoutSubmitService.js` บันทึกตามจำนวนจริง
</pitfalls_and_solutions>

