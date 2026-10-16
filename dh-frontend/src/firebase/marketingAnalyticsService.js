/* eslint-disable */
import { analytics } from './config';
import { logEvent } from 'firebase/analytics';

// ==========================================
// 🧠 SMART CACHE & ANTI-FRAUD BUFFER SYSTEM
// ==========================================
export let adStatsBuffer = {}; 
export let flushInterval = null;

const checkAntiFraud = (actionType, adId) => {
  if (typeof window === "undefined" || !window.sessionStorage) return true;
  try {
    const sessionKey = `dh_ad_${actionType}_${adId}`;
    const lastAction = sessionStorage.getItem(sessionKey);
    const now = Date.now();
    if (lastAction && (now - parseInt(lastAction, 10)) < 300000) return false; 
    sessionStorage.setItem(sessionKey, now.toString());
  } catch (e) {
    // SessionStorage disabled or restricted
  }
  return true; 
};

/**
 * 📊 ส่ง Telemetry ไปยัง Google Analytics 4 (GA4) โดยตรง
 * ตัดการเขียน Firestore ตรงจาก Client ฝั่งหน้าบ้าน เพื่อความปลอดภัย ป้องกัน Quota รั่ว และป้องกัน Permission Denied
 */
export const trackAdView = async (collectionName, adId, meta = {}) => {
  if (!adId || !collectionName) return;
  if (!checkAntiFraud('view', adId)) return;

  try {
    if (analytics) {
      logEvent(analytics, 'ad_impression', {
        ad_id: String(adId),
        ad_collection: String(collectionName),
        ad_type: meta?.type || 'unknown',
        owner_id: meta?.ownerId || 'unknown'
      });
    }
  } catch (err) {
    // AdBlocker / Offline safe
  }
};

export const trackAdClick = async (collectionName, adId, meta = {}) => {
  if (!adId || !collectionName) return;
  if (!checkAntiFraud('click', adId)) return;

  try {
    if (analytics) {
      logEvent(analytics, 'ad_click', {
        ad_id: String(adId),
        ad_collection: String(collectionName),
        ad_type: meta?.type || 'unknown',
        owner_id: meta?.ownerId || 'unknown',
        target_url: meta?.targetUrl || ''
      });
    }
  } catch (err) {
    // AdBlocker / Offline safe
  }
};

export const logImpression = async (adId, meta = {}) => {
  if (!adId) return;
  return trackAdView('partner_ads', adId, meta);
};

export const logClick = async (adId, meta = {}) => {
  if (!adId) return;
  return trackAdClick('partner_ads', adId, meta);
};

// 🛡️ Backward Compatible dummy for any external callers
export const flushAdStatsBatch = async () => {
  adStatsBuffer = {};
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
};
