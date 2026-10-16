import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, deleteDoc } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function normalizeDraftOrderId(rawId) {
  const str = String(rawId || '');
  const match = str.match(/^DH-TEMP-\d{6}-\d{6}-(\d{4})$/);
  if (match) {
    return `DH-TEMP-${match[1]}`;
  }
  return str;
}

async function run() {
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  console.log("✅ Signed in to Firestore");

  // 1. Check orders collection for any DH-TEMP-* long IDs or draft status issues
  const ordersSnap = await getDocs(collection(db, "orders"));
  let migratedCount = 0;

  for (const docSnap of ordersSnap.docs) {
    const data = docSnap.data();
    const currentDocId = docSnap.id;
    const currentOrderId = data.orderId || currentDocId;

    if (String(currentOrderId).startsWith("DH-TEMP-") || String(currentDocId).startsWith("DH-TEMP-")) {
      const shortOrderId = normalizeDraftOrderId(currentOrderId);
      const shortDocId = normalizeDraftOrderId(currentDocId);
      const stat = String(data.orderStatus || data.status || '').toLowerCase();
      const payStat = String(data.paymentStatus || '').toLowerCase();
      const isPaid = stat === 'paid' || stat === 'approved' || stat === 'completed' || payStat === 'paid';
      const isCancelled = stat === 'cancelled' || stat === 'void';

      console.log(`Found draft order: docId=${currentDocId}, orderId=${currentOrderId}, status=${data.orderStatus}`);

      const updatedData = {
        ...data,
        orderId: shortOrderId,
        ...( (!isPaid && !isCancelled) ? { orderStatus: 'Draft', status: 'Draft', isDraft: true } : {} )
      };

      if (shortDocId !== currentDocId) {
        await setDoc(doc(db, "orders", shortDocId), updatedData);
        await deleteDoc(doc(db, "orders", currentDocId));
        console.log(`🔄 Migrated document ${currentDocId} -> ${shortDocId} with status Draft`);
        migratedCount++;
      } else if (data.orderId !== shortOrderId || (!isPaid && !isCancelled && data.orderStatus !== 'Draft')) {
        await setDoc(doc(db, "orders", currentDocId), updatedData, { merge: true });
        console.log(`🔄 Updated document ${currentDocId} (orderId: ${shortOrderId}, status: Draft)`);
        migratedCount++;
      }
    }
  }

  // 2. Update catalogs/recent_orders
  const recentRef = doc(db, "catalogs", "recent_orders");
  const recentSnap = await getDoc(recentRef);
  if (recentSnap.exists()) {
    const recentData = recentSnap.data();
    if (Array.isArray(recentData.orders)) {
      let recentChanged = false;
      const updatedOrders = recentData.orders.map(o => {
        const oid = String(o.orderId || o.id || '');
        if (oid.startsWith('DH-TEMP-')) {
          const shortId = normalizeDraftOrderId(oid);
          const stat = String(o.orderStatus || o.status || '').toLowerCase();
          const payStat = String(o.paymentStatus || '').toLowerCase();
          const isPaid = stat === 'paid' || stat === 'approved' || stat === 'completed' || payStat === 'paid';
          const isCancelled = stat === 'cancelled' || stat === 'void';
          const nextOrderStat = (!isPaid && !isCancelled) ? 'Draft' : o.orderStatus;
          if (o.id !== shortId || o.orderId !== shortId || o.orderStatus !== nextOrderStat) {
            recentChanged = true;
            return {
              ...o,
              id: shortId,
              orderId: shortId,
              orderStatus: nextOrderStat,
              status: nextOrderStat,
              isDraft: !isPaid && !isCancelled
            };
          }
        }
        return o;
      });

      if (recentChanged) {
        await setDoc(recentRef, {
          ...recentData,
          orders: updatedOrders,
          version: Date.now()
        }, { merge: true });
        console.log("✅ Updated catalogs/recent_orders with concise DH-TEMP-XXXX ID and Draft status!");
      } else {
        console.log("ℹ️ catalogs/recent_orders already clean.");
      }
    }
  }

  // 3. Also check staff cloud pos_drafts in users/{uid}/private/pos_drafts
  const usersSnap = await getDocs(collection(db, "users"));
  for (const uDoc of usersSnap.docs) {
    const draftRef = doc(db, "users", uDoc.id, "private", "pos_drafts");
    const draftSnap = await getDoc(draftRef);
    if (draftSnap.exists()) {
      const dData = draftSnap.data();
      if (Array.isArray(dData.tabs)) {
        let tabsChanged = false;
        const newTabs = dData.tabs.map(t => {
          if (t && t.orderId && String(t.orderId).startsWith("DH-TEMP-")) {
            const shortId = normalizeDraftOrderId(t.orderId);
            const shortDocId = t.docId ? normalizeDraftOrderId(t.docId) : t.docId;
            if (shortId !== t.orderId || shortDocId !== t.docId) {
              tabsChanged = true;
              return { ...t, orderId: shortId, docId: shortDocId };
            }
          }
          return t;
        });
        if (tabsChanged) {
          await setDoc(draftRef, { ...dData, tabs: newTabs }, { merge: true });
          console.log(`✅ Updated pos_drafts for user ${uDoc.id}`);
        }
      }
    }
  }

  console.log(`🎉 Done! Total orders updated/migrated: ${migratedCount}`);
  process.exit(0);
}

run().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
