# 📜 SSR Local Grimoire — Security, Input Validation & Access Control

<grimoire>
  <workflow>
    1. Scope & Perimeter: Audited and secured customer checkout, order history slip uploads, Cloud Functions HTTP endpoints, staff QR attendance logging, and storage upload pipelines across the monorepo.
    2. Zero-Trust Verification:
       - Every finding empirically proven with AST/source code line-by-line inspection prior to planning or mutation.
       - Pre-mutation backup of all modified files to `_Backups/2026-09-14_SecurityAndIntegration_Remediation/`.
    3. Remediation & Clean-Room Verification:
       - Rules update: Synchronized `firestore.rules` and `storage.rules`.
       - Functions update: Guarded unauthenticated endpoints and fixed deduplication collisions.
       - Client service harmonization: Corrected storage bucket paths and atomic status setters.
       - Independent victory audit verification: Automated builds across `dh-frontend`, `dh-backoffice-react`, and `dh-staff-app` with 0 errors.
  </workflow>

  <core_schema>
    1. `orders/{orderId}` Status Transition Contract:
       - `status`: 'pending' | 'pending_payment' | 'pending_payment_verification' | 'paid' | 'shipped' | 'completed' | 'received' | 'cancelled'
       - `paymentSlipUrl`: string | null (Authorized to be appended by customer on initial checkout or history slip re-submission)
       - `orderStatus`: Synchronized with `status` across all write paths
    2. `users/{userId}` Financial Privilege Schema:
       - `walletBalance`, `creditPoints`, `totalAccumulatedPoints`, `pendingWithdrawal`: Strictly restricted to `isManagerOrAdmin()` mutation only. General staff (`isStaff()`) prohibited from direct client-side balance overrides.
    3. `attendance_logs/{logId}` Collection:
       - `staffUid`: string
       - `staffName`: string
       - `type`: 'SCAN_IN' | 'SCAN_OUT'
       - `stationId`: string
       - `timestamp`: serverTimestamp
       - `scannedByManager`: boolean
    4. `catalogs/{docId}` Positive Whitelist Manifest:
       - Single consolidated match block restricting reads to public artifacts (`search_index*`, `cat_*`, `home_*`, `categories_index`, `ad_cards_bundle`) while keeping PII/internal directory documents strictly staff-only.
  </core_schema>

  <rules_and_conditions>
    1. Two-Gate Fact Checking Rule: Never assume a bug or security fix without citing exact file paths, line numbers, and empirical code blocks.
    2. Customer Payment Workflow Invariant: Never lock order status to a narrow subset without checking client builder calls (e.g. `pending_payment_verification` must be permitted alongside `pending_payment`).
    3. Principle of Least Privilege on Financial Ledgers: General staff must never have unrestricted update access to balance or points fields in `users`. All financial balance mutations must be gated by `isManagerOrAdmin()` or executed through trusted server-side transactions.
    4. Cloud Functions Fail-Closed Auth: All manual/on-demand HTTP triggers must validate shared secrets (`Bearer INTERNAL_CRON_SECRET`) and return HTTP 401 on missing or mismatched headers.
  </rules_and_conditions>

  <techniques>
    1. Whitelist Over Blacklist in Rules: Use a single unified positive whitelist for `/catalogs/{docId}` instead of multiple match blocks with regex blacklists to prevent Firestore's permissive OR union behavior.
    2. Truthy Sentinel Guard in OCR Deduplication: Filter out placeholder strings (`'n/a'`, `''`, `null`) before checking `slip_records/{ref}` to prevent false-positive duplicate rejections.
    3. Storage Path Quota Optimization: Route store profile images and ad banners to `/stores/{userId}/` and `/ads/{userId}/` instead of `/profiles/` to benefit from the 5MB upload limit without falling back to external scripts.
    4. Pre-Mutation Snapshot Directory: Snapshot modified files with full relative paths into `_Backups/{timestamp}_{label}/` to guarantee zero-data-loss rollback capability.
  </techniques>

  <lessons_learned>
    1. ⚠️ Checkout Slip Permission Block: In `firestore.rules`, checking only `['pending', 'pending_payment']` caused any checkout with an uploaded slip (`pending_payment_verification`) to fail with PERMISSION_DENIED. Solved by whitelisting `pending_payment_verification` in both create and update rules.
    2. ⚠️ History Slip Upload Block: In `orderPaymentService.js`, updating `paymentSlipUrl` on existing orders was rejected because `paymentSlipUrl` was omitted from `affectedKeys().hasOnly(...)`. Solved by including `paymentSlipUrl` in allowed update keys.
    3. ⚠️ Unbounded Staff Balance Privilege: In `firestore.rules`, `isStaff()` updates excluded sensitive identity fields (`role`, `email`, `uid`) but neglected to exclude financial fields (`walletBalance`, `creditPoints`), leaving balance manipulation exposed to non-manager staff. Solved by strictly reserving financial field updates to `isManagerOrAdmin()`.
    4. ⚠️ Public Unauthenticated HTTP Endpoint: In `ga4AdSyncCron.js`, `ga4AdSyncManual` was exported without authorization header validation, exposing live ad budget settlements to public internet triggering. Solved by injecting `INTERNAL_CRON_SECRET` check.
    5. ⚠️ Missing Attendance Rule: `dh-staff-app` logged QR check-ins to `attendance_logs`, but no rule existed in `firestore.rules`, causing silent runtime rejections. Solved by adding explicit `attendance_logs` rules.
    6. ⚠️ OCR Ref 'n/a' Collision: `slipOcrParser.js` returned `'n/a'` when no ref was found, which `verifySlipOcr.js` treated as a valid doc ID `slip_records/n/a`, causing subsequent unreadable slips to be rejected as duplicate. Solved by checking `ocrData.transactionRef && ocrData.transactionRef !== 'n/a'`.
    7. ⚠️ Security Rules Evaluation Quota Multiplier: In `firestore.rules`, helper function `isStaff()` falls back to `exists(...)` and `get(/databases/$(database)/documents/users/$(request.auth.uid))` when the caller's auth token lacks Custom Claims (`token.role` or `token.isStaff`). Under this condition, every single staff-gated document read/write triggers 1-2 Billable Reads in Security Rules alone (reflected in 38K Rules Evaluations). Staff accounts must always be provisioned with Firebase Auth Custom Claims.
    8. ⚠️ Exchange Tasks Overlooked in Todo Guard: In `firestore.rules`, `CLAIM_APPROVAL` and `RETURN_APPROVAL` were protected, but `EXCHANGE_APPROVAL` and `CANCEL_EXCHANGE_APPROVAL` were omitted. Because checks use a negative blacklist, general staff can approve Exchange tasks without manager clearance.
    9. ⚠️ Unmatched Collections in Security Rules: Five collections called in client transactions (`admin_audits`, `wallet_requests`, `partner_reviews`, `returns`, `yearly_archives`) had no rules in `firestore.rules`, causing client-side transactions to fail with `PERMISSION_DENIED`.
    10. ⚠️ Fail-Open Default Secret Fallback: In `ga4AdSyncCron.js:231`, defaulting `process.env.INTERNAL_CRON_SECRET || 'cron_dh_default_secret_2026'` allows unauthorized callers to trigger budget settlements when env vars are missing. Endpoints must fail closed.
    11. ⚠️ Storage Rules Quota Evaluation Leak: In `storage.rules:16-17`, `isStaff()` evaluated `firestore.get(...)` without checking `request.auth.token` first, causing non-staff storage reads/uploads to trigger extra billable Firestore reads.
    12. ⚠️ Local Credential Exposure Risk: Test scripts and ADC files (`scratch_temp_read_adc.json`) escaped `.gitignore` due to exact matching `temp_adc.json` rather than wildcard `*temp_adc*.json`.
    13. ⚠️ Partner Review Reply/Like Permission Block: In `firestore.rules`, `partner_reviews` permitted updates only for `isStaff()`, preventing store owners from replying to or liking reviews on their own store. Solved by adding specific subcollection rule `match /partner_reviews/{partnerId}/comments/{reviewId}` allowing `request.auth.uid == partnerId` to update `['ownerLiked', 'ownerReply']`.
    14. ⚠️ Staff Pending Approval Registration Silence Block: In `firestore.rules:88-94`, `isActive` in `affectedKeys().hasAny(...)` rejected registration requests containing `isActive: false`. Solved by permitting `request.resource.data.get('isActive', false) == false` while removing `isActive` from forbidden keys in `pending_approval` self-requests.
    15. ⚠️ Leave Approval Overlooked in Todo Guard: In `firestore.rules:386-398`, `LEAVE_APPROVAL` was missing from the manager-only blacklist, allowing general staff to approve their own leave. Solved by explicitly adding `LEAVE_APPROVAL` to create/update restricted lists.
    16. ⚠️ General Staff Deletion on Financial Ledger: In `firestore.rules:134, 206`, `wallet_transactions` allowed `update, delete: if isStaff();`. Solved by strictly restricting update and delete to `isManagerOrAdmin()` to ensure financial ledger immutability.
    17. ⚠️ Sourcing Requests IDOR Exposure: In `firestore.rules:424`, `sourcing_requests` permitted any authenticated user to read all requests. Solved by scoping read to document owner (`resource.data.userId == request.auth.uid || resource.data.createdByUid == request.auth.uid`) or `isStaff()`.
    18. ⚠️ Orders Evaluation Short-Circuit: In `firestore.rules:295`, checking customer ownership before `isStaff()` allows customer orders to short-circuit immediately without triggering billable `exists()` and `get()` DB lookups.
    19. ⚠️ Placebo RBAC vs Active Enforcement: When manager UIs provide role permission configuration (`settings/rbac_permissions`), client components frequently default to hardcoded role strings instead of consuming the configuration. Solved by introducing `useRbacPermission` hook into `AuthContext`, providing real-time synchronization, in-memory/sessionStorage caching (Zero Quota Read), fail-safe default roles, and active UI/action gating (`canDeleteOrder`, `canEditProductPrice`, `canEditProduct`, `canApproveRefund`).
    20. ⚠️ God Presentation Components Monolithic Bloat: Presentation components exceeding 300 lines (such as `StoreProfileInfo.jsx` and `OrderSummaryItems.jsx`) mix data-fetching side effects (e.g. inline dynamic IDB imports) with layout orchestration. Solved by extracting domain subcomponents (`StoreProfileServices`, `StoreProfileGallery`, `StoreProfileContactLinks`, `OrderSummaryItemRow`, `FreebieName`) and dedicated data hooks (`useFreebieCatalogName`), maintaining pure presentational architecture and reducing orchestrators under 100 lines.
  </lessons_learned>
</grimoire>
