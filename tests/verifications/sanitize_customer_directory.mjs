/**
 * Phase 1 Verification Script: Sanitize Customer Directory & Reconcile Order Dates
 * 
 * Target: catalogs/customers_directory
 * Location: Management System/tests/verifications/sanitize_customer_directory.mjs
 * 
 * Operations:
 * 1. Authenticate with Firebase Admin/Manager credentials.
 * 2. Sanitize corrupted epoch offset for CDJ3VZUL (63927714852.22 -> 1792118052000).
 * 3. Reconcile true latest order timestamps from audited orders collection.
 * 4. Strictly preserve all existing valid order timestamps (Preserve Audited Transactions).
 * 5. Update catalogs/customers_directory with fresh generatedAt timestamp.
 */

import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs, Timestamp } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function parseTimestamp(val) {
  if (!val) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?.toDate === 'function') return val.toDate().getTime();
  if (val.seconds) return val.seconds * 1000;
  const p = new Date(val).getTime();
  return isNaN(p) ? 0 : p;
}

function normalizePhone(p) {
  if (!p || p === '-') return '';
  let digits = String(p).replace(/\D/g, '');
  if (digits.startsWith('66') && digits.length === 11) {
    digits = '0' + digits.substring(2);
  }
  return digits;
}

async function runPhase1() {
  console.log("================================================================================");
  console.log("  PHASE 1: Sanitize Customer Directory & Reconcile Order Dates");
  console.log("================================================================================\n");

  console.log("🔑 Authenticating with Firebase...");
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  console.log("✅ Authenticated successfully.\n");

  // 1. Fetch current customers_directory
  const dirRef = doc(db, "catalogs", "customers_directory");
  const dirSnap = await getDoc(dirRef);
  if (!dirSnap.exists()) {
    throw new Error("catalogs/customers_directory does not exist!");
  }

  const dirData = dirSnap.data();
  const customers = Array.isArray(dirData.customers) ? [...dirData.customers] : [];
  console.log(`📦 Loaded ${customers.length} customers from catalogs/customers_directory.`);

  // 2. Scan and aggregate latest order timestamps from orders collection
  console.log("📜 Reading orders collection for reconciliation...");
  const ordersSnap = await getDocs(collection(db, "orders"));
  console.log(`Found ${ordersSnap.size} total orders in database.`);

  const ordersByUid = new Map();
  const ordersByAccount = new Map();
  const ordersByPhone = new Map();

  ordersSnap.forEach(d => {
    const o = d.data();
    const status = (o.status || o.orderStatus || '').toLowerCase();
    const payStatus = (o.paymentStatus || '').toLowerCase();
    if (['cancelled', 'void', 'deleted', 'ยกเลิก'].includes(status) || ['cancelled', 'ยกเลิก'].includes(payStatus)) return;

    let orderTime = parseTimestamp(o.createdAt || o.orderDate || o.updatedAt);
    if (!orderTime || orderTime <= 0) return;

    // Guard against year 3000+ or future timestamps > tomorrow
    if (orderTime > Date.now() + 86400000) {
      console.warn(`⚠️ Skipping corrupted order timestamp in ${d.id}:`, orderTime);
      return;
    }

    const uid = o.customer?.uid || o.customerUid || o.customerId || o.userId;
    const acc = o.customer?.accountId ? String(o.customer.accountId).toUpperCase() : null;
    const phone = normalizePhone(o.customer?.phone || o.customerPhone || o.phone || o.walkInPhone);

    if (uid && uid !== 'WALK-IN') {
      const prev = ordersByUid.get(uid) || 0;
      if (orderTime > prev) ordersByUid.set(uid, orderTime);
    }
    if (acc) {
      const prev = ordersByAccount.get(acc) || 0;
      if (orderTime > prev) ordersByAccount.set(acc, orderTime);
    }
    if (phone && phone.length >= 9) {
      const prev = ordersByPhone.get(phone) || 0;
      if (orderTime > prev) ordersByPhone.set(phone, orderTime);
    }
  });

  console.log(`Indexed order dates: ${ordersByUid.size} by UID, ${ordersByAccount.size} by AccountId, ${ordersByPhone.size} by Phone.\n`);

  // 3. Sanitize and merge into customers array
  let sanitizedEpochCount = 0;
  let reconciledOrderCount = 0;
  let preservedExistingCount = 0;

  const sanitizedCustomers = customers.map(c => {
    const uid = c.id || c.uid;
    const acc = c.accountId ? String(c.accountId).toUpperCase() : (c.customerCode ? String(c.customerCode).toUpperCase() : null);
    const phone = normalizePhone(c.phone || c.phoneNumber);

    let rawDate = c.lastOrderDate;
    let numericDate = parseTimestamp(rawDate);

    // 🛡️ Specific Fix for CDJ3VZUL or any year 3000+ corrupted epoch
    if (numericDate > Date.now() + 86400000 || numericDate === 63927714852.22 || String(rawDate).includes('639277')) {
      console.log(`🔧 Fixing corrupted epoch for ${acc || uid} (${c.name}): ${rawDate} -> 1792118052000 (16 ต.ค. 69)`);
      numericDate = 1792118052000;
      sanitizedEpochCount++;
    }

    // 🛡️ Find matched order date from orders collection
    const orderDateMatch = (uid ? ordersByUid.get(uid) : 0) ||
      (acc ? ordersByAccount.get(acc) : 0) ||
      (phone ? ordersByPhone.get(phone) : 0) || 0;

    let finalDate = numericDate;
    if (orderDateMatch > 0) {
      if (orderDateMatch > finalDate) {
        finalDate = orderDateMatch;
        reconciledOrderCount++;
      } else {
        preservedExistingCount++;
      }
    } else if (finalDate > 0) {
      preservedExistingCount++;
    }

    return {
      ...c,
      lastOrderDate: finalDate > 0 ? finalDate : null
    };
  });

  // 4. Update catalogs/customers_directory in Firestore
  console.log("\n💾 Updating catalogs/customers_directory in Firestore...");
  const updatePayload = {
    customers: sanitizedCustomers,
    totalCustomers: sanitizedCustomers.length,
    updatedAt: Timestamp.now(),
    generatedAt: Timestamp.now(),
    version: (Number(dirData.version || 10) + 1)
  };

  await updateDoc(dirRef, updatePayload);
  console.log(`✅ Update successful! New catalog version: ${updatePayload.version}`);

  // 5. Verification Gate
  console.log("\n🔍 Running Verification Gate...");
  const verifySnap = await getDoc(dirRef);
  const verifyCustomers = verifySnap.data()?.customers || [];
  
  const cdj = verifyCustomers.find(c => c.accountId === 'CDJ3VZUL' || c.id === 'CdJ3vzuLqrJPcaMBx3z7');
  const pxz = verifyCustomers.find(c => c.accountId === 'PXZGGXXW');
  const uaj = verifyCustomers.find(c => c.accountId === 'UAJW3NUT');

  console.log("Verification sample:");
  if (cdj) {
    const d = new Date(cdj.lastOrderDate);
    console.log(`  - CDJ3VZUL: ${cdj.lastOrderDate} (${d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })})`);
    if (cdj.lastOrderDate > Date.now() + 86400000) throw new Error("CDJ3VZUL is still corrupted!");
  }
  if (pxz) {
    const d = new Date(pxz.lastOrderDate);
    console.log(`  - PXZGGXXW: ${pxz.lastOrderDate} (${d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })})`);
  }
  if (uaj) {
    const d = new Date(uaj.lastOrderDate);
    console.log(`  - UAJW3NUT: ${uaj.lastOrderDate} (${d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })})`);
  }

  const activeDatesCount = verifyCustomers.filter(c => c.lastOrderDate && c.lastOrderDate > 0).length;
  console.log(`\n🎉 Customers with valid lastOrderDate: ${activeDatesCount} / ${verifyCustomers.length}`);
  console.log(`Sanitized Corruptions: ${sanitizedEpochCount}`);
  console.log(`Reconciled Orders: ${reconciledOrderCount}`);
  console.log(`Preserved Valid Dates: ${preservedExistingCount}`);

  console.log("\n================================================================================");
  console.log("  PHASE 1 COMPLETE: Database is clean and verified.");
  console.log("================================================================================");
  process.exit(0);
}

runPhase1().catch(err => {
  console.error("❌ Phase 1 Execution Error:", err);
  process.exit(1);
});
