import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { 
  getFirestore, doc, getDoc, collection, getDocs, limit, query, where 
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

async function inspect() {
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  
  console.log("=== 1. CHECKING TARGET CODES IN TODOS & CLAIMS ===");
  const targetCodes = ['CLM-2608-O2-0001', 'CLM-2607-O1-0002', 'RTN-2607-O3-0001'];
  for (const code of targetCodes) {
    console.log(`\nTARGET: ${code}`);
    // Check todos
    const snapTodo1 = await getDoc(doc(db, 'todos', code));
    console.log(`- todos direct doc [${code}]: exists=${snapTodo1.exists()}`);
    const qTodoClaim = await getDocs(query(collection(db, 'todos'), where('payload.claimId', '==', code)));
    console.log(`- todos where payload.claimId == ${code}: count=${qTodoClaim.size}`);
    qTodoClaim.forEach(d => console.log(`  todo doc ${d.id}:`, JSON.stringify(d.data())));
    const qTodoRtn = await getDocs(query(collection(db, 'todos'), where('payload.returnId', '==', code)));
    console.log(`- todos where payload.returnId == ${code}: count=${qTodoRtn.size}`);
    qTodoRtn.forEach(d => console.log(`  todo doc ${d.id}:`, JSON.stringify(d.data())));

    // Check claims
    const snapClaim1 = await getDoc(doc(db, 'claims', code));
    console.log(`- claims direct doc [${code}]: exists=${snapClaim1.exists()}`);
    const qClaim = await getDocs(query(collection(db, 'claims'), where('payload.claimId', '==', code)));
    console.log(`- claims where payload.claimId == ${code}: count=${qClaim.size}`);
    qClaim.forEach(d => console.log(`  claim doc ${d.id}: type=${d.data().type}, status=${d.data().status}`));
    const qRtn = await getDocs(query(collection(db, 'claims'), where('payload.returnId', '==', code)));
    console.log(`- claims where payload.returnId == ${code}: count=${qRtn.size}`);
    qRtn.forEach(d => console.log(`  claim doc ${d.id}: type=${d.data().type}, status=${d.data().status}`));
  }

  console.log("\n=== 2. ALL CLAIM/RETURN/CANCEL IN TODOS COLLECTION ===");
  const allTodosSnap = await getDocs(collection(db, 'todos'));
  console.log(`Total docs in 'todos': ${allTodosSnap.size}`);
  const claimTodos = [];
  allTodosSnap.forEach(d => {
    const data = d.data();
    const type = data.type || data.taskType || '';
    if (type.includes('CLAIM') || type.includes('RETURN') || type.includes('EXCHANGE') || (data.title && (data.title.includes('เคลม') || data.title.includes('คืน')))) {
      claimTodos.push({ id: d.id, type, status: data.status, title: data.title, ref: data.referenceId, payload: data.payload });
    }
  });
  console.log(`Total claim/return related in 'todos': ${claimTodos.length}`);
  console.log(JSON.stringify(claimTodos, null, 2));

  console.log("\n=== 3. ALL TODOS CURRENTLY PENDING MANAGER ===");
  const pendingTodos = [];
  allTodosSnap.forEach(d => {
    const data = d.data();
    if (['pending_manager', 'pending', 'waiting_item', 'processing'].includes(data.status)) {
      pendingTodos.push({ id: d.id, type: data.type || data.taskType, status: data.status, title: data.title });
    }
  });
  console.log(`Total pending_manager/active in 'todos': ${pendingTodos.length}`);
  console.log(JSON.stringify(pendingTodos, null, 2));

  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
