const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

/**
 * 🧹 Scheduled Function: purgeOldSlips
 * Runs daily at midnight to delete Firebase Storage slip blobs older than 60 days
 * that are already archived/backed up to Google Drive.
 */
exports.purgeOldSlips = onSchedule({ 
  schedule: "0 0 * * *", 
  timeZone: "Asia/Bangkok",
  region: "asia-southeast1"
}, async () => {
  const db = getFirestore();
  const bucket = getStorage().bucket();

  // คำนวณวันย้อนหลัง 60 วัน
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const cutoffTimestamp = Timestamp.fromDate(sixtyDaysAgo);

  console.log(`🧹 Starting purge of slips created before: ${sixtyDaysAgo.toISOString()}`);

  try {
    const snapshot = await db.collection('slip_records')
      .where('storageCleaned', '==', false)
      .where('createdAt', '<', cutoffTimestamp)
      .limit(100)
      .get();

    if (snapshot.empty) {
      console.log('✅ No old slips requiring cleanup.');
      return;
    }

    let cleanedCount = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const storageUrl = data.storageUrl;

      if (storageUrl) {
        try {
          // ดึง Storage Path จาก URL เช่น slips/DH-xxxx/123_456.webp
          const pathMatch = storageUrl.match(/\/o\/(slips%2F[^?]+)/) || storageUrl.match(/slips\/[^?]+/);
          if (pathMatch) {
            const rawPath = decodeURIComponent(pathMatch[1] || pathMatch[0]);
            await bucket.file(rawPath).delete({ ignoreNotFound: true });
            console.log(`🗑️ Deleted storage blob: ${rawPath}`);
          }
        } catch (delErr) {
          console.warn(`⚠️ Failed to delete storage blob for slip ${doc.id}:`, delErr.message);
        }
      }

      await doc.ref.update({
        storageCleaned: true,
        storageCleanedAt: Timestamp.now()
      });
      cleanedCount++;
    }

    console.log(`✅ Successfully cleaned up ${cleanedCount} old slip blobs.`);
  } catch (error) {
    console.error('❌ Error during purgeOldSlips execution:', error);
  }
});
