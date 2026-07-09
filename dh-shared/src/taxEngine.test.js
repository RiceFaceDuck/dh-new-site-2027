import { describe, it, expect } from 'vitest';
import { calculateVat, VAT_RATE } from './taxEngine';

describe('Tax Engine - calculateVat', () => {
    it('should calculate "รวม VAT" correctly', () => {
        const result = calculateVat(107, 'รวม VAT');
        expect(result.finalTotal).toBe(107);
        expect(result.amountBeforeVat).toBe(100);
        expect(result.vatAmount).toBe(7);
    });

    it('should calculate "แยก VAT" correctly', () => {
        const result = calculateVat(100, 'แยก VAT');
        expect(result.finalTotal).toBe(107);
        expect(result.amountBeforeVat).toBe(100);
        expect(result.vatAmount).toBe(7);
    });

    it('should handle "ไม่มี VAT" correctly', () => {
        const result = calculateVat(100, 'ไม่มี VAT');
        expect(result.finalTotal).toBe(100);
        expect(result.amountBeforeVat).toBe(100);
        expect(result.vatAmount).toBe(0);
    });

    it('should handle invalid inputs safely', () => {
        const result = calculateVat('invalid', 'รวม VAT');
        expect(result.finalTotal).toBe(0);
        expect(result.amountBeforeVat).toBe(0);
        expect(result.vatAmount).toBe(0);
    });
});
