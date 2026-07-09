import { calculateNetTotal } from './priceEngine.js';

/**
 * Fraud Detection Engine
 * Verifies the integrity of an order submitted from the client-side to detect price spoofing or tampering.
 * 
 * @param {Object} orderData - The order document from Firestore
 * @param {Array} currentProductsInDb - Array of full product documents currently in DB matching the order items
 * @returns {Object} result - { isFraud: boolean, riskLevel: 'NONE' | 'HIGH' | 'CRITICAL', messages: string[] }
 */
export const verifyOrderIntegrity = (orderData, currentProductsInDb) => {
    const result = {
        isFraud: false,
        riskLevel: 'NONE',
        messages: []
    };

    if (!orderData || !orderData.items || !Array.isArray(orderData.items)) {
        return result; // Nothing to verify or invalid format
    }

    // 1. Level 2 Check: Price Spoofing
    // Check if the priceAtPurchase (or retailPrice) sent by the client matches the DB price
    
    // Re-hydrate items with current DB prices to see what it *should* cost today
    const verifiedItems = orderData.items.map((item) => {
        if (item.isFreebie) return item;
        
        const dbProduct = currentProductsInDb.find(p => p.id === (item.id || item.sku) || p.sku === (item.id || item.sku));
        if (!dbProduct) {
            result.isFraud = true;
            result.riskLevel = 'HIGH';
            result.messages.push(`ไม่พบสินค้า ${item.sku || item.name} ในฐานข้อมูล อาจถูกลบหรือใส่รหัสปลอม`);
            return item;
        }

        const realPrice = Number(dbProduct.retailPrice || dbProduct.Price || 0);
        const purchasePrice = Number(item.priceAtPurchase || item.retailPrice || item.price || 0);

        // Check for unrealistic price drops (e.g. bought a 25,000 laptop for 1 THB)
        // Allowing 15% manual discount difference just in case admin changed price slightly after purchase
        const priceDiff = realPrice - purchasePrice;
        if (priceDiff > 0 && purchasePrice < (realPrice * 0.85) && purchasePrice < 500 && realPrice > 1000) {
            result.isFraud = true;
            result.riskLevel = 'CRITICAL';
            result.messages.push(`ราคาสินค้า ${item.sku} ต่ำผิดปกติ! (บันทึกมา ${purchasePrice} บ. | ราคาจริง ${realPrice} บ.)`);
        }

        return { ...item, retailPrice: realPrice };
    });

    // 2. Level 1 Check: Math Tampering (Net Total Forgery)
    // Recalculate what the mathematical total SHOULD be based on the items submitted.
    const mathCheck = calculateNetTotal({
        items: orderData.items, 
        shippingCost: orderData.shippingFee || orderData.shippingCost || orderData.summary?.shippingFee || orderData.totals?.shipping || orderData.totals?.shippingCost || 0,
        otherFeeAmount: orderData.otherFees || orderData.extraFee || orderData.summary?.otherFees || orderData.totals?.otherFeeAmount || 0,
        discountAmount: orderData.overallDiscount || orderData.promoDiscount || orderData.discountAmount || orderData.summary?.discountTotal || orderData.calculationLog?.discountAmount || orderData.totals?.discountAmount || orderData.totals?.discount || 0,
        walletUsed: orderData.walletUsed || orderData.walletUsedAmount || orderData.summary?.walletUsed || orderData.calculationLog?.usedWallet || 0,
        promotions: orderData.appliedPromotions || []
    });

    const expectedMathTotal = mathCheck.netTotal;
    const submittedNetTotal = Number(orderData.netTotal || orderData.totals?.netTotal || orderData.summary?.finalTotal || orderData.finalTotal || orderData.finalPayable || orderData.totalPrice || orderData.totalAmount || 0);
    
    if (Math.abs(expectedMathTotal - submittedNetTotal) > 10) { // Allow 10 baht rounding buffer
        result.isFraud = true;
        result.riskLevel = 'CRITICAL';
        result.messages.push(`ยอดรวมสุทธิถูกดัดแปลง! (คำนวณได้ ${expectedMathTotal} บ. แต่รับมา ${submittedNetTotal} บ.)`);
    }

    // 3. Database Reality Check
    // Calculate total using REAL current database prices
    const dbCheck = calculateNetTotal({
        items: verifiedItems,
        shippingCost: orderData.shippingFee || orderData.shippingCost || orderData.summary?.shippingFee || orderData.totals?.shipping || orderData.totals?.shippingCost || 0,
        otherFeeAmount: orderData.otherFees || orderData.extraFee || orderData.summary?.otherFees || orderData.totals?.otherFeeAmount || 0,
        discountAmount: orderData.overallDiscount || orderData.promoDiscount || orderData.discountAmount || orderData.summary?.discountTotal || orderData.calculationLog?.discountAmount || orderData.totals?.discountAmount || orderData.totals?.discount || 0,
        walletUsed: orderData.walletUsed || orderData.walletUsedAmount || orderData.summary?.walletUsed || orderData.calculationLog?.usedWallet || 0,
        promotions: orderData.appliedPromotions || []
    });

    if (Math.abs(dbCheck.netTotal - submittedNetTotal) > 1000) { // 1000 baht threshold for alert if prices changed heavily
        if (!result.isFraud) {
            result.riskLevel = 'HIGH';
            result.messages.push(`ราคาปัจจุบันในระบบ (${dbCheck.netTotal} บ.) แตกต่างจากยอดบิลนี้อย่างมาก อาจมีการแก้ไขราคา`);
        }
    }

    return result;
};
