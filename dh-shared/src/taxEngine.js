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
export const calculateVat = (amount, vatType = 'ไม่มี VAT') => {
    let vatAmount = 0;
    let amountBeforeVat = amount;
    let finalTotal = amount;

    if (vatType === 'รวม VAT') {
        // e.g. amount = 107, vat = 7, before = 100
        amountBeforeVat = amount / (1 + VAT_RATE);
        vatAmount = amount - amountBeforeVat;
        finalTotal = amount;
    } else if (vatType === 'แยก VAT') {
        // e.g. amount = 100, vat = 7, total = 107
        vatAmount = amount * VAT_RATE;
        amountBeforeVat = amount;
        finalTotal = amount + vatAmount;
    } else {
        // ไม่มี VAT
        vatAmount = 0;
        amountBeforeVat = amount;
        finalTotal = amount;
    }

    return {
        vatAmount: Math.round(vatAmount * 100) / 100,
        amountBeforeVat: Math.round(amountBeforeVat * 100) / 100,
        finalTotal: Math.round(finalTotal * 100) / 100
    };
};
