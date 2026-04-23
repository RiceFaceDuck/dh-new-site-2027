/**
 * Service สำหรับอัปโหลดรูปภาพไปยัง Google Drive ผ่าน Google Apps Script (Web App)
 * อ้างอิงจากรหัสการทำให้ใช้งานได้ในเอกสาร Firestore Project settings
 */

// 📦 URL สำหรับอัปโหลดภาพสินค้า (อ้างอิงจาก source: 386)
const DRIVE_PRODUCT_URL = "https://script.google.com/macros/s/AKfycbzD3KW7juo-XNtw_kmPTPi2Pp4OtNVCAIQMGHdBVeUL1QPBQXgUhv3E_wRISEkOzML7/exec";

// 🧾 URL สำหรับอัปโหลดภาพสลิป (อ้างอิงจาก source: 388)
const DRIVE_SLIP_URL = "https://script.google.com/macros/s/AKfycbwccHnMx5LQ6zUUh8rQ8AUbs983rpA-2mTPccyF9qwWov_M94zfKwW81YcJykj8NNTj/exec";

export const driveService = {
  /**
   * 📸 1. อัปโหลดสลิปโอนเงิน (Slip Image)
   * ปรับ Key ให้ตรงกับความต้องการของ Apps Script (base64, contentType)
   */
  uploadSlipImage: async (file) => {
    if (!file) throw new Error("กรุณาเลือกไฟล์สลิปโอนเงิน");

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          
          // 🚀 [แก้ไข]: เปลี่ยนชื่อ Field ให้ตรงกับที่ Script ใช้งาน (source: 445-449)
          const payload = {
            base64: base64Data,
            contentType: file.type,
            fileName: `SLIP_FRONTEND_${Date.now()}_${file.name.replace(/\s+/g, '_')}`
          };

          const response = await fetch(DRIVE_SLIP_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
          });

          // หากได้รับ HTML กลับมา บรรทัดนี้จะพังและไปเข้า catch block
          const result = await response.json();

          if (result.status === 'success') {
            console.log("✅ DH-Drive: อัปโหลดสลิปสำเร็จ!");
            
            // ดึง ID มาทำ Thumbnail เพื่อความเร็ว (source: 457)
            const fileId = result.fileId || (result.link ? result.link.match(/id=([a-zA-Z0-9_-]+)/)?.[1] : null);
            
            if (fileId) {
              resolve(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`);
            } else {
              resolve(result.url || result.link);
            }
          } else {
            console.error("Drive Slip Upload Error:", result.message);
            reject(new Error(result.message || "อัปโหลดไม่สำเร็จ"));
          }
        } catch (error) {
          console.error("Fetch Slip Error:", error);
          reject(new Error("เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง (โปรดตรวจสอบการ Deploy Apps Script)"));
        }
      };
      
      reader.onerror = error => reject(error);
    });
  },

  /**
   * 📸 2. อัปโหลดรูปภาพสินค้า (Product Image)
   */
  uploadProductImage: async (file) => {
    if (!file) throw new Error("กรุณาเลือกไฟล์รูปภาพ");

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          
          const payload = {
            base64: base64Data,
            contentType: file.type,
            fileName: `PRODUCT_FRONTEND_${Date.now()}_${file.name.replace(/\s+/g, '_')}`
          };

          const response = await fetch(DRIVE_PRODUCT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
          });

          const result = await response.json();

          if (result.status === 'success') {
            const fileId = result.fileId || (result.link ? result.link.match(/id=([a-zA-Z0-9_-]+)/)?.[1] : null);
            if (fileId) {
              resolve(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`);
            } else {
              resolve(result.url || result.link);
            }
          } else {
            reject(new Error(result.message || "อัปโหลดไม่สำเร็จ"));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = error => reject(error);
    });
  }
};