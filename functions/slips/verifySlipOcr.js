const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const vision = require("@google-cloud/vision");
const { parseSlipText } = require("./slipOcrParser");

// Initialize Vision API client
let visionClient = null;
function getVisionClient() {
  if (!visionClient) {
    visionClient = new vision.ImageAnnotatorClient();
  }
  return visionClient;
}

/**
 * 🔍 Callable Function: verifySlipOcr
 * Runs Cloud Vision OCR on the uploaded slip image, extracts Thai banking details,
 * and guards against duplicate slip submissions.
 */
exports.verifySlipOcr = onCall({ cors: true, maxInstances: 10 }, async (request) => {
  const { slipUrl, orderId = 'UNASSIGNED', expectedAmount = 0 } = request.data || {};

  if (!slipUrl) {
    throw new HttpsError('invalid-argument', 'ไม่พบ URL ของสลิปโอนเงิน (slipUrl)');
  }

  const db = getFirestore();

  try {
    const client = getVisionClient();

    // 1. เรียกใช้งาน Cloud Vision API Text Detection
    const [result] = await client.textDetection(slipUrl);
    const detections = result.textAnnotations;
    const fullText = detections && detections.length > 0 ? detections[0].description : '';

    if (!fullText) {
      return {
        success: false,
        message: 'ไม่พบตัวหนังสือในภาพสลิป',
        ocrData: {
          bankAccount: 'BAY',
          transactionRef: '',
          transferDateTime: '',
          transferNote: '',
          amount: 0
        },
        isDuplicate: false
      };
    }

    // 2. แปลงข้อความเป็นข้อมูลสลิปโครงสร้างมาตรฐาน
    const ocrData = parseSlipText(fullText);

    // 3. ตรวจสอบการใช้สลิปซ้ำ (Duplicate Slip Detection)
    let isDuplicate = false;
    let duplicateOrderId = null;

    if (ocrData.transactionRef) {
      const slipDocRef = db.collection('slip_records').doc(ocrData.transactionRef);
      const slipSnap = await slipDocRef.get();

      if (slipSnap.exists) {
        const existingData = slipSnap.data();
        if (existingData.orderId && existingData.orderId !== orderId) {
          isDuplicate = true;
          duplicateOrderId = existingData.orderId;
        }
      } else {
        // บันทึกสลิปใหม่ลงใน slip_records
        await slipDocRef.set({
          transactionRef: ocrData.transactionRef,
          orderId: String(orderId),
          destinationAccount: ocrData.destinationAccount || '',
          destinationBank: ocrData.bankAccount || '',
          senderName: ocrData.senderName || '',
          amount: ocrData.amount || expectedAmount || 0,
          transferDateTime: ocrData.transferDateTime || '',
          storageUrl: slipUrl,
          gasBackupUrl: null,
          isVerified: true,
          verifiedBy: 'AI_OCR',
          isDuplicate: false,
          storageCleaned: false,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    }

    return {
      success: true,
      ocrData: {
        bankAccount: ocrData.bankAccount || 'BAY',
        transactionRef: ocrData.transactionRef || '',
        transferDateTime: ocrData.transferDateTime || '',
        transferNote: ocrData.transferNote || (ocrData.senderName ? `โอนโดย: ${ocrData.senderName}` : ''),
        amount: ocrData.amount || 0,
        destinationAccount: ocrData.destinationAccount || ''
      },
      isDuplicate,
      duplicateOrderId,
      warning: isDuplicate ? `⚠️ สลิปนี้ (Ref: ${ocrData.transactionRef}) เคยถูกใช้แล้วในบิล ${duplicateOrderId}` : null
    };

  } catch (error) {
    console.error('❌ Vision OCR Slip Verification Error:', error);
    // Return graceful fallback so user can still enter details manually
    return {
      success: false,
      message: error.message || 'การประมวลผล OCR ขัดข้อง',
      ocrData: {
        bankAccount: 'BAY',
        transactionRef: '',
        transferDateTime: '',
        transferNote: '',
        amount: 0
      },
      isDuplicate: false
    };
  }
});
