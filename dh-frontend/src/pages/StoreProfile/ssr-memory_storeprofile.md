# SSR Memory: Store Profile (`ssr-memory_storeprofile.md`)

## 1. <usage_workflow>
1. ลูกค้าหรือผู้ใช้งานเข้าชมหน้าร้านพาร์ทเนอร์ผ่านเส้นทาง `/store/:id`
2. ระบบจะโหลดข้อมูลร้านค้าจาก `ActivePartners/:id` หรือ fallback จาก `users/:id/storeProfile/main`
3. ในส่วน "ช่องทางการติดต่อ" (`StoreProfileInfo.jsx`):
   - แสดงไอคอนพร้อมลิงก์ไปยัง LINE, Messenger, เว็บไซต์ร้าน, YouTube, TikTok, Shopee, Lazada
   - ลูกค้าคลิกเพื่อไปยังช่องทางติดต่อของร้านพาร์ทเนอร์รายนั้นๆ ทันที
4. ในส่วน "แกลเลอรี่ผลงาน":
   - คลิกที่รูปใดก็ได้เพื่อเปิด Pop-up เต็มจอ (`GalleryLightbox.jsx`)
   - มีปุ่ม ซ้าย-ขวา, เลื่อนรูปด้วยคีย์บอร์ด (Arrow Keys / ESC), รองรับ Swipe บนมือถือ และแถบ Thumbnail ด้านล่าง
5. พาร์ทเนอร์แก้ไขข้อมูลร้านและอัปโหลดภาพ (`StoreProfileBasicInfo.jsx`):
   - อัปโหลดได้สูงสุด 20 รูป พร้อมบีบอัดเป็น WebP บน Client ทันที
   - อัปโหลดตรงเข้าสู่ Firebase Storage (`stores/{userId}/...`) เสถียรและเร็ว ไม่ติด Quota GAS
6. ในส่วน "สินค้าแนะนำด้านล่างสุด" (`StoreRecommendedProducts.jsx`):
   - เมื่อเลื่อนจอลงมาใกล้ถึงด้านล่าง (Viewport Lazy Load) ระบบจะสุ่มสินค้า 4 รายการจาก `featuredQueryService.getRandomFeaturedProducts(4)`
   - ส่งเข้าสู่ `ProductList` ซึ่งมีระบบ `useAdInjection` แทรกโฆษณาพาร์ทเนอร์ (นามบัตร/แบนเนอร์) 1 รายการ ลงในกริดสินค้าอัตโนมัติ รวมเป็น 5 รายการ (1 แถวพอดีบนจอเดสก์ท็อป)

## 2. <domain_rules>
- **Universal Dynamic Contact Channels:** ทุกพาร์ทเนอร์ใช้จุดกลางเดียวกันใน `StoreProfileInfo.jsx`
- **URL Normalization Guard:** ต้องจัดรูปแบบลิงก์ให้อยู่ในรูป `https://...` และแปลง URL เฉพาะแพลตฟอร์ม (เช่น YouTube `@handle`, TikTok, LINE ID/`@id`, Messenger) ให้คลิกแล้วเปิดไปยังปลายทางที่ถูกต้องเสมอ ไม่ตกหล่นหรือเกิด relative URL 404
- **Calm UI Invariant & Pure Assets:** ใช้ภาพไอคอนโปร่งใส (RGBA PNG) ขนาดมาตรฐาน `400x400` เก็บไว้ที่ `dh-frontend/public/images/`
- **Responsive Architecture (Mobile First):** โครงสร้างหน้าร้านใช้ `max-w-4xl lg:max-w-6xl xl:max-w-7xl` โดยมือถือยังคงขนาดและเลย์เอาต์เดิม 100% ไม่เปลี่ยนแปลง ส่วนบน PC ขยายออกด้านข้างสมดุลกับ Header ทันที และแกลเลอรี่ผลงานขยายเป็น 4 คอลัมน์บนจอใหญ่ (`xl:grid-cols-4`)
- **Client-Side Image Compression:** ใช้ `imageCompressor.js` แปลงภาพก่อนอัปโหลดเป็น WebP คุณภาพ 80% ไม่เกิน 1440px ลดขนาดไฟล์ลง ~95% (เหลือ ~100-200KB)
- **Gallery Quota:** รองรับสูงสุด 20 ภาพ (`MAX_GALLERY_IMAGES = 20`) พร้อม Multi-file upload
- **Cloud Storage Standard:** ใช้ Firebase Storage เก็บรูปภาพพาร์ทเนอร์ทั้งหมด แทน Google Drive GAS
- **Low-Quota Recommended Products:** ส่วนสินค้าแนะนำด้านล่างสุด ใช้ Viewport Lazy Loading (`useInView`) เมื่อเลื่อนจอมาถึงเท่านั้น เพื่อป้องกันการอ่านโควต้าโดยไม่จำเป็น

## 3. <core_schema>
- **Entry File:** `StoreProfilePage.jsx`
- **Contact Component:** `components/StoreProfileInfo.jsx`
- **Gallery Lightbox:** `components/GalleryLightbox.jsx` (Pop-up แสดงภาพเต็มจอ, Prev/Next, Thumbnails, ESC & Swipe support)
- **Recommended Products Block:** `components/StoreRecommendedProducts.jsx` (Random 4 items via `featuredQueryService`, unified `ProductList` with auto `useAdInjection` = 5 cards total in 1 row)
- **Image Compressor:** `utils/imageCompressor.js`
- **Storage Service:** `firebase/storageService.js` (ฟังก์ชัน `uploadStoreImage`, `deleteStoreImage` รองรับ fallback)
- **Edit Component & Hook:** `StoreProfileBasicInfo.jsx`, `hooks/useStoreProfile.js`
- **Migration Script:** `tests/verifications/migrate_drive_images_to_firebase.mjs`
- **Mapping Archive:** `tests/verifications/drive_to_firebase_mapping.json` (สำรองคู่ URL 181 ภาพ เพื่อตรวจสอบและย้อนกลับได้)
- **Asset Files:**
  - `public/images/line_logo.png`
  - `public/images/messenger_logo.png`
  - `public/images/website_logo.png`
  - `public/images/youtube_logo.png`
  - `public/images/tiktok_logo.png`
  - `public/images/shopee_logo.png`
  - `public/images/lazada_logo.png`
- **Fields Schema:**
  - `lineUrl` (string): ลิงก์ LINE หรือ LINE ID
  - `messengerUrl` (string): ลิงก์ Messenger หรือ Page handle
  - `websiteUrl` / `storeWebsite` (string): URL เว็บไซต์ร้าน
  - `youtubeUrl` (string): ลิงก์ช่อง YouTube หรือ `@handle`
  - `tiktokUrl` (string): ลิงก์ช่อง TikTok หรือ `@handle`
  - `shopeeUrl` (string): ลิงก์ร้าน Shopee
  - `lazadaUrl` (string): ลิงก์ร้าน Lazada
  - `storeImage` (string): URL ภาพประจำร้าน (Firebase Storage)
  - `galleryImages` (string[]): อาร์เรย์ของภาพผลงานร้าน สูงสุด 20 ภาพ (Firebase Storage)

## 4. <third_party>
- **Firebase Storage:** เก็บไฟล์ภาพ WebP ภายใต้บักเก็ต `dh-notebook-69f3b.firebasestorage.app/stores/`
- **Social Platforms:** LINE (`line.me`), Facebook Messenger (`m.me`), YouTube (`youtube.com`), TikTok (`tiktok.com`)
- **Map:** Google Maps

## 5. <pitfalls_and_solutions>
- **Problem:** พาร์ทเนอร์บางร้านกรอก `@channel_name` หรือ `username` หรือไม่มี `https://` ทำให้ระบบเดิมที่เชื่อมสตริงแบบดิบพาไปหน้า 404
- **Solution:** สร้างฟังก์ชัน Normalizer (`formatLineUrl`, `formatMessengerUrl`, `formatYoutubeUrl`, `formatTiktokUrl`, `formatExternalUrl`) แปลง input ทุกรูปแบบให้ออกมาเป็น Full URL ที่เปิดใช้งานได้ 100% สำหรับทุกพาร์ทเนอร์
- **Problem:** Firestore ปฏิเสธการอัปเดต snapshot bundle ด้วย error `Unsupported field value: undefined` เมื่ออาร์เรย์มีอ็อบเจ็กต์ที่มีคีย์ `undefined`
- **Solution:** ทำ Deep clone ผ่าน `JSON.parse(JSON.stringify(item))` ก่อนส่งเข้า Firestore `updateDoc` เพื่อกำจัดค่า `undefined` ทั้งหมดโดยอัตโนมัติ
- **Problem:** บล็อกแกลเลอรี่ผลงานเดิมใส่กรอบสี่เหลี่ยมจตุรัสแข็งๆ (`border`, `shadow`, `bg-slate-50`) ทำให้เห็นกรอบสีเทาชัดเจน และหากบังคับ `object-cover` จะตัดเนื้อหาภาพแนวนอน/แนวตั้ง
- **Solution:** ปรับให้รูปภาพแสดงผลได้เต็มภาพ 100% (ทั้งภาพแนวนอนและแนวตั้ง ไม่โดนตัดขอบ) โดยถอดกรอบ (border), ขอบเส้น, เงา, และพื้นหลังสีเทาออกทั้งหมด ให้ภาพลอยเด่นอย่างเป็นธรรมชาติบนการ์ดขาว
- **Problem:** ปุ่ม Action (โทร, MAP, แชร์) บน PC เดิมลอยอยู่ใต้ชื่อร้าน ทำให้เกิดพื้นที่ว่างด้านล่าง และขนาดปุ่มใหญ่เกินไป
- **Solution:** ปรับใช้ `md:flex-col md:justify-between md:self-stretch` ให้ปุ่มดันลงมาชิดขอบล่างของการ์ดบน PC (`md:mt-auto`) ขนานพอดีกับขอบล่างของภาพประจำร้าน พร้อมลดขนาดลง 20% (`md:h-[38px]`, `md:max-w-md`, `md:text-xs lg:text-sm`) โดยมือถือคงเดิม 100%
- **Problem:** ต้องการแสดงสินค้าแนะนำแบบสุ่มที่ด้านล่างหน้าร้านค้า พร้อมโฆษณาพาร์ทเนอร์แทรกโดยไม่กระทบโควต้า
- **Solution:** ใช้ `featuredQueryService.getRandomFeaturedProducts(8)` ร่วมกับ `<ProductList />` ที่มี `useAdInjection` ฝังในตัว และครอบด้วย `useInView` โหลดเมื่อเลื่อนจอลงมาเท่านั้น
- **Problem:** เมื่อหน้าเว็บเกิดความขัดข้องชั่วคราว (เช่น การเชื่อมต่อหลุด หรือโมดูลแคชเดิม) หน้าจอตัดเข้าหน้าแดง "ขออภัย เกิดข้อผิดพลาด" ทันที ทำให้ลูกค้าตกใจ
- **Solution:** ปรับปรุง `ErrorBoundary.jsx` ให้มีระบบ Auto-Refresh อัตโนมัติสูงสุด 3 รอบผ่าน `sessionStorage` โดยแสดงสถานะโหลดใหม่อย่างนุ่มนวล และจะแสดงหน้า Fallback สีแดงเฉพาะเมื่อรีเฟรชครบ 3 รอบแล้วยังไม่ผ่านเท่านั้น
