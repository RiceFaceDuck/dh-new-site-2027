<ssr_memory>
  <flow_and_entry>
    <entry_file>dh-backoffice-react/src/pages/managers/GlobalThemeSettings.jsx</entry_file>
    <data_flow>GlobalThemeSettings switches between ThemeConfigTab and HeroConfigTab -> HeroConfigTab uses Master-Detail architecture (HeroBannerListView <-> Edit View) -> useHeroConfig -> heroConfigService -> Dual-sync with Firestore `settings/hero_config` -> Real-time Carousel display on dh-frontend (HeroSection.jsx).</data_flow>
  </flow_and_entry>

  <core_schema>
    <theme_doc>settings/storefrontTheme & settings/storefront_config.theme: { themeId, backgroundUrl, blurLevel, opacityTop, opacityMid, opacityBottom, updatedAt }</theme_doc>
    <hero_doc>settings/hero_config: { isActive, aspectRatio ('16:9' | '3:1' | '21:9' | 'auto'), autoplay, autoplaySpeed, transitionEffect ('slide' | 'fade'), banners: Array<{ id, title, titleSegments, badge, subtitle, textAlignment, imageLayout, imageFit ('contain' | 'cover'), imageUrl, overlay, primaryButton, secondaryButton, order, isActive }>, updatedAt }</hero_doc>
  </core_schema>

  <business_rules>
    <rule id="1">Dual-Write Parity: Theme settings must write to both `settings/storefront_config` (under .theme) and `settings/storefrontTheme` to guarantee zero cache regression for dh-frontend.</rule>
    <rule id="2">Single Source Audit Log: Audit logging to historyService.addLog must be handled strictly inside service layer, never duplicated in UI components.</rule>
    <rule id="3">Null & Safe Trimming: Always use optional chaining and fallback on string trimming (e.g. backgroundUrl?.trim() ?? '/user-bg.jpg') to prevent crash on null inputs.</rule>
    <rule id="4">Official Brand Copy: All default copy and fallbacks must strictly reflect DH Notebook brand, never legacy placeholder names.</rule>
    <rule id="5">Absolute Deployment Ban: Zero auto-deploy or remote git push under any circumstances.</rule>
    <rule id="6">UI Border Radius 0.1: All containers, cards, tabs, and input wrappers in Hero Banner manager strictly follow `rounded-[2px]` (0.1rem) and elevated contrast (border-slate-300) to prevent washed-out white appearance.</rule>
    <rule id="7">Aspect Ratio Lock Invariant: Hero banner containers strictly enforce aspect ratio locking (16:9, 3:1, 21:9, auto) with imageFit ('contain' / 'cover') to prevent unwanted cropping on PC and Mobile.</rule>
  </business_rules>

  <cross_impact>
    <impacted_modules>
      - dh-frontend: `HeroSection.jsx` (consumes hero_config, provides responsive aspect-ratio slider with touch swipe & autoplay)
      - dh-backoffice-react: `/managers/theme` (HeroConfigTab, HeroBannerListView, HeroLivePreview, useHeroConfig)
      - firestore: collections `settings/hero_config`, `history_logs`
    </impacted_modules>
  </cross_impact>

  <pitfalls_and_lessons>
    <pitfall id="1">Image Cropping on Fixed Height: Fixed min-height combined with object-cover cropped bottom tools (keyboards, laptop edges); solved by locking container aspect ratio (e.g. aspect-[16/9]) and supporting imageFit='contain'.</pitfall>
    <pitfall id="2">Washed-out White UI: White cards on white background with border-slate-200 lacked contrast; solved by upgrading borders to border-slate-300, adding bg-slate-50 accents, and enforcing rounded-[2px].</pitfall>
    <pitfall id="3">Multi-Banner Backward Compatibility: Earlier versions stored a single flat banner at the root of hero_config. Service layer now mirrors first active banner to root fields while maintaining full array in `banners`.</pitfall>
    <pitfall id="4">Google Drive Referer Block (HTTP 429): Loading Google Drive thumbnail links directly sends origin Referer header; must enforce `referrerPolicy="no-referrer"` on all `<img>` tags.</pitfall>
    <pitfall id="5">Storefront Cache Stale: Polling `getHeroConfig()` with 15-minute localStorage TTL caused storefront to not show live banner updates; solved by adding onSnapshot real-time listener.</pitfall>
    <pitfall id="6">5MB File Size Alert & Drive Dependency: Legacy hero image upload relied on Google Apps Script (driveService) with hardcoded 5MB alert blocker. Upgraded to `bannerStorageService` featuring client-side WebP compression (1920px, quality 0.82) reducing high-res images to ~150-300KB and uploading directly to Firebase Storage (`assets/banners/`).</pitfall>
  </pitfalls_and_lessons>
</ssr_memory>
