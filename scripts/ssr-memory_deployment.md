# SSR Local Grimoire: Master Deployment Center

<usage_workflow>
1. ผู้ใช้งานเรียกใช้งานผ่านไฟล์ `Management System\_deploy\deploy-all.bat`
2. หรือใช้ไฟล์ Deploy ย่อยในโฟลเดอร์ `Management System\_deploy\`:
   - `deploy-backoffice.bat`
   - `deploy-frontend.bat`
   - `deploy-staff.bat`
3. ระบบแสดง Dashboard ตรวจสอบสถานะความพร้อม (Pre-flight Status):
   - ตรวจจับ Git Commits รอขึ้น Cloud (นับจาก `git log origin/main..HEAD`)
   - ตรวจจับการแก้ไขตกค้างใน dh-frontend, dh-backoffice-react, dh-staff-app, Rules, Functions, Indexes (นับจาก `git status --porcelain`)
3. ผู้ใช้งานเลือกการกระทำ:
   - กด [Enter]: FULL DEPLOY ครบวงจร (Auto Git Commit -> Auto Git Push -> Deploy Rules -> Deploy 3 เว็บไซต์) ➔ แสดงสรุปผลสถานะล่าสุดหลัง Deploy (Post-flight Status เขียว 100%) ➔ กด Enter เพื่อปิดโปรแกรมออกจาก Terminal ทันที
   - เมนู [1] - [6]: Deploy แยกแต่ละส่วน (Frontend, Backoffice, Staff App, Functions, Rules, Indexes)
   - เมนู [7]: บันทึกการแก้ไขลงในเครื่อง (Git Commit)
   - เมนู [8]: ส่งโค้ดขึ้น GitHub (Git Push origin main)
   - เมนู [9]: สำรองฐานข้อมูล Firestore (Database Backup ดาวน์โหลดข้อมูลจริงลงโฟลเดอร์ backups/ ในเครื่อง)
   - เมนู [0]: ยกเลิก / ออกจากโปรแกรม
</usage_workflow>

<domain_rules>
- **Full Deploy Safety Invariant**: Full Deploy จะไม่รวม Cloud Functions และ Indexes โดยอัตโนมัติ เพื่อป้องกันอุบัติเหตุกระทบระบบฐานข้อมูลจริง (ต้องกดเมนูแยก [4] และ [6] ด้วยตนเอง)
- **Functions Deletion Hazard (CRITICAL)**: ห้ามรัน `firebase deploy --only functions` แบบเหมารวมเด็ดขาด เพราะ Firebase CLI จะถามลบฟังก์ชันเดิมบน Cloud ที่ชื่อ prefix ไม่ตรงกัน (`inventory-*`, `slips-*`, `marketing-*`) การ Deploy Cloud Functions ต้องทำแบบเจาะจงรายตัวเท่านั้น เช่น `firebase deploy --only functions:ชื่อฟังก์ชัน` เพื่อความปลอดภัย 100% ป้องกันการลบระบบเดิมโดยไม่ตั้งใจ
- **Zero Auto-Deploy by AI Assistant**: AI ผู้ช่วยถูกล็อกห้าม deploy ขึ้นเซิร์ฟเวอร์จริงทุกกรณี ต้องให้ผู้ใช้งานรันคำสั่งด้วยตนเองผ่าน `deploy-all.bat` เท่านั้น
- **Git State Alignment**: การขึ้นสถานะสีเหลืองหรือเขียวของเว็บไซต์ในแดชบอร์ด อิงจาก `git status` ในเครื่อง (หากไฟล์ยังไม่ถูก commit จะขึ้นสถานะรอ Deploy)
- **Zero Secret Rule**: ไม่เก็บบันทึก credentials หรือ token ลงในสคริปต์ ตัวสคริปต์ใช้ Firebase CLI login และ Git SSH/HTTPS ของเครื่องผู้ใช้
</domain_rules>

<core_schema>
- Entry Point: `Management System/_deploy/deploy-all.bat`
- Dedicated Deploy Scripts: `Management System/_deploy/deploy-*.bat`
- Main Logic: `Management System/scripts/deploy_center.mjs`
- Database Backup Runner: `Management System/scripts/backupDatabase.mjs`
- Backup Output Directory: `Management System/backups/{YYYY-MM-DD}_{HH-mm-ss}/{collection}.json`
- Backed-up Collections: `users`, `products`, `orders`, `claims`, `system_logs`
</core_schema>

<third_party>
- **Firebase CLI**: ใช้คำสั่ง `firebase deploy --only <target>` สำหรับ Hosting, Rules, Functions, Indexes
- **Git / GitHub**: ใช้คำสั่ง `git add`, `git commit`, `git push origin main` สำหรับ Source Control
- **Firestore REST API**: ใช้ดึงเอกสารผ่าน `https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents`
</third_party>

<pitfalls_and_solutions>
1. **ปัญหา**: Deploy เว็บไซต์ขึ้น Firebase ไปแล้ว แต่หน้าจอยังแสดงผลสีเหลือง 8 ไฟล์
   - **สาเหตุ**: แดชบอร์ดตรวจสอบสถานะจาก `git status` ภายในเครื่อง โค้ดที่ deploy ไปยังไม่ได้ทำการ `git commit`
   - **วิธีแก้**: ปรับให้ Full Deploy บรรจุขั้นตอน Git Commit และ Git Push อัตโนมัติ หรือเลือกกดเมนู [7] เพื่อบันทึกงานในเครื่อง
   - **สถานะ**: แก้ไขแล้ว (Delivered)
2. **ปัญหา**: ผู้ใช้งานไม่แน่ใจว่าเมนูสำรองฐานข้อมูลทำงานอย่างไร
   - **วิธีแก้**: เพิ่มคำอธิบายบนหน้าจอเมนู [9] ชัดเจนว่าเป็น "ดาวน์โหลดข้อมูลจริงลงโฟลเดอร์ backups/ ในเครื่อง" และระบุชื่อคอลเลกชันที่สำรอง
   - **สถานะ**: แก้ไขแล้ว (Delivered)
3. **ปัญหา (CRITICAL RISK)**: เมนู [4] Deploy Cloud Functions ใช้คำสั่ง `firebase deploy --only functions` แบบเหมารวม ทำให้ Firebase CLI ถามลบฟังก์ชัน 14 ตัวบน Cloud ที่ชื่อ prefix ไม่ตรงกัน (`inventory-*`, `slips-*`, `marketing-*`)
   - **สาเหตุ**: ฟังก์ชันบนคลาวด์เดิมถูก Deploy ด้วยชื่อกลุ่ม prefix หรือสถาปัตยกรรมต่างเวอร์ชัน เมื่อสั่ง deploy เหมารวม CLI จึงคิดว่าฟังก์ชันเดิมหายไปและถามขอลบ
   - **วิธีแก้ & บทเรียน**: ปิดหน้าต่างทันทีปลอดภัย 100% ห้ามกดยืนยัน Y เด็ดขาด และต่อไปการ deploy ฟังก์ชันต้องระบุเจาะจงรายตัวเท่านั้น เช่น `firebase deploy --only functions:recordAdTelemetry` เพื่อตัดความเสี่ยงการลบฟังก์ชันเดิมทิ้ง 100%
   - **สถานะ**: บันทึกลงตำราหลักแล้ว (Learned & Locked)
</pitfalls_and_solutions>
