/**
 * 📊 Record Ad Telemetry (Cloud Functions v2)
 * สถาปัตยกรรมแยกส่วน (Clean Architecture & SRP):
 * 1. aggregateTelemetryEvents: รวบยอดและทำความสะอาดข้อมูลดิบ (Pure Function)
 * 2. calculateAdDeductions: คำนวณแต้มและงบประมาณอย่างเป็นธรรม (Pure Math)
 * 3. commitTelemetryTransaction: ดำเนินการธุรกรรมทางการเงินและการบัญชีคู่ขนาน (Firestore Transaction)
 */

const { onRequest } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { initializeApp, getApps } = require("firebase-admin/app");

if (getApps().length === 0) {
  initializeApp();
}

const REGION = "asia-southeast1";
const MAX_EVENTS_PER_BATCH = 100;
const MAX_DISTINCT_ADS_PER_BATCH = 30;

// ==========================================
// 1. PURE PARSER & AGGREGATOR (SRP Layer 1)
// ==========================================
/**
 * รวบรวมและกำจัดข้อมูลซ้ำซ้อนจาก Event ก้อนรวม (รองรับทั้ง partner_ads, user_sku_ads, และ store_view)
 * @param {Array} events - รายการสถิติดิบจาก Client
 * @returns {Object} { adAggregates: Record<string, { adId, views, clicks, ownerId, adType }>, storeAggregates: Record<string, { storeId, views, partnerName, ownerId }>, distinctCount: number }
 */
const aggregateTelemetryEvents = (events = []) => {
  if (!Array.isArray(events) || events.length === 0) {
    return { adAggregates: {}, storeAggregates: {}, distinctCount: 0 };
  }

  const safeEvents = events.slice(0, MAX_EVENTS_PER_BATCH);
  const adAggregates = {};
  const storeAggregates = {};

  for (const ev of safeEvents) {
    // 🏪 Support for store_view telemetry events (ActivePartners/{store_id}.viewCount)
    if (ev?.type === "store_view" || ev?.store_id || ev?.storeId) {
      const storeId = ev?.store_id || ev?.storeId;
      if (storeId) {
        const cleanStoreId = String(storeId).trim();
        if (cleanStoreId) {
          if (!storeAggregates[cleanStoreId]) {
            storeAggregates[cleanStoreId] = {
              storeId: cleanStoreId,
              views: 0,
              partnerName: ev.partner_name || ev.partnerName || "",
              ownerId: ev.owner_id || ev.ownerId || cleanStoreId
            };
          }
          storeAggregates[cleanStoreId].views += 1;
          continue;
        }
      }
    }

    const adId = ev?.adId ? String(ev.adId).trim() : null;
    if (!adId) continue;

    const collection = ev?.collection === "user_sku_ads" ? "user_sku_ads" : "partner_ads";

    if (!adAggregates[adId]) {
      adAggregates[adId] = {
        adId,
        collection,
        views: 0,
        clicks: 0,
        ownerId: ev.ownerId && ev.ownerId !== "unknown" ? String(ev.ownerId).trim() : null,
        adType: ev.adType || "unknown"
      };
    }

    if (ev.type === "click") {
      adAggregates[adId].clicks += 1;
    } else {
      adAggregates[adId].views += 1;
    }

    if (!adAggregates[adId].ownerId && ev.ownerId && ev.ownerId !== "unknown") {
      adAggregates[adId].ownerId = String(ev.ownerId).trim();
    }
  }

  const adIds = Object.keys(adAggregates).slice(0, MAX_DISTINCT_ADS_PER_BATCH);
  const filteredAggregates = {};
  adIds.forEach((id) => {
    filteredAggregates[id] = adAggregates[id];
  });

  return { 
    adAggregates: filteredAggregates, 
    storeAggregates, 
    distinctCount: adIds.length + Object.keys(storeAggregates).length 
  };
};

// ==========================================
// 2. FINANCIAL MATH & DEDUCTION RULES (SRP Layer 2)
// ==========================================
/**
 * คำนวณแต้มที่ต้องหักแยกตามรายเจ้าของโฆษณา (Pure Calculation)
 * @param {Object} validAdMap - ข้อมูลโฆษณาที่โหลดจากฐานข้อมูล
 * @param {Object} config - การตั้งค่าราคาจาก settings/credit_config
 * @returns {Object} ownerDeductions
 */
const calculateAdDeductions = (validAdMap, config = {}) => {
  const costPerClick = Number(config.adClickCost ?? 5);
  const costPerImpressionBatch = Number(config.adImpressionCost ?? 0.1);
  const impressionBatchSize = Number(config.adImpressionCount ?? 1000);

  const ownerDeductions = {};

  for (const adId of Object.keys(validAdMap)) {
    const { ownerId, deltaViews, deltaClicks, data } = validAdMap[adId];

    // โฆษณาที่ใช้ระบบ Prepaid หรือเปิด Auto-Rollover โควต้าวิวจะตัดจากแพ็กเกจล่วงหน้า ไม่ต้องหักซ้ำตอนเกิดวิว
    const isPrepaid = data?.remainingViews !== undefined || data?.autoRollover === true;

    const clickDeduct = deltaClicks * costPerClick;
    const viewDeduct = isPrepaid ? 0 : ((deltaViews / impressionBatchSize) * costPerImpressionBatch);
    const rawTotal = clickDeduct + viewDeduct;
    // Micro-deduction precision: ensure small view batches (< 50 views) aren't lost to zero rounding
    const totalDeduct = rawTotal > 0 && rawTotal < 0.01
      ? Math.round(rawTotal * 10000) / 10000
      : Math.round(rawTotal * 100) / 100;

    if (ownerId && totalDeduct > 0) {
      if (!ownerDeductions[ownerId]) {
        ownerDeductions[ownerId] = { totalDeduct: 0, ads: [] };
      }
      const newOwnerTotal = ownerDeductions[ownerId].totalDeduct + totalDeduct;
      ownerDeductions[ownerId].totalDeduct = newOwnerTotal > 0 && newOwnerTotal < 0.01
        ? Math.round(newOwnerTotal * 10000) / 10000
        : Math.round(newOwnerTotal * 100) / 100;
      ownerDeductions[ownerId].ads.push({ adId, deltaViews, deltaClicks, totalDeduct });
    }
  }

  return ownerDeductions;
};

// ==========================================
// 3. ATOMIC TRANSACTION & LEDGER ORCHESTRATOR (SRP Layer 3)
// ==========================================
/**
 * บันทึกสถิติลง partner_ads, ตัดแต้มจากผู้ใช้, และบันทึกบัญชีคู่ขนาน
 */
const commitTelemetryTransaction = async (db, adAggregates = {}, config = {}, storeAggregates = {}) => {
  const adIds = Object.keys(adAggregates || {});
  const storeIds = Object.keys(storeAggregates || {});
  if (adIds.length === 0 && storeIds.length === 0) {
    return { success: true, processed: 0, adsUpdated: 0, storesUpdated: 0, totalDeducted: 0 };
  }

  let totalDeductionsAll = 0;
  let totalAdsUpdated = 0;
  let totalStoresUpdated = 0;

  await db.runTransaction(async (transaction) => {
    // A. Read Phase: ดึงข้อมูลโฆษณา, ผู้ใช้, Settings, และ ActivePartners ก่อนทำการเขียน
    const adRefs = adIds.map((id) => {
      const coll = adAggregates[id]?.collection || "partner_ads";
      return db.collection(coll).doc(id);
    });
    const adSnaps = adIds.length > 0 ? await Promise.all(adRefs.map((ref) => transaction.get(ref))) : [];

    const ownerIdsToFetch = new Set();
    const validAdMap = {};

    adSnaps.forEach((snap, idx) => {
      const adId = adIds[idx];
      if (snap.exists) {
        const adData = snap.data();
        const ownerId = adData.ownerId || adAggregates[adId].ownerId;
        validAdMap[adId] = {
          ref: snap.ref,
          data: adData,
          collection: adAggregates[adId]?.collection || "partner_ads",
          ownerId,
          deltaViews: adAggregates[adId].views,
          deltaClicks: adAggregates[adId].clicks
        };
        if (ownerId) ownerIdsToFetch.add(ownerId);
      }
    });

    const userRefs = Array.from(ownerIdsToFetch).map((uid) => db.collection("users").doc(uid));
    const userSnaps = userRefs.length > 0 ? await Promise.all(userRefs.map((ref) => transaction.get(ref))) : [];
    const userMap = {};
    userSnaps.forEach((snap) => {
      if (snap.exists) {
        userMap[snap.id] = snap.data();
      }
    });

    const settingsRef = db.collection("settings").doc("credit_config");
    let settingsSnap = null;
    let sData = {};
    let ledger = { systemPoolMax: 10000000, totalAllocated: 0, status: "SECURE" };
    let currentAllocated = 0;

    if (adIds.length > 0) {
      settingsSnap = await transaction.get(settingsRef);
      sData = settingsSnap.exists ? settingsSnap.data() : {};
      ledger = sData.ledger || { systemPoolMax: 10000000, totalAllocated: 0, status: "SECURE" };
      currentAllocated = Number(ledger.totalAllocated || 0);
    }

    // 🏪 Read ActivePartners for store_view telemetry
    const storeRefs = storeIds.map((id) => db.collection("ActivePartners").doc(id));
    const storeSnaps = storeRefs.length > 0 ? await Promise.all(storeRefs.map((ref) => transaction.get(ref))) : [];

    // B. Calculate Phase: คำนวณยอดเงินด้วยกฎธุรกิจที่บริสุทธิ์
    const ownerDeductions = adIds.length > 0 ? calculateAdDeductions(validAdMap, config) : {};

    // C. Write Phase 1: บันทึกสถิติยอดเข้าชมหน้าร้านพาร์ทเนอร์ (ActivePartners/{store_id}.viewCount)
    storeSnaps.forEach((snap, idx) => {
      const storeId = storeIds[idx];
      const deltaViews = Number(storeAggregates[storeId]?.views || 0);
      if (deltaViews > 0) {
        const storeRef = storeRefs[idx];
        if (snap.exists) {
          transaction.update(storeRef, {
            viewCount: FieldValue.increment(deltaViews),
            updatedAt: FieldValue.serverTimestamp()
          });
        } else {
          transaction.set(storeRef, {
            partnerId: storeId,
            viewCount: deltaViews,
            updatedAt: FieldValue.serverTimestamp()
          }, { merge: true });
        }
        totalStoresUpdated++;
      }
    });

    // D. Write Phase 2: อัปเดตสถิติและสถานะของ partner_ads
    const costPerClick = Number(config.adClickCost ?? 5);
    const costPerImpressionBatch = Number(config.adImpressionCost ?? 0.1);
    const impressionBatchSize = Number(config.adImpressionCount ?? 1000);

    for (const adId of Object.keys(validAdMap)) {
      const { ref: adRef, data: adData, ownerId, deltaViews, deltaClicks } = validAdMap[adId];
      const userData = ownerId ? (userMap[ownerId] || {}) : {};
      const currentPoints = Number(userData.creditPoints || 0);
      const creditLimit = Number(adData.creditLimit || -1);
      const currentSpent = Number(adData.spentBudget || 0);
      const rawAdCost = (deltaClicks * costPerClick) + ((deltaViews / impressionBatchSize) * costPerImpressionBatch);
      const adCost = rawAdCost > 0 && rawAdCost < 0.01 ? Math.round(rawAdCost * 10000) / 10000 : Math.round(rawAdCost * 100) / 100;

      let isExhausted = false;

      // 📦 จัดการโควต้าวิวคงเหลือสำหรับระบบ Prepaid & Auto-Rollover
      const isPrepaid = adData.remainingViews !== undefined;
      const prepaidCost = Number(config.adImpressionCost ?? 15);
      const prepaidCount = Number(config.adImpressionCount ?? 100);
      const isAutoRolloverAllowed = adData.autoRollover !== false; // เปิด Auto-Rollover เป็นค่าเริ่มต้น

      let newRemaining = null;
      let autoRolloverCost = 0;

      if (isPrepaid) {
        const curRemaining = Number(adData.remainingViews || 0);
        const rem = curRemaining - deltaViews;

        if (rem <= 0) {
          if (isAutoRolloverAllowed && ownerId) {
            const deficit = Math.abs(rem);
            const cycles = deficit === 0 ? 1 : Math.ceil(deficit / prepaidCount) + (deficit % prepaidCount === 0 ? 1 : 0);
            const requiredPts = cycles * prepaidCost;
            const currentTotalDeduct = ownerDeductions[ownerId]?.totalDeduct || 0;
            const availablePts = currentPoints - currentTotalDeduct;

            if (availablePts >= requiredPts) {
              autoRolloverCost = requiredPts;
              newRemaining = (curRemaining + (cycles * prepaidCount)) - deltaViews;
              isExhausted = false; // ต่อแพ็กเกจอัตโนมัติสำเร็จ ป้ายไม่ดับ!
            } else {
              newRemaining = 0;
              isExhausted = true;
            }
          } else {
            newRemaining = 0;
            isExhausted = true;
          }
        } else {
          newRemaining = rem;
        }
      } else if (adData.isActive !== false && ['APPROVED', 'ACTIVE'].includes(String(adData.status).toUpperCase())) {
        // กรณี Legacy Active Ad (เช่น 43 ร้านเดิมในระบบที่ยังไม่มีฟิลด์ remainingViews)
        // เมื่อมีวิวเข้ามา ให้ Auto-Enroll เข้าสู่ระบบโควต้าอัตโนมัติแบบเนียนๆ
        if (isAutoRolloverAllowed && ownerId) {
          const currentTotalDeduct = ownerDeductions[ownerId]?.totalDeduct || 0;
          const availablePts = currentPoints - currentTotalDeduct;

          if (availablePts >= prepaidCost) {
            autoRolloverCost = prepaidCost;
            newRemaining = Math.max(0, prepaidCount - deltaViews);
            isExhausted = false;
          } else {
            if (currentPoints <= 0) isExhausted = true;
          }
        }
      }

      if (autoRolloverCost > 0 && ownerId) {
        if (!ownerDeductions[ownerId]) {
          ownerDeductions[ownerId] = { totalDeduct: 0, ads: [] };
        }
        ownerDeductions[ownerId].totalDeduct = Math.round((ownerDeductions[ownerId].totalDeduct + autoRolloverCost) * 100) / 100;
        ownerDeductions[ownerId].ads.push({
          adId,
          deltaViews,
          deltaClicks,
          totalDeduct: autoRolloverCost,
          type: 'AUTO_ROLLOVER'
        });
      }

      const finalAdCost = adCost + autoRolloverCost;
      const newSpent = Math.round((currentSpent + finalAdCost) * 100) / 100;

      if (creditLimit > 0 && newSpent >= creditLimit) {
        isExhausted = true;
      }
      if (ownerId && (currentPoints <= 0 || (currentPoints - (ownerDeductions[ownerId]?.totalDeduct || 0)) <= 0) && !isPrepaid && autoRolloverCost === 0) {
        isExhausted = true;
      }

      const adUpdate = {
        "stats.views": FieldValue.increment(deltaViews),
        "stats.clicks": FieldValue.increment(deltaClicks),
        spentBudget: newSpent,
        updatedAt: FieldValue.serverTimestamp()
      };

      if (newRemaining !== null) {
        adUpdate.remainingViews = newRemaining;
        adUpdate.isQuotaExhausted = newRemaining <= 0;
        adUpdate.autoRollover = isAutoRolloverAllowed;
      }

      if (isExhausted) {
        adUpdate.status = "OUT_OF_CREDIT";
        adUpdate.isActive = false;
      }

      transaction.update(adRef, adUpdate);

      // หากโควต้าหมดและเป็นนามบัตรช่าง ให้ปลดออกจาก ActivePartners ทันที
      if (isExhausted && adData.type === 'BUSINESS_CARD' && ownerId) {
        const activePartnerRef = db.collection("ActivePartners").doc(ownerId);
        transaction.delete(activePartnerRef);
      }
      totalAdsUpdated++;
    }

    // D. Write Phase 2: ตัดแต้มผู้ใช้ และลงบัญชีคู่ขนาน (Double-Entry Parity Guard)
    for (const ownerId of Object.keys(ownerDeductions)) {
      const userData = userMap[ownerId] || {};
      const deductAmount = ownerDeductions[ownerId].totalDeduct;
      const currentPoints = Number(userData.creditPoints || 0);
      const safeDeduct = Math.min(currentPoints, Math.round(deductAmount * 100) / 100);
      const newPoints = Math.max(0, Math.round((currentPoints - safeDeduct) * 100) / 100);

      const userRef = db.collection("users").doc(ownerId);
      // การอัปเดต creditPoints ตรงนี้จะกระตุ้น partnerVisibilitySync ให้ซ่อนหมุดร้านอัตโนมัติอย่างสอดคล้อง
      transaction.update(userRef, {
        creditPoints: newPoints,
        updatedAt: FieldValue.serverTimestamp()
      });

      currentAllocated = Math.max(0, Math.round((currentAllocated - safeDeduct) * 100) / 100);
      totalDeductionsAll = Math.round((totalDeductionsAll + safeDeduct) * 100) / 100;

      const txRef = db.collection("credit_transactions").doc();
      transaction.set(txRef, {
        transactionId: `TX-AD-BATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        uid: ownerId,
        partnerId: ownerId,
        type: "deduct",
        category: "ads",
        module: "marketing_telemetry_batch",
        amount: safeDeduct,
        details: ownerDeductions[ownerId].ads,
        note: `ตัดยอดโฆษณา Telemetry Batch (${ownerDeductions[ownerId].ads.length} รายการ)`,
        timestamp: FieldValue.serverTimestamp()
      });
    }

    // E. Write Phase 3: ซิงค์ totalAllocated ใน Settings Ledger
    if (totalDeductionsAll > 0 && settingsRef && settingsSnap && settingsSnap.exists) {
      transaction.set(settingsRef, {
        ledger: {
          ...ledger,
          totalAllocated: currentAllocated,
          lastAuditTime: FieldValue.serverTimestamp()
        },
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }
  });

  return {
    success: true,
    processed: adIds.length + storeIds.length,
    adsUpdated: totalAdsUpdated,
    storesUpdated: totalStoresUpdated,
    totalDeducted: totalDeductionsAll
  };
};

// ==========================================
// 4. MAIN ENTRY & HTTP HANDLER
// ==========================================
/**
 * ประมวลผล Batch Telemetry ก้อนรวม (รองรับทั้ง Ads และ Store Views)
 */
const processAdTelemetryBatch = async (db, events = []) => {
  const { adAggregates = {}, storeAggregates = {} } = aggregateTelemetryEvents(events);
  const hasAds = Object.keys(adAggregates).length > 0;
  const hasStores = Object.keys(storeAggregates).length > 0;

  if (!hasAds && !hasStores) {
    return { success: true, processed: 0, adsUpdated: 0, storesUpdated: 0, totalDeducted: 0 };
  }

  let config = {};
  if (hasAds) {
    const configSnap = await db.collection("settings").doc("credit_config").get();
    const rawData = configSnap.exists ? configSnap.data() : {};
    config = rawData.config || rawData.creditConfig || rawData || {};
  }

  return commitTelemetryTransaction(db, adAggregates, config, storeAggregates);
};

exports.recordAdTelemetry = onRequest(
  {
    region: REGION,
    cors: true,
    memory: "256MiB",
    timeoutSeconds: 30
  },
  async (req, res) => {
    if (req.method === "GET") {
      res.status(200).json({ status: "healthy", service: "recordAdTelemetry", region: REGION });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
      return;
    }

    if (process.env.AD_TELEMETRY_SECRET) {
      const authHeader = req.headers["x-ad-telemetry-secret"] || req.headers["authorization"];
      if (!authHeader || authHeader !== process.env.AD_TELEMETRY_SECRET) {
        res.status(401).json({ success: false, error: "Unauthorized: Invalid or missing telemetry secret." });
        return;
      }
    }

    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const events = Array.isArray(body.events) ? body.events : [];

      if (events.length === 0) {
        res.status(200).json({ success: true, processed: 0, message: "Empty events queue" });
        return;
      }

      const db = getFirestore();
      const result = await processAdTelemetryBatch(db, events);

      res.status(200).json(result);
    } catch (err) {
      console.error("🔥 [recordAdTelemetry] Error processing telemetry batch:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = {
  recordAdTelemetry: exports.recordAdTelemetry,
  processAdTelemetryBatch,
  aggregateTelemetryEvents,
  calculateAdDeductions,
  commitTelemetryTransaction
};
