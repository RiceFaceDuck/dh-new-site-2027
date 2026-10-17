/**
 * 🔍 Smart Search Matcher & Synonyms Engine (Enterprise Edition 2.0)
 * Subsystem: dh-frontend Search Engine
 * Features:
 * 1. Cross-Language Synonym Expansion (Thai <-> English)
 * 2. Multi-Token AND Matching (Supports whitespace queries like "adapter dell 65w")
 * 3. Deep Field Inspection (name, sku, category, brand, model, compatibleModels, tags, descriptions)
 * 4. Fuzzy & Typo-Tolerance (Levenshtein Distance <= 1 for terms >= 4 chars)
 * 5. Primary vs Secondary Weighted Scoring (Title/Brand/SKU 100 > Compatible 10)
 * 6. Zero External Dependencies & 100% Client-Side Pure Function (0ms, 0 Reads)
 */

export const SEARCH_SYNONYMS = {
  // อะแดปเตอร์ / สายชาร์จ / หม้อแปลง
  'อะแดปเตอร์': ['adapter', 'charger', 'สายชาร์จ', 'หม้อแปลง', 'อแดปเตอร์', 'อแดปเตอร', 'power supply'],
  'อแดปเตอร์': ['adapter', 'charger', 'สายชาร์จ', 'หม้อแปลง', 'อะแดปเตอร์', 'power supply'],
  'adapter': ['adapter', 'charger', 'สายชาร์จ', 'หม้อแปลง', 'อะแดปเตอร์', 'อแดปเตอร์'],
  'charger': ['adapter', 'charger', 'สายชาร์จ', 'หม้อแปลง', 'อะแดปเตอร์'],
  'หม้อแปลง': ['adapter', 'charger', 'สายชาร์จ', 'หม้อแปลง', 'อะแดปเตอร์'],
  'สายชาร์จ': ['adapter', 'charger', 'สายชาร์จ', 'หม้อแปลง', 'อะแดปเตอร์'],
  'ที่ชาร์จ': ['adapter', 'charger', 'สายชาร์จ', 'หม้อแปลง', 'อะแดปเตอร์'],

  // หน้าจอ / จอ
  'หน้าจอ': ['panel', 'screen', 'display', 'lcd', 'led', 'จอ', 'หน้าจอ', 'จอภาพ'],
  'จอ': ['panel', 'screen', 'display', 'lcd', 'led', 'จอ', 'หน้าจอ', 'จอภาพ'],
  'screen': ['panel', 'screen', 'display', 'lcd', 'led', 'จอ', 'หน้าจอ'],
  'panel': ['panel', 'screen', 'display', 'lcd', 'led', 'จอ', 'หน้าจอ'],
  'display': ['panel', 'screen', 'display', 'lcd', 'led', 'จอ', 'หน้าจอ'],
  '15.6': ['15.6', '15.6"', '15.6นิ้ว', 'led156', 'lcd156', 'lp156', 'b156', 'nv156', 'nt156', 'lm156'],
  '14.0': ['14.0', '14.0"', '14.0นิ้ว', 'led140', 'lcd140', 'lp140', 'b140', 'nv140', 'nt140'],
  '14': ['14.0', '14.0"', '14"', '14นิ้ว', 'led14', 'led140', 'lcd14', 'lcd140', 'lp14', 'b14', 'nv14'],
  '13.3': ['13.3', '13.3"', '13.3นิ้ว', 'led133', 'lcd133', 'lp133', 'b133', 'ltn133'],
  '11.6': ['11.6', '11.6"', '11.6นิ้ว', 'led116', 'lcd116', 'b116', 'n116'],
  '17.3': ['17.3', '17.3"', '17.3นิ้ว', 'led173', 'lcd173', 'lp173', 'b173', 'n173'],
  'นิ้ว': ['นิ้ว', '"', 'inch', 'inches'],
  'inch': ['นิ้ว', '"', 'inch', 'inches'],

  // พัดลม
  'พัดลม': ['cooling', 'fan', 'cooler', 'heatsink', 'พัดลม', 'ระบายความร้อน'],
  'fan': ['cooling', 'fan', 'cooler', 'heatsink', 'พัดลม'],
  'cooling': ['cooling', 'fan', 'cooler', 'heatsink', 'พัดลม'],

  // คีย์บอร์ด
  'คีย์บอร์ด': ['keyboard', 'kb', 'แป้นพิมพ์', 'คีย์บอร์ด', 'คีบอร์ด', 'คีย์บอด'],
  'คีบอร์ด': ['keyboard', 'kb', 'แป้นพิมพ์', 'คีย์บอร์ด', 'คีบอร์ด', 'คีย์บอด'],
  'คีย์บอด': ['keyboard', 'kb', 'แป้นพิมพ์', 'คีย์บอร์ด', 'คีบอร์ด', 'คีย์บอด'],
  'แป้นพิมพ์': ['keyboard', 'kb', 'แป้นพิมพ์', 'คีย์บอร์ด'],
  'keyboard': ['keyboard', 'kb', 'แป้นพิมพ์', 'คีย์บอร์ด', 'คีบอร์ด'],
  'kb': ['keyboard', 'kb', 'แป้นพิมพ์', 'คีย์บอร์ด'],

  // แบตเตอรี่
  'แบตเตอรี่': ['battery', 'batt', 'แบต', 'แบตเตอรี่', 'แบตเตอรี', 'แบ็ต'],
  'แบตเตอรี': ['battery', 'batt', 'แบต', 'แบตเตอรี่', 'แบตเตอรี', 'แบ็ต'],
  'แบต': ['battery', 'batt', 'แบต', 'แบตเตอรี่', 'แบตเตอรี'],
  'แบ็ต': ['battery', 'batt', 'แบต', 'แบตเตอรี่'],
  'battery': ['battery', 'batt', 'แบต', 'แบตเตอรี่', 'แบตเตอรี'],

  // บานพับ
  'บานพับ': ['hinge', 'hinges', 'บานพับ'],
  'hinge': ['hinge', 'hinges', 'บานพับ'],

  // สายแพร
  'สายแพร': ['cable', 'edp', 'lvds', 'screen cable', 'สายแพร', 'สายแพ', 'สายต่อจอ'],
  'สายแพ': ['cable', 'edp', 'lvds', 'screen cable', 'สายแพร', 'สายแพ'],
  'cable': ['cable', 'สายแพร', 'สายแพ'],

  // สายไฟ / สายชาร์จ
  'สายไฟ': ['adapter', 'charger', 'สายชาร์จ', 'สายไฟ', 'cable', 'power'],

  // ลำโพง
  'ลำโพง': ['speaker', 'speakers', 'audio', 'sound', 'built in audio', 'ลำโพง'],
  'speaker': ['speaker', 'speakers', 'audio', 'sound', 'built in audio', 'ลำโพง'],

  // ทัชแพด
  'ทัชแพด': ['touchpad', 'trackpad', 'ทัชแพด'],
  'touchpad': ['touchpad', 'trackpad', 'ทัชแพด'],

  // บอร์ด / เมนบอร์ด
  'เมนบอร์ด': ['motherboard', 'mainboard', 'board', 'เมนบอร์ด'],
  'mainboard': ['motherboard', 'mainboard', 'board', 'เมนบอร์ด'],
  'motherboard': ['motherboard', 'mainboard', 'board', 'เมนบอร์ด'],

  // ซิลิโคน
  'ซิลิโคน': ['thermal paste', 'grease', 'silicone', 'ซิลิโคน'],

  // แบรนด์โน๊ตบุ๊ค (รองรับทั้งภาษาไทยและอังกฤษ)
  'lenovo': ['lenovo', 'เลโนโว', 'เลอโนโว', 'thinkpad', 'ideapad', 'legion', 'yoga'],
  'เลโนโว': ['lenovo', 'เลโนโว', 'เลอโนโว', 'thinkpad', 'ideapad', 'legion', 'yoga'],
  'เลอโนโว': ['lenovo', 'เลโนโว', 'thinkpad', 'ideapad'],
  'dell': ['dell', 'เดล', 'เดลล์', 'inspiron', 'latitude', 'vostro', 'xps', 'alienware'],
  'เดล': ['dell', 'เดล', 'เดลล์', 'inspiron', 'latitude', 'vostro', 'xps', 'alienware'],
  'เดลล์': ['dell', 'เดล', 'เดลล์', 'inspiron', 'latitude', 'vostro', 'xps', 'alienware'],
  'acer': ['acer', 'เอเซอร์', 'เอเซอร', 'aspire', 'predator', 'nitro', 'swift', 'travelmate'],
  'เอเซอร์': ['acer', 'เอเซอร์', 'เอเซอร', 'aspire', 'predator', 'nitro', 'swift', 'travelmate'],
  'เอเซอร': ['acer', 'เอเซอร์', 'aspire', 'nitro'],
  'asus': ['asus', 'เอซุส', 'อัสซุส', 'เอซูส', 'zenbook', 'vivobook', 'rog', 'tuf', 'expertbook'],
  'เอซุส': ['asus', 'เอซุส', 'อัสซุส', 'เอซูส', 'zenbook', 'vivobook', 'rog', 'tuf'],
  'อัสซุส': ['asus', 'เอซุส', 'zenbook', 'rog', 'tuf'],
  'เอซูส': ['asus', 'เอซุส', 'zenbook', 'rog'],
  'hp': ['hp', 'เอชพี', 'pavilion', 'probook', 'elitebook', 'victus', 'omen', 'envy'],
  'เอชพี': ['hp', 'เอชพี', 'pavilion', 'probook', 'elitebook', 'victus', 'omen', 'envy'],
  'apple': ['apple', 'แอปเปิ้ล', 'แอปเปิล', 'macbook', 'แมคบุ๊ค', 'แมคบุค', 'แมค'],
  'แอปเปิ้ล': ['apple', 'macbook', 'แมคบุ๊ค', 'แอปเปิล'],
  'แอปเปิล': ['apple', 'macbook', 'แมคบุ๊ค'],
  'แมคบุ๊ค': ['apple', 'macbook', 'แอปเปิ้ล'],
  'msi': ['msi', 'เอ็มเอสไอ', 'stealth', 'bravo', 'katana', 'raider'],
  'samsung': ['samsung', 'ซัมซุง'],
  'ซัมซุง': ['samsung', 'ซัมซุง'],
  'toshiba': ['toshiba', 'โตชิบา', 'โตชิบ้า', 'dynabook'],
  'โตชิบา': ['toshiba', 'โตชิบา', 'dynabook'],
  'huawei': ['huawei', 'หัวเว่ย', 'matebook'],
  'หัวเว่ย': ['huawei', 'matebook']
};

// แบรนด์และหมวดหมู่หลักที่รองรับ Typo-Tolerance อัตโนมัติ
const COMMON_DICTIONARY = [
  'lenovo', 'dell', 'asus', 'acer', 'hp', 'apple', 'macbook', 'msi', 'toshiba', 'samsung', 'huawei',
  'adapter', 'charger', 'battery', 'keyboard', 'fan', 'cooling', 'hinge', 'cable', 'speaker', 'screen', 'panel',
  'thinkpad', 'ideapad', 'inspiron', 'latitude', 'vostro', 'zenbook', 'vivobook', 'rog', 'predator', 'aspire', 'pavilion',
  'คีย์บอร์ด', 'แป้นพิมพ์', 'แบตเตอรี่', 'อะแดปเตอร์', 'อแดปเตอร์', 'พัดลม', 'บานพับ', 'สายแพร', 'หน้าจอ', 'ลำโพง', 'เมนบอร์ด',
  'เลโนโว', 'เอเซอร์', 'เอซุส', 'แอปเปิ้ล'
];

// คำบอกหน่วยที่ไม่ควรนำมาเป็นเงื่อนไข AND บล็อกการค้นหา หากมีคำระบุขนาดนำหน้าอยู่แล้ว
const MEASUREMENT_UNITS = new Set(['นิ้ว', '"', 'inch', 'inches', 'cm', 'มม', 'mm']);

/**
 * คำนวณระยะห่าง Levenshtein Distance สำหรับ Typo-Tolerance
 */
export function levenshteinDistance(s1, s2) {
  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;
  const v0 = new Array(s2.length + 1);
  const v1 = new Array(s2.length + 1);
  for (let i = 0; i <= s2.length; i++) v0[i] = i;
  for (let i = 0; i < s1.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < s2.length; j++) {
      const cost = s1[i] === s2[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= s2.length; j++) v0[j] = v1[j];
  }
  return v1[s2.length];
}

/**
 * แปลงสตริงให้เป็น tokens สะอาด รองรับการแยกคำประกอบภาษาไทยและตัดคำบอกหน่วย
 * @param {string} text 
 * @returns {string[]}
 */
export const tokenizeQuery = (text) => {
  if (!text || typeof text !== 'string') return [];

  // 1. แยกคำประกอบภาษาไทยและตัวเลข/หน่วย (Thai Compound Splitting)
  const cleanText = text
    .toLowerCase()
    // แยกจอ/บานพับ/พัดลม/สายแพร/คีย์บอร์ด/แบตเตอรี่ ที่ติดกับตัวเลขหรืออังกฤษ เช่น "จอ15.6" -> "จอ 15.6", "คีย์บอร์ดlenovo" -> "คีย์บอร์ด lenovo"
    .replace(/(หน้าจอ|จอภาพ|จอ|บานพับ|พัดลม|สายแพร|สายแพ|คีย์บอร์ด|คีบอร์ด|แป้นพิมพ์|แบตเตอรี่|แบตเตอรี|แบต|อะแดปเตอร์|อแดปเตอร์|หม้อแปลง|สายชาร์จ|ที่ชาร์จ|ลำโพง)([\d\w])/gi, '$1 $2')
    // แยกตัวเลขที่ติดกับคำภาษาไทย เช่น "15.6นิ้ว" -> "15.6 นิ้ว"
    .replace(/(\d+(\.\d+)?)(นิ้ว|inch|inches|cm|mm|w|v|a|pin|hz)/gi, '$1 $3')
    // ลบเครื่องหมายคำพูดรอบตัวเลขหรือคำ เช่น 15.6" -> 15.6
    .replace(/["'“”‘’]/g, ' ');

  const rawTokens = cleanText
    .trim()
    .split(/\s+/)
    .filter(token => token.length > 0);

  // หากมีคำอื่นร่วมด้วย ให้กรองคำบอกหน่วยออก เช่น ["จอ", "14.0", "นิ้ว"] -> ["จอ", "14.0"]
  if (rawTokens.length > 1) {
    const meaningfulTokens = rawTokens.filter(t => !MEASUREMENT_UNITS.has(t));
    if (meaningfulTokens.length > 0) return meaningfulTokens;
  }
  return rawTokens;
};

/**
 * ดึงคำค้นหาและคำพ้องทั้งหมดของ token นั้นๆ พร้อม Typo-Tolerance Expansion
 * @param {string} token 
 * @returns {string[]}
 */
export const getExpandedTerms = (token) => {
  if (!token) return [];
  const lower = token.toLowerCase();
  const terms = new Set([lower]);

  // 1. Synonyms Map
  const synonyms = SEARCH_SYNONYMS[lower];
  if (Array.isArray(synonyms)) {
    synonyms.forEach(s => terms.add(s));
  }

  // 2. Typo Tolerance Check (รองรับทั้งภาษาอังกฤษ และภาษาไทยขนาดยาว >= 3 ตัวอักษร)
  if (lower.length >= 3) {
    for (const dictWord of COMMON_DICTIONARY) {
      if (Math.abs(dictWord.length - lower.length) <= 1) {
        if (levenshteinDistance(lower, dictWord) <= 1) {
          terms.add(dictWord);
          const dictSyns = SEARCH_SYNONYMS[dictWord];
          if (Array.isArray(dictSyns)) {
            dictSyns.forEach(ds => terms.add(ds));
          }
        }
      }
    }
  }

  return Array.from(terms);
};

/**
 * รวบรวมข้อความหลักของ Product (Primary Text: ชื่อ, SKU, แบรนด์, หมวดหมู่)
 * @param {object} p - Normalized Product
 * @returns {string}
 */
export const buildPrimarySearchText = (p) => {
  if (!p || typeof p !== 'object') return '';
  const parts = [];
  if (p.name) parts.push(String(p.name));
  if (p.productName) parts.push(String(p.productName));
  if (p.title) parts.push(String(p.title));
  if (p.sku) parts.push(String(p.sku));
  if (p.id) parts.push(String(p.id));
  if (p.brand) parts.push(String(p.brand));
  if (p.category) parts.push(String(p.category));
  if (p.category_lower) parts.push(String(p.category_lower));
  if (p.model) parts.push(String(p.model));
  if (p.barcode) parts.push(String(p.barcode));
  return parts.join(' ').toLowerCase();
};

/**
 * รวบรวมข้อความรองของ Product (Secondary Text: รุ่นที่รองรับ, คำอธิบาย, tags)
 * @param {object} p - Normalized Product
 * @returns {string}
 */
export const buildSecondarySearchText = (p) => {
  if (!p || typeof p !== 'object') return '';
  const parts = [];
  if (p.shortDescription) parts.push(String(p.shortDescription));
  if (p.description) parts.push(String(p.description));
  if (Array.isArray(p.compatibleModels)) parts.push(p.compatibleModels.join(' '));
  if (Array.isArray(p.compatiblePartNumbers)) parts.push(p.compatiblePartNumbers.join(' '));
  if (Array.isArray(p.substituteSkus)) parts.push(p.substituteSkus.join(' '));
  if (Array.isArray(p.tags)) parts.push(p.tags.join(' '));
  return parts.join(' ').toLowerCase();
};

/**
 * รวบรวมข้อความค้นหาทั้งหมดของ Product สำหรับ Full Indexing
 * @param {object} p - Normalized Product
 * @returns {string}
 */
export const buildProductSearchIndexText = (p) => {
  const primary = buildPrimarySearchText(p);
  const secondary = buildSecondarySearchText(p);
  return `${primary} ${secondary}`.trim();
};

/**
 * คำนวณคะแนนความเกี่ยวข้อง (Relevance Score)
 * - ชื่อ/แบรนด์/รหัส ตรงเป๊ะ: ได้คะแนนสูงมาก (100 คะแนนต่อโทเคน)
 * - สเปกรองรับ (compatibleModels): ได้คะแนนรอง (10 คะแนนต่อโทเคน)
 * - สต็อกพร้อมขาย: ได้คะแนนพิเศษ (+5)
 * @param {object} product 
 * @param {string[]} tokens 
 * @returns {number}
 */
export const calculateRelevanceScore = (product, tokens = []) => {
  if (!product || tokens.length === 0) return 0;
  const primaryText = buildPrimarySearchText(product);
  const secondaryText = buildSecondarySearchText(product);
  const pCat = String(product.category || product.category_lower || '').toLowerCase();
  let score = 0;

  for (const token of tokens) {
    const terms = getExpandedTerms(token);

    // 1. ตรวจสอบในข้อความหลัก (ชื่อสินค้า, แบรนด์, SKU)
    const matchPrimary = terms.some(t => primaryText.includes(t));
    if (matchPrimary) {
      score += 100;
      // ให้โบนัสพิเศษหากชื่อสินค้าขึ้นต้นด้วยคำค้นหา หรือแบรนด์ตรงเป๊ะ
      if (primaryText.startsWith(token) || (product.brand && String(product.brand).toLowerCase() === token)) {
        score += 50;
      }
      // โบนัสพิเศษหากหมวดหมู่ของสินค้าตรงกับคำค้นหาโดยตรง (เช่น จอตรงหมวด panel, อะแดปเตอร์ตรงหมวด adapter)
      if (terms.some(t => pCat.includes(t))) {
        score += 80;
      }
    } else {
      // 2. ตรวจสอบในข้อความรอง (รุ่นที่รองรับ)
      const matchSecondary = terms.some(t => secondaryText.includes(t));
      if (matchSecondary) {
        score += 10;
      }
    }
  }

  // มีสต็อกพร้อมขายได้เปรียบเล็กน้อย
  if (product.stockQuantity > 0 || product.inStock || product.stock > 0) {
    score += 5;
  }

  return score;
};

/**
 * ตรวจสอบว่าสินค้าตรงกับเงื่อนไขการค้นหาหรือไม่ (Multi-Token AND Matcher)
 * @param {object} product - สินค้าที่ต้องการตรวจสอบ
 * @param {string} queryString - คำค้นหาจากผู้ใช้
 * @returns {boolean}
 */
export const matchProductQuery = (product, queryString) => {
  if (!queryString || !queryString.trim()) return true;
  if (!product || typeof product !== 'object') return false;

  const tokens = tokenizeQuery(queryString);
  if (tokens.length === 0) return true;

  const productSearchText = buildProductSearchIndexText(product);
  if (!productSearchText) return false;

  // เงื่อนไข: สินค้าต้องมีคำพ้องหรือคำตรงกัน "ครบทุก Token" (AND logic)
  return tokens.every(token => {
    const expandedTerms = getExpandedTerms(token);
    return expandedTerms.some(term => productSearchText.includes(term));
  });
};

/**
 * กรองรายการสินค้าทั้งหมดด้วยคำค้นหา และจัดเรียงตามคะแนนความเกี่ยวข้อง (Relevance Ranking)
 * @param {Array} products 
 * @param {string} queryString 
 * @returns {Array}
 */
export const filterProductsByQuery = (products = [], queryString = '') => {
  if (!Array.isArray(products) || products.length === 0) return [];
  if (!queryString || !queryString.trim()) return products;

  const tokens = tokenizeQuery(queryString);
  if (tokens.length === 0) return products;

  // 1. กรองเฉพาะสินค้าที่ผ่านเงื่อนไขครบทุก Token
  const matched = products.filter(p => matchProductQuery(p, queryString));
  if (matched.length <= 1) return matched;

  // 2. คำนวณคะแนน Relevance Score และจัดเรียงจากมากไปน้อย
  return matched
    .map(p => ({
      product: p,
      score: calculateRelevanceScore(p, tokens)
    }))
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);
};

/**
 * หา Chunk ID ของหมวดหมู่ที่ตรงกับคำค้นหา
 * @param {string} queryString 
 * @returns {string|null}
 */
export const getTargetCategoryChunkName = (queryString) => {
  if (!queryString || typeof queryString !== 'string') return null;
  const tokens = tokenizeQuery(queryString);
  for (const token of tokens) {
    const terms = getExpandedTerms(token);
    if (terms.includes('adapter')) return 'cat_adapter';
    if (terms.includes('cooling') || terms.includes('fan')) return 'cat_cooling';
    if (terms.includes('panel') || terms.includes('screen') || terms.includes('จอ') || terms.includes('หน้าจอ')) return 'cat_panel';
    if (terms.includes('keyboard')) return 'cat_keyboard';
    if (terms.includes('hinge') || terms.includes('บานพับ')) return 'cat_hinge';
    if (terms.includes('cable') || terms.includes('สายแพร') || terms.includes('สายแพ')) return 'cat_cable';
    if (terms.includes('built in audio') || terms.includes('speaker') || terms.includes('speakers') || terms.includes('audio') || terms.includes('ลำโพง')) return 'cat_built in audio';
  }
  return null;
};

/**
 * ค้นหาสินค้าใกล้เคียงหรือสินค้าในหมวดหมู่เดียวกัน (Relaxed / Related Products Matcher)
 * ใช้ในกรณีที่ค้นหาแบบ Exact AND ไม่เจอ เพื่อป้องกันหน้าจอว่างเปล่า (Zero Dead-End)
 * @param {Array} products - รายการสินค้าทั้งหมดที่มีในแคช/ผลลัพธ์
 * @param {string} queryString - คำค้นหา
 * @param {Array} excludeIds - รายการ ID สินค้าที่ตรงเป๊ะอยู่แล้ว (เพื่อไม่ให้แสดงซ้ำ)
 * @returns {Array} รายการสินค้าใกล้เคียง เรียงตามความเกี่ยวข้อง
 */
export const findRelatedProducts = (products = [], queryString = '', excludeIds = []) => {
  if (!Array.isArray(products) || products.length === 0 || !queryString) return [];

  const tokens = tokenizeQuery(queryString);
  if (tokens.length === 0) return [];

  const excludeSet = new Set(excludeIds);
  const candidates = products.filter(p => !excludeSet.has(p.id || p.sku));

  // คำนวณคะแนนความเกี่ยวข้อง (Relevance Scoring)
  const scored = [];

  for (const p of candidates) {
    const primaryText = buildPrimarySearchText(p);
    const secondaryText = buildSecondarySearchText(p);
    const pBrand = String(p.brand || '').toLowerCase();
    const pCat = String(p.category || p.category_lower || '').toLowerCase();
    let matchScore = 0;

    for (const token of tokens) {
      const terms = getExpandedTerms(token);

      // 1. หมวดหมู่ หรือ แบรนด์ตรง ได้คะแนนสูงที่สุด (+50)
      if (terms.some(t => pBrand === t || pCat === t || pCat.includes(t))) {
        matchScore += 50;
      }

      // 2. มีคำพ้องในข้อความหลัก (ชื่อสินค้า, SKU, รุ่น) (+25)
      if (terms.some(t => primaryText.includes(t))) {
        matchScore += 25;
      }

      // 3. มีคำพ้องในข้อความรอง (รุ่นที่รองรับ) (+5)
      if (terms.some(t => secondaryText.includes(t))) {
        matchScore += 5;
      }
    }

    // หากตรงอย่างน้อย 1 token (Partial Match)
    if (matchScore > 0) {
      scored.push({
        product: p,
        score: matchScore,
        inStock: Boolean(p.stockQuantity > 0 || p.inStock)
      });
    }
  }

  // หากไม่มีคะแนนเลย (ไม่มี Token ใดตรงเลย) ➔ Fallback ป้องกันหน้าจอว่างเปล่า (Zero Dead-End)
  if (scored.length === 0) {
    return candidates
      .filter(p => p.stockQuantity > 0 || p.inStock)
      .slice(0, 8);
  }

  // เรียงลำดับ: คะแนนความเกี่ยวข้องสูงกว่ามาก่อน -> มีสต็อกพร้อมขายมาก่อน
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.inStock !== b.inStock) {
      return a.inStock ? -1 : 1;
    }
    return 0;
  });

  return scored.slice(0, 12).map(s => s.product);
};
