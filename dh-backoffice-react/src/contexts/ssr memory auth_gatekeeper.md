# 📜 SSR Local Grimoire — Backoffice Authentication, Gatekeeper & Session Lifecycle

<grimoire>
  <workflow>
    1. Auth Initialization: Firebase Auth initializes client-side session via `onAuthStateChanged`.
    2. Role & Profile Subscription: Upon receiving authenticated `currentUser`, listen to `users/{uid}` via `userService.listenToUserRole`.
    3. Gatekeeper Evaluation:
       - `isCheckingAuth`: Display loading spinner during credential resolution.
       - `accessDenied`: Block unauthorized accounts or connection drops via `GatekeeperDenied`.
       - Role clearance: Allow verified staff, managers, or super admins through to `AdminLayout`.
    4. 12-Hour Inactivity Guard: Periodically evaluate `dh_last_activity` timestamp against a 12-hour limit. If exceeded, unsubscribe role listener, clear localStorage, perform `signOut(auth)`, and cleanly reload to prevent zombie permission errors.
  </workflow>

  <core_schema>
    1. LocalStorage Keys:
       - `dh_last_activity`: number (Unix timestamp in ms of the last user interaction)
    2. SessionStorage Keys:
       - `dh_gatekeeper_reload_count`: number (Transient retry counter to prevent infinite auto-reload loops)
       - `dh_gatekeeper_reload_timestamp`: number (Timestamp of last auto-reload attempt)
    3. Auth State Context Contract:
       - `user`: User | null
       - `profile`: UserProfile | null
       - `loading`: boolean
       - `isCheckingAuth`: boolean
       - `accessDenied`: boolean
       - `denyReason`: 'pending' | 'blocked' | 'error'
  </core_schema>

  <rules_and_conditions>
    1. Safe Unsubscribe Protocol: Always unsubscribe `userService.listenToUserRole` BEFORE or immediately upon calling `signOut(auth)` to prevent Firestore security rules from throwing `PERMISSION_DENIED` on unauthenticated user documents.
    2. Auto-Reload Guard: When Gatekeeper encounters `denyReason === 'error'`, attempt a smooth auto-reload (up to 2 times within 30 seconds) rather than alarming the staff with a permanent permission denied screen.
    3. Non-Alarming Fallback Messaging: If auto-reload attempts are exhausted, present the incident as an expired session or network interruption, never as account revocation or missing employee registration.
  </rules_and_conditions>

  <techniques>
    1. Throttled Activity Tracking: Throttle mouse/keyboard event listeners in `AuthContext` to update `localStorage` at most once every 10 seconds, preserving client performance.
    2. Unsubscribe Ref Closure Shield: Store active Firestore listener cancellations in a `useRef` to ensure cross-lifecycle unsubscription even if component renders or state transitions occur out of order.
    3. Transient Session Guard: Use `sessionStorage` for retry thresholds so that closing and reopening the tab completely resets error quotas.
  </techniques>

  <lessons_learned>
    1. ⚠️ Inactivity Logout Race Condition: Calling `signOut(auth)` without unhooking the `listenToUserRole` snapshot listener caused Firestore to reject unauthenticated queries with `Missing or insufficient permissions`. The listener error handler mistakenly revived the user into `accessDenied = true` with `denyReason = 'error'`, presenting a scary "ไม่พบข้อมูลสิทธิ์" screen to staff after 12 hours of inactivity.
    2. ⚠️ Fixed by: Unsubscribing listeners synchronously prior to `signOut`, performing a clean `window.location.reload()` on inactivity timeouts, and providing an auto-reload recovery loop in `GatekeeperUI.jsx`.
    3. ⚠️ Super Admin Priority & Role Parameter Guard: In login flows, evaluate `isOwner` before `pending_approval` to prevent admin lockout, synchronize `SUPER_ADMINS` (4 emails), and allow `updateUserRole` to accept both 2 and 3 parameter calls safely.
  </lessons_learned>
</grimoire>
