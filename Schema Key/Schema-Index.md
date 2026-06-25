# Firebase Schema & Keys

ยินดีต้อนรับสู่คู่มือโครงสร้างฐานข้อมูล (Database Schema) ของ DH Notebook ระบบได้ถูกแบ่งย่อยออกเป็น 3 ระดับตาม **ความสำคัญ (Tiers)** เพื่อลดความเสี่ยงในการแก้ไข และเพื่อให้ AI สามารถนำ TypeScript Interfaces ไปใช้งานได้ง่ายขึ้น

## การแบ่งระดับ Tiers
กรุณาเลือกอ่านหรืออ้างอิงไฟล์ตามระดับของข้อมูลที่ต้องการทำงานด้วย:

### 🔴 [Tier 1: Critical Schemas (ระดับร้ายแรงสูงสุด)](./Schema-Tier1-Critical.md)
**กลุ่มข้อมูล:** ระบบการเงิน, ธุรกรรม, และความปลอดภัย
* `orders` (บิลทั้งหมด, รายได้, ส่วนลด)
* `credit_transactions` (กระเป๋าเงิน, ประวัติการใช้เครดิต)
* `counters` (ลำดับเลขที่ใบเสร็จ)
* `users` (ข้อมูลผู้ใช้งาน, การกำหนดสิทธิ์)

### 🟡 [Tier 2: Operational Schemas (ระดับสำคัญต่อการทำงาน)](./Schema-Tier2-Operational.md)
**กลุ่มข้อมูล:** ระบบจัดการหลังบ้าน, คลังสินค้า, และการอนุมัติ
* `products` (ข้อมูลสินค้า, สต็อก)
* `todos` (ระบบ Request/Approval ของ Manager)
* `partners` (ข้อมูลช่าง, บริการ, พิกัดร้าน)
* `history_logs` / `system_logs` (ระบบ Audit Trail)

### 🟢 [Tier 3: Configuration & UI Schemas (ระดับตั้งค่าและการแสดงผล)](./Schema-Tier3-Config.md)
**กลุ่มข้อมูล:** ระบบการตลาด, UI Storefront, และ Settings ต่างๆ
* `promotions` & `freebies` (ส่วนลด, ของแถม)
* `homepage_categories` (หมวดหมู่หน้าแรก)
* `settings/*` (ตั้งค่า UI, Footer, Cookie, ฯลฯ)

---

> [!TIP]
> แต่ละไฟล์จะมี **TypeScript Interfaces** แนบไว้ใต้ตาราง Schema หากคุณเป็น Developer หรือ AI ที่ต้องเขียนโค้ด React สามารถคัดลอก Type เหล่านี้ไปใช้งานได้ทันทีเพื่อป้องกันข้อผิดพลาดจาก Typo
