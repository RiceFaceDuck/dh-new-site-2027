# SSR Memory: Storefront Quota Shield & Hydration Architecture

## 1. <usage_workflow>
1. ลูกค้าเข้าชมหน้าแรก (Home/Landing): UI Shell แสดงผลทันที (<50ms)
2. Hero Config ถูกอ่านจาก LocalStorage Shield (TTL 1 ชั่วโมง) ถ้ามีแคชเสีย 0 Read
3. สินค้าชุดแรก (Slice 1) โหลดขึ้นหน้าจอทันที ส่วน Slice 2–7 แอบทยอยโหลดเบื้องหลังด้วย `requestIdleCallback`
4. โฆษณาและแบนเนอร์การตลาด (`marketingService`, `useAdInjection`) ถูกป้องกันด้วย `SessionStorage Shield` (TTL 30 นาที) + `Single-Flight Concurrency Control` เมื่อเปิดแท็บใหม่หรือรีเฟรชจะไม่ยิง Firestore ซ้ำซ้อน (0 Read)
5. สถิติการเข้าชมและยอดวิว (`webTrafficClientService`, `useStoreStats`, GA4) บัฟเฟอร์ในแรม 2 นาที / Dwell time 1 วินาที ไม่ยิง Firestore ตรงๆ

## 2. <domain_rules>
- **Zero Real-Time Snapshot on Guest Surfaces:** ห้ามใช้ `onSnapshot` กับคอนฟิกคงที่ในหน้าจอที่ Guest เข้าถึง ให้ใช้ `getDoc` + Storage Cache เสมอ
- **Single-Flight Concurrency Guarantee:** คำขอข้อมูลประเภทเดียวกันในมิลลิวินาทีเดียวกัน ต้องแชร์ Promise เดียวกัน ห้ามยิง Network ซ้ำซ้อน
- **Absolute Deployment Ban:** ห้าม deploy สู่ production หรือ cloud functions โดยไม่ได้รับคำสั่งจากผู้ใช้โดยตรง

## 3. <core_schema>
- `settings/web_traffic`: สถิติผู้เข้าชมเว็บไซต์ All-Time (SessionStorage TTL 1 ชั่วโมง)
- `settings/hero_config`: แบนเนอร์หน้าแรก (LocalStorage TTL 1 ชั่วโมง)
- `settings/marketing`: ค่า Display Ratio ของโฆษณา (SessionStorage TTL 30 นาที)
- `partner_ads`: เอกสารโฆษณาพาร์ทเนอร์ (SessionStorage TTL 30 นาที, Key: `dh_ads_cache_${adType}`)

## 4. <third_party>
- **Google Analytics 4 (GA4):** รับส่ง Telemetry E-commerce (`view_item`, `add_to_cart`) ฟรี ไม่คิดโควต้า Firestore
- **Navigator Beacon API (`sendBeacon`):** ส่งข้อมูล Telemetry โฆษณาไปยัง Cloud Function แบบ Background Keepalive

## 5. <pitfalls_and_solutions>
- **ปัญหา:** Memory Cache ชั่วคราวหายเมื่อผู้ใช้กด Refresh หรือเปิด New Tab ทำให้ยิง Firestore 90 Reads
  - **วิธีแก้:** เสริม `SessionStorage Shield` (30 นาที) ซ้อนหลัง Memory Cache ทำให้คงสถานะ 0 Read ข้ามแท็บในเซสชันเดิม
- **ปัญหา:** `HeroSection` ใช้ `onSnapshot` แช่ไว้ตลอดเวลา ทำให้เสีย Read ทุกครั้งที่เปิดหน้าแรก
  - **วิธีแก้:** เปลี่ยนเป็น `getDoc` พร้อมตรวจเช็ค LocalStorage Cache ก่อนยิงจริง
