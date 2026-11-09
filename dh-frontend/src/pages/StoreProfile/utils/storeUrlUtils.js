/**
 * Domain utility for URL parsing, normalization, social links aggregation,
 * and Google Maps coordinate generation for Store Profile.
 */

/**
 * Normalizes LINE input into a valid direct URL.
 * Handles @OA handles, personal IDs, lin.ee shortlinks, and direct URLs.
 * 
 * @param {string} url
 * @returns {string}
 */
export const formatLineUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (trimmed.includes('lin.ee') || trimmed.includes('line.me')) {
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }
  const cleaned = trimmed.replace(/^https?:\/\//i, '').replace(/^id:\s*/i, '').trim();
  if (!cleaned) return '';
  if (cleaned.startsWith('@')) return `https://line.me/R/ti/p/${cleaned}`;
  if (cleaned.includes('.') || cleaned.includes('/')) return `https://${cleaned}`;
  return `https://line.me/R/ti/p/~${cleaned}`;
};

/**
 * Normalizes Facebook Messenger input into a direct m.me link.
 * 
 * @param {string} url
 * @returns {string}
 */
export const formatMessengerUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (trimmed.includes('m.me') || trimmed.includes('facebook.com')) {
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }
  const cleaned = trimmed.replace(/^https?:\/\//i, '').trim();
  if (!cleaned.includes('.') && !cleaned.includes('/')) return `https://m.me/${cleaned}`;
  return `https://${cleaned}`;
};

/**
 * Normalizes YouTube channel handle or link.
 * 
 * @param {string} url
 * @returns {string}
 */
export const formatYoutubeUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  const m = trimmed.match(/^https?:\/\/@(.*)/i);
  if (m) return `https://www.youtube.com/@${m[1]}`;
  if (trimmed.startsWith('@')) return `https://www.youtube.com/${trimmed}`;
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }
  const cleaned = trimmed.replace(/^https?:\/\//i, '').trim();
  if (!cleaned.includes('.') && !cleaned.includes('/')) return `https://www.youtube.com/@${cleaned}`;
  return `https://${cleaned}`;
};

/**
 * Normalizes TikTok username handle or link.
 * 
 * @param {string} url
 * @returns {string}
 */
export const formatTiktokUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  const m = trimmed.match(/^https?:\/\/@(.*)/i);
  if (m) return `https://www.tiktok.com/@${m[1]}`;
  if (trimmed.startsWith('@')) return `https://www.tiktok.com/${trimmed}`;
  if (trimmed.includes('tiktok.com')) {
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }
  const cleaned = trimmed.replace(/^https?:\/\//i, '').trim();
  if (!cleaned.includes('.') && !cleaned.includes('/') && !cleaned.endsWith('@gmail.com')) {
    return `https://www.tiktok.com/@${cleaned}`;
  }
  return `https://${cleaned}`;
};

/**
 * Ensures arbitrary external web URLs have an https:// prefix.
 * 
 * @param {string} url
 * @returns {string}
 */
export const formatExternalUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

/**
 * Resolves Google Maps URL from candidate fields or GPS latitude/longitude.
 * 
 * @param {Object} partner Store partner entity
 * @returns {string} Google Maps URL or empty string
 */
export const resolveMapsUrl = (partner = {}) => {
  if (!partner || typeof partner !== 'object') return '';

  const lat = Number(partner.latitude ?? partner.storeProfile?.latitude ?? 0);
  const lng = Number(partner.longitude ?? partner.storeProfile?.longitude ?? 0);
  const hasCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  const coordsUrl = hasCoords ? `https://www.google.com/maps?q=${lat},${lng}` : '';

  const rawMapsUrl = (
    partner.mapsUrl ||
    partner.googleMapLink ||
    partner.googleMapsUrl ||
    partner.storeProfile?.mapsUrl ||
    partner.storeProfile?.googleMapLink ||
    coordsUrl ||
    ''
  ).trim();

  if (!rawMapsUrl) return '';
  return rawMapsUrl.startsWith('http')
    ? rawMapsUrl
    : `https://www.google.com/maps?q=${encodeURIComponent(rawMapsUrl)}`;
};

/**
 * Aggregates all social contact channels for a partner into a structured object.
 * 
 * @param {Object} partner Store partner entity
 * @returns {Object} { lineUrl, messengerUrl, websiteUrl, youtubeUrl, tiktokUrl, shopeeUrl, lazadaUrl, hasSocialLinks }
 */
export const resolveSocialLinks = (partner = {}) => {
  const lineUrl = formatLineUrl(partner?.lineUrl || partner?.storeProfile?.lineUrl);
  const messengerUrl = formatMessengerUrl(partner?.messengerUrl || partner?.storeProfile?.messengerUrl);
  const websiteUrl = formatExternalUrl(partner?.websiteUrl || partner?.storeWebsite || partner?.storeProfile?.websiteUrl || partner?.storeProfile?.storeWebsite);
  const youtubeUrl = formatYoutubeUrl(partner?.youtubeUrl || partner?.storeProfile?.youtubeUrl);
  const tiktokUrl = formatTiktokUrl(partner?.tiktokUrl || partner?.storeProfile?.tiktokUrl);
  const shopeeUrl = formatExternalUrl(partner?.shopeeUrl || partner?.storeProfile?.shopeeUrl);
  const lazadaUrl = formatExternalUrl(partner?.lazadaUrl || partner?.storeProfile?.lazadaUrl);

  const hasSocialLinks = Boolean(lineUrl || messengerUrl || websiteUrl || youtubeUrl || tiktokUrl || shopeeUrl || lazadaUrl);

  return {
    lineUrl,
    messengerUrl,
    websiteUrl,
    youtubeUrl,
    tiktokUrl,
    shopeeUrl,
    lazadaUrl,
    hasSocialLinks
  };
};
