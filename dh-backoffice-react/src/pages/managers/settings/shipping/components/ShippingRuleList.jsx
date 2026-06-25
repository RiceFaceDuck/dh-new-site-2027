import React from 'react';
import { ShieldCheck, AlertCircle, Trash2 } from 'lucide-react';

export default function ShippingRuleList({ rules, loading, toggleActive, deleteRule }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
       <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" /> เงื่อนไขที่ทำงานอยู่ (Active Rules)
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full">
            ทั้งหมด {rules.length} รายการ
          </span>
       </div>
       <div className="p-0 overflow-x-auto min-h-[300px]">
         {loading ? (
           <div className="p-16 flex flex-col items-center justify-center text-center">
             <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">กำลังโหลดข้อมูล...</p>
           </div>
         ) : rules.length === 0 ? (
           <div className="p-16 text-center flex flex-col items-center justify-center h-full">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-slate-300"/>
             </div>
             <p className="text-slate-500 text-sm font-bold">ยังไม่ได้ตั้งค่าการจัดส่ง</p>
             <p className="text-xs text-slate-400 mt-1">กรุณาเพิ่มเงื่อนไขใหม่จากฟอร์มด้านซ้าย</p>
           </div>
         ) : (
           <table className="w-full text-left">
             <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-wider">
               <tr>
                 <th className="px-5 py-4 border-b border-slate-100">บริษัท / ประเภท</th>
                 <th className="px-5 py-4 border-b border-slate-100 text-center">จำนวนชิ้น</th>
                 <th className="px-5 py-4 border-b border-slate-100 text-right">ค่าส่ง (฿)</th>
                 <th className="px-5 py-4 border-b border-slate-100 text-center">สถานะ</th>
                 <th className="px-5 py-4 border-b border-slate-100 text-center">ลบ</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 text-sm">
               {rules.map(rule => (
                 <tr key={rule.id} className={`group transition-colors ${!rule.isActive ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                   <td className="px-5 py-4">
                     <div className={`font-black text-base ${!rule.isActive ? 'text-slate-400' : 'text-slate-800'}`}>
                       {rule.company}
                     </div>
                     <div className="text-[10px] text-slate-500 font-bold bg-slate-100 inline-block px-2 py-0.5 rounded-md mt-1">
                       {rule.productType}
                     </div>
                   </td>
                   <td className="px-5 py-4 text-center">
                     <span className={`font-bold text-sm bg-slate-100 px-3 py-1 rounded-lg ${!rule.isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                       {rule.minQty} - {rule.maxQty} ชิ้น
                     </span>
                   </td>
                   <td className="px-5 py-4 text-right">
                     <span className={`font-black text-lg ${!rule.isActive ? 'text-slate-400' : 'text-emerald-600'}`}>
                       {rule.shippingFee}
                     </span>
                   </td>
                   <td className="px-5 py-4 text-center">
                     <button 
                        onClick={() => toggleActive(rule)}
                        className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all active:scale-95 ${
                          rule.isActive 
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                          : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                        }`}
                     >
                       {rule.isActive ? 'เปิดใช้' : 'ปิด'}
                     </button>
                   </td>
                   <td className="px-5 py-4 text-center">
                     <button 
                        onClick={() => deleteRule(rule)} 
                        className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors opacity-50 group-hover:opacity-100"
                        title="ลบเงื่อนไขนี้"
                     >
                       <Trash2 size={18}/>
                     </button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         )}
       </div>
    </div>
  );
}
