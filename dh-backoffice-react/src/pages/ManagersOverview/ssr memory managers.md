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
- Route `/managers/yearly-archive`: Linked from QuickAccessTools and registered in `App.jsx`.
- `AVAILABLE_MENUS`: Must include `freebie` (ของแถม) in `MenuLayoutManager.jsx`.
- Updating `menuConfigService`: Influences menu ordering across all Manager accounts.
- `GlobalCategorySettings`: Must provide `autoSyncCategories` to sync unique categories into `settings/product_categories` and trigger warranty tasks.
- `GlobalFooterSettings`: Dual writes to `settings/storefront_config` (under `footer`) and `settings/footer_config` with TrustBadges, BusinessHours, and SocialHub.
</cross_impact>

<pitfalls_and_lessons>
- ⚠️ Banner must be slim dark `bg-slate-900/95` with `Live` badge, not heavy purple banner.
- ⚠️ Right rail empty state must show clean `ALL CAUGHT UP` with emerald circular icon.
- ⚠️ Manager approvals listener MUST merge `claims` and `todos` real-time to maintain 100% data parity.
- ⚠️ `managerActionService` must delegate claim/return/exchange actions directly to `claimManagerService` facade.
- ⚠️ UI Cards redesign (`GenericTodoCard.jsx` `isManagerTab`): 2-column structured data grid, pill status tags, left border accent. Branch `backup-manager-rail-ui` preserved for instant rollback.
- ⚠️ Always explicitly reassure: 'No Deploy & No Git Push' on every user permission request.
- ⚠️ Always call `ask_question` tool for interactive modal choices when asking user permission, never plain text.
</pitfalls_and_lessons>
</grimoire>
