/**
 * Stock & Buffer Stock Utility Engine
 * Centralized Single Source of Truth for stock availability and buffer hierarchy.
 *
 * Hierarchy Rules:
 * 1. SKU Override: If skuBuffer is explicitly specified as a valid number (including 0), it takes precedence.
 * 2. Global Buffer: If skuBuffer is empty/null/undefined, fall back to global inventory settings buffer.
 * 3. Default Fallback: If neither is available, defaults to 2.
 */

/**
 * Resolves the effective buffer stock for a product.
 *
 * @param {number|string|null|undefined} skuBuffer - SKU-specific buffer stock override.
 * @param {number|string|null|undefined} globalBuffer - Global default buffer stock from settings.
 * @param {number} [defaultFallback=2] - Fallback when neither is defined.
 * @returns {number} The resolved non-negative integer buffer stock.
 */
export function resolveEffectiveBuffer(skuBuffer, globalBuffer, defaultFallback = 2) {
  const isValidValue = (val) => {
    if (val === null || val === undefined) return false;
    if (typeof val === 'string' && val.trim() === '') return false;
    const num = Number(val);
    return !Number.isNaN(num);
  };

  // 1. Check SKU-specific override (0 is a valid override)
  if (isValidValue(skuBuffer)) {
    return Math.max(0, Math.floor(Number(skuBuffer)));
  }

  // 2. Check Global Buffer from settings (0 is a valid global buffer)
  if (isValidValue(globalBuffer)) {
    return Math.max(0, Math.floor(Number(globalBuffer)));
  }

  // 3. Fallback to default
  const fallbackNum = Number(defaultFallback);
  return !Number.isNaN(fallbackNum) ? Math.max(0, Math.floor(fallbackNum)) : 2;
}

/**
 * Calculates stock that is actually available for purchase after reserving buffer.
 *
 * @param {number} stockQuantity - Physical stock quantity.
 * @param {number} effectiveBuffer - Resolved effective buffer stock.
 * @returns {number} Clamped available stock (>= 0).
 */
export function calculateAvailableStock(stockQuantity, effectiveBuffer) {
  const stock = Number(stockQuantity) || 0;
  const buffer = Number(effectiveBuffer) || 0;
  return Math.max(0, stock - buffer);
}

/**
 * Determines whether a requested quantity of items can be sold without violating buffer.
 *
 * @param {number} stockQuantity - Current physical stock.
 * @param {number} effectiveBuffer - Effective buffer stock threshold.
 * @param {number} [requestedQty=1] - Quantity requested for purchase.
 * @param {boolean} [canBypassBuffer=false] - Whether actor has permission to bypass buffer.
 * @returns {boolean} True if purchase is allowed.
 */
export function isStockAvailableForSale(
  stockQuantity,
  effectiveBuffer,
  requestedQty = 1,
  canBypassBuffer = false
) {
  const stock = Number(stockQuantity) || 0;
  const buffer = canBypassBuffer ? 0 : Number(effectiveBuffer) || 0;
  const qty = Number(requestedQty) || 1;
  return (stock - qty) >= buffer;
}

/**
 * Checks whether an item is considered out of stock from a customer's perspective.
 *
 * @param {number} stockQuantity - Physical stock count.
 * @param {number} effectiveBuffer - Effective buffer count.
 * @returns {boolean} True if available stock <= 0.
 */
export function isProductOutOfStock(stockQuantity, effectiveBuffer) {
  return calculateAvailableStock(stockQuantity, effectiveBuffer) <= 0;
}

/**
 * Checks whether an item is in "low stock" warning range.
 *
 * @param {number} stockQuantity - Physical stock count.
 * @param {number} effectiveBuffer - Effective buffer count.
 * @param {number} [lowStockThreshold=2] - Upper bound of available stock to be considered low.
 * @returns {boolean} True if available stock is between 1 and lowStockThreshold.
 */
export function isProductLowStock(stockQuantity, effectiveBuffer, lowStockThreshold = 2) {
  const available = calculateAvailableStock(stockQuantity, effectiveBuffer);
  return available > 0 && available <= lowStockThreshold;
}
