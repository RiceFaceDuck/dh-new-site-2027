/**
 * 🛡️ Centralized Verification Suite: Footer Settings Parity & Integrity
 * Location: Management System/tests/verifications/verify_footer_settings_parity.mjs
 * 
 * Verifies:
 * 1. Zod Schema Contracts (Canonical Blocks + Safe URLs + Social Media URLs)
 * 2. Service Dual-Source & Schema Enforcement Contracts
 * 3. Storefront UI Parity & Telemetry Contracts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runVerification() {
  console.log('====================================================');
  console.log('🚀 Running Footer Settings Parity Verification Suite');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // SECTION 1: Schema Integrity & Validation
  // ----------------------------------------------------
  console.log('📦 [1/4] Verifying Zod Schema & Defaults...');
  const schemaPath = path.resolve(rootDir, 'dh-shared/src/schemas/footerConfigSchema.js');
  assert(fs.existsSync(schemaPath), 'footerConfigSchema.js exists in dh-shared');

  const {
    FooterConfigSchema,
    getDefaultFooterConfig,
    isSafeUrl,
    validateSocialUrl
  } = await import(`file://${schemaPath.replace(/\\/g, '/')}`);

  const defaultConfig = getDefaultFooterConfig();
  assert(typeof defaultConfig === 'object', 'getDefaultFooterConfig returns an object');

  // Verify canonical blocks
  const expectedBlocks = [
    'colors', 'company', 'quickLinks', 'supportLinks',
    'socialHub', 'trustBadges', 'businessHours', 'marketingUsp',
    'styling'
  ];
  for (const block of expectedBlocks) {
    assert(block in defaultConfig, `Default config contains block: ${block}`);
  }

  // Schema parsing
  const parsed = FooterConfigSchema.parse(defaultConfig);
  assert(parsed.company.lineId === '@dhnotebook', 'Canonical company lineId parsed correctly');
  assert(parsed.quickLinks.length === 4, 'Quick links array parsed with default 4 items');
  assert(parsed.trustBadges.badges.length === 4, 'Trust badges parsed with default 4 badges');

  // URL Safety
  assert(isSafeUrl('https://dhnotebook.com'), 'isSafeUrl accepts valid https URL');
  assert(isSafeUrl('/products'), 'isSafeUrl accepts relative path');
  assert(isSafeUrl('tel:021234567'), 'isSafeUrl accepts tel URL');
  assert(!isSafeUrl('javascript:alert(1)'), 'isSafeUrl rejects javascript: scheme');
  assert(!isSafeUrl('data:text/html;base64,abc'), 'isSafeUrl rejects data: scheme');

  // Social URL Validation
  assert(validateSocialUrl('facebook', 'https://facebook.com/dhnotebook'), 'validateSocialUrl accepts valid Facebook');
  assert(validateSocialUrl('tiktok', 'https://tiktok.com/@dhnotebook'), 'validateSocialUrl accepts valid TikTok');
  assert(validateSocialUrl('line', 'https://line.me/ti/p/~@dhnotebook'), 'validateSocialUrl accepts valid LINE URL');
  assert(!validateSocialUrl('facebook', 'https://evil.com/facebook'), 'validateSocialUrl rejects spoofed domain');

  // ----------------------------------------------------
  // SECTION 2: Backoffice & Service Contracts
  // ----------------------------------------------------
  console.log('\n🔧 [2/4] Verifying Service Implementation Contracts...');
  const backofficeServicePath = path.resolve(rootDir, 'dh-backoffice-react/src/firebase/footerSettingsService.js');
  assert(fs.existsSync(backofficeServicePath), 'footerSettingsService.js exists in dh-backoffice-react');
  const boCode = fs.readFileSync(backofficeServicePath, 'utf8');
  assert(boCode.includes('FooterConfigSchema.parse'), 'footerSettingsService validates through FooterConfigSchema');
  assert(boCode.includes('batch.set(storefrontRef'), 'footerSettingsService syncs to storefront_config');
  assert(boCode.includes('batch.set(footerRef'), 'footerSettingsService writes to footer_config');

  const frontendClientPath = path.resolve(rootDir, 'dh-frontend/src/firebase/footerClientService.js');
  assert(fs.existsSync(frontendClientPath), 'footerClientService.js exists in dh-frontend');
  const feServiceCode = fs.readFileSync(frontendClientPath, 'utf8');
  assert(feServiceCode.includes('STOREFRONT_DOC'), 'footerClientService queries storefront doc');
  assert(feServiceCode.includes('FOOTER_DOC'), 'footerClientService falls back to footer_config doc');
  assert(feServiceCode.includes('CANONICAL_DEFAULT_FOOTER_CONFIG'), 'footerClientService falls back to canonical defaults');

  // ----------------------------------------------------
  // SECTION 3: Storefront UI Parity Contracts
  // ----------------------------------------------------
  console.log('\n🎨 [3/4] Verifying Storefront Component Parity...');
  const footerPath = path.resolve(rootDir, 'dh-frontend/src/components/Footer.jsx');
  assert(fs.existsSync(footerPath), 'Footer.jsx exists in dh-frontend');
  const footerCode = fs.readFileSync(footerPath, 'utf8');
  assert(footerCode.includes('resolvedBg'), 'Footer.jsx resolves background color safely via inline style');
  assert(footerCode.includes('trustBadgesConfig={config.trustBadges}'), 'Footer.jsx passes trustBadgesConfig to FooterBrand');
  assert(footerCode.includes('socialHubConfig={config.socialHub}'), 'Footer.jsx passes socialHubConfig to FooterBrand');
  assert(footerCode.includes('businessHoursConfig={config.businessHours}'), 'Footer.jsx passes businessHoursConfig to FooterContact');
  assert(footerCode.includes('นโยบายคุกกี้ (Cookie Policy)'), 'Footer.jsx includes Cookie Policy link');

  const footerBrandPath = path.resolve(rootDir, 'dh-frontend/src/components/footer/FooterBrand.jsx');
  assert(fs.existsSync(footerBrandPath), 'FooterBrand.jsx exists in dh-frontend');
  const brandCode = fs.readFileSync(footerBrandPath, 'utf8');
  assert(brandCode.includes('isTrustBadgesEnabled'), 'FooterBrand checks trust badges toggle');
  assert(brandCode.includes('BADGE_ICONS'), 'FooterBrand has fallback icon mapping');
  assert(brandCode.includes('socialHubConfig.facebook'), 'FooterBrand renders Facebook link');
  assert(brandCode.includes('socialHubConfig.tiktok'), 'FooterBrand renders TikTok link');
  assert(brandCode.includes('socialHubConfig.line'), 'FooterBrand renders LINE OA link');

  const footerContactPath = path.resolve(rootDir, 'dh-frontend/src/components/footer/FooterContact.jsx');
  assert(fs.existsSync(footerContactPath), 'FooterContact.jsx exists in dh-frontend');
  const contactCode = fs.readFileSync(footerContactPath, 'utf8');
  assert(contactCode.includes('ติดต่อ & เวลาทำการ'), 'FooterContact header matches live layout');
  assert(contactCode.includes('businessHoursConfig'), 'FooterContact renders business hours block');
  assert(contactCode.includes('Clock'), 'FooterContact renders Clock icon for business hours');
  assert(contactCode.includes('lineUrl ?'), 'FooterContact renders clickable Line ID');
  assert(contactCode.includes('phoneTel ?'), 'FooterContact renders clickable Phone number');

  // ----------------------------------------------------
  // SECTION 4: GA4 Telemetry Contracts
  // ----------------------------------------------------
  console.log('\n📊 [4/4] Verifying Non-blocking GA4 Telemetry...');
  const telemetryServicePath = path.resolve(rootDir, 'dh-frontend/src/firebase/footerAnalyticsService.js');
  assert(fs.existsSync(telemetryServicePath), 'footerAnalyticsService.js exists');
  const telCode = fs.readFileSync(telemetryServicePath, 'utf8');
  assert(telCode.includes('export const trackFooterClick'), 'trackFooterClick is exported');
  assert(telCode.includes("if (!analytics) return;"), 'trackFooterClick guards against missing analytics');
  assert(telCode.includes('catch (err)'), 'trackFooterClick catches and suppresses errors non-blockingly');

  assert(brandCode.includes('trackFooterClick'), 'FooterBrand connects trackFooterClick');
  assert(contactCode.includes('trackFooterClick'), 'FooterContact connects trackFooterClick');

  const linkZonePath = path.resolve(rootDir, 'dh-frontend/src/components/footer/FooterLinkZone.jsx');
  assert(fs.existsSync(linkZonePath), 'FooterLinkZone.jsx exists');
  const linkZoneCode = fs.readFileSync(linkZonePath, 'utf8');
  assert(linkZoneCode.includes('trackFooterClick'), 'FooterLinkZone connects trackFooterClick');

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`🏁 Verification Results: ${passedTests}/${totalTests} Passed`);
  console.log('====================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ALL FOOTER VERIFICATION CHECKS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.error('⚠️ SOME CHECKS FAILED. Please review the output above.\n');
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
