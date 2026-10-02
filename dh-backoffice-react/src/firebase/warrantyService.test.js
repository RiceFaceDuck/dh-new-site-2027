import { describe, test, it, expect, vi, beforeEach } from 'vitest';

// Shared state for Firestore mock implementation
const state = {
  getDocImpl: vi.fn(async () => ({ exists: () => false }))
};

// 1. Setup mocks for local modules
vi.mock('./config.js', () => ({
  db: { name: 'mock-db' }
}));

vi.mock('./historyService.js', () => ({
  historyService: {
    addLog: vi.fn(async () => {})
  }
}));

vi.mock('dh-shared/src/firebase/pathUtils.js', () => ({
  getCollectionPath: (path) => path
}));

// Mock firebase/firestore with mutable state
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, coll, id) => ({ db, coll, id })),
  getDoc: vi.fn(async (docRef) => state.getDocImpl(docRef)),
  setDoc: vi.fn(async () => {}),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
  collection: vi.fn(() => ({})),
  getDocs: vi.fn(async () => ({ docs: [] })),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  updateDoc: vi.fn(async () => {}),
  addDoc: vi.fn(async () => ({ id: 'mock-todo-id' }))
}));

import { warrantyService, normalizeCategoryName } from './warrantyService.js';

describe('warrantyService.getWarrantySettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns merged data when document exists', async () => {
    const mockData = {
      categories: {
        'Panel': { claimDays: 365, returnDays: 14 },
        'NewCategory': { claimDays: 30, returnDays: 7 }
      },
      skus: {
        'SKU-1': { claimDays: 100 }
      }
    };

    state.getDocImpl = vi.fn(async () => ({
      exists: () => true,
      data: () => mockData
    }));

    const result = await warrantyService.getWarrantySettings(true);

    expect(result.categories['Panel'].claimDays).toBe(365);
    expect(result.categories['Panel'].returnDays).toBe(14);
    expect(result.categories['Keyboard'].claimDays).toBe(90); // From DEFAULT_WARRANTY
    expect(result.categories['NewCategory'].claimDays).toBe(30);
    expect(result.skus['SKU-1'].claimDays).toBe(100);
  });

  it('returns DEFAULT_WARRANTY when document does not exist', async () => {
    state.getDocImpl = vi.fn(async () => ({
      exists: () => false
    }));

    const result = await warrantyService.getWarrantySettings(true);

    expect(result.categories['Panel'].claimDays).toBe(180); // Default
    expect(result.skus).toEqual({});
  });

  it('returns DEFAULT_WARRANTY on error', async () => {
    state.getDocImpl = vi.fn(async () => {
      throw new Error('Firestore Error');
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await warrantyService.getWarrantySettings(true);

    expect(result.categories['Panel'].claimDays).toBe(180); // Default
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('normalizes synonyms and casing correctly', () => {
    expect(normalizeCategoryName('screen')).toBe('Panel');
    expect(normalizeCategoryName('Screen')).toBe('Panel');
    expect(normalizeCategoryName('PANEL')).toBe('Panel');
    expect(normalizeCategoryName('หน้าจอ')).toBe('Panel');
    expect(normalizeCategoryName('other')).toBe('General');
    expect(normalizeCategoryName('OTHER')).toBe('General');
    expect(normalizeCategoryName('charger')).toBe('Adapter');
    expect(normalizeCategoryName('คีย์บอร์ด')).toBe('Keyboard');
    expect(normalizeCategoryName('แบตเตอรี่')).toBe('Battery');
    expect(normalizeCategoryName('speaker')).toBe('Speaker');
    expect(normalizeCategoryName('SPEAKER')).toBe('Speaker');
    expect(normalizeCategoryName('ลำโพง')).toBe('Speaker');
    expect(normalizeCategoryName('fan')).toBe('Fan');
    expect(normalizeCategoryName('พัดลม')).toBe('Fan');
    expect(normalizeCategoryName('cable')).toBe('Cable');
    expect(normalizeCategoryName('สายไฟ')).toBe('Cable');
    expect(normalizeCategoryName('สายแพ')).toBe('Cable');
    expect(normalizeCategoryName('hinge')).toBe('Hinge');
    expect(normalizeCategoryName('บานพับ')).toBe('Hinge');
    expect(normalizeCategoryName('cooling')).toBe('Cooling');
    expect(normalizeCategoryName('ฮีตซิงค์')).toBe('Cooling');
    expect(normalizeCategoryName('switching')).toBe('Switching');
    expect(normalizeCategoryName('สวิตชิ่ง')).toBe('Switching');
    expect(normalizeCategoryName('ram')).toBe('RAM');
    expect(normalizeCategoryName('แรม')).toBe('RAM');
    expect(normalizeCategoryName('SSD')).toBe('SSD');
    expect(normalizeCategoryName('เอสเอสดี')).toBe('SSD');
    expect(normalizeCategoryName('mainboard')).toBe('Mainboard');
    expect(normalizeCategoryName('เมนบอร์ด')).toBe('Mainboard');
    expect(normalizeCategoryName('cpu')).toBe('CPU');
    expect(normalizeCategoryName('ซีพียู')).toBe('CPU');
  });

  it('deduplicates and merges synonyms correctly without overwriting customized values', async () => {
    const mockData = {
      categories: {
        'SPEAKER': { claimDays: 7, returnDays: 7 },
        'ลำโพง': { claimDays: 30, returnDays: 7 } // Default synonym duplicate
      },
      skus: {}
    };

    state.getDocImpl = vi.fn(async () => ({
      exists: () => true,
      data: () => mockData
    }));

    const result = await warrantyService.getWarrantySettings(true);

    // Both should merge into 'Speaker' with the custom 7 days, NOT 30 days
    expect(result.categories['Speaker']).toBeDefined();
    expect(result.categories['Speaker'].claimDays).toBe(7);
    expect(result.categories['Speaker'].returnDays).toBe(7);
    expect(result.categories['SPEAKER']).toBeUndefined();
    expect(result.categories['ลำโพง']).toBeUndefined();
  });

  it('triggers batch warranty tasks only for unconfigured categories', async () => {
    const { addDoc } = await import('firebase/firestore');
    
    // Setup existing config where Panel & Keyboard exist, but Fan is new
    state.getDocImpl = vi.fn(async () => ({
      exists: () => true,
      data: () => ({
        categories: {
          'Panel': { claimDays: 180, returnDays: 7 }
        },
        skus: {}
      })
    }));

    await warrantyService.checkAndTriggerWarrantyTasksForBatch(['Panel', 'หน้าจอ', 'Fan', 'พัดลม']);

    // Fan and พัดลม both normalize to 'Fan', so exactly 1 task for 'Fan' should be created
    expect(addDoc).toHaveBeenCalledTimes(1);
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'WARRANTY_SETUP',
        categoryName: 'Fan'
      })
    );
  });

  it('saves settings and logs single history record with diff summary', async () => {
    const { historyService } = await import('./historyService.js');
    const { setDoc } = await import('firebase/firestore');

    const newData = {
      categories: {
        'Speaker': { claimDays: 14, returnDays: 7 }
      }
    };

    await warrantyService.updateWarrantySettings(newData, 'manager-123', '[Speaker] เคลมซ่อม 7->14');

    expect(setDoc).toHaveBeenCalled();
    expect(historyService.addLog).toHaveBeenCalledTimes(1);
    expect(historyService.addLog).toHaveBeenCalledWith(
      'SystemConfig',
      'Update',
      'warranty',
      expect.stringContaining('[Speaker] เคลมซ่อม 7->14'),
      'manager-123'
    );
  });
});
