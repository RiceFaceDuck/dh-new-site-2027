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

## 🚨 8. ช่องโหว่ Business Logic ของระบบ Wallet และข้อผิดพลาด Permission Denied
* **สถานะ**: 🟢 แก้ไขเรียบร้อยแล้ว (Resolved)
* **รายละเอียดการแก้ไข**:
  1. **แก้ไข Permission Denied ฝั่ง Frontend:** ปรับแก้ฟังก์ชัน `confirmOrderReceipt` ใน Frontend (`checkoutOrderActionService.js`) โดยตัดโค้ดที่พยายามอัปเดต `creditPoints` หรือสร้าง `credit_transactions` ออกไป ทำให้ Frontend ทำหน้าที่แค่เปลี่ยนสถานะออเดอร์เป็น `received` อย่างเดียว เพื่อให้สอดคล้องกับ `firestore.rules` (แก้ Rules อนุญาตให้ลูกค้าแก้สถานะออเดอร์ตัวเองได้แบบจำกัดฟิลด์)
  2. **แก้ไข Race Condition ใน Backoffice:** ปรับปรุง `handlePaymentCompletion` ใน (`creditActionService.js`) ให้เรียกใช้ `adjustUserCreditWithTransaction` ที่ส่ง `transaction` เข้าไป ทำให้การอัปเดตสถานะออเดอร์และการแจกแต้มทำงานเสร็จพร้อมกันใน 1 Transaction ลดความเสี่ยงเกิด Phantom Credit อย่างเด็ดขาด

## ⚠️ 9. ปัญหาบอท E2E ล็อกอินระบบหน้าบ้านไม่ผ่าน (Frontend Login Test)
* **สถานะ**: 🟢 แก้ไขเรียบร้อยแล้ว (Resolved)
* **รายละเอียด**: บอททดสอบ E2E "ม้าดำ" (`bot_cross_system.js`) พบปัญหาล็อกอินบัญชีลูกค้า (`ai.tester@dhnotebook.com`) บนระบบหน้าบ้านไม่สำเร็จ อาจเกิดจาก UI ป้องกันบอท, การตอบสนองของ Firebase Auth ช้ากว่าปกติ, หรือมี Error Dialog กีดขวางบนหน้าเว็บ (แก้ไขโดยปรับปรุงการรอโหลดและคลิกแบบ Force)

## 🚨 10. กฎ Firestore บล็อกลูกค้าใหม่ไม่ให้สร้างออเดอร์ (Permission Denied)
* **สถานะ**: 🟢 แก้ไขเรียบร้อยแล้ว (Resolved)
* **รายละเอียด**: จากการรัน E2E Bot (ม้าดำ) พบว่าบิลคำสั่งซื้อถูกปฏิเสธจากฐานข้อมูล (Permission Denied) โดยคาดว่าเกิดจาก:
  1. กฎ `firestore.rules` ส่วนของการอนุญาตแก้ไขสินค้าและผู้ใช้ ขัดแย้งกับโค้ด `checkoutSubmitService.js` ตอนที่หน้าบ้านพยายามอัปเดตยอดสั่งซื้อสะสม
  2. การเรียกใช้ `resource.data.stats` โดยไม่ตรวจสอบก่อน ทำให้เกิด Error (ประเมินเป็น Deny) หากลูกค้าเพิ่งสมัครใหม่และยังไม่มีฟิลด์ `stats` ในระบบ
  3. ออเดอร์จึงไม่ถูกบันทึก และไม่แสดงในหน้า Dashboard ของแอดมิน
* **รายละเอียดการแก้ไข**: 
  - เปลี่ยนวิธีการเข้าถึง Object ที่อาจไม่มีอยู่จริงด้วย `resource.data.get('stats', {})` ใน `firestore.rules` ป้องกัน Firestore Security Rules ประเมินผลเป็น Error แล้วขัดขวาง Transaction ของลูกค้าใหม่
  - ปลดล็อคกฎให้ครอบคลุมระบบ Canvas (Artifacts) ในส่วนของ `artifacts/{appId}/users/{userId}` ให้มีมาตรฐานเดียวกับระบบหลัก
  - อัปเดตเงื่อนไขเช็คสต๊อกสินค้า `stockQuantity` ในส่วนของ products โดยใช้ `.get('stockQuantity', 0)` เพื่อให้ปลอดภัยสูงสุด

## ⚠️ 11. ความไม่สอดคล้องของคำค้นหา (UI Selectors) ในกระบวนการ E2E Testing
* **สถานะ**: 🟢 แก้ไขเรียบร้อยแล้ว (Resolved)
* **รายละเอียด**: บอทม้าดำไม่สามารถเปิดบิล Manual POS ได้ในครั้งแรก เนื่องจากเกิดความเปลี่ยนแปลงของ UI หน้าเว็บที่ต่างไปจากสคริปต์เดิม เช่น ช่อง "ค้นหาลูกค้า" เปลี่ยนเป็น "พิมพ์ชื่อลูกค้า..." และปุ่ม "เปิดบิลขาย POS" เปลี่ยนเป็น "สร้างบิลใหม่" รวมไปถึงช่องที่อยู่ลูกค้าที่มีการแสดงผลแบบ Textarea ซ่อนอยู่
* **รายละเอียดการแก้ไข**: Agent ทำการอัปเดตสคริปต์ม้าดำใหม่ให้รองรับการค้นหาที่แม่นยำขึ้น และใช้คำสั่ง JS (Evaluate) ข้ามข้อจำกัดด้าน Animation ของเว็บจนทดสอบผ่าน 100%

## ⚠️ 12. ค้นหาสินค้าใหม่ในระบบ POS ไม่พบ (Hybrid Cache Delay)
* **สถานะ**: 🔴 รอการแก้ไข (Pending)
* **รายละเอียด**: ระบบ POS มีโครงสร้างค้นหาแบบ Hybrid Cache (Zero-Read Architecture) โดยดึงข้อมูลทั้งหมดมาไว้ใน `sessionStorage` เพื่อลดการอ่าน Firebase ทำให้ "สินค้าที่เพิ่งสร้างใหม่" จะยังไม่ปรากฏในผลลัพธ์หากค้นหาด้วยบางส่วนของคำ (Substring/Prefix) เว้นแต่จะพิมพ์ SKU ได้ตรงเป๊ะทุกตัวอักษร 100% (ซึ่งจะวิ่งไปทำงานผ่าน Fallback Query) 
* **ข้อเสนอแนะสำหรับการแก้ไขครั้งต่อไป**: ควรเพิ่มปุ่ม "รีเฟรชสต๊อก/อัปเดตแคช" (Refresh Cache) บนหน้าจอ POS แบบเดียวกับที่ระบบ Inventory มี หรือปรับปรุงให้ Fallback ของ Firebase ใช้รูปแบบ `where('sku', '>=', search)` เพื่อช่วยให้พนักงาน POS ค้นเจอสินค้าใหม่ได้ง่ายขึ้นก่อนที่แคชหลักจะอัปเดต

## ⚠️ 13. ขยะข้อมูล (Dummy Data) ตกค้างจากการทำงานของ E2E Bot
* **สถานะ**: 🔴 รอการแก้ไข (Pending)
* **รายละเอียด**: กระบวนการสร้างออเดอร์ หรือทดสอบของม้าดำได้สร้างสินค้าที่มี SKU นำหน้าด้วยคำว่า `TEST-` ทิ้งไว้ในฐานข้อมูล และพอกดใช้คำสั่ง ขอลบสินค้า ระบบก็จะสร้าง Todo Action ทำให้กลายเป็นขยะสะสมในหน้าบัญชี
* **ข้อเสนอแนะสำหรับการแก้ไขครั้งต่อไป**: พัฒนาเครื่องมือ/สคริปต์ Cleanup ข้อมูลขยะในระบบฐานข้อมูล Firebase โดยตรงผ่าน Firebase Admin SDK ควบคู่ไปกับระบบ E2E Testing หรือแยก Environment ฐานข้อมูลสำหรับทดสอบโดยเฉพาะ (Test Database) ให้ออกขาดจากกัน

