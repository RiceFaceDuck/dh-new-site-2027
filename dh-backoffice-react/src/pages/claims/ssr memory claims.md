<ssr_memory>
  <flow_and_entry>
    <entry_file>dh-backoffice-react/src/pages/claims/ClaimMain.jsx</entry_file>
    <data_flow>Firestore `claims` collection -> useClaimData hook (with batch user profile preloader) -> ClaimHeader + ClaimStatsRow + ClaimTable -> ClaimDetailModal + ClaimPrintView</data_flow>
  </flow_and_entry>

  <core_schema>
    <collection>claims (Root Collection, replaces legacy 'todos')</collection>
    <types>CLAIM_APPROVAL (CLM), EXCHANGE_APPROVAL (EXC / SWAP_SKU), RETURN_APPROVAL (RTN), CANCEL_*</types>
    <key_fields>payload.claimId, payload.exchangeId, payload.returnId, payload.orderId, payload.customerUid, payload.sku, payload.qty, payload.purchaseDate, payload.symptomCode, payload.returnReason, status, createdAt</key_fields>
  </core_schema>

  <business_rules>
    <rule>Strict Separation: Always distinguish between Claim (CLM / เคลมสินค้า - orange), Exchange (EXC / เปลี่ยนสินค้า - sky), and Return (RTN / คืนเงิน/คืนสินค้า - purple).</rule>
    <rule>Warranty Calculation: Calculate calendar days elapsed from purchaseDate to current date. Under warranty shows '🟢 เหลือ [N] วัน', expired shows 'หมดอายุแล้ว'.</rule>
    <rule>Status Flow: pending_manager (รอรับเรื่อง) -> waiting_item (รอรับของ) -> processing (กำลังตรวจ) -> completed/approved (เสร็จสิ้น).</rule>
    <rule>Presentation Focus: Never touch mutation triggers, Cloud Functions, or backend script logic in UI-only tasks.</rule>
  </business_rules>

  <cross_impact>
    <module name="Billing">Referenced by orderId for warranty verification and return/refund tracking.</module>
    <module name="Customer Directory">Profiles fetched via customerUid to display customerName, customerCode, and phone.</module>
    <module name="Inventory">Defect stock (+1 defect) on item arrival and new stock (-1 stock) on claim completion.</module>
  </cross_impact>

  <pitfalls_and_lessons>
    <caution>Do NOT query the old 'todos' collection; the active claims system uses the 'claims' collection with 33+ real items.</caution>
    <caution>Batch preload customer profiles to avoid N+1 Firestore quota over-consumption when browsing table rows.</caution>
    <caution>Strict Deployment Ban: Never deploy to server or git push; all changes are local-only.</caution>
  </pitfalls_and_lessons>
</ssr_memory>
