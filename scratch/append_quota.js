const fs = require('fs');
const content = `
### การอัปเกรด Customer Detail Panel (Backoffice)
- **Reads เพิ่มเติม:** 0 (ศูนย์) 
  ข้อมูลโซเชียลมีเดีย (Social Links) และข้อมูลที่อยู่ (Address) ถูกดึงมาพร้อมกับ Document หลักของ Customer ตั้งแต่จังหวะโหลดรายชื่อแล้ว (1 read / document)
- **สรุป:** การปรับปรุง UI นี้นำข้อมูลที่มีอยู่แล้วบน Frontend มาจัดระเบียบใหม่ในฝั่ง Backoffice ให้ดูง่ายและเป็นหมวดหมู่มากขึ้น จึง **ไม่มีผลกระทบต่อโควต้า** ใดๆ ไม่ว่าจะมีผู้ใช้งาน 1,000 คนก็ตาม
`;
fs.appendFileSync('c:\\\\DH Notebook\\\\Management System\\\\FIRESTORE_QUOTA_ESTIMATION.md', content);
console.log('Appended estimation to FIRESTORE_QUOTA_ESTIMATION.md');
