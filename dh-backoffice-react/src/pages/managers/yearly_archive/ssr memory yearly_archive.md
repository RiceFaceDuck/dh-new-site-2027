<grimoire>
<flow_and_entry>
- Entry: `src/pages/managers/yearly_archive/YearlyArchivePage.jsx`.
- Route: `/managers/yearly-archive` protected by `ManagerRoute` in `App.jsx`.
- Invoked via QuickAccessTools on ManagersOverview dashboard.
</flow_and_entry>

<core_schema>
- Collection: `yearly_archives`
- Document ID: `{year}` (e.g. `2025`, `2026`)
- Key fields: { year: number, status: 'locked'|'active', checksumSeal: string (SHA-256), metrics: { sales, inventory, customers, afterSales }, closedAt: Timestamp, closedBy: { uid, email, displayName } }
</core_schema>

<business_rules>
- Immutable Once Sealed: Closed fiscal years cannot be re-calculated without unlocking.
- Cryptographic Integrity: Canonical string hashed via SHA-256 `crypto.subtle.digest` to detect manual database tampering.
- Read Pagination: Cursor pagination (`startAfter` + `limit(500)`) strictly enforced during metric computations.
- Zero Deploy / Zero Git Push: Local-only changes; never auto-deploy to Firebase hosting or Cloud Functions.
</business_rules>

<cross_impact>
- App Navigation: `App.jsx` route `/managers/yearly-archive` renders `YearlyArchivePage`.
- Manager Dashboard: `ManagersOverview/components/QuickAccessTools.jsx` navigates to this page.
- Exports: Generates client-side JSON Ledger and CSV export for management audits.
</cross_impact>

<pitfalls_and_lessons>
- ⚠️ Ensure all Lucide icons (especially `Info` in `YearlyArchiveGuide`) are imported from `lucide-react`.
- ⚠️ Do not unbounded query orders/claims — always use cursor batching to stay within Firestore limits.
- ⚠️ Do not mutate production collections directly without Manager authentication gate.
</pitfalls_and_lessons>
</grimoire>
