<ssr_memory>
  <flow_and_entry>
    <entry_file>src/layouts/AdminLayout.jsx -> src/layouts/components/Sidebar.jsx</entry_file>
    <data_flow>AdminLayout mounts -> checks auth/RBAC -> conditionally subscribes to manager/claim todos only if isManagerOrOwner() -> provides notification badge counts and theme to Sidebar -> renders Outlet.</data_flow>
  </flow_and_entry>

  <core_schema>
    <props>todoCount, unreadCount, pendingClaimCount, managerApprovalCount, isDark, toggleDarkMode</props>
    <theme_storage_key>dh_theme_mode ('dark' | 'light') in localStorage</theme_storage_key>
    <ping_target>/favicon.ico?t= (HEAD request with AbortController 3000ms)</ping_target>
  </core_schema>

  <business_rules>
    <rule>Manager Access Boundary: Never subscribe to managerTodoService for non-manager roles; saves 2,500 reads per staff login.</rule>
    <rule>No Dead Fetches: Never query Firestore for badges or counts that are not explicitly rendered in the Sidebar UI.</rule>
    <rule>Action Safety Guard: The 'เลิกงาน' (Logout) button must require an inline confirmation step to prevent accidental logouts.</rule>
    <rule>Sub-route Active Parity: The Manager navItem must remain active on all sub-routes (e.g. /managers/*) using path prefix matching.</rule>
    <rule>Notification Parity: All active tasks appearing in the Operations Center (/todo) must be reflected in the Sidebar To-do badge count.</rule>
    <rule>Absolute Deployment Ban: Strictly prohibited from deploying to production, Firebase Hosting, or Cloud Functions.</rule>
  </business_rules>

  <cross_impact>
    <impacted_modules>
      - /todo (Operations Center badge now displays pending task counts including ad/store approvals and wholesale requests)
      - /managers/* (All 25+ manager settings pages now correctly preserve active sidebar indicator)
      - /billing (Embedded [+] button triggers dh_open_new_bill and routes to POS)
      - Theme Lifecycle (Dark mode state preserved across page refreshes via localStorage)
      - User Profile Modal (Thai UTF-8 encoding preserved without Mojibake)
    </impacted_modules>
  </cross_impact>

  <pitfalls_and_lessons>
    <pitfall>Querying users for pending staff when the Sidebar has nowhere to render it wasted 600 reads per mount.</pitfall>
    <pitfall>Filtering out MANAGER_TASK_TYPES from subscribePendingTodos caused the To-do sidebar menu to show 0 badges even when pending partner/ad approvals were waiting on the board.</pitfall>
    <pitfall>Using faint pastel backgrounds (bg-red-100) and translucent active boxes (bg-white/20) made notification badges washed out and invisible.</pitfall>
    <lesson>Notification badges must use solid vivid red (bg-rose-500 text-white font-black) with ring-2 ring-white on active buttons for crisp, immediate eye-catching visibility.</lesson>
    <lesson>Always wrap manager-level Firestore listeners with hasManagerAccess check in layout shells.</lesson>
    <lesson>Cap badge numbers at 99+ to prevent text overflowing and layout shifts on high-volume alerts.</lesson>
    <lesson>Sidebar nav labels and categories must display Thai by default, switching to English only on hover.</lesson>
  </pitfalls_and_lessons>
</ssr_memory>