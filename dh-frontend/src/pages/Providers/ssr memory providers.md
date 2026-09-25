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
    - ⚠️ Lingering Background Task: Firebase SDK holds event loop open if `process.exit(0)` is omitted in test scripts, causing UI spinner to hang. [RESOLVED] Enforce `process.exit(0)` in all verification scripts and kill tasks immediately.
  </pitfalls_and_lessons>
</ssr_memory>
