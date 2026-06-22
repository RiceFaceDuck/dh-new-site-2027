import React from 'react';
import { ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CartSummaryPanel = ({ 
  cartData, 
  currentUser, 
  subTotal, 
  netTotal, 
  earnedPoints 
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
        <div className="flex justify-between text-sm text-gray-600">
          <span>ค่าจัดส่ง</span>
          <span className="font-bold text-gray-400">คำนวณถัดไป</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-200 pt-5 mb-6">
        <div className="flex justify-between items-end">
          <span className="text-sm font-bold text-gray-800">ยอดสุทธิ</span>
          <span className="text-3xl font-black text-rose-600 font-tech tracking-tight">฿{netTotal.toLocaleString()}</span>
        </div>
        {earnedPoints > 0 && (
          <p className="text-[11px] text-indigo-600 text-right mt-2 font-medium animate-fade-in bg-indigo-50 inline-block float-right px-2 py-1 rounded-md">
            + รับแต้มสะสม {earnedPoints.toLocaleString()} แต้ม
          </p>
        )}
        <div className="clear-both"></div>
        <p className="text-[10px] text-gray-400 text-right mt-2">ราคานี้ยังไม่รวมค่าจัดส่งและส่วนลด (ถ้ามี)</p>
      </div>

      <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3.5 mb-6 flex items-start gap-2.5 shadow-sm">
        <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-[10px] text-emerald-800 leading-relaxed">
          <strong className="text-xs">รับประกันความปลอดภัย</strong><br/>
          คุณสามารถชำระเงิน ตัดยอด Wallet ขอราคาส่ง หรือขอใบกำกับภาษีได้ในขั้นตอนต่อไป
        </p>
      </div>

      <button 
        onClick={() => navigate('/checkout')}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl text-sm transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 group overflow-hidden relative"
      >
        <span className="relative z-10 flex items-center gap-2">
          ดำเนินการสั่งซื้อ <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
      </button>
    </div>
  );
};

export default CartSummaryPanel;
