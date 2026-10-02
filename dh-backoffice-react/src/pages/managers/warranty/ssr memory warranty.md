<ssr_local_grimoire name="warranty">
  <flow_and_entry>
    - Entry: GlobalWarrantySettings.jsx -> useWarrantyManager.js -> warrantyService.js -> dh-shared/warrantyUtils.js
    - Route: /managers/warranty wrapped by ManagerRoute in App.jsx
    - Data Flow: Loads settings/warranty, cross-checks settings/product_categories, updates settings/warranty, and resolves todos. Shared calculation centralized in dh-shared/warrantyUtils.js.
  </flow_and_entry>

  <core_schema>
    - Document: settings/warranty -> categories: Record<catName, { claimDays: number, returnDays: number }>, skus: Record<sku, { claimDays: number, returnDays: number }>
    - Auxiliary: settings/product_categories -> categories: string[]
    - Todos: todos -> { type: 'WARRANTY_SETUP', categoryName: string, status: 'todo'|'completed' }
  </core_schema>

  <business_rules>
    - Base categories defaulted: Panel (180/7), Keyboard (90/7), Battery (180/7), Adapter (180/7), General (30/7).
    - Unconfigured categories detected from product_categories are flagged with "หมวดหมู่ใหม่" badge.
    - Saving warranty settings auto-completes pending WARRANTY_SETUP todos and logs SystemConfig update to history_logs.
    - Access restricted to Manager/Admin/Owner roles via ManagerRoute and Firestore Rules.
  </business_rules>

  <cross_impact>
    - POS / Billing: Uses warranty rules to compute item warranty expiry date at order checkout.
    - Claims / WarrantyCheckModal: Reads warrantyService to evaluate remaining claim and return periods.
    - Todos System: Triggered by new inventory categories and auto-resolved on settings save.
  </cross_impact>

  <pitfalls_and_lessons>
    - ⚠️ Expand normalizeCategoryName dictionary (Speaker, Fan, Cable, Hinge) to prevent duplicate cards (e.g. SPEAKER vs ลำโพง).
    - ⚠️ Consumer components must use normalized category resolution to prevent Thai categories dropping to 30-day default.
    - ⚠️ Double logging resolved: useWarrantyManager.js delegates diff logging directly to warrantyService.updateWarrantySettings.
    - ⚠️ Quota spike resolved: checkAndTriggerWarrantyTasksForBatch loads settings and todos once (2N+1 -> 2 reads).
    - ⚠️ Zero deployment rule enforced: all changes remain strictly local.
  </pitfalls_and_lessons>
</ssr_local_grimoire>
