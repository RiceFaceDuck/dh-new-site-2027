<grimoire>
<flow_and_entry>
- Entry: `pages/managers/PricingSettings.jsx` -> consumes `hooks/usePricingSettings.js`.
- Renders `SmartRoundingPolicy`, `PricingRulesTable`, `PricingHistoryLog` (left), and `PricingSimulation` (right).
- Data flows to/from Firestore document `settings/pricing` via `pricingService.js`.
</flow_and_entry>

<core_schema>
- `settings/pricing`: { rounding: { type: 'custom'|'none', primaryTarget: string, enableFallback: boolean, fallbackTarget: string }, rules: Array<{ id: string, category: string, operator: '<'|'<='|'>'|'>='|'all', threshold: number, action: '*'|'/', value: number, isActive: boolean }> }
- `history_logs`: { module: 'PricingConfig', targetId: 'System_Pricing', action: 'Update', details: string, performedBy: uid }
</core_schema>

<business_rules>
- Top-Down Evaluation: Rules MUST be evaluated sequentially from top to bottom. Never auto-sort by threshold or category.
- Loss Prevention Floor: If final calculated price <= cost, force `price = cost + 100` with warning label 'ปัดขึ้นฉุกเฉิน (ป้องกันขาดทุน)'.
- Normalized Category Matching: Rules match canonical categories as well as aliases (e.g. 'หน้าจอ' -> 'Panel', 'Screen' -> 'Panel').
- Read Quota Economy: Fetch `settings/pricing` as a single doc (1 read). For simulation randomizer, sample small category pools (<15 docs).
- Zero Deploy Enforcement: Absolute ban on any deployment to production hosting, functions, or rules.
</business_rules>

<cross_impact>
- Product Modal (`ProductPricingStock.jsx` / `useProductForm.js`): Consumes `pricingService.calculateRetailPrice` when editing product costs.
- Inventory Search / View (`/inventory?sku=...&modal=true`): Linked from simulation product details.
- Managers Overview (`/managers`): Back button route and menu entry.
</cross_impact>

<pitfalls_and_lessons>
- ⚠️ DO NOT auto-sort `config.rules` on load or during save; doing so corrupts deliberate top-down rule ordering.
- ⚠️ Ensure `SmartRoundingPolicy` remains full horizontal bar on the left column, not right rail.
- ⚠️ Simulation dual modes (SKU vs Manual) must handle missing products gracefully without crashing.
- ⚠️ Always preserve local backup before mutating pricing logic.
</pitfalls_and_lessons>
</grimoire>
