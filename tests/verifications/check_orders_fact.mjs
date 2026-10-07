import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, collection, getDocs, doc, getDoc } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

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
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  
  // 1. Fetch all customers from catalogs/customers_directory
  const dirSnap = await getDoc(doc(db, "catalogs", "customers_directory"));
  const dirCustomers = dirSnap.data()?.customers || [];
  console.log(`Total customers in customers_directory: ${dirCustomers.length}`);

  // 2. Fetch all orders
  const ordersSnap = await getDocs(collection(db, "orders"));
  console.log(`Total orders in Firestore: ${ordersSnap.size}`);

  // Build order stats per customer UID and phone
  const statsByUid = new Map();
  const statsByPhone = new Map();

  ordersSnap.forEach(d => {
    const data = d.data();
    const orderTime = parseTime(data.createdAt || data.orderDate || data.updatedAt);
    const orderStatus = (data.status || data.orderStatus || '').toLowerCase();
    const paymentStatus = (data.paymentStatus || '').toLowerCase();
    const isCancelled = ['cancelled', 'void', 'deleted', 'ยกเลิก'].includes(orderStatus) || ['cancelled', 'ยกเลิก'].includes(paymentStatus);
    
    // We care about completed or paid orders, or any valid order
    const uid = data.customer?.uid || data.customerUid || data.customerId;
    const phone = cleanPhone(data.customer?.phone || data.customerPhone || data.phone);

    if (uid && uid !== 'WALK-IN') {
      const prev = statsByUid.get(uid) || { lastOrderDate: 0, orderCount: 0, orderId: null };
      if (!isCancelled && orderTime > prev.lastOrderDate) {
        prev.lastOrderDate = orderTime;
        prev.orderId = data.orderId || data.orderNumber || d.id;
      }
      prev.orderCount++;
      statsByUid.set(uid, prev);
    }

    if (phone && phone.length >= 9) {
      const prev = statsByPhone.get(phone) || { lastOrderDate: 0, orderCount: 0, orderId: null };
      if (!isCancelled && orderTime > prev.lastOrderDate) {
        prev.lastOrderDate = orderTime;
        prev.orderId = data.orderId || data.orderNumber || d.id;
      }
      prev.orderCount++;
      statsByPhone.set(phone, prev);
    }
  });

  console.log(`Distinct UIDs with orders: ${statsByUid.size}`);
  console.log(`Distinct Phones with orders: ${statsByPhone.size}`);

  // Match against directory customers
  let matchedCount = 0;
  dirCustomers.forEach((c, idx) => {
    const uidStats = statsByUid.get(c.uid) || statsByUid.get(c.id);
    const phoneStats = statsByPhone.get(cleanPhone(c.phone || c.phoneNumber));
    const matched = uidStats || phoneStats;

    const currentDisplayLastOrder = c.lastOrderDate;
    if (matched && matched.lastOrderDate > 0) {
      matchedCount++;
      console.log(`[#${idx + 1}] Customer: ${c.name || c.displayName} (${c.accountId || c.id}) | Phone: ${c.phone}`);
      console.log(`    Current in chunk lastOrderDate: ${currentDisplayLastOrder}`);
      console.log(`    FOUND ORDER in Firestore: Date=${new Date(matched.lastOrderDate).toISOString()} (${matched.lastOrderDate}) | Bill=${matched.orderId} | TotalOrders=${matched.orderCount}`);
    } else {
      if (currentDisplayLastOrder) {
        console.log(`[#${idx + 1}] Customer: ${c.name} has current lastOrderDate=${currentDisplayLastOrder} but no direct order match found in orders collection!`);
      }
    }
  });

  console.log(`\nTotal directory customers with actual matching orders in DB: ${matchedCount} / ${dirCustomers.length}`);
  process.exit(0);
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
