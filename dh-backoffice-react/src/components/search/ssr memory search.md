<grimoire>
  <flow_and_entry>
    Entry: src/pages/dashboard/Search.jsx -> src/pages/hooks/useProductSearch.js
    Services: inventorySyncMetaService.js (Catalog & Delta Sync) + skuHistoryService.js (On-Demand Timeline)
    Layout: SearchHeader (top), ProductListPanel (left), ProductDetailPanel (center), HistoryLogPanel (right).
    Data Flow: 3-Tier Cache (L1 Memory -> L2 IDB -> L3 Firestore 7 Chunks <=8 reads) -> Select SKU -> On-demand History with 10-min TTL.
  </flow_and_entry>

  <core_schema>
    Product: sku (PK), name, Price (wholesale), retailPrice, stockQuantity, bufferStock, warehouseLocation, landingPageUrl, images[], compatibleModels[], compatiblePartNumbers[], substituteSkus[], externalLinks.
    Catalog Manifest: catalogs/search_index (version, chunkCount: 7, totalItems: 2412).
    Catalog Chunks: catalogs/search_index_p1..p7 (items[] chunked ~350 items/doc).
    Sync Meta: settings/inventory_meta (version, recentUpdatedSkus[], fullSyncRequired).
    HistoryLog: id, action (SALE|STOCK|RMA|NOTE), details {type, qtyChange, reference, customerName, salePrice}, performedBy, timestamp.
  </core_schema>

  <business_rules>
    1. Zero-Read Search: Catalog search runs 100% in-memory from IndexedDB; 0 Firestore reads on warm cache.
    2. Cold Start Bound: Strictly <= 8 Firestore reads for all 2,412 items (1 manifest + 7 chunks). Never call getInventoryMeta on cold start.
    3. Delta Sync: Updates <= 150 SKUs fetch only modified items via batch (1 Read); > 150 SKUs refreshes 7 chunks.
    4. On-demand History: History timeline must NOT load automatically on item select; loads only when user clicks "กดเพื่อดูประวัติ" and caches in IDB (10-min TTL).
    5. Action Button Layout: Warehouse (หลังโกดัง), Storefront, and Marketplaces (Shopee, Lazada) stay under price row.
  </business_rules>

  <cross_impact>
    - Pages: Search (/search), POS Billing cart lookup, Manager Inventory, To-do report modal.
    - Components: CopyableLinkButton, ImageModal, HistoryModal, GuideModal, HistoryLogPanel.
    - Storage: IndexedDB databases `dh_inventory_db` (full catalog) and `sku_hist_cache_*` (SKU history).
  </cross_impact>

  <pitfalls_and_lessons>
    - Do NOT call getInventoryMeta() during cold start chunk hydration; manifest search_index already supplies version, keeping cold start strictly at 8 reads.
    - Billing order lookup must use `where('itemSkus', 'array-contains', sku)` (limit 20) instead of unbounded global scans.
    - Always cache SKU history in IndexedDB with a 10-minute TTL to prevent rapid repeated read costs on the same item.
    - Do not auto-fetch full product history upon SKU selection; keep it strictly on-demand.
    - Port availability checks on Windows must use Node fetch rather than PowerShell Invoke-WebRequest to avoid false negatives.
    - Orders and claims history queries require authenticated staff context (e.g. ai.manager) to satisfy Firestore Security Rules.
  </pitfalls_and_lessons>

  <watchlist>
    1. SRP Split: HistoryLogPanel.jsx (20KB) bundles UI, notes input, pinning, and date formatting; useProductSearch.js bundles shortcuts, navigation, and modal states.
    2. Quota Optimization: useProductSearch.js:121 unthrottled live fetch on item select triggers reads during rapid arrow scrolling. Recommend Cache-First guard. (Est: 15-20m, Risk 3-5%).
  </watchlist>
</grimoire>
