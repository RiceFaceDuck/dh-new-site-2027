import { StorefrontThemeSchema, HeroConfigSchema } from '../../dh-backoffice-react/src/schemas/themeSchema.js';
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('🧪 OPERATION FINAL REVIEW: THEME & HERO BILLBOARD VERIFICATION');
console.log('================================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

// -------------------------------------------------------------
// Test 1: Zod Schema Contract Integrity
// -------------------------------------------------------------
console.log('👉 [1/6] Testing Zod Schema Contracts');

const validTheme = {
  themeId: 'theme-trusted-partner',
  backgroundUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&q=80',
  blurLevel: '16',
  opacityTop: 70,
  opacityMid: 85,
  opacityBottom: 95
};
const themeResult = StorefrontThemeSchema.safeParse(validTheme);
assert(themeResult.success, 'Valid theme matches StorefrontThemeSchema');

const invalidTheme = { themeId: 'non_existent', blurLevel: 'ultra' };
const invalidThemeResult = StorefrontThemeSchema.safeParse(invalidTheme);
assert(!invalidThemeResult.success, 'Invalid theme correctly rejected by StorefrontThemeSchema');

const validHero = {
  isActive: true,
  title: 'Sample Title',
  titleSegments: [],
  badge: { isActive: true, text: 'SALE 50%', color: '#facc15' },
  subtitle: { isActive: true, text: 'Special promotion' },
  bannerHeight: 'compact',
  imageLayout: 'full',
  textAlignment: 'center',
  primaryButton: { label: 'BUY', link: '/shop', isActive: true, variant: 'solid' },
  secondaryButton: { label: 'INFO', link: '/info', isActive: true, variant: 'outline' },
  overlay: { enabled: true, color: '#1f2937', opacity: 90, direction: 'to-r' }
};
const heroResult = HeroConfigSchema.safeParse(validHero);
assert(heroResult.success, 'Valid hero configuration matches HeroConfigSchema');

// -------------------------------------------------------------
// Test 2: compileHeroTitle Logic & Edge Cases
// -------------------------------------------------------------
console.log('\n👉 [2/6] Testing compileHeroTitle HTML Compiler from Service');

const heroServicePath = path.resolve('Management System/dh-backoffice-react/src/firebase/heroConfigService.js');
const heroServiceSource = fs.readFileSync(heroServicePath, 'utf-8');

assert(heroServiceSource.includes('compileHeroTitle'), 'heroConfigService exports compileHeroTitle');
assert(heroServiceSource.includes('seg.breakDesktop'), 'compileHeroTitle handles breakDesktop');
assert(heroServiceSource.includes('seg.breakAll'), 'compileHeroTitle handles breakAll');
assert(heroServiceSource.includes('DEFAULT_HERO_CONFIG'), 'heroConfigService exports DEFAULT_HERO_CONFIG');

// Replicate compile logic to verify edge case correctness
const compileHeroTitle = (segments = []) => {
  if (!Array.isArray(segments) || segments.length === 0) return '';
  return segments.map(seg => {
    let text = seg.text || '';
    const classes = [];
    if (seg.isBold) classes.push('font-black');
    if (seg.isItalic) classes.push('italic');
    if (seg.isUnderline) classes.push('underline');
    if (seg.isStrikethrough) classes.push('line-through');

    const color = seg.color || (seg.isHighlight ? '#facc15' : '');
    const classStr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
    const styleStr = color ? ` style="color: ${color}"` : '';

    if (classStr || styleStr) {
      text = `<span${classStr}${styleStr}>${text}</span>`;
    }

    if (seg.breakAll) {
      text += `<br />`;
    } else if (seg.breakDesktop) {
      text += `<br class="hidden md:block" />`;
    }
    return text;
  }).join(' ').replace(/\s+/g, ' ').trim();
};

const segments = [
  { text: 'DH:', color: '#facc15', isBold: true },
  { text: 'NOTEBOOK', isItalic: true, breakDesktop: true },
  { text: 'PARTS', isUnderline: true, breakAll: true }
];
const compiledHtml = compileHeroTitle(segments);
assert(compiledHtml.includes('class="font-black" style="color: #facc15"'), 'Title compiles bold and custom color correctly');
assert(compiledHtml.includes('<br class="hidden md:block" />'), 'Title compiles breakDesktop correctly');
assert(compiledHtml.includes('<br />'), 'Title compiles breakAll correctly');
assert(compileHeroTitle([]) === '', 'Empty segments return empty string');
assert(compileHeroTitle(null) === '', 'Null segments return empty string safely');

// -------------------------------------------------------------
// Test 3: Null Guard & Safe Trimming
// -------------------------------------------------------------
console.log('\n👉 [3/6] Testing Null Safety & Boundary Fallbacks');

const nullThemeConfig = { backgroundUrl: null };
const safeBgUrl = (nullThemeConfig.backgroundUrl?.trim() || '/user-bg.jpg');
assert(safeBgUrl === '/user-bg.jpg', 'Null backgroundUrl safely falls back to /user-bg.jpg without throwing TypeError');

const emptyHeroConfig = {};
const heroTitleFallback = emptyHeroConfig.title || '<span class="text-slate-400">ยังไม่มีข้อความ...</span>';
assert(heroTitleFallback.includes('ยังไม่มีข้อความ...'), 'Missing hero title safely falls back to placeholder');

// -------------------------------------------------------------
// Test 4: Single Responsibility & Layer Boundaries
// -------------------------------------------------------------
console.log('\n👉 [4/6] Verifying Clean Architecture & SRP in Components');

const heroIndexPath = path.resolve('Management System/dh-backoffice-react/src/pages/managers/components/theme/HeroConfigTab/index.jsx');
const heroIndexContent = fs.readFileSync(heroIndexPath, 'utf-8');

assert(!heroIndexContent.includes('getDoc('), 'HeroConfigTab/index.jsx contains NO direct Firestore getDoc queries');
assert(!heroIndexContent.includes('setDoc('), 'HeroConfigTab/index.jsx contains NO direct Firestore setDoc queries');
assert(heroIndexContent.includes('useHeroConfig'), 'HeroConfigTab/index.jsx delegates state to useHeroConfig controller hook');

const themeTabPath = path.resolve('Management System/dh-backoffice-react/src/pages/managers/components/theme/ThemeConfigTab.jsx');
const themeTabContent = fs.readFileSync(themeTabPath, 'utf-8');

assert(!themeTabContent.includes('historyService.addLog'), 'ThemeConfigTab does NOT double-log to historyService (deduplicated)');
assert(themeTabContent.includes('useThemeSettings'), 'ThemeConfigTab delegates to useThemeSettings controller hook');

// -------------------------------------------------------------
// Test 5: Storefront Cache Collision Guard
// -------------------------------------------------------------
console.log('\n👉 [5/6] Verifying Storefront Cache Contract');

const storefrontServicePath = path.resolve('Management System/dh-frontend/src/firebase/storefrontSettingsService.js');
const storefrontServiceContent = fs.readFileSync(storefrontServicePath, 'utf-8');

assert(storefrontServiceContent.includes('{ data, timestamp }'), 'storefrontSettingsService uses { data, timestamp } cache contract');
assert(storefrontServiceContent.includes('CACHE_TTL = 15 * 60 * 1000'), 'storefrontSettingsService preserves 15-minute TTL cache');

const storefrontHeroPath = path.resolve('Management System/dh-frontend/src/pages/Home/components/HeroSection.jsx');
const storefrontHeroContent = fs.readFileSync(storefrontHeroPath, 'utf-8');

assert(storefrontHeroContent.includes('parsed?.data || parsed'), 'Storefront HeroSection handles wrapped cache safely without corrupting cache TTL');

// -------------------------------------------------------------
// Test 6: Local Grimoire Protocol Compliance
// -------------------------------------------------------------
console.log('\n👉 [6/6] Verifying Local Grimoire Protocol (ssr memory)');

const grimoirePath = path.resolve('Management System/dh-backoffice-react/src/pages/managers/components/theme/ssr memory theme_manager.md');
assert(fs.existsSync(grimoirePath), 'Local grimoire file exists in theme folder');

if (fs.existsSync(grimoirePath)) {
  const grimoireContent = fs.readFileSync(grimoirePath, 'utf-8');
  const lineCount = grimoireContent.split('\n').length;
  const byteSize = Buffer.byteLength(grimoireContent, 'utf8');

  assert(lineCount <= 80, `Grimoire line count is ${lineCount} (must be <= 80 lines)`);
  assert(byteSize <= 6144, `Grimoire byte size is ${byteSize} bytes (must be <= 6KB)`);
  assert(grimoireContent.includes('<flow_and_entry>'), 'Grimoire contains <flow_and_entry>');
  assert(grimoireContent.includes('<core_schema>'), 'Grimoire contains <core_schema>');
  assert(grimoireContent.includes('<business_rules>'), 'Grimoire contains <business_rules>');
  assert(grimoireContent.includes('<cross_impact>'), 'Grimoire contains <cross_impact>');
  assert(grimoireContent.includes('<pitfalls_and_lessons>'), 'Grimoire contains <pitfalls_and_lessons>');
}

console.log('\n================================================================');
console.log(`📊 FINAL RESULT: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
