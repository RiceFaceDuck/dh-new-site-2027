import imageCompression from 'browser-image-compression';
import { storage } from './config.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { compressImageWithCanvas } from 'dh-shared/src/utils/imageProcessingUtils.js';

/**
 * 📦 Product Storage Service
 * จัดการบีบอัดภาพสินค้าเป็น WebP บน Client-side และอัปโหลดเข้า Firebase Storage
 * บันทึกไปที่ path: products/{sku}/{timestamp}_{cleanFileName}.webp
 */
export const productStorageService = {
  /**
   * บีบอัดรูปภาพสินค้าด้วย WebP คุณภาพสูงแต่ขนาดเบา (<= 300KB, <= 1200px)
   * @param {File} file - ไฟล์ภาพต้นฉบับ
   * @returns {Promise<File|Blob>}
   */
  compressProductImage: async (file) => {
    if (!file) throw new Error('กรุณาเลือกไฟล์ภาพสินค้า');

    try {
      const options = {
        maxSizeMB: 0.3, // จำกัดขนาดไฟล์ไม่เกิน 300 KB
        maxWidthOrHeight: 1200, // กว้าง/ยาวสูงสุด 1,200 px คมชัดเหมาะแก่การซูม
        useWebWorker: true,
        initialQuality: 0.7, // คุณภาพเริ่มต้น 70%
        fileType: 'image/webp'
      };
      return await imageCompression(file, options);
    } catch (compressionErr) {
      console.warn("browser-image-compression failed, falling back to Canvas compressor:", compressionErr);
      return await compressImageWithCanvas(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.7,
        fileType: 'image/webp'
      });
    }
  },

  /**
   * อัปโหลดภาพสินค้าขึ้น Firebase Storage
   * @param {File} file - ไฟล์ภาพ
   * @param {string} [sku='general'] - SKU สินค้าสำหรับจัดระเบียบโฟลเดอร์
   * @param {Function} [onProgress] - Callback รายงาน % ความคืบหน้า
   * @returns {Promise<string>} Download URL ของภาพบน Firebase Storage
   */
  uploadProductImage: async (file, sku = 'general', onProgress = null) => {
    if (!file) throw new Error('กรุณาระบุไฟล์ภาพ');

    if (typeof onProgress === 'function') {
      onProgress(15, 'กำลังบีบอัดรูปภาพ WebP...');
    }

    const compressed = await productStorageService.compressProductImage(file);

    if (typeof onProgress === 'function') {
      onProgress(45, 'กำลังอัปโหลดขึ้น Firebase Storage...');
    }

    const cleanSku = String(sku || 'general').trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'general';
    const timestamp = Date.now();
    const rand = Math.floor(Math.random() * 10000);
    const cleanName = (file.name || 'image')
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);

    const storagePath = `products/${cleanSku}/${timestamp}_${rand}_${cleanName}.webp`;
    const storageRef = ref(storage, storagePath);

    const metadata = {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=31536000',
      customMetadata: {
        sku: cleanSku,
        originalName: file.name || '',
        uploadedAt: new Date().toISOString()
      }
    };

    const snapshot = await uploadBytes(storageRef, compressed, metadata);

    if (typeof onProgress === 'function') {
      onProgress(90, 'กำลังเชื่อมต่อลิงก์ภาพ...');
    }

    const downloadUrl = await getDownloadURL(snapshot.ref);

    if (typeof onProgress === 'function') {
      onProgress(100, 'เสร็จสิ้น');
    }

    return downloadUrl;
  },

  /**
   * ลบรูปภาพสินค้าออกจาก Firebase Storage อย่างปลอดภัย
   * @param {string} imageUrl - URL ของภาพ
   * @returns {Promise<boolean>}
   */
  deleteProductImage: async (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== 'string') return false;

    // 🛡️ ป้องกัน: ลบเฉพาะไฟล์ที่เป็นของ Firebase Storage ในโฟลเดอร์ products เท่านั้น
    const isFirebaseStorage = imageUrl.includes('firebasestorage.googleapis.com');
    const isProductFolder = imageUrl.includes('products%2F') || imageUrl.includes('products/');
    
    if (!isFirebaseStorage || !isProductFolder) {
      // หากเป็นลิงก์ Google Drive หรือภายนอก ให้ข้ามอย่างปลอดภัย ไม่ error
      return false;
    }

    try {
      const fileRef = ref(storage, imageUrl);
      await deleteObject(fileRef);
      return true;
    } catch (err) {
      if (err?.code === 'storage/object-not-found') {
        // หากไฟล์ไม่อยู่แล้ว ถือว่าลบสำเร็จ ไม่ต้องแจ้ง error
        return true;
      }
      console.warn('⚠️ Warning: Failed to delete image from Firebase Storage:', err);
      return false;
    }
  }
};
