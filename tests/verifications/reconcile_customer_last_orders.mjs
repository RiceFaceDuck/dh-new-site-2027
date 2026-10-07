import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function parseTime(val) {
  if (!val) return 0;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?.toDate === 'function') return val.toDate().getTime();
  if (val.seconds) return val.seconds * 1000;
  if (typeof val === 'number') return val;
  const p = new Date(val).getTime();
  return isNaN(p) ? 0 : p;
}

function cleanPhone(p) {
  return String(p || '').replace(/[^0-9]/g, '');
}

async function run() {
  console.log("🚀 [Customer Last Order Reconciliation] Connecting to Firestore...");
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  console.log("Authenticated as Manager.");

  // 1. Fetch all orders
  const ordersSnap = await getDocs(collection(db, "orders"));
  console.log(`Fetched ${ordersSnap.size} total orders.`);

  const statsByUid = new Map();
  const statsByPhone = new Map();

  ordersSnap.forEach(d => {
    const data = d.data();
    const orderTime = parseTime(data.createdAt || data.orderDate || data.updatedAt);
    const orderStatus = (data.status || data.orderStatus || '').toLowerCase();
    const paymentStatus = (data.paymentStatus || '').toLowerCase();
    const isCancelled = ['cancelled', 'void', 'deleted', 'ยกเลิก'].includes(orderStatus) || ['cancelled', 'ยกเลิก'].includes(paymentStatus);
    if (isCancelled || !orderTime) return;

    const uid = data.customer?.uid || data.customerUid || data.customerId;
    const phone = cleanPhone(data.customer?.phone || data.customerPhone || data.phone);
    const orderId = data.orderId || data.orderNumber || d.id;

    if (uid && uid !== 'WALK-IN') {
      const prev = statsByUid.get(uid) || { lastOrderDate: 0, orderId: null, orderCount: 0 };
      if (orderTime > prev.lastOrderDate) {
        prev.lastOrderDate = orderTime;
        prev.orderId = orderId;
      }
      prev.orderCount++;
      statsByUid.set(uid, prev);
    }

    if (phone && phone.length >= 9) {
      const prev = statsByPhone.get(phone) || { lastOrderDate: 0, orderId: null, orderCount: 0 };
      if (orderTime > prev.lastOrderDate) {
        prev.lastOrderDate = orderTime;
        prev.orderId = orderId;
      }
      prev.orderCount++;
      statsByPhone.set(phone, prev);
    }
  });

  // 2. Fetch catalogs/customers_directory
  const dirRef = doc(db, "catalogs", "customers_directory");
  const dirSnap = await getDoc(dirRef);
  if (!dirSnap.exists()) {
    console.error("❌ catalogs/customers_directory does not exist!");
    process.exit(1);
  }

  const dirData = dirSnap.data();
  const rawCustomers = Array.isArray(dirData.customers) ? dirData.customers : [];
  console.log(`Found ${rawCustomers.length} customers in customers_directory.`);

  let updatedCount = 0;
  const updatedCustomers = rawCustomers.map(c => {
    const uidMatch = statsByUid.get(c.uid) || statsByUid.get(c.id);
    const phoneMatch = statsByPhone.get(cleanPhone(c.phone || c.phoneNumber));
    const matched = uidMatch || phoneMatch;

    if (matched && matched.lastOrderDate > 0) {
      const oldDate = c.lastOrderDate || 0;
      const newDate = Math.max(oldDate, matched.lastOrderDate);
      if (newDate !== oldDate || !c.lastOrderId) {
        updatedCount++;
        return {
          ...c,
          lastOrderDate: newDate,
          lastOrderId: matched.orderId || c.lastOrderId || ''
        };
      }
    }
    return c;
  });

  console.log(`Reconciled ${updatedCount} customers with true latest order dates.`);

  // 3. Update catalogs/customers_directory
  await updateDoc(dirRef, {
    customers: updatedCustomers,
    lastReconciledAt: Date.now()
  });

  console.log("✅ catalogs/customers_directory successfully updated in Firestore!");
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Reconciliation error:", err);
  process.exit(1);
});
