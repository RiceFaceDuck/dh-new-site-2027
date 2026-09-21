<ssr_memory>
  <flow_and_entry>
    <entry_file>src/pages/Customers/index.jsx</entry_file>
    <sub_components>components/layout/CustomerTable.jsx, components/layout/CustomerRow.jsx, components/details/DetailPanel.jsx, components/forms/CustomerModal.jsx</sub_components>
    <data_flow>useCustomers -> CustomerTable (8-col list) -> DetailPanel (dark slate header, tabs: overview/marketing/history) -> CustomerModal (edit/add customer profile)</data_flow>
  </flow_and_entry>

  <core_schema>
    <fields>
      - id / uid: Firestore user document ID
      - accountId: 8-char uppercase alphanumeric account identifier (primary search & link key)
      - storeName / displayName / accountName: display profile name
      - phone / phoneNumber: customer primary contact number (PII protected)
      - walletBalance / dhWallet: DH outstanding credit/wallet balance (currency: $)
      - totalAccumulatedPoints / creditPoints: customer reward loyalty points
      - lastOrderDate: timestamp for last completed order date badge
      - address: structured { addressLine, subDistrict, district, province, zipCode, googleMapsUrl }
    </fields>
  </core_schema>

  <business_rules>
    <rule id="1">Table layout maintains 9 balanced columns: CUSTOMER ID, PROFILE, PHONE, LOGISTIC, ROLE/TIER, DH ค้างยอด, POINTS, บิลล่าสุด, 30D PAID OUT using symmetrical grid formula [130px_minmax(180px,1.5fr)_110px_110px_90px_100px_90px_100px_110px] with gap-4.</rule>
    <rule id="2">DetailPanel header must render dark slate midnight theme (bg-slate-900) containing account badges, wallet display with refund button, and points display.</rule>
    <rule id="3">Order history displays 3 summary metric boxes (Total Spent, Total Bills, Total Claims/Returns) and detailed bill breakdown with return/claim badges.</rule>
    <rule id="4">Zero code mutation to business logic, Cloud Functions, background triggers, or data calculation scripts during UI/UX refinements.</rule>
  </business_rules>

  <cross_impact>
    <impact target="billing_pos">Changes to customer schema or accountId linkage directly affect POS customer lookup and checkout receipt printing.</impact>
    <impact target="claims_returns">Customer order history links to past orders and claims collections for warranty validation.</impact>
    <impact target="customer_portal">Account sync ties backoffice records to customer storefront login profiles via email key.</impact>
  </cross_impact>

  <pitfalls_and_lessons>
    <caution>Always adhere to the symmetrical 110-110, 90-100, 90-100, 110 column rhythm with gap-4 for table balance.</caution>
    <caution>Always mask PII (phone/email) by default or provide toggleable eye button as shown in live production layout.</caution>
    <caution>Absolute deployment ban: Never run firebase deploy, functions deploy, or git push to remote servers.</caution>
  </pitfalls_and_lessons>
</ssr_memory>
