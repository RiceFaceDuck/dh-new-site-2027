# 📜 SSR Local Grimoire — Cloud Functions & Backend Automation

<grimoire>
  <workflow>
    1. Operational Overview: Firebase Cloud Functions v1/v2 provide automated triggers, cron maintenance jobs, and backend security validations.
    2. Auth Custom Claims Trigger (`auth/userClaimsTrigger.js`): Listens to `users/{uid}` onWrite. Maps database role strings (English & Thai) into Firebase Auth Custom Claims (`role`, `isStaff`, `isManager`, `isAdmin`) so client tokens carry authorization without database lookups.
    3. GA4 Ad Sync Cron (`marketing/ga4AdSyncCron.js`): Scheduled job pulling Google Analytics impressions and clicks to update partner ad metrics. Enforces strict bearer token authentication with fail-closed security.
    4. Nightly Maintenance: Chunks product catalogs, guards against orphaned storage files, and summarizes daily telemetry logs.
  </workflow>

  <core_schema>
    1. Auth Custom Claims:
       - `role`: 'admin' | 'owner' | 'manager' | 'staff' | 'packer' | 'customer'
       - `isStaff`: boolean
       - `isManager`: boolean
       - `isAdmin`: boolean
    2. Role Mapping Matrix:
       - `เจ้าของ`, `owner` -> `admin`
       - `แอดมิน`, `admin` -> `admin`
       - `ผู้จัดการ`, `manager`, `vp` -> `manager`
       - `บัญชี`, `accountant` -> `staff`
       - `ช่าง`, `technician` -> `staff`
       - `พนักงานแพ็ค`, `packer` -> `packer` (with `isStaff: true`)
       - `พนักงานทั่วไป`, `staff` -> `staff`
       - `customer` -> `customer`
  </core_schema>

  <rules_and_conditions>
    1. Fail-Closed Authentication: Cloud Function HTTP/Webhook endpoints must strictly validate auth tokens or secret headers against environment secrets. Never allow hardcoded fallback secrets.
    2. Absolute Deploy Block: Strict ban on automatic or direct deployments. Never deploy Cloud Functions automatically under any circumstance. All deployments are permanently blocked until direct user override.
    3. Thai Role Preservation: The auth trigger must normalize all Thai role strings so employees assigned Thai titles in the Backoffice receive appropriate managerial or staff Custom Claims.
  </rules_and_conditions>

  <techniques>
    1. Token Refresh Signal: After updating custom claims on a user record, store `claimsUpdatedAt` timestamp on the user doc so client apps can call `user.getIdToken(true)` when needed.
    2. Secret Manager Integration: Use `functions.config()` or Google Cloud Secret Manager for sensitive cron secrets, failing closed with HTTP 401 if secrets are undefined or mismatched.
  </techniques>

  <lessons_learned>
    1. ⚠️ Thai Manager Demotion Vulnerability: Previously, `userClaimsTrigger.js` only checked `['staff', 'manager', 'admin', 'owner', 'vp']`. Any employee assigned a Thai role like `'ผู้จัดการ'` or `'เจ้าของ'` fell through the check and was demoted to `'staff'` or `'customer'`. Fixed by including all Thai roles in the mapper.
    2. ⚠️ Hardcoded Fallback Secret in ga4AdSyncCron: Previously, if `INTERNAL_CRON_SECRET` was missing from environment config, `ga4AdSyncCron.js` fell back to a default hardcoded secret string. Removed fallback secret to fail closed with 401 Unauthorized.
    3. ⚠️ Cloud Functions Deployment Desync: Functions modified locally must be checked against live deployment state to avoid silent regression where clients invoke old Cloud Function revisions.
  </lessons_learned>
</grimoire>
