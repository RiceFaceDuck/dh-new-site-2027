/**
 * JSON Dump Extractor for Explorer MFR DB 1 Handoff Report
 */

import fs from 'fs';
import path from 'path';
import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { 
  getFirestore, doc, getDoc, collection, getDocs, query, where 
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

function serializeData(val) {
  if (val === null || val === undefined) return val;
  if (typeof val.toDate === 'function') return { _type: 'Timestamp', iso: val.toDate().toISOString() };
  if (val.seconds !== undefined && val.nanoseconds !== undefined) {
    return { _type: 'Timestamp', seconds: val.seconds, nanoseconds: val.nanoseconds, iso: new Date(val.seconds * 1000 + val.nanoseconds / 1e6).toISOString() };
  }
  if (Array.isArray(val)) return val.map(serializeData);
  if (typeof val === 'object') {
    const res = {};
    for (const k of Object.keys(val)) {
      res[k] = serializeData(val[k]);
    }
    return res;
  }
  return val;
}

async function dumpAll() {
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");

  const dump = {};

  // 1. Claims
  dump.claims = {};
  const claimIds = [
    { code: 'CLM-2608-O2-0001', id: 'IJoca8dJDmvZm7u0Sbo6' },
    { code: 'CLM-2607-O1-0002', id: 'nVrnTQ8BTxNyZEVXBSuU' },
    { code: 'RTN-2607-O3-0001', id: 'Ql6z5DaEQ9gW7JmYxnDs' },
    { code: 'CLM-2609-O3-0002', id: 'YR4lK8HMUZQKMW8dZeyu' }
  ];

  for (const c of claimIds) {
    const s = await getDoc(doc(db, 'claims', c.id));
    dump.claims[c.code] = {
      docId: c.id,
      exists: s.exists(),
      data: s.exists() ? serializeData(s.data()) : null
    };
  }

  // 2. System Log
  const logSnap = await getDoc(doc(db, 'system_logs', 'AOWLSC9cl8miRBFi817r'));
  dump.system_log = {
    docId: 'AOWLSC9cl8miRBFi817r',
    exists: logSnap.exists(),
    data: logSnap.exists() ? serializeData(logSnap.data()) : null
  };

  // 3. Todos
  dump.todos = {};
  const todoIds = ['IJoca8dJDmvZm7u0Sbo6', 'nVrnTQ8BTxNyZEVXBSuU', 'Ql6z5DaEQ9gW7JmYxnDs'];
  for (const tid of todoIds) {
    const s = await getDoc(doc(db, 'todos', tid));
    dump.todos[tid] = {
      docId: tid,
      exists: s.exists(),
      data: s.exists() ? serializeData(s.data()) : null
    };
  }

  // 4. Pending todos scan
  const qPending = query(collection(db, 'todos'), where('status', 'in', ['pending', 'pending_manager', 'waiting_item', 'processing', 'todo']));
  const pSnap = await getDocs(qPending);
  dump.pending_todos_count = pSnap.size;
  dump.pending_todos_all = [];
  dump.pending_todos_related_to_targets = [];

  pSnap.forEach(d => {
    const data = serializeData(d.data());
    const cId = data.payload?.claimId;
    const rId = data.payload?.returnId;
    dump.pending_todos_all.push({
      id: d.id,
      type: data.type,
      status: data.status,
      title: data.title,
      referenceId: data.referenceId,
      claimId: cId,
      returnId: rId
    });

    if (['CLM-2608-O2-0001', 'CLM-2607-O1-0002', 'RTN-2607-O3-0001', 'CLM-2609-O3-0002'].includes(cId) ||
        ['CLM-2608-O2-0001', 'CLM-2607-O1-0002', 'RTN-2607-O3-0001', 'CLM-2609-O3-0002'].includes(rId) ||
        todoIds.includes(d.id)) {
      dump.pending_todos_related_to_targets.push({
        id: d.id,
        status: data.status,
        type: data.type
      });
    }
  });

  const outPath = path.resolve('c:/_DH Notebook/.agents/teamwork/explorer_mfr_db_1/live_db_dump.json');
  fs.writeFileSync(outPath, JSON.stringify(dump, null, 2), 'utf8');
  console.log(`DUMP_WRITTEN_TO: ${outPath}`);
}

dumpAll().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
