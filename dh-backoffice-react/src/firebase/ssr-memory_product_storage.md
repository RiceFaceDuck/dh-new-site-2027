# SSR Memory: Product Image Storage Pipeline & Migration to Firebase Storage

<usage_workflow>
1. จัดการภาพสินค้าผ่าน Backoffice (Product Modal):
   - ผู้ใช้เลือก/ลากไฟล์ภาพสินค้า (PNG, JPEG, WebP)
   - `useProductImageUpload` เรียก `productStorageService.uploadProductImage(file, sku)`
   - บีบอัด Client-Side เป็น WebP คุณภาพสูง (maxSizeMB: 0.3, maxWidthOrHeight: 1200, quality: 0.7)
   - อัปโหลดเข้า Firebase Storage path: `products/{cleanSku}/{timestamp}_{rand}_{cleanName}.webp`
   - ได้ URL พร้อม Download Token นำไปเก็บใน State `images` ของสินค้า
2. การลบภาพจริง (Physical Deletion):
   - หากภาพเพิ่งอัปโหลดในรอบเซสชันนั้นแล้วถูกกดลบ: สั่งลบทันทีออกจาก Firebase Storage
   - หากเป็นภาพเดิมของสินค้าที่ถูกลบ: เมื่อผู้ใช้กด "บันทึกสินค้า" (`handleSaveProduct`), ระบบจะตรวจหา `removedImages` และสั่ง `productStorageService.deleteProductImage(url)` ลบไฟล์จริงออกจาก Storage
3. หน้าร้านและการแสดงผล:
   - แท็ก `<img>` ที่แสดงภาพสินค้าทุกจุด (หน้าสินค้า, Modal ซูม, ตะกร้าสินค้า, หน้าสรุปออเดอร์, ตารางสต็อก) ใส่ `referrerPolicy="no-referrer"` เสมอ
   - ป้องกันปัญหา Google CDN / Proxy บล็อก HTTP 429
4. การซิงค์แคตตาล็อก:
   - เมื่อเพิ่ม/แก้ไขสินค้า จะมีการซิงค์ Search Shards (`catalogs/search_index_p1` ถึง `p7`)
</usage_workflow>

<domain_rules>
- **Zero Google Drive / GAS for Product Images:** ปิดท่อ Apps Script สำหรับภาพสินค้าถาวร ห้ามส่งภาพสินค้าไป Google Drive เด็ดขาด (คงไว้เฉพาะ `uploadSlip` สำหรับสลิปโอนเงิน)
- **WebP Compression Invariant:** ภาพสินค้าทุกภาพที่อัปโหลดต้องผ่านการแปลงและบีบอัดเป็น WebP ขนาดไม่เกิน 300 KB และกว้างไม่เกิน 1,200 px เสมอ
- **Clean Architecture Enforcement:** ห้ามคอมโพเนนต์ UI เรียก Firebase Storage โดยตรง ให้เรียกผ่าน Custom Hook (`useProductImageUpload`) และ Service (`productStorageService`) เท่านั้น
- **Physical Storage Cleanup:** ภาพสินค้าที่ถูกลบออกจากสินค้า ต้องลบไฟล์จริงออกจาก Firebase Storage เมื่อกดยืนยันบันทึก เพื่อไม่ให้เกิดไฟล์ขยะ (Orphan Files)
- **Referrer Policy Guard:** ภาพสินค้าทุกแห่งต้องมี `referrerPolicy="no-referrer"` เสมอ
</domain_rules>

<core_schema>
- Entry Services: 
  - `Management System/dh-backoffice-react/src/firebase/productStorageService.js`
  - `Management System/dh-backoffice-react/src/components/inventory/hooks/useProductImageUpload.js`
- Storage Path:
  `products/{cleanSku}/{timestamp}_{rand}_{cleanName}.webp`
- Migrated Images Path:
  `products/{cleanSku}/migrated_{fileId}.webp`
- Storage Metadata:
  ```json
  {
    "contentType": "image/webp",
    "cacheControl": "public, max-age=31536000",
    "customMetadata": {
      "sku": "cleanSku",
      "originalDriveId": "fileId",
      "migratedAt": "ISOString"
    }
  }
  ```
- Mapping Cache:
  `Management System/tests/verifications/product_image_migration_mapping.json` (บันทึก 1:1 driveUrl -> firebaseUrl ป้องกันย้ายซ้ำ)
</core_schema>

<third_party>
- **Google CDN Transcoder (Migration):**
  - ดึงภาพดั้งเดิมผ่าน `https://lh3.googleusercontent.com/d/{fileId}=w1200-rw` แปลงเป็น WebP คมชัดขนาดเบา (~35-60 KB) จาก CDN โดยตรง
- **Firebase Storage Modular SDK:**
  - `ref(storage, url)` แปลง Download URL เป็น Reference สำหรับ `deleteObject` ได้โดยตรง
</third_party>

<pitfalls_and_solutions>
- **Pitfall 1 (Image Error / 429 Block):** Google CDN `lh3.googleusercontent.com` บล็อกคำขอ HTTP 429 เมื่อพบ Header `Referer: localhost:...`
  - **Solution:** เพิ่ม `referrerPolicy="no-referrer"` ในแท็ก `<img>` ทุกจุด
- **Pitfall 2 (Drive Quota Exceeded & Slow GAS Bridge):** ท่อ GAS Bridge เดิมจำกัดขนาดและมักติดโควต้า Google Drive
  - **Solution:** ย้ายท่อส่งตรงเข้า Firebase Storage พร้อม WebP Client-side Compression
- **Pitfall 3 (Orphan Storage Files):** การลบภาพใน UI แต่ไม่ลบไฟล์จริงใน Storage ทำให้พื้นที่บวมและเสียค่าใช้จ่าย
  - **Solution:** คำนวณ diff `removedImages` ใน `useInventoryController.js` และสั่ง `deleteProductImage` เมื่อบันทึกสำเร็จ
- **Pitfall 4 (Dead / 0-byte Drive Links):** สินค้าบางรายการ (เช่น `KBHC054`) มีลิงก์ภาพเก่าบน Drive ที่ถูกลบไปแล้วจนเหลือ 0 byte
  - **Solution:** ตรวจจับ response length > 500 byte ก่อนนำเข้า หากพบ 0 byte ให้ตัดออกจาก array ของสินค้า
</pitfalls_and_solutions>
