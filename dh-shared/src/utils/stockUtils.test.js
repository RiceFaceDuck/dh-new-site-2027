import { describe, it, expect } from 'vitest';
import {
  resolveEffectiveBuffer,
  calculateAvailableStock,
  isStockAvailableForSale,
  isProductOutOfStock,
  isProductLowStock
} from './stockUtils.js';

describe('dh-shared/stockUtils', () => {
  describe('resolveEffectiveBuffer', () => {
    it('prioritizes SKU override when specified as a positive number', () => {
      expect(resolveEffectiveBuffer(5, 2)).toBe(5);
      expect(resolveEffectiveBuffer('5', 2)).toBe(5);
      expect(resolveEffectiveBuffer(10, 0)).toBe(10);
    });

    it('honors SKU override = 0 (selling out without buffer)', () => {
      expect(resolveEffectiveBuffer(0, 2)).toBe(0);
      expect(resolveEffectiveBuffer('0', 2)).toBe(0);
    });

    it('falls back to globalBuffer when SKU override is null, undefined, or empty string', () => {
      expect(resolveEffectiveBuffer(null, 3)).toBe(3);
      expect(resolveEffectiveBuffer(undefined, 3)).toBe(3);
      expect(resolveEffectiveBuffer('', 3)).toBe(3);
      expect(resolveEffectiveBuffer('  ', 3)).toBe(3);
      expect(resolveEffectiveBuffer('invalid', 3)).toBe(3);
    });

    it('honors globalBuffer = 0 when SKU is null or empty', () => {
      expect(resolveEffectiveBuffer(null, 0)).toBe(0);
      expect(resolveEffectiveBuffer(undefined, 0)).toBe(0);
      expect(resolveEffectiveBuffer('', '0')).toBe(0);
    });

    it('falls back to default fallback (2) when both SKU and global buffer are null/undefined', () => {
      expect(resolveEffectiveBuffer(null, null)).toBe(2);
      expect(resolveEffectiveBuffer(undefined, undefined)).toBe(2);
      expect(resolveEffectiveBuffer('', '')).toBe(2);
    });

    it('clamps negative numbers to 0', () => {
      expect(resolveEffectiveBuffer(-5, 2)).toBe(0);
      expect(resolveEffectiveBuffer(null, -3)).toBe(0);
    });

    it('floors floating point values', () => {
      expect(resolveEffectiveBuffer(3.7, 2)).toBe(3);
      expect(resolveEffectiveBuffer(null, 4.2)).toBe(4);
    });
  });

  describe('calculateAvailableStock', () => {
    it('subtracts buffer from stock and clamps to 0', () => {
      expect(calculateAvailableStock(10, 2)).toBe(8);
      expect(calculateAvailableStock(2, 2)).toBe(0);
      expect(calculateAvailableStock(1, 2)).toBe(0);
      expect(calculateAvailableStock(0, 2)).toBe(0);
      expect(calculateAvailableStock(5, 0)).toBe(5);
    });

    it('handles null, undefined, and non-numeric inputs safely', () => {
      expect(calculateAvailableStock(null, 2)).toBe(0);
      expect(calculateAvailableStock(undefined, 2)).toBe(0);
      expect(calculateAvailableStock(10, null)).toBe(10);
      expect(calculateAvailableStock('10', '3')).toBe(7);
    });
  });

  describe('isStockAvailableForSale', () => {
    it('allows sale when remaining stock meets or exceeds buffer', () => {
      // Stock 10, Buffer 2, buy 1 -> remaining 9 >= 2 -> true
      expect(isStockAvailableForSale(10, 2, 1)).toBe(true);
      // Stock 10, Buffer 2, buy 8 -> remaining 2 >= 2 -> true
      expect(isStockAvailableForSale(10, 2, 8)).toBe(true);
    });

    it('blocks sale when purchase enters buffer zone', () => {
      // Stock 10, Buffer 2, buy 9 -> remaining 1 < 2 -> false
      expect(isStockAvailableForSale(10, 2, 9)).toBe(false);
      // Stock 2, Buffer 2, buy 1 -> remaining 1 < 2 -> false
      expect(isStockAvailableForSale(2, 2, 1)).toBe(false);
    });

    it('allows sale into buffer when canBypassBuffer is true', () => {
      // Stock 2, Buffer 2, buy 2, bypass=true -> remaining 0 >= 0 -> true
      expect(isStockAvailableForSale(2, 2, 2, true)).toBe(true);
      // Stock 2, Buffer 2, buy 3, bypass=true -> remaining -1 < 0 -> false
      expect(isStockAvailableForSale(2, 2, 3, true)).toBe(false);
    });
  });

  describe('isProductOutOfStock', () => {
    it('returns true when stock is equal to or below buffer', () => {
      expect(isProductOutOfStock(2, 2)).toBe(true);
      expect(isProductOutOfStock(1, 2)).toBe(true);
      expect(isProductOutOfStock(0, 2)).toBe(true);
    });

    it('returns false when available stock is greater than 0', () => {
      expect(isProductOutOfStock(3, 2)).toBe(false);
      expect(isProductOutOfStock(1, 0)).toBe(false);
    });
  });

  describe('isProductLowStock', () => {
    it('returns true when available stock is between 1 and threshold', () => {
      // Stock 3, Buffer 2 -> available 1 -> low stock (<= 2)
      expect(isProductLowStock(3, 2)).toBe(true);
      // Stock 4, Buffer 2 -> available 2 -> low stock (<= 2)
      expect(isProductLowStock(4, 2)).toBe(true);
    });

    it('returns false when out of stock or high stock', () => {
      // Stock 2, Buffer 2 -> available 0 -> out of stock, not low stock
      expect(isProductLowStock(2, 2)).toBe(false);
      // Stock 10, Buffer 2 -> available 8 -> not low stock
      expect(isProductLowStock(10, 2)).toBe(false);
    });
  });
});
