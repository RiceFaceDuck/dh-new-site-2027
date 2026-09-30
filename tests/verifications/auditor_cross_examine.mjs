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

async function crossExamine() {
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  
  const claimsSnap = await getDocs(collection(db, 'claims'));
  const todosSnap = await getDocs(collection(db, 'todos'));

  const todosMap = new Map();
  todosSnap.forEach(d => todosMap.set(d.id, d.data()));

  const claimsMap = new Map();
  claimsSnap.forEach(d => claimsMap.set(d.id, d.data()));

  console.log(`Total claims docs: ${claimsMap.size}`);
  console.log(`Total todos docs: ${todosMap.size}`);

  // Check how many claims docs have an exact ID match in todos
  let exactMatchCount = 0;
  const parityDiscrepancies = [];

  for (const [id, claim] of claimsMap.entries()) {
    if (todosMap.has(id)) {
      exactMatchCount++;
      const todo = todosMap.get(id);
      const isTypeDiff = claim.type !== todo.type;
      const isStatusDiff = claim.status !== todo.status;
      if (isTypeDiff || isStatusDiff) {
        parityDiscrepancies.push({
          id,
          code: claim.payload?.claimId || claim.payload?.returnId || claim.payload?.exchangeId,
          claimType: claim.type,
          todoType: todo.type,
          claimStatus: claim.status,
          todoStatus: todo.status,
          claimTitle: claim.title,
          todoTitle: todo.title
        });
      }
    }
  }

  console.log(`Claims with exact ID match in 'todos': ${exactMatchCount} / ${claimsMap.size}`);
  console.log(`Discrepancies between claims and todos (where both exist): ${parityDiscrepancies.length}`);
  console.log(JSON.stringify(parityDiscrepancies, null, 2));

  // Check todos that have claim/return types or titles but NO matching claim doc
  const orphanedClaimTodos = [];
  for (const [id, todo] of todosMap.entries()) {
    const type = todo.type || todo.taskType || '';
    if (type.includes('CLAIM') || type.includes('RETURN') || type.includes('EXCHANGE')) {
      if (!claimsMap.has(id)) {
        orphanedClaimTodos.push({
          id,
          type: todo.type,
          status: todo.status,
          title: todo.title,
          ref: todo.referenceId
        });
      }
    }
  }
  console.log(`\nTodos with claim/return types that do NOT exist in 'claims': ${orphanedClaimTodos.length}`);
  console.log(JSON.stringify(orphanedClaimTodos, null, 2));

  // Check claims that do NOT exist in todos
  const claimsNotInTodos = [];
  for (const [id, claim] of claimsMap.entries()) {
    if (!todosMap.has(id)) {
      claimsNotInTodos.push({
        id,
        type: claim.type,
        status: claim.status,
        code: claim.payload?.claimId || claim.payload?.returnId || claim.payload?.exchangeId
      });
    }
  }
  console.log(`\nClaims that do NOT exist in 'todos': ${claimsNotInTodos.length}`);
  console.log(JSON.stringify(claimsNotInTodos, null, 2));

  process.exit(0);
}

crossExamine().catch(err => {
  console.error(err);
  process.exit(1);
});
