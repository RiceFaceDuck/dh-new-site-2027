<ssr_local_grimoire name="GenerateSync" version="1.0">
  <flow_and_entry>
    - Entry: `src/pages/GenerateSync/index.jsx`
    - Subcomponents: `GenerateActions.jsx` (left daily/non-daily tasks), `ChangeSummaryPanel.jsx` (right realtime changes & ALL SKU export), `UploadTransactions.jsx` (bottom transaction import).
    - Flow: Store & Firebase queries detect stock/price differences -> present in ChangeSummaryPanel -> user creates TX snapshot or exports Big Seller / Shopee spreadsheets.
  </flow_and_entry>

  <core_schema>
    - Baseline: `system_counters/bigseller_baseline` (`inventory: [{s, q, p}]`, `lastResetAt`).
    - Snapshot: `system_counters/last_detect_snapshot` (`transactionId: "DET-YYYYMMDD-HHmmss"`, `timestamp`, `changes: {increased, decreased, priceChanged, otherChanged}`).
    - Pending Changes: `catalogs/sync_pending_changes` (`pendingCount`, `lastUpdated`, `changes`).
  </core_schema>

  <business_rules>
    - UI Purity: Keep presentation components aligned with production site (`dhnotebook-work.web.app/generate`) in terms of borders, shadows, font weight, and badge colors.
    - Zero Deploy & Zero Git Push: Absolute deployment ban is active. All work remains strictly local on localhost:3168.
    - Non-destructive UX: Never mutate underlying sync logic or data schemas during UI styling refactors unless explicitly instructed.
  </business_rules>

  <cross_impact>
    - `ChangeSummaryPanel.jsx` impacts live snapshot view and CSV download triggers.
    - `GenerateActions.jsx` impacts daily inventory counting workflow with Big Seller.
    - `UploadTransactions.jsx` impacts manual bulk stock adjustments and audit history.
  </cross_impact>

  <pitfalls_and_lessons>
    - ⚠️ Localhost vs Production divergence: Production removed the "Auto Refresh" right box from the status bar; keeping it caused visual misalignment.
    - ⚠️ Compact Firestore Schema: `system_counters/bigseller_baseline` uses compact `{ s, q, p, n }`. Must unpack before calculating diffs or panel collapses to blank.
    - ⚠️ Zero-Read Catalog: Never query GAS directly on load (timeouts). Use `inventorySyncMetaService.getOrFetchCatalog()` (IndexedDB 0-read).
    - ⚠️ ALL-SKU Pipeline: Connect `PrepareFullCatalogAction` via `onPrepare` to build `EXP-YYYYMMDD-HHMMSS` dataset and feed `latestFullExport` to daily exports.
    - ⚠️ Zero Ghost Bills: Never synthesize `BS-SYNC-` or `STK-IN-`. Link authentic POS orders (`INV-`) or claims (`RTN-`, `EXC-`). Unlinked items are flagged as unreferenced adjustments with no dead links.
    - ⚠️ Dynamic Template Headers: Shopee templates can have 1-3 header tiers. Never hardcode row 1 or column 5. Use 25-row dynamic scanning and Satang rounding (2 decimal places).
    - ⚠️ User Communication: Always report % progress on long tasks and strictly use `ask_question` modal to request permission before starting next phase.
  </pitfalls_and_lessons>
</ssr_local_grimoire>
