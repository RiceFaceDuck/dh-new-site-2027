import imageCompression from 'browser-image-compression';

/**
 * บีบอัดรูปภาพให้มีขนาดเล็กที่สุด อัตโนมัติตามกฎของระบบ (Rule 14)
 * @param {File} file ไฟล์รูปภาพต้นฉบับ
 * @param {Object} customOptions ตัวเลือกเพิ่มเติม (ถ้ามี)
 * @returns {Promise<File>} ไฟล์รูปภาพที่ถูกบีบอัดแล้ว
 */
export const compressImage = async (file, customOptions = {}) => {
  if (!file || !file.type.startsWith('image/')) {
    return file; // ถ้าไม่ใช่รูปภาพ ให้คืนค่าไฟล์เดิมกลับไป
  }

  const defaultOptions = {
    maxSizeMB: 0.5, // บีบให้เหลือไม่เกิน 500KB
    maxWidthOrHeight: 1200, // ลดขนาดกว้าง/ยาวสูงสุด
    useWebWorker: true, 
    fileType: 'image/webp', // แปลงเป็น webp ประหยัดพื้นที่ที่สุดและรองรับ Web สมัยใหม่
  };

  const options = { ...defaultOptions, ...customOptions };

  try {
    const compressedFile = await imageCompression(file, options);
    // สร้าง File object ใหม่ที่เป็น .webp
    const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    const finalFile = new File([compressedFile], newFileName, {
      type: 'image/webp',
    });
    return finalFile;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการบีบอัดภาพ:", error);
    return file; // ถ้าบีบอัดพัง ให้ใช้ไฟล์ต้นฉบับแทน
  }
};
