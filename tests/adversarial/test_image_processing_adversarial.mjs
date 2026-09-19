/**
 * 🧪 ADVERSARIAL STRESS TEST SUITE: imageProcessingUtils
 * Location: Management System/tests/adversarial/test_image_processing_adversarial.mjs
 * 
 * Tests boundary conditions, adversarial inputs, type coercion, null/undefined safety,
 * Google Drive URL patterns, and fallback lifecycles.
 */

import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the module under test
const modulePath = path.resolve(__dirname, '../../dh-shared/src/utils/imageProcessingUtils.js');
const imageUtils = await import(`file://${modulePath}`);
const {
  readFileAsBase64,
  getRenderableImageUrl,
  handleImageError,
  compressImageWithCanvas
} = imageUtils.default || imageUtils;

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res
        .then(() => {
          passed++;
          console.log(`  ✓ ${name}`);
        })
        .catch((err) => {
          failed++;
          console.error(`  ✗ ${name}`);
          console.error(`    ${err.message}`);
        });
    } else {
      passed++;
      console.log(`  ✓ ${name}`);
      return Promise.resolve();
    }
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    return Promise.resolve();
  }
}

console.log('================================================================');
console.log('🧪 ADVERSARIAL SUITE 1: imageProcessingUtils Edge Cases');
console.log('================================================================');

async function main() {
  // -------------------------------------------------------------
  // SECTION 1: getRenderableImageUrl Edge Cases & Attack Vectors
  // -------------------------------------------------------------
  console.log('\n--- Testing getRenderableImageUrl ---');

  await runTest('returns empty string for null', () => {
    assert.strictEqual(getRenderableImageUrl(null), '');
  });

  await runTest('returns empty string for undefined', () => {
    assert.strictEqual(getRenderableImageUrl(undefined), '');
  });

  await runTest('returns empty string for empty string', () => {
    assert.strictEqual(getRenderableImageUrl(''), '');
  });

  await runTest('returns empty string for whitespace-only string', () => {
    assert.strictEqual(getRenderableImageUrl('   \t\n  '), '');
  });

  await runTest('returns empty string for boolean false', () => {
    assert.strictEqual(getRenderableImageUrl(false), '');
  });

  await runTest('returns empty string for empty array []', () => {
    assert.strictEqual(getRenderableImageUrl([]), '');
  });

  await runTest('returns string representation for number', () => {
    assert.strictEqual(getRenderableImageUrl(12345), '12345');
  });

  await runTest('preserves standard HTTPS image URL without drive patterns', () => {
    const url = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format';
    assert.strictEqual(getRenderableImageUrl(url), url);
  });

  await runTest('trims surrounding whitespace from standard URL', () => {
    const raw = '   https://example.com/banner.png   ';
    assert.strictEqual(getRenderableImageUrl(raw), 'https://example.com/banner.png');
  });

  await runTest('transforms Google Drive /file/d/{id}/view link', () => {
    const driveUrl = 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2e14D/view?usp=sharing';
    const expected = 'https://lh3.googleusercontent.com/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2e14D=w1000';
    assert.strictEqual(getRenderableImageUrl(driveUrl), expected);
  });

  await runTest('transforms Google Drive ?id={id} link', () => {
    const driveUrl = 'https://drive.google.com/open?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2e14D';
    const expected = 'https://lh3.googleusercontent.com/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2e14D=w1000';
    assert.strictEqual(getRenderableImageUrl(driveUrl), expected);
  });

  await runTest('transforms Google Drive /uc?id={id} link', () => {
    const driveUrl = 'https://drive.google.com/uc?export=view&id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2e14D';
    const expected = 'https://lh3.googleusercontent.com/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2e14D=w1000';
    assert.strictEqual(getRenderableImageUrl(driveUrl), expected);
  });

  await runTest('is idempotent when given already converted googleusercontent.com link', () => {
    const alreadyConverted = 'https://lh3.googleusercontent.com/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2e14D=w1000';
    assert.strictEqual(getRenderableImageUrl(alreadyConverted), alreadyConverted);
  });

  await runTest('handles malformed Google Drive URL without valid ID safely', () => {
    const malformed = 'https://drive.google.com/drive/folders/';
    // Should safely fallback to trimmed original rather than throwing or crashing
    assert.strictEqual(getRenderableImageUrl(malformed), malformed);
  });

  // -------------------------------------------------------------
  // SECTION 2: readFileAsBase64 Edge Cases
  // -------------------------------------------------------------
  console.log('\n--- Testing readFileAsBase64 ---');

  await runTest('rejects with descriptive Thai error on null', async () => {
    let errorCaught = null;
    try {
      await readFileAsBase64(null);
    } catch (err) {
      errorCaught = err;
    }
    assert.ok(errorCaught instanceof Error);
    assert.strictEqual(errorCaught.message, 'ไม่พบไฟล์สำหรับการแปลงข้อมูล Base64');
  });

  await runTest('rejects on undefined input', async () => {
    let errorCaught = null;
    try {
      await readFileAsBase64(undefined);
    } catch (err) {
      errorCaught = err;
    }
    assert.ok(errorCaught instanceof Error);
  });

  await runTest('rejects on empty string input', async () => {
    let errorCaught = null;
    try {
      await readFileAsBase64('');
    } catch (err) {
      errorCaught = err;
    }
    assert.ok(errorCaught instanceof Error);
  });

  await runTest('parses standard Data URL base64 payload after comma correctly', async () => {
    const originalFileReader = globalThis.FileReader;
    const testPayload = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const mockDataUrl = `data:image/png;base64,${testPayload}`;

    globalThis.FileReader = class MockFileReader {
      readAsDataURL() {
        setTimeout(() => {
          this.result = mockDataUrl;
          if (this.onload) this.onload();
        }, 10);
      }
    };

    try {
      const mockFile = { name: 'test.png', size: 100 };
      const base64Result = await readFileAsBase64(mockFile);
      assert.strictEqual(base64Result, testPayload);
    } finally {
      globalThis.FileReader = originalFileReader;
    }
  });

  await runTest('handles FileReader error event cleanly with rejection', async () => {
    const originalFileReader = globalThis.FileReader;
    const expectedErr = new Error('Simulated disk read error');

    globalThis.FileReader = class FailingFileReader {
      readAsDataURL() {
        setTimeout(() => {
          if (this.onerror) this.onerror(expectedErr);
        }, 10);
      }
    };

    try {
      let rejected = null;
      try {
        await readFileAsBase64({ name: 'corrupt.jpg' });
      } catch (e) {
        rejected = e;
      }
      assert.strictEqual(rejected, expectedErr);
    } finally {
      globalThis.FileReader = originalFileReader;
    }
  });

  // -------------------------------------------------------------
  // SECTION 3: handleImageError Fallback & Degradation Lifecycle
  // -------------------------------------------------------------
  console.log('\n--- Testing handleImageError ---');

  await runTest('safely returns without error on null event', () => {
    assert.doesNotThrow(() => handleImageError(null));
  });

  await runTest('safely returns without error on undefined event', () => {
    assert.doesNotThrow(() => handleImageError(undefined));
  });

  await runTest('safely returns without error on event without target', () => {
    assert.doesNotThrow(() => handleImageError({}));
  });

  await runTest('sets display none when non-drive image fails and no fallback is provided', () => {
    const mockTarget = {
      src: 'https://example.com/broken.jpg',
      dataset: {},
      style: { display: 'block' },
      onerror: () => {}
    };
    handleImageError({ target: mockTarget }, 'https://example.com/broken.jpg', '');
    assert.strictEqual(mockTarget.onerror, null);
    assert.strictEqual(mockTarget.style.display, 'none');
  });

  await runTest('sets fallback URL when non-drive image fails with fallback', () => {
    const mockTarget = {
      src: 'https://example.com/broken.jpg',
      dataset: {},
      style: { display: 'block' },
      onerror: () => {}
    };
    const fallback = 'https://example.com/placeholder.svg';
    handleImageError({ target: mockTarget }, 'https://example.com/broken.jpg', fallback);
    assert.strictEqual(mockTarget.onerror, null);
    assert.strictEqual(mockTarget.src, fallback);
  });

  await runTest('executes 3-step Google Drive fallback degradation cascade', () => {
    const driveUrl = 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2e14D/view';
    const driveId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2e14D';
    const fallback = 'https://example.com/no-image.png';

    const mockTarget = {
      src: 'https://lh3.googleusercontent.com/d/' + driveId + '=w1000',
      dataset: {},
      style: { display: 'block' },
      onerror: () => {}
    };

    // Step 0 -> Step 1 (Switch to drive thumbnail)
    handleImageError({ target: mockTarget }, driveUrl, fallback);
    assert.strictEqual(mockTarget.dataset.errorStep, '1');
    assert.strictEqual(mockTarget.src, `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`);

    // Step 1 -> Step 2 (Switch to uc export)
    handleImageError({ target: mockTarget }, driveUrl, fallback);
    assert.strictEqual(mockTarget.dataset.errorStep, '2');
    assert.strictEqual(mockTarget.src, `https://drive.google.com/uc?export=view&id=${driveId}`);

    // Step 2 -> Final Fallback
    handleImageError({ target: mockTarget }, driveUrl, fallback);
    assert.strictEqual(mockTarget.onerror, null);
    assert.strictEqual(mockTarget.src, fallback);
  });

  await runTest('audit finding: target lacking dataset property triggers TypeError', () => {
    // Adversarial test: verify behavior when a mock/custom target lacks dataset
    const plainTarget = {
      src: 'https://example.com/broken.jpg',
      style: {}
    };
    let threw = false;
    try {
      handleImageError({ target: plainTarget });
    } catch (e) {
      threw = true;
      assert.ok(e instanceof TypeError);
    }
    // Standard HTML elements always have dataset, but we document this contract requirement
    assert.strictEqual(threw, true, 'Calling with plain object lacking dataset should throw TypeError');
  });

  // -------------------------------------------------------------
  // SECTION 4: compressImageWithCanvas Edge Cases & Resilience
  // -------------------------------------------------------------
  console.log('\n--- Testing compressImageWithCanvas ---');

  await runTest('resolves immediately with null when given null', async () => {
    const res = await compressImageWithCanvas(null);
    assert.strictEqual(res, null);
  });

  await runTest('resolves immediately with undefined when given undefined', async () => {
    const res = await compressImageWithCanvas(undefined);
    assert.strictEqual(res, undefined);
  });

  await runTest('bypasses non-image files immediately without canvas processing', async () => {
    const pdfFile = { type: 'application/pdf', name: 'contract.pdf', size: 5000 };
    const res = await compressImageWithCanvas(pdfFile);
    assert.strictEqual(res, pdfFile);
  });

  await runTest('bypasses text files without canvas processing', async () => {
    const txtFile = { type: 'text/plain', name: 'readme.txt', size: 100 };
    const res = await compressImageWithCanvas(txtFile);
    assert.strictEqual(res, txtFile);
  });

  // Summary
  console.log('\n================================================================');
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error running adversarial tests:', err);
  process.exit(1);
});
