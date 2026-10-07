# SSR Memory: Smart Partner Starter Bundle (สถาปัตยกรรมรวบก้อนร้านช่างพาร์ทเนอร์ 1 Read)

<usage_workflow>
1. ผู้จัดการอนุมัติโฆษณานามบัตรร้านช่าง (`adData.type === 'BUSINESS_CARD'`) ใน Backoffice:
   - บันทึกลงคอลเลกชัน `ActivePartners`
   - ทำ Event-Driven Snapshot อัปเดตเข้าร้านช่างพาร์ทเนอร์ใน `catalogs/active_partners_bundle` ทันที
2. แบ็กเอนด์ Cloud Functions รัน Nightly Guard ทุกคืนเวลา 03:00 น. (`nightlyChunkGuard.js`):
   - ตรวจสอบและสร้างก้อน Curated Starter Bundle `catalogs/active_partners_bundle`
   - คัดร้านคะแนนสูงสุด (Points), ร้านเข้าชมบ่อย (Views), และร้านตัวแทนพิกัดต่างๆ
3. ลูกค้าเข้าชมหน้าแรก `dh-frontend`:
   - `fetchAllActivePartners()` โหลดก้อน `catalogs/active_partners_bundle` ใน 1 Read เท่านั้น
   - เก็บลงใน LocalStorage (TTL 15 นาที) เพื่อให้การเปิดหน้าถัดไปกิน 0 Reads
   - คอมโพเนนต์ `TopPartnerBanner`, `useNearbyPartners`, และ `useNearestPartner` ใช้ข้อมูลจากก้อนนี้ทันที ไม่มีการยิง query สดทีละร้าน
</usage_workflow>

<domain_rules>
- **Zero Raw Query for Initial Partners:** ห้ามยิง `query(ActivePartners, limit 500)` สดในหน้าแรกเด็ดขาด เพื่อป้องกันโควต้าระเบิดเมื่อขยายเป็น 1,000-2,000 ร้านค้า
- **Curated Starter Invariant:** ก้อน Starter Bundle ต้องบรรจุร้านคะแนนสูง, ร้านยอดนิยม, และร้านตัวแทนครอบคลุม หรือทุกร้านหากมีจำนวน <= 100 ร้าน
- **3-Tier Protection:** Tier 1 (LocalStorage 0 Read) -> Tier 2 (Starter Bundle 1 Read) -> Tier 3 (Fallback query)
- **4-Zone Display Rules (Business Invariant):**
  1. **หน้าแรก (Home):** ร้านใกล้เคียง 100% ตามระยะทางจริง (กม. น้อยไปมาก)
  2. **หน้ารวมช่าง (Providers):** เรียงตามระยะทางจริง 9 ร้าน + แทรกร้านยอดนิยม 1 ร้านในทุก 10 ร้าน (อัตราส่วน 9:1 ร้านใกล้เคียงมีค่ากว่า)
  3. **หน้าสินค้า ใต้ปุ่มใส่ตะกร้า (`PartnerSupportBox`):** ร้านใกล้เคียง 100% (Distance-First)
  4. **หน้าสินค้า โซนสินค้าใกล้เคียง (`RelatedProducts`):** ร้านยอดนิยม (Top Popular / Rated Partner)
</domain_rules>

<core_schema>
- Entry Document: `catalogs/active_partners_bundle`
- Payload Schema:
  ```json
  {
    "chunkId": "active_partners_bundle",
    "type": "ACTIVE_PARTNERS_BUNDLE",
    "totalActivePartners": 6,
    "bundledCount": 6,
    "generatedAt": "serverTimestamp",
    "items": [
      {
        "id": "partner_uid",
        "partnerId": "partner_uid",
        "storeName": "ชื่อร้านช่าง",
        "partnerName": "ชื่อร้านช่าง",
        "services": "งานซ่อม เมนบอร์ด",
        "phone": "0812345678",
        "messengerUrl": "",
        "lineUrl": "",
        "googleMapLink": "https://maps...",
        "latitude": 13.7563,
        "longitude": 100.5018,
        "storeImage": "https://...",
        "imageUrl": "https://...",
        "address": "กทม.",
        "landmarks": "ใกล้สถานีรถไฟฟ้า",
        "openHours": "08:30 - 18:00",
        "points": 150,
        "viewsCount": 12,
        "isVerified": true,
        "isActive": true
      }
    ]
  }
  ```
</core_schema>

<third_party>
- **Google Maps:** ลิงก์พิกัดร้านค้า `googleMapLink` / `googleMapsUrl`
- **Native Geolocation API:** ดึงพิกัดผู้ใช้งานเพื่อคำนวณระยะทางเทียบกับพิกัดใน Starter Bundle
</third_party>

<pitfalls_and_solutions>
- **ปัญหาเก่า:** เมื่อร้านช่างพาร์ทเนอร์เพิ่มขึ้นถึง 1,000 - 2,000 ร้าน ทุกครั้งที่มีคนเปิดหน้าเว็บ Client จะ query 500 ร้านสดๆ ทำให้กินวันละแสน Reads โควต้าระเบิด
- **วิธีแก้:** รวบเป็น `catalogs/active_partners_bundle` ก้อนเดียว 1 Read ครบทุกร้านที่จำเป็น พร้อมแคช LocalStorage 15 นาที ลดโควต้าลง 99%
- **สถานะ:** ส่งมอบสมบูรณ์ (Production-Ready)
</pitfalls_and_solutions>
