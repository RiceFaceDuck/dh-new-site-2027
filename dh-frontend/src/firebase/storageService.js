import { storage, auth } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImageWithCanvas, readFileAsBase64, getRenderableImageUrl } from 'dh-shared/src/utils/imageProcessingUtils.js';
import { resilientFetch, AppLogger } from 'dh-shared';
import { DRIVE_ENDPOINTS } from './drive/driveEndpoints.js';

const DRIVE_SLIP_BACKUP_URL = DRIVE_ENDPOINTS?.SLIP || "https://script.google.com/macros/s/AKfycbwQ4v2R0Z1E5U6_EXAMPLE_SLIP_BACKUP/exec";
const DRIVE_AD_FALLBACK_URL = DRIVE_ENDPOINTS?.AD;

export const storageService = {
  /**
   * อัปโหลดสลิปโอนเงินไปที่ Firebase Storage (พร้อมบีบอัดอัตโนมัติ และสำรองข้อมูลไป GAS)
   * @param {File} file ไฟล์รูปภาพ
   * @param {string} orderId รหัสคำสั่งซื้อ
   * @returns {Promise<string>} URL ของรูปภาพ
   */
  uploadSlipImage: async (file, orderId = 'FRONTEND_ORDER') => {
    if (!file) throw new Error("กรุณาเลือกไฟล์สลิปโอนเงิน");

    try {
      // 1. บีบอัดไฟล์ก่อนอัปโหลด (1200px Max, WebP 0.85 คมชัดสำหรับ OCR)
      const compressedFile = await compressImageWithCanvas(file, {
        maxWidth: 1200,
        maxHeight: 1600,
        quality: 0.85,
        fileType: 'image/webp'
      });

      // 2. สร้าง Path และสุ่มชื่อไฟล์: slips/{orderId}/{timestamp}_{rand}.webp
      const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E6);
      const safeOrderId = String(orderId || 'FRONTEND_ORDER').replace(/[\/\\#\?]/g, '_');
      const fileName = `${uniqueSuffix}.webp`;
      const storageRef = ref(storage, `slips/${safeOrderId}/${fileName}`);

      const metadata = {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000, immutable',
        customMetadata: {
          uploadedBy: auth.currentUser?.uid || 'guest_customer',
          orderId: safeOrderId,
          uploadedAt: new Date().toISOString()
        }
      };

      // 3. อัปโหลดขึ้น Firebase Storage
      const snapshot = await uploadBytes(storageRef, compressedFile, metadata);

      // 4. ขอ URL สำหรับดูรูปภาพ
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // 5. ทำ Asynchronous Backup ไปยัง Google Drive / GAS ในพื้นหลัง
      storageService.asyncBackupToGas(file, safeOrderId, downloadURL).catch(err => {
        AppLogger.warn('storageService', 'GAS async backup deferred', err);
      });

      console.log("✅ Firebase Storage: อัปโหลดสลิปสำเร็จ! [PROTECTED_URL]");
      return downloadURL;
    } catch (error) {
      console.error("Firebase Storage Upload Error:", error);
      throw new Error("อัปโหลดสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  },

  /**
   * 🏪 อัปโหลดภาพร้านค้า / ภาพโปรไฟล์ / แกลลอรี่ ไปที่ Firebase Storage (พร้อมบีบอัด WebP และ Fallback)
   * @param {File} file ไฟล์รูปภาพ
   * @param {string} userId รหัสผู้ใช้งาน (UID)
   * @param {'PROFILE'|'GALLERY'} imageType ประเภทภาพ
   * @returns {Promise<string>} URL ของรูปภาพ
   */
  uploadStoreImage: async (file, userId = 'guest', imageType = 'PROFILE') => {
    if (!file) throw new Error("กรุณาเลือกไฟล์รูปภาพ");

    let compressedFile = file;
    try {
      // 1. บีบอัดไฟล์ก่อนอัปโหลด (Max 800-1000px, WebP 0.75 ลดขนาดเหลือหลักสิบ KB)
      const isProfile = String(imageType).toUpperCase() === 'PROFILE';
      compressedFile = await compressImageWithCanvas(file, {
        maxWidth: isProfile ? 800 : 1000,
        maxHeight: isProfile ? 800 : 1000,
        quality: 0.75,
        fileType: 'image/webp'
      });

      // 2. สร้าง Path และชื่อไฟล์ (ใช้ stores/ ซึ่งมีสิทธิ์ 5MB ใน Firebase Storage rules)
      const safeUid = String(userId || auth.currentUser?.uid || 'guest_user').replace(/[\/\\#\?]/g, '_');
      const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E5);
      const fileName = `store_${String(imageType).toLowerCase()}_${uniqueSuffix}.webp`;
      const storageRef = ref(storage, `stores/${safeUid}/${fileName}`);

      const metadata = {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000, immutable',
        customMetadata: {
          uploadedBy: safeUid,
          imageType: String(imageType),
          uploadedAt: new Date().toISOString()
        }
      };

      // 3. อัปโหลดขึ้น Firebase Storage
      const snapshot = await uploadBytes(storageRef, compressedFile, metadata);

      // 4. ขอ URL สำหรับดูรูปภาพ
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log(`✅ Firebase Storage: อัปโหลดภาพร้านค้า [${imageType}] สำเร็จ! [${fileName}]`);
      return downloadURL;
    } catch (error) {
      console.warn("⚠️ Firebase Storage ติดสิทธิ์หรือยังไม่ได้ Deploy Rules กำลังสลับไปใช้ Cloud Drive Fallback...", error.message);
      try {
        const base64Data = await readFileAsBase64(compressedFile || file);
        const payload = {
          base64: base64Data,
          contentType: (compressedFile || file).type || 'image/webp',
          fileName: `STORE_${String(imageType).toUpperCase()}_${Date.now()}_${(compressedFile || file).name || 'image.webp'}`
        };

        const response = await resilientFetch(DRIVE_AD_FALLBACK_URL, {
          method: 'POST',
          body: JSON.stringify(payload)
        }, { timeoutMs: 25000, maxRetries: 2 });

        const result = await response.json();
        if (result.status === 'success') {
          const fileId = result.fileId || (result.link ? result.link.match(/id=([a-zA-Z0-9_-]+)/)?.[1] : null);
          const rawUrl = fileId ? `https://lh3.googleusercontent.com/d/${fileId}=w1000` : (result.url || result.link);
          return getRenderableImageUrl(rawUrl);
        } else {
          throw new Error(result.message || "Cloud Upload ไม่สำเร็จ");
        }
      } catch (fallbackError) {
        console.error("🔥 Image Upload Fallback Error:", fallbackError);
        throw new Error("อัปโหลดภาพร้านค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }
    }
  },

  /**
   * 📢 อัปโหลดภาพโฆษณา / แบนเนอร์ ไปที่ Firebase Storage (พร้อมบีบอัด WebP และ Fallback)
   * @param {File} file ไฟล์รูปภาพ
   * @param {string} userId รหัสผู้ใช้งาน (UID)
   * @param {string} adType รูปแบบโฆษณา (PRODUCT_LINK, BILLBOARD, etc.)
   * @returns {Promise<string>} URL ของรูปภาพ
   */
  uploadAdImage: async (file, userId = 'guest', adType = 'PRODUCT_LINK') => {
    if (!file) throw new Error("กรุณาเลือกไฟล์ภาพโฆษณา");

    let compressedFile = file;
    try {
      // 1. บีบอัดไฟล์ก่อนอัปโหลด (Max 1200px, WebP 0.75 คมชัด เหมาะกับ Banner และ Product Link)
      compressedFile = await compressImageWithCanvas(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.75,
        fileType: 'image/webp'
      });

      // 2. สร้าง Path และชื่อไฟล์ (ใช้ ads/ ซึ่งมีสิทธิ์ 5MB ใน Firebase Storage rules)
      const safeUid = String(userId || auth.currentUser?.uid || 'guest_user').replace(/[\/\\#\?]/g, '_');
      const safeAdType = String(adType || 'GENERAL').toLowerCase().replace(/[\/\\#\?]/g, '_');
      const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E5);
      const fileName = `ad_${safeAdType}_${uniqueSuffix}.webp`;
      const storageRef = ref(storage, `ads/${safeUid}/${fileName}`);

      const metadata = {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000, immutable',
        customMetadata: {
          uploadedBy: safeUid,
          adType: String(adType),
          uploadedAt: new Date().toISOString()
        }
      };

      // 3. อัปโหลดขึ้น Firebase Storage
      const snapshot = await uploadBytes(storageRef, compressedFile, metadata);

      // 4. ขอ URL สำหรับดูรูปภาพ
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log(`✅ Firebase Storage: อัปโหลดภาพโฆษณา [${adType}] สำเร็จ! [${fileName}]`);
      return downloadURL;
    } catch (error) {
      console.warn("⚠️ Firebase Storage ติดสิทธิ์หรือยังไม่ได้ Deploy Rules กำลังสลับไปใช้ Cloud Drive Fallback...", error.message);
      try {
        const base64Data = await readFileAsBase64(compressedFile || file);
        const payload = {
          base64: base64Data,
          contentType: (compressedFile || file).type || 'image/webp',
          fileName: `AD_${String(adType).toUpperCase()}_${Date.now()}_${(compressedFile || file).name || 'image.webp'}`
        };

        const response = await resilientFetch(DRIVE_AD_FALLBACK_URL, {
          method: 'POST',
          body: JSON.stringify(payload)
        }, { timeoutMs: 25000, maxRetries: 2 });

        const result = await response.json();
        if (result.status === 'success') {
          const fileId = result.fileId || (result.link ? result.link.match(/id=([a-zA-Z0-9_-]+)/)?.[1] : null);
          const rawUrl = fileId ? `https://lh3.googleusercontent.com/d/${fileId}=w1000` : (result.url || result.link);
          return getRenderableImageUrl(rawUrl);
        } else {
          throw new Error(result.message || "Cloud Upload ไม่สำเร็จ");
        }
      } catch (fallbackError) {
        console.error("🔥 Image Upload Fallback Error:", fallbackError);
        throw new Error("อัปโหลดภาพโฆษณาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }
    }
  },

  /**
   * Async Dual-Write backup to Google Apps Script / Google Drive
   */
  asyncBackupToGas: async (file, orderId, storageUrl) => {
    try {
      const base64Data = await readFileAsBase64(file);
      const payload = {
        base64: base64Data,
        contentType: file.type || 'image/jpeg',
        fileName: `SLIP_${orderId}_${Date.now()}`,
        orderId,
        firebaseUrl: storageUrl
      };

      await resilientFetch(DRIVE_SLIP_BACKUP_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      }, { timeoutMs: 15000, maxRetries: 1 });

      AppLogger.info('storageService', `GAS backup succeeded for frontend order ${orderId}`);
    } catch (err) {
      AppLogger.warn('storageService', `GAS backup failed for frontend order ${orderId}`, err);
    }
  }
};

