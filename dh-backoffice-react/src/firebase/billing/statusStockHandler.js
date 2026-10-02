import { increment } from 'firebase/firestore';
import { gasStockService } from '../gasStockService';
import { resolveEffectiveBuffer, isStockAvailableForSale } from 'dh-shared';

export const handleStockDeduction = (transaction, db, productRefs, productSnaps, inventorySettingsSnap, canBypass = false) => {
    const defaultBuffer = inventorySettingsSnap && inventorySettingsSnap.exists() 
        ? (inventorySettingsSnap.data().defaultBufferStock ?? 2) 
        : 2;
        
    productSnaps.forEach((pSnap, index) => {
        if (pSnap.exists()) {
            const currentStock = pSnap.data().stockQuantity || 0;
            const requiredQty = productRefs[index].qty || productRefs[index].totalQty || 1;
            const itemBuffer = resolveEffectiveBuffer(pSnap.data().bufferStock, defaultBuffer);

            if (!isStockAvailableForSale(currentStock, itemBuffer, requiredQty, canBypass)) {
                const skuLabel = pSnap.data().sku || productRefs[index].itemIdentifier || 'Unknown';
                throw new Error(canBypass
                    ? `สินค้า ${skuLabel} สต็อกคงเหลือไม่เพียงพอ (คงเหลือ ${currentStock} ชิ้น, ต้องการ ${requiredQty} ชิ้น)`
                    : `สินค้า ${skuLabel} สต็อกคงเหลือไม่เพียงพอ (ติด Buffer ${itemBuffer} ชิ้น, คงเหลือ ${currentStock} ชิ้น, ต้องการ ${requiredQty} ชิ้น)`);
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
