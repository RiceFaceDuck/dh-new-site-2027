# SSR Memory: Inventory (ระบบคลังสินค้าและการนำเข้าข้อมูล)

<usage_workflow>
1. ผู้ใช้เปิดหน้าคลังสินค้า http://localhost:3168/inventory
2. ผู้ใช้กดปุ่ม "นำเข้าสินค้า (Excel)" เพื่อเปิด Modal นำเข้า
3. ผู้ใช้ดาวน์โหลด Template หรืออัปโหลดไฟล์ `.xlsx` (รองรับหลายพันรายการ)
4. ระบบทำการวิเคราะห์ข้อมูลล่วงหน้า (Preview) แบ่งสถานะเป็น:
   - NEW: สินค้าใหม่ (ยังไม่มีในระบบ)
   - CHANGED: มีการเปลี่ยนแปลงข้อมูล
   - UNCHANGED: ข้อมูลเหมือนเดิมทุกประการ
   - ERROR: ข้อมูลผิดพลาด (เช่น ใส่ทั้ง StockQuantity และ AddStock พร้อมกัน)
5. ผู้ใช้กดยืนยันการนำเข้า ระบบจะ Batch เขียนทับ (Patch Update) ไปยัง Firestore
6. ตารางแสดงผลคลังสินค้า (10 คอลัมน์) อัปเดตข้อมูลทันทีแบบ Zero Reads
</usage_workflow>

<domain_rules>
1. **Selective Column-Level Patching:** การนำเข้า Excel ต้องยึดหลัก "ช่องว่าง = ไม่แตะต้องข้อมูลเดิมในระบบ 100% / มีค่า = เขียนทับเฉพาะคอลัมน์นั้นตรงๆ" ส่วนข้อมูลที่มีอยู่เดิมใน Firestore (รูปภาพ `images`, ลิงก์ `externalLinks`, แท็ก `tags`, หมวดหมู่ `category`, วันที่สร้าง `createdAt`) **ต้องคงไว้เสมอ ห้ามถูกล้างเป็นค่าว่าง** และแถวที่มี SKU ครบถ้วนสามารถนำเข้าได้แม้ไม่มีคอลัมน์ชื่อ
2. **การนับสต๊อก vs การเพิ่มสต๊อก (และ Smart Header Recognition):**
   - `นับสต๊อค` (เดิมคือ `StockQuantity`): นับยอดสต๊อกจริง (Overwrite) แสดงในช่องที่ 6 "คงเหลือ (Stock)" และบันทึกผลต่างลง `adjustmentHistory`
   - `Price (ราคาส่ง)` (เดิมคือ `Price`): ราคาส่งฐานของสินค้า
   - `AddStock`: เพิ่มสต๊อกต่อยอดเดิม (Increment) แสดงผลบวกในช่องที่ 6 "คงเหลือ (Stock)"
   - ห้ามใส่ทั้งคู่ในแถวเดียวกัน (ระบบตรวจจับเป็น Error ทันที)
   - ระบบรองรับทั้งชื่อคอลัมน์ใหม่ตาม Template ล่าสุด (`Price (ราคาส่ง)`, `นับสต๊อค`) และชื่อดั้งเดิมเพื่อความ Backward Compatible
3. **Firestore Op Limit:** ทุก Batch ต้องไม่เกิน 400 ops (ปลอดภัยจากเพดาน 500 ops)
4. **Bundle Receipts:** สรุปการรับเข้าสต๊อกจาก Excel รวมเป็น 1 Document แม่ใน `inventory_import_batches` แทนการเขียนแยกหลายพันรายการ
5. **UI & Layout:** รูปแบบการแสดงผล สีของตาราง และป้ายบน Header ตรงตามจุดประสงค์การใช้งานจริงแล้ว ให้คงไว้ตามเดิม
6. **GAS Permanently Deprecated (Zero GAS Invariant):** ระบบปิดการทำงานของ Google Apps Script ถาวร ห้ามมีคิว หรือส่ง HTTP requests ไป GAS จากกระบวนการ Import โดยเด็ดขาด
7. **Local In-Memory Staging Buffer & Undefined Sanitizer:** ประมวลผลและตรวจสอบข้อมูลในเครื่องให้เรียบร้อยสมบูรณ์ก่อน commit และต้องกวาดลบคีย์ `undefined` ออกจาก doc payload 100% ป้องกัน Firestore SDK error
</domain_rules>

<core_schema>
- Entry Files:
  - `src/components/inventory/hooks/useExcelImport.js`
  - `src/firebase/inventory/inventoryImportService.js`
  - `src/firebase/catalogHydrationService.js`
  - `src/components/inventory/hooks/useInventorySearch.js`
  - `src/components/inventory/ProductTableRow.jsx`
- Firestore Collections:
  - `products`: เอกสารสินค้าหลัก (DocID = SKU)
  - `inventory_import_batches`: ประวัติการรับสินค้าเข้าเป็นล็อต
  - `catalogs/search_index`: แคตตาล็อกแคช (Shards p1..p7)
</core_schema>

<third_party>
- XLSX: ประมวลผลชีต Excel
- Google Apps Script (GAS): [DEPRECATED & DISABLED] สั่งปิดระบบถาวร ไม่มีการเชื่อมต่ออีกต่อไป
</third_party>

<pitfalls_and_solutions>
1. **ปัญหาภาพสินค้าหายหลัง Import Excel:**
   - *สาเหตุ:* โค้ด Normalize แคชหน้าบ้านมองว่า Excel ไม่มีคอลัมน์ภาพ จึงเซ็ต `images: []` ทับแคชเดิม
   - *วิธีแก้:* ใน `useExcelImport.js`, `catalogHydrationService.js`, และ `useInventorySearch.js` ต้องตรวจจับและคงค่า `existing.images` และ `existing.image` ไว้เสมอเมื่อ Excel ไม่ได้ส่งรูปมา
2. **ตารางค้างเมื่อโหลดข้อมูลหลายพันแถว:**
3. **คอลัมน์ปรับยอดแสดง 0 หรือตัวเลขเก่าแทนที่จะแสดงผลต่างจากการนับสต๊อก:**
   - *สาเหตุ:* `useInventoryData.js` นำสถิติจาก `inventory_stats_snapshot` (สรุปภาพรวมข้ามคืน) มาเขียนทับ `adjustmentHistory['30']` ของตัวสินค้า
   - *วิธีแก้:* ใน `useInventoryData.js` และ `useInventorySearch.js` ต้องคงค่า `adjustmentHistory` ของสินค้าจริงเป็นอันดับแรก ไม่ถูก snapshot เก่าเขียนทับ
4. **ภาพหายหรือสต๊อกย้อนกลับเป็นค่าเก่าจาก Shard:**
   - *สาเหตุ:* การสั่ง `clearCatalogCache()` จะไปลบ IndexedDB ทำให้ตอนโหลดใหม่ต้องไปดึง Firestore Shards เก่า (`search_index_p1`) ซึ่งมีสต๊อกเดิม
   - *วิธีแก้:* ใช้ `updateCatalogCacheWithProducts(toWrite)` อัปเดตทับแคชตรงๆ พร้อมข้อมูลรูปและ adjustment ไม่ต้องลบ IndexedDB
5. **คอลัมน์ AddStock กับ StockQuantity แสดงข้อมูลผลต่างซ้ำกันใน Preview:**
   - *สาเหตุ:* `ImportPreviewTable.jsx` ผูกเงื่อนไขรวมกัน
   - *วิธีแก้:* แยกให้ `AddStock` แสดงเฉพาะการรับของเข้า (`type === 'add'`) ส่วน `StockQuantity` แสดงเฉพาะการนับสต๊อก (`type === 'adjustment'`)
6. **ปัญหา Google Sheets Sync ล้มเหลวตอนนำเข้าไฟล์ใหญ่:**
   - *สาเหตุ:* `gasStockService._flush()` ยิงคำขอเดี่ยวไม่แบ่งก้อน ทำให้ชน timeout 30s หรือ payload limit ของ Google Apps Script
   - *วิธีแก้:* แบ่งส่งก้อนละ 200 รายการ (`CHUNK_SIZE = 200`) สอดคล้องกับ `syncAllProducts` พร้อมระบบ Safe Chunk Recovery คืนเฉพาะก้อนที่ค้างส่ง
7. **ปัญหา Double Hydration แคช 2 รอบตอนเปิดหน้าเว็บ:**
   - *สาเหตุ:* `useInventorySearch` ยิง `hydrateCatalog()` ซ้ำรอบสองขณะที่ `useInventoryData` โหลดสินค้าครบแคตตาล็อกมาแล้ว
   - *วิธีแก้:* นำ `products` ที่ส่งเข้ามาตั้งเป็น baseline cache ทันทีหากมีมากกว่า 50 รายการ ขจัด Promise และ JSON parse ซ้ำซ้อน
8. **UI Product Modal แผงแท็ก Compatible ยืดล้นหน้าจอ, ขาวโพลน & กล่องไม่ตรงกัน:**
   - *สาเหตุ:* กล่องใส่ข้อมูล (Input, Select, Textarea, Chips) ยังใช้ `rounded-xl` ขอบมนเยอะเกินไป, พื้นหลังสีขาวกลืนกับ Modal ทำให้ขาวโพลนไร้มิติ, กล่องใส่ข้อมูลแต่ละแถวความสูงไม่เท่ากัน, และปุ่มย่อขยายเคยใหญ่เทอะทะ
   - *วิธีแก้:* 
     1) ปรับมุมโค้งมนกล่องใส่ข้อมูลทุกจุดเป็น 0.1 (`rounded-[2px]`) ยกเว้นปุ่มกดที่คงความโค้งมนเดิม (`rounded-xl`/`rounded-lg`)
     2) ปรับพื้นหลัง Modal Body เป็น `bg-slate-100 dark:bg-slate-950` ตัดกับแผงการ์ดสีขาว `border-slate-300 shadow-sm` กำจัดปัญหาขาวโพลน
     3) จัดระเบียบ Grid และ Alignment ทุกแถวให้ความสูงเท่ากันเป๊ะ (`h-10`)
     4) ปรับระบบ ย่อ/ขยาย ของ Compatible Models & Part Number เป็นสไตล์มินิมอล (`ดูทั้งหมด (N) ▾` / `ย่อลง ▴`) ไม่เกะกะสายตา
9. **ป้องกันการเขียนทับสินค้าเดิมเมื่อพิมพ์ SKU ซ้ำ (Duplicate SKU Guard):**
   - *สาเหตุ:* `addProduct` เดิมใช้ `setDoc` ทับ `products/{sku}` ตรงๆ โดยไม่ตรวจ `getDoc` ทำให้สินค้าเดิมถูกล้างข้อมูลทับสูญหาย
   - *วิธีแก้:* เพิ่ม Pre-flight Guard 2 ชั้น: เช็คใน Client Cache (`products.some(...)`) ทันที และตรวจ `getDoc(docRef)` ใน `inventoryMutationService.addProduct` หากซ้ำจะแจ้งเตือนและระงับการบันทึก
10. **ป้องกันรูปภาพหายจาก Race Condition ของแคช 3-Tier (Preserve Existing Images):**
    - *สาเหตุ:* แคตตาล็อกแคชตัดรูปภาพออกเพื่อประหยัดขนาด หากผู้ใช้กดบันทึกก่อนที่ Asynchronous Fetch จะดึงรูปจริงกลับมา จะเซฟ `images: []` ทับ Firestore
    - *วิธีแก้:* เพิ่ม `isImageHealing` บล็อกปุ่มบันทึกขณะกำลังโหลดรูปเดิม และใน `inventoryMutationService.updateProduct` มี Guard คงรูปเดิมไว้เสมอหาก `newData.images` ว่าง
11. **ชื่อฟิลด์รายละเอียดสินค้าไม่ตรงกับ Storefront (Description Parity):**
    - *สาเหตุ:* หน้าบ้าน Storefront อ่าน `fullDescription` แต่ฟอร์มใช้ `description` ทำให้รายละเอียดไม่แสดงหน้าเว็บ
    - *วิธีแก้:* ซิงค์ `description` และ `fullDescription` ให้มีค่าตรงกันเสมอทั้งใน Form, Controller, และ Service
12. **ข้อมูลสถิติ 5 มิติจาก UI ปนเปื้อนเอกสารหลัก (Synthetic Stats Stripping):**
    - *สาเหตุ:* `useInventoryData` นำสถิติ 30 วันมาตกแต่งใส่ตัวแปร เมื่อเซฟผ่าน Modal ค่าเหล่านี้จะติดไปเขียนทับ Firestore ทำให้ `claimHistory` กลายสภาพเป็น Object
    - *วิธีแก้:* Strip ฟิลด์สถิติชั่วคราว (`sales30D`, `stats`, `totalSold` ฯลฯ) ออกจาก Payload และคง Array ดั้งเดิมของ `claimHistory` ไว้เสมอ
13. **การบันทึกประวัติปรับลดสต็อก (Stock Adjustments Invariant):**
    - *สาเหตุ:* `inventoryMutationService.updateProduct` เดิมตรวจเฉพาะสต็อกเพิ่ม (`addedStock > 0`) เข้า `stock_receipts` แต่เมื่อลดสต็อก (`addedStock < 0`) ไม่มีการบันทึกประวัติใดๆ
    - *วิธีแก้:* เมื่อ `addedStock < 0` ให้บันทึกลง `stock_adjustments` เสมอ บันทึกทั้ง `previousStock`, `newStock`, `difference`, และผู้ดำเนินการ เพื่อความสมบูรณ์ทางบัญชี
14. **ระบบ Smart Write ถูกทำลายด้วย randomSeed:**
    - *สาเหตุ:* `ProductModal` สุ่ม `randomSeed` ทุกครั้งที่กด Submit ทำให้ตรวจพบว่าข้อมูลเปลี่ยนตลอดเวลา เสียค่าเขียน Firestore ฟรี
    - *วิธีแก้:* สุ่ม `randomSeed` เฉพาะสินค้าสร้างใหม่เท่านั้น และตัด `randomSeed` ออกจากการเปรียบเทียบ Diff loop ใน `updateProduct`
15. **ป้องกันการทับยอดขาย POS หน้าร้าน (Concurrency Lost-Update Shield):**
    - *สาเหตุ:* หากแอดมินเปิดหน้าต่างแก้ไขสินค้าค้างไว้แล้วมีการขายผ่าน POS เมื่อแอดมินกดบันทึก สต็อกเดิมจะเขียนทับสต็อกใหม่
    - *วิธีแก้:* บันทึก `_initialStock` ไว้ใน Form State หากแอดมินไม่ได้เปลี่ยนตัวเลขสต็อกในฟอร์ม ระบบจะคงค่า `oldData.stockQuantity` สดๆ จาก Firestore เสมอ
16. **การแสดงผล Dark Mode ในตาราง Variants (Dark Mode Parity):**
    - *สาเหตุ:* ช่อง Input ในตารางรุ่นย่อยลืมกำหนด `text-slate-900 dark:text-slate-100` ทำให้ตัวเลขใน Dark Mode กลืนกับสีเทาจางของตาราง
    - *วิธีแก้:* เติมคลาสสีตัวอักษรให้ชัดเจนทั้งในโหมดสว่างและมืด
17. **การตัดเครื่องหมายทับออกจาก SKU (Forward-Slash Sanitization):**
    - *สาเหตุ:* การใส่ `/` ใน SKU จะทำให้ Firestore มองว่าเป็น Sub-collection path ทำให้ระบบแครช
    - *วิธีแก้:* แปลง `/` เป็น `-` อัตโนมัติในช่องกรอก SKU ทันทีที่พิมพ์
18. **ยกเลิก Native Alert ในระบบสินค้าทั้งหมด (Zero Native Alert Invariant):**
    - *สาเหตุ:* การใช้ `alert()` บล็อกการทำงานของ Browser และไม่สวยงาม
    - *วิธีแก้:* เปลี่ยนเป็น `toast.error()` และ `toast.success()` ครบทุกจุด และ import `X` จาก `lucide-react` ตรงๆ ไม่สร้าง component ซ้ำ
19. **Category Object Guard ในระบบเรียงลำดับและค้นหา (Category Object Sorting & Filter Shield):**
    - *สาเหตุ:* ฟิลด์ `category` ในบางระเบียนเก็บเป็น Object `{ id, name, type }` การใช้ `String(p.category)` ตรงๆ จะกลายเป็น `"[object Object]"` ส่งผลให้สินค้าถูกกรองหายไปจากตารางเมื่อเลือกหมวดหมู่ และการเรียงลำดับผิดเพี้ยน
    - *วิธีแก้:* ใน `useInventorySorting.js` และ `useInventoryFilters.js` เพิ่ม Helper สกัดชื่อหมวดหมู่อย่างปลอดภัยทั้งจาก String และ Object (`typeof cat === 'object' && cat !== null ? (cat.name || cat.type || '') : String(cat || '')`)
20. **ขจัด Native Dialogs บล็อกการทำงาน (Zero Native Alert / Confirm / Prompt Invariant):**
    - *สาเหตุ:* มีการตกค้างของ `alert()` ใน `InventoryExportModal.jsx`, `window.confirm()` ใน `ProductModal.jsx` และ `ProductVariants.jsx`, และ `window.prompt()` ในการสร้างหมวดหมู่ใหม่
    - *วิธีแก้:* แทนที่ `alert()` ด้วย `toast.error()`, แทนที่ `window.confirm()` ด้วย Interactive Action Toast, และเปลี่ยน `window.prompt()` เป็น Inline Creation Input ใน `ProductBasicInfo.jsx` พร้อมปุ่มบันทึก/ยกเลิก สวยงามตามธีม
21. **ปรับปรุง Queue Timer เบื้องหลังของ Google Apps Script ให้เป็น On-Demand (On-Demand GAS Timer & Calm Badge):**
    - *สาเหตุ:* `gasStockService` รัน `setInterval` ทุก 5 วินาทีตลอดเวลาแม้ไม่มีรายการในคิว และ Header มีการจำลอง progress bar ของระบบที่ถูกปิดใช้งาน
    - *วิธีแก้:* ปรับ `gasStockService` ให้เริ่ม Timer เฉพาะเมื่อมีข้อมูลในคิว (`queueUpdate`) และหยุดพัก Timer ทันทีเมื่อคิวว่าง (`_stopQueueTimer`) พร้อมปรับ Badge บน Header ให้เป็น Calm UI Static Badge สะอาดตา
22. **จัดระเบียบ Collection Path ใน inventoryAdjustmentService (Collection Path Normalization):**
    - *สาเหตุ:* `inventoryAdjustmentService.js` มีการ hardcode ชื่อ Collection เป็น `'products'` ตรงๆ
    - *วิธีแก้:* ใช้ `getCollectionPath('products')` จาก `dh-shared/src/firebase/pathUtils` เพื่อความสอดคล้องกับมาตรฐานความปลอดภัย Multi-environment
23. **บั๊กตัวกรองชื่อใน useExcelImport ทำให้อัปโหลดไฟล์สต็อก/ราคาไม่ได้ (Selective Column Patching Bug):**
    - *สาเหตุ:* โค้ดเดิมกรอง `mappedItems.filter(p => p.sku && p.name)` เมื่อผู้ใช้นำเข้าไฟล์ที่มีแค่ SKU, Stock, Price (ไม่มีคอลัมน์ชื่อ) ข้อมูลทั้งหมดจะถูกตัดทิ้งเป็น 0 แถว ทำให้กดยืนยันแล้วเงียบสนิท
    - *วิธีแก้:* ปรับเป็น `filter(p => p && p.sku)` โดยไม่บังคับชื่อ และหากเป็นสินค้าใหม่ที่ไม่มีชื่อให้ fallback เป็น SKU พร้อมแสดงชื่อเดิมใน Preview ตาราง
24. **แคช IndexedDB ถูกล้างชื่อ/หมวดหมู่เป็นค่าว่างจากการ Normalize (Selective Cache Merge):**
    - *สาเหตุ:* `updateCatalogCacheWithProducts` นำผลลัพธ์จาก `normalizeProduct` ซึ่งเติม Default ค่าว่างมา spread ทับ existing data ในแคช ทำให้ชื่อและหมวดหมู่เดิมใน IndexedDB หายไป
    - *วิธีแก้:* ใช้ Selective Merge นำเฉพาะคีย์ที่ส่งมาจริงใน `rawP` (`rawP[k] !== undefined`) มาอัปเดตทับ existing data
25. **หน้าต่างสรุปผลนำเข้า (ImportResultSummary) ถูกปิดทันทีก่อนผู้ใช้ได้เห็น:**
    - *สาเหตุ:* `handleImportSuccess` ใน `useInventoryController` เรียก `setIsImportModalOpen(false)` ทันที
    - *วิธีแก้:* ให้ `handleImportSuccess` ทำเฉพาะการรีเฟรชแคชเบื้องหลัง แล้วปล่อยให้ผู้ใช้ดูสรุปและกดปุ่ม "ปิดหน้าต่าง" ได้ด้วยตนเอง
26. **การเปลี่ยนชื่อหัวคอลัมน์ Template Excel เป็นภาษาไทยที่เข้าใจง่าย (Smart Header Recognition):**
    - *สาเหตุ:* แอดมินและผู้ใช้งานสับสนชื่อ `Price` (ว่าเป็นราคาขายหรือราคาส่ง) และ `StockQuantity` (ภาษาอังกฤษยาว ไม่สื่อถึงการนับสต๊อกจริง)
    - *วิธีแก้:* เปลี่ยนหัวคอลัมน์มาตรฐานใน Template เป็น `Price (ราคาส่ง)` และ `นับสต๊อค` พร้อมจูน `useExcelImport.js` และ `ImportPreviewTable.jsx` ให้ตรวจจับ Header อัตโนมัติ (Smart Fallback) ทั้งแบบใหม่และแบบเก่า 100%
27. **การรองรับไฟล์นำเข้าขนาดใหญ่ (5,000+ แถว) ด้วย Pre-flight Scan, Chunked Processing และ Pagination:**
    - *สาเหตุ:* การอ่านและประมวลผลไฟล์ใหญ่ 5,000+ แถวรวดเดียวบน Main Thread ทำให้เบราว์เซอร์ค้าง (UI Freeze) และการเรนเดอร์ทั้งหมดในครั้งเดียวทำให้เครื่องหน่วง
    - *วิธีแก้:* 
      1) สแกนนับแถวที่มี SKU ทันทีที่เปิดไฟล์
      2) ซอยการประมวลผลทีละก้อน (`CHUNK_SIZE = 100`) พร้อมปล่อยคิว UI (`setTimeout(0)`) และแสดงป๊อปอัปความคืบหน้าแบบสดๆ `(XXXX/XXXX)`
      3) แบ่งหน้าตารางพรีวิวทีละ 50 รายการ (Pagination) มีแถบระบุหน้าและปุ่มลัด ทำให้ DOM เบาและสบายตา
      4) ควบคุม Concurrency ในการดึง SKU ที่ขาดจาก Firestore ทีละ 8 ก้อน (Safe Concurrency)
28. **นโยบายความปลอดภัยสถานะสินค้าใหม่และการล็อกสถานะซ่อนสินค้า (Product Visibility Lock):**
    - *สาเหตุ:* สินค้าใหม่ที่นำเข้าจาก Excel อาจยังกรอกรายละเอียด/รูปภาพไม่ครบ หากเปิดขายทันทีอาจหลุดไปแสดงผลหน้าร้านผิดพลาด และสินค้าเดิมที่แอดมินจงใจซ่อนไว้ไม่ควรถูกเปิดขายใหม่อัตโนมัติ
    - *วิธีแก้:* 
      1) กำหนดให้สินค้าใหม่ทุกตัวที่นำเข้าผ่าน Excel มีสถานะเริ่มต้นเป็น `isActive: false` ("ซ่อนสินค้า") เสมอ เพื่อรอพนักงานตรวจและเปิดขายด้วยมือ
      2) ล็อกสินค้าเดิมที่เคยมีสถานะ `isActive: false` ให้คงเป็น `false` ต่อไป 100% ไม่ถูกเปิดขายอัตโนมัติจากการนำเข้า
29. **ระบบอุดรอยรั่วโควต้าเขียนด้วย Smart Write Guard (Selective Firestore Writes):**
    - *สาเหตุ:* โค้ดเดิมเมื่อเลือกโหมด Overwrite จะส่งสินค้าทั้งหมดใน Excel ไปเขียน Firestore รวมถึงแถวที่ข้อมูลเหมือนเดิมเป๊ะๆ (`UNCHANGED`) ทำให้เสียโควต้าเขียนฟรี 20-30% ต่อรอบโดยเปล่าประโยชน์
    - *วิธีแก้:* 
      1) ส่งสถานะ `_status` กำกับติดไปกับทุกรายการ
      2) ใน `inventoryImportService.processBulkImport` กรองเขียนเฉพาะแถวที่เป็น `NEW` หรือ `CHANGED` เท่านั้น ส่วนแถว `UNCHANGED` จัดเข้า `toSkip` อัตโนมัติ
      3) ลดจำนวน Batch ลง 30% ประหยัดโควต้าเขียนหลายหมื่นครั้งต่อเดือน และบันทึกเสร็จไวกว่าเดิม
30. **ปัญหาข้อมูลสต็อกไม่ตรงกันข้ามเครื่องจากแคช Shard ค้าง (Cross-Device Catalog Shard Parity & Force Sync Bypass):**
    - *สาเหตุ:* ระบบ Zero-Read Architecture ดึงข้อมูลสินค้าจาก `catalogs/search_index_p1..p7` และ IndexedDB ในเครื่อง เมื่อมีการนำเข้า Excel หรือปรับสต็อก โค้ดเดิมอัปเดตเฉพาะเอกสาร `products` และแคชในเครื่องที่กด แต่ไม่ได้ตัดรอบ Manifest (`catalogs/search_index`) หรืออัปเดต Shards กลางบนคลาวด์ ทำให้เครื่องอื่นที่เปิดดูยังคงอ่านแคชเดิม และการกด Ctrl+Shift+R ไม่ล้าง IndexedDB
    - *วิธีแก้:* 
      1) สร้าง `catalogShardSyncService` อัปเดต Manifest Timestamp และจัดก้อน Shards กลางอัตโนมัติเมื่อเกิดการ Mutation หรือ Import
      2) เพิ่มฟังก์ชัน Force Bypass ให้ปุ่ม Sync และการกด Shift+Click ใน `useInventoryController` ให้ล้างแคช IndexedDB และดึงยอดสดล่าสุดจาก Firestore ทันทีเมื่อผู้ใช้สงสัยว่าข้อมูลไม่ตรงกัน
</pitfalls_and_solutions>

