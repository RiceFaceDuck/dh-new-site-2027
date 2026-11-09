import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

/**
 * 🏪 Partner Profile Service (Infrastructure Layer)
 * Clean Architecture & SRP: Encapsulates all Firestore queries and mutations
 * for partner store profiles (/store/:id).
 */

/**
 * Normalizes partner profile document from Firestore snapshot or fallback.
 * Guarantees viewCount, likeCount, and multi-period views structure integrity.
 *
 * @param {string} id - Partner ID
 * @param {Object} data - Raw document data
 * @returns {Object} Normalized partner profile
 */
export const normalizePartnerProfile = (id, data = {}) => {
  const legacyViews = Number(data.viewCount ?? data.viewsCount ?? 0);
  const rawViews = data.views;

  return {
    id,
    partnerId: id,
    ownerId: data.ownerId || id,
    storeName: data.storeName || data.displayName || 'ร้านค้าสมาชิก',
    services: data.services || data.description || '',
    phone: data.phone || '',
    messengerUrl: data.messengerUrl || '',
    lineUrl: data.lineUrl || '',
    googleMapLink: data.googleMapLink || '',
    latitude: Number(data.latitude || 0),
    longitude: Number(data.longitude || 0),
    storeImage: data.storeImage || data.logoUrl || '/logo.png',
    address: data.address || '',
    landmarks: data.landmarks || '',
    richDescription: data.richDescription || '',
    galleryImages: Array.isArray(data.galleryImages) ? data.galleryImages : [],
    openHours: data.openHours || '',
    websiteUrl: data.websiteUrl || data.storeWebsite || '',
    youtubeUrl: data.youtubeUrl || '',
    tiktokUrl: data.tiktokUrl || '',
    shopeeUrl: data.shopeeUrl || '',
    lazadaUrl: data.lazadaUrl || '',
    points: Number(data.points || data.creditPoints || 0),
    isActive: data.isActive !== false,
    viewCount: legacyViews,
    likeCount: Math.max(0, Number(data.likeCount ?? data.likes ?? 0)),
    // Preserve multi-period metrics structure with defensive defaults
    views: (rawViews && typeof rawViews === 'object') ? {
      allTime: Math.max(legacyViews, Number(rawViews.allTime || 0)),
      today: Number(rawViews.today || 0),
      dateKey: String(rawViews.dateKey || ''),
      updatedAt: rawViews.updatedAt || null
    } : {
      allTime: legacyViews,
      today: 0,
      dateKey: '',
      updatedAt: null
    }
  };
};

/**
 * Fetches partner profile with dual-source fallback:
 * 1. Primary: ActivePartners/{partnerId}
 * 2. Fallback: users/{partnerId}/storeProfile/main + users/{partnerId} (for credit points)
 *
 * @param {string} partnerId
 * @returns {Promise<Object|null>} Normalized partner data or null
 */
export const fetchPartnerProfile = async (partnerId) => {
  if (!partnerId) return null;

  try {
    // 1. Primary: ActivePartners
    const partnerRef = doc(db, getCollectionPath('ActivePartners'), partnerId);
    const partnerSnap = await getDoc(partnerRef);

    if (partnerSnap.exists()) {
      return normalizePartnerProfile(partnerSnap.id, partnerSnap.data());
    }

    // 2. Fallback: users/{partnerId}/storeProfile/main
    const userStoreRef = doc(db, getCollectionPath('users'), partnerId, 'storeProfile', 'main');
    const userStoreSnap = await getDoc(userStoreRef);

    if (userStoreSnap.exists()) {
      const uStore = userStoreSnap.data();
      let points = 0;
      let displayName = '';

      try {
        const userSnap = await getDoc(doc(db, getCollectionPath('users'), partnerId));
        if (userSnap.exists()) {
          const uData = userSnap.data();
          points = Number(uData.creditPoints ?? uData.points ?? 0);
          displayName = uData.displayName || '';
        }
      } catch (userErr) {
        console.warn('[partnerProfileService] User fallback points fetch deferred:', userErr?.message);
      }

      return normalizePartnerProfile(partnerId, {
        ...uStore,
        points,
        displayName,
        isActive: false // Fallback stores are not in ActivePartners
      });
    }

    return null;
  } catch (err) {
    console.error('[partnerProfileService] Error fetching partner profile:', err);
    throw err;
  }
};

/**
 * Toggles or increments/decrements store like count in ActivePartners.
 *
 * @param {string} partnerId
 * @param {number} delta (+1 or -1)
 * @returns {Promise<boolean>}
 */
export const updateStoreLikeCount = async (partnerId, delta) => {
  if (!partnerId || typeof delta !== 'number' || delta === 0) return false;

  const partnerRef = doc(db, getCollectionPath('ActivePartners'), partnerId);
  await updateDoc(partnerRef, {
    likeCount: increment(delta)
  });
  return true;
};
