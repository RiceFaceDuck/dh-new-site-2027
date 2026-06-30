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
@ID:1.1.4 | @TYPE:DataRelation | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - เพิ่ม Cascade Update ปิดร้าน Partner เมื่อ User ถูกระงับหรือลบบัญชี
@ID:1.2 | @TYPE:Security | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Safe Deletion (Soft Delete/History)
@ID:1.3 | @TYPE:UX | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Error Handling (Clear alerts, prevent crashes) - Handled native alerts in BottomNav
@ID:1.4 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: State Resilience (Offline/Network retry) - Handled fallback and empty states

# ----------------- 2. Front-End User Experience & Documentation -----------------
@ID:2.1 | @TYPE:Docs | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: In-App Documentation (Guide/Tooltip in Backoffice)
@ID:2.1.1 | @TYPE:Docs | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบคู่มือ/คำอธิบายในหน้า Manager Settings -> Ads
@ID:2.1.2 | @TYPE:Docs | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบคู่มือ/คำอธิบายในหน้า Manager Settings -> Inventory
@ID:2.1.3 | @TYPE:Docs | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบคู่มือ/คำอธิบายในหน้า Manager Settings -> Shipping
@ID:2.1.4 | @TYPE:Docs | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบและอัปเกรดคู่มือ In-App Documentation ในระบบ Product Search (ManualModal)
@ID:2.2 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Premium UX/UI (Modern UI, Micro-interactions) - Added Search overlay, Breadcrumbs
@ID:2.3 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Optimistic UI (Fast response, instant update) - CartItemCard debounced with loader
@ID:2.4 | @TYPE:Security | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: User Action Confirmations (Alert before delete/edit)

# ----------------- 3. System Performance & Firebase Optimization -----------------
@ID:3.1 | @TYPE:Cost | @SEV:🔴Critical | @STAT:🔵InProgress | @SCORE:🟠50% | @TASK: Cost-Effective Queries (Reduce unnecessary Reads/Writes) - Frontend Categories Done
@ID:3.1.1 | @TYPE:Cost | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบการใช้งาน Zero-Read Search & Hybrid Cache ใน Product Search
@ID:3.2 | @TYPE:Cost | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Server-Side Pagination (limit, startAfter)
@ID:3.3 | @TYPE:Performance | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Caching & Memoization (Prevent Re-renders) - memoryCache implemented
@ID:3.4 | @TYPE:Performance | @SEV:⚪Low | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Bundle Size & Code Splitting
@ID:3.5 | @TYPE:UX | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Dashboard Zero-delay UI (Removed setTimeout delay for instant data load)
@ID:3.6 | @TYPE:UX | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Inventory Hover-Intent Prefetching (Background fetch on hover to prevent search lag)
@ID:3.7 | @TYPE:Cost | @SEV:🔴Critical | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Todo System Quota Leak (Wait for DB Migration script to separate Manager/Staff tasks)

# ----------------- 4. Code Quality, Architecture & SRP -----------------
@ID:4.1 | @TYPE:Architecture | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Auto-Refactor & SRP (Split Logic/Hooks)
@ID:4.2 | @TYPE:Architecture | @SEV:🟡Medium | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Facade Pattern (Isolate Firebase from UI)
@ID:4.3 | @TYPE:Architecture | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: dh-shared Usage (Centralize Logic e.g. tax, price)
@ID:4.3.1 | @TYPE:Architecture | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Sub - ตรวจสอบความสมบูรณ์ของ `dh-shared/src/taxEngine.js` 
@ID:4.3.2 | @TYPE:Architecture | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Sub - ตรวจสอบความสมบูรณ์ของ `dh-shared/src/priceEngine.js`
@ID:4.4 | @TYPE:Architecture | @SEV:⚪Low | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Dead Code Elimination

# ----------------- 5. Security, Roles & Audit Logging -----------------
@ID:5.1 | @TYPE:Security | @SEV:🔴Critical | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Audit Log Awareness (History Logs for major actions)
@ID:5.2 | @TYPE:Security | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Manager Routes Protection
@ID:5.3 | @TYPE:Security | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Firestore & Storage Rules
@ID:5.3.1 | @TYPE:Security | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบความรัดกุมของไฟล์ `firestore.rules` (ป้องกัน Unauthorized Writes)
@ID:5.3.2 | @TYPE:Security | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบความรัดกุมของไฟล์ `storage.rules` (ป้องกันอัปโหลดไฟล์อันตราย)

# ----------------- 6. Legal & PDPA Compliance (กฎหมายและข้อมูลส่วนบุคคล) -----------------
@ID:6.1 | @TYPE:Security | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Cookie & Data Consent (เพิ่ม Checkbox ขอความยินยอมข้อมูลสถานที่/รูปภาพใน Profile)
@ID:6.2 | @TYPE:Security | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Right to be Forgotten (ระบบรองรับการให้ผู้ใช้ขอลบข้อมูลส่วนตัวถาวร Hard Delete)
@ID:6.3 | @TYPE:Security | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: PII Data Protection (ล็อก Rules ไม่ให้คนนอกดึงข้อมูล /users ได้)
@ID:6.4 | @TYPE:Docs | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Legal Pages Check (ตรวจสอบความถูกต้องและเข้าถึงได้ของหน้า Privacy Policy, Terms, Cookie Policy)

# ----------------- F. FRONTEND AUDIT SPECIFIC TASKS -----------------
@ID:F.1 | @TYPE:UX | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Centralized ToastContext to prevent notification conflicts and crashes
@ID:F.2 | @TYPE:Performance | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Remove Promise.all bottleneck in ProductDetail to load core product faster
@ID:F.3 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Add missing Loading State for Cart freebies to prevent UI shift
@ID:F.4 | @TYPE:Cost | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Refactor Ads prefetch in App.jsx to use Lazy Loading (IntersectionObserver)
@ID:F.5 | @TYPE:Cost | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Optimize CategoryPage query (remove hacky array-in search, use category_lower field instead)

# ----------------- 7. Payment & Refund Flows -----------------
@ID:7.1 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: เปลี่ยนปุ่มถอนเงินเป็นปุ่ม "ขอคืนเงิน (LINE)" ในหน้า Wallet ของลูกค้า
@ID:7.2 | @TYPE:ARCH | @SEV:🔴High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: สร้างศูนย์จัดการรับเรื่องคืนเงิน (Refund Management) ในระบบหลังบ้าน
@ID:7.3 | @TYPE:FEATURE | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: เพิ่มระบบอัปโหลดและแนบ "สลิปโอนเงิน" เมื่อ Manager กดอนุมัติคืนเงิน พร้อมแสดงผลหน้าบ้าน

# ----------------- 8. Deployment & CI/CD -----------------

OVERALL_SCORE: 🟢77%
LAST_UPDATE: 2026-06-29

