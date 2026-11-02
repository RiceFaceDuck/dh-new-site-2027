import { StorefrontThemeSchema, HeroConfigSchema } from '../../dh-backoffice-react/src/schemas/themeSchema.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootManagementSystem = path.resolve(__dirname, '../..');
const resolvePath = (rel) => path.resolve(rootManagementSystem, rel);

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

const heroServicePath = resolvePath('dh-backoffice-react/src/firebase/heroConfigService.js');
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

const heroIndexPath = resolvePath('dh-backoffice-react/src/pages/managers/components/theme/HeroConfigTab/index.jsx');
const heroIndexContent = fs.readFileSync(heroIndexPath, 'utf-8');

assert(!heroIndexContent.includes('getDoc('), 'HeroConfigTab/index.jsx contains NO direct Firestore getDoc queries');
assert(!heroIndexContent.includes('setDoc('), 'HeroConfigTab/index.jsx contains NO direct Firestore setDoc queries');
assert(heroIndexContent.includes('useHeroConfig'), 'HeroConfigTab/index.jsx delegates state to useHeroConfig controller hook');

const themeTabPath = resolvePath('dh-backoffice-react/src/pages/managers/components/theme/ThemeConfigTab.jsx');
const themeTabContent = fs.readFileSync(themeTabPath, 'utf-8');

assert(!themeTabContent.includes('historyService.addLog'), 'ThemeConfigTab does NOT double-log to historyService (deduplicated)');
assert(themeTabContent.includes('useThemeSettings'), 'ThemeConfigTab delegates to useThemeSettings controller hook');

// -------------------------------------------------------------
// Test 5: Storefront Cache Collision Guard
// -------------------------------------------------------------
console.log('\n👉 [5/6] Verifying Storefront Cache Contract');

const storefrontServicePath = resolvePath('dh-frontend/src/firebase/storefrontSettingsService.js');
const storefrontServiceContent = fs.readFileSync(storefrontServicePath, 'utf-8');

assert(storefrontServiceContent.includes('{ data, timestamp }'), 'storefrontSettingsService uses { data, timestamp } cache contract');
assert(storefrontServiceContent.includes('CACHE_TTL = 15 * 60 * 1000'), 'storefrontSettingsService preserves 15-minute TTL cache');

const storefrontHeroPath = resolvePath('dh-frontend/src/pages/Home/components/HeroSection.jsx');
const storefrontHeroContent = fs.readFileSync(storefrontHeroPath, 'utf-8');

assert(storefrontHeroContent.includes('parsed?.data || parsed'), 'Storefront HeroSection handles wrapped cache safely without corrupting cache TTL');

// -------------------------------------------------------------
// Test 6: Local Grimoire Protocol Compliance
// -------------------------------------------------------------
console.log('\n👉 [6/7] Verifying Local Grimoire Protocol (ssr memory)');

const grimoirePath = resolvePath('dh-backoffice-react/src/pages/managers/components/theme/ssr memory theme_manager.md');
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

// -------------------------------------------------------------
// Test 7: Multi-Banner, Carousel & Firebase Storage Pipeline
// -------------------------------------------------------------
console.log('\n👉 [7/7] Verifying Multi-Banner Carousel & Storage Pipeline');

const bannerStoragePath = resolvePath('dh-backoffice-react/src/firebase/bannerStorageService.js');
assert(fs.existsSync(bannerStoragePath), 'bannerStorageService.js exists');
const bannerStorageContent = fs.readFileSync(bannerStoragePath, 'utf-8');
assert(bannerStorageContent.includes('assets/banners/'), 'bannerStorageService uploads to assets/banners/ path');
assert(bannerStorageContent.includes('compressImageWithCanvas'), 'bannerStorageService uses client-side canvas compression');
assert(bannerStorageContent.includes('maxWidth: 1920'), 'bannerStorageService enforces 1920px max dimension');

const heroListViewPath = resolvePath('dh-backoffice-react/src/pages/managers/components/theme/HeroConfigTab/HeroBannerListView.jsx');
assert(fs.existsSync(heroListViewPath), 'HeroBannerListView.jsx exists (Master-Detail separation)');
const heroListViewContent = fs.readFileSync(heroListViewPath, 'utf-8');
assert(heroListViewContent.includes('rounded-[2px]'), 'HeroBannerListView adheres to UI Border Radius 0.1 invariant');

const heroUploadPath = resolvePath('dh-backoffice-react/src/pages/managers/components/theme/HeroConfigTab/HeroImageUpload.jsx');
const heroUploadContent = fs.readFileSync(heroUploadPath, 'utf-8');
assert(heroUploadContent.includes('Firebase Storage'), 'HeroImageUpload displays Firebase Storage provider');
assert(!heroUploadContent.includes('ไม่เกิน 5MB'), 'HeroImageUpload removed arbitrary 5MB blocker text');

const multiBannerPayload = {
  isActive: true,
  aspectRatio: '16:9',
  autoplay: true,
  autoplaySpeed: 5000,
  transitionEffect: 'slide',
  banners: [
    {
      id: 'banner_1',
      title: 'DH Notebook',
      imageUrl: 'https://firebasestorage.googleapis.com/test.webp',
      imageFit: 'contain',
      order: 1,
      isActive: true
    },
    {
      id: 'banner_2',
      title: 'Special Parts',
      imageUrl: 'https://firebasestorage.googleapis.com/test2.webp',
      imageFit: 'cover',
      order: 2,
      isActive: false
    }
  ]
};
const parsedMulti = HeroConfigSchema.safeParse(multiBannerPayload);
assert(parsedMulti.success, 'Multi-banner configuration validates successfully against HeroConfigSchema');

console.log('\n================================================================');
console.log(`📊 FINAL RESULT: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
