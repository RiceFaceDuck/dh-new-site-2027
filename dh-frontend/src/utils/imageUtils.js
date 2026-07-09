/**
 * Utility functions for image processing and handling
 */

/**
 * Converts Google Drive links and other formats into renderable URLs
 * @param {string} url The original image URL
 * @returns {string} The formatted URL that can be directly used in an img src
 */
export const getRenderableImageUrl = (url) => {
  if (!url) return '';
  const match = String(url).match(/[-\w]{25,}/);
  if (String(url).includes('drive.google.com') && match) {
    return `https://lh3.googleusercontent.com/d/${match[0]}`;
  }
  return url;
};
