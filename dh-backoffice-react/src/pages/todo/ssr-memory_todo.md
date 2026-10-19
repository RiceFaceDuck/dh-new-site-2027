# SSR Memory: ศูนย์ปฏิบัติการและกระดานงาน (Todo Tasks System)

<usage_workflow>
1. พนักงานเปิดหน้า Operations Center (`/todo`) เพื่อติดตามงานคงค้างทั้งหมด (เช่น ตรวจสอบสลิป, ออกใบกำกับภาษี, อนุมัติราคาส่ง, เคลม/คืนสินค้า)
2. หน้าจอถูกแบ่ง 2 โซนแบบ 50/50:
   - ฝั่งซ้าย: งานทั่วไปตามตัวกรอง (All, Payment, Tax Invoice, Claim ฯลฯ)
   - ฝั่งขวา: งานสำคัญ & ค้างดำเนินการ (จัดเรียงตามความเร่งด่วนและเวลาที่ค้างนานที่สุด)
3. สำหรับงานตรวจสอบสลิป (`verify_slip`) ซึ่งส่งมาจากหน้าบ้าน (Web Orders):
   - พนักงานดูรหัสออเดอร์, ชื่อลูกค้า, ยอดเงิน และสถานะผู้รับผิดชอบงาน
   - คลิกที่รูปสลิปเพื่อขยายดูสลิปโอนเงินฉบับเต็ม
   - คลิกปุ่ม **"ไปที่งาน"** ระบบจะลงชื่อผู้รับผิดชอบงาน (First-Touch Staff Assignment) อัตโนมัติ และนำทางไปยังหน้าระบบบิล (`/billing`) เพื่อเปิดหน้าต่างรายละเอียดออเดอร์ให้พนักงานรับงานและจัดการต่อทันที
   - หากสลิปไม่ถูกต้อง สามารถกดปุ่ม **"ปฏิเสธ"** เพื่อตีกลับให้ลูกค้า
</usage_workflow>

<domain_rules>
- ห้าม Deploy ขึ้นระบบจริงโดยเด็ดขาด (Absolute Deployment Ban)
- มาตรฐานความโค้งมนของระบบ (Border Radius Invariant): ให้ใช้ `rounded-[0.2rem]` เสมอ
- การ์ดงานในโซน 50% ต้องรองรับพื้นที่หน้าจอขนาดกะทัดรัด ห้ามบังคับเรียงแนวนอนแบบ Fixed-width ที่ทำให้เนื้อหาชนกัน
- งานที่กดดำเนินการเสร็จแล้วจะหายจากหน้ากระดานงาน และถูกบันทึกลงระบบประวัติ/จัดเก็บถาวร
</domain_rules>

<core_schema>
- Entry Page: `Management System/dh-backoffice-react/src/pages/Todo.jsx`
- List Component: `Management System/dh-backoffice-react/src/pages/todo/components/TodoPageList.jsx`
- Payment Card: `Management System/dh-backoffice-react/src/components/todo/PaymentCard.jsx`
- Billing Dashboard: `Management System/dh-backoffice-react/src/components/billing/BillingDashboard.jsx`
- Firestore Collection: `todos`
- Key Fields:
  - `type`: ประเภทงาน (`verify_slip`, `issue_tax_invoice`, `WHOLESALE_APPROVAL`, ฯลฯ)
  - `orderId`: รหัสคำสั่งซื้ออ้างอิง
  - `slipUrl`: ลิงก์รูปสลิปโอนเงิน (Google Drive / Firebase Storage)
  - `amount`: ยอดเงินที่โอน
  - `customerName`: ชื่อลูกค้า
  - `staffUid` / `staffNickname`: พนักงานผู้รับผิดชอบงาน
</core_schema>

<third_party>
- Google Drive Slip Storage: รูปสลิปที่แนบมาจาก Google Drive ต้องแปลง URL ผ่าน `getRenderableImageUrl` และใส่ `referrerPolicy="no-referrer"`
</third_party>

<pitfalls_and_solutions>
- **ปัญหา UI การ์ดพังซ้อนทับกัน (Container Over-Division):**
  - *สาเหตุ:* หน้าจอหลักถูกแบ่ง 50/50 (`lg:w-1/2`) อยู่แล้ว แต่ใน `TodoPageList` ดันใส่ `lg:grid-cols-2` ซ้ำ ทำให้การ์ดเหลือพื้นที่แค่ ~240px ประกอบกับ `PaymentCard` ใช้ `sm:flex-row` ยัด 4 องค์ประกอบในแถวเดียวจนทะลักซ้อนทับ
  - *วิธีแก้:* 
    1. ปรับกริดใน `TodoPageList` เป็น `grid-cols-1 2xl:grid-cols-2` เพื่อให้การ์ดมีพื้นที่กว้างเต็มแถวบนจอปกติ
    2. ออกแบบโครงสร้างภายใน `PaymentCard` ใหม่เป็น 3 ชั้น (Header: ป้ายสถานะ+เลขออเดอร์ | Body: รูปสลิป+ข้อมูลยอดเงิน | Footer: ปุ่มด้านล่างเต็มความกว้างคู่กัน)
  - *สถานะ:* ส่งมอบสมบูรณ์ ✅

- **ปัญหาปุ่มอนุมัติสลิปหน้าบ้านโดยไม่ได้ไปตรวจที่หน้าบิล และงานค้างที่ไม่ตรงกับสถานะจริง:**
  - *สาเหตุ:* พนักงานกดอนุมัติสลิปใน `PaymentCard` โดยไม่ได้เปิดดูรายการสินค้าในบิลจริง และหากออเดอร์ในหน้าบิลมีคนรับงานไปแล้วหรือถูกลบทิ้งไปแล้ว การ์ดใน Todo ไม่แสดงสถานะผู้รับงานและกลายเป็นงานค้างกำพร้า (Orphaned Task)
  - *วิธีแก้:*
    1. เปลี่ยนปุ่มอนุมัติเป็น **[ไปที่งาน]** ทำการ First-Touch Staff Assignment ลงชื่อผู้รับงานอัตโนมัติ แล้วนำทางไปยัง `/billing` พร้อมเปิดหน้าต่างบิลนั้นทันที
    2. ปรับมุมโค้งมนทุกจุดในการ์ดเป็น `rounded-[0.2rem]` ตามมาตรฐานระบบ
    3. ตรวจสอบสถานะคำสั่งซื้อจาก Firestore: หากมีผู้รับงานแล้วจะแสดงป้าย `รับงานแล้ว: คุณ{staffNickname}`, หากชำระแล้วแสดง `ชำระเงินแล้ว`, และหากออเดอร์ไม่มีในระบบจะแสดงปุ่มให้กดลบเคลียร์งานค้างได้ทันที
- **ปัญหา Modal ติดกับดักใน Card จนถูกตัดขอบ และการ์ดกระตุก/ช็อต/ค้าง (Dialog CSS Containing Block & Event Bubbling Trap):**
  - *สาเหตุ:* 
    1. `PremiumDialog` และ Image Modal ไม่ได้ถูกเรนเดอร์ผ่าน `createPortal` ไปยัง `document.body` เมื่อการ์ดหรือกริดครอบด้วย CSS `transform` (เช่น `animate-in slide-in-from-bottom-4`) หรือ `overflow-hidden` หน้าต่าง Modal จะติดกับดักในกรอบการ์ดแคบๆ และโดนตัดขอบด้านล่าง
    2. การ์ดตั้ง `onClick={() => setIsExpanded(!isExpanded)}` ไว้ที่กรอบนอกสุด เมื่อคลิกโดน Modal หรือปุ่มในหน้าต่าง กิจกรรมคลิกจะ Bubble ทะลุไปสั่งพับ/ขยายการ์ดซ้ำซ้อน ทำให้หน้าจอกระพริบและสั่นไหว
    3. สเตท `isSubmitting` ใส่ `pointer-events-none` ที่การ์ด ทำให้ Modal ที่อยู่ภายในการ์ดโดนบล็อกปุ่มจนกดอะไรไม่ได้ (ค้าง)
  - *วิธีแก้:* 
    1. อัปเกรด `PremiumDialog` และ Fullscreen Image Modal ให้เรนเดอร์ผ่าน `createPortal(..., document.body)` เสมอ เพื่อหลุดพ้นจากข้อจำกัด CSS Transform / Overflow
    2. ใส่ `e.stopPropagation()` บน Backdrop และ Modal Container ดักไม่ให้ Event คลิกหลุดรอดไปถึง Component แม่
    3. ย้ายจุดคลิกพับ/ขยายการ์ดใน `PaymentCard` มาไว้ที่ Header และปุ่ม "ดูรายละเอียด" โดยตรง ไม่ครอบคลุมทั้ง Card
    4. เพิ่ม Fallback การค้นหาออเดอร์ใน `PaymentCard` ด้วย `billingQueryService.getOrderByOrderId` ป้องกัน False Positive ไม่พบออเดอร์
  - *สถานะ:* ส่งมอบสมบูรณ์ ✅
</pitfalls_and_solutions>
