# DH Notebook - Shared Module (`dh-shared`)

โมดูลส่วนกลางสำหรับเก็บ Business Logic และ Utility Functions ที่ถูกเรียกใช้งานร่วมกันระหว่างโปรเจกต์ (เช่น หน้าบ้าน `dh-frontend`, หลังบ้าน `dh-backoffice-react`, และแอปพนักงาน `dh-staff-app`)

## 🎯 วัตถุประสงค์
เพื่อลดปัญหา "God Objects" และ "Code Duplication" เมื่อมีฟีเจอร์ใดที่ต้องใช้งานร่วมกันระหว่างหลายแอปพลิเคชัน จะต้องนำ Logic มาไว้ที่โฟลเดอร์นี้

## 📁 โครงสร้าง
- `src/firebase/` - จัดเก็บ Service ที่ใช้ดึงข้อมูลจาก Firestore ที่สามารถเข้าถึงร่วมกันได้ (เช่น `categoryService.js`, `walletService.js`)
- `src/utils/` - จัดเก็บฟังก์ชันตัวช่วย เช่น การต่อ Path ของ Firestore (`pathUtils.js`) หรือการคำนวณต่างๆ

## ⚠️ กฎการใช้งานและการ Import (Rules)

1. **ห้ามยัดทุกอย่างลงมา:** ให้นำเฉพาะ Logic ที่ **"ใช้งานร่วมกันอย่างน้อย 2 โปรเจกต์ขึ้นไป"** มาใส่ในนี้เท่านั้น หาก Logic นั้นใช้เฉพาะฝั่ง Backoffice ให้เก็บไว้ที่ Backoffice เหมือนเดิม
2. **ห้ามผูกติดกับ UI (No UI Code):** ห้ามนำ React Components (JSX/TSX) มาไว้ในโฟลเดอร์นี้เด็ดขาด `dh-shared` ควรมีเฉพาะ Logic บริสุทธิ์ (JavaScript/TypeScript) เพื่อป้องกันปัญหา Dependency ข้ามโปรเจกต์
3. **การใช้งาน (Import):**
   - ใช้งานผ่าน Local File Dependency (`"dh-shared": "file:../dh-shared"`)
   - นำเข้าในโค้ดแบบนี้: `import { getCustomerPath } from 'dh-shared/utils/pathUtils';`

---
*Generated as part of the Maintainability Upgrade (Phase 4)*
