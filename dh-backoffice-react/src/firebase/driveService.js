// ตัวกลางเชื่อมต่อระบบจัดการสินทรัพย์ดิจิทัล (Digital Asset Pipeline)
// สื่อสารกับ Google Apps Script เพื่อนำไฟล์เข้า Google Drive ของบริษัท
import imageCompression from 'browser-image-compression';
import { productStorageService } from './productStorageService.js';

// 📦 URL สำหรับอัปโหลดภาพสินค้า (ดั้งเดิม - DEPRECATED)
// ปิดการส่งภาพสินค้าเข้า Google Apps Script อย่างเป็นทางการ ย้ายไปใช้ Firebase Storage ทั้งหมด
const DRIVE_BRIDGE_URL = "https://script.google.com/macros/s/AKfycbzD3KW7juo-XNtw_kmPTPi2Pp4OtNVCAIQMGHdBVeUL1QPBQXgUhv3E_wRISEkOzML7/exec";

// 🧾 URL สำหรับอัปโหลดภาพสลิป (แยกโฟลเดอร์ชัดเจน)
const DRIVE_SLIP_URL = "https://script.google.com/macros/s/AKfycbwccHnMx5LQ6zUUh8rQ8AUbs983rpA-2mTPccyF9qwWov_M94zfKwW81YcJykj8NNTj/exec";

export const driveService = {
  /**
   * ⚠️ [DEPRECATED] อัปโหลดภาพสินค้าผ่าน GAS ปิดถาวรแล้ว
   * ทำการ Redirect ไปยัง Firebase Storage (productStorageService) อัตโนมัติเพื่อความปลอดภัย
   * @param {File} file - ไฟล์ภาพ
   */
  uploadImage: async (file) => {
    console.warn("⚠️ [DriveService.uploadImage] Legacy GAS pipeline is deprecated. Routing to Firebase Storage...");
    return await productStorageService.uploadProductImage(file);
  },

  /**
   * ✨ อัปโหลดภาพสลิปโอนเงิน (แยก Folder โดยใช้ Apps Script อีกตัว)
   * @param {File} file - ไฟล์ภาพสลิป
   */
  uploadSlip: async (file) => {
    return new Promise(async (resolve, reject) => {
      try {
        const isPdf = file?.type === 'application/pdf' || file?.name?.toLowerCase().endsWith('.pdf');
        let fileToUpload = file;

        if (!isPdf && file?.type?.startsWith('image/')) {
          try {
            const options = {
              maxSizeMB: 0.5,
              maxWidthOrHeight: 1000,
              useWebWorker: true,
              initialQuality: 0.7,
              fileType: 'image/webp'
            };
            fileToUpload = await imageCompression(file, options);
          } catch (compErr) {
            console.warn("⚠️ Compression warning, using original file:", compErr);
            fileToUpload = file;
          }
        }

        const reader = new FileReader();
        reader.readAsDataURL(fileToUpload);
        
        reader.onload = async () => {
          const base64Data = reader.result.split(',')[1];
        
        try {
          console.log(`🚀 DH-Drive: กำลังส่งไฟล์ไปที่ ${DRIVE_SLIP_URL.substring(0, 40)}...`);
          
          const response = await fetch(DRIVE_SLIP_URL, {
            method: 'POST',
            body: JSON.stringify({
              base64: base64Data,
              contentType: file.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
              fileName: `${isPdf ? 'DOC_' : 'SLIP_'}${Date.now()}_${file.name.replace(/\s+/g, '_')}`
            })
          });
          
          const result = await response.json();
          if (result.status === 'success') {
            console.log("✅ DH-Drive: อัปโหลดเอกสารสำเร็จ!");
            
            const fileId = result.fileId || (result.link ? result.link.match(/id=([a-zA-Z0-9_-]+)/)?.[1] : null);
            
            if (isPdf && fileId) {
              resolve(`https://drive.google.com/file/d/${fileId}/view?usp=sharing`);
            } else if (fileId) {
              resolve(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`);
            } else if (result.url) {
              resolve(result.url);
            } else {
              resolve(result.link);
            }
          } else {
            console.error("Drive Upload Error:", result.message);
            reject(new Error(result.message));
          }
        } catch (error) {
          console.error("Fetch Drive Error:", error);
          reject(error);
        }
      };
        reader.onerror = error => reject(error);
      } catch (error) {
        console.error("Upload Error:", error);
        reject(error);
      }
    });
  },

  /**
   * 📄 อัปโหลดใบกำกับภาษี (PDF / Image) สำหรับส่งให้ลูกค้า
   */
  uploadTaxInvoice: async (file) => {
    return driveService.uploadSlip(file);
  }
};
