<grimoire>
<flow_and_entry>
- Entry: `ManagersOverview/index.jsx` -> loads `QuickAccessTools.jsx` (left grid) & `ManagerTaskSection.jsx` (right approvals rail).
- Layout config loaded dynamically via `menuConfigService.js` (`settings/manager_menus`).
- Modal triggers (VIP, Staff, Email, Drive, QR, LayoutManager, WarrantyChecker) handled at page level.
</flow_and_entry>

<core_schema>
- `settings/manager_menus`: { zones: [{ id: string, title: string, menuIds: string[] }] }
- `todos` (manager queue): { status: 'pending'|'pending_manager', type: string, priority: string }
- `users`: { rank: 'VIP'|'Customer', role: 'pending'|'staff'|'admin'|'manager'|'owner' }
</core_schema>

<business_rules>
- Zero Deploy & Zero Git Push: Absolute deployment ban is active. All updates strictly remain local.
- UI/UX Purity: Focus strictly on presentation (colors, borders, shadows, layout, typography). Do not alter business logic or trigger mechanics without approval.
- In-App Doc Rule: Manual must be in modal popup (`ManagerDocModal`), never taking up permanent dashboard real estate.
- Unassigned menus belong in separate fallback zone if not in default layout.
</business_rules>

<cross_impact>
- Route `/managers`: Linked from sidebar navigation (`AdminLayout.jsx`).
- Master DB button: Opens Google Sheets restricted to Manager/Owner.
- Audit Ledger button: Navigates to `/managers/audit-ledger`.
- Updating `menuConfigService`: Influences menu ordering across all Manager accounts.
</cross_impact>

<pitfalls_and_lessons>
- ⚠️ Banner must be slim dark `bg-slate-900/95` with `Live` badge, not heavy purple banner.
- ⚠️ Right rail empty state must show clean `ALL CAUGHT UP` with emerald circular icon.
- ⚠️ Do not hardcode menu lists that omit `yearly_archive` or show removed `knowledge` items.
- ⚠️ Always check local backups before mutating files.
</pitfalls_and_lessons>
</grimoire>
