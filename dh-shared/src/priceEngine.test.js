import { describe, it, expect } from 'vitest';
import { calculateItemTotal, calculateSubtotal, calculatePromotionDiscount, calculateNetTotal } from './priceEngine';

describe('Price Engine', () => {
    describe('calculateItemTotal', () => {
        it('should calculate basic item total', () => {
            expect(calculateItemTotal({ price: 100, qty: 2 })).toBe(200);
        });
        it('should return 0 for freebies', () => {
            expect(calculateItemTotal({ price: 100, qty: 2, isFreebie: true })).toBe(0);
        });
        it('should handle missing qty (defaults to 1)', () => {
            expect(calculateItemTotal({ retailPrice: 150 })).toBe(150);
        });
        it('should handle negative qty by returning 0', () => {
            expect(calculateItemTotal({ price: 100, qty: -2 })).toBe(0);
        });
    });

    describe('calculateSubtotal', () => {
        it('should sum up item totals correctly', () => {
            const items = [
                { price: 100, qty: 2 },
                { price: 50, qty: 1 }
            ];
            expect(calculateSubtotal(items)).toBe(250);
        });
    });

    describe('calculatePromotionDiscount', () => {
        const items = [{ id: 'SKU1', price: 100, qty: 2 }];
        const subtotal = 200;

        it('should calculate PERCENTAGE discount correctly', () => {
            const promo = { type: 'PERCENTAGE', value: 10 }; // 10%
            expect(calculatePromotionDiscount(subtotal, items, promo)).toBe(20);
        });

        it('should respect maxDiscount for PERCENTAGE', () => {
            const promo = { type: 'PERCENTAGE', value: 50, maxDiscount: 50 }; // 50% = 100, max 50
            expect(calculatePromotionDiscount(subtotal, items, promo)).toBe(50);
        });

        it('should calculate FIXED discount correctly', () => {
            const promo = { type: 'FIXED', value: 30 };
            expect(calculatePromotionDiscount(subtotal, items, promo)).toBe(30);
        });

        it('should calculate FIXED_AMOUNT discount correctly', () => {
            const promo = { type: 'FIXED_AMOUNT', value: 30 };
            expect(calculatePromotionDiscount(subtotal, items, promo)).toBe(30);
        });

        it('should clamp FIXED_AMOUNT to applicableSubtotal', () => {
            const promo = { type: 'FIXED_AMOUNT', value: 500 };
            expect(calculatePromotionDiscount(subtotal, items, promo)).toBe(200);
        });

        it('should match applicableSkus case-insensitively', () => {
            const promo = { type: 'PERCENTAGE', value: 10, applicableSkus: ['sku1'] };
            expect(calculatePromotionDiscount(subtotal, items, promo)).toBe(20);
        });

        it('should return 0 if minSpend is not met', () => {
            const promo = { type: 'FIXED', value: 30, minSpend: 500 };
            expect(calculatePromotionDiscount(subtotal, items, promo)).toBe(0);
        });
    });

    describe('calculateNetTotal', () => {
        it('should calculate net total correctly with shipping and wallet used', () => {
            const items = [{ price: 100, qty: 2 }]; // subtotal: 200
            const result = calculateNetTotal({
                items,
                shippingCost: 50,
                discountAmount: 20,
                walletUsed: 30
            });
            // 200 - 20 (discount) + 50 (shipping) = 230. 230 - 30 (wallet) = 200.
            expect(result.netTotal).toBe(200);
            expect(result.subtotal).toBe(200);
        });
    });
});
