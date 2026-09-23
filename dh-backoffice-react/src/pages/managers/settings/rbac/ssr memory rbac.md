<grimoire>
<flow_and_entry>
- Entry: `RbacSettingsPage.jsx` (`/managers/rbac`) -> loads `RbacForm.jsx` and `RbacGuide.jsx`.
- State & Persistence: `useRbacSettings.js` reads/writes Firestore doc `settings/rbac_permissions`.
- Flow: Checkbox toggle triggers auto-save immediately to Firestore and logs to `historyService`.
</flow_and_entry>

<core_schema>
- `settings/rbac_permissions`: {
    canEditProduct: string[],
    canEditProductPrice: string[],
    canDeleteOrder: string[],
    canApproveRefund: string[],
    canViewReports: string[],
    canManageUsers: string[],
    canBypassBufferStock: string[],
    updatedAt: Timestamp
  }
- Roles: `admin`, `owner`, `manager`, `staff`, `packer`, `developer`, `finance`.
</core_schema>

<business_rules>
- Absolute Deployment Ban: All modifications are strictly local. Zero auto-deploy.
- Auto-Save Mandatory: Direct checkbox toggle with pulse status ('saving', 'saved', 'idle'). No manual submit button.
- Fail-Safe Fallbacks: If `settings/rbac_permissions` is missing, fallback to hardcoded safe defaults.
- Zero-Quota Consumer: `AuthContext` caches permissions in `sessionStorage` (`dh_rbac_permissions_cache`) and memory.
- Privilege Escalation Guard: Writing to `settings` requires `isManagerOrAdmin()` in Security Rules.
</business_rules>

<cross_impact>
- Route `/managers/rbac`: Registered in `App.jsx` and navigated from `ManagersOverview` / `QuickAccessTools`.
- `AuthContext.jsx`: Consumes `settings/rbac_permissions` to gate actions across system (Billing, Inventory, Users).
- `historyService`: Records `UPDATE_RBAC` audit entry under `SECURITY` module on every save.
</cross_impact>

<pitfalls_and_lessons>
- ⚠️ Do NOT use obsolete manual submit button; production uses immediate auto-save on toggle.
- ⚠️ Width must be `max-w-7xl` to prevent table squishing across 7 role columns.
- ⚠️ Never omit `developer` or `finance` roles; both exist in production matrix.
- ⚠️ Superadmins (`SUPER_ADMINS`) always bypass permission checks as full Owner/Admin.
</pitfalls_and_lessons>
</grimoire>
