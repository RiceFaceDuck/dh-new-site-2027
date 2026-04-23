// ข้อมูลสินค้าจำลอง (Mock Data) สำหรับทดสอบ UI ก่อนต่อ Firebase จริง
// ต้องใช้คำสั่ง export const products เพื่อให้ไฟล์อื่นสามารถ import { products } ไปใช้ได้

export const products = [
  {
    id: "PROD-001",
    name: "สมุดโน้ต DH Notebook ขนาด A5 ลายคลาสสิก",
    price: 120,
    stock: 50, // สถานะ: มีสินค้า
    imageUrl: "", // ปล่อยว่างเพื่อดู Fallback ไอคอนกระเป๋า
  },
  {
    id: "PROD-002",
    name: "ปากกาเจล DH รุ่น Premium (หมึกสีน้ำเงิน)",
    price: 45,
    stock: 4, // สถานะ: เหลือน้อย (<= 5)
    imageUrl: "",
  },
  {
    id: "PROD-003",
    name: "แฟ้มใส่เอกสาร DH Folder F4 สีเขียว",
    price: 85,
    stock: 0, // สถานะ: หมด
    imageUrl: "",
  },
  {
    id: "PROD-004",
    name: "กระดาษถ่ายเอกสาร DH A4 80 แกรม (500 แผ่น)",
    price: 155,
    stock: 200, // สถานะ: มีสินค้า
    imageUrl: "",
  },
  {
    id: "PROD-005",
    name: "เทปลบคำผิด DH Correction Tape ยาว 8 เมตร",
    price: 35,
    stock: 2, // สถานะ: เหลือน้อย
    imageUrl: "",
  }
];

// ข้อมูลจำลองอื่นๆ สำหรับใช้งานในอนาคต
export const categories = [
  { id: "CAT-01", name: "สมุดและกระดาษ" },
  { id: "CAT-02", name: "อุปกรณ์การเขียน" },
  { id: "CAT-03", name: "แฟ้มและอุปกรณ์จัดเก็บ" }
];