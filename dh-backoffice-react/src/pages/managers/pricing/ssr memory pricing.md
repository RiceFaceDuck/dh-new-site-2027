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
- ⚠️ Always sanitize comma in cost: `parseFloat("1,500") === 1` causes catastrophic price drops (loss of 1,410+ THB).
- ⚠️ Beware empty category: a rule with empty category must NEVER act as an 'all' wildcard hijacking other categories.
- ⚠️ Keep `normalizeCategory` centralized in `pricingService.js` (or `dh-shared`) to prevent desync.
- ⚠️ Preserve custom retail prices in product form; `isAutoCalc` should not silently wipe manual prices.
- ⚠️ Read quota: pool random SKU queries (20 items in memory) instead of querying per click.
- ⚠️ Always preserve local backup before mutating pricing logic.
</pitfalls_and_lessons>
</grimoire>
