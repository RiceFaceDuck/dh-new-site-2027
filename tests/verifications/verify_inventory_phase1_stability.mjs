import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../..');

const useProductFormPath = path.join(root, 'dh-backoffice-react/src/components/inventory/hooks/useProductForm.js');
const basicInfoPath = path.join(root, 'dh-backoffice-react/src/components/inventory/modal/ProductBasicInfo.jsx');
const detailHeaderPath = path.join(root, 'dh-backoffice-react/src/components/search/detail/ProductDetailHeader.jsx');

const useProductFormSrc = fs.readFileSync(useProductFormPath, 'utf8');
const basicInfoSrc = fs.readFileSync(basicInfoPath, 'utf8');
const detailHeaderSrc = fs.readFileSync(detailHeaderPath, 'utf8');

// 1. Verify storefront domain migration (no legacy dh-notebook-frontend.web.app/product/)
assert(!basicInfoSrc.includes('dh-notebook-frontend.web.app/product/'), 'ProductBasicInfo still references legacy frontend domain');
assert(basicInfoSrc.includes('https://dh-servicehub.com/product/'), 'ProductBasicInfo missing dh-servicehub.com product URL');

assert(!detailHeaderSrc.includes('dh-notebook-frontend.web.app/product/'), 'ProductDetailHeader still references legacy frontend domain');
assert(detailHeaderSrc.includes('https://dh-servicehub.com/product/'), 'ProductDetailHeader missing dh-servicehub.com product URL');

// 2. Verify resolveCategoryOptionsAndValue logic extracted cleanly
assert(useProductFormSrc.includes('export function resolveCategoryOptionsAndValue'), 'Missing resolveCategoryOptionsAndValue export');
assert(useProductFormSrc.includes('initData.category = resolvedCategory'), 'initData.category must be normalized before setForm');

// Execute isolated unit tests on the exact function implementation
const fnMatch = useProductFormSrc.match(/export const DEFAULT_CATEGORIES = \[[\s\S]*?\];/);
const helperMatch = useProductFormSrc.match(/export function resolveCategoryOptionsAndValue[\s\S]*?\n\}/);
assert(fnMatch && helperMatch, 'Could not extract category helper for unit verification');

const INITIAL_FORM = { category: 'Screen' };
const runner = new Function('INITIAL_FORM', `
  ${fnMatch[0].replace('export ', '')}
  ${helperMatch[0].replace('export ', '')}
  return { DEFAULT_CATEGORIES, resolveCategoryOptionsAndValue };
`);
const { resolveCategoryOptionsAndValue } = runner(INITIAL_FORM);

// Case 1: Lowercase "adapter" (exact bug seen on ADAC024) -> must resolve to "Adapter"
const c1 = resolveCategoryOptionsAndValue('adapter', []);
assert.strictEqual(c1.resolvedCategory, 'Adapter', 'lowercase "adapter" should normalize to "Adapter"');
assert(c1.resolvedCategories.some(c => c.type === 'Adapter'), 'Adapter option must exist');

// Case 2: Uppercase with spaces "  ADAPTER  " -> "Adapter"
const c2 = resolveCategoryOptionsAndValue('  ADAPTER  ', []);
assert.strictEqual(c2.resolvedCategory, 'Adapter', 'trimmed uppercase ADAPTER should normalize to "Adapter"');

// Case 3: Legacy object category { name: "adapter" } -> "Adapter"
const c3 = resolveCategoryOptionsAndValue({ name: 'adapter' }, []);
assert.strictEqual(c3.resolvedCategory, 'Adapter', 'object { name: "adapter" } should normalize to "Adapter"');

// Case 4: Non-default category ("built in audio") -> preserved and added to options
const c4 = resolveCategoryOptionsAndValue('built in audio', [{ id: '1', name: 'Hinge', type: 'Hinge' }]);
assert.strictEqual(c4.resolvedCategory, 'built in audio', 'custom category should be preserved');
assert(c4.resolvedCategories.some(c => c.type === 'built in audio'), 'custom category must be added to options');
assert(c4.resolvedCategories.some(c => c.type === 'Hinge'), 'DB category must be included');

// Case 5: Empty / null -> defaults to Screen
const c5 = resolveCategoryOptionsAndValue('', []);
assert.strictEqual(c5.resolvedCategory, 'Screen', 'empty category should fallback to Screen');
const c6 = resolveCategoryOptionsAndValue(null, []);
assert.strictEqual(c6.resolvedCategory, 'Screen', 'null category should fallback to Screen');

console.log('✅ Phase 1 Verification PASSED (All 6 category cases + 2 domain checks)');
