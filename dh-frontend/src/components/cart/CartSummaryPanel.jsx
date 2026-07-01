import React from 'react';
import { ArrowRight, ShieldCheck, CheckCircle2, MessageCircle, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

  const CartSummaryPanel = ({ 
    cartData, 
    currentUser, 
    subTotal, 
    netTotal, 
    earnedPoints,
    isValidCart = true,
    onCheckout,
    promotionsElement,
    promoDiscount = 0
  }) => {
    const navigate = useNavigate();
  
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24 transition-all duration-300 hover:shadow-md">
        <h2 className="text-lg font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">สรุปคำสั่งซื้อ</h2>
        
        <div className="space-y-4 mb-6 relative">
          <div className="flex justify-between text-sm text-gray-600">
            <span>ยอดรวมสินค้า ({cartData.totalQty || 0} ชิ้น)</span>
            <span className="font-bold text-gray-800 font-tech text-base">฿{subTotal.toLocaleString()}</span>
          </div>
          
          {promotionsElement && (
            <div className="my-4 border-y border-dashed border-gray-100 py-4">
              {promotionsElement}
            </div>
          )}

          {promoDiscount > 0 && (
            <div className="flex justify-between items-center text-emerald-600 mt-3 mb-1">
              <span className="text-sm font-medium flex items-center gap-1.5">
                <span className="bg-emerald-100 text-emerald-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">🏷️</span>
                ส่วนลดโปรโมชัน
              </span>
              <span className="font-bold text-base font-tech">-฿{promoDiscount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="flex justify-between text-sm text-gray-600 mt-3">
            <span>ค่าจัดส่ง</span>
            <span className="font-bold text-gray-400">คำนวณถัดไป</span>
          </div>
        </div>
  
        <div className="border-t border-dashed border-gray-200 pt-5 mb-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-gray-800">ยอดสุทธิ</span>
            <div className="text-right flex flex-col items-end">
               {promoDiscount > 0 && (
                 <span className="text-xs text-gray-400 line-through font-tech mb-0.5">฿{subTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
               )}
               <span className="text-3xl font-black text-rose-600 font-tech tracking-tight">฿{netTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
          
          {promoDiscount > 0 && (
            <div className="w-full text-right mt-1 mb-2">
              <p className="text-[13px] font-bold text-gray-500 tracking-wide">
                คุณประหยัดเงินได้ <span className="text-base text-emerald-600 ml-0.5 font-black">฿{promoDiscount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
              </p>
            </div>
          )}

          {earnedPoints > 0 && (
            <div className="w-full text-right mt-3">
              <p className="text-xs text-indigo-700 font-bold bg-indigo-50/80 inline-block px-3 py-1.5 rounded-full shadow-sm border border-indigo-100">
                รับแต้มสะสม {earnedPoints.toLocaleString()} แต้ม
              </p>
            </div>
          )}
          
          <p className="text-[10px] text-gray-400 text-right mt-3">ราคานี้ยังไม่รวมค่าจัดส่งและส่วนลด (ถ้ามี)</p>
        </div>
  
        <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3.5 mb-6 flex items-start gap-2.5 shadow-sm">
          <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-emerald-800 leading-relaxed">
            <strong className="text-xs">รับประกันความปลอดภัย</strong><br/>
            คุณสามารถชำระเงิน ตัดยอด Wallet ขอราคาส่ง หรือขอใบกำกับภาษีได้ในขั้นตอนต่อไป
          </p>
        </div>
  
        {!isValidCart && cartData.totalQty > 0 ? (
          <div className="flex flex-col gap-3 animate-fade-in">
            <p className="text-[11px] text-center font-bold text-red-500 mb-1">
              มีสินค้าจำนวนจำกัด กรุณาติดต่อพนักงาน
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => window.open('https://line.me/R/ti/p/@your_line_id', '_blank')}
                className="w-full font-bold py-3.5 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 bg-[#00B900] hover:bg-[#009900] text-white shadow-sm hover:shadow-md active:scale-95"
              >
                <MessageCircle size={18} /> LINE
              </button>
              <button 
                onClick={() => window.open('https://m.me/your_page_name', '_blank')}
                className="w-full font-bold py-3.5 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 bg-[#0084FF] hover:bg-[#0070D6] text-white shadow-sm hover:shadow-md active:scale-95"
              >
                <MessageSquare size={18} /> Messenger
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => {
              if (isValidCart) {
                if (onCheckout) onCheckout();
                else navigate('/checkout');
              }
            }}
            disabled={cartData.totalQty === 0}
            className={`w-full font-bold py-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 group overflow-hidden relative ${
              cartData.totalQty === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg active:scale-[0.98]'
            }`}
          >
            <span className="relative z-10 flex items-center gap-2">
              ดำเนินการสั่งซื้อ <ArrowRight size={18} className={`${cartData.totalQty > 0 ? 'group-hover:translate-x-1.5' : ''} transition-transform`} />
            </span>
            {cartData.totalQty > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
            )}
          </button>
        )}
      </div>
    );
  };

export default CartSummaryPanel;
