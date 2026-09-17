/**
 * 🌙 Nightly Chunk Guard & Auto-Rebuilder (Cloud Functions Scheduler)
 * ทำงานอัตโนมัติทุกคืน เวลา 03:00 น. (เวลาไทย) เพื่อตรวจสอบความสมบูรณ์และจัดเรียงก้อนแคตตาล็อก
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

/**
 * ฟังก์ชันหลักในการจัดระเบียบและสร้างก้อนแคตตาล็อกทั้งหมด (Self-Healing Chunk Rebuilder)
 * @param {object} db - Firestore Admin Instance
 * @returns {object} สรุปผลการทำงาน
 */
const rebuildAllChunksLogic = async (db) => {
  const startTime = Date.now();
  console.log("🌙 [NightlyChunkGuard] Starting Nightly Catalog Chunks Integrity Check & Rebuild...");

  const results = {
    homeShowcaseItems: 0,
    inventorySummaryItems: 0,
    categoriesRebuilt: 0,
    customersIndexed: 0,
    durationMs: 0
  };

  try {
    // -------------------------------------------------------------
    // 1. ดึงข้อมูลสินค้าทั้งหมดที่เปิดขาย (Active Products)
    // -------------------------------------------------------------
    const productsSnap = await db.collection("products").where("isActive", "!=", false).get();
    const allProducts = [];
    
    productsSnap.forEach(docSnap => {
      const data = docSnap.data();
      const sku = String(docSnap.id || data.sku || '').trim().toUpperCase();
      if (sku) {
        allProducts.push({
          sku,
          name: String(data.name || data.productName || '').trim(),
          price: Number(data.Price ?? data.price ?? data.wholesalePrice ?? 0),
          retailPrice: Number(data.retailPrice ?? data.price ?? data.Price ?? 0),
          stockQuantity: Number(data.stockQuantity ?? data.qty ?? 0),
          category: String(data.category || 'General').trim(),
          brand: String(data.brand || 'OEM').trim(),
          unit: String(data.unit || 'ชิ้น').trim(),
          images: Array.isArray(data.images) ? data.images.filter(Boolean) : (data.imageUrl ? [data.imageUrl] : []),
          sales30D: Number(data.salesHistory?.['30'] || 0),
          inStock: Number(data.stockQuantity ?? 0) > 0,
          updatedAt: data.updatedAt || null
        });
      }
    });

    console.log(`📦 [NightlyChunkGuard] Scanned ${allProducts.length} active products from database.`);

    // -------------------------------------------------------------
    // 2. สร้างก้อน `catalogs/home_showcase` (สินค้าเด่น/พร้อมขาย 60 รายการแรก)
    // -------------------------------------------------------------
    const inStockItems = allProducts.filter(p => p.inStock);
    const sortedHomeItems = (inStockItems.length >= 20 ? inStockItems : allProducts)
      .sort((a, b) => (b.sales30D || 0) - (a.sales30D || 0))
      .slice(0, 60);

    const homeChunkPayload = {
      chunkId: 'home_showcase',
      type: 'HOME_SHOWCASE',
      totalItems: sortedHomeItems.length,
      generatedAt: FieldValue.serverTimestamp(),
      items: sortedHomeItems.map(p => ({
        sku: p.sku,
        name: p.name,
        price: p.price,
        retailPrice: p.retailPrice,
        stockQuantity: p.stockQuantity,
        category: p.category,
        brand: p.brand,
        imageUrl: p.images[0] || null,
        inStock: p.inStock
      }))
    };

    await db.collection("catalogs").doc("home_showcase").set(homeChunkPayload, { merge: true });
    results.homeShowcaseItems = sortedHomeItems.length;

    // -------------------------------------------------------------
    // 3. สร้างก้อน `catalogs/inventory_summary_p1` (50 สินค้าแรกของคลังหลังบ้าน)
    // -------------------------------------------------------------
    const sortedInventory = [...allProducts]
      .sort((a, b) => a.sku.localeCompare(b.sku))
      .slice(0, 50);

    const inventoryChunkPayload = {
      chunkId: 'inventory_summary_p1',
      type: 'INVENTORY_SUMMARY',
      totalItems: sortedInventory.length,
      generatedAt: FieldValue.serverTimestamp(),
      items: sortedInventory
    };

    await db.collection("catalogs").doc("inventory_summary_p1").set(inventoryChunkPayload, { merge: true });
    results.inventorySummaryItems = sortedInventory.length;

    // -------------------------------------------------------------
    // 4. จัดกลุ่มหมวดหมู่สินค้าและสร้าง Category Chunks `catalogs/cat_*`
    // -------------------------------------------------------------
    const categoryMap = new Map();
    allProducts.forEach(p => {
      const catKey = (p.category || 'General').toLowerCase().trim();
      if (!categoryMap.has(catKey)) categoryMap.set(catKey, []);
      categoryMap.get(catKey).push(p);
    });

    let catCount = 0;
    for (const [catName, items] of categoryMap.entries()) {
      if (items.length >= 3) {
        const catChunk = {
          chunkId: `cat_${catName}`,
          category: catName,
          type: 'CATEGORY',
          totalItems: items.length,
          generatedAt: FieldValue.serverTimestamp(),
          items: items.slice(0, 50).map(p => ({
            sku: p.sku,
            name: p.name,
            price: p.price,
            retailPrice: p.retailPrice,
            stockQuantity: p.stockQuantity,
            brand: p.brand,
            imageUrl: p.images[0] || null,
            inStock: p.inStock
          }))
        };
        await db.collection("catalogs").doc(`cat_${catName}`).set(catChunk, { merge: true });
        catCount++;
      }
    }
    results.categoriesRebuilt = catCount;

    // -------------------------------------------------------------
    // 5. สรุปสารบัญลูกค้า `catalogs/customers_directory`
    // -------------------------------------------------------------
    const usersSnap = await db.collection("users").get();
    const customerList = [];

    usersSnap.forEach(docSnap => {
      const data = docSnap.data();
      const role = String(data.role || 'Customer').toLowerCase();
      if (['customer', 'member', 'partner', 'vip'].includes(role) || !data.role) {
        customerList.push({
          uid: docSnap.id,
          name: data.displayName || data.storeName || data.name || 'ลูกค้าทั่วไป',
          phone: data.phone || data.phoneNumber || '-',
          role: data.role || 'Customer',
          walletBalance: Number(data.walletBalance || data.creditBalance || 0),
          points: Number(data.points || data.rewardPoints || 0),
          lastOrderDate: data.lastOrderDate || null,
          sales30Days: Number(data.sales30Days || data.totalSpent30D || 0)
        });
      }
    });

    const customersDirectoryPayload = {
      chunkId: 'customers_directory',
      totalCustomers: customerList.length,
      generatedAt: FieldValue.serverTimestamp(),
      customers: customerList
    };

    await db.collection("catalogs").doc("customers_directory").set(customersDirectoryPayload, { merge: true });
    results.customersIndexed = customerList.length;

    // -------------------------------------------------------------
    // 6. อัปเดตเวอร์ชัน Metadata กลาง (Broadcast Sync Signal)
    // -------------------------------------------------------------
    const metaRef = db.collection("settings").doc("inventory_meta");
    await metaRef.set({
      version: FieldValue.increment(1),
      lastUpdated: FieldValue.serverTimestamp(),
      lastAction: 'nightly_chunk_guard_auto_rebuild',
      recentUpdatedSkus: []
    }, { merge: true });

    results.durationMs = Date.now() - startTime;
    console.log(`✅ [NightlyChunkGuard] Complete in ${results.durationMs}ms!`, results);

    return { success: true, ...results };
  } catch (error) {
    console.error("🔥 [NightlyChunkGuard] Error rebuilding chunks:", error);
    throw error;
  }
};

/**
 * ⏰ 1. Scheduled Cloud Function (Runs every day at 03:00 AM Bangkok Time)
 */
exports.nightlyChunkGuard = onSchedule({
  schedule: "0 3 * * *",
  timeZone: "Asia/Bangkok",
  memory: "512MiB",
  timeoutSeconds: 300,
  retryCount: 3
}, async (event) => {
  const db = getFirestore();
  return await rebuildAllChunksLogic(db);
});

/**
 * ⚡ 2. HTTP On-Demand Trigger (For manual testing or admin on-demand trigger)
 */
exports.rebuildAllChunksManual = onRequest({
  cors: true,
  memory: "512MiB",
  timeoutSeconds: 300
}, async (req, res) => {
  const db = getFirestore();
  try {
    const summary = await rebuildAllChunksLogic(db);
    res.status(200).json({ status: "success", data: summary });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});
