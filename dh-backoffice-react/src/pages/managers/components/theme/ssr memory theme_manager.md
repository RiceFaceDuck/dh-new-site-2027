<ssr_memory>
  <flow_and_entry>
    <entry_file>dh-backoffice-react/src/pages/managers/GlobalThemeSettings.jsx</entry_file>
    <data_flow>GlobalThemeSettings switches between ThemeConfigTab and HeroConfigTab -> Hooks/Services (settingsService, heroConfigService) -> Dual-sync with Firestore `settings` collection -> Real-time display on dh-frontend.</data_flow>
  </flow_and_entry>

  <core_schema>
    <theme_doc>settings/storefrontTheme & settings/storefront_config.theme: { themeId, backgroundUrl, blurLevel, opacityTop, opacityMid, opacityBottom, updatedAt }</theme_doc>
    <hero_doc>settings/hero_config: { isActive, title, titleSegments, badge, subtitle, textAlignment, bannerHeight, imageLayout, imageUrl, overlay, primaryButton, secondaryButton, updatedAt }</hero_doc>
  </core_schema>

  <business_rules>
    <rule id="1">Dual-Write Parity: Theme settings must write to both `settings/storefront_config` (under .theme) and `settings/storefrontTheme` to guarantee zero cache regression for dh-frontend.</rule>
    <rule id="2">Single Source Audit Log: Audit logging to historyService.addLog must be handled strictly inside service layer, never duplicated in UI components.</rule>
    <rule id="3">Null & Safe Trimming: Always use optional chaining and fallback on string trimming (e.g. backgroundUrl?.trim() ?? '/user-bg.jpg') to prevent crash on null inputs.</rule>
    <rule id="4">Official Brand Copy: All default copy and fallbacks must strictly reflect DH Notebook brand, never legacy placeholder names (e.g. TEQFIX).</rule>
    <rule id="5">Absolute Deployment Ban: Zero auto-deploy or remote git push under any circumstances.</rule>
  </business_rules>

  <cross_impact>
    <impacted_modules>
      - dh-frontend: `useStorefrontTheme.js` (listens to storefrontTheme), `HeroSection.jsx` (consumes hero_config)
      - dh-backoffice-react: `/managers/theme` (GlobalThemeSettings, ThemeConfigTab, HeroConfigTab)
      - firestore: collections `settings/storefrontTheme`, `settings/hero_config`, `settings/storefront_config`, `history_logs`
    </impacted_modules>
  </cross_impact>

  <pitfalls_and_lessons>
    <pitfall id="1">Double Write in UI: Earlier ThemeConfigTab invoked historyService.addLog alongside settingsService.updateStorefrontTheme, doubling write ops into Firestore.</pitfall>
    <pitfall id="2">Cache Key Misalignment: In dh-frontend, writing raw data to localStorage broke the { data, timestamp } contract of storefrontSettingsService, killing the 15-minute TTL cache.</pitfall>
    <pitfall id="3">Mixed Architecture: Putting state, file uploads, and UI in a single monolithic component violated SRP and made responsive device preview maintenance fragile.</pitfall>
  </pitfalls_and_lessons>
</ssr_memory>
