# SSR Memory: Staff Management & Access Control System

## 1. <usage_workflow>
1. ผู้จัดการหรือแอดมินเข้าสู่ระบบหลังบ้าน เข้าเมนู **"ผู้จัดการ (Managers)"** ➔ **"จัดการพนักงาน (Staff Management)"** (`/managers/staff`)
2. ระบบจะโหลดรายชื่อพนักงานทั้งหมดจาก Firestore (`users` collection) ที่มี `isStaff: true` หรือมี role อยู่ในกลุ่มพนักงาน
3. ผู้จัดการสามารถ:
   - ตรวจดูรายละเอียดพนักงาน และสถิติ KPI
   - แก้ไขข้อมูลส่วนตัว เช่น ตำแหน่ง, ชื่อ-นามสกุล, เบอร์โทร
   - ระงับการใช้งานชั่วคราว (Suspend / Deactivate) หรือ ปลดแบนคืนสิทธิ์ (Restore)
   - ปลดพนักงานออกจากระบบ (Delete Staff / Revoke Staff Access)
4. เมื่อกดยืนยันการลบพนักงาน:
   - ระบบจะดำเนินการ Soft Delete และปลดสิทธิ์หลังบ้าน (`isStaff: false`, `isActive: false`, `role: 'customer'`, `status: 'deleted'`)
   - ตารางงานและหน้าที่รับผิดชอบ (Todos / Assigned tasks / Ads) จะถูก Cascade Deactivation อย่างปลอดภัย
   - รายชื่อจะหายไปจากตารางทันที โดยประวัติการขาย (บิล / ใบเคลม) ในอดีตยังคงสมบูรณ์ ไม่กระทบย้อนหลัง

## 2. <domain_rules>
- **เจ้าของระบบ (SUPER_ADMINS) ได้รับการคุ้มครองถาวร:** ห้ามลบหรือเปลี่ยนตำแหน่งเจ้าของระบบเด็ดขาด (ป้องกัน System Lockout)
- **แยกขอบเขตพนักงาน vs ลูกค้า (Domain Boundary Separation):**
  - กฎ Orphan Data Prevention (ห้ามลบรายชื่อที่มีแต้มหรือเงินค้างในกระเป๋า) มีไว้สำหรับ **"ลูกค้าทั่วไป"** เพื่อป้องกันความสูญหายทางบัญชี
  - สำหรับ **"พนักงานหลังบ้าน"** การลบคือการ **"เพิกถอนสิทธิ์การเข้าถึงหลังบ้าน (Revoke Staff Access)"** ต้องสามารถปลดพนักงานได้แม้ว่าบัญชีนั้นจะมีแต้มเริ่มต้นหรือเครดิตส่วนตัว โดยระบบจะลดระดับ (Demote) เป็นลูกค้าระดับ Customer
- **ห้าม Hard Delete เด็ดขาด:** การลบพนักงานต้องเป็น Soft Delete เสมอ เพื่อรักษาความถูกต้องของประวัติบิล ประวัติงาน และการตรวจสอบย้อนหลัง (Audit Log)

## 3. <core_schema>
- **Collection หลัก:** `users`
- **Entry Files:**
  - UI: `Management System/dh-backoffice-react/src/pages/managers/StaffManagement.jsx`
  - Controller Hook: `Management System/dh-backoffice-react/src/pages/managers/hooks/useStaffManagement.js`
  - Domain Services:
    - `Management System/dh-backoffice-react/src/firebase/userStaffService.js`
    - `Management System/dh-backoffice-react/src/firebase/userManagementService.js`
- **คีย์สำคัญสำหรับพนักงาน:**
  - `isStaff`: `boolean` (ต้องเป็น true ถึงจะมีสิทธิ์เข้าถึงระบบหลังบ้าน)
  - `role`: `'admin' | 'manager' | 'staff' | 'packer' | 'developer' | 'finance'`
  - `isActive`: `boolean` (สถานะเปิดใช้งาน หรือถูกระงับ)
  - `status`: `'active' | 'suspended' | 'deleted'`
  - `metadata.staffRevokedAt`: Timestamp วันที่ถูกปลดสิทธิ์
  - `metadata.staffRevokedBy`: UID ของแอดมินผู้ดำเนินการ

## 4. <third_party>
- **Firebase Auth & Firestore:** ใช้ Firebase Auth ในการยืนยันตัวตนแอดมิน (`auth.currentUser.uid`) และ Firestore เป็น Single Source of Truth
- **Pointer-Only:** การเข้าถึงสิทธิ์อิงตาม Environment Variables ในไฟล์ `.env` (ตัวแปรตระกูล `VITE_FIREBASE_*`)

## 5. <pitfalls_and_solutions>
- **[Pitfall] พนักงานลบไม่สำเร็จ ติด Error `ไม่อนุญาตให้ลบรายชื่อที่มีเครดิต/เงินค้างอยู่ในระบบ`:**
  - *สาเหตุ:* โค้ด `deleteUser` นำกฎ Orphan Data Prevention ของลูกค้ามาบังคับใช้กับพนักงาน ทำให้พนักงานที่เคยมี Welcome Points หรือแต้มสะสมถูกบล็อกไม่ให้ลบ
  - *วิธีแก้:* เพิ่มตัวเลือก `{ isStaffRemoval: true }` ใน `deleteUser(adminId, targetUid, options)` เพื่อให้ข้ามการเช็คเครดิตสำหรับพนักงาน และลดระดับเป็น `role: 'customer'`, `isStaff: false`, `isActive: false` พร้อมบันทึก `adminId` จริงลง Audit Log
  - *สถานะ:* ส่งมอบเรียบร้อย (Delivered & Verified)
