# 📜 SSR Local Grimoire — Billing Dashboard & POS System

<grimoire>
  <usage_workflow>
    1. แคชเชียร์เปิดหน้า POS (/billing) ระบบ hydrate แคตตาล็อกสินค้าอัตโนมัติ (L1 Memory -> L2 IndexedDB -> L3 Chunks <= 8 Reads)
    2. แคชเชียร์สร้างบิลใหม่ (กดแท็บ '+' หรือกดคีย์ลัด Alt + N) เพื่อเปิดแท็บตะกร้าแยกอิสระ
    3. แคชเชียร์ยิงบาร์โค้ดหรือค้นหา SKU ด้วย fast-path exact match (ป้องกัน race condition)
    4. แคชเชียร์เลือกลูกค้า (สมาชิกระบบ หรือ Walk-in) หากสมาชิกระบบไม่มีเบอร์โทร สามารถพิมพ์เบอร์ใหม่หรือกดปุ่ม 'สงวนสิทธิ์' ได้ทันที
    5. แคชเชียร์เลือกรูปแบบภาษี (รวม VAT, แยก VAT, ไม่คิด VAT) และประเภทการจัดส่ง พร้อมเลือกโปรโมชันท้ายบิล
    6. ขั้นตอนชำระเงิน: แคชเชียร์เลือกว่าจะใช้เงินในกระเป๋า (Wallet) หักชำระหรือไม่ หากโอนเงินสามารถกด Ctrl + V เพื่อแปะรูปสลิป
    7. กดปุ่ม 'ยืนยันชำระเงิน' (หรือกด Ctrl + Enter) ระบบรัน Firestore runTransaction ตรวจสอบราคา ตัดสต็อกสินค้า อัปเดตยอด Wallet และออกเลขบิลทางการ (DH-26-XXXX)
    8. พิมพ์ใบเสร็จ/ใบกำกับภาษี A5 โดยบิลหลายหน้าจะรักษาเลขบิลหลักเดิม พร้อมแสดงเลขประจำตัวผู้เสียภาษี 13 หลักและยอดเงินสุทธิเต็มทั้งบิล
  </usage_workflow>

  <domain_rules>
    1. Domain Tri-Division: แยก 3 โดเมนบริการหลังการขายเด็ดขาด: เคลมคือ 'เคลม' (CLM), เปลี่ยนคือ 'เปลี่ยน' (EXC), คืนคือ 'คืน' (RTN) ห้ามใช้คำว่า "เคลมเปลี่ยน" หรือ "เคลมเปลี่ยนรุ่น" เด็ดขาด
    2. Absolute Deployment Ban: ห้าม deploy งานทุกชนิด (Hosting, Functions, Rules, Production) สู่ระบบจริงเด็ดขาด
    3. Satang Precision & Parity: ปัดเศษทศนิยม 2 ตำแหน่งเสมอ (Math.round(x * 100) / 100) การคำนวณราคาหน้าบ้านกับ Transaction หลังบ้านต้องตรงกัน 100%
    4. Split-Line SKU Aggregation: หากมี SKU ซ้ำกันหลายบรรทัดในตะกร้า ต้องรวมยอดจำนวน (Map<sku, totalQty>) ก่อนตัดสต็อก ป้องกัน write ทับซ้อน
    5. Preserved Audited Transactions: ห้ามลบบิลที่มีผลทางบัญชีแล้ว (paid, approved, completed) ลบได้เฉพาะบิลร่าง (draft) โดยสิทธิ์ Manager/Admin เท่านั้น
    6. Multi-page Receipt Integrity: ห้ามนำ Factor มาคูณซอยยอดเงินสุทธิหรือค่าส่งในใบเสร็จหลายหน้า และห้ามเติม #1, #2 ท้ายเลขที่บิลทางการ
    7. Calm UI Invariant: ป้ายสถานะที่เสร็จแล้วหรือรอดำเนินการต้องเป็นป้ายนิ่ง (Static Badge) ห้ามมี animate-pulse, animate-bounce, หรือ animate-ping
  </domain_rules>

  <core_schema>
    1. Entry Files:
       - Presentation: `src/pages/billing/BillingMain.jsx`, `src/components/billing/PosSystem.jsx`
       - Controllers: `usePosState.js`, `usePosActions.js`, `usePosPayment.js`, `usePosShortcuts.js`
       - Transaction Service: `src/firebase/billingTransactionService.js`, `src/firebase/billingStatusTransaction.js`
       - Print Service: `src/components/billing/pos/ReceiptTemplate.jsx`, `src/components/billing/pos/receipt/ReceiptHeader.jsx`
    2. Firestore Collections & Keys:
       - Orders: `orders/{orderId}` (Key: orderId 'DH-YY-XXXX' หรือ 'DH-TEMP-YYMMDD-HHMMSS')
       - Counter: `counters/receipt_sequence_global` (Key: ปี พ.ศ. เช่น '2026', currentNumber)
       - Inventory: `products/{sku}` (Key: sku, stock, reservedStock)
       - User & Wallet: `users/{userId}` (Key: walletBalance, lastWalletTxId, lastOrderId, lastOrderDate)
       - Wallet Ledger: `users/{userId}/wallet_transactions/{txId}` (Key: txId 'TXW_POS_...')
       - Credit Ledger: `users/{userId}/credit_transactions/{txId}` (Key: txId 'TXP_...')
       - Bundled Catalog: `catalogs/recent_orders` (Key: orders, count, version, updatedAt)
       - Manifest Catalog: `catalogs/search_index` และ chunks `catalogs/search_index_p1..p7`
  </core_schema>

  <third_party>
    1. Google Apps Script (GAS) Stock Backup: เชื่อมต่อผ่าน `gasStockService.js` สำหรับสำรองและซิงก์สต็อกแบบสองทาง
    2. Bank Slip OCR & Storage: จัดเก็บไฟล์สลิปใน Firebase Storage และประมวลผล OCR ตรวจสอบความถูกต้อง
    3. Browser Client Print: การพิมพ์ใบเสร็จ A5 พิมพ์ผ่าน iframe print dialog ในเครื่องแคชเชียร์โดยตรง (0 reads/writes)
  </third_party>

  <pitfalls_and_solutions>
    1. ปัญหา: แคชเชียร์ตัดเงิน Wallet ลูกค้าแล้วขึ้น PERMISSION_DENIED
       วิธีแก้: ปรับ firestore.rules ให้อนุญาต isStaff() ตัด walletBalance ได้เมื่อมีทรานแซกชันคู่ขนาน SPEND ใน wallet_transactions [สถานะ: ส่งมอบแล้ว]
    2. ปัญหา: ส่วนลดโปรโมชันถูกคำนวณเบิ้ล 2 เท่าใน calculateNetTotal
       วิธีแก้: ส่งเฉพาะ itemDiscounts + manualDiscount เป็น discountAmount เมื่อมี dynamic promotions [สถานะ: ส่งมอบแล้ว]
    3. ปัญหา: บิลร่าง DH-TEMP- ไม่ได้รับเลขที่ใบเสร็จทางการเมื่อกด Paid ใน Backoffice
       วิธีแก้: เปลี่ยนเงื่อนไขเช็คเลขบิลเป็น Regex !/^DH-\d{2}-\d+/.test(currentOrderId) [สถานะ: ส่งมอบแล้ว]
    4. ปัญหา: ใบเสร็จหลายหน้าซอยยอดเงินสุทธิและค่าส่งออกเป็นเศษเสี้ยว และเติม #1, #2 ท้ายเลขบิล
       วิธีแก้: รักษา orderId ทางการเดิมไว้ และส่งยอดรวมสุทธิเต็มทั้งบิลให้ ReceiptFooter ในทุกแผ่น [สถานะ: ส่งมอบแล้ว]
    5. ปัญหา: คำต้องห้าม "เคลมเปลี่ยน" และ "เคลมเปลี่ยนรุ่น" ปรากฏในระบบเคลม
       วิธีแก้: Refactor เปลี่ยนเป็นคำว่า "เปลี่ยน" หรือ "เปลี่ยนสินค้า (EXC)" ทั้งระบบตามกฎ Domain Tri-Division [สถานะ: ส่งมอบแล้ว]
    6. ปัญหา: ตัวหนังสือบาทไทยผิดไวยากรณ์ (สองสิบหนึ่งบาทถ้วน)
       วิธีแก้: อัปเดต convertToThaiBahtText ใน dh-shared ให้รองรับ ยี่สิบ, สิบ, เอ็ด ถูกต้อง [สถานะ: ส่งมอบแล้ว]
    7. ปัญหา: แสงไฟกระพริบ animate-ping / animate-bounce รบกวนสายตา
       วิธีแก้: ปรับเปลี่ยนเป็นป้ายนิ่ง Calm UI ทั้งหมดในกระดานบิลและตารางบิล [สถานะ: ส่งมอบแล้ว]
    8. ปัญหา: คีย์ลัด Alt + N ระบุในคู่มือแต่กดไม่ติด
       วิธีแก้: เพิ่ม keydown listener สำหรับ Alt + N ใน usePosShortcuts.js ให้เรียก createNewTab() [สถานะ: ส่งมอบแล้ว]
    9. ปัญหา: หน้าจอ Tablet (<1024px) ติด overflow-hidden ทำให้แผงตั้งค่าบิลหลุดออกนอกจอ
       วิธีแก้: ปรับคอนเทนเนอร์เป็น overflow-y-auto lg:overflow-hidden และ SettingsPanel เป็น h-auto lg:h-full [สถานะ: ส่งมอบแล้ว]
    10. ปัญหา: ก้อนแคตตาล็อก recent_orders กิน 50 Reads ทุกบิล
       วิธีแก้: จัดอยู่ใน Watchlist (Guardrail: working_well ให้คงสภาพเดิมไว้ ป้องกัน race condition ระหว่างแคชเชียร์) [สถานะ: บันทึกเฝ้าระวัง]
  </pitfalls_and_solutions>
</grimoire>
