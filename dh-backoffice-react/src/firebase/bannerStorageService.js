import { storage } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImageWithCanvas } from 'dh-shared/src/utils/imageProcessingUtils.js';

/**
 * 🎨 Banner Storage Service
 * จัดการบีบอัดภาพป้ายโฆษณาด้วย WebP บน Client-side และอัปโหลดเข้า Firebase Storage
 * บันทึกไปที่ path: assets/banners/
 */
export const bannerStorageService = {
  /**
   * บีบอัดและอัปโหลดรูปภาพป้ายโฆษณา
   * @param {File} file ไฟล์ต้นฉบับขนาดใดก็ได้ (เช่น 10MB - 20MB)
   * @param {Function} [onProgress] ฟังก์ชัน callback สำหรับรายงานสถานะ
   * @returns {Promise<{ url: string, originalSize: number, compressedSize: number, savedPercent: number }>}
   */
  uploadBannerImage: async (file, onProgress = null) => {
    if (!file) throw new Error('กรุณาเลือกไฟล์ภาพ');

    const originalSize = file.size;

    // 1. บีบอัดภาพอัตโนมัติบน Browser ก่อนส่งขึ้นระบบ
    // ปรับความกว้างสูงสุด 1920px (ระดับ Full HD สำหรับจอใหญ่), คุณภาพ 0.82 เป็น WebP
    // ไฟล์จะลดลงเหลือเพียง ~100-300 KB แต่ให้ความคมชัดสูง
    if (typeof onProgress === 'function') {
      onProgress(20, 'กำลังบีบอัดรูปภาพให้เหมาะสมกับหน้าเว็บ...');
    }

    const compressedFile = await compressImageWithCanvas(file, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.82,
      fileType: 'image/webp'
    });

    const compressedSize = compressedFile.size || originalSize;
    const savedPercent = originalSize > 0 
      ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
      : 0;

    // 2. สร้าง Reference ใน Firebase Storage ใต้โฟลเดอร์ assets/banners/
    if (typeof onProgress === 'function') {
      onProgress(60, 'กำลังอัปโหลดขึ้น Firebase Storage...');
    }

    const timestamp = Date.now();
    const rand = Math.floor(Math.random() * 10000);
    const storagePath = `assets/banners/hero_${timestamp}_${rand}.webp`;
    const storageRef = ref(storage, storagePath);

    // 3. กำหนด Metadata และ Cache-Control ให้เบราว์เซอร์แคชภาพ 1 ปี
    const metadata = {
      contentType: compressedFile.type || 'image/webp',
      cacheControl: 'public, max-age=31536000'
    };

    const snapshot = await uploadBytes(storageRef, compressedFile, metadata);

    // 4. ดึง Public Download URL
    if (typeof onProgress === 'function') {
      onProgress(90, 'กำลังประมวลผลลิงก์รูปภาพ...');
    }
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      url: downloadUrl,
      originalSize,
      compressedSize,
      savedPercent
    };
  }
};
