import { useContext } from 'react';
import { CartContext } from '../context/CartProvider';

export const useCart = () => {
  // ดึง Context จาก CartProvider โดยตรง ป้องกันการดึงผิดไฟล์
  const context = useContext(CartContext);
  
  // ⚡️ Safe Fallback: ป้องกันจอขาว (App Crash) 100% 
  // กรณีโหลดข้อมูล Context ไม่ทัน หรือมีไฟล์ไหนอยู่นอก Provider จะไม่ Error แต่จะได้ค่า 0 แทน
  if (context === undefined) {
    console.warn("⚠️ [Safe Mode] useCart is running outside CartProvider or missing Context link. Fallback applied.");
    return {
      cartItems: [],
      cartTotalQty: 0,
      cartCount: 0,
      cartTotalAmount: 0,
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      isCartOpen: false,
      setIsCartOpen: () => {},
      checkoutState: {},
      updateCheckoutConfig: () => {},
      totals: { count: 0, subtotal: 0, shipping: 0, discount: 0, grandTotal: 0, displayTotal: 0 }
    };
  }
  
  return context;
};

export default useCart;