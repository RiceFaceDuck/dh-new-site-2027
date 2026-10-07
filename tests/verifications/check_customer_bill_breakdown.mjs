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
  
  const dirSnap = await getDoc(doc(db, "catalogs", "customers_directory"));
  const dirCustomers = dirSnap.data()?.customers || [];

  const ordersSnap = await getDocs(collection(db, "orders"));

  const statsByUid = new Map();
  const statsByPhone = new Map();

  ordersSnap.forEach(d => {
    const data = d.data();
    const orderTime = parseTime(data.createdAt || data.orderDate || data.updatedAt);
    const orderStatus = (data.status || data.orderStatus || '').toLowerCase();
    const paymentStatus = (data.paymentStatus || '').toLowerCase();
    const isCancelled = ['cancelled', 'void', 'deleted', 'ยกเลิก'].includes(orderStatus) || ['cancelled', 'ยกเลิก'].includes(paymentStatus);
    
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

  const hasOrdersCurrentlyShowingDash = [];
  const genuinelyZeroOrders = [];
  const currentlyShowingDate = [];

  dirCustomers.forEach(c => {
    const uidStats = statsByUid.get(c.uid) || statsByUid.get(c.id);
    const phoneStats = statsByPhone.get(cleanPhone(c.phone || c.phoneNumber));
    const matched = uidStats || phoneStats;

    const isShownOnScreen = (c.lastOrderDate && c.lastOrderDate > 0);

    if (matched && matched.lastOrderDate > 0) {
      if (isShownOnScreen) {
        currentlyShowingDate.push({
          name: c.name || c.displayName,
          accountId: c.accountId,
          lastOrderDate: matched.lastOrderDate,
          orderId: matched.orderId,
          orderCount: matched.orderCount
        });
      } else {
        hasOrdersCurrentlyShowingDash.push({
          name: c.name || c.displayName,
          accountId: c.accountId,
          lastOrderDate: matched.lastOrderDate,
          orderId: matched.orderId,
          orderCount: matched.orderCount
        });
      }
    } else {
      genuinelyZeroOrders.push({
        name: c.name || c.displayName,
        accountId: c.accountId,
        phone: c.phone
      });
    }
  });

  console.log(`\n=== 1. แสดงผลถูกต้องอยู่แล้วบนหน้าเว็บ (${currentlyShowingDate.length} ราย) ===`);
  currentlyShowingDate.forEach(c => {
    const d = new Date(c.lastOrderDate);
    const thDate = d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
    console.log(`- ${c.name} (${c.accountId}): ${thDate} [${c.orderId}] (${c.orderCount} บิล)`);
  });

  console.log(`\n=== 2. มีบิลจริงในระบบ แต่หน้าเว็บขึ้นขีด (-) อยู่ (${hasOrdersCurrentlyShowingDash.length} ราย) ===`);
  hasOrdersCurrentlyShowingDash.forEach(c => {
    const d = new Date(c.lastOrderDate);
    const thDate = d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
    console.log(`- ${c.name} (${c.accountId}): ${thDate} [${c.orderId}] (${c.orderCount} บิล)`);
  });

  console.log(`\n=== 3. ไม่มีประวัติคำสั่งซื้อจริงๆ ในฐานข้อมูล (${genuinelyZeroOrders.length} ราย) ===`);
  genuinelyZeroOrders.forEach(c => {
    console.log(`- ${c.name} (${c.accountId}) [เบอร์: ${c.phone}]`);
  });

  process.exit(0);
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
