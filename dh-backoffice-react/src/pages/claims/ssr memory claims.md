<ssr_memory>
  <flow_and_entry>
    <entry_file>dh-backoffice-react/src/pages/claims/ClaimMain.jsx</entry_file>
    <data_flow>Firestore `claims` -> useClaimData -> ClaimHeader/Stats/Table -> ClaimDetailModal (delegated to useClaimDetailData + useClaimDetailController) -> ApproveModal / PremiumDialog</data_flow>
  </flow_and_entry>

  <core_schema>
    <collection>claims (Root Collection)</collection>
    <types>CLAIM_APPROVAL (CLM), EXCHANGE_APPROVAL (EXC), RETURN_APPROVAL (RTN), CANCEL_*</types>
    <key_fields>payload.claimId, payload.exchangeId, payload.returnId, payload.orderId, payload.customerUid, payload.sku, payload.swapSku, payload.itemCondition ('good'|'defective'), payload.differencePayment, status, inboundTrackingNumber, createdAt</key_fields>
  </core_schema>

  <business_rules>
    <rule>Tri-Division Rule: แยก 3 โดเมนเด็ดขาด เคลม (CLM / orange), เปลี่ยน (EXC / sky), คืน (RTN / purple) ห้ามใช้คำว่า 'เคลมเปลี่ยน' เด็ดขาด</rule>
    <rule>Condition-Based Stock Math: ใน return/claim action ตรวจสอบ itemCondition เสมอ ถ้า 'defective' ห้ามเพิ่ม stockQuantity (+0) แต่คงใน defectQuantity; ถ้า 'good' ย้ายจาก defectQuantity (-qty) เข้า stockQuantity (+qty)</rule>
    <rule>Exchange Difference Payment: หากเปลี่ยนสินค้ารุ่นแพงกว่า ต้องจัดการ differencePayment (Wallet หรือ Direct Payment พร้อมแนบสลิป Drive) ก่อน approve</rule>
    <rule>Warranty Rule: คำนวณวันปฏิทินจาก purchaseDate ถึงปัจจุบัน เกินกำหนดแสดง 'หมดอายุแล้ว' ภายในกำหนดแสดง '🟢 เหลือ [N] วัน'</rule>
    <rule>Calm UI & Clean Architecture: หน้าต่าง Modal เป็น Pure UI ดึง state และ live stock จาก useClaimDetailController ป้ายสถานะที่เสร็จแล้วต้องนิ่ง ไม่กระพริบ</rule>
  </business_rules>

  <cross_impact>
    <module name="Billing">อ้างอิง orderId ตรวจสอบประกัน ออกใบกำกับ และผูกโยงยอดคืนเงิน</module>
    <module name="Customer Directory">Preload customerProfile เข้า Modal ป้องกัน duplicate read โควต้า Firestore</module>
    <module name="Inventory">กระทบ stockQuantity และ defectQuantity แบบเรียลไทม์ตาม itemCondition</module>
    <module name="Google Drive">อัปโหลดสลิปเงินส่วนต่างเข้า Google Drive ผ่าน driveService</module>
  </cross_impact>

  <pitfalls_and_lessons>
    <caution>Stock Math Defect Leak: ห้ามเพิ่ม stockQuantity ให้สินค้าชำรุดเด็ดขาด ต้องแยก condition 'good' vs 'defective' เสมอ</caution>
    <caution>Rollback Integrity: ใน cancelActionService ต้องเช็ค condition เดิมก่อน Rollback สต็อกเพื่อป้องกันยอดคลาดเคลื่อน</caution>
    <caution>Vite JSX Rule: ไฟล์ Hook หรือ Component ที่มี JSX syntax ต้องใช้นามสกุล .jsx เท่านั้น (.js จะติด Rolldown build error)</caution>
    <caution>Import Depth: จาก src/pages/claims/hooks/ ไป src/firebase/ ต้องถอย 3 ชั้น (../../../firebase/)</caution>
    <caution>Absolute Deployment Ban: ห้าม deploy หรือ git push ขึ้นเซิฟเวอร์เด็ดขาด บันทึกงานเฉพาะ Git Commit ภายในเครื่องเท่านั้น</caution>
  </pitfalls_and_lessons>
</ssr_memory>
