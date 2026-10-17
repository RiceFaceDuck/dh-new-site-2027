# SSR Memory: Payment Settings (การตั้งค่าช่องทางชำระเงินและบัญชีธนาคาร)

<usage_workflow>
1. ผู้จัดการเข้าเมนู Backoffice -> ผู้จัดการระบบ (Managers) -> วิธีชำระเงิน/ธนาคาร (/managers/payment)
2. ผู้จัดการระบุชื่อธนาคาร, รหัสธนาคาร, ชื่อบัญชี, เลขที่บัญชี (ค่าเริ่มต้น: ธนาคารกรุงศรีอยุธยา / นายเหว่ย ไห / 692-1-14458-6)
3. มี Live Preview การ์ดแสดงผลแบบเรียลไทม์
4. เมื่อกด "บันทึกข้อมูลบัญชีธนาคาร" ข้อมูลจะบันทึกลง Firestore ที่ collection `settings`, doc `payment`
5. หน้าร้านค้า (Storefront `dh-frontend`) ที่หน้าชำระเงิน (/checkout) จะอ่านข้อมูลบัญชีนี้มาแสดง พร้อมฟังก์ชันคัดลอกเลขบัญชีแบบ One-Click และมี LocalStorage Cache ป้องกัน Quota Read นาน 15 นาที
</usage_workflow>

<domain_rules>
1. ค่าเริ่มต้นของระบบ (Default Fallback): หากยังไม่มีการตั้งค่าใน Firestore หรือเน็ตขัดข้อง ให้ใช้บัญชีกรุงศรีอยุธยา (BAY) 692-1-14458-6 นายเหว่ย ไห เสมอ
2. Quota Safety: หน้าบ้านต้องแคชข้อมูลการตั้งค่าอย่างน้อย 15 นาที ป้องกันการอ่าน Firestore บ่อยเกินจำเป็น
3. Single Responsibility & Pure UI: แยก UI ฟอร์ม (`PaymentForm`), คำแนะนำ (`PaymentGuide`), ตรรกะจัดการข้อมูล (`usePaymentSettings`) ออกจากกันอย่างเคร่งครัด
4. Zero Auto-Deploy: ทุกการแก้ไขทำงานเฉพาะระดับ Local ห้าม deploy สู่เซิร์ฟเวอร์จริง
</domain_rules>

<core_schema>
- Firestore Collection: `settings`
- Doc ID: `payment`
- Structure:
  ```json
  {
    "bankName": "ธนาคารกรุงศรีอยุธยา (Krungsri)",
    "bankCode": "BAY",
    "bankShort": "กรุงศรี",
    "accountName": "นายเหว่ย ไห",
    "accountNumber": "692-1-14458-6",
    "promptPayNumber": "",
    "promptPayName": "",
    "cardImageUrl": "URL รูปภาพ หรือสตริงว่างเพื่อใช้รูปเริ่มต้น",
    "enableBankTransfer": true,
    "enablePromptPay": false,
    "note": "กรุณาตรวจสอบยอดเงินและชื่อบัญชีให้ถูกต้องก่อนโอนเงิน",
    "updatedAt": "Timestamp"
  }
  ```
</core_schema>

<third_party>
- การโอนเงินผ่านระบบธนาคารในประเทศไทย (ปัจจุบันเป็น Manual Transfer + แนบสลิปโอนเงิน)
- Google Drive Asset Pipeline (`driveService.uploadImage`) สำหรับอัปโหลดภาพการ์ดบัญชี
</third_party>

<pitfalls_and_solutions>
- ปัญหา: โค้ดเดิมใน `PaymentMethod.jsx` ฮาร์ดโค้ดเลขที่บัญชีเป็นกสิกรไทย 123-4-56789-0 และปุ่มคัดลอกคัดลอกเลขตายตัว
- ทางแก้: ย้ายไปอ่านจาก `storefrontSettingsService.getPaymentConfig()` ที่ดึงค่าจาก Backoffice พร้อมทำ Fallback เป็นบัญชีกรุงศรีของนายเหว่ย ไห และปุ่มคัดลอกจะคัดลอกเลขบัญชีจริงเสมอ
- ปัญหา: เมื่อใช้ `truncate` ในกล่อง flex เดียวกับปุ่มคัดลอก ทำให้เลขที่บัญชีโดนตัดทอนเป็น `692-1-14458...` บนจอแคบ
- ทางแก้: แยกแถวหัวข้อ+ปุ่มคัดลอกไว้ด้านบน แล้วให้เลขที่บัญชีอยู่เต็มบรรทัดอิสระด้านล่าง กำหนด `whitespace-nowrap select-all` ป้องกันการถูกบีบหรือตัดคำ 100% พร้อมปรับฟอนต์เป็น Sarabun New และใส่ `text-shadow-sm` เพื่อให้อ่านชัดเจนระดับมืออาชีพ
- ปัญหา: รูปภาพบัตรบัญชีธนาคารถูกฮาร์ดโค้ดเป็นไฟล์ภาพกรุงศรีสถิต ทำให้ผู้จัดการไม่สามารถเปลี่ยนหรืออัปโหลดภาพบัตรบัญชีอื่นได้
- ทางแก้: เพิ่มฟิลด์ `cardImageUrl` รองรับการอัปโหลดไฟล์ผ่าน `driveService.uploadImage`, การวาง URL ตรง, การคลิกเปลี่ยนรูปจาก Live Preview และปุ่มคืนค่ารูปเริ่มต้น เชื่อมโยงให้แสดงผลตรงกันทั้งหลังบ้านและหน้าเว็บ
</pitfalls_and_solutions>
