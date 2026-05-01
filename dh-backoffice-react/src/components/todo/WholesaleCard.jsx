import React, { useState } from 'react';
import { todoService } from '../../firebase/todoService'; // 🔧 แก้ไขการนำเข้าให้ถูกต้อง
import { auth } from '../../firebase/config';
import { Calculator, CheckCircle2, AlertCircle, Loader2, Tag, User } from 'lucide-react';

export default function WholesaleCard({ task, onComplete }) {
  // ดึงราคาเริ่มต้นจาก Task (คำนวณจากราคาปลีกเดิม)
  const initialPrice = task.totalAmount || task.initialTotalAmount || 0;
  
  const [finalPrice, setFinalPrice] = useState(initialPrice);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // UX Gimmick: คำนวณส่วนลดแบบ Real-time ให้ผู้จัดการเห็นทันที
  const discount = initialPrice - Number(finalPrice);
  const discountPercent = initialPrice > 0 ? ((discount / initialPrice) * 100).toFixed(1) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalPrice || finalPrice < 0) {
        setError('กรุณากรอกราคาที่มากกว่าหรือเท่ากับ 0');
        return;
    }

    setLoading(true);
    setError('');
    try {
        // เตรียมข้อมูล Resolution ตามที่ todoService.js (resolveTodo) ต้องการ
        const resolutionData = {
            approvedPrice: Number(finalPrice),
            approvedShipping: task.payload?.shippingFee || 0, // ดึงค่าส่งเดิมมาใช้
            manualPromo: task.payload?.promoDiscount || 0,
            freebies: task.payload?.freebies || ''
        };

        // 🔧 เรียกผ่าน todoService.resolveTodo
        await todoService.resolveTodo(task, resolutionData, auth.currentUser);
        
        if (onComplete) onComplete(task.id);
    } catch (err) {
        console.error("Submit Wholesale Error:", err);
        setError(err.message || 'เกิดข้อผิดพลาด ไม่สามารถบันทึกราคาได้');
        setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden relative group animate-in fade-in slide-in-from-bottom-2 mb-4">
       {/* แถบสถานะสีส้ม (Wholesale Theme) */}
       <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-amber-500"></div>
       
       <div className="p-5 pl-6">
          <div className="flex justify-between items-start mb-4">
             <div>
                <div className="flex items-center gap-2 mb-2">
                   <span className="text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-700 px-2 py-0.5 rounded border border-orange-200">
                     Wholesale Request
                   </span>
                   <span className="text-xs font-mono text-gray-400">Ref: #{task.orderId?.substring(0,8).toUpperCase() || task.id?.substring(0,8)}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                   <Tag className="w-4 h-4 text-orange-500" />
                   ประเมินราคาส่งให้ลูกค้า
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                   <User className="w-3.5 h-3.5 text-gray-400" /> 
                   <span className="font-medium text-gray-700">{task.customerName || 'พาร์ทเนอร์/ลูกค้า'}</span>
                </p>
             </div>
             
             <div className="text-right bg-gray-50 p-2 rounded-lg border border-gray-100 min-w-[120px]">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">ราคาปลีกเดิม</p>
                <p className="text-lg font-bold text-gray-400 line-through">฿{initialPrice.toLocaleString()}</p>
             </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 shadow-inner">
             <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-1 w-full">
                   <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                     เคาะราคาพิเศษ (Final Price)
                   </label>
                   <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <span className="text-gray-400 font-bold">฿</span>
                     </div>
                     <input 
                       type="number" 
                       value={finalPrice}
                       onChange={(e) => setFinalPrice(e.target.value)}
                       className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-black text-xl text-orange-600 outline-none transition-all shadow-sm"
                       required
                       min="0"
                     />
                   </div>
                </div>
                
                <button 
                   type="submit" 
                   disabled={loading || !finalPrice}
                   className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                   {loading ? 'กำลังส่งงาน...' : 'อนุมัติ & ส่งบิล'}
                </button>
             </div>

             {/* UI Gimmick: คำนวณความต่างราคาให้ Manager ตัดสินใจง่ายขึ้น */}
             <div className="mt-3 flex flex-wrap gap-2">
               {discount > 0 ? (
                 <div className="flex items-center gap-1.5 text-[11px] bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold border border-green-200">
                    <Calculator className="w-3 h-3" /> ลดไป: ฿{discount.toLocaleString()} ({discountPercent}%)
                 </div>
               ) : discount < 0 ? (
                 <div className="flex items-center gap-1.5 text-[11px] bg-red-100 text-red-700 px-2 py-1 rounded-md font-bold border border-red-200">
                    <AlertCircle className="w-3 h-3" /> ราคาสูงกว่าปกติ ฿{Math.abs(discount).toLocaleString()}
                 </div>
               ) : (
                 <div className="text-[11px] text-gray-400 font-bold px-2 py-1 uppercase tracking-tight">ไม่มีส่วนลดเพิ่มเติม</div>
               )}
             </div>
          </form>
       </div>
    </div>
  );
}