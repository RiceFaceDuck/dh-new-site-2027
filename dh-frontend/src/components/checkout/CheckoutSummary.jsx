import React from 'react';
import { ShoppingBag, Tag, Coins, Truck, ArrowRight, Loader2, Zap } from 'lucide-react';

const CheckoutSummary = ({ 
  cartItems, 
  subTotal, 
  promoDiscount, 
  shippingFee, 
  walletUsed, 
  finalPayable, 
  isB2B, 
  isSubmitting, 
  canSubmit,
  shippingConfig
}) => {
  return (
    <aside className="lg:col-span-4 space-y-6 sticky top-24">
      <div className="card-premium p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gray-50 rounded-full -mr-10 -mt-10 opacity-50"></div>
        <h2 className="text-lg font-black text-gray-800 mb-6 pb-4 border-b border-gray-100 uppercase tracking-widest flex items-center justify-between">
          Order Summary <ShoppingBag size={18} className="text-gray-300" />
        </h2>
        
        {/* รายการสินค้าสั้นๆ */}
        <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {cartItems.map((item) => (
            <div key={item.id} className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-white rounded-md border border-gray-100 p-1 shrink-0 shadow-sm">
                <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-gray-800 line-clamp-1 leading-tight uppercase tracking-tighter">{item.name}</p>
                <p className="text-[10px] text-gray-400 mt-1 font-bold">QTY: {item.qty}</p>
              </div>
              <div className="text-xs font-black text-gray-800">฿{(item.price * item.qty).toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* ส่วนคำนวณยอด */}
        <div className="space-y-3 pt-6 border-t border-gray-100">
          <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
            <span>Subtotal</span>
            <span className="text-gray-800 tracking-tighter">฿{subTotal.toLocaleString()}</span>
          </div>
          
          {promoDiscount > 0 && (
            <div className="flex justify-between text-xs font-bold text-emerald-600 uppercase">
              <span className="flex items-center gap-1"><Tag size={12}/> Promo Discount</span>
              <span>-฿{promoDiscount.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
            <span>Shipping</span>
            <span className={shippingFee === 0 ? "text-emerald-600" : "text-gray-800"}>
              {shippingFee === 0 ? (isB2B ? "รอประเมิน" : "FREE") : `฿${shippingFee.toLocaleString()}`}
            </span>
          </div>

          {walletUsed > 0 && (
            <div className="flex justify-between text-xs font-bold text-[#0870B8] uppercase italic">
              <span className="flex items-center gap-1"><Coins size={12}/> Wallet Applied</span>
              <span>-฿{walletUsed.toLocaleString()}</span>
            </div>
          )}

          <div className="pt-6 mt-4 border-t border-dashed border-gray-200">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Payable</span>
              <div className="text-right">
                <span className={`text-3xl font-black block leading-none tracking-tighter ${isB2B ? 'text-indigo-600 text-xl' : 'text-[#0870B8] text-glow-brand'}`}>
                  {isB2B ? 'WAITING REVIEW' : `฿${finalPayable.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ปุ่มกดยืนยัน */}
        <button 
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className={`w-full text-white font-black py-5 mt-8 rounded-md text-sm transition-all shadow-premium flex items-center justify-center gap-3 group uppercase tracking-widest disabled:opacity-30 disabled:grayscale ${isB2B ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#0870B8] hover:bg-[#054D80]'}`}
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (
            <>{isB2B ? 'Send B2B Request' : 'Confirm & Order'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
          )}
        </button>

        {/* ทริคส่งฟรี */}
        {!isB2B && shippingFee > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-md">
             <p className="text-[10px] text-orange-700 font-bold text-center flex items-center justify-center gap-1">
               <Zap size={12} className="text-orange-500" /> 
               ซื้อเพิ่ม ฿{(shippingConfig.freeAt - subTotal).toLocaleString()} เพื่อส่งฟรี!
             </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default CheckoutSummary;