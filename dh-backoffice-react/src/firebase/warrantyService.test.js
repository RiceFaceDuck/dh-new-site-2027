import { test, describe, mock } from 'node:test';
import assert from 'node:assert';

// 1. Setup mocks for local modules
mock.module('./config.js', {
  namedExports: {
    db: { name: 'mock-db' }
  }
});

mock.module('./historyService.js', {
  namedExports: {
    historyService: {
      addLog: async () => {}
    }
  }
});

// We use a shared object for mutable state in mocks
const state = {
    getDocImpl: async () => ({ exists: () => false })
};

// Mock firebase/firestore with a redirect to our mutable state
mock.module('firebase/firestore', {
  namedExports: {
    doc: (db, coll, id) => ({ db, coll, id }),
    getDoc: async (docRef) => state.getDocImpl(docRef),
    setDoc: async () => {},
    serverTimestamp: () => 'mock-timestamp'
  }
});

// DELAY THE IMPORT of the module under test
let warrantyService;

describe('warrantyService.getWarrantySettings', () => {
  test('returns merged data when document exists', async (t) => {
    if (!warrantyService) {
        const module = await import('./warrantyService.js');
        warrantyService = module.warrantyService;
    }

    const mockData = {
      categories: {
        'Panel': { claimDays: 365, returnDays: 14 },
        'NewCategory': { claimDays: 30, returnDays: 7 }
      },
      skus: {
        'SKU-1': { claimDays: 100 }
      }
    };

    state.getDocImpl = async () => ({
      exists: () => true,
      data: () => mockData
    });

    const result = await warrantyService.getWarrantySettings();

    assert.strictEqual(result.categories['Panel'].claimDays, 365);
    assert.strictEqual(result.categories['Panel'].returnDays, 14);
    assert.strictEqual(result.categories['Keyboard'].claimDays, 90); // From DEFAULT_WARRANTY
    assert.strictEqual(result.categories['NewCategory'].claimDays, 30);
    assert.strictEqual(result.skus['SKU-1'].claimDays, 100);
  });

  test('returns DEFAULT_WARRANTY when document does not exist', async (t) => {
    if (!warrantyService) {
        const module = await import('./warrantyService.js');
        warrantyService = module.warrantyService;
    }

    state.getDocImpl = async () => ({
      exists: () => false
    });

    const result = await warrantyService.getWarrantySettings();

    assert.strictEqual(result.categories['Panel'].claimDays, 180); // Default
    assert.deepStrictEqual(result.skus, {});
  });

  test('returns DEFAULT_WARRANTY on error', async (t) => {
    if (!warrantyService) {
        const module = await import('./warrantyService.js');
        warrantyService = module.warrantyService;
    }

    state.getDocImpl = async () => {
      throw new Error('Firestore Error');
    };

    // Suppress console.error for clean test output
    const consoleSpy = mock.method(console, 'error', () => {});

    const result = await warrantyService.getWarrantySettings();

    assert.strictEqual(result.categories['Panel'].claimDays, 180); // Default
    assert.strictEqual(consoleSpy.mock.callCount(), 1);
    
    consoleSpy.mock.restore();
  });
});
