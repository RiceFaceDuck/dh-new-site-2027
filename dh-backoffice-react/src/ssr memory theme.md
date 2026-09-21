<ssr_memory>
  <flow_and_entry>
    <entry_file>dh-backoffice-react/src/index.css</entry_file>
    <data_flow>Utility class `.dh-header-gradient` consumed across all primary dashboard headers (Claims, Inventory, GenerateSync, Customers, Search, Billing, Todo, Gallery) -> Renders unified solid header background.</data_flow>
  </flow_and_entry>

  <core_schema>
    <style_utility>.dh-header-gradient</style_utility>
    <locked_color>#1e3a8a (Deep Classic Navy Blue)</locked_color>
    <text_color>#ffffff (Pure White text and icons)</text_color>
  </core_schema>

  <business_rules>
    <rule>Solid Locked Tone: Top page headers must remain a single, solid dark tone (#1e3a8a). No linear gradients and no animation drift.</rule>
    <rule>Pure Styling Scope: Never touch JSX components or hooks when adjusting global header styling; configure centrally in `index.css`.</rule>
    <rule>Absolute Deployment Ban: Never auto-deploy to production or push to git remotes.</rule>
  </business_rules>

  <cross_impact>
    <impacted_pages>
      - /claims (ClaimHeader)
      - /inventory (InventoryHeader)
      - /generate (GenerateSyncHeader)
      - /customers (CustomerHeader)
      - /search (SearchHeader)
      - /todo (TodoPageHeader)
      - /billing (BillingDashboard)
      - /gallery (GalleryMain)
    </impacted_pages>
  </cross_impact>

  <pitfalls_and_lessons>
    <pitfall>Animated multi-stop gradients cause visual distraction and readability issues with white text when moving across bright cyan hues.</pitfall>
    <lesson>Locking the utility class `.dh-header-gradient` to a single solid color in `index.css` safely standardizes all top bars without any risk of breaking React logic or state.</lesson>
  </pitfalls_and_lessons>
</ssr_memory>
