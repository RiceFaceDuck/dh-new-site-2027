# 🗺️ DH Notebook: Cognitive Index (ดัชนีความคิดระดับปริซึม)

ดัชนีนี้เป็นศูนย์รวมแผนที่ความคิด (Cognitive Map) สำหรับควบคุมทิศทางการคิดและตัดสินใจของ AI Agent ในการพัฒนาโครงการ DH Notebook เพื่อเพิ่มความแม่นยำสูงกว่าเกณฑ์ทั่วไป

---

## 1. 🧠 Brain Folder Schema (โครงสร้างแฟ้มความจำ)

ระบบความจำทั้งหมดใน `.agents/memory/` ถูกแบ่งออกตามบทบาทที่ชัดเจนดังนี้:

*   **Active Memory (ความจำระยะสั้น/งานตรงหน้า):**
    *   [TODO.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/TODO.md): แผนงานและสัญญารอบ Sprint ปัจจุบันรวมถึง Backlog
    *   [ISSUES.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/ISSUES.md): บันทึกประวัติและรายการบั๊กที่ต้องแก้ไขเร่งด่วน
*   **Core DNA (โครงสร้างแกนกลางระดับยุทธศาสตร์):**
    *   [ARCHITECTURE.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/ARCHITECTURE.md): รูปแบบสถาปัตยกรรม Monorepo และ Coding Patterns
    *   [Schema Key/](file:///c:/DH%20Notebook/Management%20System/.agents/memory/Schema%20Key/Schema-Index.md): ดัชนีฟิลด์ฐานข้อมูล Firestore (แบ่ง Tier 1-3 ตามความสำคัญและระดับความเสี่ยง)
    *   **WALLET_DNA (กฎกระเป๋าเงิน):** "Wallet แปลว่า เงินที่ DH ค้างลูกค้าไว้" เท่านั้น ไม่มีระบบให้ลูกค้าโอนเงินมาเติมฝากไว้เพื่อใช้สอย (No Top-up). การที่มีฟังก์ชันแอดมินกด "เพิ่ม/ลด" ยอด Wallet ได้ มีจุดประสงค์เดียวคือ **"การแก้ไขตัวเลขที่ผิดพลาดทางบัญชี" (Error Correction)** เท่านั้น

*   **Sensory Logs & Learned Lessons (การประเมินความเสี่ยง, โควต้า และบทเรียน):**
    *   [SYSTEM_CAUTIONS.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/SYSTEM_CAUTIONS.md): จุดเสี่ยงระดับวิกฤต (🔴 Cautions!) และ Breaking Changes
    *   [FIRESTORE_QUOTA_ESTIMATION.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/FIRESTORE_QUOTA_ESTIMATION.md): สถิติและคำแนะนำการประหยัด Firestore Quota
    *   [Audit Checklist.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/Audit%20Checklist.md): ด่านตรวจคุณภาพระบบ v1.0 (แยกตามเฟส P1-P4)
    *   [E2E_BOT_AUDIT_CHECKLIST.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/E2E_BOT_AUDIT_CHECKLIST.md): รายการและประวัติผลการทดสอบระบบด้วยบอทม้าดำ (Audit Checklist & Test Results)
    *   [E2E_BOT_LESSONS.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/E2E_BOT_LESSONS.md): บทเรียนและวิธีแก้ไขปัญหาต่างๆ ในการรันบอทม้าดำ (E2E Testing)
*   **Project Documents (เอกสารส่วนงานและนโยบายธุรกิจใน root docs/):**
    *   [claims_concept.md](file:///c:/DH%20Notebook/Management%20System/docs/claims_concept.md): นโยบายและวงจรสถานะของระบบเคลมสินค้า (Claims & Warranty)
    *   [concept_notes.md](file:///c:/DH%20Notebook/Management%20System/docs/concept_notes.md): คลังแนวคิดเชิงลึกและเทคโนโลยีในเฟสถัดไป เช่น ทำระบบ QR Code

---

## 2. 🧰 Available Skills (ทักษะพิเศษและเครื่องมือ)

ดึงทักษะเหล่านี้มาใช้จาก `.agents/skills/` เมื่อเจองานที่ตรงกับหมวดหมู่:
*   [audit_and_logging](file:///c:/DH%20Notebook/Management%20System/.agents/skills/audit_and_logging/SKILL.md): เมื่อต้องการเขียน Audit logs, จัดการ ISSUES หรือเช็คประวัติการทำงาน
*   [production_deployment](file:///c:/DH%20Notebook/Management%20System/.agents/skills/production_deployment/SKILL.md): เมื่อต้องอัปเดตระบบขึ้น Production พร้อมกฎการถามความเสี่ยง
*   [optimize_firebase_query](file:///c:/DH%20Notebook/Management%20System/.agents/skills/optimize_firebase_query/SKILL.md): แนวทางการประหยัดค่าใช้จ่ายและเขียน Query ให้มีประสิทธิภาพสูงสุด
*   [create_manager_setting](file:///c:/DH%20Notebook/Management%20System/.agents/skills/create_manager_setting/SKILL.md): กฎการสร้างหน้าตั้งค่าสำหรับผู้จัดการ (SRP และ In-App Docs)

---

## 3. 🗂️ Monorepo Code Mapping & Direct Links (แผนผังระบบและลิงก์ไฟล์สำคัญ)

วิ่งตรงไปที่ไฟล์เหล่านี้ทันทีเมื่อต้องแก้ไขแกนหลักของระบบ:

*   **`dh-shared/`** (แกนกลาง Logic/Engine):
    *   👉 `taxEngine.js`: การคิด VAT, ภาษี ณ ที่จ่าย
    *   👉 `priceEngine.js`: การคิดราคาและส่วนลด
    *   👉 `dbPath.js` หรือ `getCollectionPath`: ตัวจัดการพาธ Firestore
*   **`dh-backoffice-react/`** (หลังบ้าน/POS/คลัง/เคลม):
    *   จุดค้นหาด่วน: `src/pages/managers/settings/` (Manager Settings)
*   **`dh-frontend/`** (ฝั่งลูกค้า B2B):
    *   ตะกร้าสินค้า, สั่งซื้อสินค้า, ระบบสะสมเครดิต, กระเป๋าเงิน (Wallet)
*   **`dh-staff-app/`** (มือถือพนักงานหน้าร้าน):
    *   อัปเดตสถานะ, เช็คสต๊อกด้วยกล้องมือถือ, สแกน QR

---

## 3.5 🔌 Development Environment Ports (พอร์ตสำหรับนักพัฒนา)

เพื่อป้องกันการสับสนระหว่างการรัน `npm run dev` เอง กับการรันผ่านไฟล์ `FULL run dev all.bat` พอร์ตทั้งหมดของโปรเจกต์ถูกล็อกค่า (Strict Port) ไว้ใน `vite.config.js` ดังนี้:
*   **dh-frontend:** `http://localhost:8988`
*   **dh-backoffice-react:** `http://localhost:3168`
*   **dh-staff-app:** `http://localhost:3122`

---

## 4. 🛡️ High-IQ Security & Safe Execution (กฎความปลอดภัยขั้นสูงสุด)

เพื่อป้องกันระบบล่ม และปกป้องข้อมูลธุรกรรม (Financial Consistency):

1.  **ห้าม Hardcode คอลเลกชัน Firestore โดยเด็ดขาด:** ต้องเรียกผ่าน `getCollectionPath` เสมอ เพื่อไม่ให้ข้อมูล Test ปนกับ Live
2.  **Transactions เท่านั้นสำหรับเรื่องเงิน/แต้ม:** การโอนเงิน ยอด Wallet หรือ `creditPoints` ต้องรันใน `runTransaction` เพื่อแก้ปัญหา Race Conditions
3.  **ห้ามลบโค้ดทำงานได้ (No Destructive Edits):** หากของเก่าทำงานได้ ห้ามลบทิ้ง ให้ใช้วิธี Comment หรือแยกไฟล์ใหม่เสมอ
4.  **หยุดเมื่อเจอความเสี่ยง (Stop & Ask):** หากพบปัญหาที่อาจทำระบบล่ม ให้หยุดแก้โค้ดแล้วใช้ `ask_question` ถามช้อยส์ตัดสินใจจากผู้ใช้ทันที
5.  **Workspace Organization (ความเป็นระเบียบ):** สคริปต์ทดสอบ (scratch/audit/fix) ต้องสร้างใน `scripts/` เสมอ และไฟล์รายงานต่างๆ (txt/md) ต้องเก็บใน `docs/reports/` ห้ามสร้างทิ้งไว้ขวาง Root หน้าแรกเด็ดขาด

---

## 🚀 5. AI Session Bootstrap (ขั้นตอนนำทางบอทเริ่มต้นเซสชัน)

เมื่อเริ่ม Turn ใหม่ บอทต้องรันสิ่งนี้เงียบๆ:
1.  อ่าน [AGENTS.md](file:///c:/DH%20Notebook/Management%20System/.agents/AGENTS.md) เพื่อรับหลักการ Prismatic OS
2.  อ่านดัชนีนำทางนี้ [COGNITIVE_INDEX.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/COGNITIVE_INDEX.md)
3.  ตรวจสอบความจำระยะสั้น [TODO.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/TODO.md) และ [ISSUES.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/ISSUES.md)
4.  เมื่อพบสิ่งผิดปกติหรือเริ่มทำแผนงาน ห้ามแก้ไขโค้ดใดๆ ทันที จนกว่าจะได้รับการอนุมัติจากผู้ใช้ผ่านป๊อปอัป `ask_question`
