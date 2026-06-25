import { useEffect } from 'react';
import { sanitizeNum } from './usePosActions';

/**
 * Hook สำหรับตรวจสอบความถูกต้องของตะกร้าสินค้า (สต๊อกเหลือพอไหม, ราคาเปลี่ยนไหม)
 * 
 * 🚀 [UPDATED] รองรับทั้งสองโหมด:
 *   1. มี `products` array (Legacy mode - ดูดจากภายนอก)
 *   2. ไม่มี `products` array (New mode - ใช้ข้อมูลสต็อกจากรายการในตะกร้าโดยตรง)
 * 
 * ใน New mode ระบบจะตรวจสอบเฉพาะ:
 *   - สต็อกเทียบกับจำนวนที่สั่ง (item.stock vs item.qty)
 *   - ราคาไม่ตรวจสอบ (เพราะไม่มี masterProduct ให้เทียบ)
 */
export const useCartValidation = (activeTabId, activeTab, products, updateActiveTab) => {
    useEffect(() => {
        if (!activeTab || !activeTab.items || activeTab.items.length === 0) return;

        // ✅ [NEW MODE] ถ้าไม่มี products array (เพราะ POS ใช้ Dynamic Search แล้ว)
        // ให้ตรวจสอบเฉพาะสต็อกจาก item.stock ที่บันทึกไว้ตอน add to cart
        if (!products || products.length === 0) {
            let alertMessages = [];
            activeTab.items.forEach(cartItem => {
                const stock = sanitizeNum(cartItem.stock);
                const qty = sanitizeNum(cartItem.qty);
                if (stock > 0 && qty > stock) {
                    alertMessages.push(`- ${cartItem.name} (สต็อกเหลือ ${stock}, แต่สั่ง ${qty})`);
                }
            });

            if (alertMessages.length > 0) {
                setTimeout(() => alert(`⚠️ สต็อกสินค้าไม่เพียงพอ:\n\n${alertMessages.join('\n')}`), 500);
            }
            return;
        }

        // ✅ [LEGACY MODE] ถ้ามี products array ส่งมา → ใช้ Logic เดิมทุกอย่าง
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
