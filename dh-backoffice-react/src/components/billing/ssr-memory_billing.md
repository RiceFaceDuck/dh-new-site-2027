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
    11. ปัญหา: งานค้าง POS (บิลร่าง/แท็บพักไว้) ไม่แสดงบนเว็บจริง (dhnotebook-work.web.app) ทั้งที่เป็นบัญชีพนักงานเดียวกัน
       วิธีแก้: ปัญหาเกิดจากโค้ดใหม่ (FloatingMiniCart และ staffPosDraftService) ยังไม่ได้ถูก Build และ Deploy ขึ้น Hosting รวมทั้งเบราว์เซอร์แยก Local Storage คนละโดเมน เมื่อทำการ Build และ Deploy Hosting (`firebase deploy --only hosting:dhnotebook-work`) ทำให้เว็บจริงรันโค้ดชุดใหม่และซิงค์งานค้าง POS ข้ามเครื่องได้ถูกต้อง [สถานะ: ส่งมอบแล้ว]
    12. ปัญหา: ปุ่มมุมขวาบนในหน้ารายการบิล (/billing) เปิดบิลใหม่ขึ้นมาทันทีโดยไม่ได้ตั้งใจ
       วิธีแก้: เปลี่ยนปุ่มเป็น "จัดการบิล" สีเหลือง (Amber) และแก้ `onSwitchView` ใน `BillingMain.jsx` ให้ส่ง `setIsNewBillRequest(false)` เพื่อแค่สลับเข้าหน้า POS โดยไม่สร้างบิลใหม่ลอยๆ หากต้องการสร้างบิลใหม่ให้ทำจากปุ่มในหน้า POS หรือกดปุ่ม [+] ที่ Sidebar ตามความต้องการผู้ใช้งาน [สถานะ: ส่งมอบแล้ว]
    13. ปัญหา: โมดอลเพิ่มลูกค้าใหม่ (QuickAddCustomerModal) โดนแถบบน (PosHeader) แทรกทับ และคลิกฉากหลังไม่ยอมปิด
       วิธีแก้: ใช้ `createPortal(..., document.body)` ยกโมดอลขึ้น Root DOM ชั้นบนสุด ปรับ z-index เป็น z-[100] พร้อมใส่ `onClick={onClose}` ที่ Backdrop และ `onClick={(e) => e.stopPropagation()}` ที่ Card เพื่อให้คลิกพื้นที่ว่างปิดได้ทันที [สถานะ: ส่งมอบแล้ว]
    14. ปัญหา: บิลเก่าเกิน 50 รายการไม่โหลดเมื่อกดถัดไป (Pagination Deadlock)
       วิธีแก้: ใน `useBillingOrders.js` ปรับเงื่อนไขให้สลับไปดึงจาก `billingService.subscribeRecentOrders(limitAmount, dateRange)` เมื่อ `limitAmount > 50` หรือมี `dateRange` และให้ `OrderListTable.jsx` อัปเดต `limitAmount` ตาม `pageSize` อัตโนมัติ [สถานะ: ส่งมอบแล้ว]
    15. ปัญหา: ค้นหาบิลด้วยรหัส SKU สินค้าไม่พบเพราะไม่มีฟิลด์ `itemSkus` ใน Order document
       วิธีแก้: เติมการสร้าง `itemSkus` (อาเรย์ของ unique uppercase SKU) ใน `billingTransactionService.js`, `usePosActions.js`, และ `orderSyncService.js` เพื่อให้ตรงกับ `where('itemSkus', 'array-contains', ...)` ของระบบค้นหา [สถานะ: ส่งมอบแล้ว]
    16. ปัญหา: บิลที่มีส่วนลดถูกต้องเกิน 50% อาจถูกคำนวณทับยอดเงินสุทธิ (storedNet)
       วิธีแก้: ใน `priceEngine.js` เพิ่ม Guard `hasExplicitDiscount` ดักจับส่วนลดชัดเจน (manualDiscount, promoDiscount, overallDiscount ฯลฯ) เพื่อเคารพยอดที่บันทึกจริง ไม่เขียนทับยอดบิล [สถานะ: ส่งมอบแล้ว]
    17. ปัญหา: คำร้อง To-do ตกค้างในหน้าผู้จัดการเมื่อลบบิลร่างหรือยกเลิกบิล
       วิธีแก้: ปรับ `billingDeleteService.js` และ `billingStatusTransaction.js` ให้ค้นหาและยกเลิก Todos ครอบคลุมทั้ง `referenceId` และ `payload.orderId` ป้องกันงานค้าง Orphaned Todos [สถานะ: ส่งมอบแล้ว]
    18. ปัญหา: การค้นหาบิลยิง Firestore ซ้ำซ้อนและสิ้นเปลืองโควต้า โดยไม่ใช้แคชบิลในเครื่อง
       วิธีแก้: ปรับ `billingQueryService.searchOrders` ให้ค้นหาใน Cache (`readCachedOrders()`) ก่อน, deduplicate SKU searches และเชื่อมโยง Customer Directory Cache (`dh_customers_data_cache_v10`) เพื่อแปลงชื่อลูกค้าเป็น UIDs ยิง Firestore ได้ตรงเป้าหมายแบบประหยัดโควต้า [สถานะ: ส่งมอบแล้ว]
    19. ปัญหา: ค่าจัดส่งถูกตัดทิ้งหายไปทั้งก้อนบนเซิร์ฟเวอร์ เมื่อบิลเป็นรูปแบบไม่มี VAT (exempt) หรือรวม VAT (included) และไม่ได้ติ๊กคิดภาษีบนค่าส่ง
       วิธีแก้: ใน `billingTransactionService.js` ปรับเงื่อนไขคืนค่าจัดส่ง `shippingCost` เข้าสู่ `finalSecureNetTotal` ครอบคลุมทุกกรณีที่ไม่ได้คิดภาษีบนค่าส่ง (`!isVatOnShipping`) ป้องกันเงินค่าจัดส่งสูญหายจากระบบบัญชี [สถานะ: ส่งมอบแล้ว]
    20. ปัญหา: กระเป๋าเงิน Wallet ถูกหักเงินตั้งแต่ตอนบันทึกบิลร่าง (Draft) ทำให้เกิดการหักเงินซ้ำ 2 เท่าเมื่อชำระเงินจริง
       วิธีแก้: ย้ายบล็อกการหักเงิน Wallet และการแจกแต้มใน `billingTransactionService.js` ให้อยู่ภายใต้เงื่อนไข `statusLower === 'paid' || statusLower === 'approved'` เท่านั้น พร้อมบันทึกฟิลด์ `isWalletDeducted` และปรับ `billingDeleteService.js` ให้ตรวจสอบก่อนคืนเงิน ป้องกันเงินหายและเงินงอก [สถานะ: ส่งมอบแล้ว]
    21. ปัญหา: คีย์ลัด Alt + N สร้างบิลใหม่กดไม่ติด ทั้งที่ระบุในคู่มือการใช้งาน
       วิธีแก้: ใน `PosSystem.jsx` สร้างฟังก์ชัน Wrapper `handleCreateNewTab` ที่ตรวจสอบหาแท็บว่างหรือสั่ง `setCartTabs(prev => [...prev, newTab])` พร้อม `setActiveTabId(newTab.id)` ส่งให้ `usePosShortcuts` และ `PosHeader` แทน Factory function เปล่า [สถานะ: ส่งมอบแล้ว]
    22. ปัญหา: แคชเชียร์เผลอคลิกปุ่ม X ปิดแท็บบิล ทำให้รายการสินค้าที่ยิงไว้สูญหายทันทีโดยไม่มีการเตือน
       วิธีแก้: ใน `PosHeader.jsx` เพิ่ม Guard ตรวจสอบ `if (tab.items && tab.items.length > 0)` และแจ้งเตือนด้วย `window.confirm` ก่อนปิดแท็บ เพื่อป้องกันข้อมูลบิลร่างสูญหายจากอุบัติเหตุ [สถานะ: ส่งมอบแล้ว]
    23. ปัญหา: สต็อกสินค้าของแถม (Freebie) ที่ตัดจากคลังจริง ไม่ถูกคืนสต็อกเมื่อยกเลิกบิล
       วิธีแก้: ปรับปรุง `billingStatusTransaction.js` โดยตัดเงื่อนไข `item.isFreebie` ออกจากการดักข้าม ทำให้สินค้าทุกรายการที่มี `id` หรือ `sku` ในรายการบิลถูกรวมเข้า Map และคืนสต็อกเข้าคลังสินค้าอย่างถูกต้องเมื่อกดยกเลิกบิล [สถานะ: ส่งมอบแล้ว]
    24. ปัญหา: รหัสบิลร่าง POS แบบพ่วงวันที่-เวลา (`DH-TEMP-YYMMDD-HHMMSS-RAND4`) ยาวเกินไปจนตัดตกบรรทัดในตารางรายการบิล (/billing)
       วิธีแก้: ปรับปรุง `usePosState.js`, `usePosActions.js` และ `billingTransactionService.js` ให้สร้างรหัสบิลร่างเป็นเลข 4 หลักสั้นกระชับ (`DH-TEMP-XXXX`) อ่านง่ายและไม่ล้นตาราง [สถานะ: ส่งมอบแล้ว]
    25. ปัญหา: ระบบอัปโหลดสลิปใน `usePosActions.js` มีการเขียนโค้ดซ้ำซ้อนในตัวเองและไม่เชื่อมกับ Cloud Functions OCR และ Google Drive Backup
       วิธีแก้: ปรับให้ `usePosActions.js` เรียกใช้ Service กลาง `slipStorageService` จาก `src/firebase/slipStorageService.js` โดยตรง พร้อมส่ง `remainingToPay` ป้องกัน ReferenceError และรองรับทั้งการย่อขนาดภาพ WebP, สำรองสลิปไป Drive และตรวจสอบยอดผ่าน OCR [สถานะ: ส่งมอบแล้ว]
    26. ปัญหา: ชื่อรุ่นสินค้าบนกระดาษพิมพ์ใบเสร็จ A5 ถูกตัดทิ้งด้วย `...` ทำให้อ่านชื่อรุ่นบนกระดาษพิมพ์จริงไม่ครบถ้วน
       วิธีแก้: ปรับปรุง `ReceiptItems.jsx` ให้ใช้ `line-clamp-2 break-words` ร่วมกับ `items-start` ช่วยให้ชื่อสินค้ายาวสามารถตัดขึ้นบรรทัดที่สองได้บนกระดาษพิมพ์จริงอย่างเรียบร้อย [สถานะ: ส่งมอบแล้ว]
    27. ปัญหา: ฟังก์ชันแปลงตัวเลขเป็นตัวหนังสือไทย `convertToThaiBahtText` ถูกเขียนซ้ำใน `PosSystem.jsx` และไม่รองรับค่าลบ
       วิธีแก้: ลบฟังก์ชันเฉพาะถิ่นใน `PosSystem.jsx` และ import ใช้งานจาก `dh-shared` โดยตรง ซึ่งรองรับทั้งเศษสตางค์ ค่าลบ และผ่านการทดสอบครอบคลุม [สถานะ: ส่งมอบแล้ว]
    28. ปัญหา: ยอดรวมแถวสินค้าในตะกร้าแคชเชียร์แสดงผลติดลบ หากกรอกส่วนลดต่อชิ้นสูงกว่าราคาขาย
       วิธีแก้: ใน `CartTableRow.jsx` ครอบ `Math.max(0, ...)` ในการคำนวณราคาต่อชิ้นหักส่วนลด ป้องกันไม่ให้ตัวเลขแถวแสดงยอดติดลบในหน้าจอแคชเชียร์ [สถานะ: ส่งมอบแล้ว]
    29. ปัญหา: หน้า POS พัง (`TypeError: Cannot read properties of undefined (reading 'id')` ที่ `usePosState.js`) เมื่อกดปุ่ม "+ เปิดบิลใหม่" บนแถบหัวตาราง และปุ่มปิดแท็บอ้างอิงตัวแปร `index` ผิด (`idx`)
       วิธีแก้: ปรับปุ่มเปิดบิลใหม่ใน `PosHeader.jsx` ให้เรียก `createNewTab()` (ซึ่งคือ `handleCreateNewTab` จาก `PosSystem.jsx`) โดยตรง ไม่เรียก `setCartTabs([...safeCartTabs, newTab])` ซ้ำซ้อน, แก้ `index` เป็น `idx` ตอนแจ้งเตือนปิดแท็บ และเพิ่มตัวกรอง `t && typeof t === 'object' && t.id` ใน `usePosState.js` และ `staffPosDraftService.js` เพื่อล้างค่าเสียใน LocalStorage อัตโนมัติ [สถานะ: ส่งมอบแล้ว]
    30. ปัญหา: กดบันทึกบิลร่างลูกค้าใหม่แล้วขึ้น `ReferenceError: customerUid is not defined` ที่ `billingTransactionService.js` และป้าย `ใกล้เคียง`/`คงเหลือ` ใน Dropdown ค้นหาสินค้า (`SearchArea.jsx`) บี้หักบรรทัดเมื่อเจอชื่อรุ่นยาวๆ
       วิธีแก้: ประกาศ `customerUid` ไว้ชั้นนอกของ `createOrder` ใน `billingTransactionService.js` (รองรับทั้ง `.uid` และ `.id`), ปรับกล่องรายการค้นหาใน `SearchArea.jsx` ให้ฝั่งซ้ายใช้ `min-w-0 flex-1` + `line-clamp-2` และฝั่งขวา/ป้ายสถานะใส่ `shrink-0 whitespace-nowrap` พร้อมกรองค่าขยะขีด `-` ของ `contactName` ใน `ActiveCustomerCard.jsx` [สถานะ: ส่งมอบแล้ว]
    31. ปัญหา: บิลร่าง (`DH-TEMP-...`) ที่กดบันทึกร่างจาก POS แสดงสถานะในตารางเป็น "รอดำเนินการ" แทนที่จะเป็น "ฉบับร่าง (Draft)" และเสี่ยงถูก Auto-Cleanup ยกเลิกทิ้งหลัง 24 ชม.
        วิธีแก้: ปรับ `usePosActions.js` ให้ส่ง `orderStatus: 'Draft'`, `status: 'Draft'`, `isDraft: true` เมื่อกดบันทึกร่าง, ปรับ `OrderTableRow.jsx` และ `OrderDetailModal.jsx` ให้ตรวจจับทั้งสถานะ `draft` และรหัส `DH-TEMP-` เพื่อแสดงป้าย "ฉบับร่าง (Draft)" และเพิ่ม Guard ใน `useAutoCleanup.js` ไม่ให้ยกเลิกบิลร่างอัตโนมัติ [สถานะ: ส่งมอบแล้ว]
    32. ปัญหา: กด "แก้ไขบิล" จาก OrderDetailModal แล้วไม่เปิดแท็บของบิลนั้น และเกิดอาการเบราว์เซอร์ค้าง (หน้าไม่ตอบสนอง / Infinite Loop)
        วิธีแก้: ปรับปรุง `usePosState.js` ให้ค้นหาแท็บเดิมด้วย `orderId` หรือ `docId` และล็อก `activeTabId` ให้ตรงกับ `tab.id` ตัวจริงของแท็บนั้นเสมอ พร้อมย้าย `setActiveTabId` ออกนอก updater ของ `setCartTabs`, เติม `onDraftHandled` เคลียร์ `draftOrder` ใน `BillingMain.jsx` และครอบ `useCallback` ให้กับ `applyPromotionLogic` ใน `usePosActions.js` เพื่อตัดวงจร Infinite Re-render Loop สมบูรณ์ [สถานะ: ส่งมอบแล้ว]
    33. ปัญหา: ออเดอร์จากหน้าเว็บสร้างเป็น Document ปกติ ทำให้แคชเชียร์ไม่เห็นในแท็บบิล ไม่มีป้ายแจ้งเตือนเด่นชัด และไม่มีการดักจับเจ้าหน้าที่ผู้เปิดบิล
        วิธีแก้: 
        1) หน้าเว็บออกเลขบิลชั่วคราว `DH-TEMP-YYMMDD-HHMMSS-XXXX` บันทึกสถานะเป็น Draft รอตรวจสลิป
        2) ในตารางบิลและแท็บ POS แสดงป้ายสะดุดตา `🌐 ออเดอร์ใหม่ [หน้าเว็บ]`
        3) เมื่อเจ้าหน้าที่เปิดบิลเป็นคนแรก ระบบดักจับ `staffNickname` และ `openedBy` บันทึกลงบิลอัตโนมัติ (First-Touch Staff Ownership)
        4) เมื่อกด `[รับชำระเงิน (Paid)]` ลบบิล Temp เก่า ออกเลขทางการ `DH-26-XXXX` เปลี่ยนสถานะเป็น `paid` ซิงค์เรียลไทม์ทั้งหน้าบ้านและหลังบ้าน พร้อมส่งต่อเข้าคิว `pending_packing` [สถานะ: ส่งมอบแล้ว]
    34. ปัญหา: ออเดอร์ใหม่จากหน้าเว็บสั่งซื้อ (Storefront) ไม่ปรากฏในหน้าแรกของตารางรายการบิล (/billing) ต้องพิมพ์ค้นหาถึงจะเจอ
        วิธีแก้: เกิดจากหน้าระบบบิลเดิมดักฟังเฉพาะไฟล์แคตตาล็อกเดี่ยว (`catalogs/recent_orders`) ซึ่งลูกค้าหน้าเว็บไม่มีสิทธิ์เขียนและไม่มี Cloud Function อัปเดตให้ แก้ไขโดยปรับ `useBillingOrders.js` ให้ดักฟังคอลเลกชัน `orders` จริงแบบเรียลไทม์ (`subscribeRecentOrders`) เพื่อให้ออเดอร์ใหม่ทุกช่องทางเด้งขึ้นหน้าแรกทันที พร้อมซิงก์ `catalogs/recent_orders` และเขียน SessionStorage ในพื้นหลัง และอัปเกรดปุ่ม 🔄 ใน `OrderFilterBar.jsx` ให้กดเพื่อสั่งดึงข้อมูลล่าสุดจากเซิร์ฟเวอร์จริงได้ [สถานะ: ส่งมอบแล้ว]
    35. ปัญหา: ออเดอร์จากหน้าเว็บ (Storefront) แสดงชื่อเจ้าหน้าที่เป็นเจ้าของบัญชีที่สั่งซื้อทันที (เช่น แสดงชื่อ 'บอย' ทั้งที่ยังไม่มีใครเปิดรับเรื่อง)
        วิธีแก้: 
        1) แก้ไข `getStaffNickname` ใน `dh-shared/src/utils/staffUtils.js` ไม่ให้นำ `order.createdBy` ของออเดอร์หน้าเว็บมาเป็นชื่อพนักงาน ถ้ายังไม่มีผู้รับผิดชอบให้คืนค่า null
        2) ปรับการแสดงผลใน `OrderTableRow.jsx` และ `OrderDetailModal.jsx` เป็นตัวหนังสือสีส้มสว่างแบบไม่มีกรอบ/shape 'ยังไม่ตรวจสอบ'
        3) ปรับ `billingStatusTransaction.assignStaffHandler` เป็น Atomic Transaction ด้วย `runTransaction` เพื่อไม่ให้เขียนทับหากมีเจ้าหน้าที่รับเรื่องแล้ว
        4) ผูกการคลิกเปิดดูบิลในตาราง `BillingDashboard.jsx` และ `OrderDetailModal.jsx` เข้ากับ `assignStaffHandler` เพื่อให้คนแรกที่คลิกเปิดบิลกลายเป็นผู้รับผิดชอบทันทีและซิงค์ข้อมูลแบบ Real-time [สถานะ: ส่งมอบแล้ว]
  </pitfalls_and_solutions>
</grimoire>


