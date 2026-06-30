# =====================================================================
# FIRESTORE QUOTA SIMULATION & ESTIMATION (1,000 Users)
# =====================================================================
# สรุปผลการประเมินการใช้งาน Reads & Writes ของทั้งระบบ (สำหรับผู้ใช้ 1,000 คน/วัน)
# 
# 1. ระบบหน้าร้าน (Storefront - 1,000 คน)
# - โหลดหน้าแรก (Category, Featured) อาศัย Caching: ~5 Reads/คน = 5,000 Reads
# - เข้าดูหมวดหมู่และสินค้า (CategoryPage/ProductDetail): ~40 Reads/คน = 40,000 Reads
# - ค้นหาสินค้า (SearchPage - Client Filtering): 100 Reads/คน (จำกัด limit 100 เพื่อกันโควต้าทะลุ) x สมมติคนใช้ 300 คน/วัน = 30,000 Reads
# - ทำรายการสั่งซื้อ/Checkout: ~2 Reads, ~4 Writes/คน = 2,000 Reads, 4,000 Writes
# *รวมหน้าร้าน: ~77,000 Reads | ~4,000 Writes*
#
# 2. ระบบค้นหาสินค้า (Product Search: Zero-Read)
# - ดึง 50 รายการแรกเพื่อแสดงรูปภาพ: 50 Reads/คน = 50,000 Reads
# - พิมพ์ค้นหาสินค้าใช้ Hybrid Cache (Google Sheets): 0 Reads/คน = 0 Reads
# - ดูประวัติ/ทำ Report: ~50 Reads, 2 Writes/คน = 50,000 Reads, 2,000 Writes
# *รวม Product Search: ~100,000 Reads | ~2,000 Writes*
#
# 3. ระบบจัดการเคลม/คืนเงิน (Refund - 5% ของผู้ใช้ = 50 รายการ)
# - ขอลูกค้า (สร้างคำร้อง): 2 Reads, 1 Write/รายการ = 100 Reads, 50 Writes
# - แอดมิน (ตรวจสอบและอนุมัติผ่าน runTransaction): 3 Reads, 4 Writes/รายการ = 150 Reads, 200 Writes
# *รวมระบบคืนเงิน: ~250 Reads | ~250 Writes*
#
# 4. ระบบหลังบ้าน (Backoffice - แอดมิน 10 คน ทำงานทั้งวัน)
# - โหลดบิล/ออเดอร์รายวัน: ~150 Reads/คน = 1,500 Reads
# - ค้นหาข้อมูลลูกค้า/สินค้า: ~200 Reads/คน = 2,000 Reads
# - การจัดการสิทธิ์ Cascade & Validation (Promotions/Users): การย้าย Validation มาไว้ตอนที่สร้าง/แก้ไขโดย Admin ช่วยประหยัด Reads ของ Storefront (0 cost ฝั่งลูกค้า) โดย Admin ใช้งานส่วนนี้น้อยมาก เพิ่มเฉลี่ย ~5 Reads ต่อวัน
# - อัปเดตข้อมูล / Soft Delete: ~160 Writes/คน = 1,600 Writes
# - *ข้อควรระวัง (Todo Quota Leak):* แอดมิน 10 คนสลับหน้าจอ 10 ครั้ง/วัน โหลด Manager Tasks ทิ้ง (100 รายการ) = 10,000 Reads
# *รวมระบบหลังบ้าน: ~13,505 Reads | ~1,600 Writes*
#
# 5. ระบบปลีกย่อยอื่นๆ (Redirects, Settings)
# - อัปเดต/ค้นหา URL และตั้งค่า: ~200 Reads, 10 Writes
# *รวมระบบปลีกย่อย: ~200 Reads | ~10 Writes*
#
# 6. ระบบ PDPA & Privacy Management (อัปเดตใหม่)
# - ตรวจสอบ Consent (เก็บใน LocalStorage): 0 Reads
# - การยืนยัน PDPA สำหรับตั้งร้านค้า (สมมติ 5% = 50 คน): 50 Writes
# - การขอลบบัญชีถาวร (Right to be Forgotten - สมมติ 1% = 10 คน): 10 Reads (เช็คยอดเงิน), 20 Writes (ลบเอกสาร + เก็บ Log)
# *รวมระบบ PDPA: ~10 Reads | ~70 Writes*
#
# =====================================================================
# 📊 สรุปภาพรวมและค่าใช้จ่ายรายวัน (TOTAL ESTIMATION)
# =====================================================================
# =====================================================================
# - TOTAL READS: ~190,965 Reads / วัน
# - TOTAL WRITES: ~7,930 Writes / วัน
# - โควต้าฟรีของ Firebase: 50,000 Reads | 20,000 Writes
# - ส่วนเกิน (Over Quota): ~140,955 Reads
# 
# 💰 ค่าใช้จ่าย (COST): ~$0.05 ต่อวัน (หรือประมาณ 1.7 บาท/วัน)
# 🎯 สรุป (CONCLUSION): การพัฒนาระบบ SearchPage แบบ Client-side Filter แม้จะถูกจำกัดไว้ที่ 100 รายการต่อคน 
# แต่หากมีคนใช้เยอะ (300 คน) ก็จะเพิ่ม Reads ขึ้นอีก 30,000 Reads/วัน ทำให้ยอดรวมทะลุ Free Tier ไปที่เกือบ 2 แสน Reads 
# อย่างไรก็ตาม ค่าใช้จ่ายยังถูกมาก (ประมาณ 1.7 บาทต่อวัน) หากต้องการลด Reads ส่วนนี้ในอนาคต แนะนำให้ใช้ Algolia หรือ Typesense
# หรือสร้าง JSON Export บน Storage แล้วให้หน้าบ้านดาวน์โหลด JSON แทนการดึง Database โดยตรงครับ
