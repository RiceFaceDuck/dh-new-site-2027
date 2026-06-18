import { doc, increment } from 'firebase/firestore';

export const handleStockDeduction = (transaction, db, productRefs, productSnaps, inventorySettingsSnap) => {
    const defaultBuffer = inventorySettingsSnap && inventorySettingsSnap.exists() 
        ? inventorySettingsSnap.data().defaultBufferStock || 0 
        : 0;
        
    productSnaps.forEach((pSnap, index) => {
        if (pSnap.exists()) {
            const currentStock = pSnap.data().stockQuantity || 0;
            const requiredQty = productRefs[index].qty;
            const itemBuffer = pSnap.data().bufferStock !== undefined 
                ? pSnap.data().bufferStock 
                : defaultBuffer;

            if ((currentStock - requiredQty) < itemBuffer) {
                throw new Error(`สินค้า ${pSnap.data().sku} สต็อกคงเหลือไม่เพียงพอ (ติด Buffer ${itemBuffer} ชิ้น)`);
            }
            
            transaction.update(productRefs[index].ref, { 
                stockQuantity: currentStock - requiredQty, 
                'stats.sold': increment(requiredQty) 
            });
        }
    });
};

export const handleStockReturn = (transaction, db, productRefs, productSnaps) => {
    productSnaps.forEach((pSnap, index) => {
        if (pSnap.exists()) {
            const currentStock = pSnap.data().stockQuantity || 0;
            const qtyToReturn = productRefs[index].qty;
            transaction.update(productRefs[index].ref, { 
                stockQuantity: currentStock + qtyToReturn, 
                'stats.sold': increment(-qtyToReturn) 
            });
        }
    });
};
