# SSR Memory: Footer & Contact Section

<usage_workflow>
1. Storefront Footer (`dh-frontend/src/components/Footer.jsx`):
   - โหลดคอนฟิกผ่าน `footerClientService` (SessionStorage cache + fallback defaults)
   - ประกอบด้วย 4 โซนหลัก: `FooterBrand`, `FooterLinkZone` (สินค้า), `FooterLinkZone` (ช่วยเหลือ), และ `FooterContact`
2. Footer Contact Component (`dh-frontend/src/components/footer/FooterContact.jsx`):
   - แสดงข้อมูลการติดต่อและเวลาทำการแบบไร้ขอบ (Borderless) รวมเป็นกลุ่มข้อมูลเดียว (Unified Group)
   - ใช้ภาพไอคอนความละเอียดสูง (`.svg`) ในโฟลเดอร์ `dh-frontend/src/assets/footer/`
   - ลิงก์ทุกจุดเชื่อมกับ non-blocking telemetry `trackFooterClick`
</usage_workflow>

<domain_rules>
1. **Borderless & Unified Invariant**: โซนติดต่อไม่ใช้กล่องหรือกรอบแยกชิ้น (`no separate card shapes`) แต่จัดเป็นกลุ่มข้อมูลแนวตั้งที่สบายตา
2. **Image Icon Graphic Fidelity**: ใช้ภาพกราฟิก (`<img>`) แทนไอคอน SVG แบบเหี้ยนเตียนเดิม พร้อมเอฟเฟกต์ Drop-Shadow นุ่มนวล
3. **Telemetry & Contract Preservation**: ต้องรักษา key telemetry `trackFooterClick`, ลิงก์ `lineUrl ?`, `phoneTel ?`, และตัวแปร `businessHoursConfig`
4. **Test Assertion Parity**: ต้องคงคำว่า `Clock` และ `ติดต่อ & เวลาทำการ` ไว้เสมอเพื่อป้องกัน Verification Test ล้มเหลว
5. **Absolute Deployment Ban**: ห้าม deploy สู่ production โดยเด็ดขาด
</domain_rules>

<core_schema>
- Component File: `dh-frontend/src/components/footer/FooterContact.jsx`
- Assets Path: `dh-frontend/src/assets/footer/`
  - `contact-location-pin.png` (หมุดพิกัดร้าน - สีแดงฐานเขียว)
  - `contact-line-oa.png` (LINE OA - สี่เหลี่ยมมนเขียวครอปขอบโปร่งใสส่วนเกินออก)
  - `contact-phone-call.png` (เบอร์โทรศัพท์ - วงกลม Teal หูโทรศัพท์ขาว)
  - `contact-business-clock.png` (เวลาทำการ - วงแหวนแดง หน้าปัดขาว)
  - `badge-b2b-partner.png` (ป้าย VERIFIED B2B PARTNER - ไดคัตโปร่งใส 600x138)
  - `badge-dbd-registered.png` (ป้าย DBD REGISTERED - ไดคัตโปร่งใส 600x138)
  - `badge-genuine-warranty.png` (ป้าย สินค้ามีการรับประกัน - ไดคัตโปร่งใส 600x138)
  - `badge-express-delivery.png` (ป้าย ส่งออกภายในวันทันที - ไดคัตโปร่งใส 600x138)
- Icon Size: `w-7 h-7 md:w-8 md:h-8` (28px - 32px) พร้อม `shrink-0 object-contain drop-shadow`
- Trust Badges: แสดงผลปุ่มภาพกราฟิกไดคัตเต็มชิ้นแทนกล่อง CSS เดิม พร้อม hover scale 105%
- Tests Hub:
  - `tests/verifications/verify_footer_settings_parity.mjs`
  - `tests/verifications/verify_footer_final_review.mjs`
</core_schema>

<third_party>
- LINE Official Chat Link (`https://line.me/R/ti/p/...`)
- Telephone dialer link (`tel:...`)
- GA4 Analytics Integration (`trackFooterClick` non-blocking)
</third_party>

<pitfalls_and_solutions>
1. **Issue: Card boxes cluttered the footer visual rhythm**:
   - Solution: ปลด `bg-slate-800/60`, `border-slate-700/50` และ `rounded-md` ออก รวม 4 รายการเป็นกลุ่มข้อมูลเดียวกัน พร้อมเปลี่ยนไอคอน CSS ตัวเก่าเป็นรูปภาพกราฟิกที่มีมิติสวยงาม
2. **Issue: Verification test expects 'Clock' string**:
   - Solution: คงชื่อ import / alt tag ให้มี `Clock` เพื่อให้เทสต์ตรวจผ่าน 100%
3. **Issue: Phone icon image had opaque white background in corners**:
   - Solution: ใช้ Supersampled 4x Anti-aliasing Circular Mask ไดคัตพื้นหลังสีขาวรอบวงกลม Teal ออก 100% พร้อม Inset 1.5px กำจัด White Fringe ไม่ให้มีรอยขอบขาวลอยบน Dark Theme
4. **Issue: Ghost border divider (border-t border-slate-200) floating above footer**:
   - Solution: ลบ `border-t border-slate-200` ออกจาก wrapper `div` ใน `MainLayout.jsx` เพื่อไม่ให้เกิดเส้นเทาลอยเคว้งกั้นกลางช่องว่าง 96px เหนือ Footer สีเข้ม
</pitfalls_and_solutions>
