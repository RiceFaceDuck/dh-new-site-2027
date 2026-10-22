<ssr_memory>
  <flow_and_entry>
    - Entry 1: Route `/providers` -> `ProvidersPage.jsx` -> `useProvidersList.js` -> `partnerLocationService.js` (reads `ActivePartners` with 15-min cache).
    - Entry 2: Card Click `/store/:id` -> `StoreProfilePage.jsx` -> `StoreProfileHero.jsx`, `StoreProfileInfo.jsx`, `PartnerAds.jsx`, `PartnerReviews.jsx`.
    - Flow: Storefront displays active repair shops/providers sorted by GPS distance or points; clicking opens detailed profile, reviews, and ads.
  </flow_and_entry>

  <core_schema>
    - `ActivePartners/{uid}`: `partnerId`, `storeName`, `services`, `phone`, `messengerUrl`, `lineUrl`, `googleMapLink`, `latitude`, `longitude`, `storeImage`, `points`, `updatedAt`.
    - `users/{uid}/storeProfile/main`: Complete store profile (source of truth: address, landmarks, galleryImages, richDescription, social links, openHours).
    - `partner_ads/{adId}`: Ad campaign (`AD-CARD-{uid}`) linked to store card.
    - `partner_reviews/{partnerId}/comments/{reviewId}`: Customer reviews, ratings, owner replies.
    - Note: Legacy `partners` collection is empty (0 docs) and superseded by `ActivePartners`.
  </core_schema>

  <business_rules>
    - Partners only appear in radar/directory if approved by Manager (`adManagementService.js`).
    - Store profile edits (`storeProfileSubmitService.js`) temporarily remove store from `ActivePartners` pending re-approval.
    - Distance sorting uses Haversine algorithm; fallback sorts by reputation (`points`).
    - Safe Image Fallback: All partner avatars must resolve valid preview URLs (Google Drive lh3/thumbnail, Storage tokens) or clean store icons.
  </business_rules>

  <cross_impact>
    - Backoffice: `adManagementService.js` (approvals sync to `ActivePartners`), `creditActionService.js` (syncs `points`), `customerCascadeService.js`.
    - Storefront: `TopPartnerBanner.jsx`, `PartnerCard.jsx`, `StoreProfilePage.jsx`, `useNearbyPartners.js`.
    - Security Rules: `firestore.rules` under `/ActivePartners/{partnerId}` and `/partner_reviews/{partnerId}/comments/{reviewId}`.
  </cross_impact>

  <pitfalls_and_lessons>
    - ⚠️ Rules Permission Block: `storeProfileSubmitService` attempts `batch.delete(activePartnerRef)`. [RESOLVED Phase 1] `firestore.rules` updated to allow partner self-delete upon profile edit/pause.
    - ⚠️ Review Path Defect: `PartnerReviews.jsx` called `getCollectionPath` with 3 args. [RESOLVED Phase 1] Fixed to `collection(db, getCollectionPath('partner_reviews'), partnerId, 'comments')`.
    - ⚠️ Distance 0 Sort Bug: `0 || Infinity` in `useProvidersList.js`. [RESOLVED Phase 2] Fixed with numeric coordinate check and distance `0` preservation with points tie-breaker.
    - ⚠️ Dead Collection Trap: `TopPartnerBanner.jsx` queried empty `partners`. [RESOLVED Phase 3] Migrated to `ActivePartners` via `fetchAllActivePartners()`.
    - ⚠️ Field Inconsistency: Google Maps URL naming discrepancy. [RESOLVED Phase 3] Standardized fallback chain across `googleMapLink`, `mapsUrl`, and `googleMapsUrl` with auto-URL formatting.
    - ⚠️ Cache Mismatch: `storeProfileSubmitService` cleared `v3` instead of `v4`. [RESOLVED Phase 3] Synced invalidation to `v4`.
    - ⚠️ Profile Truncation: `adManagementService.approveAd` dropped fields. [RESOLVED Phase 3] Full sync + user points hydration into `ActivePartners`.
    - ⚠️ Thumbnail Heavy Stall & Double Lazy: `imageUtils` defaulted to `=w1000` on 155px cards, stalling Google CDN, while `loading="lazy"` duplicated `IntersectionObserver`. [RESOLVED] Scaled to `=w400`, removed native lazy tag, added cache ref check.
    - ⚠️ Mount Read Duplication: Concurrent calls on mount fired 2x Firebase reads. [RESOLVED] Added `inFlightFetchPromise` lock in `partnerLocationService.js`.
    - ⚠️ Image Aspect Ratio Squish: `LazyImage` wrapper div intercepted `object-*` while inner `img` received none, defaulting to `object-fit: fill`. [RESOLVED] Extracted `object-*` directly onto `img` and set `object-cover` on `PartnerCard.jsx`.
    - ⚠️ PartnerCard Whiteout & Element Overflow: Card was washed out (`bg-white/80 border-slate-200/60 shadow-[...0.05]`), avatar was overly wide (`155px`), and distance badge/View Profile used `w-max` without `min-w-0`, causing text, badge, and button to overflow the card boundary on desktop grid. Status dot also leaked past bottom edge due to `-bottom-1`. [RESOLVED] Changed to solid `bg-white`, crisp `border border-slate-200 shadow-md`, balanced avatar (`105px-125px`), added `min-w-0 truncate` and `w-fit max-w-full`, and moved status dot safely inside avatar (`bottom-1 right-1`).
    - 🎨 StoreProfile Visual Polish: Replaced text badges with official brand icons for LINE and Messenger in `StoreProfileInfo.jsx`, cleaned up technician reputation badge to display only 'ช่างเครดิตดีเยี่ยม' without raw points, and styled store status badge in `StoreProfileHero.jsx` to 'ร้านเปิด' with `rounded-[0.1rem]`.
    - 🎨 Two-Tone Slanted Action Buttons: Upgraded the 3 store action buttons in `StoreProfileHero.jsx` (Call, Maps, Share) to a balanced two-tone slanted layout with `clip-path`, 3D depth bottom border, and unified height (`h-11 md:h-12`). Updated navigation label to 'Google MAP', enlarged font size to `text-sm sm:text-base`, and applied `w-1/2 mx-auto sm:w-full` for a compact, centered 50% width on mobile.
    - 🎨 StoreProfile Info Cards Sequence: Reordered right column cards in `StoreProfileInfo.jsx` to prioritize customer contact: 1. ช่องทางการติดต่อ (Social Links), 2. ตำแหน่งที่ตั้งร้าน (Location), 3. การรับรองระบบ (Certifications).
    - 🎨 Flush Top Layout (No Cover Banner): Removed top cover gradient banner in `StoreProfileHero.jsx` and `StoreProfilePage.jsx` skeleton, shifting the hero store card flush to the top (`pt-4 md:pt-6`) with crisp white card styling (`bg-white shadow-sm border border-slate-100`).
    - 🎨 Responsive Review Box Order: Restructured CSS Grid in `StoreProfileInfo.jsx` so Customer Reviews (`PartnerReviews`) naturally renders at the bottom on mobile screens after contact/location/certifications, while preserving the exact 2-column desktop layout (`md:col-start-1 md:row-start-2`) with zero double-mounting or extra Firestore queries.
    - 🎨 Store Hero Image 400% 1:1 Scale: Expanded hero image box 400% in area from 128px (`w-32`) to 256px-320px (`w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 aspect-square`), using `object-cover` to crop edges at strict 1:1 ratio without letterboxing or aspect distortion.
    - 🎨 Responsive PC Action Button Labels: Adopted concise button wording on PC ('โทร' | 'MAP' | 'แชร์') via `hidden md:inline` to completely eliminate text truncation next to the expanded 320px hero image, while preserving full labels on mobile (`md:hidden`).
    - 🎨 Removed Status Badge: Removed 'ร้านเปิด' floating status badge from store hero image in `StoreProfileHero.jsx` for an unobstructed, clean storefront photo display.
    - 🛡️ Out-Of-Credit & Mock Cleanup: ลบ Mock AI Technical Service (`y2rG...`), ซ่อนร้านที่ไม่มีเครดิต (creditPoints <= 0) ทั้งหมดออกจาก `ActivePartners` และโฆษณาเป็น `OUT_OF_CREDIT`, พร้อมเพิ่ม Cloud Function `partnerVisibilitySync` (`onUserCreditChanged`, `onActivePartnerWritten`), ปรับ `nightlyChunkGuard` และ `partnerLocationService` ให้กรองเฉพาะ `isActive !== false && points > 0`, และอัปเกรดแคชหน้าร้านเป็น `active_partners_cache_v5` เพื่อให้หน้าร้านและเรดาร์แสดงเฉพาะร้านที่มีเครดิตจริงและกำลังเปิดทำการเท่านั้น.
    - ⚡ Event-Driven Starter Bundle Sync & Scope Defect: ร้านใหม่ไม่ปรากฏหน้าบ้านและร้านที่กดยกเลิกระงับ (Paused) ยังค้างที่หน้าบ้าน เกิดจาก 1) ใน `adManagementService.approveAd` มีการประกาศตัวแปร `let points` อยู่คนละ scope บล็อก if ทำให้เกิด ReferenceError ซิงค์ก้อน `active_partners_bundle` เงียบๆ ไม่สำเร็จ, 2) ใน `marketingService.toggleAdStatus`, `storeProfileSubmitService` และ `adManagementService.pauseAd/deleteAd` ขาดคำสั่งตัดร้านออกจากก้อน `catalogs/active_partners_bundle` แบบทันที [RESOLVED] ซิงค์ก้อน Bundle ใน Firestore ทันที, รวบรวม scope บล็อก `approveAd` ให้สมบูรณ์, และเชื่อมโยงคำสั่ง upsert/filter บน `catalogs/active_partners_bundle` ในทุกท่อการกดสลับสวิตช์และอนุมัติ/ระงับร้านแบบเรียลไทม์.
    - 📄 15-Item Page-based Pagination (Providers Directory): ปรับปรุงระบบแสดงผลหน้ารวมช่าง (`/providers`) จากปุ่มโหลดเพิ่ม (6 ร้าน/ครั้ง) เป็นระบบแบ่งหน้ามาตรฐาน (15 ร้าน/หน้า) ใน `useProvidersList.js`, `ProvidersList.jsx` และ `ProvidersPage.jsx` พร้อมตัวควบคุมเลขหน้า `< ย้อนกลับ`, เลขหน้า 1..N, `ถัดไป >` และตัวบอกช่วงรายการ `แสดง X - Y จากทั้งหมด Z รายการ`.
  </pitfalls_and_lessons>
</ssr_memory>
