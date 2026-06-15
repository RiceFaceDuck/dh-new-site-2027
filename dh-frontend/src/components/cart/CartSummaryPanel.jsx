import React from 'react';
import { ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CartSummaryPanel = ({ 
  cartData, 
  currentUser, 
  creditConfig, 
  userPoints, 
  usePoints, 
  inputPoints, 
  setInputPoints, 
  handleApplyPoints, 
  subTotal, 
  discountFromPoints, 
  netTotal, 
  earnedPoints 
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24 transition-all duration-300 hover:shadow-md">
      <h2 className="text-lg font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">สรุปคำสั่งซื้อ</h2>
      
      {/* โซนการใช้แต้ม */}
      {currentUser && creditConfig && userPoints > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden group transition-all duration-300 hover:border-indigo-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity"></div>
          <div className="flex justify-between items-center mb-3 relative z-10">
            <span className="text-sm font-bold text-indigo-800 flex items-center gap-1">
              ✨ ใช้แต้มเป็นส่วนลด
            </span>
            <span className="text-xs text-indigo-600 bg-indigo-100/50 px-2 py-0.5 rounded-full font-medium">มี {userPoints.toLocaleString()} แต้ม</span>
          </div>
          <div className="flex gap-2 relative z-10">
            <input 
              type="number" 
              value={inputPoints}
              onChange={(e) => setInputPoints(e.target.value)}
              placeholder="ระบุจำนวนแต้ม"
              className="flex-1 px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
            />
            <button 
              onClick={handleApplyPoints}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm hover:shadow"
            >
              ตกลง
            </button>
          </div>
          {usePoints > 0 && (
            <div className="mt-3 text-xs text-indigo-700 bg-indigo-50 p-2 rounded-lg flex items-center gap-2 font-medium animate-fade-in border border-indigo-100/50">
               <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-500" /> 
               ประหยัดไป <strong>฿{discountFromPoints.toLocaleString()}</strong>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4 mb-6 relative">
        <div className="flex justify-between text-sm text-gray-600">
          <span>ยอดรวมสินค้า ({cartData.totalQty || 0} ชิ้น)</span>
          <span className="font-bold text-gray-800 font-tech text-base">฿{subTotal.toLocaleString()}</span>
        </div>
        {usePoints > 0 && (
          <div className="flex justify-between text-sm text-emerald-600 animate-fade-in">
            <span>ส่วนลดจากแต้ม ({usePoints.toLocaleString()} แต้ม)</span>
            <span className="font-bold font-tech text-base">-฿{discountFromPoints.toLocaleString()}</span>
          </div>
        )}
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
