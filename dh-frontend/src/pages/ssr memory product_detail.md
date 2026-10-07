<ssr_memory>
  <flow_and_entry>
    - Entry: `ProductDetail.jsx` -> `useProductDetail.js` -> `productService.js` (real-time `subscribeToProduct`).
    - Presentation: `ProductImageSection.jsx`, `ProductPricingSection.jsx`, `ProductSpecsSection.jsx`, `ProductCommunitySection.jsx`.
    - Data Path: Product fetches via `id` (SKU), reads live variant state from `?variant=` URL param, and pushes items into `CartProvider.jsx`.
  </flow_and_entry>

  <core_schema>
    - `products`: `sku` (id), `name`, `retailPrice`, `stockQuantity`, `bufferStock`, `variantOptions` ([]), `variants` ([{sku, attributes, price, retailPrice, stockQuantity, bufferStock}]).
    - `cartItems`: `id` (variant SKU or product ID), `sku`, `parentId` (root doc ID for variants), `variantAttributes`, `price`, `salePrice`, `qty`.
    - `orders`: `items` (re-hydrated with DB prices), `totals`, `isStockDeducted` (true).
  </core_schema>

  <business_rules>
    - Wholesale Cost Protection: Never fallback `price` to `wholesalePrice` or `cost`. Missing `retailPrice` marks item unpurchasable.
    - Props Sanitization: Never pass raw Firestore doc `_raw` into client components.
    - Two-Tier Variant Deductions: Checkout transaction must atomically deduct variant `stockQuantity` inside `variants` array and root doc `stockQuantity`.
    - Buffer Stock Rule: Must verify `isStockAvailableForSale` against `resolveEffectiveBuffer` for both variant and parent.
    - Safe Guest Access: Unauthenticated users must receive default credit configs without throwing `permission-denied`.
  </business_rules>

  <cross_impact>
    - Cart Subsystem: `CartProvider.jsx`, `useCartLogic.js` require `parentId` to validate variant stock against parent doc `variants` array.
    - Checkout Engine: `checkoutSubmitService.js` deducts both root stock and nested variant stock in `variants` array atomically.
    - Backend Scheduled Jobs: `functions/inventory/nightlyChunkGuard.js` reconstructs directory catalogs for customer and POS search.
    - Security Rules: `firestore.rules` guards `product_reviews` spam and permits `PRODUCT_KNOWLEDGE_APPROVAL` with `creditReward <= 2`.
  </cross_impact>

  <pitfalls_and_lessons>
    - ⚠️ Variant Param Functional Updater Trap: Passing `prev => ({...prev, [k]: v})` to `setSelectedVariant` without function check stringified to `undefined`, breaking URL and wiping state. [RESOLVED] Supported updater fn and clean `URLSearchParams`.
    - ⚠️ Wholesale Price Exposure: `productService.js` previously fell back to `wholesalePrice`. [RESOLVED] Removed fallback and set `isOutOfStock` if `retailPrice <= 0`.
    - ⚠️ Variant Orphan in Cart: Checking variant SKU directly on `products` collection returned `notFound: true`. [RESOLVED] Preserved `parentId` and queried parent doc to inspect embedded `variants`.
    - ⚠️ NightlyChunkGuard Crash: Forgotten `docSnap.data()` crashed 3 AM cron with `ReferenceError`. [RESOLVED] Restored `docSnap.data()`.
    - ⚠️ Duplicate Review Rules: Duplicate match block allowed bypassing length and rating spam checks. [RESOLVED] Consolidated to single quota-guarded rule.
    - ⚠️ 2x Review Mount Quota Leak: Having <ProductCommunitySection> duplicated in JSX for desktop vs mobile doubled Firestore review queries. [RESOLVED] Unified to single responsive mount below specs (50% quota reduction).
    - ⚠️ Uncached Config & Ad Fetching: Every product view queried knowledge_config, credit_config, and partner_ads repeatedly. [RESOLVED] Added 5-10m in-memory caches and extracted dedicated hooks (useProductReviews, useNearestPartner, useRelatedProducts).
    - ⚠️ Telemetry & SEO Schema Blindspot: Product page lacked GA4 e-commerce events and rich snippets (SKU, MPN, seller, breadcrumbs). [RESOLVED] Connected productAnalyticsService and enriched JSON-LD with BreadcrumbList.
    - ⚠️ Invasive Clipboard Hijack & Mobile Scroll Barrier: onCopy overwrote user clipboard with promo ads, and mobile lacked sticky buy bar. [RESOLVED] Replaced onCopy with copy SKU button, fixed specs acronym regex, and added floating Mobile Sticky Action Bar.
    - ⚠️ Product Detail & Reviews Viewport Quota Leak: Opening product detail previously triggered eager queries for 5 reviews and 6 related products even if user never scrolled down. [RESOLVED] Implemented Viewport Lazy Fetching using `useInView` (Intersection Observer) + zero-leak guard when `reviewCount === 0` and Tier 1 category chunk mapping, saving up to 11-15 reads per product view (down to 1 read).
  </pitfalls_and_lessons>
</ssr_memory>
