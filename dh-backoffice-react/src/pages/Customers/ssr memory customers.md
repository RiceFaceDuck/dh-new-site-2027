<ssr_memory>
  <flow_and_entry>
    <entry_file>src/pages/Customers/index.jsx</entry_file>
    <sub_components>components/layout/CustomerTable.jsx, components/details/DetailPanel.jsx, components/forms/CustomerModal.jsx, components/forms/CustomerDuplicateComparisonModal.jsx</sub_components>
    <data_flow>useCustomers -> customerCacheService (chunk cache + 30D delta) -> CustomerTable (9-col list) -> DetailPanel (history with 5-min cache) -> DuplicateModal (pre-create match)</data_flow>
  </flow_and_entry>

  <core_schema>
    <fields>
      - id / uid: Firestore user document ID
      - accountId: 8-char uppercase alphanumeric account identifier (primary search & link key, MUST PRESERVE)
      - customerCode: Customer legacy code (MUST PRESERVE in directory chunk cache)
      - storeName / displayName / accountName: display profile name
      - phone / phoneNumber: customer primary contact number (normalized Thai digits)
      - walletBalance / dhWallet: DH outstanding credit/wallet balance (currency: ฿)
      - totalAccumulatedPoints / creditPoints: customer reward loyalty points (SSOT in database)
      - lastOrderDate: timestamp for all-time last completed order date badge (independent from 30D sales)
      - sales30Days / orderCount30Days: dynamic 30D activity delta
      - contactName / firstName: recipient and primary contact person
      - address: structured { addressLine, subDistrict, district, province, zipCode, postalCode }
      - logisticProvider / preferredCourier: customer logistics courier preference
      - logisticNote / shippingNotes: customer delivery instructions
    </fields>
  </core_schema>

  <business_rules>
    <rule id="1">Table layout maintains 10 balanced columns: CUSTOMER ID (130px), PROFILE (minmax(180px,1.5fr)), PHONE (110px), LOGISTIC (100px), ROLE (90px), TIER (90px), DH ค้างยอด (100px), POINTS (90px), บิลล่าสุด (100px), 30D PAID OUT (110px) with gap-4. Role (pricing privilege) and Tier (gamification status) are separated into dedicated columns for optimal visual hierarchy. In table rows, financial columns omit currency symbols (no '฿') for clean numeric readability, while DetailPanel retains standard monetary symbol.</rule>
    <rule id="2">Duplicate Guard: Pre-flight check on Phone (80 pts), Store/Account Name (60 pts), Line ID (40 pts) before user creation with merge/overwrite options.</rule>
    <rule id="3">Quota Zero-Leak: History uses targeted indexed queries (customerUid, accountId, phone) + 5-min in-memory cache; unbounded root orders scans are strictly banned.</rule>
    <rule id="4">Zero code mutation to business logic, Cloud Functions, background triggers, or data calculation scripts during UI/UX refinements.</rule>
    <rule id="5">Zero Fictitious Data: Never calculate synthetic bonus points in UI (PointDisplay); display canonical totalAccumulatedPoints only.</rule>
  </business_rules>

  <cross_impact>
    <impact target="billing_pos">POS customer lookup and receipt printing directly rely on customerCacheService accountId & phone index.</impact>
    <impact target="claims_returns">Customer order history links to past claims collection using customerUid (never uid or customerId).</impact>
    <impact target="customer_portal">Account sync ties backoffice records to customer storefront login profiles via email/phone key.</impact>
    <impact target="cloud_functions">Nightly chunk guard and GA4 ad sync crons require export in functions/index.js to stay active.</impact>
  </cross_impact>

  <pitfalls_and_lessons>
    <caution>Never pass Base64 Data URLs into Firestore transactions (CustomerRefundModal); always upload to Firebase Storage first.</caution>
    <caution>`getCustomerDisplayName` utility returns a string, NOT an object. Never access `.accountName` on its return value.</caution>
    <caution>Always preserve `accountId` and `customerCode` during chunk normalization; stripping them breaks Account ID exact search.</caution>
    <caution>Date filtering must use immutable timestamp math (Date.now() - delta); never call `now.setDate()` inside array iterations.</caution>
    <caution>Dual-Key Customer Synchronization: Forms must bind and sync both `zipCode`/`postalCode`, `logisticProvider`/`preferredCourier`, and `contactName`/`firstName` so customers created in POS Billing do not lose shipping and contact data in Customer Management.</caution>
    <caution>Smart Real-time Paste: CustomerModal supports parsing pasted unformatted address blocks (Shop + Contact Person + Phone + Address + Courier) directly into form state with dual-key parity.</caution>
    <caution>Catalog Chunk Address Void & Pre-Edit Guard: Directory chunk (catalogs/customers_directory) lacks addresses. DetailPanel and ActiveCustomerCard must run on-demand hydration via getUserProfile(uid), and startEditCustomer must fetch full profile before opening edit form to prevent wiping existing customer addresses in Firestore.</caution>
    <caution>Directory Chunk Mutation Wire: Any mutation in customerAdminService (createManualCustomer, updateCustomerProfile, deleteCustomer) must trigger non-blocking syncCustomerToDirectoryChunk to keep catalogs/customers_directory and local storage cache updated across all stations atomically.</caution>
    <caution>Bounded Delta Fetch Flow: In useCustomerData, directory chunk is fetched only on cold start or manual refresh. Subsequent mounts read local cache (0 Read) and perform bounded delta query on updatedAt > lastSync - buffer (0-3 Reads), avoiding unconditional return and full collection rescans.</caution>
    <caution>Overwrite Empty String Guard: In handleOverwriteExistingCustomer and updateCustomerProfile, always sanitize payload to filter out empty string (""), null, and undefined to prevent silently wiping existing customer email, address, or phone.</caution>
    <caution>Customer Delete Manager Wiring: managerActionService.handleApproval must explicitly wire CUSTOMER_DELETE_APPROVAL to call deleteCustomer(targetId, customerName) to prevent unexecuted deletion approvals.</caution>
    <caution>LOGISTIC Field Fallback: CustomerRow must resolve courier preference using fallback chain (logisticProvider || preferredCourier || courier || shippingMethod || '-') to prevent blank dash (-) when POS stores courier under preferredCourier.</caution>
    <caution>Manual Refresh Cache Bust: CustomerHeader refresh button must invoke onRefresh(false) so useCustomerData clears customer stats and directory caches for a fresh server sync.</caution>
    <caution>Missing Catalog Cache Guard: customerOrderStatsService must cache missing state for catalogs/customers_active_30d within TTL to eliminate redundant ghost reads on every mount.</caution>
    <caution>Last Order Date Independence: lastOrderDate represents customer all-time most recent order and must never be coupled to 30D Paid Out or active 30D catalog; applyActiveStatsDelta must only update sales30Days and orderCount30Days without clearing or downgrading lastOrderDate.</caution>
    <caution>Terminology Ban Compliance: HistoryInfo item claims badge must use 'เคยเปลี่ยนสินค้า' (never 'เคยเปลี่ยนรุ่น' or 'เคลมเปลี่ยน') to maintain strict three-domain separation (CLM, EXC, RTN).</caution>
    <caution>DetailPanel Close Control: DetailPanel header must maintain dedicated top close button X wired to onClose callback for seamless split-view dismissal.</caution>
    <caution>CustomerSyncModal Account ID Parity: Source account badge must display customer.accountId || customer.customerCode with uppercase fallback instead of raw UID substring to reflect canonical account keys.</caution>
    <caution>Hyphenated Phone DB Search: searchCustomersFromDB must sanitize raw queries by stripping non-digit characters and testing valid 9-10 digit Thai numbers before routing to phone queries to prevent missing exact-indexed Firestore lookups.</caution>
    <caution>30D Stats Zero-Overwrite Guard: `fetchOrderStatsForPage` must return empty map when active catalog is empty or missing, and `applyActiveStatsDelta` must gate resetting unmatched customers behind `isFullCatalog = true` to prevent wiping customer 30D sales to 0.00.</caution>
    <caution>Edit Form Social Media Parity: `startEditCustomer` in `useCustomerActions` must explicitly map `lineId`, `facebook`, `facebookUrl`, `messengerUrl`, `youtubeUrl`, `storeWebsite`, `otherSocial`, and `taxId` into `editFormData` to ensure online channels are preserved upon saving.</caution>
    <caution>Merge Directory Sync Parity: `syncCustomerAccount` in `customerAdminService` must explicitly call `syncCustomerToDirectoryChunk` with 'delete' for the source account and 'upsert' for the target merged account to prevent ghost records in directory catalog.</caution>
    <caution>Sliding Window Timestamp Advancement: Delta fetch in `useCustomerData` must advance `CUSTOMER_LAST_SYNC_KEY` even when `hasChanges === false` to keep the 5-minute safety window sliding smoothly and prevent runaway query intervals.</caution>
    <caution>Clean Digits Phone Search: `useCustomerFilters` must normalize search terms using clean digits comparison so unhyphenated input (e.g. 0812345678) matches formatted records (e.g. 081-234-5678) seamlessly.</caution>
    <caution>Role Quick-Filters Parity: CustomerHeader quickFilter dropdown and useCustomerFilters must support explicit role segregation for 'role_mechanic' (⚡ ร้านช่าง) and 'role_vip' (👑 VIP) alongside debt and 30D active filters.</caution>
    <caution>Zero Legacy Alert Standard: Customer management actions in useCustomerActions must strictly use non-blocking toast notifications (toast.error, toast.success) instead of intrusive window.alert() popups.</caution>
    <caution>Real-time POS Directory Parity: `billingTransactionService` must sync `lastOrderDate: Date.now()` to `syncCustomerToDirectoryChunk` post-transaction so customer directory updates immediately without waiting for nightly batch.</caution>
    <caution>Historical Order Reconciliation Standard: `reconcileCustomerLastOrderDates` performs capped (limit 500) historical scan from `orders` and atomic chunk merge, keeping `lastOrderDate` consistent across both cold and warm cached views.</caution>
  </pitfalls_and_lessons>
</ssr_memory>


