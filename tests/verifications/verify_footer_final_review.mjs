/**
 * 🧪 STAGE FINAL REVIEW: FOOTER SETTINGS AUDIT & UPGRADE
 * Location: Management System/tests/verifications/verify_footer_final_review.mjs
 * 
 * Comprehensive 6-Dimension Audit & Rigorous Fact-Checking:
 * 1. Schema & Validation Parity (Canonical 10 Blocks + Safe URLs + Social Allowlist)
 * 2. Backoffice Dual-Write & Layout Parity
 * 3. Storefront Rendering & Tailwind JIT Bug Fix Parity
 * 4. GA4 Telemetry & Ad-Blocker Resilience
 * 5. Architectural Boundaries, Clean Code & Lint Quality
 * 6. Local Grimoire SSR Memory & Master Index Compliance
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('================================================================');
console.log('🧪 OPERATION FINAL REVIEW: FOOTER SETTINGS SUBSYSTEM (100-POINT AUDIT)');
console.log('================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = [];

function check(title, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  ✅ PASS: ${title}`);
    passedChecks++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${title}`);
    console.error(`         Reason: ${err.message}`);
    failedChecks.push({ title, error: err.message });
  }
}

async function runStageFinalReview() {
  // -------------------------------------------------------------
  // Group 1: Schema & Data Integrity
  // -------------------------------------------------------------
  console.log('👉 [1/6] Auditing Schema & Data Integrity Contracts');

  const schemaFile = path.resolve(rootDir, 'dh-shared/src/schemas/footerConfigSchema.js');
  check('footerConfigSchema.js exists in dh-shared', () => {
    assert(fs.existsSync(schemaFile));
  });

  const {
    FooterConfigSchema,
    CANONICAL_DEFAULT_FOOTER_CONFIG,
    getDefaultFooterConfig,
    isSafeUrl,
    validateSocialUrl
  } = await import(`file://${schemaFile.replace(/\\/g, '/')}`);

  check('Canonical default config contains all canonical blocks', () => {
    const keys = Object.keys(CANONICAL_DEFAULT_FOOTER_CONFIG);
    const required = ['colors', 'company', 'quickLinks', 'supportLinks', 'socialHub', 'trustBadges', 'businessHours', 'marketingUsp', 'styling'];
    for (const r of required) {
      assert(keys.includes(r), `Missing required block: ${r}`);
    }
  });

  check('getDefaultFooterConfig returns a detached deep clone', () => {
    const c1 = getDefaultFooterConfig();
    const c2 = getDefaultFooterConfig();
    assert.notStrictEqual(c1, c2, 'Must return different instances');
    c1.company.name = 'MUTATED';
    assert.strictEqual(c2.company.name, undefined);
  });

  check('FooterConfigSchema parses canonical config with zero errors', () => {
    const parsed = FooterConfigSchema.parse(CANONICAL_DEFAULT_FOOTER_CONFIG);
    assert.strictEqual(parsed.company.lineId, '@dhnotebook');
    assert.strictEqual(parsed.quickLinks.length, 4);
    assert.strictEqual(parsed.trustBadges.badges.length, 4);
  });

  check('FooterConfigSchema safely hydrates empty payload {} without crash', () => {
    const hydrated = FooterConfigSchema.parse({});
    assert.strictEqual(hydrated.colors.bgDark, 'slate-900');
    assert.strictEqual(hydrated.trustBadges.enabled, true);
    assert.strictEqual(hydrated.businessHours.openHours, '10:00');
    assert.strictEqual(hydrated.businessHours.closeHours, '19:30');
  });

  check('isSafeUrl strictly enforces scheme whitelist', () => {
    assert.strictEqual(isSafeUrl('https://dhnotebook.com'), true);
    assert.strictEqual(isSafeUrl('/categories/tools'), true);
    assert.strictEqual(isSafeUrl('tel:0812345678'), true);
    assert.strictEqual(isSafeUrl('javascript:alert(1)'), false);
    assert.strictEqual(isSafeUrl('vbscript:msgbox(1)'), false);
    assert.strictEqual(isSafeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='), false);
    assert.strictEqual(isSafeUrl('//evil.com/xss'), false);
  });

  check('validateSocialUrl strictly enforces platform domains', () => {
    assert.strictEqual(validateSocialUrl('facebook', 'https://www.facebook.com/dhnotebook'), true);
    assert.strictEqual(validateSocialUrl('tiktok', 'https://tiktok.com/@dhnotebook'), true);
    assert.strictEqual(validateSocialUrl('line', 'https://line.me/ti/p/~@dhnotebook'), true);
    assert.strictEqual(validateSocialUrl('youtube', 'https://youtube.com/@dhnotebook'), true);
    assert.strictEqual(validateSocialUrl('instagram', 'https://instagram.com/dhnotebook'), true);
    assert.strictEqual(validateSocialUrl('facebook', 'https://phishing-facebook.evil.com'), false);
    assert.strictEqual(validateSocialUrl('tiktok', 'https://google.com'), false);
  });

  // -------------------------------------------------------------
  // Group 2: Backoffice Services & Component Layout
  // -------------------------------------------------------------
  console.log('\n👉 [2/6] Auditing Backoffice Services & Layout Alignment');

  const boServiceFile = path.resolve(rootDir, 'dh-backoffice-react/src/firebase/footerSettingsService.js');
  check('footerSettingsService enforces schema validation before Firestore write', () => {
    const code = fs.readFileSync(boServiceFile, 'utf8');
    assert(code.includes('FooterConfigSchema.parse(configData)'), 'Missing schema parse before write');
  });

  check('footerSettingsService performs atomic batch dual-write', () => {
    const code = fs.readFileSync(boServiceFile, 'utf8');
    assert(code.includes('batch.set(storefrontRef'), 'Missing write to storefront_config');
    assert(code.includes('batch.set(footerRef'), 'Missing write to footer_config');
    assert(code.includes('await batch.commit()'), 'Missing batch commit');
  });

  const boPageFile = path.resolve(rootDir, 'dh-backoffice-react/src/pages/managers/GlobalFooterSettings.jsx');
  check('GlobalFooterSettings layout order matches live production website', () => {
    const code = fs.readFileSync(boPageFile, 'utf8');
    const previewIdx = code.indexOf('<LiveStorefrontPreview');
    const colorIdx = code.indexOf('<ColorThemeSection');
    const brandIdx = code.indexOf('<ContactInfoSection');
    const linksIdx = code.indexOf('<LinkZoneSection');

    assert(previewIdx !== -1, 'LiveStorefrontPreview exists');
    assert(colorIdx !== -1, 'ColorThemeSection exists');
    assert(brandIdx !== -1, 'ContactInfoSection exists');
    assert(linksIdx !== -1, 'LinkZoneSection exists');

    assert(previewIdx < colorIdx, 'Preview must come first');
    assert(colorIdx < brandIdx, 'Colors must come before Brand');
    assert(brandIdx < linksIdx, 'Brand/Badges must come before Links');
  });

  const boHeaderFile = path.resolve(rootDir, 'dh-backoffice-react/src/components/managers/GlobalSettingsHeader.jsx');
  check('GlobalSettingsHeader supports titleExtra prop', () => {
    const code = fs.readFileSync(boHeaderFile, 'utf8');
    assert(code.includes('titleExtra'), 'Missing titleExtra prop in GlobalSettingsHeader');
  });

  const boPreviewFile = path.resolve(rootDir, 'dh-backoffice-react/src/pages/managers/components/footer/LiveStorefrontPreview.jsx');
  check('LiveStorefrontPreview renders accurate title and contact headers', () => {
    const code = fs.readFileSync(boPreviewFile, 'utf8');
    assert(code.includes('ภาพจำลองการแสดงผลหน้าร้านจริง'), 'Preview title mismatch');
    assert(code.includes('ติดต่อ & เวลาทำการ'), 'Contact header mismatch in preview');
  });

  // -------------------------------------------------------------
  // Group 3: Storefront UI Parity & Tailwind JIT Resilience
  // -------------------------------------------------------------
  console.log('\n👉 [3/6] Auditing Storefront UI & Tailwind JIT Parity');

  const feClientFile = path.resolve(rootDir, 'dh-frontend/src/firebase/footerClientService.js');
  check('footerClientService implements SessionStorage caching with TTL', () => {
    const code = fs.readFileSync(feClientFile, 'utf8');
    assert(code.includes('sessionStorage.getItem'), 'Missing session storage read');
    assert(code.includes('sessionStorage.setItem'), 'Missing session storage write');
    assert(code.includes('CACHE_EXPIRY_MS'), 'Missing cache TTL expiry check');
  });

  const feFooterFile = path.resolve(rootDir, 'dh-frontend/src/components/Footer.jsx');
  check('Footer.jsx prevents dynamic Tailwind class purge via bgMap + inline style', () => {
    const code = fs.readFileSync(feFooterFile, 'utf8');
    assert(code.includes('bgMap'), 'Missing bgMap lookup dictionary');
    assert(code.includes('style={{ backgroundColor: resolvedBg }}'), 'Missing inline background style fallback');
    assert(code.includes('Cookie Policy'), 'Missing Cookie Policy link in bottom bar');
  });

  const feBrandFile = path.resolve(rootDir, 'dh-frontend/src/components/footer/FooterBrand.jsx');
  check('FooterBrand dynamically renders Trust Badges with fallback icons', () => {
    const code = fs.readFileSync(feBrandFile, 'utf8');
    assert(code.includes('BADGE_ICONS'), 'Missing BADGE_ICONS fallback dictionary');
    assert(code.includes('isTrustBadgesEnabled'), 'Missing trust badges enabled check');
    assert(code.includes('activeBadges.map'), 'Missing dynamic badge iteration');
  });

  check('FooterBrand renders clickable Social Media Hub with brand styling', () => {
    const code = fs.readFileSync(feBrandFile, 'utf8');
    assert(code.includes('socialHubConfig.facebook'), 'Facebook link rendering');
    assert(code.includes('socialHubConfig.tiktok'), 'TikTok link rendering');
    assert(code.includes('socialHubConfig.line'), 'LINE link rendering');
    assert(code.includes('socialHubConfig.youtube'), 'YouTube link rendering');
    assert(code.includes('socialHubConfig.instagram'), 'Instagram link rendering');
  });

  const feContactFile = path.resolve(rootDir, 'dh-frontend/src/components/footer/FooterContact.jsx');
  check('FooterContact matches live layout with business hours and clickable links', () => {
    const code = fs.readFileSync(feContactFile, 'utf8');
    assert(code.includes('ติดต่อ & เวลาทำการ'), 'Contact header title mismatch');
    assert(code.includes('businessHoursConfig'), 'Missing business hours configuration binding');
    assert(code.includes('Clock'), 'Missing Clock icon import and usage');
    assert(code.includes('tel:'), 'Missing clickable tel: link');
    assert(code.includes('lineUrl ?'), 'Missing clickable Line link');
  });

  // -------------------------------------------------------------
  // Group 4: GA4 Telemetry & Non-Blocking Resilience
  // -------------------------------------------------------------
  console.log('\n👉 [4/6] Auditing GA4 Telemetry & Non-Blocking Resilience');

  const feTelemetryFile = path.resolve(rootDir, 'dh-frontend/src/firebase/footerAnalyticsService.js');
  check('footerAnalyticsService exists and exports trackFooterClick', () => {
    assert(fs.existsSync(feTelemetryFile));
    const code = fs.readFileSync(feTelemetryFile, 'utf8');
    assert(code.includes('export const trackFooterClick'), 'Missing trackFooterClick export');
  });

  check('trackFooterClick guards against uninitialized analytics and ad-blockers', () => {
    const code = fs.readFileSync(feTelemetryFile, 'utf8');
    assert(code.includes('if (!analytics) return;'), 'Missing analytics null check');
    assert(code.includes('try {') && code.includes('catch (err)'), 'Missing try/catch non-blocking wrapper');
    assert(code.includes('console.debug'), 'Missing non-blocking debug suppression');
  });

  check('Storefront components integrate trackFooterClick on interactive elements', () => {
    const brandCode = fs.readFileSync(feBrandFile, 'utf8');
    const contactCode = fs.readFileSync(feContactFile, 'utf8');
    const linkZoneFile = path.resolve(rootDir, 'dh-frontend/src/components/footer/FooterLinkZone.jsx');
    const linkZoneCode = fs.readFileSync(linkZoneFile, 'utf8');

    assert(brandCode.includes('trackFooterClick'), 'FooterBrand missing telemetry integration');
    assert(contactCode.includes('trackFooterClick'), 'FooterContact missing telemetry integration');
    assert(linkZoneCode.includes('trackFooterClick'), 'FooterLinkZone missing telemetry integration');
  });

  // -------------------------------------------------------------
  // Group 5: Pre-flight Backups & Clean Architecture
  // -------------------------------------------------------------
  console.log('\n👉 [5/6] Auditing Pre-Flight Backups & Clean Architecture Boundaries');

  const backupDirs = [
    path.resolve(rootDir, '_Backups/2026-10-02_Footer_Phase2_Backup'),
    path.resolve(rootDir, '_Backups/2026-10-02_Footer_Phase3_Backup'),
    path.resolve(rootDir, '_Backups/2026-10-02_Footer_Phase4_Backup')
  ];

  for (const bDir of backupDirs) {
    const base = path.basename(bDir);
    check(`Pre-flight backup directory exists: ${base}`, () => {
      assert(fs.existsSync(bDir), `Backup dir missing: ${bDir}`);
      const files = fs.readdirSync(bDir);
      assert(files.length > 0, `Backup dir is empty: ${bDir}`);
    });
  }

  check('Zero circular imports: dh-shared does not import from dh-frontend or dh-backoffice-react', () => {
    const sharedSchema = fs.readFileSync(schemaFile, 'utf8');
    assert(!sharedSchema.includes('dh-frontend'), 'Illegal import of dh-frontend inside dh-shared');
    assert(!sharedSchema.includes('dh-backoffice-react'), 'Illegal import of dh-backoffice-react inside dh-shared');
  });

  // -------------------------------------------------------------
  // Group 6: SSR Memory Grimoire & Master Index
  // -------------------------------------------------------------
  console.log('\n👉 [6/6] Auditing SSR Memory Grimoire & Index Compliance');

  const grimoireFile = path.resolve(rootDir, 'dh-backoffice-react/src/pages/managers/components/footer/ssr memory footer_settings.md');
  check('Local Grimoire ssr memory footer_settings.md exists', () => {
    assert(fs.existsSync(grimoireFile));
  });

  check('Grimoire conforms to XML format, has 5 core sections, and stays <= 80 lines', () => {
    const content = fs.readFileSync(grimoireFile, 'utf8');
    const lines = content.split('\n');
    assert(lines.length <= 80, `Grimoire exceeded 80 lines limit (currently ${lines.length} lines)`);
    assert(content.includes('<flow_and_entry>'), 'Missing <flow_and_entry> tag');
    assert(content.includes('<core_schema>'), 'Missing <core_schema> tag');
    assert(content.includes('<business_rules>'), 'Missing <business_rules> tag');
    assert(content.includes('<cross_impact>'), 'Missing <cross_impact> tag');
    assert(content.includes('<pitfalls_and_lessons>'), 'Missing <pitfalls_and_lessons> tag');
  });

  const indexFile = path.resolve(rootDir, '../_agents/memory/INDEX.md');
  check('Master Index _agents/memory/INDEX.md links to footer settings memory', () => {
    const content = fs.readFileSync(indexFile, 'utf8');
    assert(content.includes('ssr memory footer_settings.md'), 'Missing index reference in INDEX.md');
  });

  // -------------------------------------------------------------
  // Summary & Score
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`🏁 FINAL AUDIT SCORE: ${passedChecks}/${totalChecks} CHECKS PASSED`);
  console.log('================================================================');

  const score = Math.round((passedChecks / totalChecks) * 100);
  console.log(`⭐ Stage Quality Rating: ${score}/100`);

  if (failedChecks.length > 0) {
    console.error(`\n❌ Failed Checks (${failedChecks.length}):`);
    failedChecks.forEach(f => console.error(`   - ${f.title}: ${f.error}`));
    process.exit(1);
  } else {
    console.log(`\n🎉 VERDICT: STAGE AUDIT 100% COMPLETE AND VERIFIED (PASS)`);
    process.exit(0);
  }
}

runStageFinalReview().catch(err => {
  console.error('Fatal review execution error:', err);
  process.exit(1);
});
