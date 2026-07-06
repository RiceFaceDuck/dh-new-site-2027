# DH Notebook - Backoffice (React)

ระบบจัดการหลังบ้านสำหรับพนักงานและผู้จัดการของ DH Notebook 

## 🚀 การติดตั้งและการรันโปรเจกต์

1. **ติดตั้ง Dependencies:**
   ```bash
   npm install
   ```

2. **รัน Local Development Server:**
   ```bash
   npm run dev
   ```

3. **รัน Build สำหรับ Production:**
   ```bash
   npm run build
   ```

## 📁 โครงสร้างโฟลเดอร์แบบย่อ (Folder Structure)

- `src/components/` - คอมโพเนนต์ที่ใช้ร่วมกันในหลายๆ หน้า (เช่น ปุ่ม, แบบฟอร์มพื้นฐาน)
- `src/pages/` - หน้าจอหลักแต่ละหน้าของระบบหลังบ้าน (เช่น Customers, Inventory, Ads)
- `src/firebase/` - Service เบื้องหลังที่ใช้ติดต่อกับ Firebase (Firestore, Auth, Storage) **(หมายเหตุ: ลอจิกส่วนกลางบางตัวถูกย้ายไปที่ `dh-shared`)**
- `src/layouts/` - โครงร่างของหน้าจอหลัก (เช่น AdminLayout)

## ✍️ แนวทางการเขียนโค้ด (Coding Guidelines)

1. **Single Responsibility Principle (SRP):** พยายามเขียน Component หรือ Service ให้ทำหน้าที่เพียงอย่างเดียว หากเริ่มยาวเกิน 200 บรรทัด ให้พิจารณาแยกส่วน
2. **In-App Documentation:** ทุกครั้งที่เพิ่มฟีเจอร์ใหม่ที่มีความซับซ้อน จะต้องมีปุ่ม **?** (Tooltip หรือ Guide Modal) เพื่ออธิบายวิธีการใช้งานให้ผู้ใช้งาน (Staff/Manager) ด้วยเสมอ
3. **การเข้าถึงข้อมูลร่วม (Shared Data):** หากฟังก์ชันการดึงข้อมูลใดมีการใช้งานตรงกับหน้าบ้าน (`dh-frontend`) ให้ย้ายไปไว้ที่โฟลเดอร์โปรเจกต์ `dh-shared` เสมอ เพื่อลดความซ้ำซ้อน
4. **ความสวยงามและ UX:** โปรเจกต์นี้ให้ความสำคัญกับ Premium UX/UI กรุณารักษาความลื่นไหลของการโหลดข้อมูล (Skeleton, Inline Loading) และใช้ Toast Notification อย่างเหมาะสม

---
*Generated as part of the Maintainability Upgrade (Phase 4)*
