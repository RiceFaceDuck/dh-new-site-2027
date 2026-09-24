import { increment } from 'firebase/firestore';
import { gasStockService } from '../gasStockService';

export const handleStockDeduction = (transaction, db, productRefs, productSnaps, inventorySettingsSnap) => {
    const defaultBuffer = inventorySettingsSnap && inventorySettingsSnap.exists() 
        ? inventorySettingsSnap.data().defaultBufferStock || 0 
        : 0;
        
    productSnaps.forEach((pSnap, index) => {
        if (pSnap.exists()) {
            const currentStock = pSnap.data().stockQuantity || 0;
            const requiredQty = productRefs[index].qty || productRefs[index].totalQty || 1;
            const itemBuffer = pSnap.data().bufferStock !== undefined 
                ? pSnap.data().bufferStock 
                : defaultBuffer;

            if ((currentStock - requiredQty) < itemBuffer) {
                const skuLabel = pSnap.data().sku || productRefs[index].itemIdentifier || 'Unknown';
                throw new Error(`สินค้า ${skuLabel} สต็อกคงเหลือไม่เพียงพอ (ติด Buffer ${itemBuffer} ชิ้น)`);
            }
            
            const newStock = currentStock - requiredQty;
            transaction.update(productRefs[index].ref, { 
                stockQuantity: newStock, 
                'stats.sold': increment(requiredQty) 
            });
            
            gasStockService.queueUpdate({ ...pSnap.data(), sku: pSnap.data().sku, stockQuantity: newStock });
        }
    });
};

export const handleStockReturn = (transaction, db, productRefs, productSnaps) => {
    productSnaps.forEach((pSnap, index) => {
        if (pSnap.exists()) {
            const currentStock = pSnap.data().stockQuantity || 0;
            const qtyToReturn = productRefs[index].qty || productRefs[index].totalQty || 1;
            const newStock = currentStock + qtyToReturn;
            
            transaction.update(productRefs[index].ref, { 
                stockQuantity: newStock, 
                'stats.sold': increment(-qtyToReturn) 
            });
            
            gasStockService.queueUpdate({ ...pSnap.data(), sku: pSnap.data().sku, stockQuantity: newStock });
        }
    });
};
