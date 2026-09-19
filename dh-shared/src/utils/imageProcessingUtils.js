/**
 * Image Processing Utilities for DH Notebook Monorepo
 * Provides standard image compression, base64 encoding, Google Drive URL transformation,
 * and image error handling fallbacks.
 */

export const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
  if (!file) return reject(new Error('ไม่พบไฟล์สำหรับการแปลงข้อมูล Base64'));
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    const result = reader.result;
    if (typeof result === 'string' && result.includes(',')) {
      resolve(result.split(',')[1]);
    } else {
      resolve(result);
    }
  };
  reader.onerror = (err) => reject(err);
});

export const getRenderableImageUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (trimmed.includes('drive.google.com') || trimmed.includes('googleusercontent.com')) {
    const match = trimmed.match(/id=([a-zA-Z0-9_-]{15,})/) ||
                  trimmed.match(/\/d\/([a-zA-Z0-9_-]{15,})/) ||
                  trimmed.match(/([a-zA-Z0-9_-]{25,})/);
    if (match) {
      return 'https://lh3.googleusercontent.com/d/' + (match[1] || match[0]) + '=w1000';
    }
  }
  return trimmed;
};

const extractDriveId = (url) => {
  if (!url) return null;
  const str = String(url);
  if (!str.includes('drive.google') && !str.includes('googleusercontent')) return null;
  const match = str.match(/id=([a-zA-Z0-9_-]{15,})/) || str.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
  return match ? match[1] : null;
};

export const handleImageError = (event, originalUrl, fallbackUrl = '') => {
  const target = event?.target;
  if (!target) return;
  const driveId = extractDriveId(originalUrl || target.src);
  const errorStep = Number(target.dataset.errorStep || 0);

  if (driveId && errorStep === 0) {
    target.dataset.errorStep = '1';
    target.src = 'https://drive.google.com/thumbnail?id=' + driveId + '&sz=w1000';
    return;
  }
  if (driveId && errorStep === 1) {
    target.dataset.errorStep = '2';
    target.src = 'https://drive.google.com/uc?export=view&id=' + driveId;
    return;
  }
  target.onerror = null;
  if (fallbackUrl) {
    target.src = fallbackUrl;
  } else {
    target.style.display = 'none';
  }
};

export const compressImageWithCanvas = (file, options = {}) => new Promise((resolve) => {
  if (!file || !file.type || !file.type.startsWith('image/')) return resolve(file);

  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.75,
    fileType = 'image/webp'
  } = options;

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (e) => {
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      let targetType = fileType;
      try {
        if (fileType === 'image/webp' && canvas.toDataURL('image/webp').indexOf('data:image/webp') !== 0) {
          targetType = 'image/jpeg';
        }
      } catch (err) {
        targetType = 'image/jpeg';
      }

      canvas.toBlob((blob) => {
        if (!blob) return resolve(file);
        const ext = targetType === 'image/webp' ? '.webp' : '.jpg';
        const baseName = (file.name || 'image.jpg').replace(/\.[^/.]+$/, '');
        const newFile = new File([blob], baseName + ext, {
          type: targetType,
          lastModified: Date.now()
        });
        resolve(newFile);
      }, targetType, quality);
    };
    img.onerror = () => resolve(file);
  };
  reader.onerror = () => resolve(file);
});

export default {
  readFileAsBase64,
  getRenderableImageUrl,
  handleImageError,
  compressImageWithCanvas
};
