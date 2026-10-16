import assert from 'node:assert';

console.log('🧪 Testing Billing Resume Draft & Tab Selection Logic...');

// Simulate tab matching logic implemented in usePosState
function simulateResumeDraft(existingTabs, initialDraft) {
    const draftOrderId = initialDraft.orderId ? String(initialDraft.orderId) : null;
    const draftDocId = initialDraft.id ? String(initialDraft.id) : null;

    let targetTabId = null;
    let newTabs = [];

    const validPrev = Array.isArray(existingTabs) ? existingTabs.filter(t => t && typeof t === 'object' && t.id) : [];

    const matchedExistingIndex = validPrev.findIndex(tab => {
        if (draftOrderId && tab.orderId === draftOrderId) return true;
        if (draftDocId && (tab.docId === draftDocId || tab.id === draftDocId)) return true;
        if (draftOrderId && tab.id === draftOrderId) return true;
        return false;
    });

    if (matchedExistingIndex !== -1) {
        const existingTab = validPrev[matchedExistingIndex];
        targetTabId = existingTab.id; // Must be tab.id

        const updatedTab = {
            ...existingTab,
            orderId: draftOrderId || existingTab.orderId,
            docId: draftDocId || existingTab.docId,
            items: initialDraft.items || []
        };

        newTabs = [...validPrev];
        newTabs[matchedExistingIndex] = updatedTab;
    } else {
        const assignedId = String(Date.now() + Math.random());
        targetTabId = assignedId;

        const newTab = {
            id: assignedId,
            orderId: draftOrderId || null,
            docId: draftDocId || null,
            items: initialDraft.items || []
        };

        const emptyTabIndex = validPrev.findIndex(t => (!t.items || t.items.length === 0) && !t.customer && !t.walkInName && !t.orderId && !t.docId);
        if (emptyTabIndex !== -1) {
            newTabs = [...validPrev];
            newTabs[emptyTabIndex] = newTab;
        } else {
            newTabs = [...validPrev, newTab];
        }
    }

    // Active tab resolution test
    const resolvedActiveTab = newTabs.find(t => t?.id === targetTabId) || newTabs[0];

    return {
        newTabs,
        targetTabId,
        resolvedActiveTab
    };
}

// Test Case 1: Existing Tab for DH-TEMP-3925 exists with numeric timestamp id
const tabsCase1 = [
    { id: '1729000000001', orderId: 'DH-TEMP-1111', items: [{ sku: 'A', qty: 1 }] },
    { id: '1729000000002', orderId: 'DH-TEMP-2222', items: [{ sku: 'B', qty: 1 }] },
    { id: '1729000000003', orderId: 'DH-TEMP-3925', items: [{ sku: 'ACER', qty: 2 }] }
];
const draftCase1 = { id: 'firestore_doc_3925', orderId: 'DH-TEMP-3925', items: [{ sku: 'ACER', qty: 2 }] };

const result1 = simulateResumeDraft(tabsCase1, draftCase1);
assert.strictEqual(result1.targetTabId, '1729000000003', 'targetTabId must match the existing tab id');
assert.strictEqual(result1.resolvedActiveTab.id, '1729000000003', 'resolvedActiveTab must be tab 3');
assert.strictEqual(result1.resolvedActiveTab.orderId, 'DH-TEMP-3925', 'resolved tab orderId must be DH-TEMP-3925');
console.log('✅ Test 1 Passed: Correctly identified and activated existing DH-TEMP-3925 tab!');

// Test Case 2: No existing tab for DH-TEMP-3925 -> creates new tab and matches activeTabId
const tabsCase2 = [
    { id: '1729000000001', orderId: 'DH-TEMP-1111', items: [{ sku: 'A', qty: 1 }] }
];
const draftCase2 = { id: 'firestore_doc_3925', orderId: 'DH-TEMP-3925', items: [{ sku: 'ACER', qty: 2 }] };

const result2 = simulateResumeDraft(tabsCase2, draftCase2);
assert.strictEqual(result2.newTabs.length, 2, 'Must add new tab');
assert.strictEqual(result2.resolvedActiveTab.id, result2.targetTabId, 'resolvedActiveTab must match targetTabId');
assert.strictEqual(result2.resolvedActiveTab.orderId, 'DH-TEMP-3925', 'new tab orderId must be DH-TEMP-3925');
console.log('✅ Test 2 Passed: Created and activated new tab when not existing!');

// Test Case 3: Replaces empty placeholder tab
const tabsCase3 = [
    { id: '1729000000001', orderId: 'DH-TEMP-1111', items: [{ sku: 'A', qty: 1 }] },
    { id: '1729000000002', orderId: null, items: [] } // Empty tab
];
const draftCase3 = { id: 'firestore_doc_3925', orderId: 'DH-TEMP-3925', items: [{ sku: 'ACER', qty: 2 }] };

const result3 = simulateResumeDraft(tabsCase3, draftCase3);
assert.strictEqual(result3.newTabs.length, 2, 'Should reuse empty tab slot');
assert.strictEqual(result3.resolvedActiveTab.id, result3.targetTabId, 'resolvedActiveTab must match targetTabId');
assert.strictEqual(result3.resolvedActiveTab.orderId, 'DH-TEMP-3925');
console.log('✅ Test 3 Passed: Reused empty tab slot correctly!');

console.log('🎉 All 3 verification tests passed with 100% precision!');
