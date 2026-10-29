# 📜 SSR Local Grimoire — Overview & Web Traffic Dashboard

<usage_workflow>
1. ผู้ใช้งานหรือผู้บริหารเข้าสู่หน้าเว็บระบบหลังบ้านเมนู "ภาพรวม" (`/overview`)
2. ระบบดึงเอกสารสรุปสถิติ `settings/web_traffic` จาก Firestore ผ่าน `useWebTrafficStats` (1 Read หรือแคช)
3. หน้าระบบแสดงผลการ์ดสถิติผู้เข้าชมเว็บไซต์ขนาดกะทัดรัด (Compact Card) สไตล์ Classic Retro Desktop UI
4. การ์ดแจกแจง 4 ค่า: เมื่อวาน, 7 วันล่าสุด, 30 วันล่าสุด, ทั้งหมด พร้อมแสดงวันเวลาที่อัปเดตล่าสุด
5. พื้นที่ด้านล่างเว้นว่างไว้รองรับการต่อขยายวิดเจ็ตสรุปข้อมูลสต็อก/ยอดขาย/งานที่ต้องทำในอนาคต
</usage_workflow>

<domain_rules>
- **Calm UI Invariant:** ป้ายสถานะและ Timestamp ต้องนิ่งสงบ (Static Badge) ห้ามมี `animate-pulse`, `animate-spin` หรือแสงกระพริบวิบวับ
- **UI Border Radius 0.1:** กล่อง Container, Card และ Badge กำหนดความโค้งมนที่ระดับ 0.1 (`rounded-[2px]`) เพื่อความคมชัด สบายตา สไตล์โปรแกรมสมัยเก่า
- **Single Read Efficiency:** หน้าเว็บดึงข้อมูลจาก Document สรุปใบเดียว (`system_stats/web_traffic`) ห้ามหน้าเว็บยิงเรียก GA4 API ตรงๆ เด็ดขาด เพื่อความเร็วและความปลอดภัยของกุญแจระบบ
- **Zero Secrets / Pointer-Only:** ไม่มีการฝัง Token หรือ Service Account ไว้ในซอร์สโค้ดฝั่ง Client
</domain_rules>

<core_schema>
- Entry Page: `dh-backoffice-react/src/pages/dashboard/Overview.jsx`
- UI Component: `dh-backoffice-react/src/components/overview/WebTrafficCard.jsx`
- Hook Controller: `dh-backoffice-react/src/components/overview/hooks/useWebTrafficStats.js`
- Service: `dh-backoffice-react/src/firebase/webTrafficService.js`
- Firestore Document Path: `settings/web_traffic`
  - Fields:
    - `yesterday` (number): ยอดเข้าชมเมื่อวาน
    - `last7Days` (number): ยอดเข้าชม 7 วันล่าสุด
    - `last30Days` (number): ยอดเข้าชม 30 วันล่าสุด
    - `allTime` (number): ยอดเข้าชมทั้งหมด
    - `lastUpdatedAt` (timestamp/string): วันที่และเวลาที่ประมวลผลล่าสุด
</core_schema>

<third_party>
- Google Analytics 4 (GA4 Data API): แหล่งต้นทางของตัวเลขสถิติผู้เข้าชม (ประมวลผลผ่านตัวซิงค์ภายนอก/แบตช์)
</third_party>

<pitfalls_and_solutions>
1. **ปัญหา Timestamp ใน Firestore มาได้หลายรูปแบบ (Timestamp object, ISO string, null):**
   - *วิธีแก้:* ใน `formatThaiTimestamp` ดักจับทั้ง `.toDate()`, `Date instance`, string/number และ fallback ค่า 'ยังไม่มีข้อมูล' อย่างปลอดภัย ป้องกันหน้าจอขาว
2. **ปัญหาการ์ดใหญ่เทอะทะและแสงวิบวับรบกวนสายตา:**
   - *วิธีแก้:* ออกแบบ Compact Card ความสูงจำกัด ใช้เส้นแบ่งบางๆ (divide-x) สไตล์โปรแกรมยุค 90s/วินโดวส์คลาสสิก ป้ายนิ่ง ไม่ปวดตา
</pitfalls_and_solutions>
