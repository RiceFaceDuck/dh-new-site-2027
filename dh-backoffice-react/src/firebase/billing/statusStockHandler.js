import { doc, increment } from 'firebase/firestore';
import { gasStockService } from '../gasStockService';

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
            
            const newStock = currentStock - requiredQty;
            transaction.update(productRefs[index].ref, { 
                stockQuantity: newStock, 
                'stats.sold': increment(requiredQty) 
            });
            
            gasStockService.queueUpdate({ sku: pSnap.data().sku, stockQuantity: newStock });
        }
    });
};

export const handleStockReturn = (transaction, db, productRefs, productSnaps) => {
    productSnaps.forEach((pSnap, index) => {
        if (pSnap.exists()) {
            const currentStock = pSnap.data().stockQuantity || 0;
            const qtyToReturn = productRefs[index].qty;
            const newStock = currentStock + qtyToReturn;
            
            transaction.update(productRefs[index].ref, { 
                stockQuantity: newStock, 
                'stats.sold': increment(-qtyToReturn) 
            });
            
            gasStockService.queueUpdate({ sku: pSnap.data().sku, stockQuantity: newStock });
        }
    });
};
