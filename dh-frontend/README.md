# DH Notebook - Frontend

หน้าบ้าน (Client Site) สำหรับลูกค้าของ DH Notebook มุ่งเน้นไปที่ประสบการณ์ผู้ใช้งานระดับพรีเมียม (Premium UX/UI)

## 🚀 การรันโปรเจกต์และการตั้งค่า

1. **ติดตั้ง Dependencies:**
   ```bash
   npm install
   ```

2. **การตั้งค่า Environment (สำคัญ):**
   - โปรเจกต์นี้ต้องการการตั้งค่า Environment Variables เพื่อเชื่อมต่อกับ Firebase
   - สร้างไฟล์ `.env` ที่ root ของโปรเจกต์ `dh-frontend` และใส่ค่าคอนฟิกของ Firebase:
     ```env
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
     ```

3. **รัน Local Development Server:**
   ```bash
   npm run dev
   ```

## 🔥 การเชื่อมต่อ Firebase

- ฟังก์ชันที่ใช้ดึงข้อมูลพื้นฐานหรือข้อมูลกลาง (เช่น หมวดหมู่สินค้า, กระเป๋าเงิน) จะถูกดึงมาจากโปรเจกต์ `dh-shared` เพื่อป้องกันความซ้ำซ้อน
- การเชื่อมต่อ Firebase ในฝั่ง Frontend ต้องคำนึงถึง Security Rules เป็นหลัก (ดึงได้เฉพาะข้อมูลสาธารณะหรือข้อมูลของ UID ตัวเองเท่านั้น)

## 🎨 กฎการออกแบบ UI (UI/UX Guidelines)

1. **ห้ามใช้ Design พื้นฐาน:** เลี่ยงการใช้สีธรรมดา (เช่น สีแดงเพียว, น้ำเงินเพียว) ให้ใช้สีที่มีการคำนวณ HSL หรือมีการใช้ Gradient
2. **การป้องกัน UI กระตุก:** ทุกครั้งที่มีการดึงข้อมูล ต้องมีสถานะ Loading เสมอ แนะนำให้ใช้ Skeleton Loading หรือ Inline Spinner เพื่อไม่ให้ UI ดับกระพริบ
3. **Responsive Design:** ฟีเจอร์ทุกตัวที่ทำจะต้องรองรับหน้าจอโทรศัพท์มือถือ (Mobile-first Approach) อย่างสมบูรณ์

---
*Generated as part of the Maintainability Upgrade (Phase 4)*
