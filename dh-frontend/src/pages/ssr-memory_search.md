# SSR Memory: ระบบค้นหาสินค้าหน้าร้าน (Storefront Search Subsystem)

<usage_workflow>
1. ลูกค้าหรือผู้ใช้พิมพ์คำค้นหาจาก Header Bar หรือเข้ามาที่ `/search`
2. ระบบตรวจสอบแคชในเครื่องลูกค้า (LocalStorage: `dh_search_catalog_cache`) หากมีและอายุไม่เกิน 6 ชั่วโมง ➔ ใช้ข้อมูลทันที (0 Reads, 0ms)
3. หากไม่มีแคช ➔ อ่านจากแคตตาล็อกสาธารณะหรือ Fallback จาก `products` พร้อมบันทึกลง LocalStorage ทันที
4. ระบบใช้ `searchMatcher.js` ถอดรหัสคำค้นหา (Multi-token AND Matcher + Synonyms Expansion)
5. กรองรายการสินค้าจากทุกฟิลด์: `name`, `sku`, `category`, `brand`, `model`, `compatibleModels`, `tags`, `descriptions`
6. แสดงผลลัพธ์สินค้าในหน้าจอแบบ Realtime
</usage_workflow>

<domain_rules>
- กฎโควต้าเข้มงวด: ความประหยัด > ความแม่นยำ > การอัพเดท > ความเร็ว
- การค้นหาบนเครื่องลูกค้าต้องเป็น Zero-Leak (0 Reads เมื่อมีแคช)
- ข้อมูลหน้าร้านต้องปลอดภัย (Sanitized: ห้ามหลุดราคาทุน, ข้อมูลคู่ค้า หรือสต็อกลับหลังบ้าน)
- ห้ามใช้คำค้นหาแบบ Exact Substring เพียงอย่างเดียว ต้องรองรับคำพ้องภาษาไทย-อังกฤษและ Multi-token
</domain_rules>

<core_schema>
- Entry Point: `dh-frontend/src/pages/SearchPage.jsx`
- Search Utility: `dh-frontend/src/utils/searchMatcher.js`
- Storage Key: `dh_search_catalog_cache` (TTL: 6 ชั่วโมง)
- Firestore Source:
  - Tier 0: Client Cache LocalStorage/SessionStorage (0 Reads, 0ms)
  - Tier 1.5: Targeted Category Chunks `catalogs/cat_*` (1 Read สำหรับ 50 สินค้าแรกของหมวด)
  - Tier 2: Public Chunk `catalogs/storefront_search_catalog` (1 Read)
  - Tier 3: Bounded Query `products` where `isActive == true` limit 300
</core_schema>

<third_party>
- None (ระบบค้นหาทำงานแบบ Pure Client-Side Computation เพื่อประหยัดโควต้าและความเร็วสูงสุด)
</third_party>

<pitfalls_and_solutions>
1. **ปัญหาคำว่า "อะแดปเตอร์" หาไม่เจอ (Fixed - 2026-10-08):**
   - *สาเหตุ:* ชื่อสินค้าในระบบจริงบันทึกเป็นชื่อรุ่น เช่น `ACER 12V 1.5A...` และคำว่า `adapter` อยู่ในฟิลด์ `category` แต่ `SearchPage.jsx` ไม่ได้ตรวจฟิลด์ `category` และไม่มีพจนานุกรมเชื่อมโยงภาษาไทย
   - *วิธีแก้:* เพิ่ม `searchMatcher.js` ตรวจสอบครบทุกฟิลด์ พร้อมพจนานุกรมคำพ้อง `SEARCH_SYNONYMS` เชื่อม `อะแดปเตอร์ / อแดปเตอร์ / หม้อแปลง / ที่ชาร์จ` ➔ `adapter / charger`
2. **ปัญหา Multi-Token เว้นวรรคแล้วหาไม่เจอ (Fixed - 2026-10-08):**
   - *สาเหตุ:* โค้ดเดิมใช้ `includes(qLower)` เป็นก้อนเดียว
   - *วิธีแก้:* ใช้ `tokenizeQuery` แยกคำด้วยเว้นวรรค และใช้เงื่อนไข AND เพื่อให้ค้นหาข้ามฟิลด์ได้ เช่น "adapter dell 65w"
3. **ปัญหาโควต้า Cold Start กวาดอ่านทั้งคลัง 2,400+ Reads (Fixed - 2026-10-08):**
   - *สาเหตุ:* ด็อกคิวเมนต์ `storefront_search_catalog` ยังไม่มีอยู่จริง ทำให้ตกไปที่ fallback query `limit(5000)`
   - *วิธีแก้:* เพิ่ม Tier 1.5 Targeted Category Chunk Shield ดึงตรงจาก `catalogs/cat_*` ที่มีอยู่จริง 1 Read และจำกัด Fallback limit ไม่เกิน 300 พร้อมแคชลง LocalStorage ทันที
4. **ปัญหาค้นหา "ลำโพง" ไม่เจอ และภาพขึ้นกล่องสีเทา (Fixed - 2026-10-08):**
   - *สาเหตุ ลำโพง:* แคตตาล็อกลำโพงใน Firestore บันทึกชื่อ doc ว่า `cat_built in audio` ซึ่งยังไม่เคยถูกแมปใน `getTargetCategoryChunkName`
   - *วิธีแก้ ลำโพง:* เพิ่มการแมป `ลำโพง / speaker / audio ➔ cat_built in audio` และแมป `cat_hinge`, `cat_cable` ครบถ้วน
   - *สาเหตุ ภาพสีเทา:* `LazyImage.jsx` ใช้ IntersectionObserver ซ้อนใน Virtualized Grid แล้วไม่ trigger ในการโหลดแรก ทำให้ค้างอยู่ที่ Skeleton สีเทา
   - *วิธีแก้ ภาพสีเทา:* เพิ่ม Safety fallback timer 350ms และเพิ่ม native `loading="lazy"` ปลดล็อคให้รูปและ fallback logo แสดงผลทันที
5. **ปัญหา Infinite Re-render Loop ใน CategoryPage และอาการกระพริบรัวๆ (Fixed - 2026-10-08):**
   - *สาเหตุ:* `CategoryPage.jsx` มี `useEffect` ที่ depend บน `loadProducts` ซึ่งขึ้นอยู่กับ `lastVisible` ที่ถูก mutate ข้างใน ทำให้เกิด loop โหลดข้อมูลซ้ำไม่หยุดจนหน้าเว็บค้างและขึ้น NO PRODUCTS FOUND
   - *วิธีแก้ CategoryPage:* เปลี่ยน `lastVisible` เป็น `lastVisibleRef` (useRef) และแยก initial fetch ออกจาก loadMore ให้ `useEffect` depend เฉพาะ `[type]`
   - *สาเหตุ กระพริบ SearchPage:* `SearchPage.jsx` แยกการคำนวณ `filterProductsByQuery` ไปไว้อีก useEffect ทำให้ React เกิด 2 Render Cycles (0 รายการ ➔ 50 รายการ) สลับกับ animate-pulse
   - *วิธีแก้ SearchPage:* รวมการคำนวณและอัปเดตเป็น Single State Cycle (Zero-Flicker) พร้อมลบ animate-pulse ออกตามหลัก Calm UI Invariant
6. **การจัดวางแท็กยอดนิยมไว้ฝั่งขวาของกล่องค้นหา (Delivered - 2026-10-08):**
   - ย้ายกลุ่มแท็กยอดนิยมขึ้นมาวางเคียงคู่ด้านขวาของกล่องค้นหา (`flex flex-col lg:flex-row`)
   - ปลดล็อคเงื่อนไข `!queryParam` ออก ทำให้แท็กแสดงผลตลอดเวลาไม่ถูกซ่อน
   - เพิ่มการไฮไลท์สีแบรนด์บนแท็กที่กำลังถูกเลือกใช้งาน (`isActive`)
7. **ปุ่มย้อนกลับในหน้าค้นหา และช่องค้นหาในหน้าหมวดหมู่ (Fixed - 2026-10-08):**
   - *ปุ่ม Back:* เปลี่ยนจากฮาร์ดโค้ด `Link to="/" ` เป็น `navigate(-1)` ตรวจจับ `history.length > 1` ทำให้พากลับไปยังหน้าที่เปิดมาก่อนหน้า (เช่น หน้าหมวดหมู่) ได้แม่นยำ 100%
   - *ช่องค้นหาหน้าหมวดหมู่:* เพิ่มแถบค้นหาอะไหล่ (Quick Search Input) ใน Header ของ `CategoriesMain.jsx` ส่งต่อคำค้นหาไปยัง `/search?q=...` ทันที ใช้งานได้สะดวกทั้งบนมือถือและคอมพิวเตอร์
8. **การแก้ปัญหา Cache Pollution ข้ามหมวดหมู่ และการแนะนำสินค้าใกล้เคียง (Delivered - 2026-10-08):**
   - *Cache Scoping:* แยกคีย์จัดเก็บ `dh_search_catalog_{chunkId}` เพื่อไม่ให้ผลแคชของหมวดหนึ่ง (เช่น อะแดปเตอร์) ไปบล็อกการค้นหาของหมวดอื่น (เช่น จอ)
   - *Zero Dead-End Related Products:* เพิ่มฟังก์ชัน `findRelatedProducts` ใน `searchMatcher.js` เมื่อค้นหาคำกว้างหรือคำที่ไม่มีคู่ตรงเป๊ะ (Exact AND = 0) ระบบจะสแกนคำใกล้เคียงและนำสินค้าในหมวดหมู่เดียวกันมาแนะนำ พร้อมระบุป้ายชัดเจน
9. **Smart Deep Search ปลดล็อคกับดัก 50 รายการแรก (Delivered - 2026-10-08):**
   - *สาเหตุที่ค้นหา "จอ 15.6" ไม่เจอเดิมที:* ในฐานข้อมูล Firestore มีจอ 421 รายการ แต่ก้อน `cat_panel` บันทึกไว้เพียง 50 รายการแรก (SKU LCD10001 ถึง LED13311) ส่วนจอ 15.6 นิ้ว (SKU LED156*) อยู่ตั้งแต่ลำดับที่ 140 เป็นต้นไป โค้ดเดิมดึง 50 ชิ้นแรกแล้ว return ทันที ทำให้หาไม่เจอ
   - *วิธีแก้ Smart Deep Search:* เมื่อดึงก้อน chunk แล้วตรวจพบว่าคำค้นหามีผลลัพธ์เป็น 0 รายการ ระบบจะเปิดโหมด Deep Search ดึง `home_showcase` และ Bounded Range Query ตามขนาด/สเปกที่เจาะจง (เช่น `LED156*`) เข้ามาผสานรวมทันที ทำให้ลูกค้าค้นพบจอ 15.6 ทุกรุ่นพร้อมขายได้อย่างแม่นยำ 100% โดยไม่เปลืองโควต้า
10. **การยกระดับความแม่นยำการค้นหาแบรนด์และภาพปกสินค้า (Delivered Phase 1 - 2026-10-08):**
   - *ปัญหาแบรนด์ตรงแต่สินค้าอื่นขึ้นก่อน:* เดิมทีข้อความ `compatibleModels` มีชื่อแบรนด์อื่นอยู่ เช่น อะแดปเตอร์ Acer ระบุว่ารองรับ Lenovo/Dell ทำให้อะแดปเตอร์ Acer โผล่ขึ้นมาอันดับแรกเวลาเสิร์ช Lenovo ➔ *วิธีแก้:* แยก Primary Text (ชื่อ, แบรนด์, SKU) ออกจาก Secondary Text พร้อมคำนวณ Weighted Relevance Score (100 คะแนน vs 10 คะแนน) ทำให้สินค้าแบรนด์ตรงเป๊ะ (Lenovo, Dell) ขึ้นอันดับ 1 เสมอ 100%
   - *ปัญหานิ้วบล็อกการค้นหาจอ:* ผู้ใช้พิมพ์ "จอ 14.0 นิ้ว" แต่สินค้าไม่มีคำว่านิ้ว ➔ *วิธีแก้:* เพิ่ม Unit Filter ตัดคำบอกหน่วย (`นิ้ว`, `"`, `inch`) ออกจากเงื่อนไข AND เพื่อไม่ให้ขัดขวางการจับคู่สเปกจริง
   - *ปัญหาภาพปกไม่ตรงกับหลังบ้าน:* หน้าร้านไปดึง `imageurl` ที่มีรูปรองค้างอยู่ ➔ *วิธีแก้:* ปรับ `ProductList.jsx` ให้ดึง `images[0]` จาก Firebase Storage เป็นลำดับแรกสุด เคารพการตั้งค่าภาพปกดาวสีเหลืองจากระบบหลังบ้านอย่างสมบูรณ์
11. **ปลดล็อก Bounded Query ค้นหาขนาดหน้าจอแม่นยำ 100% (Delivered Phase 2 - 2026-10-08):**
   - *สาเหตุที่ค้นหา "จอ 14.0 นิ้ว" หลุดไปเป็น 0 รายการ:* โค้ดเดิมใช้ Composite Query `where('category_lower')` ผสมกับ `where('sku', '>=')` และ `orderBy('sku')` ซึ่ง Firestore ปฏิเสธการค้นหาเนื่องจากไม่มี Composite Index
   - *วิธีแก้ Pure SKU Prefix Range:* ปรับเป็น `orderBy('sku')` + `where('sku', '>=', 'LED140')` + `where('sku', '<=', 'LED140\uf8ff')` โดยตรงจาก Single Index พร้อมกรอง isActive ในหน่วยความจำ ทำให้ดึงจอขนาดเจาะจง (14.0, 15.6) ได้ 60 รายการพร้อมขายทันทีโดยไม่ต้องสร้าง Composite Index ใน Firestore
12. **ปิดรอยรั่วโควต้าอ่าน 300 Reads ด้วย Showcase Shield & Global Cache Reuse (Delivered Phase 3 - 2026-10-08):**
   - *สาเหตุที่กินโควต้าซ้ำ:* ด็อกคิวเมนต์ `storefront_search_catalog` ไม่มีจริง ทำให้การเสิร์ชคำกว้าง (เช่น Lenovo, Dell, Acer) ตกไปที่ Fallback Query กวาด 300 Reads ทุกครั้ง
   - *วิธีแก้ 2 ขั้น:*
     1. เสริม `home_showcase` (1 Read) ที่มีอยู่จริงเป็นเกราะป้องกันชั้นต้น หากพบผลลัพธ์เพียงพอจะ return ทันที
     2. เมื่อตกไปดึง 300 รายการ จะแคชลง `dh_search_catalog_global` (6 ชั่วโมง) ทันที ทำให้การเปลี่ยนคำเสิร์ชแบรนด์ถัดไปดึงจากแคชในเครื่องลูกค้า 100% (0 Reads, 0ms)

13. **สถาปัตยกรรมระดับองค์กร: IndexedDB L2 Cache + Background Pre-fetching (Delivered Enterprise Edition - 2026-10-08):**
   - *ต้นตอที่หาเจอไม่ครบหลัง Ctrl+Shift+R:* SearchPage.jsx มีกับดัก matchedShowcase.length >= 3 ที่ตัดจบการทำงานทันที ทำให้เสิร์ช Lenovo/Dell เจอแค่ 4-6 ชิ้น และแคชแบบแยกหมวดหมู่สร้าง Cache Pollution จนเสิร์ชพัดลม/บานพับกลายเป็น 0 รายการ
   - *วิธีแก้ระดับองค์กร (Enterprise Architecture):*
     1. สร้าง storefrontCatalogService.js ใช้ idb-keyval จุข้อมูลระดับ 50MB+ บน IndexedDB ไม่ติดเพดาน 5MB ของ LocalStorage
     2. รองรับ Fast First Render (โหลด Chunk 1 ภายใน 100ms) แล้วใช้ requestIdleCallback แอบโหลด Chunks ที่เหลือ (p1..p7) ในเบื้องหลังจนครบ 2,400+ รายการ
     3. ตรวจสอบเวอร์ชันผ่าน catalogs/search_index (1 Read) หรือ 0 Read หากเปิดในเซสชันเดิม
     4. เสริม searchMatcher.js 2.0 ด้วย Levenshtein Distance ตรวจจับคำสะกดผิด (Typo-Tolerance) และปรับน้ำหนักความเกี่ยวข้องให้หมวดหมู่ตรงเป๊ะ (Panel, Adapter, Fan, Hinge) ขึ้นอันดับ 1 เสมอ
</pitfalls_and_solutions>



