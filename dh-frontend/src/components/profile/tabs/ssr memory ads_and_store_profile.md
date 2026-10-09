<ssr_memory>
<flow_and_entry>
- Entry: `Profile.jsx` (?tab=ads) -> `TabAdManager.jsx` -> Subtabs: Store Profile (`StoreProfileForm.jsx`) & Ads List (`AdListTable.jsx`, `AdFormModal.jsx`).
- Data Flow: Store Profile saves to `users/{uid}/storeProfile/main` & creates `TODO-AD-CARD-{uid}`. Ads save to `partner_ads` (+ legacy `user_sku_ads`/`billboard_ads`) & `todos`.
- Approval Flow: Backoffice `managerActionService.js` -> `adManagementService.approveAd` syncs approved card to `ActivePartners/{uid}`.
</flow_and_entry>

<core_schema>
- `users/{uid}/storeProfile/main`: { storeName, phone, services, openHours, storeImage, galleryImages, address, googleMapLink, latitude, longitude, isSupportActive }
- `partner_ads/{adId}`: { id, type('BUSINESS_CARD'|'PRODUCT_LINK'|'BILLBOARD'), ownerId, title, imageUrl, targetUrl, stats:{views, clicks}, creditLimit, status('pending'|'active'|'paused'|'rejected') }
- `ActivePartners/{uid}`: { partnerId, storeName, services, phone, latitude, longitude, storeImage, points, isActive }
- `todos/{taskId}`: { taskId, type('AD_APPROVAL'|'USER_SKU_APPROVAL'|'BILLBOARD_APPROVAL'), status, targetSkuId, partnerId, adDetails }
</core_schema>

<business_rules>
- Store Profile edits reset Live card to PENDING; deletes immediately from `ActivePartners` until Manager approves.
- Business card ad is derived directly from Store Profile; cannot be edited from Ads modal.
- Active card requires valid GPS coordinates (`latitude`, `longitude`) before accepting support.
- Non-staff users MUST NOT be able to approve ads; status can only be toggled between active/paused if already approved.
</business_rules>

<cross_impact>
- `StoreProfilePage.jsx` & `useNearbyPartners.js`: Directly read `ActivePartners` for storefront radar map and distances.
- `managerActionService.js` (Backoffice): Approves/rejects todos; must match payload structure of `TODO-AD-*`.
- `creditService.js` & `ga4AdSyncCron.js`: Budget deduction on impressions/clicks affects user credit wallet.
</cross_impact>

<pitfalls_and_lessons>
- ⚠️ Rules Barrier (FIXED Phase 1): Updated `firestore.rules` allowing owners to toggle between active/paused for approved ads.
- ⚠️ Dual-write & Quota (FIXED Phase 2): Unified into single `partner_ads` SSOT query; purged legacy `artifacts/...` reads.
- ⚠️ Budget Checksum (FIXED Phase 3): Fixed `marketingAnalyticsService` comparing spent budget points against creditLimit instead of raw views.
- ⚠️ Orphan Hook (FIXED Phase 4): Refactored `TabAdManager.jsx` into Pure UI component hooked to `useAdManager.js` with 0ms realtime listener.
- ⚠️ Script Execution Policy: Always run builds with `cmd.exe /c "npm run build"` in Windows PowerShell environments.
- ⚠️ Store Profile Fallback (FIXED): Always maintain fallback read from `artifacts` when `users/{uid}/storeProfile/main` does not yet exist to prevent existing user data disappearing.
- ⚠️ Avatar CDN Block (FIXED): Set `referrerPolicy="no-referrer"` and `onError` on Google photo avatars to prevent 403 blocks on localhost.
- ⚠️ Nominatim 403 Rate Limit (FIXED Watchlist): Applied in-memory `geocodeCache`, 600ms debounce, and AbortController to reverse geocoding.
- ⚠️ Rules Re-inspection Barrier (FIXED Review 1): Allowed ad owners to submit for re-inspection (`status: pending`, `isActive: false`) while keeping stats protected.
- ⚠️ Backoffice SSOT Resolution (FIXED Review 1): `adManagementService` now checks `partner_ads` first before legacy collections for approve/reject/pause.
- ⚠️ Exotic Coordinates Parsing (FIXED Review 1 & 2): Supported `!3d!4d`, URL parameters, comma, space, and plus delimiters in `StoreProfileLocation`.
- ⚠️ System Logs Permission (FIXED Review 2): Allowed marketing telemetry in `system_logs` to prevent ad creation/edit batch rejections.
- ⚠️ Backoffice DeleteAd Crash (FIXED Review 2): Implemented `deleteAd` on `adManagementService` with ActivePartners cleanup.
- ⚠️ Resilient Master Sync (FIXED Review 2): Used `batch.set(..., { merge: true })` in `marketingAnalyticsService` to protect unmigrated ads.
- ⚠️ Todo Update Lockout (FIXED Review 3): Allowed ad approval todos to update content on re-submission while locking status to pending.
- ⚠️ Backoffice Ad Types Parity (FIXED Review 3): Synced `resubmitPartnerAd` task types with backoffice `MANAGER_TASK_TYPES`, `TodoItem`, and `managerActionService`.
- ⚠️ User Ads Cache Invalidation (FIXED Review 3): Invalidate `userAdsCache` across all ad mutation flows and sort createdAt safely.
- ⚠️ Broken Image CDN & Raw Img Failure (FIXED Phase 1): Purged raw `<img>` tags in `StoreProfileBasicInfo`, `AdListTable`, and `AdFormModal` in favor of `LazyImage` with multi-tier Google Drive resolving and local `/logo.png` fallback, eliminating broken `[ ] Store` and `[ ] Ad` placeholder boxes.
- ⚠️ Calm UI Invariant Badge (FIXED Phase 2): Removed `animate-pulse` from the Pending status badge in `StoreProfileForm.jsx`, establishing quiet, non-distracting visual badges.
- ⚠️ Quota Shield Listener Mount (FIXED Phase 3): Purged redundant `fetchMyAds()` concurrent execution with `onSnapshot` inside `useAdManager.js` mount effect, cutting initial read consumption by 50% while maintaining real-time updates.
- ⚠️ Dual Approval Split-Brain (FIXED Phase 1): หน้า `/ads` ของผู้จัดการเดิมเขียนตรงลง Firestore ข้าม `ActivePartners` และใส่ `status: 'APPROVED'` -> ปรับปรุงให้เรียกใช้ `adManagementService.approveAd` และ `rejectAd` เป็นศูนย์กลางเดียวกัน
- ⚠️ Radar Disappearance on Unpause (FIXED Phase 1): เดิมการ toggleAdStatus ลบหมุดออกจาก `ActivePartners` ตอน paused แต่ไม่คืนค่าตอน active -> ซิงค์คืนค่าลง `ActivePartners` และล้าง cache ท้องถิ่นอัตโนมัติ
- ⚠️ Todo Schema Mismatch Blanking (FIXED Phase 1): ฟอร์มโปรไฟล์ร้านเซฟ `adDetails` แต่การ์ดอนุมัติอ่าน `adPayload` -> ปรับให้ส่งทั้งคู่ และเพิ่ม Fallback เช็ค `adPayload || adDetails || skuDetails` ใน `AdApprovalCard`
- ⚠️ Relative URL 404 Resolution (FIXED Phase 2): ปลายทางไม่มี protocol ทำให้ตกเป็น relative path เช่น `/profile/shopee.co.th` -> สร้าง `sanitizeUrl` / `getSafeUrl` เติม `https://` อัตโนมัติและตรวจ URL protocol ก่อน submit
- ⚠️ Unchecked File Upload & Negative Price (FIXED Phase 2): เดิมอนุญาตให้อัปโหลดไฟล์ใดก็ได้ไม่เกิน 10MB และไม่ได้บล็อกราคาติดลบ -> เพิ่ม MIME type guard (`image/jpeg,image/png,image/webp`) และ `min="0"` บน input/submit
- ⚠️ Billing Transparency & Remaining Points (FIXED Phase 3): เดิม `spentBudget` ถูกบันทึกลง Firestore แต่ไม่แสดงบนหน้าจอ ทำให้พาร์ทเนอร์ไม่รู้ว่าใช้แต้มไปเท่าไร -> เพิ่มการแสดง `ใช้ไป / งบ (Pts)` ทั้งใน Mobile Card และ Desktop Table รวมถึงแสดงผลแต้มคงเหลือแบบไดนามิกใน `AdFormModal`
- ⚠️ Read Quota Over-fetch (FIXED Phase 4): `getActiveAds` ใน `marketingService.js` เดิมดึง 100 docs แล้วมา slice 30 ในหน่วยความจำ -> ปรับ `limit(30)` ที่ query ตรง ลดโควต้าอ่าน 70% และลบ dead state `adToDelete` ออกจาก `useAdManager`
- 🎨 UI Minimal Theme Harmony (FIXED): ปรับแถบ Header บนเป็น Deep Slate Navy (`bg-slate-900`) และกล่อง Ads/Store Banner ด้านล่างเป็น Ice Slate (`bg-slate-100/90`) มินิมอล อ่านง่าย ลดแสงสะท้อนและมลภาวะทางสายตา
- 🛡️ Store Profile Audit & Approval Flow Verified (CONFIRMED): ตรวจสอบกระบวนการบันทึก Store Profile -> สร้าง TODO-AD-CARD -> ซิงค์ ActivePartners บน Backoffice ผ่านฉลาก 100% สถาปัตยกรรมแยกส่วน SRP สะอาด โควต้าอ่านเขียนต่ำ และ Rules แข็งแกร่ง
- ⚠️ Toggle State Split-Brain & Todo Deletion on Submit (FIXED): เดิม `isCardLive` สับสนกับ `storeData.isSupportActive` ทำให้สวิตช์หน้าเว็บเปิดอยู่แต่ฟอร์มส่ง `false` ส่งผลให้ `storeProfileSubmitService` วิ่งเข้ากิ่ง else และลบ `todos` ทิ้ง -> แก้ไขโดยผูก explicit value boolean กับสลับสวิตช์ พร้อมเพิ่ม Fail-Safe ใน `storeProfileSubmitService` ว่าหากมีพิกัดร้านพร้อมใช้งาน ให้ยิงคำขอ `AD_APPROVAL` ส่งให้ผู้จัดการเสมอ
- 🌟 Central Operations Todo & Admin Approval Parity (FIXED): เดิม `Todo.jsx` กรอง `AD_APPROVAL` ออกไปให้เฉพาะผู้จัดการ และการ์ดเดิมซ่อนปุ่มอนุมัติหากไม่ใช่ผู้จัดการ -> ปลดล็อกให้แสดงในหน้าศูนย์ปฏิบัติการส่วนกลาง (`/todo`) พร้อมเพิ่มปุ่มตัวกรอง `STORE_ADS` ("อนุมัติร้าน/โฆษณา") และสร้าง `StoreProfileApprovalCard.jsx` นำเสนอข้อมูลร้านค้าครบถ้วน (รูปหน้าร้าน, แกลเลอรี, พิกัด GPS พร้อมลิงก์ Google Maps, เวลาเปิด-ปิด, เบอร์โทร, โซเชียลมีเดีย) มอบอำนาจให้แอดมินหลังบ้านตรวจสอบและกดอนุมัติ/ปฏิเสธได้โดยตรง
</pitfalls_and_lessons>
</ssr_memory>
