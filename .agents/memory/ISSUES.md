# รายการปัญหาหลังบ้านที่ต้องแก้ไข (ISSUES)

## 🚨 1. บั๊กราคาบิล POS คลาดเคลื่อน (ระดับวิกฤต)
* **สถานะ**: 🟢 แก้ไขเรียบร้อยแล้ว (Resolved)
* **รายละเอียดการแก้ไข**: ปรับปรุง `billingTransactionService.js` ให้ดึงค่าส่วนลด ค่าขนส่ง และค่าธรรมเนียมจาก root ของ `orderData` เป็น fallback ในกรณีที่ไม่มีอ็อบเจกต์ `summary` และตรวจสอบระดับราคา B2B/ปลีก ก่อน Secure ราคา

## 👤 2. หน้ารายละเอียดลูกค้าไม่แสดงประวัติสั่งซื้อ
* **สถานะ**: 🟢 แก้ไขเรียบร้อยแล้ว (Resolved)
* **รายละเอียดการแก้ไข**: อัปเดต `useCustomerHistory.js` ให้ค้นหาออเดอร์จากฟิลด์ `customer.uid` และ `userId` ไปพร้อมกันเพื่อรองรับโครงสร้างข้อมูลแบบใหม่และเก่า พร้อมทำความสะอาดลบข้อมูลซ้ำโดยอัตโนมัติ

## 🚨 3. ประวัติแต้มสะสมบิล POS ไม่ขึ้นในหน้า Audit Ledger
* **สถานะ**: 🟢 แก้ไขเรียบร้อยแล้ว (Resolved)
* **รายละเอียดการแก้ไข**: อัปเดต `useAuditLedger.js` ให้ดึงข้อมูลประวัติแต้มสะสมจาก root collection `credit_transactions` ผ่าน `getCollectionPath` ให้ตรงกับพิกัดเซฟข้อมูลของระบบ B2B/POS แทนที่การระบุพาธแบบ hardcode ใน artifacts



## 🚨 4. Data Flow Risk (Hardcoded Firebase Paths)
* **สถานะ**: 🟢 แก้ไขเรียบร้อยแล้ว (Resolved)
* **รายละเอียดการแก้ไข**: เขียนสคริปต์ Refactor ทำการค้นหาและแทนที่การเรียก Path ฐานข้อมูล (เช่น `collection(db, 'users')`) จำนวนกว่า 115 จุดในแอป `dh-frontend`, `dh-backoffice-react` และ `dh-staff-app` ให้เรียกใช้งานผ่านฟังก์ชันกลาง `getCollectionPath` จากไลบรารี `dh-shared` เพื่อป้องกันไม่ให้ข้อมูลทดสอบปะปนกับข้อมูลจริง

## 🚨 5. บั๊กโครงสร้างที่อยู่เอกสาร `squadConfig` (Invalid document reference)
* **สถานะ**: 🟢 แก้ไขเรียบร้อยแล้ว (Resolved)
* **รายละเอียดการแก้ไข**: นำเข้า `getCollectionPath` จาก `dh-shared` มาใช้แทนการระบุแบบ hardcode เพื่อให้โครงสร้าง path กลายเป็นเลขคู่ (6 segments ใน Canvas Env และ 2 segments ใน Production Env) ซึ่งถูกต้องตามหลัก Firestore SDK และแก้ไขปัญหา Runtime Crash เมื่อเข้าหน้าแรก B2B ทั้งระบบหลังบ้านและหน้าบ้านสำเร็จ

## 🚨 6. ปัญหาระบบล็อกอิน B2B หน้าบ้านขัดขวางการเข้าสู่ระบบอัตโนมัติ (Auth Block)
* **สถานะ**: 🟢 แก้ไขเรียบร้อยแล้ว (Resolved)
* **รายละเอียดการแก้ไข**: เพิ่มการตั้งค่า `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` โดยอัตโนมัติเมื่อรันบนสภาพแวดล้อม localhost/127.0.0.1 ครอบคลุมทั้ง 3 ระบบ (Frontend, Backoffice, StaffApp) เพื่อช่วยให้บอททดสอบ E2E และนักพัฒนาผ่านด่าน App Check/ReCAPTCHA v3 โดยไม่เกิดปัญหา Auth Block

## 🚨 7. ปัญหา Side-Effects ใน Firestore Transaction และ Sandbox Path Mismatch (ความเสถียรระบบ)
* **สถานะ**: 🟢 แก้ไขเรียบร้อยแล้ว (Resolved)
* **รายละเอียดการแก้ไข**: 
  1. ปรับปรุง `billingTransactionService.js` โดยแยกการยิง Logs (setTimeout) ออกมาอยู่ภายนอก `runTransaction` ในส่วนของ Post-Transaction Effects ป้องกันการเกิด Log ซ้ำซ้อนเมื่อเกิด Transaction Retry
  2. แก้ไขปัญหา Sandbox Path Mismatch ใน `todoWalletService.js` ที่เดิมมีการฮาร์ดโค้ดพาธ `users` เป็น `artifacts/${appId}/users` (ไม่ตรงตามมาตรฐาน) ให้มาเรียกใช้งานผ่าน `getUsersPath()` และ `getUserSubcollectionPath()` จาก `dh-shared`
  3. ปรับปรุงฮาร์ดโค้ดพาธคอลเลกชัน `system_logs` ใน `todoPaymentService.js`, `todoWholesaleService.js`, และ `todoActionService.js` ให้เรียกใช้งานผ่าน `getCollectionPath('system_logs')` แทน เพื่อแยกแยะข้อมูล Sandbox ใน Canvas Env ได้อย่างถูกต้องและแม่นยำ
