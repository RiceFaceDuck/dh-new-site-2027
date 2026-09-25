import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mgmtDir = path.resolve(__dirname, '../..');

console.log('=== RUNNING AST & STATIC CODE TRANSACTION INTEGRITY TESTS ===\n');

// -------------------------------------------------------------------------
// Helper: Extract transaction blocks and analyze read/write ordering
// -------------------------------------------------------------------------
function analyzeTransactionBlock(sourceCode, functionName) {
  // Find function boundary
  const funcIndex = sourceCode.indexOf(functionName);
  if (funcIndex === -1) {
    throw new Error(`Function ${functionName} not found in source code`);
  }

  const txStart = sourceCode.indexOf('runTransaction(', funcIndex);
  if (txStart === -1) {
    throw new Error(`runTransaction not found in ${functionName}`);
  }

  // Find closing of runTransaction
  let openBraces = 0;
  let txEnd = -1;
  let started = false;
  for (let i = txStart; i < sourceCode.length; i++) {
    if (sourceCode[i] === '{') {
      openBraces++;
      started = true;
    } else if (sourceCode[i] === '}') {
      openBraces--;
      if (started && openBraces === 0) {
        txEnd = i;
        break;
      }
    }
  }

  const txCode = sourceCode.slice(txStart, txEnd + 1);
  const txStartLine = sourceCode.slice(0, txStart).split('\n').length;
  
  // Find all line numbers of transaction.get and write operations
  const lines = txCode.split('\n');
  const readLines = [];
  const writeLines = [];

  lines.forEach((line, idx) => {
    const absoluteLine = txStartLine + idx;
    const cleanLine = line.trim();
    if (cleanLine.startsWith('//') || cleanLine.startsWith('/*')) return;

    if (line.includes('transaction.get(')) {
      readLines.push({ line: absoluteLine, text: cleanLine });
    }
    if (line.includes('transaction.set(') || line.includes('transaction.update(') || line.includes('transaction.delete(')) {
      writeLines.push({ line: absoluteLine, text: cleanLine });
    }
  });

  const maxReadLine = readLines.length > 0 ? Math.max(...readLines.map(r => r.line)) : -1;
  const minWriteLine = writeLines.length > 0 ? Math.min(...writeLines.map(w => w.line)) : Infinity;

  return {
    functionName,
    txStartLine,
    readLines,
    writeLines,
    maxReadLine,
    minWriteLine,
    isStrictReadsBeforeWrites: maxReadLine < minWriteLine,
    readsCount: readLines.length,
    writesCount: writeLines.length
  };
}

describe('1. Transaction Line Order & Reads-Before-Writes Integrity', () => {

  it('TC-TX-01: claimRequestService.requestClaim enforces reads before writes', () => {
    const filePath = path.join(mgmtDir, 'dh-backoffice-react/src/firebase/claim/claimRequestService.js');
    const content = fs.readFileSync(filePath, 'utf8');
    const analysis = analyzeTransactionBlock(content, 'requestClaim');

    assert.ok(analysis.readsCount >= 1, 'Must have at least 1 read operation (counterDoc)');
    assert.ok(analysis.writesCount >= 1, 'Must have write operations (counterRef, newClaimRef)');
    assert.ok(analysis.isStrictReadsBeforeWrites, 
      `All reads (${analysis.maxReadLine}) must precede all writes (${analysis.minWriteLine})`);
  });

  it('TC-TX-02: claimRequestService.requestReturn enforces reads before writes', () => {
    const filePath = path.join(mgmtDir, 'dh-backoffice-react/src/firebase/claim/claimRequestService.js');
    const content = fs.readFileSync(filePath, 'utf8');
    const analysis = analyzeTransactionBlock(content, 'requestReturn');

    assert.ok(analysis.readsCount >= 1, 'Must have at least 1 read operation (counterDoc)');
    assert.ok(analysis.writesCount >= 1, 'Must have write operations (counterRef, newClaimRef)');
    assert.ok(analysis.isStrictReadsBeforeWrites, 
      `All reads (${analysis.maxReadLine}) must precede all writes (${analysis.minWriteLine})`);
  });

  it('TC-TX-03: claimActionService.markArrived enforces reads before writes', () => {
    const filePath = path.join(mgmtDir, 'dh-backoffice-react/src/firebase/claim/claimActionService.js');
    const content = fs.readFileSync(filePath, 'utf8');
    const analysis = analyzeTransactionBlock(content, 'markArrived');

    assert.ok(analysis.readsCount >= 1, 'Must read todoRef');
    assert.ok(analysis.writesCount >= 1, 'Must update todoRef and defect stock');
    assert.ok(analysis.isStrictReadsBeforeWrites, 
      `All reads (${analysis.maxReadLine}) must precede all writes (${analysis.minWriteLine})`);
  });

  it('TC-TX-04: claimActionService.completeRequest enforces reads before writes', () => {
    const filePath = path.join(mgmtDir, 'dh-backoffice-react/src/firebase/claim/claimActionService.js');
    const content = fs.readFileSync(filePath, 'utf8');
    const analysis = analyzeTransactionBlock(content, 'completeRequest');

    assert.ok(analysis.readsCount >= 3, `Expected at least 3 reads (taskRef, pRef, userRef), got ${analysis.readsCount}`);
    assert.ok(analysis.writesCount >= 3, `Expected multiple writes, got ${analysis.writesCount}`);
    assert.ok(analysis.isStrictReadsBeforeWrites, 
      `Max read line (${analysis.maxReadLine}) must be strictly less than min write line (${analysis.minWriteLine})`);
  });

  it('TC-TX-05: claimActionService.rejectRequest enforces reads before writes', () => {
    const filePath = path.join(mgmtDir, 'dh-backoffice-react/src/firebase/claim/claimActionService.js');
    const content = fs.readFileSync(filePath, 'utf8');
    const analysis = analyzeTransactionBlock(content, 'rejectRequest');

    assert.ok(analysis.readsCount >= 1, 'Must read todoRef');
    assert.ok(analysis.writesCount >= 1, 'Must write status');
    assert.ok(analysis.isStrictReadsBeforeWrites, 
      `Max read line (${analysis.maxReadLine}) must be strictly less than min write line (${analysis.minWriteLine})`);
  });

  it('TC-TX-06: returnActionService.completeRequest enforces reads before writes and uses preloaded snaps for credit', () => {
    const filePath = path.join(mgmtDir, 'dh-backoffice-react/src/firebase/claim/returnActionService.js');
    const content = fs.readFileSync(filePath, 'utf8');
    const analysis = analyzeTransactionBlock(content, 'completeRequest');

    assert.ok(analysis.readsCount >= 3, `Expected reads (taskRef, pRef, orderRef, creditPreloadRefs), got ${analysis.readsCount}`);
    assert.ok(analysis.writesCount >= 3, `Expected writes (pRef, taskRef, orderRef, userRef, walletTxRef), got ${analysis.writesCount}`);
    assert.ok(analysis.isStrictReadsBeforeWrites, 
      `Max read line (${analysis.maxReadLine}) must be strictly less than min write line (${analysis.minWriteLine})`);
    
    // Check that creditPreloadSnaps is passed to adjustUserCreditWithTransaction
    assert.ok(content.includes('adjustUserCreditWithTransaction(') && content.includes('creditPreloadSnaps'), 
      'adjustUserCreditWithTransaction must be called with creditPreloadSnaps to prevent in-transaction read-after-write');
  });

  it('TC-TX-07: cancelActionService.approveCancel enforces reads before writes', () => {
    const filePath = path.join(mgmtDir, 'dh-backoffice-react/src/firebase/claim/cancelActionService.js');
    const content = fs.readFileSync(filePath, 'utf8');
    const analysis = analyzeTransactionBlock(content, 'approveCancel');

    assert.ok(analysis.readsCount >= 3, `Expected multiple reads (taskRef, pRef, swapRef, orderRef, newOrderRef, userRef), got ${analysis.readsCount}`);
    assert.ok(analysis.writesCount >= 2, `Expected writes, got ${analysis.writesCount}`);
    assert.ok(analysis.isStrictReadsBeforeWrites, 
      `Max read line (${analysis.maxReadLine}) must be strictly less than min write line (${analysis.minWriteLine})`);
  });
});

describe('2. Schema & Data Linkage Verification', () => {

  it('TC-SCHEMA-01: claimRequestService sets customerUid at document root on requestClaim and requestReturn', () => {
    const filePath = path.join(mgmtDir, 'dh-backoffice-react/src/firebase/claim/claimRequestService.js');
    const content = fs.readFileSync(filePath, 'utf8');

    // Check requestClaim
    const reqClaimBlock = content.match(/requestClaim[\s\S]*?transaction\.set\(newClaimRef,\s*\{([\s\S]*?)\}\);/);
    assert.ok(reqClaimBlock, 'Found requestClaim transaction.set block');
    assert.ok(reqClaimBlock[1].includes("customerUid: bill.customer?.uid || 'Walk-in'"), 
      'requestClaim document root contains customerUid');

    // Check requestReturn
    const reqReturnBlock = content.match(/requestReturn[\s\S]*?transaction\.set\(newClaimRef,\s*\{([\s\S]*?)\}\);/);
    assert.ok(reqReturnBlock, 'Found requestReturn transaction.set block');
    assert.ok(reqReturnBlock[1].includes("customerUid: bill.customer?.uid || 'Walk-in'"), 
      'requestReturn document root contains customerUid');
  });

  it('TC-SCHEMA-02: ClaimItemCard.jsx targets claims collection and has useToast initialized', () => {
    const filePath = path.join(mgmtDir, 'dh-frontend/src/components/profile/tabs/claims/ClaimItemCard.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(!content.includes("getCollectionPath('todos')"), 'Must NOT target todos');
    assert.ok(content.includes("getCollectionPath('claims')"), 'Must target claims collection');
    assert.ok(content.includes("import { useToast } from '../../../../context/ToastContext';"), 'Must import useToast');
    assert.ok(content.includes("const { showToast } = useToast();"), 'Must initialize const { showToast } = useToast()');
  });

  it('TC-SCHEMA-03: Zero active references to todos in backend claim services', () => {
    const serviceFiles = [
      'dh-backoffice-react/src/firebase/claim/claimRequestService.js',
      'dh-backoffice-react/src/firebase/claim/claimActionService.js',
      'dh-backoffice-react/src/firebase/claim/returnActionService.js',
      'dh-backoffice-react/src/firebase/claim/cancelActionService.js',
      'dh-backoffice-react/src/firebase/claim/claimManagerService.js'
    ];

    for (const relPath of serviceFiles) {
      const fullPath = path.join(mgmtDir, relPath);
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      assert.ok(!fileContent.includes("getCollectionPath('todos')"), 
        `${relPath} must not contain getCollectionPath('todos')`);
      assert.ok(!fileContent.includes("collection(db, 'todos')"), 
        `${relPath} must not contain collection(db, 'todos')`);
    }
  });

  it('TC-SCHEMA-04: firestore.indexes.json contains composite index for collectionGroup claims', () => {
    const filePath = path.join(mgmtDir, 'firestore.indexes.json');
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const claimsIndexes = json.indexes.filter(idx => idx.collectionGroup === 'claims');
    assert.ok(claimsIndexes.length > 0, 'Must have indexes for claims collectionGroup');

    const customerIndex = claimsIndexes.find(idx => 
      idx.fields.some(f => f.fieldPath === 'customerUid' && f.order === 'ASCENDING') &&
      idx.fields.some(f => f.fieldPath === 'createdAt' && f.order === 'DESCENDING')
    );
    assert.ok(customerIndex, 'Must have index for customerUid ASC + createdAt DESC');
  });
});
