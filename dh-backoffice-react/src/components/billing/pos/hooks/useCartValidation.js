import { useEffect } from 'react';
import { sanitizeNum } from './usePosActions';

/**
 * Hook สำหรับตรวจสอบความถูกต้องของตะกร้าสินค้า (สต๊อกเหลือพอไหม, ราคาเปลี่ยนไหม)
 */
export const useCartValidation = (activeTabId, activeTab, products, updateActiveTab) => {
    useEffect(() => {
        if (!activeTab || !activeTab.items || activeTab.items.length === 0) return;
        if (!products || products.length === 0) return; 

        let isCartUpdated = false;
        let alertMessages = [];
        
        const validatedItems = activeTab.items.map(cartItem => {
            const masterProduct = products.find(p => p.sku === cartItem.sku);
            if (!masterProduct) return cartItem;

            let newItem = { ...cartItem };
            let itemChanged = false;

            // ตรวจสอบ Stock
            if (newItem.stock !== masterProduct.stockQuantity) {
                newItem.stock = masterProduct.stockQuantity; 
                itemChanged = true;
                if (masterProduct.stockQuantity < newItem.qty) {
                    alertMessages.push(`- ${newItem.name} (สต็อกเหลือ ${masterProduct.stockQuantity})`);
                }
            }

            // ตรวจสอบ ราคา (Price Mode)
            const expectedPrice = activeTab.priceMode === 'wholesale' 
                ? (masterProduct.Price || masterProduct.retailPrice || 0) 
                : (masterProduct.retailPrice || masterProduct.Price || 0);
            
            const oldBase = activeTab.priceMode === 'wholesale' ? newItem.baseWholesale : newItem.baseRetail;
            
            if (oldBase !== expectedPrice) {
                 if (sanitizeNum(newItem.price) === sanitizeNum(oldBase)) {
                     newItem.price = expectedPrice; 
                     alertMessages.push(`- ${newItem.name} (ราคาปรับใหม่: ฿${expectedPrice})`);
                 }
                 newItem.baseWholesale = masterProduct.Price || masterProduct.retailPrice || 0;
                 newItem.baseRetail = masterProduct.retailPrice || masterProduct.Price || 0;
                 itemChanged = true;
            }

            if (itemChanged) isCartUpdated = true;
            return newItem;
        });

        if (isCartUpdated) {
            updateActiveTab({ items: validatedItems });
            if (alertMessages.length > 0) {
                setTimeout(() => alert(`⚠️ อัปเดตข้อมูลบิลร่างล่าสุด:\n\n${alertMessages.join('\n')}`), 500);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTabId, products, activeTab?.priceMode]);
};
