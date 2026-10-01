<grimoire>
  <flow_and_entry>
    Entry: src/pages/managers/PromotionManagement.jsx -> hooks/usePromotions.js -> components/promotion/
    Services: promotionService.js (Firestore CRUD & SKU validation) -> pos/hooks/usePromotionLogic.js (POS Billing)
    Data Flow: Manager creates promo -> Broadcasts todo to staff -> POS & Storefront fetch active promos -> Evaluates eligibility -> Applies discount at checkout.
  </flow_and_entry>

  <core_schema>
    Collection: promotions
    Doc ID: auto-generated
    Fields: title, description, type ('PERCENTAGE'|'FIXED_AMOUNT'), value, minSpend, minQty, maxDiscount, customerType ('ALL'|'RETAIL'|'WHOLESALE'|'VIP'), applicableSkus[], startDate, endDate, quotaLimit, quotaUsed, isActive, createdBy, createdAt, updatedAt, deletedAt.
    Order linkage: orders.appliedPromotion: { id, title, type, value, minSpend, maxDiscount, ... }
  </core_schema>

  <business_rules>
    1. Single Best Promo: POS & Storefront auto-select the promo offering highest baht discount; no multi-promo stacking.
    2. Minimum Spend Boundary: In Storefront minSpend evaluates against eligibleItems; in POS it currently checks total cart (needs alignment).
    3. Quota Integrity: quotaUsed must increment atomically per order; POS billing currently misses quota increment.
    4. Soft Delete Only: Deletion sets deletedAt timestamp and isActive: false to preserve historical order references.
    5. Role Access: Promotion creation and deletion must be restricted to Manager/Admin; packer/technician must not mutate promos.
  </business_rules>

  <cross_impact>
    - Backoffice POS: src/components/billing/pos/hooks/usePromotionLogic.js, usePosActions.js, PromoModal.jsx, PromotionSettings.jsx.
    - Storefront: dh-frontend/src/hooks/usePromotions.js, CartActivePromotions.jsx, PrivilegeSelector.jsx, checkoutSubmitService.js.
    - Shared Engine: dh-shared/src/priceEngine.js (critical enum discrepancy: 'FIXED' vs 'FIXED_AMOUNT').
    - Rules & Functions: firestore.rules (/promotions/{id}), Todo notification broadcasting.
  </cross_impact>

  <pitfalls_and_lessons>
    - ⚠️ Enum Mismatch Resolved: dh-shared/src/priceEngine.js now handles both 'FIXED' and 'FIXED_AMOUNT', clamped to applicable subtotal.
    - ⚠️ POS Quota Resolved: billingTransactionService supports both appliedPromotions (array) and appliedPromotion (object) to atomically increment quotaUsed.
    - ⚠️ Action Buttons UI: Removed opacity-0 group-hover to ensure Edit/Delete are permanently visible on touchscreen and desktop.
    - ⚠️ PromoModal & Security Rules Resolved (Phase 2): PromoModal now strictly enforces customerType, dates, minQty, and SKUs with clear badges; firestore.rules restricts create/delete to isManagerOrAdmin and enforces quotaLimit ceiling.
    - ⚠️ Telemetry & Schema Registry (Phase 3): Registered PROMOTIONS and FREEBIES in schemaKeys.js; integrated GA4 view_promotion and select_promotion in promotionAnalyticsService.js without blocking UI execution.
    - ⚠️ Zero-Read SKU Validation (Watchlist): validateSkus in promotionService queries inventorySyncMetaService (0 network reads from IndexedDB cache) with uppercase SKU mapping and Firestore fallback.
  </pitfalls_and_lessons>
</grimoire>
