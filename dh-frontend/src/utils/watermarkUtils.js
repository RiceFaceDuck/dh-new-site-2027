/**
 * Utility functions for creating watermarks and processing images
 */

import { getRenderableImageUrl } from './imageUtils';

/**
 * Fetch an image and convert it to a Blob URL.
 * Falls back to the original URL if fetch fails (e.g., due to CORS).
 */
export const fetchImageAsBlobUrl = async (imageUrl) => {
  if (!imageUrl) return null;
  const renderableUrl = getRenderableImageUrl(imageUrl);

  try {
    const response = await fetch(renderableUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'default', 
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.warn("Failed to fetch image as blob (CORS issue or network). Using fallback.", error);
    return null; // Return null so we can fallback to CSS watermarks or raw URL
  }
};

/**
 * Apply a watermark to an image using Canvas API.
 * 
 * @param {string} imageUrl URL of the original image
 * @param {string} logoUrl URL of the logo image
 * @param {string} text Text to display as watermark
 * @returns {Promise<string>} Promise that resolves to a Data URL (base64 string) of the watermarked image
 */
export const applyWatermarkToImage = (imageUrl, logoUrl = '/logo.png', text = 'www.dhnotebook.com') => {
  return new Promise((resolve, reject) => {
    const renderableUrl = getRenderableImageUrl(imageUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Required to avoid tainting the canvas
    
    img.onload = () => {
      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 1. Draw original image
      ctx.drawImage(img, 0, 0);
      
      // 2. Configure text watermark (Bottom Right Corner)
      const fontSize = Math.max(16, Math.floor(canvas.width * 0.025));
      ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
      ctx.fillStyle = 'rgba(200, 200, 200, 0.4)'; // Faint Gray
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      
      // Subtle shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      // 3. Draw text at bottom right (with some padding)
      const padding = canvas.width * 0.03;
      ctx.fillText(text, canvas.width - padding, canvas.height - padding);
      
      // Load and draw logo at the exact center (very faint)
      if (logoUrl) {
        const logoImg = new Image();
        logoImg.crossOrigin = 'Anonymous';
        logoImg.onload = () => {
          // Reset shadow for the logo
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          const logoWidth = canvas.width * 0.15; // 15% of image width
          const logoHeight = (logoWidth / logoImg.width) * logoImg.height;
          
          ctx.globalAlpha = 0.1; // Very faint logo
          
          // Draw logo exactly at center
          ctx.drawImage(
            logoImg, 
            (canvas.width - logoWidth) / 2, 
            (canvas.height - logoHeight) / 2, 
            logoWidth, 
            logoHeight
          );
          ctx.globalAlpha = 1.0;
          
          try {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            resolve(dataUrl);
          } catch (e) {
            console.error("Canvas tainted, cannot export data URL", e);
            reject(e);
          }
        };
        logoImg.onerror = () => {
          // If logo fails, just resolve with text watermark
          try {
            resolve(canvas.toDataURL('image/jpeg', 0.9));
          } catch (e) {
            reject(e);
          }
        };
        logoImg.src = logoUrl;
      } else {
        try {
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } catch (e) {
          reject(e);
        }
      }
    };
    
    img.onerror = (e) => {
      console.error("Failed to load image for canvas watermarking", e);
      reject(new Error("Failed to load image for watermarking. CORS issue?"));
    };
    
    img.src = renderableUrl;
  });
};
