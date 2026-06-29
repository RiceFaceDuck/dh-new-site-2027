# DH NOTEBOOK AUDIT DATA (AI-Optimized Format)
# AI Search Guide: Use `grep_search` with tags like `@SEV:🔴Critical`, `@STAT:🟡Pending`, or `@TYPE:Cost` for rapid, token-efficient retrieval.
# --- Legend ---
# Status: 🟢Done | 🔵InProgress | 🟡Pending
# Severity: 🔴Critical | 🟠High | 🟡Medium | ⚪Low
# Score: 🔴(0-25%) | 🟠(26-50%) | 🟡(51-75%) | 🟢(76-100%)

# ----------------- 1. System Resilience & Data Integrity -----------------
@ID:1.1 | @TYPE:DataRelation | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Strict Data Relations (Check before delete/edit to prevent orphaned data)
@ID:1.1.1 | @TYPE:DataRelation | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบผลกระทบเมื่อมีการลบ Category กับ Product ที่อ้างอิงอยู่
@ID:1.1.2 | @TYPE:DataRelation | @SEV:🔴Critical | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบผลกระทบเมื่อมีการลบ Product กับ Cart Items/Orders ที่ค้างอยู่
@ID:1.2 | @TYPE:Security | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Safe Deletion (Soft Delete/History)
@ID:1.3 | @TYPE:UX | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Error Handling (Clear alerts, prevent crashes)
@ID:1.4 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: State Resilience (Offline/Network retry)

# ----------------- 2. Front-End User Experience & Documentation -----------------
@ID:2.1 | @TYPE:Docs | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: In-App Documentation (Guide/Tooltip in Backoffice)
@ID:2.1.1 | @TYPE:Docs | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบคู่มือ/คำอธิบายในหน้า Manager Settings -> Ads
@ID:2.1.2 | @TYPE:Docs | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบคู่มือ/คำอธิบายในหน้า Manager Settings -> Inventory
@ID:2.1.3 | @TYPE:Docs | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Sub - ตรวจสอบคู่มือ/คำอธิบายในหน้า Manager Settings -> Shipping
@ID:2.2 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Premium UX/UI (Modern UI, Micro-interactions)
@ID:2.3 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Optimistic UI (Fast response, instant update)
@ID:2.4 | @TYPE:Security | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: User Action Confirmations (Alert before delete/edit)

# ----------------- 3. System Performance & Firebase Optimization -----------------
@ID:3.1 | @TYPE:Cost | @SEV:🔴Critical | @STAT:🔵InProgress | @SCORE:🟠50% | @TASK: Cost-Effective Queries (Reduce unnecessary Reads/Writes) - Frontend Categories Done
@ID:3.2 | @TYPE:Cost | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Server-Side Pagination (limit, startAfter)
@ID:3.3 | @TYPE:Performance | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Caching & Memoization (Prevent Re-renders) - memoryCache implemented
@ID:3.4 | @TYPE:Performance | @SEV:⚪Low | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Bundle Size & Code Splitting

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
@ID:6.1 | @TYPE:Security | @SEV:🔴Critical | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Cookie & Data Consent (ระบบขอความยินยอม Cookie และยอมรับ Privacy Policy ก่อนสมัครสมาชิก/สั่งซื้อ)
@ID:6.2 | @TYPE:Security | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Right to be Forgotten (ระบบรองรับการให้ผู้ใช้ขอลบข้อมูลส่วนตัว / ลบบัญชีตามกฎหมาย PDPA)
@ID:6.3 | @TYPE:Security | @SEV:🔴Critical | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: PII Data Protection (ตรวจสอบการเข้าถึงข้อมูลอ่อนไหว เช่น เบอร์โทร, บัตรประชาชน ว่าเปิดเผยเฉพาะผู้มีสิทธิ์เท่านั้น)
@ID:6.4 | @TYPE:Docs | @SEV:🟠High | @STAT:🟡Pending | @SCORE:🔴0% | @TASK: Legal Pages Check (ตรวจสอบความถูกต้องและเข้าถึงได้ของหน้า Privacy Policy, Terms, Cookie Policy)

# ----------------- F. FRONTEND AUDIT SPECIFIC TASKS -----------------
@ID:F.1 | @TYPE:UX | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Centralized ToastContext to prevent notification conflicts and crashes
@ID:F.2 | @TYPE:Performance | @SEV:🟠High | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Remove Promise.all bottleneck in ProductDetail to load core product faster
@ID:F.3 | @TYPE:UX | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Add missing Loading State for Cart freebies to prevent UI shift
@ID:F.4 | @TYPE:Cost | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Refactor Ads prefetch in App.jsx to use Lazy Loading (IntersectionObserver)
@ID:F.5 | @TYPE:Cost | @SEV:🟡Medium | @STAT:🟢Done | @SCORE:🟢100% | @TASK: Optimize CategoryPage query (remove hacky array-in search, use category_lower field instead)

OVERALL_SCORE: 🟡65%
LAST_UPDATE: 2026-06-29

# =====================================================================
# APPENDIX: FIRESTORE QUOTA SIMULATION & ESTIMATION (1,000 Users)
# =====================================================================
# สรุปผลการประเมินการใช้งาน Reads & Writes จากการอัปเกรดความแข็งแกร่ง (Robustness Update)
# สมมติฐาน: การเปลี่ยนมาใช้ Soft Delete และจัดการ Rule อย่างรัดกุม + Caching
#
# [1] ระบบหน้าบ้าน (Web Storefront) - สมมติผู้เข้าใช้งาน 1,000 คน/วัน
# - การโหลดหน้าแรก (Category, Featured): ~5 Reads / คน (ลดลงจากการใช้ Caching)
# - การค้นหาและดูสินค้า (Pagination ~3 หน้า): ~40 Reads / คน (จำกัดจำนวน per page ให้เหมาะสม)
# - ดูรายละเอียดสินค้าและ Checkout (ทำรายการ 1 บิล): ~2 Reads / ~4 Writes / คน
# >> รวมหน้าบ้าน: ~47,000 Reads | ~4,000 Writes
#
# [2] ระบบหลังบ้าน (Backoffice) - สมมติพนักงาน 10 คน ทำงาน 9.00-18.00 น.
# - โหลด Billing (Subscription 100 รายการ): ~150 Reads / คน
# - ค้นหาลูกค้า, สินค้า, บิล (~50 ครั้ง/วัน): ~200 Reads / คน
# - อัปเดตข้อมูล, อนุมัติ To-do, ลบข้อมูล (Soft Delete + Relation Check): ~160 Writes / คน (เพิ่มนิดหน่อยจากการเช็ค Relation 1 Read)
# - การใช้ Delta Sync (Cache) ในหน้าลูกค้าช่วยลด Read ได้มหาศาล
# >> รวมหลังบ้าน: ~4,500 Reads | ~1,600 Writes
#
# [3] สรุปภาพรวมและค่าใช้จ่าย (รายวัน)
# - TOTAL READS: ~51,500 Reads / วัน (เฉียดโควต้าฟรี 50,000, ส่วนเกินประมาณ 1,500 Reads)
# - TOTAL WRITES: ~5,600 Writes / วัน (ยังอยู่ในโควต้าฟรี 20,000 สบายๆ)
# - COST: ค่าใช้จ่ายส่วนเกิน Reads 1,500 ครั้ง อยู่ที่ประมาณ $0.0009 / วัน (ฟรี หรือไม่ถึง 1 สตางค์)
# - IMPACT: แผนการทำ Soft Delete ใช้งานได้อย่างมีประสิทธิภาพ การใช้ `limit(1)` ตอนเช็ค Relation ของ Category ก่อนลบทำให้ประหยัด Quota มหาศาลเมื่อเทียบกับการต้องดึง Product ทั้งหมดมานับ!
