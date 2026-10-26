# SSR Memory: Store Profile (`ssr-memory_storeprofile.md`)

## 1. <usage_workflow>
1. ลูกค้าหรือผู้ใช้งานเข้าชมหน้าร้านพาร์ทเนอร์ผ่านเส้นทาง `/store/:id`
2. ระบบจะโหลดข้อมูลร้านค้าจาก `ActivePartners/:id` หรือ fallback จาก `users/:id/storeProfile/main`
3. ในส่วน "ช่องทางการติดต่อ" (`StoreProfileInfo.jsx`):
   - แสดงไอคอนพร้อมลิงก์ไปยัง LINE, Messenger, เว็บไซต์ร้าน, YouTube, TikTok, Shopee, Lazada
   - ลูกค้าคลิกเพื่อไปยังช่องทางติดต่อของร้านพาร์ทเนอร์รายนั้นๆ ทันที

## 2. <domain_rules>
- **Universal Dynamic Contact Channels:** ทุกพาร์ทเนอร์ใช้จุดกลางเดียวกันใน `StoreProfileInfo.jsx`
- **URL Normalization Guard:** ต้องจัดรูปแบบลิงก์ให้อยู่ในรูป `https://...` และแปลง URL เฉพาะแพลตฟอร์ม (เช่น YouTube `@handle`, TikTok, LINE ID/`@id`, Messenger) ให้คลิกแล้วเปิดไปยังปลายทางที่ถูกต้องเสมอ ไม่ตกหล่นหรือเกิด relative URL 404
- **Calm UI Invariant & Pure Assets:** ใช้ภาพไอคอนโปร่งใส (RGBA PNG) ขนาดมาตรฐาน `400x400` เก็บไว้ที่ `dh-frontend/public/images/`
- **Responsive Architecture (Mobile First):** โครงสร้างหน้าร้านใช้ `max-w-4xl lg:max-w-6xl xl:max-w-7xl` โดยมือถือยังคงขนาดและเลย์เอาต์เดิม 100% ไม่เปลี่ยนแปลง ส่วนบน PC ขยายออกด้านข้างสมดุลกับ Header ทันที และแกลเลอรี่ผลงานขยายเป็น 4 คอลัมน์บนจอใหญ่ (`xl:grid-cols-4`)
- **Client-Side Image Compression:** ใช้ `imageCompressor.js` แปลงภาพก่อนอัปโหลดเป็น WebP คุณภาพ 80% ไม่เกิน 1440px ลดขนาดไฟล์ลง ~95% (เหลือ ~100-200KB)
- **Gallery Quota:** รองรับสูงสุด 20 ภาพ (`MAX_GALLERY_IMAGES = 20`) พร้อม Multi-file upload

## 3. <core_schema>
- **Entry File:** `StoreProfilePage.jsx`
- **Contact Component:** `components/StoreProfileInfo.jsx`
- **Gallery Lightbox:** `components/GalleryLightbox.jsx` (Pop-up แสดงภาพเต็มจอ, Prev/Next, Thumbnails, ESC & Swipe support)
- **Image Compressor:** `utils/imageCompressor.js`
- **Edit Component & Hook:** `StoreProfileBasicInfo.jsx`, `hooks/useStoreProfile.js`
- **Asset Files:**
  - `public/images/line_logo.png`
  - `public/images/messenger_logo.png`
  - `public/images/website_logo.png`
  - `public/images/youtube_logo.png`
  - `public/images/tiktok_logo.png`
- **Fields Schema:**
  - `lineUrl` (string): ลิงก์ LINE หรือ LINE ID
  - `messengerUrl` (string): ลิงก์ Messenger หรือ Page handle
  - `websiteUrl` / `storeWebsite` (string): URL เว็บไซต์ร้าน
  - `youtubeUrl` (string): ลิงก์ช่อง YouTube หรือ `@handle`
  - `tiktokUrl` (string): ลิงก์ช่อง TikTok หรือ `@handle`
  - `shopeeUrl` (string): ลิงก์ร้าน Shopee
  - `lazadaUrl` (string): ลิงก์ร้าน Lazada

## 4. <third_party>
- **Social Platforms:** LINE (`line.me`), Facebook Messenger (`m.me`), YouTube (`youtube.com`), TikTok (`tiktok.com`)
- **Map:** Google Maps

## 5. <pitfalls_and_solutions>
- **Problem:** พาร์ทเนอร์บางร้านกรอก `@channel_name` หรือ `username` หรือไม่มี `https://` ทำให้ระบบเดิมที่เชื่อมสตริงแบบดิบพาไปหน้า 404
- **Solution:** สร้างฟังก์ชัน Normalizer (`formatLineUrl`, `formatMessengerUrl`, `formatYoutubeUrl`, `formatTiktokUrl`, `formatExternalUrl`) แปลง input ทุกรูปแบบให้ออกมาเป็น Full URL ที่เปิดใช้งานได้ 100% สำหรับทุกพาร์ทเนอร์
