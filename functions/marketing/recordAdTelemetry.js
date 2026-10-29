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
 * รวบรวมและกำจัดข้อมูลซ้ำซ้อนจาก Event ก้อนรวม
 * @param {Array} events - รายการสถิติดิบจาก Client
 * @returns {Object} { adAggregates: Record<string, { adId, views, clicks, ownerId, adType }>, distinctCount: number }
 */
const aggregateTelemetryEvents = (events = []) => {
  if (!Array.isArray(events) || events.length === 0) {
    return { adAggregates: {}, distinctCount: 0 };
  }

  const safeEvents = events.slice(0, MAX_EVENTS_PER_BATCH);
  const adAggregates = {};

  for (const ev of safeEvents) {
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

  return { adAggregates: filteredAggregates, distinctCount: adIds.length };
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
    const { ownerId, deltaViews, deltaClicks } = validAdMap[adId];

    const clickDeduct = deltaClicks * costPerClick;
    const viewDeduct = (deltaViews / impressionBatchSize) * costPerImpressionBatch;
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
const commitTelemetryTransaction = async (db, adAggregates, config) => {
  const adIds = Object.keys(adAggregates);
  if (adIds.length === 0) {
    return { success: true, processed: 0, adsUpdated: 0, totalDeducted: 0 };
  }

  let totalDeductionsAll = 0;
  let totalAdsUpdated = 0;

  await db.runTransaction(async (transaction) => {
    // A. Read Phase: ดึงข้อมูลโฆษณา, ผู้ใช้, และ Settings ทั้งหมดก่อนทำการเขียน (รองรับทั้ง partner_ads และ user_sku_ads)
    const adRefs = adIds.map((id) => {
      const coll = adAggregates[id]?.collection || "partner_ads";
      return db.collection(coll).doc(id);
    });
    const adSnaps = await Promise.all(adRefs.map((ref) => transaction.get(ref)));

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
    const userSnaps = await Promise.all(userRefs.map((ref) => transaction.get(ref)));
    const userMap = {};
    userSnaps.forEach((snap) => {
      if (snap.exists) {
        userMap[snap.id] = snap.data();
      }
    });

    const settingsRef = db.collection("settings").doc("credit_config");
    const settingsSnap = await transaction.get(settingsRef);
    const sData = settingsSnap.exists ? settingsSnap.data() : {};
    const ledger = sData.ledger || { systemPoolMax: 10000000, totalAllocated: 0, status: "SECURE" };
    let currentAllocated = Number(ledger.totalAllocated || 0);

    // B. Calculate Phase: คำนวณยอดเงินด้วยกฎธุรกิจที่บริสุทธิ์
    const ownerDeductions = calculateAdDeductions(validAdMap, config);

    // C. Write Phase 1: อัปเดตสถิติและสถานะของ partner_ads
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
      const newSpent = Math.round((currentSpent + adCost) * 100) / 100;

      let isExhausted = false;
      if (creditLimit > 0 && newSpent >= creditLimit) {
        isExhausted = true;
      }
      if (ownerId && (currentPoints <= 0 || (currentPoints - (ownerDeductions[ownerId]?.totalDeduct || 0)) <= 0)) {
        isExhausted = true;
      }

      const adUpdate = {
        "stats.views": FieldValue.increment(deltaViews),
        "stats.clicks": FieldValue.increment(deltaClicks),
        spentBudget: newSpent,
        updatedAt: FieldValue.serverTimestamp()
      };

      if (isExhausted) {
        adUpdate.status = "OUT_OF_CREDIT";
        adUpdate.isActive = false;
      }

      transaction.update(adRef, adUpdate);
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
    if (totalDeductionsAll > 0 && settingsSnap.exists) {
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
    processed: adIds.length,
    adsUpdated: totalAdsUpdated,
    totalDeducted: totalDeductionsAll
  };
};

// ==========================================
// 4. MAIN ENTRY & HTTP HANDLER
// ==========================================
/**
 * ประมวลผล Batch Telemetry ก้อนรวม
 */
const processAdTelemetryBatch = async (db, events = []) => {
  const { adAggregates } = aggregateTelemetryEvents(events);
  if (Object.keys(adAggregates).length === 0) {
    return { success: true, processed: 0, adsUpdated: 0, totalDeducted: 0 };
  }

  const configSnap = await db.collection("settings").doc("credit_config").get();
  const rawData = configSnap.exists ? configSnap.data() : {};
  const config = rawData.config || rawData.creditConfig || rawData || {};

  return commitTelemetryTransaction(db, adAggregates, config);
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
  calculateAdDeductions
};
