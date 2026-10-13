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
1. **Partial Overwrite (Patch Update):** การนำเข้า Excel ต้องเขียนทับเฉพาะคอลัมน์ที่ระบุใน Excel ส่วนข้อมูลที่มีอยู่เดิมใน Firestore (รูปภาพ `images`, ลิงก์ `externalLinks`, แท็ก `tags`, วันที่สร้าง `createdAt`) **ต้องคงไว้เสมอ ห้ามถูกล้างเป็นค่าว่าง**
2. **การนับสต๊อก vs การเพิ่มสต๊อก:**
   - `StockQuantity`: นับยอดสต๊อกจริง (Overwrite) แสดงในช่องที่ 6 "คงเหลือ (Stock)"
   - `AddStock`: เพิ่มสต๊อกต่อยอดเดิม (Increment) แสดงผลบวกในช่องที่ 6 "คงเหลือ (Stock)"
   - ห้ามใส่ทั้งคู่ในแถวเดียวกัน (ระบบตรวจจับเป็น Error ทันที)
3. **Firestore Op Limit:** ทุก Batch ต้องไม่เกิน 400 ops (ปลอดภัยจากเพดาน 500 ops)
4. **Bundle Receipts:** สรุปการรับเข้าสต๊อกจาก Excel รวมเป็น 1 Document แม่ใน `inventory_import_batches` แทนการเขียนแยกหลายพันรายการ
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
- Google Apps Script (GAS): คิวซิงค์สต๊อกเบื้องหลัง
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
</pitfalls_and_solutions>
