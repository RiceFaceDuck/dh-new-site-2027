# SSR Memory: Categories Page (Storefront)

<usage_workflow>
1. ลูกค้าหรือช่างเข้าหน้ารายการหมวดหมู่อะไหล่ `/categories`
2. บนหน้าจอ Desktop (PC): แสดงการ์ดหมวดหมู่แบบเต็ม 4 คอลัมน์ พร้อมข้อความแนะนำการค้นหาด้วย Part Number (PN) ใต้หัวข้อหลัก
3. บนหน้าจอ Mobile:
   - ส่วนหัวแสดงหัวข้อและคำแนะนำการค้นหาด้วย Part Number (PN) อย่างกะทัดรัด
   - แสดงแถบปุ่มกด "เลือกหมวดหมู่อะไหล่" แบบ Compact
   - เลื่อนหน้าจอเพียงเล็กน้อยจะเห็นสินค้าแนะนำ (Featured Spares) ทันที
   - เมื่อแตะปุ่ม "เลือกหมวดหมู่อะไหล่" ➔ Popup Modal กลางจอเปิดขึ้นพร้อมรายการกริด 2 คอลัมน์ และช่องค้นหาหมวดหมู่
   - เมื่อแตะหมวดหมู่ที่ต้องการ ➔ ระบบนำทางไปยัง `/category/{type}` ทันที
4. ในหน้ารายการสินค้าของหมวดหมู่ `/category/:type`:
   - แสดงสินค้าสูงสุด **50 รายการต่อหน้า** เท่านั้น
   - หากสินค้ามีมากกว่า 50 รายการ จะแสดงแถบเปลี่ยนหน้า (Pagination Bar) ที่ด้านล่าง (`< ก่อนหน้า`, ปุ่มเลขหน้า `1`, `2`, `...`, `ถัดไป >`)
   - กดย้ายหน้าจะเลื่อนหน้าจอกลับขึ้นด้านบนอย่างนุ่มนวล พร้อมบันทึกแคชในหน่วยความจำ (0ms, 0 Reads สำหรับหน้าที่เคยโหลดแล้ว)
</usage_workflow>

<domain_rules>
1. **Responsive Separation**: คงหน้าตาบน Desktop (PC) ให้แสดงผล 4 คอลัมน์ครบถ้วนเหมือนเดิม 100% ห้ามกระทบผู้ใช้จอใหญ่
2. **Space Efficiency on Mobile**: ห้ามเรียงการ์ดหมวดหมู่แบบเดี่ยวยาวเหยียดบนหน้าจอมือถือ เพื่อไม่ให้บดบังรายการสินค้าด้านล่าง
3. **Calm & Accessible UI**: Modal บนมือถือต้องปิดได้ทั้งการแตะปุ่มปิด (X), ปุ่ม Escape, และการแตะ Backdrop ด้านนอก พร้อมป้องกัน Scroll ทะลุ (Body scroll lock)
4. **50-Item Pagination Rule**: หน้ารายการสินค้าแต่ละหมวดหมู่ต้องแสดงหน้าละ 50 รายการเท่านั้น ห้ามใช้ Infinite Scroll ที่โหลดต่อท้ายยาวสะสมจนหน่วงเครื่อง
5. **Zero-Quota Re-visits**: เมื่อผู้ใช้สลับหน้าไปมาภายในเซสชันเดียวกัน ต้องดึงจาก in-memory cache ทันที ห้ามยิง Firestore ซ้ำ
6. **Absolute Deployment Ban**: ห้าม deploy ขึ้น production ทุกกรณี
</domain_rules>

<core_schema>
- Entry File Hub: `Management System/dh-frontend/src/pages/Categories/CategoriesMain.jsx`
- Entry File Category: `Management System/dh-frontend/src/pages/CategoryPage.jsx`
- Components:
  - `CategoryGrid.jsx`: ตารางหมวดหมู่สำหรับ Desktop (`hidden md:block`)
  - `CategoryCard.jsx`: การ์ดหมวดหมู่เดี่ยว
  - `CategoryModal.jsx`: ป๊อปอัปเลือกหมวดหมู่กลางจอบน Mobile (`block md:hidden`)
  - `LazyFeaturedSection.jsx`: โหลดสินค้าแนะนำเมื่อเลื่อนถึง
- Data Hook & Service:
  - `useCategories` (`Management System/dh-frontend/src/pages/Categories/hooks/useCategories.js`)
  - `productService.getProductsByCategory(category, lastVisible, limitCount = 50)`
</core_schema>

<third_party>
- ไม่มี Third-party ภายนอกโดยตรง ใช้การดึงข้อมูลจาก Firestore collection categories/metadata และ pre-aggregated chunk catalogs/cat_*
</third_party>

<pitfalls_and_solutions>
- **ปัญหาเดิม 1**: บนมือถือหมวดหมู่จัดเรียงเป็นแถวเดี่ยวแนวดิ่ง (`grid-cols-1`) ยาวเหยียดร่วมกับกล่องคำแนะนำ 2 กล่อง ทำให้ผู้ใช้ต้องเลื่อนจอยาวกว่า 1,500px กว่าจะเห็นสินค้า
  - **วิธีแก้**: ตัดกล่องคำแนะนำและนำข้อความค้นหา Part Number ขึ้นเป็น Subtitle ใต้หัวข้อ, บนมือถือแปลง Grid หมวดหมู่ให้กลายเป็นปุ่มกดเปิด Popup Modal กลางจอแทน ช่วยคืนพื้นที่หน้าจอให้สินค้าเด่นเห็นได้ทันที
- **ปัญหาเดิม 2**: หน้ารายการสินค้าแต่ละหมวดหมู่ใช้ระบบ Infinite Scroll ด้วย `itemsPerPage = 40` พอผู้ใช้เลื่อนลง สินค้าจะสะสมเพิ่มขึ้นเรื่อยๆ เป็น 90+ รายการ ทำให้เลื่อนหายากและโหลดสะสม
  - **วิธีแก้**: ยกเลิก `IntersectionObserver` ปรับค่าเป็นหน้าละ 50 รายการพอดีกับขนาดของ Tier 1 Chunk `cat_*` และสร้างแถบเปลี่ยนหน้า (Pagination Bar: `< ก่อนหน้า`, `1`, `2`, `ถัดไป >`) พร้อมแคช `pageCacheRef` ในหน่วยความจำ ทำให้กดย้อนกลับหน้าเดิมได้เร็วทันที 0ms และไม่เสียโควต้าอ่านเพิ่ม
</pitfalls_and_solutions>
