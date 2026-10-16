<ssr_memory>
  <workflow>
    1. Inventory Main Page Mount:
       - `useInventoryData` queries Firestore `settings/inventory` for buffer configurations, `categories`, and paginated `products` via React Query (`inventoryInitial`).
       - Fetches 5-dimension stock metrics (stockIn, sales, claim, adjustment) via `inventoryStatsService.fetchProductStats` using 3-tier fallback (L2 IDB cache -> Snapshot doc -> Products catalog).
    2. Search & Filtering:
       - User types in `searchTerm` (debounced 300ms) or selects `filterCategory` or `salesPeriod` (7, 30, 90, 365 days).
       - `useInventorySearch` performs client-side instant filtering across in-memory catalog without triggering repeated Firestore reads.
    3. 5D Stock Recalculation (5D Sync):
       - User clicks the "5D Sync" (`RefreshCw`) button in `InventoryHeader`.
       - `handleRecalculateStats` sets `isRecalculating` to true.
       - Calls `inventoryStatsService.recalculateDailyStats()`, purging stale IndexedDB caches (`IDB_STATS_CACHE_KEY`, `IDB_STATS_MAP_KEY`, `IDB_STATS_SNAPSHOT_KEY`).
       - Fetches fresh snapshot data from `catalogs/inventory_stats_snapshot` (1 Read) and updates IDB keys.
       - Refetches `fetchInitialProducts()` to hydrate UI with fresh 5D metrics, then releases loading spinner.
    4. Auto-Sync & Google Sheets:
       - Product updates, adds, or soft-deletes enqueue changes via `gasStockService` and `inventorySyncService`, broadcasting to Google Sheets in background.
  </workflow>

  <core_schema>
    1. Product Entity (`products/{productId}`):
       - `sku`: string (unique merchant code)
       - `name`: string
       - `Price`: number (retail/wholesale)
       - `retailPrice`: number (optional retail override)
       - `wholesalePrice`: number (wholesale base)
       - `stockQuantity`: number (current available count)
       - `bufferStock`: number (minimum warning threshold)
       - `category`: string
       - `isActive`: boolean (true = active, false = discontinued)
       - `stockInHistory`: Record<string, number> (7, 30, 90, 365 days)
       - `salesHistory`: Record<string, number>
       - `claimHistory`: Record<string, number>
       - `adjustmentHistory`: Record<string, number>
    2. Stats Snapshot Entity (`catalogs/inventory_stats_snapshot`):
       - `snapshotId`: 'inventory_stats_snapshot'
       - `statsVersion`: number (e.g. 2)
       - `periods`: ['7', '30', '90', '365']
       - `statsMap`: Record<string, { stockIn: object, sales: object, claim: object, adjustment: object }>
       - `statsBySku`: Compact matrix array or map
       - `totalSkus`: number
       - `updatedAt`: Timestamp
    3. IndexedDB Keys (`idb-keyval`):
       - `IDB_STATS_CACHE_KEY`: 'dh_inv_stats_cache'
       - `IDB_STATS_MAP_KEY`: 'dh_inv_stats_map'
       - `IDB_STATS_SNAPSHOT_KEY`: 'dh_inv_stats_snapshot'
       - `IDB_CATALOG_KEY`: 'dh_catalog_cache'
       - `IDB_FULL_CACHE_KEY`: 'dh_inv_full_cache'
  </core_schema>

  <rules_and_conditions>
    1. Zero Unbounded Queries: Never issue unbounded `collection('products')` full scans on page mount. Always use pagination or chunked catalog architecture.
    2. Cache & Overwrite Invariant: Product and stats reads must leverage L2 IndexedDB cache (0 Firestore Reads on warm reload).
    3. Controller-Header Wire Contract: Controller hook `useInventoryController` must export both `handleRecalculateStats` and `isRecalculating`, and `InventoryMain` must forward them to `InventoryHeader`.
    4. UTF-8 Clean Encoding: Strictly preserve clean UTF-8 encoding in all Thai UI text and comments to prevent ANSI/mojibake corruption.
    5. Clean Architecture Boundary: UI components (`InventoryHeader`, `ProductTable`) remain purely presentational. Data mutation and recalculation logic belong strictly in services (`inventoryStatsService`) and controllers (`useInventoryController`).
  </rules_and_conditions>

  <techniques>
    1. Optimistic UI with Loading State: `isRecalculating` displays spinning `RefreshCw` icon and disables the button during async recalculation to prevent race conditions from rapid double-clicks.
    2. Dual Cache Purge: In `recalculateDailyStats`, purge both standard and legacy keys in parallel via `Promise.all([del(IDB_STATS_CACHE_KEY), del(IDB_STATS_MAP_KEY), del('inventory_stats_cache'), del('inventory_stats_map')])`.
    3. Safe Envelope Unwrapping: `parseStatsSnapshot` safely handles both wrapped envelope `{ statsMap: {...} }`, `{ statsBySku: {...} }`, and direct raw JSON strings.
    4. Hover-Intent Prefetching: `handlePrefetchSearch` preloads backup inventory into `sessionStorage` on search input hover or focus to accelerate autocomplete without blocking initial render.
  </techniques>

  <lessons_learned>
    1. ⚠️ Prop Destructuring Drop: During refactoring, if a controller hook returns new handlers (`handleRecalculateStats`, `isRecalculating`), the consuming page MUST destructure and pass them to child headers. Omitting them renders buttons conditionally invisible, silently breaking UI features and automated tests.
    2. ⚠️ Windows Encoding Pitfalls: Windows text editors or script tools can accidentally rewrite files in Windows-874 or ANSI, creating Mojibake (e.g. "เธ เธณเธฅเธฑเธ‡เน‚เธซเธฅเธ”"). Always enforce UTF-8 without BOM across all source files.
    3. ⚠️ Monorepo Build Integrity: Always run `npm run build` after editing shared services or controller hooks to catch syntax errors, broken imports, or missing exports before handoff.
    4. ⚠️ 10-Column Production UI Layout Invariant: The Inventory page table strictly requires 10 columns in exact sequence: (1) รูป, (2) SKU / ชื่อสินค้า, (3) หมวดหมู่, (4) ราคาส่ง (ฐาน), (5) ราคาปกติ, (6) คงเหลือ, (7) เข้า, (8) ขาย, (9) ของเสีย, (10) ปรับยอด. Table column widths, colors, borders, and controls (GAS Backup Disabled 0%, Enter shortcut pill, search progress) must stay pixel-aligned with production bundle.
    5. ⚠️ 5D Stats & Sorting Completeness: When adding or aligning table columns (such as `ปรับยอด` / Adjustment and `หมวดหมู่` / Category), ensure that UI search/sort hooks (`useInventorySearch`) properly merge all stats dimensions into product entities and handle corresponding sort keys. Furthermore, render rows defensively with null guards, baseline fallbacks, and NaN-safe number formatters to prevent runtime UI crashes under unexpected data.
    6. ⚠️ Fallback Synchronization & Dirty Data Defense: Never hardcode `{ '30': 0, '60': 0, '90': 0 }` in search/sort hooks as it clobbers cold-start baselines (`stockIn30D`, `sales30D`, `claims30D`, `adjustment30D`, `stats.sold`) with zero. Always resolve metric fallbacks centrally in the data mapping hook to guarantee 100% synchronization between table cell displays and header sorting. Defensively guard dirty tags (comma-separated strings vs arrays) and URL string images (preventing single-character indexing bugs), and apply Thai locale collation (`localeCompare('th')`) for category sorting.
    7. ⚠️ Search Robustness, Pagination Clamping & Icon Parity: Always defensively normalize `searchTerm` before calling `.trim()` to guard against `null`, `undefined`, or numeric values. Prevent transitional pagination slicing bugs when catalog sizes change by deriving a clamped `safeCurrentPage` immediately during the render pass (preventing inverted ranges like `85 - 10` and empty slices). Ensure exact Lucide icon parity with the production bundle: use `Image` (not `Package`) for missing row thumbnails, `LoaderCircle` (not `RefreshCw`) for the pagination searching indicator, and `RefreshCw` for the header sync action.
    8. ⚠️ Phantom Fallback & Zero Metric Gate: Never reject '0' in metric resolution (`Number(statVal) !== 0`). Authentic snapshots carry genuine '0' inbound stock; rejecting 0 causes fallbacks to pick up legacy dotted import junk (e.g. `stockInHistory.30`: 75), producing phantom numbers. Trust snapshot numeric zero directly.
    9. ⚠️ Export Modal Category Object Render Crash & Modal Error Boundary: In `ExportFiltersTab.jsx`, when `availableCategories` receives an array of Category Objects (`{id, name, order, imageUrl, updatedAt, isActive, status, createdAt}`) from `categoryService.getAllCategories()`, NEVER render `cat` directly as a React child (`<span>{cat}</span>` or `key={cat}`). Always safely extract string names (`typeof cat === 'object' ? cat.name : String(cat)`). Furthermore, wrap all lazy-loaded modals with `ModalErrorBoundary` in `InventoryMain.jsx` to prevent any modal crash from tearing down the entire table view.
    10. ⚠️ Table Row Category Object Guard & Toast Notification Standard: In `ProductTableRow.jsx`, always guard `product.category` with an Object Guard (`typeof product.category === 'object' ? product.category.name : product.category`) to prevent dirty/migrated database entities from crashing table rendering. Replace all browser-blocking native `alert()` calls in controllers and hooks with non-blocking `toast.error()` and `toast.success()`.
    11. ⚠️ Cold-Start Quota Optimization in useInventoryData: Never issue `getPaginatedProducts(50)` on initial page mount when `catalogHydrationService` is available. Always hydrate from the 3-tier chunked catalog (`catalogHydrationService.hydrateCatalog()`) to eliminate 50 direct individual Firestore doc reads on cold start and achieve 0 reads on warm cache.
    12. ⚠️ Stock Checksum Math & Monotonicity Invariant: Validated the core stock balance equation (`Current Stock = Base + StockIn - Sales - Claims + Adjustments`), 5D temporal monotonicity law (`7D <= 30D <= 90D <= 365D`), compact matrix decoding (17/21/25 numbers in `parseStatsSnapshot`), and strict boolean parity `inStock === (stockQuantity > 0)` to guarantee zero phantom data and zero silent drift.
    13. ⚠️ Excel Bulk Import Batch Guard & Zero-Read Pre-check: In `inventoryImportService.js`, never batch write using raw product count (`slice(500)`) because each new or restocked item generates a secondary `stock_receipts` doc, overflowing Firestore's strict 500-operation limit. Always dynamically tally operation units (`currentOps + requiredOps <= 400`). Furthermore, resolve existing SKUs against Local Catalog Cache (IndexedDB / Session via `catalogHydrationService`) first to achieve 0 Reads during preview, and pass the resolved map directly into the write stage to eliminate redundant second-pass queries.
    14. ⚠️ Batch Receipt Bundling & Virtual Windowing Invariant: Instead of dispersing single stock receipts into thousands of individual docs, bundle import receipts into a single transactional `inventory_import_batches` document containing item arrays (cutting write operations by up to 50%). Immediately refresh the local catalog cache via `updateCatalogCacheWithProducts` for 0-Read UI synchronicity. For import previewing, always mount `TableVirtuoso` instead of unvirtualized HTML `<tbody>` to guarantee 60fps rendering even with 5,000+ Excel rows.
    15. ⚠️ Category Object Sort & Filter Shield: When Firestore entities contain `category` as an Object `{ id, name, type }`, always normalize category extraction in `useInventorySorting.js` and `useInventoryFilters.js` via `typeof cat === 'object' && cat !== null ? (cat.name || cat.type || '') : String(cat || '')` to prevent sorting corruption and items disappearing from filtered results.
    16. ⚠️ Zero Native Alert / Confirm / Prompt Invariant: Fully eradicated `window.confirm`, `alert()`, and `window.prompt` across inventory modals and hooks. Replaced with interactive toast confirmation dialogs and inline toggleable creation forms in `ProductBasicInfo.jsx`.
    17. ⚠️ On-Demand Queue-Driven Timer Pattern: Converted `gasStockService` background interval from continuous 5-second polling into an on-demand timer that sleeps when `queue.length === 0` and only runs while active updates are queued. Aligned `InventoryHeader.jsx` badge into a static Calm UI indicator.
    18. ⚠️ Collection Path Normalization: Standardized `inventoryAdjustmentService.js` to strictly use `getCollectionPath('products')` from `dh-shared/src/firebase/pathUtils` instead of hardcoded strings.
  </lessons_learned>
</ssr_memory>
