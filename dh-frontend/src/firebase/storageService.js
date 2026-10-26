import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from './config';
import { driveService } from './driveService';

/**
 * Service สำหรับอัปโหลดรูปภาพร้านค้าและแกลเลอรี่ขึ้น Firebase Storage
 * มี Fallback ไปยัง DriveService หากเกิดข้อผิดพลาด
 */
export const storageService = {
  /**
   * อัปโหลดภาพร้านค้าหรือแกลเลอรี่
   * @param {File|Blob} file - ไฟล์ที่ผ่านการบีบอัดแล้ว
   * @param {string} userId - UID ของเจ้าของร้าน
   * @param {'profile'|'gallery'} folder - โฟลเดอร์ย่อย
   * @returns {Promise<string>} Download URL
   */
  uploadStoreImage: async (file, userId, folder = 'gallery') => {
    if (!file) throw new Error("ไม่พบไฟล์รูปภาพ");
    const uid = userId || auth.currentUser?.uid;
    if (!uid) throw new Error("กรุณาเข้าสู่ระบบก่อนอัปโหลดภาพ");

    try {
      const extension = file.type === 'image/webp' ? 'webp' : (file.name ? file.name.split('.').pop() : 'jpg');
      const safeName = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
      const path = `stores/${uid}/${folder}/${safeName}`;
      
      const fileRef = ref(storage, path);
      const metadata = {
        contentType: file.type || 'image/webp',
        customMetadata: {
          uploadedBy: uid,
          folder: folder,
          originalName: file.name || safeName
        }
      };

      const snapshot = await uploadBytes(fileRef, file, metadata);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      console.log(`✅ [FirebaseStorage] อัปโหลดภาพสำเร็จ: ${path}`);
      return downloadUrl;
    } catch (storageError) {
      console.warn("⚠️ [FirebaseStorage] Upload failed, falling back to DriveService:", storageError);
      // Fallback สู่ Google Drive เพื่อความต่อเนื่องในการใช้งานของผู้ใช้
      const adType = folder === 'profile' ? 'STORE_PROFILE' : 'STORE_GALLERY';
      return await driveService.uploadAdImage(file, adType);
    }
  }
};
