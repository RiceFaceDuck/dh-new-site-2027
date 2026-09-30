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
      - lastOrderDate: timestamp for last completed order date badge (synced via customers_active_30d)
      - sales30Days / orderCount30Days: dynamic 30D activity delta
      - address: structured { addressLine, subDistrict, district, province, zipCode }
    </fields>
  </core_schema>

  <business_rules>
    <rule id="1">Table layout maintains 9 balanced columns: CUSTOMER ID (130px), PROFILE (minmax(180px,1.5fr)), PHONE (110px), LOGISTIC (110px), ROLE/TIER (90px), DH ค้างยอด (100px), POINTS (90px), บิลล่าสุด (100px), 30D PAID OUT (110px) with gap-4. In table rows, financial columns omit currency symbols (no '฿') for clean numeric readability, while DetailPanel retains standard monetary symbol.</rule>
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
    <caution>Absolute deployment ban: Never run firebase deploy, functions deploy, or git push to remote servers.</caution>
  </pitfalls_and_lessons>
</ssr_memory>
