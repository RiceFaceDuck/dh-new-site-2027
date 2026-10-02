<ssr_memory>
  <flow_and_entry>
    <entry_file>src/pages/managers/RoleTierSettings/RoleTierSettingsPage.jsx</entry_file>
    <sub_components>hooks/useRoleTierSettingsState.js</sub_components>
    <data_flow>RoleTierSettingsPage -> settings/role_tier_config (Firestore) -> creditFormatService (getUserTier) -> Customers list & POS billing</data_flow>
  </flow_and_entry>

  <core_schema>
    <fields>
      - roles: Array<{ id, name, level, description, badgeColor, defaultPriceTier: 'retail'|'wholesale'|'partner'|'enterprise' }>
      - tiers: Array<{ id, name, icon, minPoints, multiplier, color }>
      - hierarchyPolicy: { allowManualRoleOverride, autoTierCalculation, inheritTierDiscount } (currently dormant)
      - updatedAt: Firestore Timestamp
    </fields>
  </core_schema>

  <business_rules>
    <rule id="1">Role vs Tier Separation: Role = business relationship & pricing privilege (assigned); Tier = gamification loyalty based on accumulated points (automated).</rule>
    <rule id="2">Zero Quota Leak: RoleTierConfig must be cached in memory or loaded via application context; never query settings/role_tier_config on every modal open.</rule>
    <rule id="3">Data Integrity: Role levels must be 1-indexed contiguous; Tier multipliers must be >= 1.0; minPoints strictly ascending.</rule>
    <rule id="4">Zero Mojibake: All Thai strings must remain strictly UTF-8 encoded across forms, logs, and default states.</rule>
    <rule id="5">Absolute Deployment Ban: Zero auto-deploy to production, hosting, or Cloud Functions.</rule>
  </business_rules>

  <cross_impact>
    <impact target="customers_crm">Customer profile role selection and customer list badge display must bind to dynamic roles and active tiers.</impact>
    <impact target="pos_billing">Customer role defaultPriceTier should auto-populate POS pricing tier upon customer selection.</impact>
    <impact target="storefront_credit">creditFormatService.getUserTier must consume dynamic tier thresholds and multipliers for checkout points calculation.</impact>
    <impact target="nightly_chunk_guard">Customer directory chunk filter in nightlyChunkGuard.js must not drop valid customer roles (e.g., wholesale, ร้านช่าง).</impact>
  </cross_impact>

  <pitfalls_and_lessons>
    <caution>Legacy file extraction corrupted Thai strings in RoleTierSettingsPage.jsx to ANSI mojibake. Must restore UTF-8 text cleanly.</caution>
    <caution>`useRoleTierSettingsState.js` was orphaned while an inline duplicate hook was used in the page component.</caution>
    <caution>`initRoleTierConfigListener` was dormant; replaced with on-demand `setCachedTiers` & `fetchAndCacheRoleTiers` synced from `settingsService` (zero quota leak).</caution>
    <caution>Nightly guard previously hardcoded customer roles array, dropping wholesale/mechanic customers; fixed by filtering out staff roles (`!isStaffUser`).</caution>
    <caution>Data validation must run before Firestore mutation: enforce unique role levels, strictly ascending minPoints, multiplier >= 1.0, and protect core roles from deletion.</caution>
    <caution>Guide button opened a non-existent modal (phantom state `isGuideOpen`); wired with `RoleTierGuideModal`.</caution>
  </pitfalls_and_lessons>
</ssr_memory>
