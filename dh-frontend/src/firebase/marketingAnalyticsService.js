/* eslint-disable */
import { db } from './config';
import { doc, getDoc, increment, writeBatch, serverTimestamp } from 'firebase/firestore';
import { deductPartnerCredit, getCreditSettings } from './creditService';

const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

// ==========================================
// 🧠 SMART CACHE & ANTI-FRAUD BUFFER SYSTEM
// ==========================================
export let adStatsBuffer = {}; 
export let flushInterval = null;

const checkAntiFraud = (actionType, adId) => {
  const sessionKey = `dh_ad_${actionType}_${adId}`;
  const lastAction = sessionStorage.getItem(sessionKey);
  const now = Date.now();
  if (lastAction && (now - parseInt(lastAction)) < 300000) return false; 
  sessionStorage.setItem(sessionKey, now.toString());
  return true; 
};

// 🚀 อัปเกรดขั้นสุด: ยิงยอดวิว + หักเครดิต + เช็คงบประมาณ ใน Batch เดียว!
export const flushAdStatsBatch = async () => {
  if (Object.keys(adStatsBuffer).length === 0) return;
  const statsToProcess = { ...adStatsBuffer };
  adStatsBuffer = {}; 

  try {
    const batch = writeBatch(db);
    let hasUpdates = false;

    for (const collectionName in statsToProcess) {
      for (const adId in statsToProcess[collectionName]) {
        const stats = statsToProcess[collectionName][adId];
        if (stats.views > 0 || stats.clicks > 0) {
          const adRef = doc(db, 'artifacts', appId, 'public', 'data', collectionName, adId);
          
          // 🔍 ดึงข้อมูลโฆษณามาเช็คสถานะการเงิน (Real-time Validation)
          const adSnap = await getDoc(adRef);
          
          if (adSnap.exists()) {
            const adData = adSnap.data();
            const updateData = {};
            if (stats.views > 0) updateData['stats.views'] = increment(stats.views);
            if (stats.clicks > 0) updateData['stats.clicks'] = increment(stats.clicks);

            // 🛑 เช็คว่า "งบประมาณชนเพดาน" หรือยัง? (ถ้าชนเพดาน ให้หยุดโฆษณาทันที)
            if (adData.creditLimit !== -1 && adData.creditLimit > 0) {
               const currentViews = adData.stats?.views || 0;
               if ((currentViews + stats.views) >= adData.creditLimit) {
                  updateData['status'] = 'COMPLETED'; // ตัดจบแคมเปญ
               }
            }

            // 💰 ดึง Credit Config เพื่อคำนวณหักเงิน
            const config = await getCreditSettings();
            const adImpressionCost = config?.adImpressionCost || 5; 
            const adClickCost = config?.adClickCost || 2;

            let costToDeduct = 0;
            
            // 💸 คิดค่าคลิก
            if (stats.clicks > 0) {
              costToDeduct += (stats.clicks * adClickCost);
            }

            // 💸 คิดค่ามองเห็น (100 Views = adImpressionCost)
            if (stats.views > 0) {
              const currentUnbilled = adData.unbilledImpressions || 0;
              const newUnbilled = currentUnbilled + stats.views;
              
              if (newUnbilled >= 100) {
                 const batchesToCharge = Math.floor(newUnbilled / 100);
                 costToDeduct += (batchesToCharge * adImpressionCost);
                 updateData['unbilledImpressions'] = newUnbilled - (batchesToCharge * 100);
              } else {
                 updateData['unbilledImpressions'] = newUnbilled;
              }
            }

            batch.update(adRef, updateData);
            hasUpdates = true;

            // 💸 หักเครดิตจากกระเป๋าเจ้าของ
            if (adData.ownerId && costToDeduct > 0) {
               await deductPartnerCredit(adData.ownerId, costToDeduct, 'ad_campaign');
            }
          }
        }
      }
    }
    if (hasUpdates) {
      await batch.commit();
      console.log("✅ [Marketing] Ads stats flushed & credits deducted perfectly.");
    }
  } catch (error) {
    console.error("🔥 [Marketing] Error flushing ad stats:", error);
    // คืนค่าเข้า Buffer หากพัง
    for (const col in statsToProcess) {
      if (!adStatsBuffer[col]) adStatsBuffer[col] = {};
      for (const id in statsToProcess[col]) {
        if (!adStatsBuffer[col][id]) adStatsBuffer[col][id] = { views: 0, clicks: 0 };
        adStatsBuffer[col][id].views += statsToProcess[col][id].views;
        adStatsBuffer[col][id].clicks += statsToProcess[col][id].clicks;
      }
    }
  }
};

const startFlushInterval = () => {
  if (!flushInterval) flushInterval = setInterval(flushAdStatsBatch, 15000);
};

if (typeof window !== "undefined") {
  window.addEventListener('beforeunload', flushAdStatsBatch);
}

export const trackAdView = async (collectionName, adId) => {
  if (!adId || !collectionName) return;
  if (!checkAntiFraud('view', adId)) return;
  if (!adStatsBuffer[collectionName]) adStatsBuffer[collectionName] = {};
  if (!adStatsBuffer[collectionName][adId]) adStatsBuffer[collectionName][adId] = { views: 0, clicks: 0 };
  adStatsBuffer[collectionName][adId].views += 1;
  startFlushInterval(); 
};

export const trackAdClick = async (collectionName, adId) => {
  if (!adId || !collectionName) return;
  if (!checkAntiFraud('click', adId)) return;
  if (!adStatsBuffer[collectionName]) adStatsBuffer[collectionName] = {};
  if (!adStatsBuffer[collectionName][adId]) adStatsBuffer[collectionName][adId] = { views: 0, clicks: 0 };
  adStatsBuffer[collectionName][adId].clicks += 1;
  startFlushInterval();
  flushAdStatsBatch();
};

export const logImpression = async (adId) => {
  if (!adId) return;
  const col = String(adId).includes('SKU') ? 'user_sku_ads' : (String(adId).includes('BB') ? 'billboard_ads' : 'partner_ads');
  return trackAdView(col, adId);
};

export const logClick = async (adId) => {
  if (!adId) return;
  const col = String(adId).includes('SKU') ? 'user_sku_ads' : (String(adId).includes('BB') ? 'billboard_ads' : 'partner_ads');
  return trackAdClick(col, adId);
};
