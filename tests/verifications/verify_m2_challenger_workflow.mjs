/**
 * Challenger 1 Adversarial Verification Suite: Milestone 2 Clean Architecture & Workflow Engine
 * File: Management System/tests/verifications/verify_m2_challenger_workflow.mjs
 * 
 * Objectives:
 * 1. Empirically execute managerActionService.handleApproval across all 6 claim types.
 * 2. Empirically execute managerActionService.handleRejection across all 6 claim types.
 * 3. Verify that all 6 types route to claimManagerService facade and NEVER hit the fallback log trap.
 * 4. Verify polymorphic parameter handling in claimManagerService (cancel vs manager, backward compat).
 * 5. Verify claimManagerService facade dispatch to underlying services (claimActionService, returnActionService, cancelActionService).
 * 6. Stress-test edge cases: missing originalTask, null payload, originalStatus preservation, unknown types.
 * 7. Query live Firestore to verify read-only safety and target status invariants.
 */

import { fileURLToPath } from 'url';
import path from 'path';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mgmtDir = path.resolve(__dirname, '../..');
const backofficeDir = path.join(mgmtDir, 'dh-backoffice-react');

// Auto-delegate to vite-node runner if invoked directly with plain Node
if (!process.env.VITE_NODE_RUNNER) {
  const relPath = path.relative(backofficeDir, __filename).replace(/\\/g, '/');
  const result = spawnSync('cmd.exe', ['/c', 'npx', 'vite-node', relPath], {
    cwd: backofficeDir,
    stdio: 'inherit',
    env: { ...process.env, VITE_NODE_RUNNER: 'true' }
  });
  process.exit(result.status ?? 0);
}

// -----------------------------------------------------------------------------
// Test State & Assertions
// -----------------------------------------------------------------------------
let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failureDetails = [];

function assert(condition, testName, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${testName}${details ? ` (${details})` : ''}`);
  } else {
    failedChecks++;
    const errMsg = `❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`;
    failureDetails.push(errMsg);
    console.error(`  ${errMsg}`);
  }
}

const ALL_6_CLAIM_TYPES = [
  'CLAIM_APPROVAL',
  'RETURN_APPROVAL',
  'EXCHANGE_APPROVAL',
  'CANCEL_CLAIM_APPROVAL',
  'CANCEL_RETURN_APPROVAL',
  'CANCEL_EXCHANGE_APPROVAL'
];

async function runSuite() {
  console.log("================================================================================");
  console.log("  CHALLENGER 1: ADVERSARIAL WORKFLOW ENGINE & ROUTING VERIFICATION SUITE");
  console.log("  Milestone 2: Manager Approvals & Claims Parity Architecture Overhaul");
  console.log("================================================================================\n");

  // Dynamic imports under vite-node
  const { managerActionService } = await import('../../dh-backoffice-react/src/firebase/managerActionService.js');
  const { claimManagerService } = await import('../../dh-backoffice-react/src/firebase/claim/claimManagerService.js');
  const { CLAIM_TASK_TYPES } = await import('../../dh-backoffice-react/src/firebase/managerTodoService.js');
  const { historyService } = await import('../../dh-backoffice-react/src/firebase/historyService.js');
  const { claimActionService } = await import('../../dh-backoffice-react/src/firebase/claim/claimActionService.js');
  const { returnActionService } = await import('../../dh-backoffice-react/src/firebase/claim/returnActionService.js');
  const { cancelActionService } = await import('../../dh-backoffice-react/src/firebase/claim/cancelActionService.js');
  const { auth, db } = await import('../../dh-backoffice-react/src/firebase/config.js');
  const { doc, getDoc } = await import('firebase/firestore');
  const { signInWithEmailAndPassword } = await import('firebase/auth');

  // Save original methods
  const origClaimApprove = claimManagerService.approveRequest;
  const origClaimReject = claimManagerService.rejectRequest;
  const origAddLog = historyService.addLog;
  const origCancelApprove = cancelActionService.approveCancel;
  const origCancelReject = cancelActionService.rejectCancel;
  const origReturnApprove = returnActionService.approveRequest;
  const origReturnReject = returnActionService.rejectRequest;
  const origClaimActApprove = claimActionService.approveRequest;
  const origClaimActReject = claimActionService.rejectRequest;

  try {
    // ---------------------------------------------------------------------------
    // SECTION 1: CLAIM_TASK_TYPES Completeness Check
    // ---------------------------------------------------------------------------
    console.log("--- 1. CLAIM_TASK_TYPES Completeness & Integrity ---");
    assert(Array.isArray(CLAIM_TASK_TYPES), "CLAIM_TASK_TYPES is exported as an Array");
    assert(CLAIM_TASK_TYPES.length === 6, "CLAIM_TASK_TYPES contains exactly 6 claim task types", `Count: ${CLAIM_TASK_TYPES.length}`);
    for (const t of ALL_6_CLAIM_TYPES) {
      assert(CLAIM_TASK_TYPES.includes(t), `CLAIM_TASK_TYPES contains '${t}'`);
    }

    // ---------------------------------------------------------------------------
    // SECTION 2: Dynamic Execution of handleApproval Across All 6 Claim Types
    // ---------------------------------------------------------------------------
    console.log("\n--- 2. Adversarial Execution: managerActionService.handleApproval ---");

    for (const claimType of ALL_6_CLAIM_TYPES) {
      const isCancel = claimType.startsWith('CANCEL_');
      const expectedRole = isCancel ? 'cancel' : 'manager';
      const expectedStatus = isCancel ? 'cancelled' : 'waiting_item';
      const expectedActionName = isCancel ? 'ApproveCancelClaim' : 'ApproveClaim';

      let facadeCalled = false;
      let facadeArgs = null;
      let logCalled = false;
      let logArgs = null;

      claimManagerService.approveRequest = async (...args) => {
        facadeCalled = true;
        facadeArgs = args;
        return { success: true };
      };

      historyService.addLog = async (...args) => {
        logCalled = true;
        logArgs = args;
        return true;
      };

      const taskId = `TEST-TASK-${claimType}`;
      const payload = { claimId: `CLM-REF-${claimType}`, sku: 'TEST-SKU-001', qty: 2 };
      const originalTask = { id: taskId, type: claimType, payload, title: `Test ${claimType}` };
      const adminId = 'admin_challenger_001';

      const result = await managerActionService.handleApproval(taskId, claimType, payload, originalTask, adminId);

      // Verify routing to facade
      assert(facadeCalled, `[${claimType}] handleApproval successfully routed to claimManagerService.approveRequest`);
      assert(facadeArgs !== null, `[${claimType}] approveRequest received arguments`);
      if (facadeArgs) {
        assert(facadeArgs[0] === originalTask, `[${claimType}] approveRequest received originalTask object`);
        assert(facadeArgs[1] === expectedRole, `[${claimType}] approveRequest received polymorphic role: '${expectedRole}'`);
        assert(facadeArgs[2] === adminId, `[${claimType}] approveRequest received adminId: '${adminId}'`);
        assert(facadeArgs[4] === payload, `[${claimType}] approveRequest received payload`);
      }

      // Verify history logging
      assert(logCalled, `[${claimType}] historyService.addLog was called`);
      if (logArgs) {
        assert(logArgs[0] === 'ManagerAction', `[${claimType}] log module is 'ManagerAction'`);
        assert(logArgs[1] === expectedActionName, `[${claimType}] log actionName is '${expectedActionName}' (NEVER fallback 'ApproveTask')`);
        assert(logArgs[2] === taskId, `[${claimType}] log targetId matches taskId`);
      }

      // Verify returned status
      assert(result.success === true, `[${claimType}] returned success === true`);
      assert(result.newStatus === expectedStatus, `[${claimType}] newStatus is '${expectedStatus}' (NEVER fallback 'completed')`, `Actual: ${result.newStatus}`);
      assert(result.status === expectedStatus, `[${claimType}] status is '${expectedStatus}'`);
    }

    // ---------------------------------------------------------------------------
    // SECTION 3: Dynamic Execution of handleRejection Across All 6 Claim Types
    // ---------------------------------------------------------------------------
    console.log("\n--- 3. Adversarial Execution: managerActionService.handleRejection ---");

    for (const claimType of ALL_6_CLAIM_TYPES) {
      const isCancel = claimType.startsWith('CANCEL_');
      const expectedRole = isCancel ? 'cancel' : 'manager';
      const expectedStatus = isCancel ? 'waiting_item' : 'rejected';
      const expectedActionName = isCancel ? 'RejectCancelClaim' : 'RejectClaim';

      let facadeCalled = false;
      let facadeArgs = null;
      let logCalled = false;
      let logArgs = null;

      claimManagerService.rejectRequest = async (...args) => {
        facadeCalled = true;
        facadeArgs = args;
        return { success: true };
      };

      historyService.addLog = async (...args) => {
        logCalled = true;
        logArgs = args;
        return true;
      };

      const taskId = `TEST-REJECT-${claimType}`;
      const payload = { claimId: `CLM-REJ-${claimType}`, sku: 'TEST-SKU-002', qty: 1 };
      const originalTask = { 
        id: taskId, 
        type: claimType, 
        payload, 
        title: `Test Reject ${claimType}`,
        originalStatus: 'waiting_item'
      };
      const adminId = 'admin_challenger_001';
      const reason = 'Warranty expired or policy violation';

      const result = await managerActionService.handleRejection(taskId, claimType, payload, originalTask, adminId, reason);

      // Verify routing to facade
      assert(facadeCalled, `[${claimType}] handleRejection successfully routed to claimManagerService.rejectRequest`);
      assert(facadeArgs !== null, `[${claimType}] rejectRequest received arguments`);
      if (facadeArgs) {
        assert(facadeArgs[0] === originalTask, `[${claimType}] rejectRequest received originalTask object`);
        assert(facadeArgs[1] === expectedRole, `[${claimType}] rejectRequest received polymorphic role: '${expectedRole}'`);
        assert(facadeArgs[2] === reason, `[${claimType}] rejectRequest received reason: '${reason}'`);
        assert(facadeArgs[3] === adminId, `[${claimType}] rejectRequest received adminId: '${adminId}'`);
      }

      // Verify history logging
      assert(logCalled, `[${claimType}] historyService.addLog was called`);
      if (logArgs) {
        assert(logArgs[0] === 'ManagerAction', `[${claimType}] log module is 'ManagerAction'`);
        assert(logArgs[1] === expectedActionName, `[${claimType}] log actionName is '${expectedActionName}' (NEVER fallback 'RejectTask')`);
        assert(logArgs[2] === taskId, `[${claimType}] log targetId matches taskId`);
      }

      // Verify returned status
      assert(result.success === true, `[${claimType}] returned success === true`);
      assert(result.newStatus === expectedStatus, `[${claimType}] newStatus is '${expectedStatus}' (restores originalStatus for cancels, rejected for claims)`, `Actual: ${result.newStatus}`);
      assert(result.status === expectedStatus, `[${claimType}] status is '${expectedStatus}'`);
    }

    // ---------------------------------------------------------------------------
    // SECTION 4: Facade Dispatch to Underlying Action Services
    // ---------------------------------------------------------------------------
    console.log("\n--- 4. Facade Dispatch to Underlying Domain Services ---");

    // Restore real claimManagerService methods
    claimManagerService.approveRequest = origClaimApprove;
    claimManagerService.rejectRequest = origClaimReject;

    // Test 4.1: Cancel types route to cancelActionService.approveCancel
    for (const cancelType of ['CANCEL_CLAIM_APPROVAL', 'CANCEL_RETURN_APPROVAL', 'CANCEL_EXCHANGE_APPROVAL']) {
      let cancelApproveCalled = false;
      let cancelApproveArgs = null;
      cancelActionService.approveCancel = async (...args) => {
        cancelApproveCalled = true;
        cancelApproveArgs = args;
        return true;
      };

      const task = { id: `C-${cancelType}`, type: cancelType, payload: { sku: 'TEST-SKU' } };
      await claimManagerService.approveRequest(task, 'cancel', 'admin-uid', 'Admin Name', { extraProp: 123 });

      assert(cancelApproveCalled, `claimManagerService.approveRequest routes '${cancelType}' to cancelActionService.approveCancel`);
      if (cancelApproveArgs) {
        assert(cancelApproveArgs[0].payload.extraProp === 123, `Task payload was merged with extra payload`);
        assert(cancelApproveArgs[1] === 'admin-uid', `adminUid received by cancelActionService`);
        assert(cancelApproveArgs[2] === 'Admin Name', `adminName received by cancelActionService`);
      }
    }

    // Test 4.2: RETURN_APPROVAL routes to returnActionService.approveRequest
    {
      let returnApproveCalled = false;
      let returnApproveArgs = null;
      returnActionService.approveRequest = async (...args) => {
        returnApproveCalled = true;
        returnApproveArgs = args;
        return true;
      };

      const task = { id: 'RTN-001', type: 'RETURN_APPROVAL', payload: { returnId: 'RTN-123' } };
      await claimManagerService.approveRequest(task, 'manager', 'admin-uid', 'Admin Name');

      assert(returnApproveCalled, "claimManagerService.approveRequest routes 'RETURN_APPROVAL' to returnActionService.approveRequest");
      if (returnApproveArgs) {
        assert(returnApproveArgs[1] === 'admin-uid', `adminUid received by returnActionService`);
        assert(returnApproveArgs[2] === 'Admin Name', `adminName received by returnActionService`);
      }
    }

    // Test 4.3: CLAIM_APPROVAL and EXCHANGE_APPROVAL route to claimActionService.approveRequest
    for (const claimType of ['CLAIM_APPROVAL', 'EXCHANGE_APPROVAL']) {
      let claimApproveCalled = false;
      let claimApproveArgs = null;
      claimActionService.approveRequest = async (...args) => {
        claimApproveCalled = true;
        claimApproveArgs = args;
        return true;
      };

      const task = { id: `CLM-${claimType}`, type: claimType, payload: { claimId: 'CLM-123' } };
      await claimManagerService.approveRequest(task, 'manager', 'admin-uid', 'Admin Name');

      assert(claimApproveCalled, `claimManagerService.approveRequest routes '${claimType}' to claimActionService.approveRequest`);
      if (claimApproveArgs) {
        assert(claimApproveArgs[1] === 'admin-uid', `adminUid received by claimActionService`);
        assert(claimApproveArgs[2] === 'Admin Name', `adminName received by claimActionService`);
      }
    }

    // Test 4.4: Rejection routing to underlying services
    for (const cancelType of ['CANCEL_CLAIM_APPROVAL', 'CANCEL_RETURN_APPROVAL', 'CANCEL_EXCHANGE_APPROVAL']) {
      let cancelRejectCalled = false;
      let cancelRejectArgs = null;
      cancelActionService.rejectCancel = async (...args) => {
        cancelRejectCalled = true;
        cancelRejectArgs = args;
        return true;
      };

      const task = { id: `CR-${cancelType}`, type: cancelType, payload: {} };
      await claimManagerService.rejectRequest(task, 'cancel', 'Wrong item', 'admin-uid', 'Admin Name');

      assert(cancelRejectCalled, `claimManagerService.rejectRequest routes '${cancelType}' to cancelActionService.rejectCancel`);
      if (cancelRejectArgs) {
        assert(cancelRejectArgs[1] === 'Wrong item', `reason received by cancelActionService`);
        assert(cancelRejectArgs[2] === 'admin-uid', `adminUid received by cancelActionService`);
        assert(cancelRejectArgs[3] === 'Admin Name', `adminName received by cancelActionService`);
      }
    }

    {
      let returnRejectCalled = false;
      let returnRejectArgs = null;
      returnActionService.rejectRequest = async (...args) => {
        returnRejectCalled = true;
        returnRejectArgs = args;
        return true;
      };

      const task = { id: 'RTN-REJ', type: 'RETURN_APPROVAL', payload: {} };
      await claimManagerService.rejectRequest(task, 'manager', 'Defect not found', 'admin-uid', 'Admin Name');

      assert(returnRejectCalled, "claimManagerService.rejectRequest routes 'RETURN_APPROVAL' to returnActionService.rejectRequest");
      if (returnRejectArgs) {
        assert(returnRejectArgs[1] === 'Defect not found', `reason received by returnActionService`);
        assert(returnRejectArgs[2] === 'admin-uid', `adminUid received by returnActionService`);
      }
    }

    for (const claimType of ['CLAIM_APPROVAL', 'EXCHANGE_APPROVAL']) {
      let claimRejectCalled = false;
      let claimRejectArgs = null;
      claimActionService.rejectRequest = async (...args) => {
        claimRejectCalled = true;
        claimRejectArgs = args;
        return true;
      };

      const task = { id: `CLM-REJ-${claimType}`, type: claimType, payload: {} };
      await claimManagerService.rejectRequest(task, 'manager', 'Physical damage', 'admin-uid', 'Admin Name');

      assert(claimRejectCalled, `claimManagerService.rejectRequest routes '${claimType}' to claimActionService.rejectRequest`);
      if (claimRejectArgs) {
        assert(claimRejectArgs[1] === 'Physical damage', `reason received by claimActionService`);
        assert(claimRejectArgs[2] === 'admin-uid', `adminUid received by claimActionService`);
      }
    }

    // ---------------------------------------------------------------------------
    // SECTION 5: Backward Compatibility with Legacy Direct Callers
    // ---------------------------------------------------------------------------
    console.log("\n--- 5. Backward Compatibility (Legacy Direct Callers) ---");

    // Legacy approve: approveRequest(task, adminUid, adminName) without 'cancel' / 'manager' role
    {
      let called = false;
      let passedArgs = null;
      claimActionService.approveRequest = async (...args) => {
        called = true;
        passedArgs = args;
        return true;
      };

      const legacyTask = { id: 'LEGACY-01', type: 'CLAIM_APPROVAL', payload: {} };
      await claimManagerService.approveRequest(legacyTask, 'legacy-admin-uid', 'Legacy Admin');

      assert(called, "Legacy approveRequest(task, adminUid, adminName) routes to claimActionService");
      if (passedArgs) {
        assert(passedArgs[1] === 'legacy-admin-uid', `Legacy adminUid preserved: '${passedArgs[1]}'`);
        assert(passedArgs[2] === 'Legacy Admin', `Legacy adminName preserved: '${passedArgs[2]}'`);
      }
    }

    // Legacy reject: rejectRequest(task, reason, adminUid, adminName) without 'cancel' / 'manager' role
    {
      let called = false;
      let passedArgs = null;
      claimActionService.rejectRequest = async (...args) => {
        called = true;
        passedArgs = args;
        return true;
      };

      const legacyTask = { id: 'LEGACY-02', type: 'CLAIM_APPROVAL', payload: {} };
      await claimManagerService.rejectRequest(legacyTask, 'Defective label', 'legacy-admin-uid', 'Legacy Admin');

      assert(called, "Legacy rejectRequest(task, reason, adminUid, adminName) routes to claimActionService");
      if (passedArgs) {
        assert(passedArgs[1] === 'Defective label', `Legacy reason preserved: '${passedArgs[1]}'`);
        assert(passedArgs[2] === 'legacy-admin-uid', `Legacy adminUid preserved: '${passedArgs[2]}'`);
        assert(passedArgs[3] === 'Legacy Admin', `Legacy adminName preserved: '${passedArgs[3]}'`);
      }
    }

    // ---------------------------------------------------------------------------
    // SECTION 6: Fallback Log Trap & Non-Claim Task Negative Proofs
    // ---------------------------------------------------------------------------
    console.log("\n--- 6. Fallback Log Trap Negative Proofs ---");

    // Test that an unknown task type DOES hit the fallback log trap
    {
      let fallbackLogged = false;
      historyService.addLog = async (mod, act) => {
        if (mod === 'ManagerAction' && act === 'ApproveTask') {
          fallbackLogged = true;
        }
        return true;
      };

      const unknownType = 'UNKNOWN_CUSTOM_TASK_TYPE';
      const result = await managerActionService.handleApproval('UNKNOWN-01', unknownType, {}, null, 'admin-1');

      assert(fallbackLogged, "Non-claim unknown task type DOES hit fallback ApproveTask");
      assert(result.newStatus === 'completed', "Non-claim unknown task type returns fallback newStatus: 'completed'");
    }

    // Confirm NONE of the 6 claim types ever hit the fallback
    for (const claimType of ALL_6_CLAIM_TYPES) {
      let fallbackHit = false;
      historyService.addLog = async (mod, act) => {
        if (act === 'ApproveTask' || act === 'RejectTask') {
          fallbackHit = true;
        }
        return true;
      };

      // Approval
      await managerActionService.handleApproval(`ID-${claimType}`, claimType, {}, null, 'admin-1');
      assert(!fallbackHit, `[${claimType}] handleApproval NEVER hit fallback 'ApproveTask'`);

      // Rejection
      fallbackHit = false;
      await managerActionService.handleRejection(`ID-${claimType}`, claimType, {}, null, 'admin-1', 'reason');
      assert(!fallbackHit, `[${claimType}] handleRejection NEVER hit fallback 'RejectTask'`);
    }

    // ---------------------------------------------------------------------------
    // SECTION 7: Adversarial Stress & Edge Cases
    // ---------------------------------------------------------------------------
    console.log("\n--- 7. Adversarial Stress & Edge Cases ---");

    // Edge Case 7.1: Missing originalTask on handleApproval (auto-synthesis)
    {
      let receivedTask = null;
      claimManagerService.approveRequest = async (t) => { receivedTask = t; return true; };
      const res = await managerActionService.handleApproval('SYNTH-01', 'CLAIM_APPROVAL', { sku: 'TEST' }, null, 'admin-1');
      assert(receivedTask !== null, "handleApproval auto-synthesizes task when originalTask is null");
      assert(receivedTask.id === 'SYNTH-01' && receivedTask.type === 'CLAIM_APPROVAL', "Synthesized task has correct id and type");
      assert(res.success === true && res.newStatus === 'waiting_item', "Synthesized approval returns waiting_item");
    }

    // Edge Case 7.2: Missing originalTask on cancel handleRejection (fallback status)
    {
      claimManagerService.rejectRequest = async () => true;
      const res = await managerActionService.handleRejection('SYNTH-CANCEL-01', 'CANCEL_CLAIM_APPROVAL', {}, null, 'admin-1', 'reason');
      assert(res.success === true, "Cancel handleRejection without originalTask succeeds");
      assert(res.newStatus === 'processing', "Cancel handleRejection without originalTask falls back to 'processing'", `Actual: ${res.newStatus}`);
    }

    // Edge Case 7.3: Cancel rejection preserving specific originalStatus
    for (const testStatus of ['waiting_item', 'processing', 'todo']) {
      const origTask = { id: 'C-01', type: 'CANCEL_RETURN_APPROVAL', originalStatus: testStatus };
      const res = await managerActionService.handleRejection('C-01', 'CANCEL_RETURN_APPROVAL', {}, origTask, 'admin-1', 'reason');
      assert(res.newStatus === testStatus, `Cancel rejection correctly restored originalStatus '${testStatus}'`);
    }

    // Restore real claimManagerService methods for genuine facade error checking
    claimManagerService.approveRequest = origClaimApprove;
    claimManagerService.rejectRequest = origClaimReject;

    // Edge Case 7.4: Unknown task type passed to claimManagerService directly
    {
      let approveError = null;
      try {
        await claimManagerService.approveRequest({ type: 'NON_EXISTENT_CLAIM' }, 'manager', 'uid', 'name');
      } catch (e) {
        approveError = e;
      }
      assert(approveError !== null && approveError.message.includes('Unknown task type for approval'), "claimManagerService.approveRequest throws descriptive error on unknown task type");

      let rejectError = null;
      try {
        await claimManagerService.rejectRequest({ type: 'NON_EXISTENT_CLAIM' }, 'manager', 'reason', 'uid', 'name');
      } catch (e) {
        rejectError = e;
      }
      assert(rejectError !== null && rejectError.message.includes('Unknown task type for rejection'), "claimManagerService.rejectRequest throws descriptive error on unknown task type");
    }

    // Edge Case 7.5: Rejection reason string edge case (Adversarial curiosity)
    {
      let passedReason = null;
      claimActionService.rejectRequest = async (t, r) => { passedReason = r; return true; };
      await claimManagerService.rejectRequest({ type: 'CLAIM_APPROVAL' }, 'Defective', 'admin-uid', 'Admin');
      assert(passedReason === 'Defective', "Standard legacy reason passes cleanly to underlying service");
    }

    // ---------------------------------------------------------------------------
    // SECTION 8: Live Firestore Invariant Verification (Read-Only)
    // ---------------------------------------------------------------------------
    console.log("\n--- 8. Live Firestore Invariant & Parity Verification (Read-Only) ---");

    console.log("  Authenticating as Manager for Firestore verification...");
    const cred = await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
    assert(!!cred.user.uid, "Manager authentication successful", `UID: ${cred.user.uid}`);

    const TARGET_IDS = ['IJoca8dJDmvZm7u0Sbo6', 'nVrnTQ8BTxNyZEVXBSuU', 'Ql6z5DaEQ9gW7JmYxnDs'];
    for (const tid of TARGET_IDS) {
      const cSnap = await getDoc(doc(db, 'claims', tid));
      assert(cSnap.exists(), `Target claim document exists in 'claims': ${tid}`);
      if (cSnap.exists()) {
        const data = cSnap.data();
        assert(data.status === 'cancelled', `Target claim [${tid}] status is 'cancelled'`, `Actual: ${data.status}`);
        assert(data.handledBy !== undefined, `Target claim [${tid}] has handledBy audit trail`);
      }

      const tSnap = await getDoc(doc(db, 'todos', tid));
      if (tSnap.exists()) {
        const tData = tSnap.data();
        assert(tData.status === 'cancelled', `Target shadow todo [${tid}] status is synchronized to 'cancelled'`, `Actual: ${tData.status}`);
      }
    }

    // Verify Active Claim YR4lK8HMUZQKMW8dZeyu is safe in 'processing'
    const activeSnap = await getDoc(doc(db, 'claims', 'YR4lK8HMUZQKMW8dZeyu'));
    assert(activeSnap.exists(), "Active claim 'YR4lK8HMUZQKMW8dZeyu' exists");
    if (activeSnap.exists()) {
      const activeData = activeSnap.data();
      assert(activeData.status === 'processing', "Active claim status is unaltered 'processing'", `Actual: ${activeData.status}`);
      assert(activeData.type === 'CLAIM_APPROVAL', "Active claim type is 'CLAIM_APPROVAL'");
    }

  } finally {
    // Restore all methods
    claimManagerService.approveRequest = origClaimApprove;
    claimManagerService.rejectRequest = origClaimReject;
    historyService.addLog = origAddLog;
    cancelActionService.approveCancel = origCancelApprove;
    cancelActionService.rejectCancel = origCancelReject;
    returnActionService.approveRequest = origReturnApprove;
    returnActionService.rejectRequest = origReturnReject;
    claimActionService.approveRequest = origClaimActApprove;
    claimActionService.rejectRequest = origClaimActReject;
  }

  // ---------------------------------------------------------------------------
  // Summary & Empirical Verdict
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`  CHALLENGER 1 RESULTS: ${passedChecks}/${totalChecks} CHECKS PASSED`);
  console.log(`  FAILURES: ${failedChecks}`);
  console.log("================================================================================");

  if (failedChecks > 0) {
    console.error("\n❌ FAILED CHECKS BREAKDOWN:");
    for (const f of failureDetails) {
      console.error(`  - ${f}`);
    }
    console.log("\nVERDICT: FAIL ❌\n");
    process.exit(1);
  } else {
    console.log("\nVERDICT: PASS ✅ (100% Empirical Verification across all 6 claim types)\n");
    process.exit(0);
  }
}

runSuite().catch(err => {
  console.error("FATAL SUITE ERROR:", err);
  process.exit(1);
});
