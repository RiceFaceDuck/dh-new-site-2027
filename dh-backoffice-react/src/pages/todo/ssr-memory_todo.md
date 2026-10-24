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
- Bundle & Cache Service: `Management System/dh-backoffice-react/src/firebase/todo/todoCatalogService.js`
- Firestore Collections:
  - `todos`: รายการงานปัจจุบัน
  - `catalogs/todos_completed_bundle`: ก้อน Snapshot Bundle งานที่เสร็จแล้ว มัดรวมได้ถึง 250 รายการต่อ 1 Document (อ่าน 1 Read ได้ครบ)
- LocalStorage Keys:
  - `dh_todos_completed_bundle_v1`: แคชก้อนงานที่เสร็จแล้ว (TTL 24 ชม.)
  - `dh_todos_completed_meta_v1`: เมทาดาต้าและ Timestamp ของแคช
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
- **ปัญหางานที่เสร็จ/ยกเลิก/ลบออเดอร์แล้วยังค้างบนกระดาน (Manual Cleanup Burden & Missing OrderId Sync):**
  - *สาเหตุ:* 
    1. เมื่อออเดอร์ในหน้า Billing ถูกชำระเงิน (`paid`/`completed`) หรือถูกยกเลิก (`cancelled`) ระบบไม่ได้ตั้ง Transaction อัปเดต Todo ที่ผูกกับ `orderId` ส่งผลให้การ์ดยังค้างเป็น `pending`
    2. เมื่อออเดอร์ถูกลบทิ้งใน `billingDeleteService` คำสั่ง Query ค้นหาเฉพาะ `referenceId` และ `payload.orderId` แต่ไม่ได้ค้นหาฟิลด์ `orderId` ทำให้ Todo กลายเป็นงานกำพร้า (Orphaned Task) และแสดงปุ่มลบงานค้างให้พนักงานต้องมากดลบเองทีละใบ
  - *วิธีแก้:* 
    1. เพิ่มการ Query และอัปเดต Todo ฟิลด์ `orderId` ให้เป็น `completed` อัตโนมัติใน `billingStatusTransaction` เมื่อบิลถูกชำระเงินหรืออนุมัติ
    2. เพิ่ม Query ฟิลด์ `orderId` ใน `billingDeleteService` เพื่อลบ Todo ที่เกี่ยวข้องทันทีเมื่อบิลถูกลบ
    3. ใน `PaymentCard` เมื่อตรวจพบว่าออเดอร์ชำระเงินแล้ว หรือไม่มีอยู่ในระบบ (ถูกลบ) ให้สั่ง Auto-complete / Auto-delete ไปยัง Firestore ทันที และซ่อนการ์ดออกไปจากหน้าจอโดยไม่ต้องรอให้ผู้ใช้มากดลบเอง
  - *สถานะ:* ส่งมอบสมบูรณ์ ✅

- **ปัญหางานรออนุมัติ (เคลม/คืน) แสดงเฉพาะหน้าผู้จัดการ แต่ไม่แสดงในหน้า To-do (Single Source of Truth Gap & Zone Over-Filtering):**
  - *สาเหตุ:* 
    1. ระบบเคลม/คืนสินค้าใช้คอลเลกชัน `claims` เป็น Single Source of Truth แต่ `useCentralTodo` ดึงข้อมูลจากคอลเลกชัน `todos` เพียงอย่างเดียว ทำให้งานเคลม/คืนหายไปจากหน้า To-do ทั้งหมด
    2. ใน `TodoPageList` มีการกรองฝั่งซ้ายด้วย `!isRead || !isUrgent` ทำให้เมื่อผู้ใช้เคยกดเปิดอ่านงานด่วนหรืองานร้านค้า (เช่น Namhom Software) งานนั้นจะถูกซ่อนออกจากกระดานฝั่งซ้ายโดยไม่ตั้งใจ
  - *วิธีแก้:* 
    1. ปรับปรุง `useCentralTodo` ให้ Subscribe ทั้งคอลเลกชัน `todos` และ `claims` แล้ว Merge ข้อมูลเข้าด้วยกันแบบ Real-time รองรับทั้งงานทั่วไปและงานเคลม
    2. ปรับ `TodoPageList` ฝั่งซ้ายให้แสดงผลงานทั้งหมดตามตัวกรอง (`return true`) ไม่ซ่อนงานที่ถูกเปิดอ่านหรืองานด่วนออกจากกระดานหลัก
    3. อัปเดต `Todo.jsx` ให้รองรับ `EXCHANGE_APPROVAL` และประเภทงานเคลม/คืนทุกชนิดอย่างครบถ้วน
  - *สถานะ:* ส่งมอบสมบูรณ์ ✅

- **ปัญหา UI การ์ดขอใบกำกับภาษีพัง ยุบตัวเป็นกล่องว่าง และข้อความซ้อนทับกัน (Tax Invoice Card UI Overlap & Accordion Trap):**
  - *สาเหตุ:* 
    1. ใน `TodoPageList` การ์ดอยู่ใน CSS Grid ที่ถูกครอบด้วย `h-full` ทำให้ยืดความสูงตาม `PaymentCard` (~240px) แต่ `TaxInvoiceCard` ในสถานะปกติ (`!isExpanded`) เรนเดอร์เฉพาะแถบ Header สั้นๆ ทำให้พื้นที่ด้านล่าง 80% กลายเป็นกล่องสีขาวว่างเปล่า
    2. Header มีการใส่ป้ายสถานะ, เลขออเดอร์, ข้อความรอดำเนินการ และวันเวลาแบบเต็ม (`toLocaleString()`) ยัดในแถวเดียวบนหน้าจอคอลัมน์ 300px จนข้อความซ้อนทับกันและเลขออเดอร์ถูกบีบหาย
    3. เมื่อกดขยายการ์ด ดันใช้ `grid-cols-1 lg:grid-cols-2` ภายในกล่องขนาด 300px ทำให้แต่ละคอลัมน์เหลือพื้นที่เพียง 130px และแตกคอลัมน์ย่อย 3 ช่องจนตัดคำภาษาไทยเละกระจัดกระจาย
    4. ใช้ `rounded-2xl` ซึ่งผิดมาตรฐานระบบที่ต้องใช้ `rounded-[0.2rem]`
  - *วิธีแก้:*
    1. ปรับโครงสร้างเป็นสถาปัตยกรรม 3 ชั้นตามมาตรฐาน DH Notebook (Header: ป้ายเขียว Teal + เลขออเดอร์ + รออัปโหลดเอกสาร + เวลาสั้น | Body: กล่องไอคอน Tax Invoice + ข้อมูลภาษีพร้อมปุ่มคัดลอก + ลิงก์ดูรายละเอียดแบบบรรทัดเดียวกว้างเต็มช่อง | Footer: ปุ่มคู่ [ไปที่งาน] และ [อัปโหลดเอกสาร])
    2. แยกส่วนอัปโหลดไฟล์ไปไว้ใน Modal Dialog ผ่าน `createPortal(..., document.body)` เพื่อให้มีพื้นที่กว้างขวาง ลากไฟล์วางสะดวก และไม่ถูกตัดขอบด้วย CSS Transform/Overflow ของการ์ด
    3. บังคับใช้ `rounded-[0.2rem]` ทุกจุดตามมาตรฐานระบบ
  - *สถานะ:* ส่งมอบสมบูรณ์ ✅

- **ปัญหาการแสดงเลขที่บิลไม่ถูกต้อง, ปุ่มไปที่งานไม่เปิดบิล, และการอัปโหลดเอกสารทับซ้อน (Tax Invoice Card End-to-End Workflow Parity):**
  - *สาเหตุ:* 
    1. ใน `TaxInvoiceCard` ใช้ `orderId.slice(-8)` ทำให้รหัสบิลชั่วคราว เช่น `DH-TEMP-261019-172249-3418` ถูกตัดเหลือ `220-3418` และเมื่อบิลกลายเป็นเลขทางการ (`DH-26-0052`) การ์ดไม่ได้ตามไปดึงเลขออเดอร์จริง
    2. ปุ่ม [ไปที่งาน] ส่ง `orderId` ไปยัง `/billing` แต่ `BillingDashboard` ตรวจสอบเฉพาะ `o.id` และ `o.orderId` ไม่ได้ตรวจสอบ `draftOrderId` หรือตามไปยังเอกสารที่ถูกแทนที่ (`supersededBy`) ทำให้ไม่พบและไม่เปิด Modal บิล
    3. จุดอัปโหลดเอกสารทับซ้อนกัน 2 จุด (กล่อง Thumbnail ด้านซ้าย และปุ่มอัปโหลดเอกสารด้านล่าง)
    4. ตารางบิล (`OrderListTable`) ไม่แสดงป้ายขอใบกำกับภาษี เพราะ `orderSyncService` ไม่ได้ Project ฟิลด์ `taxInvoice`, `hasPendingTax` ลงในแคตตาล็อก `recent_orders`
    5. หน้าประวัติคำสั่งซื้อ (`dh-servicehub.com/profile?tab=history`) ไม่มีป้ายแจ้งว่าขอใบกำกับภาษี และไม่มี Pop-up เมื่อเจ้าหน้าที่ขอข้อมูลเพิ่มเติม
  - *วิธีแก้:* 
    1. ปรับปรุง `TaxInvoiceCard` ให้ดึงข้อมูลบิลจริงจาก Firestore พร้อมตาม `supersededBy` และจัดรูปแบบเลขออเดอร์ให้อ่านง่าย (`DH-26-XXXX` หรือ `DH-TEMP-XXXX`) ไม่ตัดทอนผิดพลาด
    2. ปรับปรุง `BillingDashboard` ให้ค้นหาครอบคลุม `draftOrderId`, `originalDraftId` และ `supersededBy` เพื่อเปิดหน้าต่างรายละเอียดบิลได้ทันทีเมื่อกด [ไปที่งาน]
    3. ยุบจุดอัปโหลดซ้ำซ้อน: กล่อง Thumbnail ด้านซ้ายคงไว้สำหรับคลิกอัปโหลดไฟล์ใบกำกับภาษี ส่วนปุ่มขวาล่างเปลี่ยนเป็น **[ขอข้อมูลกับลูกค้าใหม่อีกครั้ง]** พร้อม Dialog ระบุหมายเหตุและข้อความสำเร็จรูป
    4. ปรับปรุง `orderSyncService` และ `OrderTableRow` ให้ซิงก์และแสดงป้าย `📄 ภาษี (รอ)`, `📄 ภาษี (ออกแล้ว)` และ `⚠️ ภาษี (รอข้อมูลใหม่)` ในตารางบิล
    5. สร้าง `CustomerTaxInfoModal` ใน Storefront (`dh-frontend`) พร้อม Pop-up แจ้งเตือนและปุ่มกรอกข้อมูลใหม่ รวมถึงป้ายกำกับและปุ่มดาวน์โหลดใบกำกับภาษี (PDF) ครบวงจร
  - *สถานะ:* ส่งมอบสมบูรณ์ ✅

- **ปัญหาความสับสนระหว่าง Task ID กับ Customer ID บนการ์ดอนุมัติร้านค้า/โฆษณา (Store Profile & Ad Approval ID Parity):**
  - *สาเหตุ:* 
    1. บนการ์ด `StoreProfileApprovalCard` และ `AdApprovalCard` เดิมแสดงเพียง `#{todo.id?.slice(-8).toUpperCase()}` ซึ่งเป็น 8 ตัวท้ายของ Task ID (เช่น `TODO-AD-CARD-...IP2wwPu2` -> `#IP2WWPU2`) ทำให้ผู้ใช้งานเข้าใจผิดว่าเป็น Customer ID และเมื่อนำไปค้นหาในหน้ารายชื่อลูกค้าจึงหาไม่พบ เพราะ Customer ID จริงคือ 8 ตัวแรกของ UID (`JMSIF3BF`)
    2. ในระบบฐานข้อมูลของลูกค้าที่สมัครผ่าน Google Auth บางรายเก็บเบอร์โทรในฟิลด์ `phoneNumber` แต่ `customerSearchService` เดิมตรวจสอบเฉพาะ `phone`, `tel`, และ `mobile` ทำให้การค้นหาด้วยเบอร์โทรหลุดรอดไป
  - *วิธีแก้:* 
    1. เพิ่มการแสดงป้าย **`ID: [Customer ID]`** ที่โดดเด่นบนการ์ด พร้อมปุ่มคลิกเพื่อคัดลอก (Click-to-Copy) โดยดึงจาก `accountId` / `customerId` หรือสกัดจาก 8 ตัวแรกของ Partner UID และแยกป้าย Task ID ไว้ชัดเจน
    2. บันทึก `accountId` และ `customerId` แนบลงใน `todoPayload` และ `adPayload` ใน `storeProfileSubmitService.js` ตั้งแต่ต้นทาง
    3. เสริม Query `where('phoneNumber', '==', searchTarget)` ใน `customerSearchService.js` เพื่อให้ค้นหาลูกค้าด้วยเบอร์โทรศัพท์ได้ครบทุกรูปแบบ
  - *สถานะ:* ส่งมอบสมบูรณ์ ✅
- **ปัญหาเมนู To-do บนแถบ Sidebar ไม่แสดงตัวเลขแจ้งเตือนงานค้าง และป้ายแจ้งเตือนกลืนกับพื้นหลัง (Sidebar Notification Badge Disconnect & Low Contrast):**
  - *สาเหตุ:* 
    1. ฟังก์ชัน subscribePendingTodos ใน 	odoQueryService.js เดิมใส่ตัวกรอง !MANAGER_TASK_TYPES.includes(currentType) ทำให้งานประเภทอนุมัติร้าน/โฆษณา (AD_APPROVAL, PARTNER_APPROVAL) หรือขอราคาส่ง ถูกตัดทิ้งจนตัวนับกลายเป็น  แม้ว่าบนกระดาน /todo จะมีงานค้างแสดงอยู่จริง
    2. ป้ายแจ้งเตือนบน Sidebar เดิมใช้สีชมพูจาง g-red-100 text-red-600 เมื่อไม่ได้เลือกเมนู และใช้สีขาวโปร่งแสง g-white/20 เมื่อเลือกเมนู ทำให้ตัวเลขกลืนไปกับพื้นหลังและมองเห็นได้ยากมาก
  - *วิธีแก้:* 
    1. ปรับปรุง subscribePendingTodos ให้นับงานค้างจริงทุกประเภทในศูนย์ปฏิบัติการ 	odos โดยไม่ตัดกลุ่มงานผู้จัดการออก พร้อมเสริมสถานะ 'processing' ให้ครอบคลุมสอดคล้องกับ useCentralTodo
    2. ยกระดับสไตล์ป้ายแจ้งเตือนใน Sidebar.jsx เป็น Solid Vivid Red Alert (g-rose-500 text-white font-black shadow-xs) เมื่อไม่ได้เลือกเมนู และเพิ่มขอบขาวคมชัด (ing-2 ring-white) เมื่อเลือกเมนู (ปุ่มน้ำเงิน) ทำให้ตัวเลขเด่นชัดสะดุดตาทันที
  - *สถานะ:* ส่งมอบสมบูรณ์ ✅
- **การปรับปรุงตัวกรอง To-do ให้เป็นตามสถานะงาน (ทั้งหมด / ยังไม่ดำเนินการ / เสร็จแล้ว) พร้อม On-Demand Lazy-Load:**
  - *สาเหตุ:* ตัวกรองเดิมแบ่งตามประเภทเอกสาร (ตรวจสลิป, ภาษี, เคลม, ราคาส่ง, อนุมัติร้าน) และดึงงานเก่าที่เสร็จแล้วมาแสดงโดยไม่จำเป็น ทำให้เปลืองโควต้าอ่าน (Reads)
  - *วิธีแก้:*
    1. ปรับค่าเริ่มต้น (Default) ของหน้า `/todo` ให้เป็น **"ยังไม่ดำเนินการ" (`PENDING`)** เปิดมาเจอเฉพาะงานค้างจริงที่ต้องทำ
    2. นำการดึงงานเสร็จแล้วออกจากจุดเริ่มต้น และปรับปรุง `useCentralTodo.js` เป็นระบบ **Lazy-load On-Demand**: จะดึงงานที่เสร็จแล้วเฉพาะเมื่อผู้ใช้คลิกแท็บ "เสร็จแล้ว" หรือ "ทั้งหมด" เท่านั้น ประหยัดโควต้าอ่าน 100% ตอนเปิดใช้งานปกติ
    3. ปรับปรุง `TodoPageFilterBar.jsx` เป็น 3 ปุ่มสถานะ: [ทั้งหมด] (Slate), [ยังไม่ดำเนินการ] (Amber), [เสร็จแล้ว] (Emerald) พร้อมป้ายตัวเลขนับจำนวนแต่ละกลุ่ม
    4. ปรับปรุง `TodoPageList.jsx` และ `TodoItem.jsx` ให้แสดงป้ายสถานะ '✅ เสร็จแล้ว', '❌ ปฏิเสธ', '⚪ ยกเลิก' ชัดเจนสวยงาม
  - *สถานะ:* ส่งมอบสมบูรณ์ ✅
- **การยกระดับความประหยัดโควต้าอ่านสูงสุด (Maximum Savings / Zero-Waste Reads): สถาปัตยกรรม 4 เสาหลัก Snapshot Bundle + LocalStorage Cache + In-Memory Transition + Listener Caps:**
  - *เป้าหมาย:* แก้ปัญหาความสิ้นเปลืองของ Firestore Reads ที่ต้องอ่านงานที่เสร็จแล้วใบละ 1 Read โดยยึดความต้องการของพี่ "ดึงช้าไม่เป็นไร แต่ต้องประหยัดที่สุด"
  - *วิธีแก้ (4 เสาหลัก):*
    1. **Snapshot Bundle Document (`catalogs/todos_completed_bundle`):** มัดรวมประวัติงานที่เสร็จแล้วเก็บเป็นก้อนเดียวใน Firestore (สูงสุด 250 รายการต่อเอกสาร ~100KB) ทำให้การอ่าน 250 งาน เสียเพียง **1 Read เดียวเท่านั้น** แทนที่จะเป็น 250 Reads
    2. **LocalStorage Cache-First (`todoCatalogService.js`):** แคชก้อนงานที่เสร็จแล้วลง LocalStorage (TTL 24 ชม.) ทำให้การสลับแท็บไปดู "เสร็จแล้ว" ในการใช้งานปกติเสีย **0 Reads** พร้อมปุ่ม [🔄 รีเฟรช] สำหรับกดดึงก้อน Snapshot ใหม่สดๆ เมื่อต้องการ
    3. **In-Memory & Action Sync:** เมื่อพนักงานกดอนุมัติ/ปฏิเสธงานบนหน้าจอ ระบบจะย้ายงานเข้าก้อนแคชในเครื่องทันที และซิงก์ขึ้น Bundle doc ในเบื้องหลัง ทำให้ไม่ต้องยิง Query ดึงซ้ำ (**0 Reads**)
    4. **Listener Cap:** ลดเพดาน `limit` ของ Active Listeners ทั้ง `todos` และ `claims` จากเดิม 200-300 เหลือ **50 รายการ** ซึ่งพอดีกับงานค้างจริง ช่วยประหยัด Reads รายวันได้มหาศาล
    5. อัปเกรด `TodoArchive.jsx` ให้ใช้งาน `fetchCompletedTodosBundle` ด้วย ทำให้พื้นที่จัดเก็บงานทั้งระบบใช้ Snapshot ร่วมกัน
  - *สถานะ:* ส่งมอบสมบูรณ์ ✅
</pitfalls_and_solutions>
