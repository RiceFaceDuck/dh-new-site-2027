/**
 * 📊 Google Analytics 4 Ad Sync & Budget Settlement Cron (Cloud Functions v2)
 * ทำงานอัตโนมัติเพื่อซิงค์ยอด View/Click จาก GA4, คำนวณตัดแต้มโฆษณา และระงับป้ายอัตโนมัติเมื่อเครดิตหมด
 * 
 * 🏗️ สถาปัตยกรรม Hybrid Dual-Engine:
 * - Engine A (Fast Guard): หน้าบ้านรวบยอดส่ง recordAdTelemetry ตัดแต้ม/ปิดป้ายแบบ Real-time
 * - Engine B (Periodic Auditor): ฟังก์ชันนี้ทำหน้าที่ดึงตัวเลขที่ผ่านการกรองบอทจาก GA4 Data API
 *   แบบ Single-Batch Aggregated Query ทุก 4 ชั่วโมง เพื่อสอบทานตัวเลขสะสมและประหยัดโควต้าสูงสุด
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

/**
 * 🛰️ ดึงสถิติรวมของโฆษณาและร้านค้าจาก GA4 Data API v1beta
 * ใช้วิธี Single-Batch Aggregated Query เพื่อประหยัด Token และจำนวนคำขอ (<0.5% ของ Daily Quota)
 * 
 * @param {string} propertyId - GA4 Property ID
 * @returns {Promise<{adStats: object, storeStats: object, propertyQuota: object}|null>}
 */
async function fetchGA4AggregatedStats(propertyId) {
  if (!propertyId) {
    console.warn("⚠️ [GA4AdSyncCron] No GA4_PROPERTY_ID configured. Skipping remote GA4 Data API fetch.");
    return null;
  }

  try {
    const { BetaAnalyticsDataClient } = require("@google-analytics/data");
    const analyticsDataClient = new BetaAnalyticsDataClient();

    // 1. ดึงสถิติยอดวิวและคลิกแยกตาม ad_id (ad_impression และ ad_click) รวบก้อนเดียวทั้งระบบ
    const [adReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "2025-01-01", endDate: "today" }],
      dimensions: [
        { name: "customEvent:ad_id" },
        { name: "eventName" }
      ],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: {
            values: ["ad_impression", "ad_click"]
          }
        }
      }
    });

    const adStats = {};
    if (adReport && adReport.rows) {
      for (const row of adReport.rows) {
        const adId = row.dimensionValues?.[0]?.value;
        const eventName = row.dimensionValues?.[1]?.value;
        const count = parseInt(row.metricValues?.[0]?.value || "0", 10);

        if (!adId || adId === "(not set)") continue;
        if (!adStats[adId]) adStats[adId] = { views: 0, clicks: 0 };

        if (eventName === "ad_impression") {
          adStats[adId].views = count;
        } else if (eventName === "ad_click") {
          adStats[adId].clicks = count;
        }
      }
    }

    // 2. ดึงสถิติยอดเข้าชมหน้าร้านค้าแยกตาม store_id (store_profile_view)
    const [storeReport] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "2025-01-01", endDate: "today" }],
      dimensions: [{ name: "customEvent:store_id" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: {
            value: "store_profile_view"
          }
        }
      }
    });

    const storeStats = {};
    if (storeReport && storeReport.rows) {
      for (const row of storeReport.rows) {
        const storeId = row.dimensionValues?.[0]?.value;
        const count = parseInt(row.metricValues?.[0]?.value || "0", 10);
        if (storeId && storeId !== "(not set)") {
          storeStats[storeId] = count;
        }
      }
    }

    // ตรวจสอบโควต้าคงเหลือ (Circuit Breaker)
    const quota = adReport?.propertyQuota;
    if (quota?.tokensPerDay) {
      console.log(`📊 [GA4AdSyncCron] GA4 Quota Tokens Remaining: ${quota.tokensPerDay.remaining || "N/A"}`);
    }

    return { adStats, storeStats, propertyQuota: quota };
  } catch (err) {
    console.warn("⚠️ [GA4AdSyncCron] GA4 Data API fetch error (fallback gracefully):", err.message);
    return null;
  }
}

/**
 * ฟังก์ชันหลักในการซิงค์ยอดวิว/คลิก และตัดงบโฆษณา
 * @param {object} db - Firestore Admin Instance
 * @param {object} options - อ็อปชันเพิ่มเติม (เช่น incomingStats หรือ forceAudit สำหรับทดสอบ)
 * @returns {object} ผลการประมวลผล
 */
const syncGA4AdStatsLogic = async (db, options = {}) => {
  const startTime = Date.now();
  console.log("📊 [GA4AdSyncCron] Starting GA4 Ad Stats Synchronization & Budget Settlement...");

  const results = {
    totalAdsProcessed: 0,
    totalDeductions: 0,
    adsPaused: 0,
    storesReconciled: 0,
    errors: [],
    durationMs: 0
  };

  try {
    // 1. ดึงการตั้งค่าราคาค่าโฆษณาและรหัส GA4 จาก settings/credit_config
    const configSnap = await db.collection("settings").doc("credit_config").get();
    const rawData = configSnap.exists ? configSnap.data() : {};
    const configData = rawData.config || rawData.creditConfig || rawData || {};
    const costPerClick = Number(configData.adClickCost ?? 15);
    const costPerImpressionBatch = Number(configData.adImpressionCost ?? 15); // มาตรฐาน 15 แต้มต่อ 100 views
    const impressionBatchSize = Number(configData.adImpressionCount ?? 100);
    const ga4PropertyId = process.env.GA4_PROPERTY_ID || configData.ga4PropertyId || configData.ga4_property_id || "";

    // 2. ดึงข้อมูลสถิติจาก GA4 Data API (ถ้ามี propertyId) หรือใช้อ็อปชันที่ส่งเข้ามา
    let remoteData = null;
    if (options.incomingStats) {
      remoteData = { adStats: options.incomingStats, storeStats: {} };
    } else if (ga4PropertyId) {
      remoteData = await fetchGA4AggregatedStats(ga4PropertyId);
    }

    const incomingStats = remoteData?.adStats || options.incomingStats || {};
    const storeStats = remoteData?.storeStats || {};

    // 3. ดึงโฆษณาที่กำลังทำงานอยู่ (Active Ads) จาก Single Source of Truth: partner_ads
    const adsSnap = await db.collection("partner_ads")
      .where("status", "in", ["active", "APPROVED", "approved", "ACTIVE"])
      .get();

    let totalSystemDeduction = 0;

    if (!adsSnap.empty) {
      for (const adDoc of adsSnap.docs) {
        const adId = adDoc.id;
        const adData = adDoc.data();
        const ownerId = adData.ownerId;

        // 🛡️ Safety Guard: Skip partner ads with undefined owner IDs
        if (!ownerId) {
          console.warn(`⚠️ [GA4AdSyncCron] Skipping ad ${adId} because ownerId is undefined.`);
          results.totalAdsProcessed++;
          continue;
        }

        const currentStats = adData.stats || { views: 0, clicks: 0 };
        const currentViews = Number(currentStats.views || 0);
        const currentClicks = Number(currentStats.clicks || 0);
        const creditLimit = Number(adData.creditLimit || -1); // -1 = Unlimited
        const spentBudget = Number(adData.spentBudget || 0);

        // ตรวจสอบว่ามีสถิติใหม่เข้ามาหรือไม่
        const statsUpdate = incomingStats[adId];
        if (!statsUpdate && !options.forceAudit) {
          results.totalAdsProcessed++;
          continue;
        }

        const newViews = statsUpdate ? Math.max(currentViews, Number(statsUpdate.views || currentViews)) : currentViews;
        const newClicks = statsUpdate ? Math.max(currentClicks, Number(statsUpdate.clicks || currentClicks)) : currentClicks;

        const deltaViews = newViews - currentViews;
        const deltaClicks = newClicks - currentClicks;

        if (deltaViews <= 0 && deltaClicks <= 0 && !options.forceAudit) {
          results.totalAdsProcessed++;
          continue;
        }

        // คำนวณแต้มที่ต้องหัก
        const clickDeduct = deltaClicks * costPerClick;
        const viewDeduct = Math.floor(deltaViews / impressionBatchSize) * costPerImpressionBatch;
        const totalDeduct = clickDeduct + viewDeduct;

        // ทำการหักแต้มและอัปเดตสถานะด้วย Firestore Transaction
        await db.runTransaction(async (transaction) => {
          const freshAdSnap = await transaction.get(adDoc.ref);
          if (!freshAdSnap.exists) return;
          const freshAd = freshAdSnap.data();

          const userRef = db.collection("users").doc(ownerId);
          const userSnap = await transaction.get(userRef);
          const userData = userSnap.exists ? userSnap.data() : {};

          const currentPoints = Number(userData.creditPoints || 0);
          const newSpent = (Number(freshAd.spentBudget || 0)) + totalDeduct;
          let isExhausted = false;

          // 1. ตรวจสอบเพดานงบประมาณของแคมเปญโฆษณา
          if (creditLimit > 0 && newSpent >= creditLimit) {
            isExhausted = true;
          }

          // 2. 🛡️ Financial Shield: ตรวจสอบกระเป๋าเงินรวมของเจ้าของโฆษณา
          if (currentPoints <= 0 || (currentPoints - totalDeduct) <= 0) {
            isExhausted = true;
          }

          const adUpdate = {
            "stats.views": newViews,
            "stats.clicks": newClicks,
            spentBudget: newSpent,
            lastGaSyncAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
          };

          if (isExhausted) {
            adUpdate.status = "OUT_OF_CREDIT";
            adUpdate.isActive = false;
          }

          transaction.update(adDoc.ref, adUpdate);

          // ซิงค์คอลเลกชันสำรองถ้ามี
          if (freshAd.type === "BILLBOARD") {
            const bbRef = db.collection("billboard_ads").doc(adId);
            transaction.set(bbRef, adUpdate, { merge: true });
          } else if (freshAd.type === "PRODUCT_LINK") {
            const skuRef = db.collection("user_sku_ads").doc(adId);
            transaction.set(skuRef, adUpdate, { merge: true });
          } else if (freshAd.type === "BUSINESS_CARD" && isExhausted) {
            // หากเป็นนามบัตรร้านแล้วแต้มหมด ให้ปิดการแสดงผลใน ActivePartners ด้วย
            const partnerRef = db.collection("ActivePartners").doc(ownerId);
            transaction.set(partnerRef, { isActive: false, status: "OUT_OF_CREDIT", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
          }

          // ตัดยอดจาก creditPoints ของผู้ใช้
          if (totalDeduct > 0 && userSnap.exists) {
            const safeDeduct = Math.min(currentPoints, Math.round(totalDeduct));
            const newPoints = Math.max(0, currentPoints - safeDeduct);
            
            transaction.update(userRef, {
              creditPoints: newPoints,
              updatedAt: FieldValue.serverTimestamp()
            });

            totalSystemDeduction += safeDeduct;

            // บันทึกหลักฐานทางการบัญชีลง credit_transactions
            const txRef = db.collection("credit_transactions").doc();
            transaction.set(txRef, {
              transactionId: `TX-GA4-SYNC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              uid: ownerId,
              partnerId: ownerId,
              type: "deduct",
              category: "ads",
              module: "ga4_ad_sync",
              amount: totalDeduct,
              deltaViews,
              deltaClicks,
              referenceId: adId,
              note: `สอบทานยอด GA4: วิวใหม่ +${deltaViews}, คลิกใหม่ +${deltaClicks}`,
              timestamp: FieldValue.serverTimestamp()
            });
          }

          if (isExhausted) {
            results.adsPaused++;
            console.log(`🛑 [GA4AdSyncCron] Ad ${adId} exhausted budget (${newSpent}/${creditLimit}). Auto-paused.`);
          }
        });

        results.totalDeductions += totalDeduct;
        results.totalAdsProcessed++;
      }
    }

    // 4. 🛡️ Single-Update Ledger Parity: อัปเดต totalAllocated ใน settings/credit_config เพียง 1 ครั้งต่อรอบ (ป้องกัน Contention)
    if (totalSystemDeduction > 0) {
      try {
        await db.runTransaction(async (tx) => {
          const settingsRef = db.collection("settings").doc("credit_config");
          const snap = await tx.get(settingsRef);
          if (snap.exists) {
            const sData = snap.data();
            const ledger = sData.ledger || { systemPoolMax: 10000000, totalAllocated: 0, status: "SECURE" };
            const currentAllocated = Number(ledger.totalAllocated || 0);
            const newAllocated = Math.max(0, currentAllocated - totalSystemDeduction);

            tx.set(settingsRef, {
              ledger: {
                ...ledger,
                totalAllocated: newAllocated,
                lastAuditTime: FieldValue.serverTimestamp()
              },
              updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
          }
        });
        console.log(`⚖️ [GA4AdSyncCron] Consolidated ledger settlement completed. Decremented: ${totalSystemDeduction} Pts.`);
      } catch (ledgerErr) {
        console.warn("⚠️ [GA4AdSyncCron] Failed to update consolidated ledger:", ledgerErr.message);
      }
    }

    // 5. สอบทานยอดเข้าชมหน้าร้านค้า (Store Profile Views Reconciliation) จาก GA4
    const storeIds = Object.keys(storeStats);
    if (storeIds.length > 0) {
      for (const storeId of storeIds) {
        const gaViews = Number(storeStats[storeId] || 0);
        if (gaViews <= 0) continue;

        try {
          const profileRef = db.collection("users").doc(storeId).collection("storeProfile").doc("main");
          const profileSnap = await profileRef.get();
          if (profileSnap.exists) {
            const currentStoreViews = Number(profileSnap.data()?.viewCount || 0);
            if (gaViews > currentStoreViews) {
              const deltaStoreViews = gaViews - currentStoreViews;
              // ปรับยอดวิวให้ตรงกับ GA4 ทั้ง storeProfile และ ActivePartners
              await profileRef.update({
                viewCount: gaViews,
                updatedAt: FieldValue.serverTimestamp()
              });

              const activeRef = db.collection("ActivePartners").doc(storeId);
              const activeSnap = await activeRef.get();
              if (activeSnap.exists) {
                await activeRef.update({
                  viewCount: gaViews,
                  viewsCount: gaViews,
                  updatedAt: FieldValue.serverTimestamp()
                });
              }
              results.storesReconciled++;
              console.log(`🏪 [GA4AdSyncCron] Reconciled store ${storeId} views: ${currentStoreViews} -> ${gaViews} (+${deltaStoreViews})`);
            }
          }
        } catch (storeErr) {
          console.warn(`⚠️ [GA4AdSyncCron] Failed to reconcile store views for ${storeId}:`, storeErr.message);
        }
      }
    }

    results.durationMs = Date.now() - startTime;
    console.log(`✅ [GA4AdSyncCron] Completed sync: Processed=${results.totalAdsProcessed}, Deducted=${results.totalDeductions} Pts, Paused=${results.adsPaused}, StoresReconciled=${results.storesReconciled}`);
    return results;
  } catch (error) {
    console.error("🔥 [GA4AdSyncCron] Error during ad sync:", error);
    results.errors.push(error.message);
    results.durationMs = Date.now() - startTime;
    return results;
  }
};

/**
 * ⏰ Cloud Scheduler: รันซิงค์ยอดและตัดแต้มทุก 4 ชั่วโมง (Single-Batch Query ประหยัด Token สูงสุด)
 */
exports.ga4AdSyncCron = onSchedule(
  {
    schedule: "0 */4 * * *", // ทุกๆ 4 ชั่วโมง (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
    timeZone: "Asia/Bangkok",
    region: "asia-southeast1",
    retryCount: 1,
    memory: "256MiB"
  },
  async (event) => {
    const db = getFirestore();
    await syncGA4AdStatsLogic(db);
  }
);

/**
 * 🌐 Manual HTTP Trigger สำหรับผู้ดูแลระบบกดซิงค์ทดสอบได้ทันที
 */
exports.ga4AdSyncManual = onRequest(
  {
    region: "asia-southeast1",
    cors: true
  },
  async (req, res) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split("Bearer ")[1] : req.headers["x-cron-secret"];
    const cronSecret = process.env.INTERNAL_CRON_SECRET;
    if (!cronSecret || !token || token !== cronSecret) {
      res.status(401).json({ success: false, error: "Unauthorized: Invalid or missing cron secret" });
      return;
    }

    try {
      const db = getFirestore();
      const results = await syncGA4AdStatsLogic(db, { forceAudit: true });
      res.status(200).json({ success: true, results });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = {
  fetchGA4AggregatedStats,
  syncGA4AdStatsLogic,
  ga4AdSyncCron: exports.ga4AdSyncCron,
  ga4AdSyncManual: exports.ga4AdSyncManual
};
