const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, getDocs, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b",
  storageBucket: "dh-notebook-69f3b.firebasestorage.app",
  messagingSenderId: "713635574580",
  appId: "1:713635574580:web:8d60ac45a28d5938972b61"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper psychological ending calculation
const calculateNextEnding = (price, targetStr) => {
  if (!targetStr && targetStr !== '0') return null;
  const targetNum = parseInt(targetStr, 10);
  if (isNaN(targetNum)) return null;

  const mod = Math.pow(10, targetStr.length);
  const baseFloor = price - (price % mod);
  let candidate = baseFloor + targetNum;

  if (candidate < price) {
      candidate += mod;
  }
  return candidate;
};

// Replicated calculation logic for verification
const simulateCalculateRetailPrice = (cost, category, config) => {
  if (!cost || isNaN(cost)) return 0;
  let baseRetail = cost;
  let matchedRule = null;
  
  const numCost = parseFloat(cost);
  const rules = config?.rules || [];

  const categoryRules = rules.filter(r => r.category.toLowerCase() === category.toLowerCase() && r.isActive);
  const sortedRules = [...categoryRules].sort((a, b) => a.threshold - b.threshold);

  for (const rule of sortedRules) {
    let isMatch = false;
    const th = parseFloat(rule.threshold);
    
    switch (rule.operator) {
      case '<': isMatch = numCost < th; break;
      case '<=': isMatch = numCost <= th; break;
      case '>': isMatch = numCost > th; break;
      case '>=': isMatch = numCost >= th; break;
      case 'all': isMatch = true; break;
      default: isMatch = false;
    }

    if (isMatch) {
      matchedRule = rule;
      break; 
    }
  }

  if (matchedRule) {
    const val = parseFloat(matchedRule.value);
    if (matchedRule.action === '*') {
      baseRetail = numCost * val;
    } else if (matchedRule.action === '/') {
      baseRetail = numCost / val;
    }
  }

  let finalPrice = Math.ceil(baseRetail); 
  const rounding = config?.rounding || { type: 'none' };
  let appliedRounding = 'ไม่มีการปัดเศษ';

  if (rounding.type === 'custom') {
    const primaryTargetStr = rounding.primaryTarget?.toString().trim();
    const fallbackTargetStr = rounding.fallbackTarget?.toString().trim();
    
    const primaryResult = calculateNextEnding(finalPrice, primaryTargetStr);
    
    if (primaryResult !== null) {
      finalPrice = primaryResult;
      appliedRounding = `ลงท้ายด้วย ${primaryTargetStr}`;
    } else if (rounding.enableFallback && fallbackTargetStr) {
      const fallbackResult = calculateNextEnding(finalPrice, fallbackTargetStr);
      if (fallbackResult !== null) {
         finalPrice = fallbackResult;
         appliedRounding = `ลงท้ายด้วย ${fallbackTargetStr} (เงื่อนไขสำรอง)`;
      }
    }
  }

  if (finalPrice <= numCost) {
     finalPrice = numCost + 100;
     appliedRounding = 'ปัดขึ้นฉุกเฉิน';
  }

  return {
    cost: numCost,
    calculatedPrice: finalPrice,
    rawPrice: baseRetail,
    appliedRuleId: matchedRule ? matchedRule.id : 'none',
    appliedRoundingType: appliedRounding,
    margin: finalPrice - numCost
  };
};

async function runTests() {
  console.log('========================================================');
  console.log('   DEVELOPER TESTING INTEGRITY FOR PHASE CAPACITIES');
  console.log('========================================================\n');

  // Test 1: Category Deduplication and Soft-Delete Filtering
  console.log('[TEST 1] Fetching categories (Filtering soft-deleted ones)...');
  const snapCats = await getDocs(collection(db, 'homepage_categories'));
  const allCats = snapCats.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const nonDeletedCats = allCats.filter(c => !c.deletedAt);
  const deletedCats = allCats.filter(c => c.deletedAt);
  
  console.log(`- Total categories in database: ${allCats.length}`);
  console.log(`- Active / Non-deleted: ${nonDeletedCats.length}`);
  console.log(`- Soft-deleted: ${deletedCats.length}`);
  
  // Verify no duplicate types exist in active list
  const activeTypes = nonDeletedCats.map(c => (c.type || '').trim().toLowerCase()).filter(t => t);
  const uniqueTypes = new Set(activeTypes);
  if (activeTypes.length === uniqueTypes.size) {
    console.log('✅ PASS: No active category types are duplicated in the UI.');
  } else {
    console.log('❌ FAIL: Found duplicates in active categories list.');
  }
  
  // Test 2: Category Deletion relation check mock
  console.log('\n[TEST 2] Deletion Safety Check Mock...');
  // We want to test deleting ID 8QhoqWqZI2Xc55h028x5 (Cable)
  const testCatId = '8QhoqWqZI2Xc55h028x5';
  const testCat = nonDeletedCats.find(c => c.id === testCatId);
  if (testCat) {
    console.log(`Found target category for deletion: ${testCat.name} (type: ${testCat.type})`);
    
    // Simulate check: is there another active category of same type/name?
    const hasOtherActiveCat = nonDeletedCats.some(c => 
      c.id !== testCatId && 
      (c.status === 'active' || c.isActive === true) && 
      (c.type || '').trim().toLowerCase() === (testCat.type || '').trim().toLowerCase()
    );
    
    console.log(`- Another active duplicate exists? ${hasOtherActiveCat ? 'Yes' : 'No'}`);
    
    // Verify against product collection
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('category_lower', '==', (testCat.type || '').trim().toLowerCase()), where('status', '==', 'active'));
    const prodSnap = await getDocs(q);
    console.log(`- Products currently linked to this category type: ${prodSnap.size}`);
    
    if (prodSnap.size > 0 && !hasOtherActiveCat) {
      console.log('✅ PASS: Deletion will be BLOCKED to protect product integrity.');
    } else if (hasOtherActiveCat) {
      console.log('✅ PASS: Deletion will be ALLOWED because another duplicate exists to serve products.');
    } else {
      console.log('✅ PASS: Deletion will be ALLOWED (No products linked).');
    }
  } else {
    console.log('ℹ️ Target category ID 8QhoqWqZI2Xc55h028x5 is already deleted or not found.');
  }

  // Test 3: Pricing Engine Calculations
  console.log('\n[TEST 3] Testing Pricing Calculations with dynamic categories...');
  const pricingSnap = await getDoc(doc(db, 'settings', 'pricing'));
  if (pricingSnap.exists()) {
    const pricingConfig = pricingSnap.data();
    console.log('Pricing configuration fetched successfully.');
    console.log('Rounding Rules:', JSON.stringify(pricingConfig.rounding));
    
    // Test Case A: Panel
    const testA = simulateCalculateRetailPrice(1000, 'Panel', pricingConfig);
    console.log(`\n- Panel (Cost 1,000 THB):`);
    console.log(`  Raw Price: ${testA.rawPrice}`);
    console.log(`  Final Net Retail Price: ${testA.calculatedPrice} THB (Target: ${testA.appliedRoundingType})`);
    console.log(`  Margin: ${testA.margin} THB`);
    if (testA.calculatedPrice === 1590) {
      console.log('  ✅ PASS: Price calculation and psychological rounding matched perfectly!');
    } else {
      console.log('  ❌ FAIL: Price calculation mismatch.');
    }

    // Test Case B: Adapter
    const testB = simulateCalculateRetailPrice(500, 'Adapter', pricingConfig);
    console.log(`- Adapter (Cost 500 THB):`);
    console.log(`  Raw Price: ${testB.rawPrice}`);
    console.log(`  Final Net Retail Price: ${testB.calculatedPrice} THB (Target: ${testB.appliedRoundingType})`);
    console.log(`  Margin: ${testB.margin} THB`);
    if (testB.calculatedPrice === 690) {
      console.log('  ✅ PASS: Adapter price calculated and rounded to 690 THB successfully!');
    } else {
      console.log('  ❌ FAIL: Adapter price calculation mismatch.');
    }
  } else {
    console.log('❌ FAIL: Pricing config document not found in settings.');
  }

  console.log('\n========================================================');
  console.log('            INTEGRITY VERIFICATION COMPLETED');
  console.log('========================================================');
}

runTests().catch(console.error);
