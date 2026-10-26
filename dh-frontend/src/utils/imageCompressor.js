/**
 * บีบอัดรูปภาพหน้าบ้าน (Client-Side Compression)
 * ลดขนาดไฟล์จาก 4-5MB เหลือ ~100-200KB โดยคงคุณภาพความคมชัดสูง
 * 
 * @param {File} file - ไฟล์รูปภาพต้นฉบับ
 * @param {Object} options - ตัวเลือกการบีบอัด
 * @param {number} options.maxWidth - ความกว้างสูงสุด (default: 1440px)
 * @param {number} options.maxHeight - ความสูงสูงสุด (default: 1440px)
 * @param {number} options.quality - คุณภาพการบีบอัด 0.0 - 1.0 (default: 0.8)
 * @param {string} options.mimeType - ชนิดไฟล์ผลลัพธ์ (default: 'image/webp')
 * @returns {Promise<File>} ไฟล์รูปภาพที่บีบอัดแล้ว
 */
export const compressImage = async (file, options = {}) => {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // ข้ามการบีบอัดสำหรับไฟล์ SVG หรือ GIF แอนิเมชัน
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  const {
    maxWidth = 1440,
    maxHeight = 1440,
    quality = 0.8,
    mimeType = 'image/webp'
  } = options;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // คำนวณอัตราส่วนเพื่อไม่ให้ภาพเสียสัดส่วน
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file); // fallback ถ้าเบราว์เซอร์ไม่รองรับ
        }

        // เปิดโหมด High Quality Image Smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // ทดสอบรองรับ webp หากไม่รองรับให้ fallback เป็น jpeg
        const targetType = canvas.toDataURL(mimeType).startsWith(`data:${mimeType}`)
          ? mimeType
          : 'image/jpeg';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }

            // ถ้าภาพที่บีบอัดแล้วดันใหญ่กว่าเดิม (เช่นภาพเล็กมากอยู่แล้ว) ให้ใช้ไฟล์เดิม
            if (blob.size >= file.size) {
              return resolve(file);
            }

            const extension = targetType === 'image/webp' ? '.webp' : '.jpg';
            const originalBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const newFileName = `${originalBaseName}${extension}`;

            const compressedFile = new File([blob], newFileName, {
              type: targetType,
              lastModified: Date.now()
            });

            console.log(
              `🗜️ [ImageCompressor] ${(file.size / 1024).toFixed(1)} KB ➔ ${(compressedFile.size / 1024).toFixed(1)} KB (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduced)`
            );

            resolve(compressedFile);
          },
          targetType,
          quality
        );
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
};
