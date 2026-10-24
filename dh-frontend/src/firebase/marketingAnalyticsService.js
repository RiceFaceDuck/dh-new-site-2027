/* eslint-disable */
import { analytics } from './config';
import { logEvent } from 'firebase/analytics';

// ==========================================
// 🧠 2-MINUTE IN-MEMORY BUFFER & BEACON SYSTEM
// ==========================================
export let adStatsBuffer = {}; 
export let eventQueue = [];
export let flushTimer = null;

const FLUSH_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes (120,000 ms)
const MAX_QUEUE_SIZE = 20; // Flush early if queue reaches 20 events

const getTelemetryEndpoint = () => {
  const customUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_RECORD_AD_TELEMETRY_URL;
  if (customUrl) return customUrl;
  const projectId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || 'dh-notebook-69f3b';
  return `https://asia-southeast1-${projectId}.cloudfunctions.net/recordAdTelemetry`;
};

const checkAntiFraud = (actionType, adId) => {
  if (typeof window === "undefined" || !window.sessionStorage) return true;
  try {
    const sessionKey = `dh_ad_${actionType}_${adId}`;
    const lastAction = sessionStorage.getItem(sessionKey);
    const now = Date.now();
    if (lastAction && (now - parseInt(lastAction, 10)) < 300000) return false; // 5-minute cooldown per ad
    sessionStorage.setItem(sessionKey, now.toString());
  } catch (e) {
    // SessionStorage disabled or restricted
  }
  return true; 
};

/**
 * 🚀 Flush สถิติโฆษณาใน In-Memory Buffer ไปยัง Backend
 * @param {boolean} isExiting - true หากเป็นการปิดหน้าต่าง/สลับแท็บ (ใช้ sendBeacon / keepalive)
 */
export const flushTelemetryQueue = async (isExiting = false) => {
  if (!eventQueue || eventQueue.length === 0) return;

  const payload = [...eventQueue];
  eventQueue = []; // Clear in-flight queue immediately to prevent double flushes

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const endpoint = getTelemetryEndpoint();
  const dataString = JSON.stringify({ events: payload });

  // 1. ถ้ากำลังจะปิดหน้าเว็บ ให้ใช้ navigator.sendBeacon ของเบราว์เซอร์
  if (isExiting && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      const blob = new Blob([dataString], { type: 'application/json' });
      const sent = navigator.sendBeacon(endpoint, blob);
      if (sent) return;
    } catch (beaconErr) {
      // Fallback to fetch with keepalive
    }
  }

  // 2. ใช้ fetch พร้อม keepalive: true เพื่อความแน่นอน
  try {
    if (typeof fetch !== 'undefined') {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: dataString,
        keepalive: true
      });
    }
  } catch (err) {
    // Fail-safe: หากยังไม่ได้ปิดหน้าเว็บและคิวไม่ล้น ให้นำกลับมาลองใหม่ในรอบถัดไป
    if (!isExiting && eventQueue.length < 50) {
      eventQueue = [...payload, ...eventQueue];
    }
  }
};

const scheduleFlush = () => {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushTelemetryQueue(false);
  }, FLUSH_INTERVAL_MS);
};

// 🛡️ ผูกตัวดักตรวจจับการปิดแท็บหรือสลับหน้าเว็บ (Page Lifecycle)
if (typeof window !== 'undefined') {
  try {
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushTelemetryQueue(true);
      }
    });
    window.addEventListener('pagehide', () => {
      flushTelemetryQueue(true);
    });
  } catch (e) {
    // Non-browser or restricted environment safe
  }
}

/**
 * 📊 ส่ง Telemetry ไปยัง Google Analytics 4 (GA4) ควบคู่กับ In-Memory Queue (2 นาที)
 */
export const trackAdView = async (collectionName, adId, meta = {}) => {
  if (!adId || !collectionName) return;
  if (!checkAntiFraud('view', adId)) return;

  // 1. ส่ง GA4 สำหรับวิเคราะห์การตลาดภาพรวม
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

  // 2. ใส่ใน In-Memory Queue รอ Flush ทุก 2 นาที (0 Write ตอนนี้)
  eventQueue.push({
    type: 'view',
    adId: String(adId),
    collection: String(collectionName),
    ownerId: meta?.ownerId || 'unknown',
    adType: meta?.type || 'unknown',
    timestamp: Date.now()
  });

  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    flushTelemetryQueue(false);
  } else {
    scheduleFlush();
  }
};

export const trackAdClick = async (collectionName, adId, meta = {}) => {
  if (!adId || !collectionName) return;
  if (!checkAntiFraud('click', adId)) return;

  // 1. ส่ง GA4
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

  // 2. ใส่ใน In-Memory Queue
  eventQueue.push({
    type: 'click',
    adId: String(adId),
    collection: String(collectionName),
    ownerId: meta?.ownerId || 'unknown',
    adType: meta?.type || 'unknown',
    targetUrl: meta?.targetUrl || '',
    timestamp: Date.now()
  });

  // คลิกเป็นเหตุการณ์สำคัญ ถ้ามีคลิกให้ Flush ทันทีเพื่อความแม่นยำ
  flushTelemetryQueue(false);
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
  return flushTelemetryQueue(false);
};
