# DH NOTEBOOK AUDIT DATA (AI-Optimized Format)
# AI Search Guide: Use `grep_search` with tags like `@SEV:🔴Critical`, `@STAT:🟡Pending`, or `@TYPE:Cost` for rapid, token-efficient retrieval.
# --- Legend ---
# Status: 🟢Done | 🔵InProgress | 🟡Pending
# Severity: 🔴Critical | 🟠High | 🟡Medium | ⚪Low
# Score: 🔴(0-25%) | 🟠(26-50%) | 🟡(51-75%) | 🟢(76-100%)

# =====================================================================
# 🗺️ 0. AUDIT STRUCTURE MAP (แผนผังการตรวจงาน)
# =====================================================================
# โครงสร้างนี้ใช้เพื่อให้ AI และนักพัฒนาสามารถเข้าถึงขอบเขตการตรวจงานได้แม่นยำขึ้น
# การใช้ Tag ค้นหา (Search Tags): 
#   - ค้นหาตามแอปพลิเคชัน: `@APP:Backoffice`, `@APP:Frontend`, `@APP:StaffApp`, `@APP:Shared`
#   - ค้นหาตามระบบงาน: `@DOMAIN:POS`, `@DOMAIN:Inventory`, `@DOMAIN:Claims`, `@DOMAIN:Manager`
#
# โครงสร้างหมวดหมู่หลัก (Main Audit Categories):
# 📍 1. System Resilience & Data Integrity (ความถูกต้องและความสัมพันธ์ของข้อมูล)
# 📍 2. Front-End User Experience & Documentation (ความลื่นไหลของ UI และคู่มือการใช้งาน)
# 📍 3. System Performance & Firebase Optimization (ประสิทธิภาพและลดค่าใช้จ่าย Database)
# 📍 4. Code Quality, Architecture & SRP (คุณภาพโค้ด การแยกไฟล์ และการใช้ Hook)
# 📍 5. Security, Roles & Audit Logging (ความปลอดภัย สิทธิ์ และการเก็บประวัติ)
# 📍 6. Legal & PDPA Compliance (การจัดการข้อจำกัดทางกฎหมายและข้อมูลส่วนบุคคล)
# 📍 7. Business Logic & Feature Flows (การทำงานเชิงธุรกิจ เช่น การจ่ายเงิน คืนเงิน)
# 📍 8. Deployment & CI/CD (โครงสร้างพื้นฐานการ Deploy)
# =====================================================================

# ----------------- 1. System Resilience & Data Integrity -----------------
@ID:1.1 | @TYPE:DataRelation | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Strict Data Relations (Check before delete/edit to prevent orphaned data)
@ID:1.1.1 | @TYPE:DataRelation | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบผลกระทบเมื่อมีการลบ Category กับ Product ที่อ้างอิงอยู่
@ID:1.1.2 | @TYPE:DataRelation | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบผลกระทบเมื่อมีการลบ Product กับ Cart Items/Orders ที่ค้างอยู่
@ID:1.1.3 | @TYPE:DataRelation | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - เพิ่มการ Validate SKUs ใน Promotions/Freebies ก่อนบันทึกเพื่อป้องกัน Orphaned Data
@ID:1.1.4 | @TYPE:DataRelation | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - เพิ่ม Cascade Update ปิดร้าน Partner และยกเลิก To-do ค้างเมื่อ User ถูกระงับหรือลบบัญชี
@ID:1.1.5 | @TYPE:DataRelation | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ระบบคืนโควตาโปรโมชันและของแถม (Reversal) เมื่อมีการยกเลิกบิล
@ID:1.1.6 | @TYPE:DataRelation | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - กู้คืนสถานะ Partner กลับเข้าแผนที่เมื่อมีการ Reject โฆษณาที่รอตรวจสอบ
@ID:1.1.7 | @TYPE:DataRelation | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - บังคับ Snapshot ราคาและชื่อสินค้า (priceAtPurchase, nameAtPurchase) ใน OrderItem
@ID:1.1.8 | @TYPE:DataRelation | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ป้องกัน Todo Context Loss โดยแนบ Snapshot ไว้ใน payload ของงาน Manager
@ID:1.2 | @TYPE:Security | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Safe Deletion (Soft Delete/History)
@ID:1.3 | @TYPE:UX | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Error Handling (Clear alerts, prevent crashes) - Handled native alerts in BottomNav
@ID:1.4 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: State Resilience (Offline/Network retry) - Handled fallback and empty states
@ID:1.5 | @TYPE:DataRelation | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: [@DOMAIN:Inventory] ป้องกันการขายสินค้าเกินสต๊อก (Race Condition during checkout) - Fixed with robust runTransaction
@ID:1.6 | @TYPE:DataRelation | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: [@DOMAIN:Claims] ตรวจสอบการรับของแถมคืนใน To-do (Return Items Freebie Check & Penalty Deduction)
@ID:1.7 | @TYPE:Security | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: สคริปต์ Audit ความปลอดภัยทางการเงิน (Atomic Ledger Sync: credit_transactions vs creditPoints)
@ID:1.7.1 | @TYPE:DataRelation | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - Sync คะแนนจาก creditPoints ลง ActivePartners ใน Transaction เดียวกันเพื่อป้องกัน Denormalization Issue
@ID:1.8 | @TYPE:DataRelation | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: [@DOMAIN:Inventory] ตรวจสอบและคลีน UUID ขยะใน compatiblePartNumbers พร้อมอัปเดต Schema และเพิ่ม Tooltip

# ----------------- 2. Front-End User Experience & Documentation -----------------
@ID:2.1 | @TYPE:Docs | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: In-App Documentation (Guide/Tooltip in Backoffice)
@ID:2.1.1 | @TYPE:Docs | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบคู่มือ/คำอธิบายในหน้า Manager Settings -> Ads
@ID:2.1.2 | @TYPE:Docs | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบคู่มือ/คำอธิบายในหน้า Manager Settings -> Inventory
@ID:2.1.3 | @TYPE:Docs | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบคู่มือ/คำอธิบายในหน้า Manager Settings -> Shipping
@ID:2.1.4 | @TYPE:Docs | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบและอัปเกรดคู่มือ In-App Documentation ในระบบ Product Search (ManualModal)
@ID:2.2 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Premium UX/UI (Modern UI, Micro-interactions) - Added Search overlay, Breadcrumbs
@ID:2.3 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Optimistic UI (Fast response, instant update) - CartItemCard debounced with loader
@ID:2.4 | @TYPE:Security | @SEV:🟠High | @STAT:⚪Backlog | @SCORE:🔴0% | @TASK: User Action Confirmations (Alert before delete/edit)
@ID:2.5 | @TYPE:UX | @SEV:🟡Medium | @STAT:⚪Backlog | @SCORE:🔴0% | @TASK: [@APP:StaffApp] ตรวจสอบความง่ายในการใช้งานบนมือถือ (Mobile-First Touch UI)
@ID:2.6 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: [@APP:Frontend] ป้องกันสินค้าหายจากตะกร้าโดยไม่ตั้งใจ (เพิ่ม window.confirm เมื่อ qty=0)
@ID:2.7 | @TYPE:UX | @SEV:⚪Low | @STAT:🟢Done | @SCORE:🟢100% | @TASK: [@APP:Frontend] ปิด Gimmick แจ้งเตือนหลอกตาใน Navbar เพื่อป้องกันความสับสน
@ID:2.8 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: [@APP:Frontend] เปลี่ยนระบบแจ้ง Error ในหน้า Checkout เป็น Toast Notification เพื่อไม่ให้เสีย Flow การกรอกข้อมูล
@ID:2.9 | @TYPE:Docs | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: [@APP:Frontend] เพิ่ม Tooltip อธิบายการใช้งานระบบ Wallet ในหน้า Checkout
@ID:2.10 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: [@APP:Frontend] อัปเกรด Favorites - รองรับ List View, Notes และ Tags เพื่อ Support ลูกค้าประจำ
@ID:2.11 | @TYPE:UX | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: [@APP:Frontend] UX Audit - นำ Alert ออกจากตะกร้า, จัดระเบียบ Checkout แบบ Accordion, เพิ่ม Code Splitting, รองรับ Variant Sync URL
@ID:2.11 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: [@APP:Frontend] อัปเกรด Favorites - เพิ่ม Simulator คำนวณราคา, การจัดการเมื่อสินค้าหมดสต๊อก (Restock Alert/LINE), และแสดงจำนวนในตะกร้า
# ----------------- 3. System Performance & Firebase Optimization -----------------
@ID:3.1 | @TYPE:Cost | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Cost-Effective Queries (Reduce unnecessary Reads/Writes) - Frontend Categories & System-wide Todo Leaks Done
@ID:3.1.1 | @TYPE:Cost | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบการใช้งาน Zero-Read Search & Hybrid Cache ใน Product Search
@ID:3.2 | @TYPE:Cost | @SEV:🟠High | @STAT:⚪Backlog | @SCORE:🔴0% | @TASK: Server-Side Pagination (limit, startAfter)
@ID:3.3 | @TYPE:Performance | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Caching & Memoization (Prevent Re-renders) - memoryCache implemented
@ID:3.4 | @TYPE:Performance | @SEV:⚪Low | @STAT:⚪Backlog | @SCORE:🔴0% | @TASK: Bundle Size & Code Splitting (React.lazy / Suspense)
@ID:3.5 | @TYPE:UX | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Dashboard Zero-delay UI (Removed setTimeout delay for instant data load)
@ID:3.6 | @TYPE:UX | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Inventory Hover-Intent Prefetching (Background fetch on hover to prevent search lag)
@ID:3.7 | @TYPE:Cost | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Todo System Quota Leak (Fixed: Added Server-Side Status Filter, Fixed infinite render loop in WholesalePrices, Increased Limits to prevent data loss)

# ----------------- 4. Code Quality, Architecture & SRP -----------------
@ID:4.1 | @TYPE:Architecture | @SEV:🟠High | @STAT:⚪Backlog | @SCORE:🔴0% | @TASK: Auto-Refactor & SRP (Split Logic/Hooks)
@ID:4.1.1 | @TYPE:Architecture | @SEV:🟠High | @STAT:⚪Backlog | @SCORE:🔴0% | @TASK: Sub - แยก Custom Hooks (e.g. useCart, useAuth, useProducts) ออกจาก UI Components
@ID:4.1.2 | @TYPE:Architecture | @SEV:🟠High | @STAT:⚪Backlog | @SCORE:🔴0% | @TASK: Sub - แยก Service Layer สำหรับ Firebase (e.g. authService, productService)
@ID:4.2 | @TYPE:Architecture | @SEV:🟡Medium | @STAT:⚪Backlog | @SCORE:🔴0% | @TASK: Facade Pattern (Isolate Firebase from UI)
@ID:4.3 | @TYPE:Architecture | @SEV:🟠High | @STAT:⚪Backlog | @SCORE:🔴0% | @TASK: dh-shared Usage (Centralize Logic e.g. tax, price)
@ID:4.3.1 | @TYPE:Architecture | @SEV:🟠High | @STAT:⚪Backlog | @SCORE:🔴0% | @TASK: Sub - ตรวจสอบความสมบูรณ์ของ `dh-shared/src/taxEngine.js` 
@ID:4.3.2 | @TYPE:Architecture | @SEV:🟠High | @STAT:⚪Backlog | @SCORE:🔴0% | @TASK: Sub - ตรวจสอบความสมบูรณ์ของ `dh-shared/src/priceEngine.js`
@ID:4.4 | @TYPE:Architecture | @SEV:⚪Low | @STAT:⚪Backlog | @SCORE:🔴0% | @TASK: Dead Code Elimination
@ID:4.5 | @TYPE:Architecture | @SEV:🟡Medium | @STAT:⚪Backlog | @SCORE:🔴0% | @TASK: [@APP:Backoffice] ตรวจสอบขนาดของไฟล์ Pages ไม่ให้เกิน 200-300 บรรทัด (Extract to Components)
@ID:4.6 | @TYPE:Architecture | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: [@APP:Frontend] เข้ารหัส URL หมวดหมู่สินค้า (encodeURIComponent) เพื่อป้องกันปัญหาลิงก์เสีย (404 Not Found)

# ----------------- 5. Security, Roles & Audit Logging -----------------
@ID:5.1 | @TYPE:Security | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Audit Log Awareness (Forwarded to Google Drive GAS)
@ID:5.2 | @TYPE:Security | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Manager Routes Protection (RBAC: Role-Based Access Control)
@ID:5.2.1 | @TYPE:Security | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - แยกสิทธิ์ Staff vs Manager ในหน้าแดชบอร์ด Backoffice (RBAC Settings UI)
@ID:5.3 | @TYPE:Security | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Firestore & Storage Rules
@ID:5.3.1 | @TYPE:Security | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบความรัดกุมของไฟล์ `firestore.rules` (ป้องกัน Unauthorized Writes)
@ID:5.3.2 | @TYPE:Security | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบความรัดกุมของไฟล์ `storage.rules` (ป้องกันอัปโหลดไฟล์อันตราย)
@ID:5.4 | @TYPE:Security | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Rate Limiting / App Check (ป้องกันการยิง API หรือสแปมฐานข้อมูล)

# ----------------- 6. Legal & PDPA Compliance (กฎหมายและข้อมูลส่วนบุคคล) -----------------
@ID:6.1 | @TYPE:Security | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Cookie & Data Consent (เพิ่ม Checkbox ขอความยินยอมข้อมูลสถานที่/รูปภาพใน Profile)
@ID:6.2 | @TYPE:Security | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Right to be Forgotten (ระบบรองรับการให้ผู้ใช้ขอลบข้อมูลส่วนตัวถาวร Hard Delete)
@ID:6.3 | @TYPE:Security | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: PII Data Protection (ล็อก Rules ไม่ให้คนนอกดึงข้อมูล /users ได้)
@ID:6.4 | @TYPE:Docs | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Legal Pages Check (ตรวจสอบความถูกต้องและเข้าถึงได้ของหน้า Privacy Policy, Terms, Cookie Policy)

# ----------------- 7. Business Logic & Feature Flows -----------------
@ID:7.1 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: เปลี่ยนปุ่มถอนเงินเป็นปุ่ม "ขอคืนเงิน (LINE)" ในหน้า Wallet ของลูกค้า
@ID:7.2 | @TYPE:ARCH | @SEV:🔴High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: สร้างศูนย์จัดการรับเรื่องคืนเงิน (Refund Management) ในระบบหลังบ้าน
@ID:7.3 | @TYPE:FEATURE | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: เพิ่มระบบอัปโหลดและแนบ "สลิปโอนเงิน" เมื่อ Manager กดอนุมัติคืนเงิน พร้อมแสดงผลหน้าบ้าน
@ID:7.4 | @TYPE:FEATURE | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: [@DOMAIN:POS] ระบบขายหน้าร้าน - Offline Support (ขายตอนเน็ตหลุดและ Sync ภายหลัง)
@ID:7.5 | @TYPE:FEATURE | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: [@DOMAIN:Claims] ระบบจัดการเคลมสินค้า - สถานะการส่งซ่อม/เปลี่ยนของ
@ID:7.6 | @TYPE:FEATURE | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: [@DOMAIN:Manager] ระบบอนุมัติเอกสารและวันหยุดพนักงาน (Staff Leave & Approvals)

# ----------------- 8. Deployment & CI/CD -----------------
@ID:8.1 | @TYPE:CI_CD | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Environment Variables Setup (แยก .env สำหรับ Dev, Staging, Prod)
@ID:8.2 | @TYPE:CI_CD | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Firebase Hosting Configuration (ตั้งค่า Multi-site สำหรับ Frontend, Backoffice, StaffApp)
@ID:8.3 | @TYPE:CI_CD | @SEV:🟡Medium | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: GitHub Actions - Automated Testing (รัน Unit Tests ก่อน Merge)
@ID:8.4 | @TYPE:CI_CD | @SEV:🟡Medium | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: GitHub Actions - Automated Deployment (Deploy ไปยัง Staging อัตโนมัติเมื่อ Push ขึ้น Branch main)

# ----------------- F. FRONTEND AUDIT SPECIFIC TASKS (Legacy) -----------------
@ID:F.1 | @TYPE:UX | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Centralized ToastContext to prevent notification conflicts and crashes
@ID:F.2 | @TYPE:Performance | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Remove Promise.all bottleneck in ProductDetail to load core product faster
@ID:F.3 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Add missing Loading State for Cart freebies to prevent UI shift
@ID:F.4 | @TYPE:Cost | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Refactor Ads prefetch in App.jsx to use Lazy Loading (IntersectionObserver)
@ID:F.5 | @TYPE:Cost | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Optimize CategoryPage query (remove hacky array-in search, use category_lower field instead)

OVERALL_SCORE: 🟢77%
LAST_UPDATE: 2026-06-30
