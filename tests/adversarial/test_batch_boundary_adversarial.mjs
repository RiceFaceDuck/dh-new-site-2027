/**
 * 🧪 ADVERSARIAL STRESS TEST SUITE: commitBatchChunks
 * Location: Management System/tests/adversarial/test_batch_boundary_adversarial.mjs
 * 
 * Verifies batch chunking boundary logic, slice boundaries, commit counts,
 * writeBatch operation dispatch, order preservation, and error handling.
 */

import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.resolve(__dirname, '../../dh-backoffice-react/package.json');
const req = createRequire(packageJsonPath);
const { initializeApp } = await import(pathToFileURL(req.resolve('firebase/app')).href);
const { getFirestore, writeBatch, doc, collection } = await import(pathToFileURL(req.resolve('firebase/firestore')).href);

const app = initializeApp({ projectId: 'test-project', apiKey: 'fake-api-key' });
const db = getFirestore(app);

const serviceCode = fs.readFileSync(path.resolve(__dirname, '../../dh-backoffice-react/src/firebase/customer/customerCascadeService.js'), 'utf8');
const match = serviceCode.match(/export const commitBatchChunks =[\s\S]*?\r?\n\};\r?\n/);
if (!match) throw new Error('commitBatchChunks not found in customerCascadeService.js');
const fnBody = match[0].replace('export const commitBatchChunks =', 'return');
const commitBatchChunks = new Function('db', 'writeBatch', fnBody)(db, writeBatch);


let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      await res;
    }
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('================================================================');
console.log('🧪 ADVERSARIAL SUITE 2: commitBatchChunks Batch Boundaries');
console.log('================================================================');

async function main() {
  assert.strictEqual(typeof commitBatchChunks, 'function', 'commitBatchChunks must be exported as a function');

  // -------------------------------------------------------------
  // SECTION 1: Signature & Empty Bounds
  // -------------------------------------------------------------
  console.log('\n--- Section 1: Signature and Empty Bounds ---');

  await runTest('returns 0 when operations array is empty []', async () => {
    const result = await commitBatchChunks(db, []);
    assert.strictEqual(result, 0);
  });

  await runTest('returns 0 when operations is undefined (default argument)', async () => {
    const result = await commitBatchChunks(db);
    assert.strictEqual(result, 0);
  });

  await runTest('fails with TypeError if operations is null (adversarial input)', async () => {
    let errorCaught = null;
    try {
      await commitBatchChunks(db, null);
    } catch (err) {
      errorCaught = err;
    }
    assert.ok(errorCaught instanceof TypeError, 'Expected TypeError when null is passed');
  });

  // -------------------------------------------------------------
  // SECTION 2: Chunking Boundary Slice Logic (Mathematical Verification)
  // -------------------------------------------------------------
  console.log('\n--- Section 2: Mathematical Boundary Matrix (450 Threshold) ---');

  const boundaryCases = [
    { count: 0, expectedBatches: 0, desc: '0 operations' },
    { count: 1, expectedBatches: 1, desc: '1 operation (minimum non-empty)' },
    { count: 449, expectedBatches: 1, desc: '449 operations (Boundary - 1)' },
    { count: 450, expectedBatches: 1, desc: '450 operations (Exact Single Boundary)' },
    { count: 451, expectedBatches: 2, desc: '451 operations (Boundary + 1, spill to 2nd batch)' },
    { count: 899, expectedBatches: 2, desc: '899 operations (2x Boundary - 1)' },
    { count: 900, expectedBatches: 2, desc: '900 operations (Exact Double Boundary)' },
    { count: 901, expectedBatches: 3, desc: '901 operations (2x Boundary + 1, spill to 3rd batch)' },
    { count: 1350, expectedBatches: 3, desc: '1350 operations (Exact Triple Boundary)' },
    { count: 2500, expectedBatches: 6, desc: '2500 operations (5 full batches of 450 + 1 batch of 250)' }
  ];

  for (const bCase of boundaryCases) {
    await runTest(`boundary check: ${bCase.desc} -> ${bCase.expectedBatches} batches`, () => {
      const ops = Array.from({ length: bCase.count }, (_, i) => ({
        type: 'update',
        ref: { id: `doc_${i}` },
        data: { v: i }
      }));

      const chunks = [];
      for (let i = 0; i < ops.length; i += 450) {
        chunks.push(ops.slice(i, i + 450));
      }

      assert.strictEqual(chunks.length, bCase.expectedBatches, `Chunk count must be ${bCase.expectedBatches}`);

      if (bCase.count > 0) {
        for (let c = 0; c < chunks.length - 1; c++) {
          assert.strictEqual(chunks[c].length, 450, `Chunk ${c} must be exactly 450 operations`);
        }
        const expectedLast = bCase.count % 450 === 0 ? 450 : (bCase.count % 450);
        assert.strictEqual(chunks[chunks.length - 1].length, expectedLast, `Last chunk must have ${expectedLast} items`);

        let flat = chunks.flat();
        assert.strictEqual(flat.length, bCase.count);
        for (let i = 0; i < flat.length; i++) {
          assert.strictEqual(flat[i].data.v, i, `Element ${i} must preserve sequential ordering`);
        }
      }
    });
  }

  // -------------------------------------------------------------
  // SECTION 3: Live WriteBatch Execution with Mocked Batch Lifecycle
  // -------------------------------------------------------------
  console.log('\n--- Section 3: WriteBatch Lifecycle & Operation Routing ---');

  await runTest('default db instance is initialized and valid for writeBatch', () => {
    assert.ok(db, 'db should be exported from config');
    const batch = writeBatch(db);
    assert.ok(batch, 'writeBatch(db) should return a WriteBatch object');
    assert.strictEqual(typeof batch.commit, 'function', 'batch should have commit function');
    assert.strictEqual(typeof batch.update, 'function', 'batch should have update function');
    assert.strictEqual(typeof batch.delete, 'function', 'batch should have delete function');
    assert.strictEqual(typeof batch.set, 'function', 'batch should have set function');
  });

  await runTest('executes commitBatchChunks with real WriteBatch across boundaries (intercepting commit)', async () => {
    const sampleBatch = writeBatch(db);
    const BatchClass = sampleBatch.constructor;

    const origCommit = BatchClass.prototype.commit;
    const origUpdate = BatchClass.prototype.update;
    const origDelete = BatchClass.prototype.delete;
    const origSet = BatchClass.prototype.set;

    let committedBatches = 0;
    const recordedOps = [];

    BatchClass.prototype.commit = async function() {
      committedBatches++;
      return Promise.resolve();
    };
    BatchClass.prototype.update = function(ref, data) {
      recordedOps.push({ type: 'update', ref, data });
      return this;
    };
    BatchClass.prototype.delete = function(ref) {
      recordedOps.push({ type: 'delete', ref });
      return this;
    };
    BatchClass.prototype.set = function(ref, data) {
      recordedOps.push({ type: 'set', ref, data });
      return this;
    };

    try {
      const mockDocRef = doc(collection(db, 'test_collection'), 'doc_id');
      // 901 operations -> exactly 3 batches: 450, 450, 1
      const operations = Array.from({ length: 901 }, (_, i) => {
        if (i % 3 === 0) return { type: 'update', ref: mockDocRef, data: { step: i } };
        if (i % 3 === 1) return { type: 'delete', ref: mockDocRef };
        return { type: 'set', ref: mockDocRef, data: { step: i } };
      });

      const commitCount = await commitBatchChunks(db, operations);

      assert.strictEqual(commitCount, 3, 'Must return 3 committed batches for 901 ops');
      assert.strictEqual(committedBatches, 3, 'Must have executed commit() exactly 3 times');
      assert.strictEqual(recordedOps.length, 901, 'All 901 operations must be dispatched through batch');

      const updates = recordedOps.filter(o => o.type === 'update');
      const deletes = recordedOps.filter(o => o.type === 'delete');
      const sets = recordedOps.filter(o => o.type === 'set');
      assert.strictEqual(updates.length, 301, 'Expected 301 update operations');
      assert.strictEqual(deletes.length, 300, 'Expected 300 delete operations');
      assert.strictEqual(sets.length, 300, 'Expected 300 set operations');

      // Verify order preservation: first operation is step 0, last operation (i=900, 900%3===0) is update step 900
      assert.strictEqual(updates[0].data.step, 0);
      assert.strictEqual(updates[updates.length - 1].data.step, 900);
      assert.strictEqual(sets[sets.length - 1].data.step, 899);
    } finally {
      BatchClass.prototype.commit = origCommit;
      BatchClass.prototype.update = origUpdate;
      BatchClass.prototype.delete = origDelete;
      BatchClass.prototype.set = origSet;
    }
  });

  await runTest('bubbles exception cleanly if a batch commit rejects midway', async () => {
    const sampleBatch = writeBatch(db);
    const BatchClass = sampleBatch.constructor;
    const origCommit = BatchClass.prototype.commit;

    let callCount = 0;
    BatchClass.prototype.commit = async function() {
      callCount++;
      if (callCount === 2) {
        throw new Error('Firestore Quota Exceeded (RESOURCE_EXHAUSTED)');
      }
      return Promise.resolve();
    };

    try {
      const mockDocRef = doc(collection(db, 'test_collection'), 'doc_id');
      const ops = Array.from({ length: 900 }, (_, i) => ({
        type: 'update',
        ref: mockDocRef,
        data: { i }
      }));

      let caught = null;
      try {
        await commitBatchChunks(db, ops);
      } catch (err) {
        caught = err;
      }

      assert.ok(caught instanceof Error, 'Must propagate error if batch.commit fails');
      assert.strictEqual(caught.message, 'Firestore Quota Exceeded (RESOURCE_EXHAUSTED)');
      assert.strictEqual(callCount, 2, 'Should fail on second batch commit attempt');
    } finally {
      BatchClass.prototype.commit = origCommit;
    }
  });

  // Summary
  console.log('\n================================================================');
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error running adversarial tests:', err);
  process.exit(1);
});
