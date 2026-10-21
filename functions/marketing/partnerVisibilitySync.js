/**
 * 🛰️ Partner Visibility Sync (Cloud Functions v2)
 * Single guard that keeps the storefront radar (`ActivePartners` + `catalogs/active_partners_bundle`)
 * consistent with the owner's real credit (`users/{uid}.creditPoints`) and pause/close state.
 *
 * - onUserCreditChanged: creditPoints changes -> sync ActivePartners.points; if <= 0 -> hide store + pause active ads.
 * - onActivePartnerWritten: any ActivePartners write/delete -> self-heal points, hide zero-credit, sync bundle item.
 */

const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const REGION = "asia-southeast1";
const ACTIVE_AD_STATUSES = ["active", "ACTIVE", "APPROVED", "approved"];
const BUNDLE_LIMIT = 100;

const toCredit = (userData) => Number(userData?.creditPoints || 0) || 0;

/** Pause every active ad of the owner (OUT_OF_CREDIT) and remove the store from the radar. */
const hidePartnerForNoCredit = async (db, uid) => {
  const batch = db.batch();
  const adsSnap = await db.collection("partner_ads")
    .where("ownerId", "==", uid)
    .where("status", "in", ACTIVE_AD_STATUSES)
    .get();
  adsSnap.forEach((adDoc) => {
    batch.update(adDoc.ref, { status: "OUT_OF_CREDIT", isActive: false, updatedAt: FieldValue.serverTimestamp() });
  });
  batch.delete(db.collection("ActivePartners").doc(uid));
  await batch.commit();
  console.log(`🛑 [partnerVisibilitySync] Hid zero-credit partner ${uid} (ads paused: ${adsSnap.size})`);
};

/** Restore paused ads (OUT_OF_CREDIT) and re-link ActivePartners if owner now has credit > 0. */
const restorePartnerForCredit = async (db, uid, credit, userData) => {
  const batch = db.batch();
  const outOfCreditAds = await db.collection("partner_ads")
    .where("ownerId", "==", uid)
    .where("status", "==", "OUT_OF_CREDIT")
    .get();

  let cardData = null;
  outOfCreditAds.forEach((adDoc) => {
    const ad = adDoc.data() || {};
    batch.update(adDoc.ref, { status: "active", isActive: true, updatedAt: FieldValue.serverTimestamp() });
    if (ad.type === "BUSINESS_CARD") {
      cardData = ad;
    }
  });

  const apRef = db.collection("ActivePartners").doc(uid);
  const apSnap = await apRef.get();

  if (apSnap.exists) {
    batch.update(apRef, { points: credit, isActive: true, updatedAt: FieldValue.serverTimestamp() });
    await batch.commit();
    const currentAp = { ...(apSnap.data() || {}), points: credit, isActive: true };
    await syncBundleItem(db, uid, toBundleItem(uid, currentAp));
  } else if (cardData) {
    const name = cardData.partnerName || cardData.title || userData?.storeName || userData?.accountName || userData?.displayName || "ร้านช่างพาร์ทเนอร์";
    const apData = {
      partnerId: uid,
      storeName: name,
      partnerName: name,
      services: cardData.services || cardData.description || "",
      phone: cardData.phone || userData?.phone || userData?.phoneNumber || "",
      messengerUrl: cardData.messengerUrl || userData?.messengerUrl || "",
      lineUrl: cardData.lineUrl || "",
      googleMapLink: cardData.googleMapLink || "",
      latitude: Number(cardData.latitude || 0),
      longitude: Number(cardData.longitude || 0),
      storeImage: cardData.imageUrl || userData?.photoURL || "",
      imageUrl: cardData.imageUrl || userData?.photoURL || "",
      address: cardData.address || "",
      landmarks: cardData.landmarks || "",
      richDescription: cardData.richDescription || "",
      galleryImages: Array.isArray(cardData.galleryImages) ? cardData.galleryImages : [],
      openHours: cardData.openHours || "",
      websiteUrl: cardData.websiteUrl || "",
      youtubeUrl: cardData.youtubeUrl || "",
      tiktokUrl: cardData.tiktokUrl || "",
      shopeeUrl: cardData.shopeeUrl || "",
      lazadaUrl: cardData.lazadaUrl || "",
      points: credit,
      viewsCount: Number(cardData.stats?.views || 0),
      isActive: true,
      isVerified: true,
      updatedAt: FieldValue.serverTimestamp()
    };
    batch.set(apRef, apData, { merge: true });
    await batch.commit();
    await syncBundleItem(db, uid, toBundleItem(uid, apData));
  } else if (outOfCreditAds.size > 0) {
    await batch.commit();
  }
  console.log(`🎉 [partnerVisibilitySync] Restored credit partner ${uid} (points: ${credit}, ads restored: ${outOfCreditAds.size})`);
};

/** Build the compact bundle item (same shape as nightlyChunkGuard). */
const toBundleItem = (id, p) => ({
  id,
  partnerId: p.partnerId || id,
  storeName: p.storeName || p.partnerName || "ร้านช่างพาร์ทเนอร์",
  partnerName: p.partnerName || p.storeName || "ร้านช่างพาร์ทเนอร์",
  services: p.services || "",
  phone: p.phone || "",
  messengerUrl: p.messengerUrl || "",
  lineUrl: p.lineUrl || "",
  googleMapLink: p.googleMapLink || p.googleMapsUrl || "",
  latitude: Number(p.latitude || 0),
  longitude: Number(p.longitude || 0),
  storeImage: p.storeImage || p.imageUrl || p.photoURL || "",
  imageUrl: p.imageUrl || p.storeImage || p.photoURL || "",
  address: p.address || "",
  landmarks: p.landmarks || "",
  openHours: p.openHours || "",
  points: Number(p.points || 0),
  viewsCount: Number(p.viewsCount || p.visitCount || 0),
  isVerified: p.isVerified === true,
  isActive: true
});

/** Remove (item = null) or upsert a partner inside catalogs/active_partners_bundle. Skips if bundle missing. */
const syncBundleItem = async (db, id, item) => {
  const bundleRef = db.collection("catalogs").doc("active_partners_bundle");
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(bundleRef);
    if (!snap.exists) return;
    const items = Array.isArray(snap.data().items) ? snap.data().items : [];
    const others = items.filter((i) => (i.id || i.partnerId) !== id);
    const existed = others.length !== items.length;
    if (!item && !existed) return; // nothing to remove
    const nextItems = item ? [item, ...others].slice(0, BUNDLE_LIMIT) : others;
    tx.set(bundleRef, {
      items: nextItems,
      bundledCount: nextItems.length,
      totalActivePartners: nextItems.length,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });
};

const onUserCreditChanged = onDocumentWritten({
  document: "users/{uid}",
  region: REGION
}, async (event) => {
  const after = event.data?.after?.data();
  const before = event.data?.before?.data();
  if (!after) return null;

  const newCredit = toCredit(after);
  if (before && toCredit(before) === newCredit) return null; // credit unchanged

  const uid = event.params.uid;
  const db = getFirestore();
  try {
    if (newCredit <= 0) {
      await hidePartnerForNoCredit(db, uid);
      return null;
    }
    await restorePartnerForCredit(db, uid, newCredit, after);
  } catch (error) {
    console.error(`[partnerVisibilitySync] onUserCreditChanged failed for ${uid}:`, error);
  }
  return null;
});

const onActivePartnerWritten = onDocumentWritten({
  document: "ActivePartners/{uid}",
  region: REGION
}, async (event) => {
  const uid = event.params.uid;
  const after = event.data?.after?.data();
  const db = getFirestore();

  try {
    // Deleted (paused / closed / no credit) or flagged inactive -> remove from bundle
    if (!after || after.isActive === false) {
      await syncBundleItem(db, uid, null);
      return null;
    }

    const userSnap = await db.collection("users").doc(uid).get();
    const credit = toCredit(userSnap.exists ? userSnap.data() : null);

    if (credit <= 0) {
      await hidePartnerForNoCredit(db, uid); // re-triggers this function with !after -> bundle cleanup
      return null;
    }

    if (Number(after.points) !== credit) {
      // Self-heal stale points; the resulting write re-triggers and syncs the bundle with correct points
      await event.data.after.ref.update({ points: credit, updatedAt: FieldValue.serverTimestamp() });
      return null;
    }

    await syncBundleItem(db, uid, toBundleItem(uid, after));
  } catch (error) {
    console.error(`[partnerVisibilitySync] onActivePartnerWritten failed for ${uid}:`, error);
  }
  return null;
});

module.exports = {
  onUserCreditChanged,
  onActivePartnerWritten
};
