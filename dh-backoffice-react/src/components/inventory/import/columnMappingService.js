/**
 * Column Mapping Service for Inventory Excel Import
 * Handles flexible header name matching, user alias configurations, and localStorage persistence.
 * Location: Management System/dh-backoffice-react/src/components/inventory/import/columnMappingService.js
 */

export const DEFAULT_COLUMN_MAPPINGS = {
  sku: [
    'SKU', 
    'sku', 
    '*ชื่อSKU(ต้องระบุ)', 
    'ชื่อSKU(ต้องระบุ)', 
    'ชื่อSKU', 
    'รหัสสินค้า', 
    'รหัส SKU', 
    'Barcode', 
    'ItemCode'
  ],
  stockQuantity: [
    'จำนวนการนับ', 
    'นับสต๊อค', 
    'นับสต๊อก', 
    'การนับ', 
    'StockQuantity', 
    'stockQuantity', 
    'Stock', 
    'stock', 
    'สต็อก', 
    'สต๊อก', 
    'สต็อกที่มีอยู่',
    'จำนวนสต็อก'
  ],
  addStock: [
    'AddStock', 
    'addStock', 
    'เพิ่มสต๊อก', 
    'เพิ่มสต๊อค', 
    'เพิ่มสต็อก', 
    'รับเข้า', 
    'จำนวนเพิ่ม'
  ],
  price: [
    'Price (ราคาส่ง)', 
    'Price(ราคาส่ง)', 
    'Price', 
    'price', 
    'ราคาส่ง', 
    'ราคา'
  ],
  retailPrice: [
    'RetailPrice', 
    'retailPrice', 
    'ราคาปลีก', 
    'ขายปลีก'
  ],
  name: [
    'Name', 
    'name', 
    'ชื่อสินค้า', 
    'ชื่อ', 
    'หัวข้อ', 
    'รายการสินค้า'
  ],
  shopee: [
    'Shopee',
    'shopee',
    'Shopee Link',
    'ShopeeLink',
    'ลิงก์ Shopee',
    'ลิงก์shopee',
    'ShopeeUrl'
  ],
  lazada: [
    'Lazada',
    'lazada',
    'Lazada Link',
    'LazadaLink',
    'ลิงก์ Lazada',
    'ลิงก์lazada',
    'LazadaUrl'
  ],
  tiktok: [
    'TikTok',
    'tiktok',
    'Tiktok',
    'TikTok Shop',
    'TikTok Link',
    'TikTokLink',
    'ลิงก์ TikTok',
    'ลิงก์tiktok',
    'TikTokUrl'
  ],
  facebook: [
    'Facebook',
    'facebook',
    'Facebook Link',
    'FacebookLink',
    'ลิงก์ Facebook',
    'ลิงก์facebook',
    'FacebookUrl'
  ]
};

const STORAGE_KEY = 'dh_inventory_import_column_mappings_v1';

/**
 * Normalizes header string for robust matching:
 * Removes asterisks, parentheses, extra spaces, and converts to lowercase.
 */
export function normalizeHeader(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/[*()（）]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Get current column mappings from localStorage merged with defaults.
 */
export function getColumnMappings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_COLUMN_MAPPINGS };
    const parsed = JSON.parse(raw);
    return {
      sku: Array.isArray(parsed.sku) && parsed.sku.length ? parsed.sku : DEFAULT_COLUMN_MAPPINGS.sku,
      stockQuantity: Array.isArray(parsed.stockQuantity) && parsed.stockQuantity.length ? parsed.stockQuantity : DEFAULT_COLUMN_MAPPINGS.stockQuantity,
      addStock: Array.isArray(parsed.addStock) && parsed.addStock.length ? parsed.addStock : DEFAULT_COLUMN_MAPPINGS.addStock,
      price: Array.isArray(parsed.price) && parsed.price.length ? parsed.price : DEFAULT_COLUMN_MAPPINGS.price,
      retailPrice: Array.isArray(parsed.retailPrice) && parsed.retailPrice.length ? parsed.retailPrice : DEFAULT_COLUMN_MAPPINGS.retailPrice,
      name: Array.isArray(parsed.name) && parsed.name.length ? parsed.name : DEFAULT_COLUMN_MAPPINGS.name,
      shopee: Array.isArray(parsed.shopee) && parsed.shopee.length ? parsed.shopee : DEFAULT_COLUMN_MAPPINGS.shopee,
      lazada: Array.isArray(parsed.lazada) && parsed.lazada.length ? parsed.lazada : DEFAULT_COLUMN_MAPPINGS.lazada,
      tiktok: Array.isArray(parsed.tiktok) && parsed.tiktok.length ? parsed.tiktok : DEFAULT_COLUMN_MAPPINGS.tiktok,
      facebook: Array.isArray(parsed.facebook) && parsed.facebook.length ? parsed.facebook : DEFAULT_COLUMN_MAPPINGS.facebook
    };
  } catch (e) {
    console.warn('Error reading column mappings from localStorage:', e);
    return { ...DEFAULT_COLUMN_MAPPINGS };
  }
}

/**
 * Save user modified mappings to localStorage.
 */
export function saveColumnMappings(mappings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
    return true;
  } catch (e) {
    console.error('Failed to save column mappings:', e);
    return false;
  }
}

/**
 * Reset mappings to default.
 */
export function resetColumnMappings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
  return { ...DEFAULT_COLUMN_MAPPINGS };
}

/**
 * Finds the actual header key in the row/keys list that matches any given alias.
 */
export function findMatchingHeader(rowOrHeaders, aliases = []) {
  if (!rowOrHeaders) return null;
  const keys = Array.isArray(rowOrHeaders) ? rowOrHeaders : Object.keys(rowOrHeaders);

  // 1. Exact match
  for (const alias of aliases) {
    const found = keys.find(k => k === alias);
    if (found) return found;
  }

  // 2. Trimmed Case-insensitive match
  for (const alias of aliases) {
    const lower = String(alias).toLowerCase().trim();
    const found = keys.find(k => String(k).toLowerCase().trim() === lower);
    if (found) return found;
  }

  // 3. Normalized match (ignores *, parentheses, spaces)
  for (const alias of aliases) {
    const normAlias = normalizeHeader(alias);
    if (!normAlias) continue;
    const found = keys.find(k => normalizeHeader(k) === normAlias);
    if (found) return found;
  }

  return null;
}

/**
 * Retrieves the value from a row using configured aliases.
 */
export function getValueByAliases(row, aliases = []) {
  if (!row) return undefined;
  const headerKey = findMatchingHeader(row, aliases);
  if (headerKey && row[headerKey] !== undefined && row[headerKey] !== '') {
    return row[headerKey];
  }
  return undefined;
}

/**
 * Helper to check if a specific header name corresponds to a mapping category.
 */
export function isHeaderMatching(headerName, aliases = []) {
  if (!headerName) return false;
  return findMatchingHeader([headerName], aliases) !== null;
}
