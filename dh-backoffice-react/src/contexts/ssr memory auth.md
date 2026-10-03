<ssr_memory name="auth">
  <flow_and_entry>
    Entry points: `dh-backoffice-react/src/contexts/AuthContext.jsx` and `dh-frontend/src/context/AuthContext.jsx`.
    Flow: Firebase `onAuthStateChanged` listens to Auth Token -> reads user doc (`users/{uid}`) -> validates role & suspension -> exposes `user`, `roleData`, `isOwner`, `isManagerOrOwner`, `isStaffMember`.
    Logout wipes local activity tokens, clears `dh_*` keys from `sessionStorage`, resets `inMemoryRbacCache`, and dispatches `dh_auth_logout`.
  </flow_and_entry>

  <core_schema>
    User Document (`users/{uid}`):
    - `role`: string ('owner' | 'admin' | 'manager' | 'staff' | 'packer' | 'pending_approval' | 'suspended')
    - `isApproved`: boolean (guarded by security rules, user cannot self-assign)
    - `status`: string ('active' | 'suspended')
    - `email`: string (checked against `SUPER_ADMINS` list)
    - `permissions`: array of permission strings
  </core_schema>

  <business_rules>
    1. Owner Bypass: Owners (matched via hardcoded SUPER_ADMINS array or role === 'owner') MUST bypass `pending_approval` state.
    2. RBAC Consistency: Both `admin` and `แอดมิน` must have managerial rights in `isManagerOrOwner`.
    3. Session Isolation: Logout must clear in-memory caches and session tokens (`dh_*`) to prevent cross-account leaks on shared terminals.
    4. Quota Protection: Polling intervals on auth-dependent services (e.g. gasHistoryService) are strictly prohibited; use debounced triggers.
  </business_rules>

  <cross_impact>
    - Navigation: `ManagerRoute` checks `isManagerOrOwner()` and displays non-blocking toast before redirecting.
    - Security Rules: `firestore.rules` enforces self-update blacklists on `isApproved` and `permissions`.
    - POS & Billing: POS credit points operations depend on staff permissions without granting walletBalance updates.
  </cross_impact>

  <pitfalls_and_lessons>
    - ⚠️ Never poll Firestore repeatedly in unauthenticated or low-permission contexts (causes 720+ permission denied errors/hr).
    - ⚠️ `userManagementService.updateUserRole` had signature divergence (2 vs 3 params) leading to writes at `/users/owner`. Always support polymorphic signatures.
    - ⚠️ On mobile, modal register forms must use `grid-cols-1 sm:grid-cols-2` to prevent button/input squishing.
  </pitfalls_and_lessons>
</ssr_memory>
