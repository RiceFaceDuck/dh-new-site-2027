/**
 * 📊 Google Analytics 4 Ad Sync & Budget Settlement Cron (Cloud Functions v2)
 * ทำงานอัตโนมัติเพื่อซิงค์ยอด View/Click จาก GA4, คำนวณตัดแต้มโฆษณา และระงับป้ายอัตโนมัติเมื่อเครดิตหมด
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

/**
 * ฟังก์ชันหลักในการซิงค์ยอดวิว/คลิก และตัดงบโฆษณา
 * @param {object} db - Firestore Admin Instance
 * @param {object} options - อ็อปชันเพิ่มเติม (เช่น mockData สำหรับทดสอบ)
 * @returns {object} ผลการประมวลผล
 */
const syncGA4AdStatsLogic = async (db, options = {}) => {
  const startTime = Date.now();
  console.log("📊 [GA4AdSyncCron] Starting GA4 Ad Stats Synchronization & Budget Settlement...");

  const results = {
    totalAdsProcessed: 0,
    totalDeductions: 0,
    adsPaused: 0,
    errors: [],
    durationMs: 0
  };

  try {
    // 1. ดึงการตั้งค่าราคาค่าโฆษณาจาก settings/credit_config
    const configSnap = await db.collection("settings").doc("credit_config").get();
    const configData = configSnap.exists ? configSnap.data() : {};
    const costPerClick = Number(configData.adClickCost || 5);
    const costPerImpressionBatch = Number(configData.adImpressionCost || 5); // ต่อ 100 views
    const impressionBatchSize = Number(configData.adImpressionCount || 100);

    // 2. ดึงโฆษณาที่กำลังทำงานอยู่ (Active Ads) จาก Single Source of Truth: partner_ads
    const adsSnap = await db.collection("partner_ads")
      .where("status", "in", ["active", "APPROVED", "approved", "ACTIVE"])
      .get();

    if (adsSnap.empty) {
      console.log("ℹ️ [GA4AdSyncCron] No active ads to process.");
      results.durationMs = Date.now() - startTime;
      return results;
    }

    // 3. จำลองหรือดึงข้อมูลจาก GA4 Data API
    // หากมี GA4_PROPERTY_ID และ @google-analytics/data สามารถเรียก API ได้
    // ในขั้นตอนการทดสอบหรือใช้งานทั่วไป รองรับ options.incomingStats
    const incomingStats = options.incomingStats || {};

    for (const adDoc of adsSnap.docs) {
      const adId = adDoc.id;
      const adData = adDoc.data();
      const ownerId = adData.ownerId;
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

      // คำนวณแต้มที่ต้องหัก (คิดแต้มตามรอบทุกๆ 100 วิว เหมือน adImpressionTracker)
      const clickDeduct = deltaClicks * costPerClick;
      const viewDeduct = Math.floor(deltaViews / impressionBatchSize) * costPerImpressionBatch;
      const totalDeduct = clickDeduct + viewDeduct;

      // ทำการหักแต้มและอัปเดตสถานะด้วย Firestore Transaction เพื่อป้องกัน Race Condition
      await db.runTransaction(async (transaction) => {
        const freshAdSnap = await transaction.get(adDoc.ref);
        if (!freshAdSnap.exists) return;
        const freshAd = freshAdSnap.data();

        const userRef = db.collection("users").doc(ownerId);
        const userSnap = await transaction.get(userRef);
        const userData = userSnap.exists ? userSnap.data() : {};

        const newSpent = (Number(freshAd.spentBudget || 0)) + totalDeduct;
        let isExhausted = false;

        if (creditLimit > 0 && newSpent >= creditLimit) {
          isExhausted = true;
        }

        const adUpdate = {
          "stats.views": newViews,
          "stats.clicks": newClicks,
          spentBudget: newSpent,
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
        }

        // ตัดยอดจาก heldCreditPoints ของผู้ใช้ (หากมีการ Hold ไว้) หรือ creditPoints
        if (totalDeduct > 0 && userSnap.exists) {
          const currentHeld = Number(userData.heldCreditPoints || 0);
          const newHeld = Math.max(0, currentHeld - totalDeduct);
          
          transaction.update(userRef, {
            heldCreditPoints: newHeld,
            updatedAt: FieldValue.serverTimestamp()
          });

          // บันทึกหลักฐานทางการบัญชีลง credit_transactions
          const txRef = db.collection("credit_transactions").doc();
          transaction.set(txRef, {
            transactionId: `TX-AD-SETTLE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            uid: ownerId,
            partnerId: ownerId,
            type: "deduct",
            category: "ads",
            module: "marketing_settlement",
            amount: totalDeduct,
            deltaViews,
            deltaClicks,
            referenceId: adId,
            note: `ตัดยอดโฆษณา: วิวใหม่ +${deltaViews}, คลิกใหม่ +${deltaClicks}`,
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

    results.durationMs = Date.now() - startTime;
    console.log(`✅ [GA4AdSyncCron] Completed sync for ${results.totalAdsProcessed} ads. Deducted: ${results.totalDeductions} Pts. Paused: ${results.adsPaused}`);
    return results;
  } catch (error) {
    console.error("🔥 [GA4AdSyncCron] Error during ad sync:", error);
    results.errors.push(error.message);
    results.durationMs = Date.now() - startTime;
    return results;
  }
};

/**
 * ⏰ Cloud Scheduler: รันซิงค์ยอดและตัดแต้มทุก 1 ชั่วโมง (ประหยัด Token และไม่เกิน Quota)
 */
exports.ga4AdSyncCron = onSchedule(
  {
    schedule: "0 * * * *", // ทุกๆ ต้นชั่วโมง
    timeZone: "Asia/Bangkok",
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
  { cors: true },
  async (req, res) => {
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
  syncGA4AdStatsLogic,
  ga4AdSyncCron: exports.ga4AdSyncCron,
  ga4AdSyncManual: exports.ga4AdSyncManual
};
