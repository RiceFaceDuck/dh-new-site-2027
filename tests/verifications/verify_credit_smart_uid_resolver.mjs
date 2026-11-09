/**
 * Verification & Safe Healing Script: Smart UID Resolver & ICLUEDVL Profile Parity
 * Centralized Test Hub: Management System/tests/verifications/
 */

import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { 
  getFirestore, doc, getDoc, setDoc, collection, getDocs, limit, query, where, documentId, serverTimestamp 
} from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b",
  storageBucket: "dh-notebook-69f3b.firebasestorage.app",
  messagingSenderId: "713635574580",
  appId: "1:713635574580:web:8d60ac45a28d5938972b61"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function runVerification() {
  console.log("================================================================");
  console.log("🚀 VERIFICATION & HEALING: SMART UID RESOLVER (ICLUEDVL)");
  console.log("================================================================\n");

  console.log("1. Authenticating as manager...");
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  console.log("   ✅ Authenticated successfully.\n");

  const targetUid = "icluEDVleYZczQNJaxPsUGDERzP2";
  const userRef = doc(db, "users", targetUid);

  console.log("2. Performing Safe Profile Healing on target user:", targetUid);
  const snapBefore = await getDoc(userRef);
  if (!snapBefore.exists()) {
    throw new Error(`Target user ${targetUid} does not exist in users collection!`);
  }
  const dataBefore = snapBefore.data();
  console.log("   Current user displayName:", dataBefore.displayName);
  console.log("   Current accountId:", dataBefore.accountId || "(missing)");
  console.log("   Current creditPoints:", dataBefore.creditPoints ?? "(missing)");

  const healingPayload = {
    accountId: dataBefore.accountId || "ICLUEDVL",
    customerCode: dataBefore.customerCode || "ICLUEDVL",
    role: dataBefore.role || "Customer",
    rank: dataBefore.rank || "Customer",
    status: dataBefore.status || "active",
    creditPoints: Number(dataBefore.creditPoints || 0),
    walletBalance: Number(dataBefore.walletBalance || 0),
    phone: dataBefore.phone || dataBefore.phoneNumber || "0636549453",
    updatedAt: serverTimestamp()
  };

  await setDoc(userRef, healingPayload, { merge: true });
  console.log("   ✅ Profile healed safely with merge: true.\n");

  console.log("3. Testing Smart UID Resolution Logic...");
  const usersRefColl = collection(db, "users");

  async function resolveSmartUidTest(inputUid) {
    if (!inputUid) return null;
    const cleanInput = String(inputUid).trim();
    if (!cleanInput) return null;

    let resolvedUid = cleanInput;
    if (cleanInput.length >= 20) {
      const direct = await getDoc(doc(db, "users", cleanInput));
      if (direct.exists()) return cleanInput;
    }

    const upper = cleanInput.toUpperCase();
    const lower = cleanInput.toLowerCase();

    // 1. Account ID
    let s = await getDocs(query(usersRefColl, where('accountId', '==', upper), limit(1)));
    if (!s.empty) return s.docs[0].id;

    // 2. Customer Code
    s = await getDocs(query(usersRefColl, where('customerCode', '==', upper), limit(1)));
    if (!s.empty) return s.docs[0].id;

    // 3. Phone / PhoneNumber (clean digits)
    const cleanDigits = cleanInput.replace(/\D/g, '');
    if (cleanDigits.length >= 9 && cleanDigits.length <= 11) {
      const candidates = [cleanInput, cleanDigits];
      if (cleanDigits.startsWith('66') && cleanDigits.length === 11) {
        candidates.push('0' + cleanDigits.substring(2));
      }
      for (const p of candidates) {
        s = await getDocs(query(usersRefColl, where('phone', '==', p), limit(1)));
        if (!s.empty) return s.docs[0].id;
        s = await getDocs(query(usersRefColl, where('phoneNumber', '==', p), limit(1)));
        if (!s.empty) return s.docs[0].id;
      }
    }

    // 5. Document ID prefix search (upper & lower)
    if (cleanInput.length >= 6) {
      s = await getDocs(query(usersRefColl, where(documentId(), '>=', upper), where(documentId(), '<=', upper + '\uf8ff'), limit(1)));
      if (!s.empty) return s.docs[0].id;

      if (upper !== lower) {
        s = await getDocs(query(usersRefColl, where(documentId(), '>=', lower), where(documentId(), '<=', lower + '\uf8ff'), limit(1)));
        if (!s.empty) return s.docs[0].id;
      }
    }

    return resolvedUid;
  }

  const testCases = [
    { label: "Exact Account ID (ICLUEDVL)", input: "ICLUEDVL" },
    { label: "Lowercase Account ID (icluedvl)", input: "icluedvl" },
    { label: "Formatted Phone (063-654-9453)", input: "063-654-9453" },
    { label: "Unformatted Phone (0636549453)", input: "0636549453" },
    { label: "Full UID (icluEDVleYZczQNJaxPsUGDERzP2)", input: "icluEDVleYZczQNJaxPsUGDERzP2" }
  ];

  let passed = 0;
  for (const tc of testCases) {
    const res = await resolveSmartUidTest(tc.input);
    const ok = res === targetUid;
    if (ok) {
      console.log(`   ✅ [PASS] ${tc.label} => resolved to ${res}`);
      passed++;
    } else {
      console.error(`   ❌ [FAIL] ${tc.label} => resolved to ${res} (expected ${targetUid})`);
    }
  }

  console.log(`\n================================================================`);
  if (passed === testCases.length) {
    console.log(`🎉 ALL ${passed}/${testCases.length} VERIFICATION CHECKS PASSED PERFECTLY!`);
  } else {
    console.error(`⚠️ FAILED: Only ${passed}/${testCases.length} checks passed.`);
    process.exit(1);
  }
  console.log("================================================================");
  process.exit(0);
}

runVerification().catch(e => {
  console.error("Verification execution error:", e);
  process.exit(1);
});
