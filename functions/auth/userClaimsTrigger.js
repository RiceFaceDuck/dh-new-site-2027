/**
 * 🛡️ Auth Custom Claims Sync (Cloud Functions v2 Callable — asia-southeast1)
 * Maps database role strings (English & Thai) from `users/{uid}` into Firebase Auth
 * Custom Claims (`role`, `isStaff`, `isManager`, `isAdmin`) so client tokens carry
 * authorization without database lookups. Uses `onCall` because Firestore in
 * `asia-southeast3` does not support Eventarc/v1 Firestore document triggers.
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const SUPER_ADMIN_EMAILS = [
  "dh1notebook@gmail.com",
  "dh2notebook@gmail.com",
  "zhoulinjuan1@gmail.com",
  "bentshan@gmail.com"
];

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
 * Cloud Function Callable (v2): Sync Auth Custom Claims for a user from their authoritative Firestore role.
 * - Any signed-in user may sync their own claims (derived strictly from Firestore `users/{uid}.role`).
 * - Managers/Admins/Owners may sync claims for any `targetUid`.
 */
const syncUserClaims = onCall({ region: "asia-southeast1", cors: true, maxInstances: 10 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "จำเป็นต้องเข้าสู่ระบบก่อนดำเนินการซิงก์สิทธิ์");
  }

  const callerUid = request.auth.uid;
  const callerEmail = String(request.auth.token?.email || "").toLowerCase();
  const targetUid = String(request.data?.targetUid || callerUid).trim();

  if (!targetUid) {
    throw new HttpsError("invalid-argument", "ไม่พบรหัสผู้ใช้เป้าหมาย (targetUid)");
  }

  const db = getFirestore();

  // Authorization check when syncing another user's claims
  if (targetUid !== callerUid) {
    let isCallerAuthorized = SUPER_ADMIN_EMAILS.includes(callerEmail) ||
      Boolean(request.auth.token?.isManager || request.auth.token?.isAdmin);

    if (!isCallerAuthorized) {
      const callerSnap = await db.collection("users").doc(callerUid).get();
      if (callerSnap.exists) {
        const callerClaims = mapRoleToClaims(callerSnap.data()?.role);
        isCallerAuthorized = Boolean(callerClaims.isManager || callerClaims.isAdmin);
      }
    }

    if (!isCallerAuthorized) {
      throw new HttpsError("permission-denied", "เฉพาะผู้จัดการหรือผู้ดูแลระบบเท่านั้นที่สามารถซิงก์สิทธิ์ให้ผู้อื่นได้");
    }
  }

  const targetRef = db.collection("users").doc(targetUid);
  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) {
    throw new HttpsError("not-found", `ไม่พบข้อมูลผู้ใช้ ${targetUid}`);
  }

  const userData = targetSnap.data() || {};
  const roleStr = userData.role || "customer";
  const claims = mapRoleToClaims(roleStr);

  try {
    const auth = getAuth();
    await auth.setCustomUserClaims(targetUid, claims);

    await targetRef.update({
      claimsUpdatedAt: FieldValue.serverTimestamp(),
      customClaims: claims
    });

    console.log(`[userClaimsTrigger] Synced claims for user ${targetUid} with role '${roleStr}':`, claims);
    return { success: true, uid: targetUid, role: roleStr, claims };
  } catch (error) {
    console.error(`[userClaimsTrigger] Error updating claims for user ${targetUid}:`, error);
    throw new HttpsError("internal", "ไม่สามารถอัปเดตสิทธิ์ผู้ใช้ได้ในขณะนี้");
  }
});

module.exports = {
  mapRoleToClaims,
  syncUserClaims
};
