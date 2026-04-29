import React from 'react';
import { ShoppingBag, Tag } from 'lucide-react';

/**
 * CheckoutSummary - กล่องแสดงสรุปรายการสั่งซื้อฝั่งขวา
 */
const CheckoutSummary = ({ cartItems = [], subTotal = 0, shippingFee = 0, discountFromPoints = 0 }) => {
  
  // คำนวณยอดสุทธิ (Grand Total)
  const grandTotal = Math.max(0, subTotal + shippingFee - discountFromPoints);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-24 overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <ShoppingBag size={18} className="text-[#0870B8]" />
        <h3 className="font-bold text-slate-800">สรุปคำสั่งซื้อ</h3>
        <span className="ml-auto bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
          {cartItems.length} ชิ้น
        </span>
      </div>

      {/* Item List (แสดงย่อๆ) */}
      <div className="p-6 border-b border-slate-100 max-h-[300px] overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          {cartItems.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 p-1 flex-shrink-0">
                <img src={item.imageUrl || '/logo.png'} alt={item.name} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-500">จำนวน: {item.quantity}</span>
                  <span className="text-sm font-bold text-slate-700">฿{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calculation */}
      <div className="p-6 bg-slate-50 space-y-3">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>ยอดรวมสินค้า (Subtotal)</span>
          <span className="font-semibold">฿{subTotal.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>ค่าจัดส่ง (Shipping)</span>
          <span className="font-semibold">{shippingFee > 0 ? `฿${shippingFee.toLocaleString()}` : 'ส่งฟรี'}</span>
        </div>

        {/* บรรทัดส่วนลดจากแต้ม (แสดงเมื่อมีการใช้แต้ม) */}
        {discountFromPoints > 0 && (
          <div className="flex items-center justify-between text-sm text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-100 animate-in slide-in-from-right-4 duration-300">
            <span className="flex items-center gap-1"><Tag size={14} /> ส่วนลด (DH Points)</span>
            <span>- ฿{discountFromPoints.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="p-6 bg-slate-900 text-white">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">ยอดชำระสุทธิ</span>
          <span className="text-2xl font-black text-white font-tech tracking-wider">
            ฿{grandTotal.toLocaleString()}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-right">รวมภาษีมูลค่าเพิ่มแล้ว</p>
      </div>

    </div>
  );
};

export default CheckoutSummary;