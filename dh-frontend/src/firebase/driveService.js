/**
 * Service สำหรับอัปโหลดรูปภาพไปยัง Google Drive ผ่าน Google Apps Script (Web App)
 * อ้างอิงจากรหัสการทำให้ใช้งานได้ในเอกสาร Firestore Project settings
 */

// 📦 URL สำหรับอัปโหลดภาพสินค้า (อ้างอิงจาก source: 386)
const DRIVE_PRODUCT_URL = "https://script.google.com/macros/s/AKfycbzD3KW7juo-XNtw_kmPTPi2Pp4OtNVCAIQMGHdBVeUL1QPBQXgUhv3E_wRISEkOzML7/exec";

// 🧾 URL สำหรับอัปโหลดภาพสลิป (อ้างอิงจาก source: 388)
const DRIVE_SLIP_URL = "https://script.google.com/macros/s/AKfycbwccHnMx5LQ6zUUh8rQ8AUbs983rpA-2mTPccyF9qwWov_M94zfKwW81YcJykj8NNTj/exec";

// 📢 URL สำหรับอัปโหลดภาพโฆษณา (Ads & Banners)
const DRIVE_AD_URL = "https://script.google.com/macros/s/AKfycbxz279aWlFHgMtvT_barDasX9-_VVNtZaMWzhesuiTBK0Vdd35xy2FGay3YSsZ30-hy7Q/exec";

export const driveService = {
  /**
   * 📸 1. อัปโหลดสลิปโอนเงิน (Slip Image)
   */
  uploadSlipImage: async (file) => {
    if (!file) throw new Error("กรุณาเลือกไฟล์สลิปโอนเงิน");

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          
          const payload = {
            base64: base64Data,
            contentType: file.type,
            fileName: `SLIP_FRONTEND_${Date.now()}_${file.name.replace(/\s+/g, '_')}`
          };

          const response = await fetch(DRIVE_SLIP_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
          });

          const result = await response.json();

          if (result.status === 'success') {
            console.log("✅ DH-Drive: อัปโหลดสลิปสำเร็จ!");
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
  },

  /**
   * 📸 3. อัปโหลดภาพโฆษณาแบบรวมศูนย์ (Unified Ad Image)
   * 🚀 อัปเกรด: รองรับการจัดระเบียบไฟล์ตาม `adType` และจำกัดขนาดไฟล์เพื่อความลื่นไหล
   */
  uploadAdImage: async (file, adType = 'GENERAL') => {
    if (!file) throw new Error("กรุณาเลือกไฟล์ภาพโฆษณา");

    // 🛡️ ป้องกันไฟล์ยักษ์ (Max 5MB) - ช่วยให้ Apps Script ไม่ Timeout และหน้าเว็บโหลดโฆษณาได้ไว
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("ขนาดไฟล์ภาพใหญ่เกินไป (จำกัด 5MB) กรุณาบีบอัดภาพเพื่อคุณภาพการแสดงผลที่ดีที่สุด");
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          
          // 🏷️ จัดระเบียบชื่อไฟล์ ให้ฝ่าย Admin ค้นหาใน Drive ได้ง่ายขึ้น
          const safeFileName = file.name.replace(/\s+/g, '_');
          const payload = {
            base64: base64Data,
            contentType: file.type,
            fileName: `AD_${adType.toUpperCase()}_${Date.now()}_${safeFileName}`
          };

          const response = await fetch(DRIVE_AD_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
          });

          const result = await response.json();

          if (result.status === 'success') {
            console.log(`✅ DH-Drive: อัปโหลดภาพโฆษณา [${adType}] สำเร็จ!`);
            const fileId = result.fileId || (result.link ? result.link.match(/id=([a-zA-Z0-9_-]+)/)?.[1] : null);
            if (fileId) {
              resolve(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`);
            } else {
              resolve(result.url || result.link);
            }
          } else {
            console.error("Drive Ad Upload Error:", result.message);
            reject(new Error(result.message || "อัปโหลดภาพโฆษณาไม่สำเร็จ"));
          }
        } catch (error) {
          console.error("Fetch Ad Upload Error:", error);
          reject(new Error("เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง หรือไฟล์ภาพอาจจะใหญ่เกินไป"));
        }
      };
      
      reader.onerror = () => reject(new Error("เกิดข้อผิดพลาดในการอ่านไฟล์ภาพของคุณ"));
    });
  },

  /**
   * 📸 4. อัปโหลดรูปภาพสินค้าของลูกค้า (User SKU)
   * 🚀 อัปเกรด: ยุบรวม Logic ไปใช้ uploadAdImage เพื่อลด Code ทับซ้อน (DRY Principle)
   */
  uploadUserSkuImage: async (file) => {
    console.log("⚠️ [DriveService] uploadUserSkuImage is deprecated. Routing to uploadAdImage...");
    // วิ่งไปใช้ Engine เดียวกัน พร้อมระบุ Type ว่าเป็น SKU
    return driveService.uploadAdImage(file, 'SKU');
  }
};