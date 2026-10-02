<grimoire>
  <metadata>
    <component>Footer Settings Subsystem</component>
    <domain>Storefront & Management System</domain>
    <last_updated>2026-10-02</last_updated>
  </metadata>

  <flow_and_entry>
    - Entry: GlobalFooterSettings.jsx (Manager UI) -> footerSettingsService.js (Firestore dual-write).
    - Client: Footer.jsx (dh-frontend) -> footerClientService.js (SessionStorage cache + dual-read).
    - Flow: User edits in Manager UI -> validates via footerConfigSchema.js -> writes to settings/storefront_config + settings/footer_config -> Storefront reads cached/synced config.
  </flow_and_entry>

  <core_schema>
    - Primary Doc: settings/storefront_config (field: footer) & settings/footer_config
    - Keys: colors (bgDark, textMuted, primaryAccent), company (name, logoUrl, description, address, lineId, lineAddFriendUrl, phone)
    - Collections: quickLinks[{id, label, url}], supportLinks[{id, label, url}]
    - Modules: socialHub (enabled, facebook, tiktok, line, youtube, instagram), trustBadges (enabled, badges[{id, label, icon, active, description}])
    - Schedule: businessHours (openHours, closeHours, days, emergencyCare{available, phone, label})
    - Styling & USP: styling (theme, containerBg, cardBg, borderColor, accentColor), marketingUsp (enabled, items[])
  </core_schema>

  <business_rules>
    - Safe URLs Only: All URLs must pass isSafeUrl allowlist; dangerous schemes (javascript:, data:, vbscript:) are strictly forbidden.
    - Social Media Whitelist: Social URLs must belong to legitimate platform domains (facebook.com, tiktok.com, line.me, youtube.com, instagram.com).
    - Zero Breaking Changes: Always fallback to CANONICAL_DEFAULT_FOOTER_CONFIG when documents are missing or corrupted.
    - Dual-Source Sync: Backoffice must write to both storefront_config (centralized) and footer_config (legacy) in a single atomic batch.
  </business_rules>

  <cross_impact>
    - dh-backoffice-react: /managers/footer-settings (GlobalFooterSettings.jsx) and LiveStorefrontPreview.jsx.
    - dh-frontend: Global footer mounted across all storefront routes (Footer.jsx, FooterBrand.jsx, FooterContact.jsx, FooterLinkZone.jsx).
    - GA4 Analytics: Non-blocking telemetry events (footer_click) fired on link and social interactions.
  </cross_impact>

  <pitfalls_and_lessons>
    - ⚠️ Tailwind JIT Flaw: Dynamic template string classnames (e.g. `bg-${colors.bgDark}`) get purged in production builds; map them to explicit lookup table (bgMap) with inline style fallback.
    - ⚠️ E-commerce Contact Parity: Live preview and actual storefront must align 100% on header titles ("ติดต่อ & เวลาทำการ") and business hours display.
    - ⚠️ Non-blocking Telemetry: Never await or throw on GA4 logEvent; wrap in try/catch to protect UI navigation from ad-blocker crashes.
    - ⚠️ Centralized Test Location: All tests must reside in Management System/tests/verifications/, never in root or scripts/.
  </pitfalls_and_lessons>
</grimoire>
