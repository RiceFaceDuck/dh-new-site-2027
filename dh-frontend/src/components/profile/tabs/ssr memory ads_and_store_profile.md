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
- ⚠️ Exotic Coordinates Parsing (FIXED Review 1): Supported `!3d!4d` Google Maps pins and URL parameter formats in `StoreProfileLocation`.
</pitfalls_and_lessons>
</ssr_memory>
