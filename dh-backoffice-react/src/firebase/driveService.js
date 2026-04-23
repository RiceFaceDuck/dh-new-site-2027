// ตัวกลางเชื่อมต่อระบบจัดการสินทรัพย์ดิจิทัล (Digital Asset Pipeline)
// สื่อสารกับ Google Apps Script เพื่อนำไฟล์เข้า Google Drive ของบริษัท

// 📦 URL สำหรับอัปโหลดภาพสินค้า (ดั้งเดิม)
const DRIVE_BRIDGE_URL = "https://script.google.com/macros/s/AKfycbzD3KW7juo-XNtw_kmPTPi2Pp4OtNVCAIQMGHdBVeUL1QPBQXgUhv3E_wRISEkOzML7/exec";

// 🧾 URL สำหรับอัปโหลดภาพสลิป (แยกโฟลเดอร์ชัดเจน)
const DRIVE_SLIP_URL = "https://script.google.com/macros/s/AKfycbwccHnMx5LQ6zUUh8rQ8AUbs983rpA-2mTPccyF9qwWov_M94zfKwW81YcJykj8NNTj/exec";

export const driveService = {
  /**
   * อัปโหลดภาพไปยัง Google Drive (สำหรับภาพสินค้า)
   * @param {File} file - ไฟล์ภาพ
   */
  uploadImage: async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        
        try {
          const response = await fetch(DRIVE_BRIDGE_URL, {
            method: 'POST',
            body: JSON.stringify({
              base64: base64Data,
              contentType: file.type,
              fileName: `DH_PRODUCT_${Date.now()}_${file.name.replace(/\s+/g, '_')}`
            })
          });
          
          const result = await response.json();
          if (result.status === 'success') {
            const match = result.link ? result.link.match(/id=([a-zA-Z0-9_-]+)/) : null;
            if (match && match[1]) {
              resolve(`https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`);
            } else if (result.url) {
              resolve(result.url);
            } else {
              resolve(result.link);
            }
          } else {
            console.error("Drive Upload Error:", result.message);
            reject(result.message);
          }
        } catch (error) {
          console.error("Fetch Error:", error);
          reject(error);
        }
      };
      
      reader.onerror = error => reject(error);
    });
  },

  /**
   * ✨ อัปโหลดภาพสลิปโอนเงิน (แยก Folder โดยใช้ Apps Script อีกตัว)
   * @param {File} file - ไฟล์ภาพสลิป
   */
  uploadSlip: async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        
        try {
          console.log(`🚀 DH-Drive: กำลังส่งสลิปไปที่ ${DRIVE_SLIP_URL.substring(0, 40)}...`);
          
          const response = await fetch(DRIVE_SLIP_URL, {
            method: 'POST',
            body: JSON.stringify({
              base64: base64Data,
              contentType: file.type,
              fileName: `SLIP_${Date.now()}_${file.name.replace(/\s+/g, '_')}`
            })
          });
          
          const result = await response.json();
          if (result.status === 'success') {
            console.log("✅ DH-Drive: อัปโหลดสลิปสำเร็จ!");
            
            // ดึง ID ออกมาทำ Thumbnail เพื่อความเร็วและป้องกันปัญหา Permission ของ Drive
            const fileId = result.fileId || (result.link ? result.link.match(/id=([a-zA-Z0-9_-]+)/)?.[1] : null);
            
            if (fileId) {
              resolve(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`);
            } else if (result.url) {
              resolve(result.url);
            } else {
              resolve(result.link);
            }
          } else {
            console.error("Drive Slip Upload Error:", result.message);
            reject(new Error(result.message));
          }
        } catch (error) {
          console.error("Fetch Slip Error:", error);
          reject(error);
        }
      };
      
      reader.onerror = error => reject(error);
    });
  }
};