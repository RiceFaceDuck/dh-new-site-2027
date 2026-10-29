import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, doc, getDoc, collection, getDocs } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

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

async function inspectPartners() {
  console.log("=== Fact-Check: Checking 43 Active Partners Points Balance ===");
  try {
    await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
    
    // Check ActivePartners collection
    const activeSnap = await getDocs(collection(db, "ActivePartners"));
    console.log(`ActivePartners docs count: ${activeSnap.size}`);

    let withPoints = 0;
    let withoutPoints = 0;
    const list = [];

    activeSnap.forEach(d => {
      const data = d.data();
      const points = Number(data.points || data.creditPoints || 0);
      if (points > 0) withPoints++; else withoutPoints++;
      list.push({ id: d.id, name: data.name || data.shopName || data.title, points });
    });

    console.log(`Partners with points > 0: ${withPoints}`);
    console.log(`Partners with points <= 0: ${withoutPoints}`);
    console.log("Sample 5 partners:", list.slice(0, 5));

  } catch (err) {
    console.error("Error inspecting partners:", err);
  } finally {
    process.exit(0);
  }
}

inspectPartners();
