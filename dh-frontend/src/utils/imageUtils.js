/**
 * Utility functions for image processing and handling
 */

/**
 * Converts Google Drive links and other formats into renderable URLs
 * @param {string} url The original image URL
 * @returns {string} The formatted URL that can be directly used in an img src
 */
export const getRenderableImageUrl = (url, width = 1000) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';

  if (trimmed.includes('drive.google.com') || trimmed.includes('googleusercontent.com')) {
    const match = trimmed.match(/id=([a-zA-Z0-9_-]{15,})/) ||
                  trimmed.match(/\/d\/([a-zA-Z0-9_-]{15,})/) ||
                  trimmed.match(/([a-zA-Z0-9_-]{25,})/);
    if (match) {
      const driveId = match[1] || match[0];
      return `https://lh3.googleusercontent.com/d/${driveId}=w${width}`;
    }
    if (trimmed.includes('googleusercontent.com') && trimmed.includes('=w')) {
      return trimmed.replace(/=w\d+/, `=w${width}`);
    }
  }
  return trimmed;
};

export const extractDriveId = (url) => {
  if (!url) return null;
  const str = String(url);
  if (!str.includes('drive.google') && !str.includes('googleusercontent')) return null;
  const match = str.match(/id=([a-zA-Z0-9_-]{15,})/) || str.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
  return match ? match[1] : null;
};

