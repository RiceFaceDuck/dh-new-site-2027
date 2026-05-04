// ⚡️ Redirect Context: ป้องกันปัญหา Import Mismatch (หา Context ไม่เจอ) 
// โอนย้ายการเรียก CartContext จากไฟล์อื่นๆ ในระบบ (ถ้ามี) ให้ไปดึงจาก CartProvider ที่เราเพิ่งอัปเกรดแทนอัตโนมัติ

import { CartContext as ProviderContext } from './CartProvider';

export const CartContext = ProviderContext;
export default CartContext;