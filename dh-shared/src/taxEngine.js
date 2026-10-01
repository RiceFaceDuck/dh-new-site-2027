/**
 * Tax Engine
 * Centralized business logic for calculating VAT across DH Ecosystem.
 */

export const VAT_RATE = 0.07;

/**
 * Calculates VAT amounts based on the VAT type and subtotal.
 * 
 * @param {number} amount - The amount to calculate VAT for (usually net total or subtotal)
 * @param {string} vatType - "รวม VAT", "แยก VAT", "ไม่มี VAT"
 * @returns {Object} { vatAmount, amountBeforeVat, finalTotal }
 */
export const calculateVat = (rawAmount, vatType = 'ไม่มี VAT') => {
    const amount = Number(rawAmount);
    const safeAmount = isNaN(amount) ? 0 : amount;

    let vatAmount = 0;
    let amountBeforeVat = safeAmount;
    let finalTotal = safeAmount;

    if (vatType === 'รวม VAT') {
        // e.g. amount = 107, vat = 7, before = 100
        amountBeforeVat = safeAmount / (1 + VAT_RATE);
        vatAmount = safeAmount - amountBeforeVat;
        finalTotal = safeAmount;
    } else if (vatType === 'แยก VAT') {
        // e.g. amount = 100, vat = 7, total = 107
        vatAmount = safeAmount * VAT_RATE;
        amountBeforeVat = safeAmount;
        finalTotal = safeAmount + vatAmount;
    } else {
        // ไม่มี VAT
        vatAmount = 0;
        amountBeforeVat = safeAmount;
        finalTotal = safeAmount;
    }

    return {
        vatAmount: Math.round(vatAmount * 100) / 100,
        amountBeforeVat: Math.round(amountBeforeVat * 100) / 100,
        finalTotal: Math.round(finalTotal * 100) / 100
    };
};

/**
 * Detailed VAT calculation supporting product net, shipping fee, vatType, vatOnShipping, vatRate.
 */
export const calculateDetailedVat = ({
    productNet = 0,
    shippingFee = 0,
    vatType = 'exempt',
    vatOnShipping = false,
    vatRate = 7
} = {}) => {
    const pNet = Math.max(0, Number(productNet) || 0);
    const sFee = Math.max(0, Number(shippingFee) || 0);
    const rate = Math.max(0, Number(vatRate) ?? 7);
    const rateFactor = rate / 100;
    const round2 = (val) => Math.round(Number(val || 0) * 100) / 100;

    const normalizedVatType = (vatType === 'included' || vatType === 'รวม VAT')
        ? 'included'
        : (vatType === 'excluded' || vatType === 'แยก VAT')
            ? 'excluded'
            : 'exempt';

    let productBase = 0;
    let productVat = 0;
    let productTotal = pNet;

    if (normalizedVatType === 'included') {
        if (rateFactor > 0) {
            productBase = round2(pNet / (1 + rateFactor));
            productVat = round2(pNet - productBase);
        } else {
            productBase = pNet;
            productVat = 0;
        }
        productTotal = pNet;
    } else if (normalizedVatType === 'excluded') {
        productBase = pNet;
        productVat = round2(pNet * rateFactor);
        productTotal = round2(productBase + productVat);
    } else {
        productBase = pNet;
        productVat = 0;
        productTotal = pNet;
    }

    let shippingBase = sFee;
    let shippingVat = 0;
    let shippingTotal = sFee;

    if (normalizedVatType !== 'exempt' && vatOnShipping && rateFactor > 0) {
        shippingVat = round2(sFee * rateFactor);
        shippingTotal = round2(shippingBase + shippingVat);
    }

    const amountBeforeVat = round2(productBase + shippingBase);
    const vatAmount = round2(productVat + shippingVat);
    const netTotal = round2(productTotal + shippingTotal);

    return {
        vatRate: rate,
        vatType: normalizedVatType,
        productBase,
        productVat,
        productTotal,
        shippingBase,
        shippingVat,
        shippingTotal,
        amountBeforeVat,
        vatAmount,
        netTotal
    };
};

