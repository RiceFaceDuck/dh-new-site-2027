import { describe, it, expect } from 'vitest';
import { 
  normalizeCategoryName, 
  resolveCategoryFromSku, 
  calculateItemWarranty, 
  DEFAULT_WARRANTY_DAYS 
} from './warrantyUtils.js';

describe('dh-shared/warrantyUtils', () => {
  describe('normalizeCategoryName', () => {
    it('normalizes Thai and English hardware categories accurately', () => {
      expect(normalizeCategoryName('screen')).toBe('Panel');
      expect(normalizeCategoryName('หน้าจอ')).toBe('Panel');
      expect(normalizeCategoryName('ลำโพง')).toBe('Speaker');
      expect(normalizeCategoryName('SPEAKER')).toBe('Speaker');
      expect(normalizeCategoryName('พัดลม')).toBe('Fan');
      expect(normalizeCategoryName('สายแพ')).toBe('Cable');
      expect(normalizeCategoryName('บานพับ')).toBe('Hinge');
      expect(normalizeCategoryName('ฮีตซิงค์')).toBe('Cooling');
      expect(normalizeCategoryName('สวิตชิ่ง')).toBe('Switching');
      expect(normalizeCategoryName('แรม')).toBe('RAM');
      expect(normalizeCategoryName('เอสเอสดี')).toBe('SSD');
      expect(normalizeCategoryName('เมนบอร์ด')).toBe('Mainboard');
      expect(normalizeCategoryName('ซีพียู')).toBe('CPU');
    });

    it('handles empty or non-string gracefully', () => {
      expect(normalizeCategoryName('')).toBe('General');
      expect(normalizeCategoryName(null)).toBe('General');
      expect(normalizeCategoryName(undefined)).toBe('General');
    });

    it('formats unlisted Latin words to TitleCase', () => {
      expect(normalizeCategoryName('camera')).toBe('Camera');
      expect(normalizeCategoryName('DOCKING')).toBe('DOCKING'); // preserves existing uppercase or capitalizes first
    });
  });

  describe('resolveCategoryFromSku', () => {
    it('infers category from SKU prefixes correctly', () => {
      expect(resolveCategoryFromSku('PN-156-FHD')).toBe('Panel');
      expect(resolveCategoryFromSku('SCR-140')).toBe('Panel');
      expect(resolveCategoryFromSku('KB-DELL-5520')).toBe('Keyboard');
      expect(resolveCategoryFromSku('BT-HP-4CELL')).toBe('Battery');
      expect(resolveCategoryFromSku('AD-TYPE-C-65W')).toBe('Adapter');
      expect(resolveCategoryFromSku('SPK-MACBOOK')).toBe('Speaker');
      expect(resolveCategoryFromSku('FAN-ASUS-ROG')).toBe('Fan');
      expect(resolveCategoryFromSku('SSD-M2-512GB')).toBe('SSD');
      expect(resolveCategoryFromSku('RAM-DDR4-8GB')).toBe('RAM');
      expect(resolveCategoryFromSku('UNKNOWN-123')).toBeNull();
    });
  });

  describe('calculateItemWarranty', () => {
    const mockConfig = {
      categories: {
        'Panel': { claimDays: 180, returnDays: 7 },
        'Keyboard': { claimDays: 90, returnDays: 7 },
        'Speaker': { claimDays: 7, returnDays: 7 },
        'General': { claimDays: 30, returnDays: 7 }
      },
      skus: {
        'SKU-VIP-1YR': { claimDays: 365, returnDays: 14 }
      }
    };

    const refDate = new Date('2026-10-02T12:00:00Z');

    it('calculates warranty accurately for standard category', () => {
      const item = { category: 'Panel', sku: 'PN-101' };
      const orderDate = new Date('2026-09-02T12:00:00Z'); // 30 days ago

      const result = calculateItemWarranty(item, orderDate, mockConfig, refDate);
      expect(result).toBeDefined();
      expect(result.claimDays).toBe(180);
      expect(result.returnDays).toBe(7);
      expect(result.passedDays).toBe(30);
      expect(result.remainingDays).toBe(150);
      expect(result.isExpired).toBe(false);
      expect(result.categoryKey).toBe('Panel');
      expect(result.isSkuOverride).toBe(false);
    });

    it('matches Thai category accurately without falling to General', () => {
      const item = { category: 'หน้าจอ', sku: 'ITEM-99' };
      const orderDate = new Date('2026-09-02T12:00:00Z'); // 30 days ago

      const result = calculateItemWarranty(item, orderDate, mockConfig, refDate);
      expect(result.claimDays).toBe(180); // Must be Panel (180), NOT General (30)!
      expect(result.categoryKey).toBe('Panel');
      expect(result.isExpired).toBe(false);
    });

    it('matches Speaker and Thai synonym ลำโพง accurately', () => {
      const item = { category: 'ลำโพง', sku: 'SPK-01' };
      const orderDate = new Date('2026-10-01T12:00:00Z'); // 1 day ago

      const result = calculateItemWarranty(item, orderDate, mockConfig, refDate);
      expect(result.claimDays).toBe(7);
      expect(result.categoryKey).toBe('Speaker');
      expect(result.passedDays).toBe(1);
      expect(result.remainingDays).toBe(6);
      expect(result.isExpired).toBe(false);
    });

    it('detects expiration correctly', () => {
      const item = { category: 'Speaker', sku: 'SPK-01' };
      const orderDate = new Date('2026-09-20T12:00:00Z'); // 12 days ago (policy is 7 days)

      const result = calculateItemWarranty(item, orderDate, mockConfig, refDate);
      expect(result.claimDays).toBe(7);
      expect(result.passedDays).toBe(12);
      expect(result.remainingDays).toBe(-5);
      expect(result.isExpired).toBe(true);
    });

    it('prioritizes SKU override over category', () => {
      const item = { category: 'Speaker', sku: 'SKU-VIP-1YR' };
      const orderDate = new Date('2026-09-02T12:00:00Z'); // 30 days ago

      const result = calculateItemWarranty(item, orderDate, mockConfig, refDate);
      expect(result.claimDays).toBe(365);
      expect(result.returnDays).toBe(14);
      expect(result.isSkuOverride).toBe(true);
      expect(result.isExpired).toBe(false);
    });

    it('infers category from SKU prefix when category is missing', () => {
      const item = { category: '', sku: 'KB-12345' };
      const orderDate = new Date('2026-09-02T12:00:00Z'); // 30 days ago

      const result = calculateItemWarranty(item, orderDate, mockConfig, refDate);
      expect(result.claimDays).toBe(90); // Keyboard is 90
      expect(result.categoryKey).toBe('Keyboard');
      expect(result.passedDays).toBe(30);
      expect(result.remainingDays).toBe(60);
    });

    it('falls back to General if category is unknown and SKU has no recognized prefix', () => {
      const item = { category: 'SomethingUnusual', sku: 'XYZ-001' };
      const orderDate = new Date('2026-09-02T12:00:00Z'); // 30 days ago

      const result = calculateItemWarranty(item, orderDate, mockConfig, refDate);
      expect(result.claimDays).toBe(30); // General
      expect(result.categoryKey).toBe('General');
      expect(result.remainingDays).toBe(0);
    });
  });
});
