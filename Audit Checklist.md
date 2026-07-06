# DH NOTEBOOK AUDIT DATA (DH Web Audit Standard v1.0 - AI-Optimized)
# AI Search Guide: Use `grep_search` with tags like `@PHASE:Phase1`, `@SEV:🔴Critical`, `@STAT:🟡PENDING` for rapid retrieval.
# --- Legend ---
# Phases: @PHASE:Phase1 (Project Structure) | @PHASE:Phase2 (Frontend Audit) | @PHASE:Phase3 (Code Audit) | @PHASE:Phase4 (Production Audit)
# Status: 🟢PASS | 🔴FAIL | 🔵IN_PROGRESS | 🟡PENDING | ⚪N/A
# Severity: 🔴Critical | 🟠High | 🟡Medium | ⚪Low

# =====================================================================
# 🗺️ 0. AUDIT STRUCTURE MAP (แผนผังการตรวจงาน)
# =====================================================================
# PHASE 1: Project Structure & Foundation (โครงสร้างโปรเจกต์และส่วนกำหนดค่า)
@ID:P1-STR-005 | @PHASE:Phase1 | @CAT:STR | @SEV:🟡Medium | @STAT:🟡PENDING | @EV:None | @REF:DH Project Architecture | @TASK: Verify that Hooks dependency arrays are clean and free of redundant variables to prevent infinite rendering
@ID:P1-STR-006 | @PHASE:Phase1 | @CAT:STR | @SEV:⚪Low | @STAT:🟡PENDING | @EV:None | @REF:DH Project Architecture | @TASK: Verify that React.StrictMode compatibility is maintained across all modules


# PHASE 2: Frontend & UX Audit (ประสบการณ์ผู้ใช้และการทำงานหน้าบ้าน)
@ID:P2-PER-026 | @PHASE:Phase2 | @CAT:PER | @SEV:🟡Medium | @STAT:🟡PENDING | @EV:None | @REF:React Query & Local Caching Guidelines | @TASK: Verify that large lists use virtual lists/windowing (react-window) to prevent DOM bloat
@ID:P2-PER-027 | @PHASE:Phase2 | @CAT:PER | @SEV:⚪Low | @STAT:🟡PENDING | @EV:None | @REF:React Query & Local Caching Guidelines | @TASK: Verify that image lazy loading is enabled for all non-critical assets

@ID:P2-UX-026 | @PHASE:Phase2 | @CAT:UX | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified; reset selectedVariantState on id/searchParams changes in ProductDetail.jsx | @REF:DH Project Architecture | @TASK: Verify that product variant selection state resets when switching products via related links

# PHASE 3: Code Quality, Architecture & Database (สถาปัตยกรรม คุณภาพโค้ด และ Firebase)
@ID:P3-COST-016 | @PHASE:Phase3 | @CAT:COST | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified; Manual inspection confirms no duplicate onSnapshot leaks or N+1 update loops exist in the codebase | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify that duplicate Firestore read queries and identical onSnapshot listeners are avoided
@ID:P3-COST-017 | @PHASE:Phase3 | @CAT:COST | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified; system uses persistentLocalCache for offline persistence and cache hitting | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify that Firestore collection query caching hit rate and offline persistence coverage match policies
@ID:P3-DATA-025 | @PHASE:Phase3 | @CAT:DATA | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified; Codebase consistently uses serverTimestamp and runTransaction for critical data writes | @REF:Firestore Transactions & Schema | @TASK: Verify timestamp consistency across all write transactions (use serverTimestamp)
@ID:P3-DATA-026 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟡PENDING | @EV:None | @REF:Firestore Transactions & Schema | @TASK: Verify that reference integrity is maintained to prevent orphan records on soft delete
@ID:P3-ARCH-015 | @PHASE:Phase3 | @CAT:ARCH | @SEV:🟠High | @STAT:🟡PENDING | @EV:None | @REF:None | @TASK: Verify React Context Splitting to prevent unnecessary re-renders of components consuming global state

@ID:P3-COST-018 | @PHASE:Phase3 | @CAT:COST | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified; removed unused permissionRequested state and callback dependency in useNearbyPartners.js, preventing double fetches | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify that Home page nearby partners geolocation queries do not duplicate on mount
@ID:P3-COST-019 | @PHASE:Phase3 | @CAT:COST | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified; added appliedPromotions to useEffect dependencies array in useCheckoutLogic.js | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify that credit points deduction limits recalculate automatically when checkout promotions change

# PHASE 4: Production, Security & DevOps (ความปลอดภัย Hosting และ CI/CD)
# =====================================================================

# =====================================================================
# 🗺️ PHASE 1: Project Structure & Foundation (โครงสร้างโปรเจกต์และส่วนกำหนดค่า)
# =====================================================================
@ID:P1-STR-001 | @PHASE:Phase1 | @CAT:STR | @SEV:🟡Medium | @STAT:🟡PENDING | @EV:None | @REF:DH Project Architecture | @TASK: Verify that Folder Structure & Feature Isolation Audit (การแยกโฟลเดอร์ตาม Feature และโมดูลอย่างเป็นระเบียบ)
@ID:P1-STR-002 | @PHASE:Phase1 | @CAT:STR | @SEV:🟡Medium | @STAT:🟡PENDING | @EV:None | @REF:DH Project Architecture | @TASK: Verify that Naming Convention Audit (การตรวจสอบโครงสร้างการตั้งชื่อ Component, Hooks, และ Service)
@ID:P1-STR-003 | @PHASE:Phase1 | @CAT:STR | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified; Removed unused packages (framer-motion, html5-qrcode, react-qr-code) and safely patched npm vulnerabilities across all modules. | @REF:DH Project Architecture | @TASK: Verify that Dependency & Package Audit (ตรวจสอบ package.json เพื่อหาไลบรารีที่ไม่ได้ใช้งานหรือซ้ำซ้อน)
@ID:P1-STR-004 | @PHASE:Phase1 | @CAT:STR | @SEV:⚪Low | @STAT:🟡PENDING | @EV:None | @REF:DH Project Architecture | @TASK: Verify that Asset Organization & Optimization (การเก็บรูปภาพ โลโก้ ไอคอน SVG และลดขนาดไฟล์ก่อนใช้)
@ID:P1-OPS-001 | @PHASE:Phase1 | @CAT:OPS | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:Firebase Hosting Multi-Site Setup | @TASK: Verify that Environment Variables Setup (แยก .env สำหรับ Dev, Staging, Prod)

# =====================================================================


# 🗺️ PHASE 2: Frontend & UX Audit (ประสบการณ์ผู้ใช้และการทำงานหน้าบ้าน)
# =====================================================================
@ID:P2-A11Y-001 | @PHASE:Phase2 | @CAT:A11Y | @SEV:⚪Low | @STAT:🟡PENDING | @EV:None | @REF:WCAG 2.2 | @TASK: Verify Accessibility (A11y) standards: aria-labels, semantic HTML, and keyboard navigation
@ID:P2-SEO-001 | @PHASE:Phase2 | @CAT:SEO | @SEV:🟡Medium | @STAT:🟡PENDING | @EV:None | @REF:Google Search Essentials | @TASK: Verify that SEO Best Practices Audit (ตรวจสอบ meta tags, title, และโครงสร้าง headings ห้ามมี h1 เกิน 1 ตัว)
@ID:P2-RSP-001 | @PHASE:Phase2 | @CAT:RSP | @SEV:🟡Medium | @STAT:🟡PENDING | @EV:None | @REF:None | @TASK: Verify that Responsive Layout Audit (ตรวจสอบการทำงานบน Mobile, Tablet, Desktop ทุกเบราว์เซอร์หลัก)
@ID:P2-UX-001 | @PHASE:Phase2 | @CAT:UX | @SEV:🟠High | @STAT:🟢PASS | @EV:Handled native alerts in BottomNav | @REF:None | @TASK: Verify that Error Handling (Clear alerts, prevent crashes)
@ID:P2-UX-002 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Handled fallback and empty states | @REF:None | @TASK: Verify that State Resilience (Offline/Network retry)
@ID:P2-DOC-001 | @PHASE:Phase2 | @CAT:DOC | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:In-App Documentation Standards | @TASK: Verify that In-App Documentation (Guide/Tooltip in Backoffice)
@ID:P2-DOC-002 | @PHASE:Phase2 | @CAT:DOC | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:In-App Documentation Standards | @TASK: Verify relationship detail: ตรวจสอบคู่มือ/คำอธิบายในหน้า Manager Settings -> Ads
@ID:P2-DOC-003 | @PHASE:Phase2 | @CAT:DOC | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:In-App Documentation Standards | @TASK: Verify relationship detail: ตรวจสอบคู่มือ/คำอธิบายในหน้า Manager Settings -> Inventory
@ID:P2-DOC-004 | @PHASE:Phase2 | @CAT:DOC | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:In-App Documentation Standards | @TASK: Verify relationship detail: ตรวจสอบคู่มือ/คำอธิบายในหน้า Manager Settings -> Shipping
@ID:P2-DOC-005 | @PHASE:Phase2 | @CAT:DOC | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:In-App Documentation Standards | @TASK: Verify relationship detail: ตรวจสอบและอัปเกรดคู่มือ In-App Documentation ในระบบ Product Search (ManualModal)
@ID:P2-UX-003 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Added Search overlay, Breadcrumbs | @REF:None | @TASK: Verify that Premium UX/UI (Modern UI, Micro-interactions)
@ID:P2-UX-004 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟢PASS | @EV:CartItemCard debounced with loader | @REF:None | @TASK: Verify that Optimistic UI (Fast response, instant update)
@ID:P2-SEC-001 | @PHASE:Phase2 | @CAT:SEC | @SEV:🟠High | @STAT:🟡PENDING | @EV:None | @REF:OWASP / Firebase Security Rules | @TASK: Verify that User Action Confirmations (Alert before delete/edit)
@ID:P2-UX-005 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟡PENDING | @EV:None | @REF:None | @TASK: Verify that [APP:StaffApp] ตรวจสอบความง่ายในการใช้งานบนมือถือ (Mobile-First Touch UI)
@ID:P2-UX-006 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that [APP:Frontend] ป้องกันสินค้าหายจากตะกร้าโดยไม่ตั้งใจ (เพิ่ม window.confirm เมื่อ qty=0)
@ID:P2-UX-007 | @PHASE:Phase2 | @CAT:UX | @SEV:⚪Low | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that [APP:Frontend] ปิด Gimmick แจ้งเตือนหลอกตาใน Navbar เพื่อป้องกันความสับสน
@ID:P2-UX-008 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that [APP:Frontend] เปลี่ยนระบบแจ้ง Error ในหน้า Checkout เป็น Toast Notification เพื่อไม่ให้เสีย Flow การกรอกข้อมูล
@ID:P2-DOC-006 | @PHASE:Phase2 | @CAT:DOC | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:In-App Documentation Standards | @TASK: Verify that [APP:Frontend] เพิ่ม Tooltip อธิบายการใช้งานระบบ Wallet ในหน้า Checkout
@ID:P2-UX-009 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify Favorites upgrade features: รองรับ List View, Notes และ Tags เพื่อ Support ลูกค้าประจำ
@ID:P2-UX-010 | @PHASE:Phase2 | @CAT:UX | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify Frontend UX audit features: นำ Alert ออกจากตะกร้า, จัดระเบียบ Checkout แบบ Accordion, เพิ่ม Code Splitting, รองรับ Variant Sync URL
@ID:P2-UX-011 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify Favorites upgrade features: เพิ่ม Simulator คำนวณราคา, การจัดการเมื่อสินค้าหมดสต๊อก (Restock Alert/LINE), และแสดงจำนวนในตะกร้า
@ID:P2-UX-012 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Update Inventory UI & POS SearchArea to display inactive (isActive: false) products with a warning indicator/Smart Tooltip instead of removing them.
@ID:P2-UX-013 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that Enhance To-do Dashboard cards (Generic, Payment, Tax, Wholesale) with Priority Color Coding and hover effects.
@ID:P2-UX-014 | @PHASE:Phase2 | @CAT:UX | @SEV:⚪Low | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that Add "Secure Checkout" badge and Toast notifications in POS PaymentActions.
@ID:P2-UX-015 | @PHASE:Phase2 | @CAT:UX | @SEV:⚪Low | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that Add Skeleton Loaders in POS search/data fetching.
@ID:P2-UX-016 | @PHASE:Phase2 | @CAT:UX | @SEV:🟠High | @STAT:🟢PASS | @EV:เพิ่ม Auto-scroll เมื่อลืมเลือก Variant, กันเผลอลบตะกร้า (disable minus if qty=1) และเพิ่ม Accordion Summary ใน Checkout | @REF:None | @TASK: Verify that [APP:Frontend] ยกระดับ Premium UX/UI
@ID:P2-UX-017 | @PHASE:Phase2 | @CAT:UX | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that [APP:Frontend] เพิ่ม Cross-selling (Related Products) ท้ายหน้า Product Detail เพื่อกระตุ้นยอดขาย
@ID:P2-UX-018 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that เปลี่ยนปุ่มถอนเงินเป็นปุ่ม "ขอคืนเงิน (LINE)" ในหน้า Wallet ของลูกค้า
@ID:P2-FEAT-001 | @PHASE:Phase2 | @CAT:FEAT | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that เพิ่มแถบแสดงโปรโมชัน (Active Promotions Banner) ในหน้า Cart เพื่อกระตุ้นยอดขาย
@ID:P2-FEAT-002 | @PHASE:Phase2 | @CAT:FEAT | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that พัฒนา UX/UI ปุ่มสั่งสินค้า (เตือนแนบสลิปนับถอยหลัง) และระบบปฏิเสธสลิปพร้อมระบุเหตุผล (Backoffice)
@ID:P2-FEAT-003 | @PHASE:Phase2 | @CAT:FEAT | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that เพิ่มระบบระบุสถานะจัดส่ง (แจ้งเลขพัสดุ / ส่งมอบหน้าร้าน) ในหน้ารายละเอียดบิล (Backoffice)
@ID:P2-FEAT-004 | @PHASE:Phase2 | @CAT:FEAT | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified; added columns for Staff Name (เจ้าหน้าที่) and After-Sales Service tags (เคลม, เปลี่ยน, ใบกำกับภาษี) to OrderListTable and OrderTableRow | @REF:None | @TASK: Verify that billing table displays staff name and after-sales service badges (claim, exchange, tax invoice)
@ID:P2-UX-019 | @PHASE:Phase2 | @CAT:UX | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that Centralized ToastContext to prevent notification conflicts and crashes
@ID:P2-UX-020 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that Add missing Loading State for Cart freebies to prevent UI shift
@ID:P2-UX-021 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that Add Fallback Icon (Package) for Categories without images in CategoryCard
@ID:P2-UX-022 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that Add In-App Documentation for Category Management in Backoffice
@ID:P2-UX-023 | @PHASE:Phase2 | @CAT:UX | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that [APP:Frontend] เพิ่มช่องค้นหาบน Mobile SearchPage กู้คืนความสามารถในการค้นหาสินค้าบนมือถือ
@ID:P2-UX-024 | @PHASE:Phase2 | @CAT:UX | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that [APP:Frontend] ปลดล็อก disabled ปุ่ม ADD TO CART เพื่อให้ Logic การสั่นสะเทือนสเปก/รุ่นย่อยทำงานปกติ
@ID:P2-UX-025 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that [APP:Frontend] เปลี่ยนตัวโหลดเต็มจอขณะกดชำระเงินของ Cart.jsx เป็น Inline Loading ป้องกัน UI ดับกระพริบ
@ID:P2-UX-027 | @PHASE:Phase2 | @CAT:UX | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified; check fresh.stockQuantity - currentQty < fresh.bufferStock in Cart.jsx to block checkout early | @REF:None | @TASK: Verify that [APP:Frontend] ตะกร้าสินค้าออนไลน์ตรวจสอบเงื่อนไข Buffer Stock ก่อนกดชำระเงิน

# =====================================================================

# 🗺️ PHASE 3: Code Quality, Architecture & Database (สถาปัตยกรรม คุณภาพโค้ด และ Firebase)
# =====================================================================
@ID:P3-CODE-001 | @PHASE:Phase3 | @CAT:CODE | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified; cleaned up package.json vulnerabilities (esbuild, undici) and unused configurations. Pending manual `npm install` by user due to EBUSY. | @REF:Clean Code & ESLint Standards | @TASK: Verify that Clean Code & ESLint Setup (ตรวจสอบ code duplication, console logs ตกค้าง และตั้งค่ากฎ linter)
@ID:P3-CODE-002 | @PHASE:Phase3 | @CAT:CODE | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified; comprehensive audit confirms all setInterval/setTimeout cleared, EventListeners paired, onSnapshot subscriptions cleaned, and robust try-catch handling across services. No infinite loops detected. | @REF:None | @TASK: Verify Code Stability (Memory Leaks, Infinite Loops, Unhandled Exceptions)
@ID:P3-ARCH-001 | @PHASE:Phase3 | @CAT:ARCH | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified; Added ErrorBoundary to Backoffice main.jsx | @REF:None | @TASK: Verify that React Error Boundaries (ตรวจสอบการทำ Error Boundaries เพื่อป้องกัน App Crash ทั้งระบบเมื่อเจอ JS error)
@ID:P3-TEST-001 | @PHASE:Phase3 | @CAT:TEST | @SEV:🟡Medium | @STAT:🟡PENDING | @EV:None | @REF:Jest & React Testing Library Standards | @TASK: Verify that Unit Testing Setup (ตรวจสอบการติดตั้งและตั้งค่า Jest/React Testing Library สำหรับฟังก์ชันหลัก)
@ID:P3-DATA-001 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify that Strict Data Relations (Check before delete/edit to prevent orphaned data)
@ID:P3-DATA-002 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify relationship detail: ตรวจสอบผลกระทบเมื่อมีการลบ Category กับ Product ที่อ้างอิงอยู่
@ID:P3-DATA-003 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify relationship detail: ตรวจสอบผลกระทบเมื่อมีการลบ Product กับ Cart Items/Orders ที่ค้างอยู่
@ID:P3-DATA-004 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify relationship detail: เพิ่มการ Validate SKUs ใน Promotions/Freebies ก่อนบันทึกเพื่อป้องกัน Orphaned Data
@ID:P3-DATA-005 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify relationship detail: เพิ่ม Cascade Update ปิดร้าน Partner และยกเลิก To-do ค้างเมื่อ User ถูกระงับหรือลบบัญชี
@ID:P3-DATA-006 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify relationship detail: ระบบคืนโควตาโปรโมชันและของแถม (Reversal) เมื่อมีการยกเลิกบิล
@ID:P3-DATA-007 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify relationship detail: กู้คืนสถานะ Partner กลับเข้าแผนที่เมื่อมีการ Reject โฆษณาที่รอตรวจสอบ
@ID:P3-DATA-008 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify relationship detail: บังคับ Snapshot ราคาและชื่อสินค้า (priceAtPurchase, nameAtPurchase) ใน OrderItem
@ID:P3-DATA-009 | @PHASE:Phase3 | @CAT:DATA | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify relationship detail: ป้องกัน Todo Context Loss โดยแนบ Snapshot ไว้ใน payload ของงาน Manager
@ID:P3-DATA-010 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify relationship detail: ระบบควบรวมบัญชีลูกค้า (Account Merge) จาก Manual ไปยัง Web Account พร้อมโอนย้ายข้อมูล Orders, Todos, Claims, Partners ป้องกันข้อมูลกำพร้า
@ID:P3-SEC-001 | @PHASE:Phase3 | @CAT:SEC | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:OWASP / Firebase Security Rules | @TASK: Verify that Safe Deletion (Soft Delete/History)
@ID:P3-DATA-011 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Fixed with robust runTransaction | @REF:Firestore Transactions & Schema | @TASK: Verify that [DOMAIN:Inventory] ป้องกันการขายสินค้าเกินสต๊อก (Race Condition during checkout)
@ID:P3-DATA-012 | @PHASE:Phase3 | @CAT:DATA | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify that [DOMAIN:Claims] ตรวจสอบการรับของแถมคืนใน To-do (Return Items Freebie Check & Penalty Deduction)
@ID:P3-DATA-013 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify relationship detail: Sync คะแนนจาก creditPoints ลง ActivePartners ใน Transaction เดียวกันเพื่อป้องกัน Denormalization Issue
@ID:P3-DATA-014 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify that [DOMAIN:Inventory] ตรวจสอบและคลีน UUID ขยะใน compatiblePartNumbers พร้อมอัปเดต Schema และเพิ่ม Tooltip
@ID:P3-DATA-015 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify that อุดช่องโหว่โควต้าโปรโมชัน (Promotion Quota Leak) ด้วยการตัด Quota เมื่อบิล Approved/Paid และเช็ค Real-time ก่อนสร้างบิล
@ID:P3-DATA-016 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify that ปรับจูนนโยบายโปรโมชัน (Best Promo Only) ให้หน้าร้านและหลังบ้านทำงานเหมือนกัน (1 บิล 1 สิทธิ์ที่ดีที่สุด)
@ID:P3-PER-001 | @PHASE:Phase3 | @CAT:PER | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:React Query & Local Caching Guidelines | @TASK: Verify that เปิดใช้งาน Firebase Offline Persistence และ React Query Persister (Local Caching) ในระบบ Backoffice เพื่อลด Quota Reads อย่างมหาศาล
@ID:P3-DATA-017 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify that ปรับปรุงระบบ GAS Sync เป็นแบบ Synchronous (forceSync ทันทีที่ตัดสต๊อก) ป้องกันคิวหายเมื่อผู้ใช้ปิดหน้าจอ
@ID:P3-DATA-018 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify that [DOMAIN:Claims] อุดช่องโหว่การยกเลิกเคลม/คืน (Cancel Claim/Return) ให้หักลบสต๊อกของเสีย (Defect Stock) และคำนวณหักค่าปรับของแถมคืนให้ถูกต้อง
@ID:P3-DATA-019 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Implement useAutoCleanup hook in backoffice to automatically cancel 24-hour pending orders and reverse wallets/quotas.
@ID:P3-DATA-020 | @PHASE:Phase3 | @CAT:DATA | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Modify billingStatusTransaction.js to automatically cancel related pending todos when an order is cancelled.
@ID:P3-DATA-021 | @PHASE:Phase3 | @CAT:DATA | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Implement categorySyncService.js to handle batch renaming of categories across products, homepage_categories, and settings/product_categories.
@ID:P3-COST-001 | @PHASE:Phase3 | @CAT:COST | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Frontend Categories & System-wide Todo Leaks Done | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify that Cost-Effective Queries (Reduce unnecessary Reads/Writes)
@ID:P3-COST-002 | @PHASE:Phase3 | @CAT:COST | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify relationship detail: ตรวจสอบการใช้งาน Zero-Read Search & Hybrid Cache ใน Product Search
@ID:P3-PER-002 | @PHASE:Phase3 | @CAT:PER | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:React Query & Local Caching Guidelines | @TASK: Verify relationship detail: อัปเกรดหน้า ProductDetail ให้ใช้ Real-time `onSnapshot` เพื่อความสดใหม่ของราคา/สต๊อก (ป้องกัน Bait & Switch)
@ID:P3-COST-003 | @PHASE:Phase3 | @CAT:COST | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify relationship detail: อัปเกรด Cart Validation ให้ดึงข้อมูลแบบ Batch (where in chunk) ลด Connection และเพิ่มความเร็วในการยืนยันสั่งซื้อ
@ID:P3-COST-004 | @PHASE:Phase3 | @CAT:COST | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify relationship detail: อัปเกรดการดึงชื่อของแถมในหน้าสรุปออเดอร์โดยใช้ Hybrid Cache จาก sessionStorage แทนการดึง Firestore ทีละชิ้น (N+1 Query)
@ID:P3-COST-005 | @PHASE:Phase3 | @CAT:COST | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify relationship detail: อัปเกรดคิวรี To-do และ Claims ให้รัน orderBy('createdAt', 'desc') ป้องกันข้อมูลตกหล่นเมื่อเกิน limit
@ID:P3-COST-006 | @PHASE:Phase3 | @CAT:COST | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify relationship detail: ปรับแต่งการดึงราคาส่งในการ์ดงานปกติ (WholesaleCard) ให้ใช้ Hybrid Cache + Lazy Loading (onMouseEnter) ประหยัดโควต้าการอ่าน
@ID:P3-UX-001 | @PHASE:Phase3 | @CAT:UX | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify relationship detail: ปลดล็อกข้อจำกัดค้นสินค้าหน้าบ้าน (SearchPage) จาก 100 ชิ้นแรกเป็นทั้งหมด ~160 ชิ้น พร้อมใช้ IndexedDB
@ID:P3-COST-007 | @PHASE:Phase3 | @CAT:COST | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify relationship detail: ถอด OrderProvider (OrderContext) ดึงข้อมูล unused listeners (shipping_rules, promotions, freebies) ลด reads เปล่า ~50k/วัน
@ID:P3-COST-008 | @PHASE:Phase3 | @CAT:COST | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify relationship detail: ปรับแต่งระบบคัดเลือกสิทธิ์ (PrivilegeSelector) และการค้นหาหน้าบ้าน/หน้าพนักงาน ให้ดึงเฉพาะ isActive: true และ cache 5 นาที
@ID:P3-COST-009 | @PHASE:Phase3 | @CAT:COST | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify relationship detail: เพิ่ม limit(100) และ limit(300) ในคิวรี Sourcing Requests (NonExistingProducts) และแกลเลอรีหลังบ้าน (GalleryMain)
@ID:P3-COST-010 | @PHASE:Phase3 | @CAT:COST | @SEV:🟠High | @STAT:🟢PASS | @EV:รองรับใน CategoryPage, InventoryQuery และ ClaimService แล้ว | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify that Server-Side Pagination (limit, startAfter)
@ID:P3-PER-003 | @PHASE:Phase3 | @CAT:PER | @SEV:🟡Medium | @STAT:🟢PASS | @EV:memoryCache implemented | @REF:React Query & Local Caching Guidelines | @TASK: Verify that Caching & Memoization (Prevent Re-renders)
@ID:P3-PER-004 | @PHASE:Phase3 | @CAT:PER | @SEV:🟠High | @STAT:🟡PENDING | @EV:None | @REF:React Query & Local Caching Guidelines | @TASK: Verify that Bundle Size & Code Splitting (React.lazy / Suspense)
@ID:P3-UX-002 | @PHASE:Phase3 | @CAT:UX | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that Dashboard Zero-delay UI (Removed setTimeout delay for instant data load)
@ID:P3-UX-003 | @PHASE:Phase3 | @CAT:UX | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that Inventory Hover-Intent Prefetching (Background fetch on hover to prevent search lag)
@ID:P3-UX-004 | @PHASE:Phase3 | @CAT:UX | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that Customer Detail Panel (Backoffice) displays full Address, Social Media Links, and Google Maps without extra Firestore Reads
@ID:P3-UX-005 | @PHASE:Phase3 | @CAT:UX | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that Edit Customer Modal supports structured address and social links editing
@ID:P3-COST-011 | @PHASE:Phase3 | @CAT:COST | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify that Todo System Quota Leak (Fixed: Added Server-Side Status Filter, Fixed infinite render loop in WholesalePrices, Increased Limits to prevent data loss)
@ID:P3-COST-020 | @PHASE:Phase3 | @CAT:COST | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Implemented Distributed Counters (Sharding) in billingTransactionService, todoPaymentService, claimRequestService to bypass Firestore 1 write/sec limit | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify that Distributed Counters (Sharding) are used for high-concurrency document sequences
@ID:P3-PER-005 | @PHASE:Phase3 | @CAT:PER | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:React Query & Local Caching Guidelines | @TASK: Verify that [DOMAIN:POS] อัปเกรดระบบค้นหาสินค้าหน้า POS เป็น Hybrid Cache ลด Firestore Reads เป็น 0 และแก้ปัญหา N+1 Query ของแถม
@ID:P3-COST-012 | @PHASE:Phase3 | @CAT:COST | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify that [DOMAIN:Manager] อุดรอยรั่ว Quota Leak ในหน้าปฏิทินกลาง (Calendar) จากการดึง Users ทั้งระบบ (O(N) -> O(1))
@ID:P3-ARCH-002 | @PHASE:Phase3 | @CAT:ARCH | @SEV:🟠High | @STAT:🟡PENDING | @EV:None | @REF:None | @TASK: Verify that Auto-Refactor & SRP (Split Logic/Hooks)
@ID:P3-ARCH-003 | @PHASE:Phase3 | @CAT:ARCH | @SEV:🟠High | @STAT:🟡PENDING | @EV:None | @REF:None | @TASK: Verify relationship detail: แยก Custom Hooks (e.g. useCart, useAuth, useProducts) ออกจาก UI Components
@ID:P3-ARCH-004 | @PHASE:Phase3 | @CAT:ARCH | @SEV:🟠High | @STAT:🟡PENDING | @EV:None | @REF:None | @TASK: Verify relationship detail: แยก Service Layer สำหรับ Firebase (e.g. authService, productService)
@ID:P3-ARCH-005 | @PHASE:Phase3 | @CAT:ARCH | @SEV:🟡Medium | @STAT:🟡PENDING | @EV:None | @REF:None | @TASK: Verify that Facade Pattern (Isolate Firebase from UI)
@ID:P3-ARCH-006 | @PHASE:Phase3 | @CAT:ARCH | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified; Centralized pathUtils, categoryService, and walletService into dh-shared | @REF:None | @TASK: Verify that dh-shared Usage (Centralize Logic e.g. tax, price, firebase utilities)
@ID:P3-ARCH-007 | @PHASE:Phase3 | @CAT:ARCH | @SEV:🟠High | @STAT:🟡PENDING | @EV:None | @REF:None | @TASK: Verify relationship detail: ตรวจสอบความสมบูรณ์ของ `dh-shared/src/taxEngine.js`
@ID:P3-ARCH-008 | @PHASE:Phase3 | @CAT:ARCH | @SEV:🟠High | @STAT:🟡PENDING | @EV:None | @REF:None | @TASK: Verify relationship detail: ตรวจสอบความสมบูรณ์ของ `dh-shared/src/priceEngine.js`
@ID:P3-ARCH-009 | @PHASE:Phase3 | @CAT:ARCH | @SEV:⚪Low | @STAT:🟡PENDING | @EV:None | @REF:None | @TASK: Verify that Dead Code Elimination
@ID:P3-ARCH-010 | @PHASE:Phase3 | @CAT:ARCH | @SEV:🟡Medium | @STAT:🔵IN_PROGRESS | @EV:None | @REF:None | @TASK: Verify that [APP:Backoffice] ตรวจสอบขนาดของไฟล์ Pages ไม่ให้เกิน 200-300 บรรทัด (Extract to Components)
@ID:P3-ARCH-011 | @PHASE:Phase3 | @CAT:ARCH | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify relationship detail: Refactor หน้า Calendar/index.jsx เพื่อแยก UI (CalendarEventModal) และ Logic (useCalendar) ออกจากกันตามหลัก SRP
@ID:P3-ARCH-012 | @PHASE:Phase3 | @CAT:ARCH | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that [APP:Frontend] เข้ารหัส URL หมวดหมู่สินค้า (encodeURIComponent) เพื่อป้องกันปัญหาลิงก์เสีย (404 Not Found)
@ID:P3-SEC-002 | @PHASE:Phase3 | @CAT:SEC | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:OWASP / Firebase Security Rules | @TASK: Verify that Audit Log Awareness (Forwarded to Google Drive GAS)
@ID:P3-SEC-003 | @PHASE:Phase3 | @CAT:SEC | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:OWASP / Firebase Security Rules | @TASK: Verify relationship detail: อัปเกรดระบบจัดเก็บบันทึก History Log ลูกค้า (Diffing Engine) ตรวจจับความเปลี่ยนแปลงรายฟิลด์และแปลเป็นภาษาไทย
@ID:P3-SEC-004 | @PHASE:Phase3 | @CAT:SEC | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:OWASP / Firebase Security Rules | @TASK: Verify that Manager Routes Protection (RBAC: Role-Based Access Control)
@ID:P3-SEC-005 | @PHASE:Phase3 | @CAT:SEC | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:OWASP / Firebase Security Rules | @TASK: Verify relationship detail: แยกสิทธิ์ Staff vs Manager ในหน้าแดชบอร์ด Backoffice (RBAC Settings UI)
@ID:P3-SEC-006 | @PHASE:Phase3 | @CAT:SEC | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:OWASP / Firebase Security Rules | @TASK: Verify that Cookie & Data Consent (เพิ่ม Checkbox ขอความยินยอมข้อมูลสถานที่/รูปภาพใน Profile)
@ID:P3-SEC-007 | @PHASE:Phase3 | @CAT:SEC | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:OWASP / Firebase Security Rules | @TASK: Verify that Right to be Forgotten (ระบบรองรับการให้ผู้ใช้ขอลบข้อมูลส่วนตัวถาวร Hard Delete)
@ID:P3-SEC-008 | @PHASE:Phase3 | @CAT:SEC | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:OWASP / Firebase Security Rules | @TASK: Verify that PII Data Protection (ล็อก Rules ไม่ให้คนนอกดึงข้อมูล /users ได้)
@ID:P3-SEC-011 | @PHASE:Phase3 | @CAT:SEC | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:PDPA Compliance | @TASK: Verify that Right to Data Portability (เพิ่มฟังก์ชัน Data Export สกัดเป็นไฟล์ JSON ในหน้า Privacy & Security)
@ID:P3-ARCH-013 | @PHASE:Phase3 | @CAT:ARCH | @SEV:🔴High | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that สร้างศูนย์จัดการรับเรื่องคืนเงิน (Refund Management) ในระบบหลังบ้าน
@ID:P3-FEAT-001 | @PHASE:Phase3 | @CAT:FEAT | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that เพิ่มระบบอัปโหลดและแนบ "สลิปโอนเงิน" เมื่อ Manager กดอนุมัติคืนเงิน พร้อมแสดงผลหน้าบ้าน
@ID:P3-FEAT-002 | @PHASE:Phase3 | @CAT:FEAT | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that อัปเกรดระบบโฆษณา (Ad Features) และจัดหน้า Store Profile/Ad Product Detail
@ID:P3-ARCH-014 | @PHASE:Phase3 | @CAT:ARCH | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that ปรับปรุงการจัดการคำร้องโฆษณาเข้าสู่ Central To-Do พร้อมเก็บบันทึก History Log ลง system_logs
@ID:P3-FEAT-003 | @PHASE:Phase3 | @CAT:FEAT | @SEV:⚪Low | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify POS cashier system: Offline Support (ขายตอนเน็ตหลุดและ Sync ภายหลัง)
@ID:P3-FEAT-004 | @PHASE:Phase3 | @CAT:FEAT | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify Claims Management System: สถานะการส่งซ่อม/เปลี่ยนของ
@ID:P3-FEAT-005 | @PHASE:Phase3 | @CAT:FEAT | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that [DOMAIN:Manager] ระบบอนุมัติเอกสารและวันหยุดพนักงาน (Staff Leave & Approvals)
@ID:P3-FEAT-006 | @PHASE:Phase3 | @CAT:FEAT | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:None | @TASK: Verify that พัฒนาระบบ Big Seller Sync ขั้นสูง พร้อมบันทึก Snapshot รายละเอียดเชิงลึกส่งเข้า History Log ใน Google Sheets (0 Firestore Writes สำหรับ Analyst)
@ID:P3-PER-006 | @PHASE:Phase3 | @CAT:PER | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:React Query & Local Caching Guidelines | @TASK: Verify that Remove Promise.all bottleneck in ProductDetail to load core product faster
@ID:P3-COST-013 | @PHASE:Phase3 | @CAT:COST | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify that Refactor Ads prefetch in App.jsx to use Lazy Loading (IntersectionObserver)
@ID:P3-COST-014 | @PHASE:Phase3 | @CAT:COST | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify that Optimize CategoryPage query (remove hacky array-in search, use category_lower field instead)
@ID:P3-DATA-022 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify that Fix Backoffice deleteCategory relation query (use type/category_lower instead of categoryId)
@ID:P3-COST-015 | @PHASE:Phase3 | @CAT:COST | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify that Optimize useCategories.js cache (prevent background fetch & re-render if cached within 5 mins)
@ID:P3-DATA-023 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify that [APP:Frontend] แก้ไขยอดชำระสุทธิในการ์ดโอนเงินให้ตรงกันกับสรุปออเดอร์โดยส่งค่า calculatedNetTotal
@ID:P3-DATA-024 | @PHASE:Phase3 | @CAT:DATA | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:Firestore Transactions & Schema | @TASK: Verify that [APP:Frontend] แก้ไขพาธโหลด Profile.jsx จาก root collection users/{uid} เพื่อแสดงร้านค้าพาร์ทเนอร์สำเร็จ
@ID:P3-DATA-027 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified; bypassed itemBuffer check for POS checkouts in billingTransactionService.js | @REF:Firestore Transactions & Schema | @TASK: Verify that [DOMAIN:POS] ปลดล็อกข้ามเงื่อนไข Buffer Stock สำหรับการขายหน้าร้าน
@ID:P3-SEC-009 | @PHASE:Phase3 | @CAT:SEC | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified; added --staff= dropdown filter dynamically populated from userService.getAllStaff() in History logs page | @REF:OWASP / Firebase Security Rules | @TASK: Verify that [DOMAIN:History] ระบบตัวกรองข้อมูลประวัติการทำงานคัดกรองตามรายชื่อพนักงาน
@ID:P3-SEC-010 | @PHASE:Phase3 | @CAT:SEC | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified; Removed window.runCategoryMigration from backoffice production | @REF:None | @TASK: Verify that global window object is free of Firebase administration scripts
@ID:P3-DATA-028 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified; Refactored useWalletManagement and walletService to use standardized pathUtils.js. Both read/write to users/{uid}/wallet_transactions uniformly. | @REF:Firestore Transactions & Schema | @TASK: Verify that [DOMAIN:Wallet] เส้นทางการบันทึกและอ่านประวัติ Wallet (wallet_transactions) ตรงกันระหว่าง Frontend และ Backoffice
@ID:P3-DATA-029 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified; Refactored creditActionService across Frontend and Backoffice to use pathUtils.js for normalized credit_transactions path. | @REF:Firestore Transactions & Schema | @TASK: Verify that [DOMAIN:Credit] เส้นทางการบันทึกและอ่านประวัติ Credit (credit_transactions) ตรงกันระหว่าง Frontend และ Backoffice
@ID:P3-DATA-030 | @PHASE:Phase3 | @CAT:DATA | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified; Refactored wallet withdrawals to write to root todos collection using pathUtils.js, syncing correctly with Manager Dashboard. | @REF:Firestore Transactions & Schema | @TASK: Verify that [DOMAIN:Manager] เส้นทางการสร้างและจัดการ To-Do (todos) เป็นมาตรฐานเดียวกัน ไม่แยก Collection
@ID:P3-DATA-031 | @PHASE:Phase3 | @CAT:DATA | @SEV:⚪Low | @STAT:🟢PASS | @EV:Order fields map perfectly to OrderTableRow via totals.netTotal and shippingCost. | @REF:Firestore Transactions & Schema | @TASK: Verify that [DOMAIN:Orders] การแปลงข้อมูลคำสั่งซื้อ (Orders) จาก Frontend Checkout ไปยัง Backoffice ถูกต้องและครบถ้วน
@ID:P3-DATA-032 | @PHASE:Phase3 | @CAT:DATA | @SEV:⚪Low | @STAT:🟢PASS | @EV:Products data matches between Inventory and Frontend. | @REF:Firestore Transactions & Schema | @TASK: Verify that [DOMAIN:Inventory] ข้อมูลสินค้าคงคลังแสดงผลตรงกันระหว่างระบบหลังบ้าน (Inventory) และหน้าบ้าน (Product Detail)

# =====================================================================


# 🗺️ PHASE 4: Production, Security & DevOps (ความปลอดภัย Hosting และ CI/CD)
# =====================================================================
@ID:P4-OPS-001 | @PHASE:Phase4 | @CAT:OPS | @SEV:🟡Medium | @STAT:🟡PENDING | @EV:None | @REF:Firebase Hosting Multi-Site Setup | @TASK: Verify that Build Speed & Output Split Audit (ตรวจสอบความเร็วการ Build และขนาดไฟล์ Output แยกของ JS/CSS)
@ID:P4-MON-001 | @PHASE:Phase4 | @CAT:MON | @SEV:🟠High | @STAT:🟡PENDING | @EV:None | @REF:Firebase Crashlytics / Error Analytics | @TASK: Verify that Error Tracking & Monitoring Audit (ตรวจสอบการตั้งค่า Firebase Crashlytics หรือ Sentry สำหรับติดตาม error)
@ID:P4-SEC-001 | @PHASE:Phase4 | @CAT:SEC | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:OWASP / Firebase Security Rules | @TASK: Verify that สคริปต์ Audit ความปลอดภัยทางการเงิน (Atomic Ledger Sync: credit_transactions vs creditPoints)
@ID:P4-SEC-002 | @PHASE:Phase4 | @CAT:SEC | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:OWASP / Firebase Security Rules | @TASK: Verify security policies in Firestore & Storage Rules: Verified
@ID:P4-SEC-003 | @PHASE:Phase4 | @CAT:SEC | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:OWASP / Firebase Security Rules | @TASK: Verify relationship detail: ตรวจสอบความรัดกุมของไฟล์ `firestore.rules` (ป้องกัน Unauthorized Writes)
@ID:P4-SEC-004 | @PHASE:Phase4 | @CAT:SEC | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:OWASP / Firebase Security Rules | @TASK: Verify relationship detail: ตรวจสอบความรัดกุมของไฟล์ `storage.rules` (ป้องกันอัปโหลดไฟล์อันตราย)
@ID:P4-RATE-001 | @PHASE:Phase4 | @CAT:RATE | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:Firebase App Check & Rate Limiting | @TASK: Verify that Rate Limiting / App Check (ป้องกันการยิง API หรือสแปมฐานข้อมูล)
@ID:P4-DOC-001 | @PHASE:Phase4 | @CAT:DOC | @SEV:🟠High | @STAT:🟢PASS | @EV:Verified | @REF:In-App Documentation Standards | @TASK: Verify that Legal Pages Check (ตรวจสอบความถูกต้องและเข้าถึงได้ของหน้า Privacy Policy, Terms, Cookie Policy)
@ID:P4-OPS-002 | @PHASE:Phase4 | @CAT:OPS | @SEV:🟠High | @STAT:🟡PENDING | @EV:None | @REF:Firebase Hosting Multi-Site Setup | @TASK: Verify that Firebase Hosting Configuration (ตั้งค่า Multi-site สำหรับ Frontend, Backoffice, StaffApp)
@ID:P4-OPS-003 | @PHASE:Phase4 | @CAT:OPS | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:Firebase Hosting Multi-Site Setup | @TASK: Verify CI/CD automation via GitHub Actions: Automated Testing (รัน Unit Tests ก่อน Merge)
@ID:P4-OPS-004 | @PHASE:Phase4 | @CAT:OPS | @SEV:🟡Medium | @STAT:🟢PASS | @EV:Verified | @REF:Firebase Hosting Multi-Site Setup | @TASK: Verify CI/CD automation via GitHub Actions: Automated Deployment (Deploy ไปยัง Staging อัตโนมัติเมื่อ Push ขึ้น Branch main)

# =====================================================================
@ID:P4-SEC-005 | @PHASE:Phase4 | @CAT:SEC | @SEV:🟠High | @STAT:🟡PENDING | @EV:None | @REF:OWASP / Firebase Security Rules | @TASK: Verify file validation restrictions (max upload size, content-type) in Storage security rules
@ID:P4-OPS-005 | @PHASE:Phase4 | @CAT:OPS | @SEV:🟠High | @STAT:🟡PENDING | @EV:None | @REF:Firebase Hosting Multi-Site Setup | @TASK: Verify that CSP (Content Security Policy) and security headers (HSTS, X-Frame-Options) are configured on Hosting
@ID:P4-MON-002 | @PHASE:Phase4 | @CAT:MON | @SEV:🟡Medium | @STAT:🟡PENDING | @EV:None | @REF:Firebase Crashlytics / Error Analytics | @TASK: Verify that slow query logging, quota alerts, and Firestore usage alerts are configured
@ID:P3-PER-007 | @PHASE:Phase3 | @CAT:PER | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified | @REF:Frontend Performance Audit | @TASK: Verify that Implement React Query + IndexedDB Caching and lazy load ad images

@ID:P4-PER-008 | @PHASE:Phase4 | @CAT:PER | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified; Added limit(15) to PartnerReviews.jsx, converted PartnerCreditsTab.jsx to getDocs | @REF:System-Wide Quota Audit | @TASK: Verify that Firestore Quota is optimized to prevent mass reads on StoreProfile and ClientLedger
@ID:P3-DATA-033 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified; Refactored statusWalletHandler to use walletBalance for refund and separated clawback type. Enforced Server-Side pricing in billingTransactionService.js | @REF:Business Logic Audit | @TASK: Verify that [DOMAIN:Wallet] อุดช่องโหว่การคืนเงิน Wallet เป็น Points, แก้ปัญหายึดแต้มคืน (Clawback DoS), และป้องกันสวมรอยราคาตอนสร้างบิล (Price Tampering)
@ID:P3-DATA-034 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified; Refactored billingDeleteService to refund walletUsed to walletBalance instead of creditPoints. Updated Schema-Tier1-Critical.md | @REF:Business Logic Audit | @TASK: Verify that [DOMAIN:Wallet] แก้ไขบั๊กการคืนเงินผิดกระเป๋า (Refund Target Mismatch) เมื่อลบบิลร่างทิ้งถาวร

OVERALL_SCORE: 🟢82%
LAST_UPDATE: 2026-07-06

- [x] **FTUX & Fluidity Optimization** (Frontend): 
  - [x] Switched <LazyImage> to eager <img> for main Hero Banner to improve LCP.
  - [x] Added localStorage cache for heroConfig to instantly render on returning visits.
  - [x] Added localStorage cache for storefrontTheme to prevent background flashes.
  - [x] Added CSS transition for background properties in index.css.

- [x] **FTUX Phase 2 (Zero-Latency & Pixel Perfect)**: 
  - [x] Added <link rel="preload"> for Default Hero Image in index.html.
  - [x] Implemented Smart Hover Prefetching (Dynamic Import) in Navbar.jsx (Cart, Profile, Search).
  - [x] Implemented Smart Hover Prefetching in FeaturedSpares.jsx (Categories).
  - [x] Polished Skeleton UI in ProductList.jsx and FeaturedSpares.jsx for Pixel-Perfect Layout Shift prevention.

- [x] **FTUX Phase 3 (Premium Animations & UI Polish)**: 
  - [x] Created ScrollReveal.jsx (Custom AOS using IntersectionObserver).
  - [x] Applied <ScrollReveal> to sections in Home.jsx.
  - [x] Polished Optimistic UI in ProductList.jsx (Removed loading state for 0-latency Add to Cart + Added scale effect).
