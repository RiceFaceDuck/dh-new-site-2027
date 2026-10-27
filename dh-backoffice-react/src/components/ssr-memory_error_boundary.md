# SSR Memory: Backoffice Error Boundary (`ssr-memory_error_boundary.md`)

## 1. <usage_workflow>
1. เมื่อเกิด Render Exception หรือ Chunk Loading Error (เช่น `Failed to fetch dynamically imported module: ...`) ในหน้าระบบจัดการ `dh-backoffice-react`
2. `ErrorBoundary` ตรวจจับข้อผิดพลาดและตรวจสอบประวัติการรีเฟรชใน `sessionStorage` ตาม `pathname` ปัจจุบัน
3. หากจำนวนรอบยังไม่เกิน 3 ครั้ง (`retryCount < 3`):
   - ซ่อนหน้าจอ Error สีแดง
   - แสดงหน้าจอโหลดนุ่มนวล: "กำลังเชื่อมต่อและโหลดข้อมูลใหม่... (ครั้งที่ X/3)"
   - บันทึก log ข้อผิดพลาดไปที่ Firestore `system_logs` พร้อม telemetry
   - สั่งรีเฟรชหน้าเว็บอัตโนมัติ (`window.location.reload()`) หลังหน่วงเวลา 600ms
4. หากพยายามครบ 3 รอบแล้วยังเกิดปัญหาเดิม:
   - แสดงหน้าแจ้งเตือน "เกิดข้อผิดพลาดในการแสดงผลหน้าจอ" พร้อมข้อความสาเหตุ
   - ให้ผู้ใช้กดปุ่ม "🔄 รีโหลดหน้านี้ใหม่" เพื่อล้างค่าใน `sessionStorage` และรีเซ็ตการเริ่มใหม่ด้วยตนเอง
5. หากหน้าเว็บเรนเดอร์สำเร็จและทำงานได้ต่อเนื่องเกิน 4 วินาที ระบบจะล้างตัวนับรอบใน `sessionStorage` ทิ้งอัตโนมัติ

## 2. <domain_rules>
- **Calm UI Invariant:** ห้ามแสดงกล่องแจ้งเตือนสีแดงหรือตกใจให้พนักงานเห็นในระหว่างการพยายามรีเฟรชอัตโนมัติ 3 ครั้งแรก
- **Retry Persistence Guard:** ต้องบันทึกตัวนับรอบใน `sessionStorage` แยกตาม `pathname` เพื่อป้องกันไม่ให้เกิด Infinite Loop และไม่กระทบหน้าอื่น
- **Absolute Deployment Ban:** ห้าม deploy โค้ดขึ้น production โดยเด็ดขาด

## 3. <core_schema>
- **Entry File:** [`dh-backoffice-react/src/components/ErrorBoundary.jsx`](file:///c:/_DH%20Notebook/Management%20System/dh-backoffice-react/src/components/ErrorBoundary.jsx)
- **Mounted In:** [`dh-backoffice-react/src/main.jsx`](file:///c:/_DH%20Notebook/Management%20System/dh-backoffice-react/src/main.jsx)
- **Verification Suite:** [`tests/verifications/verify_backoffice_error_boundary_auto_retry.mjs`](file:///c:/_DH%20Notebook/Management%20System/tests/verifications/verify_backoffice_error_boundary_auto_retry.mjs)
- **SessionStorage Keys:**
  - `dh_bo_retry_count` (string): จำนวนครั้งที่พยายามรีเฟรช (1, 2, 3)
  - `dh_bo_retry_path` (string): path หน้าจอที่เกิดปัญหา (เช่น `/customers`)

## 4. <third_party>
- **Firestore Logging:** บันทึกข้อผิดพลาดลง `system_logs` (action: `backoffice_crash`, role: `manager`) พร้อมระบุ `autoRetried: boolean`, `retryAttempt: number`, `maxRetries: 3`

## 5. <pitfalls_and_solutions>
- **Problem:** เมื่อมีการอัปเดตเวอร์ชันใหม่ ไฟล์ chunk เดิมของ Vite บน CDN จะเปลี่ยน hash ทำให้ browser ของพนักงานที่ยังเปิดค้างอยู่โหลด chunk หน้าใหม่ (เช่น Customers) ไม่สำเร็จ (`Failed to fetch dynamically imported module`) และเด้ง Error สีแดงให้พนักงานตกใจ
- **Solution:** ติดตั้ง Auto-Retry 3 ครั้งใน ErrorBoundary พร้อมหน้าโหลดนุ่มนวล ระบบจะรีโหลดรับ chunk เวอร์ชั่นล่าสุดจาก CDN ทันทีโดยที่พนักงานไม่ต้องกดเอง
