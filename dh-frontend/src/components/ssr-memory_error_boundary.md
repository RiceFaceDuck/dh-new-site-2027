# SSR Memory: Frontend Error Boundary (`ssr-memory_error_boundary.md`)

## 1. <usage_workflow>
1. เมื่อเกิด Render Exception หรือ Chunk Loading Error ในหน้าร้านค้า `dh-frontend`
2. `ErrorBoundary` ตรวจจับข้อผิดพลาดและตรวจสอบประวัติการรีเฟรชใน `sessionStorage`
3. หากพยายามไม่เกิน 3 รอบ (`retryCount < 3`):
   - แสดงหน้าจอหมุนสุภาพ: "กำลังเชื่อมต่อและโหลดข้อมูลใหม่... (ครั้งที่ X/3)"
   - สั่งรีเฟรชหน้าเว็บอัตโนมัติ (`window.location.reload()`)
4. หากพยายามครบ 3 รอบแล้วยังเกิดปัญหา:
   - แสดงหน้าแจ้งเตือน "ขออภัย เกิดข้อผิดพลาด"
   - ให้ลูกค้ากดปุ่ม "รีเฟรชหน้าเว็บ" เพื่อรีเซ็ตตัวนับรอบและลองใหม่ด้วยตนเอง
5. หากหน้าเว็บเรนเดอร์สำเร็จและอยู่รอดเกิน 4 วินาที ระบบจะล้างตัวนับรอบใน `sessionStorage` ทิ้งอัตโนมัติ

## 2. <domain_rules>
- **Calm UI Invariant:** ห้ามแสดงกล่องแจ้งเตือนสีแดงในระหว่างการพยายามรีเฟรชอัตโนมัติ 3 ครั้งแรก
- **Retry Persistence Guard:** ต้องใช้ `sessionStorage` แยกตาม `pathname` เพื่อไม่ให้การติดลูปในหน้าหนึ่งไปกระทบหน้าอื่น
- **Absolute Deployment Ban:** ห้าม deploy โค้ดขึ้น production โดยเด็ดขาด

## 3. <core_schema>
- **Entry File:** [`dh-frontend/src/components/ErrorBoundary.jsx`](file:///c:/_DH%20Notebook/Management%20System/dh-frontend/src/components/ErrorBoundary.jsx)
- **Mounted In:** [`dh-frontend/src/main.jsx`](file:///c:/_DH%20Notebook/Management%20System/dh-frontend/src/main.jsx)
- **Verification Suite:** [`tests/verifications/verify_error_boundary_auto_retry.mjs`](file:///c:/_DH%20Notebook/Management%20System/tests/verifications/verify_error_boundary_auto_retry.mjs)
- **SessionStorage Keys:**
  - `dh_eb_retry_count` (string): จำนวนครั้งที่พยายามรีเฟรช (1, 2, 3)
  - `dh_eb_retry_path` (string): path หน้าเว็บที่เกิดปัญหา

## 4. <third_party>
- **Firestore Logging:** บันทึกข้อผิดพลาดลง `system_logs` พร้อมระบุ `autoRetried` และ `retryAttempt`

## 5. <pitfalls_and_solutions>
- **Problem:** หน้าเว็บอาจวนรีเฟรชแบบ Infinite Loop หากบันทึกตัวนับรอบเฉพาะใน React State
- **Solution:** เก็บตัวนับรอบใน `sessionStorage` ที่อยู่ข้ามการรีโหลดหน้าของเบราว์เซอร์ พร้อมจำกัดเพดานสูงสุด 3 รอบเท่านั้น
