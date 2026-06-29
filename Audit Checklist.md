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

# =====================================================================
# APPENDIX: FIRESTORE QUOTA SIMULATION & ESTIMATION (1,000 Users)
# =====================================================================
# สรุปผลการประเมินการใช้งาน Reads & Writes ของทั้งระบบ (สำหรับผู้ใช้ 1,000 คน/วัน)
# 
# 1. ระบบหน้าร้าน (Storefront - 1,000 คน)
# - โหลดหน้าแรก (Category, Featured) อาศัย Caching: ~5 Reads/คน = 5,000 Reads
# - เข้าดูหมวดหมู่และสินค้า (CategoryPage/ProductDetail): ~40 Reads/คน = 40,000 Reads
# - ค้นหาสินค้า (SearchPage - Client Filtering): 100 Reads/คน (จำกัด limit 100 เพื่อกันโควต้าทะลุ) x สมมติคนใช้ 300 คน/วัน = 30,000 Reads
# - ทำรายการสั่งซื้อ/Checkout: ~2 Reads, ~4 Writes/คน = 2,000 Reads, 4,000 Writes
# *รวมหน้าร้าน: ~77,000 Reads | ~4,000 Writes*
#
# 2. ระบบค้นหาสินค้า (Product Search: Zero-Read)
# - ดึง 50 รายการแรกเพื่อแสดงรูปภาพ: 50 Reads/คน = 50,000 Reads
# - พิมพ์ค้นหาสินค้าใช้ Hybrid Cache (Google Sheets): 0 Reads/คน = 0 Reads
# - ดูประวัติ/ทำ Report: ~50 Reads, 2 Writes/คน = 50,000 Reads, 2,000 Writes
# *รวม Product Search: ~100,000 Reads | ~2,000 Writes*
#
# 3. ระบบจัดการเคลม/คืนเงิน (Refund - 5% ของผู้ใช้ = 50 รายการ)
# - ขอลูกค้า (สร้างคำร้อง): 2 Reads, 1 Write/รายการ = 100 Reads, 50 Writes
# - แอดมิน (ตรวจสอบและอนุมัติผ่าน runTransaction): 3 Reads, 4 Writes/รายการ = 150 Reads, 200 Writes
# *รวมระบบคืนเงิน: ~250 Reads | ~250 Writes*
#
# 4. ระบบหลังบ้าน (Backoffice - แอดมิน 10 คน ทำงานทั้งวัน)
# - โหลดบิล/ออเดอร์รายวัน: ~150 Reads/คน = 1,500 Reads
# - ค้นหาข้อมูลลูกค้า/สินค้า: ~200 Reads/คน = 2,000 Reads
# - การจัดการสิทธิ์ Cascade & Validation (Promotions/Users): การย้าย Validation มาไว้ตอนที่สร้าง/แก้ไขโดย Admin ช่วยประหยัด Reads ของ Storefront (0 cost ฝั่งลูกค้า) โดย Admin ใช้งานส่วนนี้น้อยมาก เพิ่มเฉลี่ย ~5 Reads ต่อวัน
# - อัปเดตข้อมูล / Soft Delete: ~160 Writes/คน = 1,600 Writes
# - *ข้อควรระวัง (Todo Quota Leak):* แอดมิน 10 คนสลับหน้าจอ 10 ครั้ง/วัน โหลด Manager Tasks ทิ้ง (100 รายการ) = 10,000 Reads
# *รวมระบบหลังบ้าน: ~13,505 Reads | ~1,600 Writes*
#
# 5. ระบบปลีกย่อยอื่นๆ (Redirects, Settings)
# - อัปเดต/ค้นหา URL และตั้งค่า: ~200 Reads, 10 Writes
# *รวมระบบปลีกย่อย: ~200 Reads | ~10 Writes*
#
# 6. ระบบ PDPA & Privacy Management (อัปเดตใหม่)
# - ตรวจสอบ Consent (เก็บใน LocalStorage): 0 Reads
# - การยืนยัน PDPA สำหรับตั้งร้านค้า (สมมติ 5% = 50 คน): 50 Writes
# - การขอลบบัญชีถาวร (Right to be Forgotten - สมมติ 1% = 10 คน): 10 Reads (เช็คยอดเงิน), 20 Writes (ลบเอกสาร + เก็บ Log)
# *รวมระบบ PDPA: ~10 Reads | ~70 Writes*
#
# =====================================================================
# 📊 สรุปภาพรวมและค่าใช้จ่ายรายวัน (TOTAL ESTIMATION)
# =====================================================================
# =====================================================================
# - TOTAL READS: ~190,965 Reads / วัน
# - TOTAL WRITES: ~7,930 Writes / วัน
# - โควต้าฟรีของ Firebase: 50,000 Reads | 20,000 Writes
# - ส่วนเกิน (Over Quota): ~140,955 Reads
# 
# 💰 ค่าใช้จ่าย (COST): ~$0.05 ต่อวัน (หรือประมาณ 1.7 บาท/วัน)
# 🎯 สรุป (CONCLUSION): การพัฒนาระบบ SearchPage แบบ Client-side Filter แม้จะถูกจำกัดไว้ที่ 100 รายการต่อคน 
# แต่หากมีคนใช้เยอะ (300 คน) ก็จะเพิ่ม Reads ขึ้นอีก 30,000 Reads/วัน ทำให้ยอดรวมทะลุ Free Tier ไปที่เกือบ 2 แสน Reads 
# อย่างไรก็ตาม ค่าใช้จ่ายยังถูกมาก (ประมาณ 1.7 บาทต่อวัน) หากต้องการลด Reads ส่วนนี้ในอนาคต แนะนำให้ใช้ Algolia หรือ Typesense
# หรือสร้าง JSON Export บน Storage แล้วให้หน้าบ้านดาวน์โหลด JSON แทนการดึง Database โดยตรงครับ
