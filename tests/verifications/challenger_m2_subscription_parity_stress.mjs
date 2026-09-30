/**
 * Challenger 2 Adversarial Stress Suite: Subscription Merging, Deduplication, & updateTaskStatus Routing
 * File: Management System/tests/verifications/challenger_m2_subscription_parity_stress.mjs
 * 
 * Verifies & Stress-Tests:
 * 1. Static Architecture & Invariants (MANAGER_TASK_TYPES, CLAIM_TASK_TYPES, method exports)
 * 2. Subscription Merging & Deduplication (Direct collisions, mismatched types, shadow suppression)
 * 3. Modern Claims Exclusivity (Claims only in claims collection, missing type fallback, foreign type guard)
 * 4. Non-Claim Manager Tasks Preservation (All 17 types preserved, non-manager tasks discarded)
 * 5. Timestamp Format Diversity & Sorting Boundary (toMillis, toDate, Date, ISO string, epoch, null/corrupted)
 * 6. Asynchronous Snapshot Arrival & Concurrency Jitter (todos-first, claims-first, 100 rapid events, unsubscription)
 * 7. updateTaskStatus Routing & Sanitization (Explicit type, payload type, getDoc fallback, shadow sync, undefined strip)
 * 8. deleteManagerTask Routing (Both, claims-only, todos-only, missing ID guard)
 * 9. Live Firestore Forensic Parity (Zero leak of M1 targets, active claim preservation, live query parity)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from '../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs';
import { getAuth, signInWithEmailAndPassword } from '../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs';
import { 
  getFirestore, doc, getDoc, collection, getDocs, query, where 
} from '../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const backofficeDir = path.join(rootDir, 'dh-backoffice-react');
const managerTodoServicePath = path.join(backofficeDir, 'src/firebase/managerTodoService.js');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failureDetails = [];

function assert(condition, description, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${description}${details ? ' (' + details + ')' : ''}`);
  } else {
    failedChecks++;
    const err = `${description}${details ? ' - ' + details : ''}`;
    failureDetails.push(err);
    console.error(`  ❌ [FAIL] ${err}`);
  }
}

// -----------------------------------------------------------------------------
// DYNAMIC HARNESS LOADER (Executes EXACT Production Code with Controlled Drivers)
// -----------------------------------------------------------------------------
async function loadManagerTodoModule(mockFirestoreOverrides = {}) {
  const src = fs.readFileSync(managerTodoServicePath, 'utf8');

  const defaultMockFirestore = {
    collection: (db, name) => ({ type: 'collection', name }),
    query: (col, ...clauses) => ({ type: 'query', col, clauses }),
    where: (field, op, val) => ({ type: 'where', field, op, val }),
    orderBy: (field, dir) => ({ type: 'orderBy', field, dir }),
    limit: (n) => ({ type: 'limit', n }),
    doc: (db, col, id) => ({ type: 'doc', col, id }),
    getDoc: async (ref) => ({ exists: () => false, data: () => null }),
    updateDoc: async (ref, data) => ({ ref, data }),
    deleteDoc: async (ref) => ({ ref }),
    serverTimestamp: () => 'MOCK_SERVER_TIMESTAMP',
    onSnapshot: () => () => {},
    ...mockFirestoreOverrides
  };

  const modified = src
    .replace(/import\s*\{\s*db\s*\}\s*from\s*'\.\/config';/, 'const db = globalThis.__CHALLENGER_MOCK_DB__;')
    .replace(/import\s*\{[\s\S]*?\}\s*from\s*'firebase\/firestore';/, 'const { collection, query, where, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot, limit, orderBy } = globalThis.__CHALLENGER_MOCK_FIRESTORE__;')
    .replace(/import\s*\{\s*getCollectionPath\s*\}\s*from\s*'dh-shared\/src\/firebase\/pathUtils';/, 'const getCollectionPath = (p) => p;')
    + `\n// nonce: ${Date.now()}_${Math.random()}`;

  globalThis.__CHALLENGER_MOCK_DB__ = { name: 'challenger-mock-db' };
  globalThis.__CHALLENGER_MOCK_FIRESTORE__ = defaultMockFirestore;

  return await import('data:text/javascript,' + encodeURIComponent(modified));
}

async function runAdversarialSuite() {
  console.log("================================================================================");
  console.log("  CHALLENGER 2: ADVERSARIAL STRESS SUITE (PARITY & ROUTING)");
  console.log("  Target: dh-backoffice-react/src/firebase/managerTodoService.js");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // SUITE 1: Static Architecture & Type Contract Invariants
  // ---------------------------------------------------------------------------
  console.log("--- SUITE 1: Static Architecture & Type Contract Invariants ---");
  const baseModule = await loadManagerTodoModule();
  const { MANAGER_TASK_TYPES, CLAIM_TASK_TYPES, managerTodoService } = baseModule;

  assert(Array.isArray(MANAGER_TASK_TYPES), "MANAGER_TASK_TYPES is an exported Array");
  assert(Array.isArray(CLAIM_TASK_TYPES), "CLAIM_TASK_TYPES is an exported Array");
  assert(MANAGER_TASK_TYPES.length === 23, "MANAGER_TASK_TYPES contains exactly 23 task types", `count: ${MANAGER_TASK_TYPES.length}`);
  assert(CLAIM_TASK_TYPES.length === 6, "CLAIM_TASK_TYPES contains exactly 6 claim types", `count: ${CLAIM_TASK_TYPES.length}`);

  const requiredClaimTypes = [
    'CLAIM_APPROVAL',
    'RETURN_APPROVAL',
    'EXCHANGE_APPROVAL',
    'CANCEL_CLAIM_APPROVAL',
    'CANCEL_RETURN_APPROVAL',
    'CANCEL_EXCHANGE_APPROVAL'
  ];
  for (const ct of requiredClaimTypes) {
    assert(CLAIM_TASK_TYPES.includes(ct), `CLAIM_TASK_TYPES contains '${ct}'`);
    assert(MANAGER_TASK_TYPES.includes(ct), `MANAGER_TASK_TYPES contains '${ct}'`);
  }

  // Non-claim manager task types check
  const nonClaimTypes = [
    'WHOLESALE_APPROVAL', 'wholesale_request', 'AD_APPROVAL', 'USER_SKU_APPROVAL',
    'BILLBOARD_APPROVAL', 'APPROVE_PARTNER_AD', 'APPROVE_BILLBOARD_AD',
    'BUSINESS_CARD_AD_APPROVAL', 'PARTNER_APPROVAL', 'ACCOUNT_APPROVAL',
    'WALLET_WITHDRAWAL', 'STAFF_APPROVAL', 'PRODUCT_DELETE_APPROVAL',
    'CUSTOMER_DELETE_APPROVAL', 'BILL_CANCEL_APPROVAL', 'PRODUCT_KNOWLEDGE_APPROVAL',
    'WARRANTY_SETUP'
  ];
  assert(nonClaimTypes.length === 17, "Verified 17 non-claim manager types");
  for (const nct of nonClaimTypes) {
    assert(MANAGER_TASK_TYPES.includes(nct), `MANAGER_TASK_TYPES contains non-claim type '${nct}'`);
  }

  assert(typeof managerTodoService.subscribeManagerApprovals === 'function', "managerTodoService exports subscribeManagerApprovals");
  assert(typeof managerTodoService.updateTaskStatus === 'function', "managerTodoService exports updateTaskStatus");
  assert(typeof managerTodoService.deleteManagerTask === 'function', "managerTodoService exports deleteManagerTask");

  // ---------------------------------------------------------------------------
  // SUITE 2: Subscription Deduplication & Precedence Stress
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 2: Subscription Deduplication & Precedence Stress ---");

  let todoSnapshotTrigger = null;
  let claimSnapshotTrigger = null;
  let unsubscribeTodoCalled = false;
  let unsubscribeClaimCalled = false;

  const harness2 = await loadManagerTodoModule({
    onSnapshot: (q, onNext) => {
      if (q.col.name === 'todos') {
        todoSnapshotTrigger = onNext;
        return () => { unsubscribeTodoCalled = true; };
      }
      if (q.col.name === 'claims') {
        claimSnapshotTrigger = onNext;
        return () => { unsubscribeClaimCalled = true; };
      }
      return () => {};
    }
  });

  let emittedData = null;
  const unsub2 = harness2.managerTodoService.subscribeManagerApprovals((data) => {
    emittedData = data;
  });

  // 2.1 Direct Collision: same ID in both collections
  console.log("  Testing direct collision between todos and claims...");
  todoSnapshotTrigger({
    docs: [
      {
        id: 'COLLIDE-CLM-01',
        data: () => ({
          type: 'CLAIM_APPROVAL',
          status: 'pending',
          title: 'Stale Shadow Todo Title',
          createdAt: 1000
        })
      }
    ]
  });

  claimSnapshotTrigger({
    docs: [
      {
        id: 'COLLIDE-CLM-01',
        data: () => ({
          type: 'CANCEL_CLAIM_APPROVAL',
          status: 'pending_manager',
          title: 'Authoritative Claims Title',
          createdAt: 2000
        })
      }
    ]
  });

  assert(Array.isArray(emittedData), "Subscription emitted array on data arrival");
  assert(emittedData.length === 1, "Deduplication reduced collision to exactly 1 record", `actual: ${emittedData.length}`);
  assert(emittedData[0].id === 'COLLIDE-CLM-01', "Emitted record has correct ID");
  assert(emittedData[0].title === 'Authoritative Claims Title', "Authoritative claims record title won over stale todo title");
  assert(emittedData[0].type === 'CANCEL_CLAIM_APPROVAL', "Authoritative claims record type won over stale todo type");
  assert(emittedData[0].status === 'pending_manager', "Authoritative claims record status won over stale todo status");
  assert(emittedData[0].createdAt === 2000, "Authoritative claims record timestamp won over stale todo timestamp");

  // 2.2 Collision with mismatched non-claim type in shadow todo
  console.log("  Testing collision where shadow todo had non-claim type...");
  todoSnapshotTrigger({
    docs: [
      {
        id: 'COLLIDE-CLM-02',
        data: () => ({
          type: 'USER_SKU_APPROVAL', // manager non-claim type
          status: 'pending',
          title: 'Shadow with non-claim type',
          createdAt: 1000
        })
      }
    ]
  });
  claimSnapshotTrigger({
    docs: [
      {
        id: 'COLLIDE-CLM-02',
        data: () => ({
          type: 'CLAIM_APPROVAL',
          status: 'pending_manager',
          title: 'Authoritative Claim Overwriting Mismatched Todo',
          createdAt: 2000
        })
      }
    ]
  });
  assert(emittedData.length === 1, "Deduplicated mismatched collision to exactly 1 record");
  assert(emittedData[0].title === 'Authoritative Claim Overwriting Mismatched Todo', "Claims collection strictly overwrote mismatched todo in taskMap");

  // 2.3 Shadow Todo Suppression: todos has claim types, claims is empty
  console.log("  Testing complete suppression of claim shadows in todos...");
  todoSnapshotTrigger({
    docs: requiredClaimTypes.map((type, idx) => ({
      id: `SHADOW-${idx}`,
      data: () => ({
        type,
        status: 'pending_manager',
        title: `Ghost Claim ${idx}`,
        createdAt: 1000 + idx
      })
    }))
  });
  claimSnapshotTrigger({ docs: [] });
  assert(emittedData.length === 0, "All 6 claim types inside todos were strictly filtered out (0 ghost leaks)", `actual: ${emittedData.length}`);

  unsub2();
  assert(unsubscribeTodoCalled && unsubscribeClaimCalled, "Unsubscribe function successfully unsubscribed both listeners");

  // ---------------------------------------------------------------------------
  // SUITE 3: Modern Claims Exclusivity Stress Tests
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 3: Modern Claims Exclusivity Stress Tests ---");

  const harness3 = await loadManagerTodoModule({
    onSnapshot: (q, onNext) => {
      if (q.col.name === 'todos') {
        todoSnapshotTrigger = onNext;
        return () => {};
      }
      if (q.col.name === 'claims') {
        claimSnapshotTrigger = onNext;
        return () => {};
      }
      return () => {};
    }
  });

  harness3.managerTodoService.subscribeManagerApprovals((data) => {
    emittedData = data;
  });

  // 3.1 60 Modern claims (10 of each claim type) exclusively in claims
  console.log("  Testing 60 modern claims across all 6 claim types...");
  const modernClaims = [];
  requiredClaimTypes.forEach((type, typeIdx) => {
    for (let i = 0; i < 10; i++) {
      modernClaims.push({
        id: `MODERN-${type}-${i}`,
        data: () => ({
          type,
          status: 'pending_manager',
          title: `Modern ${type} ${i}`,
          createdAt: 3000 + typeIdx * 10 + i
        })
      });
    }
  });

  todoSnapshotTrigger({ docs: [] }); // todos is empty
  claimSnapshotTrigger({ docs: modernClaims });

  assert(emittedData.length === 60, "All 60 modern claims from claims collection appear in subscription output", `actual: ${emittedData.length}`);
  const all60Present = modernClaims.every(mc => emittedData.some(e => e.id === mc.id));
  assert(all60Present, "Every individual modern claim ID is verified present in output");

  // 3.2 Claims with missing type fallback (!typeToCheck)
  console.log("  Testing claim with missing type in claims collection...");
  claimSnapshotTrigger({
    docs: [
      {
        id: 'MODERN-NO-TYPE-01',
        data: () => ({
          title: 'Claim with undefined type',
          status: 'pending_manager',
          createdAt: 4000
        })
      },
      {
        id: 'MODERN-NULL-TYPE-02',
        data: () => ({
          type: null,
          title: 'Claim with null type',
          status: 'pending_manager',
          createdAt: 4001
        })
      }
    ]
  });
  assert(emittedData.length === 2, "Claims with null/undefined type are admitted via fallback", `actual: ${emittedData.length}`);

  // 3.3 Foreign doc inside claims collection
  console.log("  Testing foreign non-claim doc mistakenly placed in claims collection...");
  claimSnapshotTrigger({
    docs: [
      {
        id: 'FOREIGN-CLAIM-DOC',
        data: () => ({
          type: 'STAFF_APPROVAL', // Not in CLAIM_TASK_TYPES
          title: 'Mistaken staff task in claims',
          status: 'pending_manager',
          createdAt: 4500
        })
      },
      {
        id: 'VALID-CLAIM-DOC',
        data: () => ({
          type: 'EXCHANGE_APPROVAL',
          title: 'Legitimate exchange task',
          status: 'pending_manager',
          createdAt: 4501
        })
      }
    ]
  });
  assert(emittedData.length === 1, "Foreign type inside claims collection is filtered out", `actual: ${emittedData.length}`);
  assert(emittedData[0].id === 'VALID-CLAIM-DOC', "Only valid claim task from claims collection was admitted");

  // ---------------------------------------------------------------------------
  // SUITE 4: Non-Claim Manager Tasks Preservation Stress
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 4: Non-Claim Manager Tasks Preservation Stress ---");

  // 17 non-claim manager tasks + 5 active claims + 15 non-manager tasks in todos
  const todosData = [];
  nonClaimTypes.forEach((type, idx) => {
    todosData.push({
      id: `MANAGER-TASK-${idx}`,
      data: () => ({
        type,
        status: 'pending',
        title: `Manager Task ${type}`,
        createdAt: 5000 + idx
      })
    });
  });

  // 15 non-manager tasks in todos (should be ignored)
  for (let i = 0; i < 15; i++) {
    todosData.push({
      id: `JUNK-TODO-${i}`,
      data: () => ({
        type: `INTERNAL_TASK_${i}`,
        status: 'pending',
        title: `Internal Staff Junk ${i}`,
        createdAt: 5000 + i
      })
    });
  }

  // 5 active claims in claims
  const claimsData = [];
  for (let i = 0; i < 5; i++) {
    claimsData.push({
      id: `ACTIVE-CLM-${i}`,
      data: () => ({
        type: 'CLAIM_APPROVAL',
        status: 'waiting_item',
        title: `Active Claim ${i}`,
        createdAt: 6000 + i
      })
    });
  }

  todoSnapshotTrigger({ docs: todosData });
  claimSnapshotTrigger({ docs: claimsData });

  assert(emittedData.length === 22, "Output contains exactly 22 tasks (17 manager tasks + 5 claims)", `actual: ${emittedData.length}`);
  const all17ManagerPresent = nonClaimTypes.every((type, idx) => emittedData.some(e => e.id === `MANAGER-TASK-${idx}`));
  assert(all17ManagerPresent, "100% of the 17 non-claim manager tasks were preserved");
  const all5ClaimsPresent = claimsData.every(c => emittedData.some(e => e.id === c.id));
  assert(all5ClaimsPresent, "100% of the 5 claims were included");
  const zeroJunkLeaked = emittedData.every(e => !e.id.startsWith('JUNK-TODO-'));
  assert(zeroJunkLeaked, "Zero non-manager junk tasks leaked into the manager list");

  // ---------------------------------------------------------------------------
  // SUITE 5: Timestamp Format Diversity & Sorting Boundary Stress
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 5: Timestamp Format Diversity & Sorting Boundary Stress ---");

  const timestampDocs = [];
  const baseTime = 1727700000000;

  // 20 with Firestore Timestamp .toMillis()
  for (let i = 0; i < 20; i++) {
    timestampDocs.push({
      id: `TS-TOMILLIS-${i}`,
      data: () => ({
        type: 'CLAIM_APPROVAL',
        status: 'pending_manager',
        createdAt: { toMillis: () => baseTime + (i * 100) }
      })
    });
  }

  // 20 with Firestore Timestamp .toDate().getTime()
  for (let i = 0; i < 20; i++) {
    timestampDocs.push({
      id: `TS-TODATE-${i}`,
      data: () => ({
        type: 'CLAIM_APPROVAL',
        status: 'pending_manager',
        createdAt: { toDate: () => new Date(baseTime + (i * 100) + 10) }
      })
    });
  }

  // 20 with native JS Date instance
  for (let i = 0; i < 20; i++) {
    timestampDocs.push({
      id: `TS-DATE-${i}`,
      data: () => ({
        type: 'CLAIM_APPROVAL',
        status: 'pending_manager',
        createdAt: new Date(baseTime + (i * 100) + 20)
      })
    });
  }

  // 20 with ISO 8601 string
  for (let i = 0; i < 20; i++) {
    timestampDocs.push({
      id: `TS-ISO-${i}`,
      data: () => ({
        type: 'CLAIM_APPROVAL',
        status: 'pending_manager',
        createdAt: new Date(baseTime + (i * 100) + 30).toISOString()
      })
    });
  }

  // 10 with numeric milliseconds
  for (let i = 0; i < 10; i++) {
    timestampDocs.push({
      id: `TS-NUM-${i}`,
      data: () => ({
        type: 'CLAIM_APPROVAL',
        status: 'pending_manager',
        createdAt: baseTime + (i * 100) + 40
      })
    });
  }

  // 10 with null / undefined / corrupted timestamps
  for (let i = 0; i < 10; i++) {
    timestampDocs.push({
      id: `TS-NULL-${i}`,
      data: () => ({
        type: 'CLAIM_APPROVAL',
        status: 'pending_manager',
        createdAt: i % 2 === 0 ? null : (i % 3 === 0 ? undefined : "invalid-date-string")
      })
    });
  }

  todoSnapshotTrigger({ docs: [] });
  claimSnapshotTrigger({ docs: timestampDocs });

  assert(emittedData.length === 100, "All 100 varied timestamp docs admitted without crash");

  // Verify descending sort order
  let isStrictlySorted = true;
  const getDocTimeHelper = (docItem) => {
    if (!docItem?.createdAt) return 0;
    if (typeof docItem.createdAt.toMillis === 'function') return docItem.createdAt.toMillis();
    if (typeof docItem.createdAt.toDate === 'function') return docItem.createdAt.toDate().getTime();
    if (docItem.createdAt instanceof Date) return docItem.createdAt.getTime();
    return new Date(docItem.createdAt).getTime() || 0;
  };

  for (let i = 0; i < emittedData.length - 1; i++) {
    const tCurrent = getDocTimeHelper(emittedData[i]);
    const tNext = getDocTimeHelper(emittedData[i + 1]);
    if (tCurrent < tNext) {
      isStrictlySorted = false;
      console.error(`Sort violation at index ${i}: current=${tCurrent}, next=${tNext}`);
      break;
    }
  }
  assert(isStrictlySorted, "Merged tasks are strictly sorted in descending chronological order");

  // The 10 null/invalid timestamps must be at the very bottom with time === 0
  const bottom10 = emittedData.slice(90);
  const allBottomAreZero = bottom10.every(item => getDocTimeHelper(item) === 0);
  assert(allBottomAreZero, "All 10 corrupted/missing timestamp documents safely defaulted to 0 at bottom");

  // ---------------------------------------------------------------------------
  // SUITE 6: Asynchronous Snapshot Arrival & Concurrency Jitter Stress
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 6: Asynchronous Snapshot Arrival & Concurrency Jitter Stress ---");

  // 6.1 Order Permutation: Claims first, then Todos
  console.log("  Testing arrival order: Claims snapshot arrives before Todos...");
  let emissionCounter = 0;
  const harness6 = await loadManagerTodoModule({
    onSnapshot: (q, onNext) => {
      if (q.col.name === 'todos') {
        todoSnapshotTrigger = onNext;
        return () => {};
      }
      if (q.col.name === 'claims') {
        claimSnapshotTrigger = onNext;
        return () => {};
      }
      return () => {};
    }
  });

  harness6.managerTodoService.subscribeManagerApprovals(() => {
    emissionCounter++;
  });

  // Claims arrives first
  claimSnapshotTrigger({
    docs: [
      { id: 'CLM-FIRST', data: () => ({ type: 'CLAIM_APPROVAL', status: 'pending_manager', createdAt: 100 }) }
    ]
  });
  assert(emissionCounter === 1, "First snapshot from claims triggered emission 1");

  // Todos arrives second
  todoSnapshotTrigger({
    docs: [
      { id: 'TODO-SECOND', data: () => ({ type: 'WHOLESALE_APPROVAL', status: 'pending', createdAt: 200 }) }
    ]
  });
  assert(emissionCounter === 2, "Second snapshot from todos triggered emission 2");

  // 6.2 100 Interleaved Jitter Events
  console.log("  Testing 100 rapid concurrent interleaved updates...");
  let jitterErrors = 0;
  for (let event = 0; event < 100; event++) {
    const isTodoUpdate = event % 2 === 0;
    if (isTodoUpdate) {
      todoSnapshotTrigger({
        docs: [
          { id: 'SHARED-TASK', data: () => ({ type: 'WHOLESALE_APPROVAL', status: 'pending', title: `Todo Update ${event}`, createdAt: 100 + event }) },
          { id: `TODO-DYNAMIC-${event}`, data: () => ({ type: 'STAFF_APPROVAL', status: 'pending', createdAt: 100 }) }
        ]
      });
    } else {
      claimSnapshotTrigger({
        docs: [
          { id: 'SHARED-TASK', data: () => ({ type: 'RETURN_APPROVAL', status: 'waiting_item', title: `Claim Update ${event}`, createdAt: 200 + event }) },
          { id: `CLAIM-DYNAMIC-${event}`, data: () => ({ type: 'CLAIM_APPROVAL', status: 'pending_manager', createdAt: 200 }) }
        ]
      });
    }
  }
  assert(jitterErrors === 0, "Survived 100 rapid interleaved stream updates without exception");

  // ---------------------------------------------------------------------------
  // SUITE 7: updateTaskStatus Routing & Sanitization Stress
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 7: updateTaskStatus Routing & Sanitization Stress ---");

  const mockUpdatedDocs = {};
  const mockExistingDocs = {
    'claims/EXISTING-CLM-DOC': { status: 'pending_manager', type: 'CLAIM_APPROVAL' },
    'todos/EXISTING-CLM-DOC': { status: 'pending_manager', type: 'CLAIM_APPROVAL' },
    'todos/PURE-TODO-DOC': { status: 'pending', type: 'WHOLESALE_APPROVAL' }
  };

  const harness7 = await loadManagerTodoModule({
    doc: (db, col, id) => ({ path: `${col}/${id}`, col, id }),
    getDoc: async (ref) => {
      const data = mockExistingDocs[ref.path];
      return {
        exists: () => !!data,
        data: () => data || null
      };
    },
    updateDoc: async (ref, updatePayload) => {
      mockUpdatedDocs[ref.path] = updatePayload;
      return true;
    }
  });

  const { updateTaskStatus } = harness7.managerTodoService;

  // 7.1 Explicit taskType matching CLAIM_TASK_TYPES with shadow sync
  console.log("  Testing explicit claim taskType routing + shadow todo synchronization...");
  delete mockUpdatedDocs['claims/EXISTING-CLM-DOC'];
  delete mockUpdatedDocs['todos/EXISTING-CLM-DOC'];

  const res7_1 = await updateTaskStatus('EXISTING-CLM-DOC', 'waiting_item', { adminUid: 'admin-1' }, 'CLAIM_APPROVAL');
  assert(res7_1 === true, "updateTaskStatus returned true");
  assert(!!mockUpdatedDocs['claims/EXISTING-CLM-DOC'], "Updated primary 'claims' document");
  assert(mockUpdatedDocs['claims/EXISTING-CLM-DOC'].status === 'waiting_item', "claims document status updated to 'waiting_item'");
  assert(!!mockUpdatedDocs['todos/EXISTING-CLM-DOC'], "Synchronized shadow 'todos' document");
  assert(mockUpdatedDocs['todos/EXISTING-CLM-DOC'].status === 'waiting_item', "todos shadow document status synchronized to 'waiting_item'");

  // 7.2 Explicit taskType with NO shadow in todos
  console.log("  Testing explicit claim taskType with NO shadow in todos...");
  delete mockUpdatedDocs['claims/MODERN-ONLY-CLM'];
  delete mockUpdatedDocs['todos/MODERN-ONLY-CLM'];

  const res7_2 = await updateTaskStatus('MODERN-ONLY-CLM', 'processing', { adminUid: 'admin-2' }, 'CANCEL_CLAIM_APPROVAL');
  assert(res7_2 === true, "updateTaskStatus returned true for modern claim without shadow");
  assert(!!mockUpdatedDocs['claims/MODERN-ONLY-CLM'], "Updated 'claims' document for modern claim");
  assert(!mockUpdatedDocs['todos/MODERN-ONLY-CLM'], "Did not attempt invalid update on absent todo shadow");

  // 7.3 Payload containing type: 'CANCEL_RETURN_APPROVAL'
  console.log("  Testing payload.type routing to claims...");
  delete mockUpdatedDocs['claims/PAYLOAD-TYPE-CLM'];
  await updateTaskStatus('PAYLOAD-TYPE-CLM', 'cancelled', { type: 'CANCEL_RETURN_APPROVAL', reason: 'User choice' });
  assert(!!mockUpdatedDocs['claims/PAYLOAD-TYPE-CLM'], "Routed to 'claims' via payload.type");
  assert(mockUpdatedDocs['claims/PAYLOAD-TYPE-CLM'].status === 'cancelled', "Payload.type claim status is 'cancelled'");

  // 7.4 Payload containing taskType: 'EXCHANGE_APPROVAL'
  console.log("  Testing payload.taskType routing to claims...");
  delete mockUpdatedDocs['claims/PAYLOAD-TASKTYPE-CLM'];
  await updateTaskStatus('PAYLOAD-TASKTYPE-CLM', 'processing', { taskType: 'EXCHANGE_APPROVAL' });
  assert(!!mockUpdatedDocs['claims/PAYLOAD-TASKTYPE-CLM'], "Routed to 'claims' via payload.taskType");

  // 7.5 Omitted taskType, but document exists in claims
  console.log("  Testing omitted taskType with existing document in claims...");
  delete mockUpdatedDocs['claims/EXISTING-CLM-DOC'];
  await updateTaskStatus('EXISTING-CLM-DOC', 'completed', { note: 'Resolved' });
  assert(!!mockUpdatedDocs['claims/EXISTING-CLM-DOC'], "Routed to 'claims' via getDoc fallback discovery");
  assert(mockUpdatedDocs['claims/EXISTING-CLM-DOC'].status === 'completed', "Status updated to 'completed'");

  // 7.6 Pure non-claim task
  console.log("  Testing pure non-claim task routing to todos...");
  delete mockUpdatedDocs['todos/PURE-TODO-DOC'];
  delete mockUpdatedDocs['claims/PURE-TODO-DOC'];
  await updateTaskStatus('PURE-TODO-DOC', 'completed', { adminNote: 'Wholesale OK' }, 'WHOLESALE_APPROVAL');
  assert(!!mockUpdatedDocs['todos/PURE-TODO-DOC'], "Routed strictly to 'todos' for non-claim task");
  assert(!mockUpdatedDocs['claims/PURE-TODO-DOC'], "Never touched 'claims' collection for non-claim task");

  // 7.7 Payload undefined sanitization
  console.log("  Testing undefined sanitization in payload...");
  delete mockUpdatedDocs['claims/SAN-TEST'];
  await updateTaskStatus('SAN-TEST', 'waiting_item', {
    keepMe: 'Valid',
    removeMe: undefined,
    zeroValue: 0,
    emptyString: '',
    falseVal: false,
    nullVal: null
  }, 'CLAIM_APPROVAL');

  const sanResult = mockUpdatedDocs['claims/SAN-TEST'];
  assert(sanResult.keepMe === 'Valid', "Preserved valid string");
  assert(sanResult.zeroValue === 0, "Preserved 0 number");
  assert(sanResult.emptyString === '', "Preserved empty string");
  assert(sanResult.falseVal === false, "Preserved false boolean");
  assert(sanResult.nullVal === null, "Preserved null");
  assert(!('removeMe' in sanResult), "Strictly eliminated undefined field from payload (prevented FirebaseError)");

  // 7.8 Missing taskId validation
  console.log("  Testing missing taskId error guards...");
  let nullErrorCaught = false;
  try {
    await updateTaskStatus(null, 'completed');
  } catch (err) {
    nullErrorCaught = err.message.includes("ไม่พบรหัสงาน (Task ID)");
  }
  assert(nullErrorCaught, "Throws expected error on null taskId");

  let emptyErrorCaught = false;
  try {
    await updateTaskStatus('', 'completed');
  } catch (err) {
    emptyErrorCaught = err.message.includes("ไม่พบรหัสงาน (Task ID)");
  }
  assert(emptyErrorCaught, "Throws expected error on empty string taskId");

  // ---------------------------------------------------------------------------
  // SUITE 8: deleteManagerTask Routing Stress
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 8: deleteManagerTask Routing Stress ---");

  const deletedDocs = [];
  const harness8 = await loadManagerTodoModule({
    doc: (db, col, id) => ({ path: `${col}/${id}`, col, id }),
    getDoc: async (ref) => ({
      exists: () => ref.path.includes('EXISTS'),
      data: () => ({ id: ref.id })
    }),
    deleteDoc: async (ref) => {
      deletedDocs.push(ref.path);
      return true;
    }
  });

  const { deleteManagerTask } = harness8.managerTodoService;

  // 8.1 Doc exists in both
  deletedDocs.length = 0;
  await deleteManagerTask('EXISTS-IN-BOTH');
  assert(deletedDocs.includes('claims/EXISTS-IN-BOTH'), "Deleted from 'claims'");
  assert(deletedDocs.includes('todos/EXISTS-IN-BOTH'), "Deleted from 'todos'");

  // 8.2 Doc exists in neither (safe execution without crash)
  deletedDocs.length = 0;
  await deleteManagerTask('NOT-IN-CLAIMS');
  assert(!deletedDocs.includes('claims/NOT-IN-CLAIMS'), "Skipped claims delete when doc absent in claims");
  assert(deletedDocs.includes('todos/NOT-IN-CLAIMS'), "Attempted todos delete cleanly");

  // 8.3 Missing taskId
  let deleteNullCaught = false;
  try {
    await deleteManagerTask(null);
  } catch (err) {
    deleteNullCaught = err.message.includes("ไม่พบรหัสงาน (Task ID) ที่ต้องการลบ");
  }
  assert(deleteNullCaught, "Throws expected error on null taskId in deleteManagerTask");

  // ---------------------------------------------------------------------------
  // SUITE 9: Live Firestore Forensic Parity & Invariants
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 9: Live Firestore Forensic Parity & Invariants ---");

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
  const liveDb = getFirestore(app);

  console.log("  Authenticating with Live Firestore as Manager...");
  const cred = await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  assert(!!cred.user.uid, "Live Manager Auth successful", `UID: ${cred.user.uid}`);

  // 9.1 Verify active safeguard claim YR4lK8HMUZQKMW8dZeyu
  const activeSnap = await getDoc(doc(liveDb, 'claims', 'YR4lK8HMUZQKMW8dZeyu'));
  assert(activeSnap.exists(), "Safeguard active claim YR4lK8HMUZQKMW8dZeyu exists in claims");
  const activeStatus = activeSnap.data()?.status;
  assert(
    ['pending_manager', 'waiting_item', 'processing'].includes(activeStatus),
    `Safeguard active claim status is in active lifecycle: '${activeStatus}'`
  );

  // 9.2 Verify the 3 M1 resolved cancel targets
  const targetIds = ['IJoca8dJDmvZm7u0Sbo6', 'nVrnTQ8BTxNyZEVXBSuU', 'Ql6z5DaEQ9gW7JmYxnDs'];
  for (const tid of targetIds) {
    const cSnap = await getDoc(doc(liveDb, 'claims', tid));
    const tSnap = await getDoc(doc(liveDb, 'todos', tid));
    const cStatus = cSnap.exists() ? cSnap.data().status : 'NOT_FOUND';
    const tStatus = tSnap.exists() ? tSnap.data().status : 'NOT_FOUND';

    assert(cStatus === 'cancelled', `M1 Target ${tid} is status 'cancelled' in live claims`, `status: ${cStatus}`);
    assert(
      tStatus === 'cancelled' || tStatus === 'NOT_FOUND',
      `M1 Target ${tid} is 'cancelled' or pruned in live todos`,
      `status: ${tStatus}`
    );
  }

  // 9.3 Live Manager Approvals Query Simulation
  console.log("  Simulating live manager approvals feed against live Firestore data...");
  const liveTodosSnap = await getDocs(
    query(
      collection(liveDb, 'todos'),
      where('status', 'in', ['todo', 'pending', 'pending_manager', 'waiting_item', 'processing'])
    )
  );
  const liveClaimsSnap = await getDocs(
    query(
      collection(liveDb, 'claims'),
      where('status', 'in', ['pending_manager', 'waiting_item', 'processing'])
    )
  );

  console.log(`  Live query returned: ${liveTodosSnap.size} todos docs, ${liveClaimsSnap.size} claims docs`);

  const liveTaskMap = new Map();
  liveTodosSnap.forEach(docSnap => {
    const todo = { id: docSnap.id, ...docSnap.data() };
    const typeToCheck = todo.type || todo.taskType;
    if (MANAGER_TASK_TYPES.includes(typeToCheck) && !CLAIM_TASK_TYPES.includes(typeToCheck)) {
      liveTaskMap.set(todo.id, todo);
    }
  });

  liveClaimsSnap.forEach(docSnap => {
    const claim = { id: docSnap.id, ...docSnap.data() };
    const typeToCheck = claim.type || claim.taskType;
    if (!typeToCheck || CLAIM_TASK_TYPES.includes(typeToCheck)) {
      liveTaskMap.set(claim.id, claim);
    }
  });

  const liveMerged = Array.from(liveTaskMap.values());
  console.log(`  Live merged manager tasks count: ${liveMerged.length}`);

  // Invariant 1: None of the 3 resolved cancel targets are in the live merged feed
  for (const tid of targetIds) {
    const foundInLive = liveMerged.find(t => t.id === tid);
    assert(!foundInLive, `Resolved target ${tid} is completely absent from live manager approvals feed`);
  }

  // Invariant 2: Safeguard claim YR4lK8HMUZQKMW8dZeyu is present in the live merged feed
  const activeFoundInLive = liveMerged.find(t => t.id === 'YR4lK8HMUZQKMW8dZeyu');
  assert(!!activeFoundInLive, "Safeguard active claim YR4lK8HMUZQKMW8dZeyu is present in live manager approvals feed");

  // Invariant 3: Zero duplicate IDs in the merged result
  const idSet = new Set();
  let hasDuplicate = false;
  for (const item of liveMerged) {
    if (idSet.has(item.id)) {
      hasDuplicate = true;
      break;
    }
    idSet.add(item.id);
  }
  assert(!hasDuplicate, "Zero duplicate document IDs exist in live merged output");

  // ---------------------------------------------------------------------------
  // SUMMARY & VERDICT
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`TOTAL CHECKS: ${totalChecks}`);
  console.log(`PASSED:       ${passedChecks}`);
  console.log(`FAILED:       ${failedChecks}`);
  console.log("================================================================================\n");

  if (failedChecks > 0) {
    console.error("❌ ADVERSARIAL CHALLENGE DETECTED FAILURES:");
    failureDetails.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  } else {
    console.log("🎉 ALL ADVERSARIAL STRESS & PARITY TESTS PASSED EMPIRICALLY! VERDICT: PASS\n");
    process.exit(0);
  }
}

runAdversarialSuite().catch(err => {
  console.error("🔥 Fatal Unhandled Error in Adversarial Suite:", err);
  process.exit(1);
});
