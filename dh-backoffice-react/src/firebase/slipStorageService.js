import { storage, auth, functions } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { compressImageWithCanvas, readFileAsBase64 } from 'dh-shared/src/utils/imageProcessingUtils.js';
import { parseSlipText } from 'dh-shared/src/utils/slipOcrParser.js';
import { resilientFetch, AppLogger } from 'dh-shared';

// GAS Endpoint for async Drive backup
const DRIVE_SLIP_BACKUP_URL = "https://script.google.com/macros/s/AKfycbwccHnMx5LQ6zUUh8rQ8AUbs983rpA-2mTPccyF9qwWov_M94zfKwW81YcJykj8NNTj/exec";

/**
 * 🧾 SlipStorageService: Dedicated Payment Slip Service
 * Single Responsibility Principle (SRP): Handles slip compression, Firebase Storage upload,
 * async GAS backup, and OCR verification.
 */
export const slipStorageService = {
  /**
   * Upload payment slip to Firebase Storage
   * @param {File|Blob} file 
   * @param {string} orderId 
   * @param {function} onProgress (optional progress callback)
   * @returns {Promise<string>} slipUrl
   */
  uploadSlip: async (file, orderId = 'UNASSIGNED', onProgress = null) => {
    if (!file) throw new Error("กรุณาเลือกไฟล์สลิปโอนเงิน");

    try {
      if (typeof onProgress === 'function') onProgress(15, 'กำลังบีบอัดรูปภาพสลิป...');

      // 1. บีบอัดภาพด้วย Canvas (1200px Max, Quality 0.85 เพื่อความคมชัดของตัวเลขและตัวอักษร)
      const compressedFile = await compressImageWithCanvas(file, {
        maxWidth: 1200,
        maxHeight: 1600,
        quality: 0.85,
        fileType: 'image/webp'
      });

      if (typeof onProgress === 'function') onProgress(45, 'กำลังอัปโหลดเข้า Firebase Storage...');

      // 2. สร้าง Path โฟลเดอร์: slips/{orderId}/{timestamp}_{rand}.webp
      const timestamp = Date.now();
      const rand = Math.floor(Math.random() * 10000);
      const safeOrderId = String(orderId || 'UNASSIGNED').replace(/[\/\\#\?]/g, '_');
      const storagePath = `slips/${safeOrderId}/${timestamp}_${rand}.webp`;
      const storageRef = ref(storage, storagePath);

      const metadata = {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000, immutable',
        customMetadata: {
          uploadedBy: auth.currentUser?.uid || 'anonymous',
          orderId: safeOrderId,
          uploadedAt: new Date().toISOString()
        }
      };

      // 3. อัปโหลดขึ้น Firebase Storage
      const snapshot = await uploadBytes(storageRef, compressedFile, metadata);
      const slipUrl = await getDownloadURL(snapshot.ref);

      if (typeof onProgress === 'function') onProgress(85, 'สำรองข้อมูลสลิปเข้า Google Drive...');

      // 4. ทำ Asynchronous Backup ไปยัง Google Drive / GAS ในพื้นหลัง (ไม่บล็อกหน้าจอผู้ใช้)
      slipStorageService.asyncBackupToGas(file, safeOrderId, slipUrl).catch(err => {
        AppLogger.warn('slipStorageService', 'GAS async backup deferred', err);
      });

      if (typeof onProgress === 'function') onProgress(100, 'อัปโหลดสำเร็จ!');
      return slipUrl;
    } catch (primaryError) {
      AppLogger.error('slipStorageService', 'Firebase Storage Slip Upload failed', primaryError);
      throw primaryError;
    }
  },

  /**
   * 🖼️ Preprocess slip image into high-contrast black & white for Tesseract OCR
   * @param {HTMLImageElement} img 
   * @param {object} cropBox { x, y, width, height }
   * @returns {string} dataUrl
   */
  preprocessCanvas: (img, cropBox = null) => {
    const canvas = document.createElement('canvas');
    const sx = cropBox ? cropBox.x * img.width : 0;
    const sy = cropBox ? cropBox.y * img.height : 0;
    const sw = cropBox ? cropBox.width * img.width : img.width;
    const sh = cropBox ? cropBox.height * img.height : img.height;

    // Scale up 1.5x for sharper character recognition
    canvas.width = Math.floor(sw * 1.5);
    canvas.height = Math.floor(sh * 1.5);

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    // Binarization: Boost contrast to isolate text from background graphics/clothes
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      // Grayscale luminance
      const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      // High-contrast adaptive cutoff (dark text -> 0, bright/color background -> 255)
      const val = gray < 130 ? 0 : 255;
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  },

  /**
   * 🤖 High-Accuracy In-Browser OCR (Tesseract.js with Multi-Pass Regional Scanning)
   * Reads Thai + English characters directly from slip image
   * @param {File|Blob} file
   * @returns {Promise<object|null>}
   */
  runClientTesseractOcr: async (file) => {
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('tha+eng');

      // Load image into DOM for high-precision Canvas operations
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        const reader = new FileReader();
        reader.onload = (e) => {
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Pass 1: Full Slip Scan (High Contrast)
      const fullProcessedUrl = slipStorageService.preprocessCanvas(img);
      const fullRet = await worker.recognize(fullProcessedUrl);
      let combinedText = (fullRet?.data?.text || '') + '\n';

      // Pass 2: Focused Upper Crop specifically for Sender Name (Top 10% to 38% height)
      const senderCropUrl = slipStorageService.preprocessCanvas(img, {
        x: 0.15,
        y: 0.12,
        width: 0.70,
        height: 0.26
      });
      const senderRet = await worker.recognize(senderCropUrl);
      if (senderRet?.data?.text) {
        combinedText += '\n[SENDER_SECTION]\n' + senderRet.data.text + '\n';
      }

      await worker.terminate();

      if (combinedText.trim()) {
        const parsed = parseSlipText(combinedText);
        return parsed;
      }
      return null;
    } catch (err) {
      console.warn("Tesseract OCR multi-pass warning:", err);
      return null;
    }
  },

  /**
   * Verify slip via Client Tesseract OCR + Cloud Functions Vision OCR
   * @param {string} slipUrl 
   * @param {string} orderId 
   * @param {number} expectedAmount 
   * @param {File|Blob} [file] (optional original file for instant client-side OCR)
   * @returns {Promise<object>}
   */
  verifySlipOcr: async (slipUrl, orderId = 'UNASSIGNED', expectedAmount = 0, file = null) => {
    // 1. รัน In-Browser AI OCR (Tesseract.js) เพื่อดึงข้อความจริง 100%
    if (file) {
      try {
        const ocrData = await slipStorageService.runClientTesseractOcr(file);
        if (ocrData && (ocrData.transactionRef || ocrData.transferDateTime)) {
          return {
            success: true,
            ocrData,
            isDuplicate: false,
            source: 'CLIENT_TESSERACT_OCR'
          };
        }
      } catch (ocrErr) {
        console.warn("Client Tesseract error:", ocrErr);
      }
    }

    // 2. หากไม่สำเร็จ ให้เรียก Cloud Function Vision OCR
    try {
      if (!functions) throw new Error("Firebase Functions not initialized");
      let res;
      try {
        const verifyFn = httpsCallable(functions, 'slips-verifySlipOcr');
        res = await verifyFn({ slipUrl, orderId, expectedAmount });
      } catch (callErr) {
        const fallbackFn = httpsCallable(functions, 'verifySlipOcr');
        res = await fallbackFn({ slipUrl, orderId, expectedAmount });
      }
      if (res.data?.success && res.data?.ocrData) {
        return res.data;
      }
    } catch (error) {
      AppLogger.warn('slipStorageService', 'Cloud Functions verifySlipOcr error, using fallback', error);
    }

    // 3. Fallback: หากเชื่อมต่อล้มเหลว ให้บังคับเป็นสถานะไม่ผ่าน (success: false) เพื่อให้พนักงานตรวจสอบด้วยตนเอง
    return {
      success: false,
      message: 'ไม่สามารถตรวจสอบสลิปอัตโนมัติได้เนื่องจากปัญหาการเชื่อมต่อ กรุณาตรวจสอบด้วยตนเอง',
      ocrData: {
        bankAccount: 'BAY',
        transactionRef: '',
        transferDateTime: '',
        transferNote: 'รอพนักงานตรวจสอบสลิป',
        amount: expectedAmount || 0
      },
      isDuplicate: false,
      requiresManualVerification: true,
      source: 'FALLBACK_UNVERIFIED'
    };
  },

  /**
   * Async Dual-Write backup to Google Apps Script / Google Drive
   * @param {File|Blob} file 
   * @param {string} orderId 
   * @param {string} storageUrl 
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

      AppLogger.info('slipStorageService', `GAS backup succeeded for order ${orderId}`);
    } catch (err) {
      // Background failure does not break the main transaction
      AppLogger.warn('slipStorageService', `GAS backup failed for order ${orderId}`, err);
    }
  }
};

