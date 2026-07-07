import { storage } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../utils/imageCompression';

export const storageService = {
  /**
   * อัปโหลดสลิปโอนเงินไปที่ Firebase Storage (พร้อมบีบอัดอัตโนมัติ)
   * @param {File} file ไฟล์รูปภาพ
   * @returns {Promise<string>} URL ของรูปภาพ
   */
  uploadSlipImage: async (file) => {
    if (!file) throw new Error("กรุณาเลือกไฟล์สลิปโอนเงิน");

    try {
      // 1. บีบอัดไฟล์ก่อนอัปโหลด (Rule 14)
      const compressedFile = await compressImage(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
      });

      // 2. สร้าง Path และสุ่มชื่อไฟล์เพื่อป้องกันการเขียนทับโดยบังเอิญ
      // โฟลเดอร์: slips/
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileName = `SLIP_${uniqueSuffix}_${compressedFile.name.replace(/\s+/g, '_')}`;
      const storageRef = ref(storage, `slips/${fileName}`);

      // 3. อัปโหลดขึ้น Firebase Storage
      const snapshot = await uploadBytes(storageRef, compressedFile);

      // 4. ขอ URL สำหรับดูรูปภาพ
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log("✅ Firebase Storage: อัปโหลดสลิปสำเร็จ!", downloadURL);
      return downloadURL;
    } catch (error) {
      console.error("Firebase Storage Upload Error:", error);
      throw new Error("อัปโหลดสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  }
};
