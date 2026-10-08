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
</usage_workflow>

<domain_rules>
1. **Responsive Separation**: คงหน้าตาบน Desktop (PC) ให้แสดงผล 4 คอลัมน์ครบถ้วนเหมือนเดิม 100% ห้ามกระทบผู้ใช้จอใหญ่
2. **Space Efficiency on Mobile**: ห้ามเรียงการ์ดหมวดหมู่แบบเดี่ยวยาวเหยียดบนหน้าจอมือถือ เพื่อไม่ให้บดบังรายการสินค้าด้านล่าง
3. **Calm & Accessible UI**: Modal บนมือถือต้องปิดได้ทั้งการแตะปุ่มปิด (X), ปุ่ม Escape, และการแตะ Backdrop ด้านนอก พร้อมป้องกัน Scroll ทะลุ (Body scroll lock)
4. **Absolute Deployment Ban**: ห้าม deploy ขึ้น production ทุกกรณี
</domain_rules>

<core_schema>
- Entry File: `Management System/dh-frontend/src/pages/Categories/CategoriesMain.jsx`
- Components:
  - `CategoryGrid.jsx`: ตารางหมวดหมู่สำหรับ Desktop (`hidden md:block`)
  - `CategoryCard.jsx`: การ์ดหมวดหมู่เดี่ยว
  - `CategoryModal.jsx`: ป๊อปอัปเลือกหมวดหมู่กลางจอบน Mobile (`block md:hidden`)
  - `LazyFeaturedSection.jsx`: โหลดสินค้าแนะนำเมื่อเลื่อนถึง
- Data Hook: `useCategories` (`Management System/dh-frontend/src/pages/Categories/hooks/useCategories.js`)
  - คืนค่า `{ categories, loading, error }`
</core_schema>

<third_party>
- ไม่มี Third-party ภายนอกโดยตรง ใช้การดึงข้อมูลจาก Firestore collection categories/metadata
</third_party>

<pitfalls_and_solutions>
- **ปัญหาเดิม**: บนมือถือหมวดหมู่จัดเรียงเป็นแถวเดี่ยวแนวดิ่ง (`grid-cols-1`) ยาวเหยียดร่วมกับกล่องคำแนะนำ 2 กล่อง ทำให้ผู้ใช้ต้องเลื่อนจอยาวกว่า 1,500px กว่าจะเห็นสินค้า
  - **วิธีแก้**: ตัดกล่องคำแนะนำและนำข้อความค้นหา Part Number ขึ้นเป็น Subtitle ใต้หัวข้อ, บนมือถือแปลง Grid หมวดหมู่ให้กลายเป็นปุ่มกดเปิด Popup Modal กลางจอแทน ช่วยคืนพื้นที่หน้าจอให้สินค้าเด่นเห็นได้ทันที
</pitfalls_and_solutions>
