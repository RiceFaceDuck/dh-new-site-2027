# SSR Local Grimoire: Shipping Management & Rules Engine
<!-- 
  SSR Memory Bank: Shipping Rules System
  Version: 1.0 (Phase 1 Implemented)
  Architectural Boundary: Backoffice Manager Settings -> Shared Shipping Engine -> POS & Storefront Checkout
-->

<usage_workflow>
### 1. ขั้นตอนของผู้ใช้งาน (Usage Workflow)
1. **การตั้งค่าเงื่อนไขโดยแอดมิน/ผู้จัดการ (`/managers/shipping`):**
   - แอดมินเลือกประเภทเงื่อนไข: "ค่าจัดส่งสินค้า" หรือ "ค่าประกันขนส่ง"
   - กำหนดบริษัทขนส่ง (Kerry Express/KEX, J&T, Flash, EMS, SPX, อื่นๆ)
   - เลือกลักษณะการจับคู่ (Match Type): หมวดหมู่สินค้า (Category), รหัสสินค้า (SKU), หรือเงื่อนไขผสม (Combo)
   - ระบุจำนวนชิ้นขั้นต่ำ - สูงสุด และยอดเงินค่าจัดส่งหรือประกันภัย จากนั้นกด "บันทึกเงื่อนไข"
   - แอดมินสามารถเปิด/ปิดการใช้งาน (Toggle Active) หรือลบเงื่อนไข (Soft Delete) จากตารางด้านขวาได้ตลอดเวลา
2. **การนำไปคิดราคาอัตโนมัติในหน้า POS (`/billing`):**
   - เมื่อพนักงานเลือกการรับสินค้าเป็น "พัสดุ (Delivery)" และเปิดโหมด "ระบบคำนวณอัตโนมัติ"
   - ระบบจะประเมินสินค้าในตะกร้าเทียบกับ `shipping_rules` ที่เปิดใช้งานอยู่ และอัปเดตค่าส่ง/บริษัทขนส่ง/ค่าประกันให้อัตโนมัติ
   - หากปิดโหมดอัตโนมัติ พนักงานสามารถกดปุ่มคลิกเลือกค่าส่งหรือค่าประกันที่ระบบแนะนำได้เอง
3. **การประเมินราคาในหน้าหน้าร้าน Checkout (`/checkout`):**
   - หน้าร้านดึงกฎผ่าน `storefrontSettingsService.getActiveShippingRules()` แคชไว้ในหน่วยความจำ 1 ชม.
   - ประเมินค่าจัดส่งและค่าประกันตามตะกร้าสินค้าของผู้ซื้ออัตโนมัติ
</usage_workflow>

<domain_rules>
### 2. กฎของระบบ (Domain Rules & Invariants)
- **Soft Delete Protocol:** การลบเงื่อนไขจะถูกประทับเวลา `deletedAt` และตั้งค่า `isActive: false` ห้ามแสดงในรายการตั้งค่าแอดมินและห้ามนำไปคิดเงิน
- **Session Cache Non-Empty Invariant:** เมื่อระบบมีกฎ 0 รายการ (Array ว่าง `[]`) ฝั่ง Client POS ต้องยอมรับเป็น Valid Cache ห้ามมองข้ามจนเกิด Cache Miss ยิง Query ซ้ำซ้อน
- **Zero Deployment Ban:** ห้าม deploy ขึ้นเซิร์ฟเวอร์จริงเด็ดขาด การแก้ไขโค้ดทั้งหมดต้องบันทึกในเครื่อง (Git Commit) เท่านั้น
- **Audit Log Accountability:** ทุกการสร้าง แก้ไขสถานะ หรือลบเงื่อนไข ต้องบันทึกลงใน `historyService` (คอลเลกชัน `system_logs`) โดยระบุ UID ผู้ดำเนินการเสมอ
</domain_rules>

<core_schema>
### 3. ข้อมูลและตัวเชื่อม (Core Schema)
- **Primary Collection:** `/shipping_rules/{ruleId}`
- **Schema Fields:**
  - `ruleType`: `'shipping'` | `'insurance'`
  - `company`: string (เช่น `'Kerry Express'`, `'Flash Express'`, `'ประกันภัยจัดส่ง'`)
  - `matchType`: `'category'` | `'sku'` | `'combo'` | `'all'`
  - `productType`: string (ชื่อหมวดหมู่ที่บังคับใช้ หรือ `'All'`)
  - `sku`: string (รหัสสินค้าตัวพิมพ์ใหญ่เมื่อเลือก `matchType === 'sku'`)
  - `minQty`: number (ชิ้นต่ำสุด)
  - `maxQty`: number (ชิ้นสูงสุด)
  - `shippingFee`: number (ค่าจัดส่งหรือค่าประกัน หน่วยเป็นบาท)
  - `isActive`: boolean (สถานะเปิด/ปิดการใช้งาน)
  - `conditions`: Array<{ type: 'category' | 'sku', value: string, minQty: number, maxQty: number }> (สำหรับ Combo Rules)
  - `updatedAt`: ServerTimestamp (เวลาอัปเดตล่าสุด)
  - `deletedAt`: ServerTimestamp | undefined (เวลาที่ถูกลบซอฟต์ดีลีท)
- **Entry & Consumer Files:**
  - Manager UI: `dh-backoffice-react/src/pages/managers/settings/shipping/ShippingManagement.jsx`
  - Controller Hook: `dh-backoffice-react/src/pages/managers/settings/shipping/hooks/useShippingManagement.js`
  - Backoffice Service: `dh-backoffice-react/src/firebase/shippingService.js`
  - Shared Engine: `dh-shared/src/shippingEngine.js`
  - POS Consumer: `dh-backoffice-react/src/components/billing/pos/settings/panel/LogisticsSettings.jsx`
  - Storefront Consumer: `dh-frontend/src/pages/Checkout.jsx`
</core_schema>

<third_party>
### 4. การต่อระบบภายนอก (Third-Party Couriers)
- ตัวแทนและขนส่งที่รองรับในระบบ:
  - Kerry Express / KEX
  - Flash Express
  - J&T Express
  - SPX (Shopee Express)
  - ไปรษณีย์ไทย (EMS / ThaiPost)
  - Lalamove / ผู้ขายจัดส่งเอง / อื่นๆ
</third_party>

<pitfalls_and_solutions>
### 5. ปัญหาที่เคยเจอ & เทคนิคการแก้ (Pitfalls & Proven Solutions)
1. **⚠️ บั๊กลบเงื่อนไขแล้วไม่หายจากตารางแอดมิน:**
   - *สาเหตุ:* `deleteShippingRule` ทำงานแบบ Soft Delete (`deletedAt`) แต่ `getShippingRules()` ดึงข้อมูลจาก Firestore โดยไม่ได้กรองเอกสารที่มี `deletedAt` ออก ทำให้แถวข้อมูลยังค้างในตารางตลอดกาล
   - *วิธีแก้:* กรอง `.filter(r => !r.deletedAt)` ทั้งใน `getShippingRules()` และ `getActiveShippingRules()`
   - *สถานะ:* ✅ ส่งมอบแล้วใน Phase 1
2. **⚠️ โควต้าอ่านรั่วไหลใน POS เมื่อระบบไม่มีกฎ (0 Rules):**
   - *สาเหตุ:* `PosSystem.jsx` เคยเช็ค `if (Array.isArray(parsed) && parsed.length > 0)` ทำให้กรณีร้านค้ามี 0 กฎ แคชจะหลุดเงื่อนไขและยิงอ่าน Firestore ซ้ำทุกครั้งที่เมาท์คอมโพเนนต์
   - *วิธีแก้:* เปลี่ยนเงื่อนไขเป็น `if (Array.isArray(parsed))` เพื่อยอมรับอาเรย์ว่าง `[]` เป็น Valid Cache
   - *สถานะ:* ✅ ส่งมอบแล้วใน Phase 1
3. **⚠️ หมวดหมู่สินค้า Hardcoded ไม่สอดคล้องกับคลังสินค้าจริง:**
   - *สาเหตุ:* `ShippingRuleForm.jsx` ตั้งค่าหมวดสินค้าตายตัว 4 รายการ ขณะที่คลังสินค้าจริงของ DH Notebook มีหมวดหมู่อะไหล่ไดนามิกจำนวนมาก
   - *วิธีแก้:* เชื่อมต่อ `categoryService.getAllCategories()` ดึงหมวดหมู่ไดนามิกมาผสานกับหมวดหมู่หลัก พร้อมเพิ่มขนส่ง SPX Express ให้ตรงกับ POS
   - *สถานะ:* ✅ ส่งมอบแล้วใน Phase 2
4. **⚠️ ขาดฟังก์ชันแก้ไขเงื่อนไข (Edit Mode) & การแจ้งเตือน Native Alert:**
   - *สาเหตุ:* แอดมินต้องลบแล้วสร้างใหม่หากพิมพ์ผิด และใช้ Browser Native Alert บล็อกหน้าจอ
   - *วิธีแก้:* เพิ่มฟังก์ชัน `updateShippingRule` ใน Service, เพิ่ม State `editingRuleId`, ไฮไลต์แถวที่กำลังแก้ไขในตาราง, และเปลี่ยนมาใช้ `react-hot-toast` สวยงามตามมาตรฐานระบบ
   - *สถานะ:* ✅ ส่งมอบแล้วใน Phase 2
</pitfalls_and_solutions>
