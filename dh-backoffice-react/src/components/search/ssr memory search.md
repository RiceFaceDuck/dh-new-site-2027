<grimoire>
  <flow_and_entry>
    Entry: src/pages/dashboard/Search.jsx -> src/pages/hooks/useProductSearch.js
    Layout: SearchHeader (top), ProductListPanel (left), ProductDetailPanel (center), HistoryLogPanel (right).
    Data Flow: Local cache index (Zero-Read) -> Select SKU -> Load Details & On-demand History.
  </flow_and_entry>

  <core_schema>
    Product: sku (string, PK), name, Price (wholesale), retailPrice, stockQuantity, bufferStock, warehouseLocation, landingPageUrl, images[], compatibleModels[], compatiblePartNumbers[], externalLinks { shopee, lazada, tiktok }.
    HistoryLog: id (PK), action (SALE|STOCK|RMA|NOTE), details (object|string), performedBy/actorName, timestamp.
  </core_schema>

  <business_rules>
    1. Zero-Read Search: Product list & search queries utilize cached index without incurring unnecessary Firestore reads.
    2. On-demand History: History log timeline must NOT load automatically on item select; display "กดเพื่อดูประวัติ" prompt card to conserve quota.
    3. Action Button Layout: Location (หลังโกดัง), Storefront (หน้าเว็บ), and Marketplace links (Shopee, Lazada, TikTok) are grouped under the price section.
    4. Safe Package Specs: Do not display package size or buffer stock tags if values are missing or zero.
  </business_rules>

  <cross_impact>
    - Pages: Search (/search), POS Billing cart lookup, Manager Inventory, To-do report modal.
    - Components: CopyableLinkButton, ImageModal, HistoryModal, GuideModal.
  </cross_impact>

  <pitfalls_and_lessons>
    - Do not auto-fetch complete history upon SKU selection; keep it on-demand to protect read quotas.
    - Badges in ProductDetailHeader must remain clean: top row only contains SKU and stock status badge.
    - External links belong below the pricing row, avoiding duplicate links in the attributes footer.
  </pitfalls_and_lessons>
</grimoire>
