/**
 * Shipping Engine
 * Centralized business logic for evaluating shipping and insurance rules based on cart items.
 */

const safeNum = (val, defaultVal = 0) => {
    const parsed = Number(val);
    return isNaN(parsed) ? defaultVal : parsed;
};

const getCategoryOfItem = (item) => {
  return item.productType || item.Category || item.category || 'All';
};

const getSkuOfItem = (item) => {
  return item.sku || item.id || '';
};

const getQtyOfItem = (item) => {
  return safeNum(item.qty || item.quantity || 1, 1);
};

/**
 * Evaluates active shipping and insurance rules based on cart items.
 * @param {Array} cartItems - Current items in the cart
 * @param {Array} rules - All shipping/insurance rules from database
 * @returns {Object} { shippingOptions: [{ company, cost, ruleId }], insuranceFee: number }
 */
export const evaluateShippingRules = (cartItems, rules) => {
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return { shippingOptions: [], insuranceFee: 0 };
  }

  // Filter only active rules
  const activeRules = (rules || []).filter(r => r.isActive && !r.deletedAt);

  const shippingRules = activeRules.filter(r => r.ruleType !== 'insurance');
  const insuranceRules = activeRules.filter(r => r.ruleType === 'insurance');

  // 1. Calculate Shipping Insurance Fee (Maximum matching insurance rule)
  let maxInsuranceFee = 0;
  insuranceRules.forEach(rule => {
    let isMatched = false;
    let totalQty = 0;

    if (rule.matchType === 'all') {
      totalQty = cartItems.reduce((sum, item) => sum + getQtyOfItem(item), 0);
      if (totalQty >= safeNum(rule.minQty) && totalQty <= safeNum(rule.maxQty)) {
        isMatched = true;
      }
    } else if (rule.matchType === 'sku') {
      totalQty = cartItems.reduce((sum, item) => {
        const itemSku = getSkuOfItem(item).toUpperCase();
        const ruleSku = (rule.sku || '').toUpperCase();
        if (itemSku === ruleSku) {
          return sum + getQtyOfItem(item);
        }
        return sum;
      }, 0);

      if (totalQty >= safeNum(rule.minQty) && totalQty <= safeNum(rule.maxQty)) {
        isMatched = true;
      }
    }

    if (isMatched) {
      const fee = safeNum(rule.shippingFee || 0);
      if (fee > maxInsuranceFee) {
        maxInsuranceFee = fee;
      }
    }
  });

  // 2. Evaluate Shipping Options (Find best match per shipping company)
  const optionsMap = {};

  shippingRules.forEach(rule => {
    let isMatched = false;
    let totalQty = 0;

    if (rule.matchType === 'category') {
      totalQty = cartItems.reduce((sum, item) => {
        const itemCat = getCategoryOfItem(item).toLowerCase();
        const ruleCat = (rule.productType || '').toLowerCase();
        
        if (ruleCat === 'all' || itemCat === ruleCat) {
          return sum + getQtyOfItem(item);
        }
        return sum;
      }, 0);

      if (totalQty >= safeNum(rule.minQty) && totalQty <= safeNum(rule.maxQty)) {
        isMatched = true;
      }
    } else if (rule.matchType === 'sku') {
      totalQty = cartItems.reduce((sum, item) => {
        const itemSku = getSkuOfItem(item).toUpperCase();
        const ruleSku = (rule.sku || '').toUpperCase();
        if (itemSku === ruleSku) {
          return sum + getQtyOfItem(item);
        }
        return sum;
      }, 0);

      if (totalQty >= safeNum(rule.minQty) && totalQty <= safeNum(rule.maxQty)) {
        isMatched = true;
      }
    } else if (rule.matchType === 'combo') {
      // Combo Rule: EVERY condition in rule.conditions array must pass!
      const conditions = rule.conditions || [];
      if (conditions.length > 0) {
        const allPass = conditions.every(cond => {
          let condQty = 0;
          if (cond.type === 'category') {
            condQty = cartItems.reduce((sum, item) => {
              const itemCat = getCategoryOfItem(item).toLowerCase();
              const ruleCat = (cond.value || '').toLowerCase();
              if (ruleCat === 'all' || itemCat === ruleCat) {
                return sum + getQtyOfItem(item);
              }
              return sum;
            }, 0);
          } else if (cond.type === 'sku') {
            condQty = cartItems.reduce((sum, item) => {
              const itemSku = getSkuOfItem(item).toUpperCase();
              const ruleSku = (cond.value || '').toUpperCase();
              if (itemSku === ruleSku) {
                return sum + getQtyOfItem(item);
              }
              return sum;
            }, 0);
          }
          return condQty >= safeNum(cond.minQty) && condQty <= safeNum(cond.maxQty);
        });
        
        if (allPass) {
          isMatched = true;
        }
      }
    }

    if (isMatched) {
      const companyKey = rule.company || 'จัดส่งทั่วไป';
      const cost = safeNum(rule.shippingFee || 0);

      // Keep the most economical or relevant rule matching the company
      if (!optionsMap[companyKey] || cost < optionsMap[companyKey].cost) {
        optionsMap[companyKey] = {
          company: companyKey,
          cost: cost,
          ruleId: rule.id
        };
      }
    }
  });

  return {
    shippingOptions: Object.values(optionsMap),
    insuranceFee: maxInsuranceFee
  };
};
