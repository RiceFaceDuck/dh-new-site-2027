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
    - ⚠️ Trust Badges Platinum White & Parity: Trust badges use `rounded-[0.1rem]`, solid `bg-white`, `border-slate-200/90`, `shadow-md`, dark text `text-slate-800`, sky blue icons, and word wrap without `truncate`; updated labels: "สินค้ามีการรับประกัน" & "ส่งออกภายในวันทันที"; maintain 100% parity across FooterBrand.jsx, LiveStorefrontPreview.jsx, and footerConfigSchema.js.
    - ⚠️ Anchor URL (#) & Copyable Error Invariant: `isSafeUrl` must allow `#` (default for placeholder links) and `mailto:`. Never use browser `alert()` which blocks text copying; display formatted error inside `SaveConfirmationModal` with one-click copy button.
  </pitfalls_and_lessons>
</grimoire>
