import React, { useState } from 'react';
import { PackageSearch, X, ChevronDown, ChevronUp, Receipt, ZoomIn } from 'lucide-react';

export default function PaymentCard({ todo }) {
  // State ควบคุมการแสดงผล Modal สลิป และ รายละเอียดบิล
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const payload = todo.payload || {};
  const itemsList = payload.itemsSnapshot || payload.items || [];
  const totalAmount = Number(payload.amount || 0);

  // คำนวณยอดรวมเบื้องต้นจากรายการสินค้า (ถ้าระบบส่งราคามาให้ใน Snapshot)
  const subTotal = itemsList.reduce((sum, it) => sum + ((Number(it.price) || 0) * (Number(it.qty) || 1)), 0);
  const difference = totalAmount - subTotal; // ส่วนต่างอาจเป็นค่าจัดส่ง, ส่วนลด หรือการใช้ Wallet

  return (
    <div className="mt-4 ml-0 xl:ml-12 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl shadow-sm animate-in fade-in overflow-hidden">
      
      <div className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* รูปภาพสลิป (กดเพื่อดูแบบ Popup) */}
        {payload.slipUrl ? (
          <div 
            onClick={() => setShowSlipModal(true)} 
            className="shrink-0 group relative cursor-pointer"
          >
            <img 
              src={payload.slipUrl} 
              alt="Slip" 
              className="w-20 h-24 object-cover rounded-lg border border-emerald-200 shadow-sm bg-white p-1 transition-transform group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg transition-opacity">
              <ZoomIn size={16} className="text-white mb-1" />
              <span className="text-[9px] text-white font-bold">ขยายดูสลิป</span>
            </div>
          </div>
        ) : (
          <div className="w-20 h-24 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">ไม่มีสลิป</span>
          </div>
        )}

        {/* ข้อมูลยอดเงิน */}
        <div className="flex-1">
          <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-1">
            ยอดโอนที่ต้องตรวจสอบ
          </p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-500 tracking-tight">
            ฿{totalAmount.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1.5 leading-relaxed">
            เมื่อกดยืนยัน ระบบจะทำการ <b className="bg-emerald-200 dark:bg-emerald-800 px-1.5 py-0.5 rounded-md text-emerald-900 dark:text-emerald-100 shadow-sm border border-emerald-300 dark:border-emerald-600">ตัดสต๊อก</b> และออกบิลเสร็จสมบูรณ์ทันที
          </p>
        </div>
      </div>

      {/* รายการสินค้าแบบย่อ (ดูคร่าวๆ) - แสดงเมื่อยังไม่กดขยาย */}
      {itemsList.length > 0 && !showDetails && (
        <div className="px-4 pb-4">
          <div className="pt-3 border-t border-emerald-100/50 dark:border-emerald-800/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <PackageSearch size={14} /> รายการสั่งซื้อ (ตรวจสอบความถูกต้อง):
              </p>
              <button 
                onClick={() => setShowDetails(true)}
                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-100/50 hover:bg-emerald-200/50 px-2 py-1 rounded transition-colors outline-none"
              >
                ขยายดูรายละเอียดบิล <ChevronDown size={12} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {itemsList.map((it, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-[10px] px-2.5 py-1.5 rounded-md shadow-sm">
                  <span className="truncate max-w-[200px] font-medium">{it.name || it.title}</span>
                  <span className="font-black bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded text-emerald-800 dark:text-emerald-300">
                    x{it.qty}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* รายละเอียดแบบขยาย (Expanded Details) - แสดงเมื่อกดปุ่มขยาย */}
      {showDetails && (
        <div className="bg-white dark:bg-slate-900/50 border-t border-emerald-100 dark:border-emerald-900/30 p-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-widest">
              <Receipt size={14} className="text-emerald-500" /> รายละเอียดการคิดเงิน
            </h4>
            <button 
              onClick={() => setShowDetails(false)}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded transition-colors outline-none"
            >
              ย่อเก็บ <ChevronUp size={12} />
            </button>
          </div>

          {/* รายละเอียดสินค้าแต่ละชิ้นแบบเต็ม */}
          <div className="space-y-2 mb-4">
            {itemsList.map((it, i) => {
              const price = Number(it.price) || 0;
              const qty = Number(it.qty) || 1;
              return (
                <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {it.image && <img src={it.image} alt={it.name} className="w-8 h-8 rounded border border-slate-200 object-contain bg-white shrink-0" />}
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{it.name || it.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">฿{price.toLocaleString()} x {qty} ชิ้น</p>
                    </div>
                  </div>
                  <div className="font-black text-slate-700 dark:text-slate-300 shrink-0">
                    ฿{(price * qty).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* สรุปยอดรวม (Summary) */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 space-y-1.5 border border-emerald-100 dark:border-emerald-800">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>ยอดรวมสินค้า (ตั้งต้น)</span>
              <span className="font-bold">฿{subTotal.toLocaleString()}</span>
            </div>
            {difference !== 0 && (
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>ส่วนลดโปรโมชัน / ค่าจัดส่ง / เครดิต Wallet</span>
                <span className="font-bold text-emerald-600">{difference > 0 ? '+' : ''}฿{difference.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-2 border-t border-emerald-200 dark:border-emerald-800/50 mt-1">
              <span className="text-sm font-bold text-emerald-800 dark:text-emerald-400">ยอดชำระสุทธิ (ตรงกับสลิป)</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">฿{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal ดูรูปภาพสลิป (Popup กลางจอ) */}
      {showSlipModal && payload.slipUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Receipt size={18} className="text-emerald-500" /> หลักฐานการโอนเงิน
              </h3>
              <button 
                onClick={() => setShowSlipModal(false)}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors outline-none"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex justify-center bg-slate-50 dark:bg-slate-900/50 rounded-b-xl custom-scrollbar">
              <img 
                src={payload.slipUrl} 
                alt="Slip Full View" 
                className="max-w-full h-auto object-contain rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 bg-white"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}