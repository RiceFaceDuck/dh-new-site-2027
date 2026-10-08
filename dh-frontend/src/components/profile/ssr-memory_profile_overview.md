<ssr_memory>
  <usage_workflow>
    1. ผู้ใช้งานล็อกอินเข้าสู่ระบบ เข้าสู่แดชบอร์ดส่วนตัวผ่านเส้นทาง `/profile?tab=overview`
    2. หน้าจอแสดงผลข้อมูลการเงินภาพรวม (DH Wallet & Credit Points พร้อมระดับ Tier), ข้อมูลสรุปบัญชี (Account Summary) และฟอร์มแก้ไขข้อมูลส่วนตัว
    3. ผู้ใช้สามารถแก้ไขข้อมูลชื่อ เบอร์โทร ที่อยู่จัดส่ง และพิกัด Google Maps พร้อมระบบตรวจสอบความถูกต้องก่อนกดบันทึก
  </usage_workflow>

  <domain_rules>
    1. ป้ายระดับสิทธิ์ (Role) ต้องแสดงผลสอดคล้องกับสิทธิ์จริงของผู้ใช้งานเสมอ (Admin, Manager, Staff, Wholesale, Partner VIP, Enterprise, Member) ห้ามแสดงผลเป็น Member กับทุกคน
    2. Google Maps URL ต้องรองรับทุกโดเมนของ Google Maps (ทั้ง maps.app.goo.gl, goo.gl/maps, google.com/maps, และ maps.google.com/...)
    3. การอัปเดตข้อมูลผู้ใช้ต้องตรวจสอบสิทธิ์ตาม firestore.rules โดยห้ามผู้ใช้ทั่วไปแก้ไขฟิลด์ต้องห้าม (role, walletBalance, creditPoints, stats)
    4. ห้าม Deploy ระบบอัตโนมัติเด็ดขาด (Absolute Deployment Ban)
  </domain_rules>

  <core_schema>
    - Entry File: `dh-frontend/src/pages/Profile.jsx` (?tab=overview)
    - Sub-components: `TabOverview.jsx`, `PersonalInfoForm.jsx`, `SocialLinksForm.jsx`
    - Collection: `users/{uid}`
    - Key Fields: `displayName`, `phoneNumber`, `address: { addressLine, subDistrict, district, province, zipCode }`, `ecosystem: { mapUrl }`, `role`, `walletBalance`, `creditPoints`, `updatedAt`
  </core_schema>

  <third_party>
    - Firebase Auth: ซิงค์ `displayName` และตรวจสอบ `metadata.creationTime`
    - Google Maps: ตรวจสอบและพรีวิวแผนที่ร้านค้าพาร์ทเนอร์
  </third_party>

  <pitfalls_and_solutions>
    - ⚠️ Binary Role Fallback (FIXED Phase 1): เดิมใช้ ternary เช็คเฉพาะ `'partner'` ทำให้ Admin/Staff กลายเป็น Member -> แก้ไขด้วย `getRoleDisplayName` ครอบคลุมทุกสิทธิ์
    - ⚠️ Maps Domain Block (FIXED Phase 1): เดิม Regex ไม่รองรับ `maps.google.com` ทำให้ URL จริงบันทึกไม่ผ่าน -> ปรับปรุง Regex รองรับ subdomain maps และ ccTLD ทั้งหมด
    - ⚠️ Timestamp Inconsistency (FIXED Phase 2): เดิมใช้ `new Date()` และ `.toISOString()` ชื่อคีย์กระจัดกระจาย -> บังคับใช้ `serverTimestamp()` และคีย์มาตรฐาน `updatedAt` ใน PersonalInfoForm & SocialLinksForm
    - ⚠️ SupportSettings Phantom (FIXED Phase 2): สวิตช์ `isSupportEnabled` ใน TabOverview เดิมเขียน dead data -> แปลงเป็น PartnerHubCard ชี้ทางตรงเข้าศูนย์จัดการร้านค้าในแท็บ Ads & Marketing (SSOT)
    - ⚠️ Read Quota Multi-Listener (FIXED Phase 3): เดิมเปิด 3 listeners/getDoc แยกกันบน `users/{uid}` -> รวม `walletService` และ `TabOverview` เข้ากับ `userDocumentSubscriptionManager` ลดโควต้าอ่าน 66% (เหลือ 1 read) และตัด write-after-read บนการเซฟฟอร์ม
    - ⚠️ Frozen Orders Metric (FIXED Watchlist 1): เดิมอ่าน `user.stats.totalOrders` ที่ Checkout ไม่ได้บวก ทำให้ค้างที่ 0 -> สร้าง `useUserOrderCount` ดึงจาก `getCountFromServer` ร่วมกับ Smart Cache 5 นาที โควต้าต่ำสุด 0-1 read
    - ⚠️ Washed-out Flat Profile UI (FIXED Elevation & Contrast): เดิมการ์ดทุกเมนูใช้ `shadow-xs border-slate-100` หรือ `border-slate-200/80` และช่องกรอกข้อมูล `bg-slate-50/50` ทำให้กลืนเป็นสีขาวโพลน -> ปรับการ์ดยกตัว `shadow-md border-slate-200/90`, ส่วนหัวการ์ด `bg-slate-50/90 border-b border-slate-200/80`, ช่องกรอกข้อมูลและปุ่มฟิลเตอร์มีขอบคมชัด `border-slate-300 shadow-xs` ครบทุกแท็บ (Overview, Ads, Claims, History, Favorites, Privacy, Wallet)
    - ⚠️ Custom Domain Auth Block (FIXED Console Config): หน้าเว็บจริง https://dhcenter.site/ ล็อกอิน Google ไม่ผ่าน (ขณะที่ localhost ผ่าน) เกิดจาก custom domain ยังไม่ได้เพิ่มใน Firebase Console > Authentication > Settings > Authorized domains ทำให้ติด auth/unauthorized-domain -> แก้ไขโดยเพิ่ม dhcenter.site และ www.dhcenter.site ใน Authorized domains ปลดล็อกระบบล็อกอินสำเร็จ 100% โดยไม่ต้องแตะโค้ดหรือเสี่ยง deploy
    - ⚠️ Mobile Profile Double-Ring & Redundancy (FIXED): เดิม Navbar แสดงปุ่ม Profile แบบแคปซูล แต่บนมือถือซ่อนชื่อกับลูกศร เหลือแค่รูป Avatar ในกรอบมนเบี้ยว ทำให้เป็นวงกลมซ้อนวงกลม และซ้ำซ้อนกับปุ่มโปรไฟล์ใน BottomNav -> ปรับซ่อนปุ่ม Profile และ Divider บนมือถือ (`hidden md:block`) ให้ผู้ใช้มือถือใช้แถบเมนูด้านล่าง (BottomNav) ตามมาตรฐานสากล ส่วนบนคอมฯ (`md:flex`) แสดงรูปพร้อมชื่อและลูกศรครบถ้วนสมบูรณ์
  </pitfalls_and_solutions>
</ssr_memory>
