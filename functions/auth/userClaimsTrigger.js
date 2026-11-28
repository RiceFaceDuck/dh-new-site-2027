/**
 * 🛡️ Auth Custom Claims Trigger (Cloud Functions v1 — compatible with Firestore asia-southeast3)
 * Listens to `users/{uid}` onWrite. Maps database role strings (English & Thai)
 * into Firebase Auth Custom Claims (`role`, `isStaff`, `isManager`, `isAdmin`)
 * so client tokens carry authorization without database lookups.
 */

const functions = require("firebase-functions/v1");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

/**
 * Maps raw role string (Thai or English) to standardized Auth Custom Claims.
 * Protects Thai staff/managers from accidental demotion to customer.
 */
function mapRoleToClaims(rawRole) {
  const normalized = String(rawRole || '').trim().toLowerCase();

  // 1. Admin / Owner tier
  if (['เจ้าของ', 'owner', 'แอดมิน', 'admin'].includes(normalized)) {
    return {
      role: 'admin',
      isAdmin: true,
      isManager: true,
      isStaff: true
    };
  }

  // 2. Manager tier
  if (['ผู้จัดการ', 'manager', 'vp', 'vp 1'].includes(normalized)) {
    return {
      role: 'manager',
      isAdmin: false,
      isManager: true,
      isStaff: true
    };
  }

  // 3. Packer tier
  if (['พนักงานแพ็ค', 'จัดแพ็ค', 'packer'].includes(normalized)) {
    return {
      role: 'packer',
      isAdmin: false,
      isManager: false,
      isStaff: true
    };
  }

  // 4. Staff tier
  if (['บัญชี', 'การบัญชี', 'finance', 'accountant', 'ช่าง', 'technician', 'developer', 'admin ฝ่ายขาย', 'พนักงานทั่วไป', 'staff', 'อื่นๆ'].includes(normalized)) {
    return {
      role: 'staff',
      isAdmin: false,
      isManager: false,
      isStaff: true
    };
  }

  // 5. Default: Customer
  return {
    role: 'customer',
    isAdmin: false,
    isManager: false,
    isStaff: false
  };
}

/**
 * Cloud Function Trigger (v1): Sync Auth Custom Claims whenever users/{uid} is written.
 * Uses v1 because project Firestore lives in asia-southeast3 (not supported by v2 Eventarc).
 */
const onUserWrittenForClaims = functions
  .region("asia-southeast1")
  .firestore.document("users/{uid}")
  .onWrite(async (change, context) => {
    const uid = context.params.uid;
    const afterData = change.after.exists ? change.after.data() : null;
    const beforeData = change.before.exists ? change.before.data() : null;

    // If document was deleted, nothing to sync
    if (!afterData) {
      return null;
    }

    const newRole = afterData.role || 'customer';
    const oldRole = beforeData ? beforeData.role : undefined;

    // Only proceed if role changed or claims haven't been synchronized yet
    if (beforeData && newRole === oldRole && afterData.claimsUpdatedAt) {
      return null;
    }

    const claims = mapRoleToClaims(newRole);

    try {
      const auth = getAuth();
      await auth.setCustomUserClaims(uid, claims);

      // Token Refresh Signal: Store claimsUpdatedAt timestamp on the user doc
      const db = getFirestore();
      await db.collection("users").doc(uid).update({
        claimsUpdatedAt: FieldValue.serverTimestamp(),
        customClaims: claims
      });

      console.log(`[userClaimsTrigger] Synced claims for user ${uid} with role '${newRole}':`, claims);
      return { uid, claims };
    } catch (error) {
      console.error(`[userClaimsTrigger] Error updating claims for user ${uid}:`, error);
      throw error;
    }
  });

module.exports = {
  mapRoleToClaims,
  onUserWrittenForClaims,
  syncUserClaims: onUserWrittenForClaims
};
