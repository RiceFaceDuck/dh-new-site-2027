import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Trash2, Truck, ShieldAlert, Layers } from 'lucide-react';

export default function ShippingRuleList({ rules, loading, toggleActive, deleteRule }) {
  const [activeTab, setActiveTab] = useState('all');

  const filteredRules = rules.filter(rule => {
    if (activeTab === 'shipping') return rule.ruleType !== 'insurance';
    if (activeTab === 'insurance') return rule.ruleType === 'insurance';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden transition-all hover:shadow-md">
       <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" /> เงื่อนไขทั้งหมดในระบบ
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full w-max">
            แสดง {filteredRules.length} จาก {rules.length} รายการ
          </span>
       </div>

       {/* --- Tabs กรองประเภทกฎ --- */}
       <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1">
         <button
           onClick={() => setActiveTab('all')}
           className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${
             activeTab === 'all'
               ? 'bg-white text-slate-800 shadow-xs border border-slate-200/60'
               : 'text-slate-500 hover:text-slate-800'
           }`}
         >
           ทั้งหมด ({rules.length})
         </button>
         <button
           onClick={() => setActiveTab('shipping')}
           className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 ${
             activeTab === 'shipping'
               ? 'bg-blue-50 text-blue-700 shadow-xs border border-blue-100'
               : 'text-slate-500 hover:text-slate-800'
           }`}
         >
           <Truck size={13} />
           เฉพาะค่าจัดส่ง ({rules.filter(r => r.ruleType !== 'insurance').length})
         </button>
         <button
           onClick={() => setActiveTab('insurance')}
           className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 ${
             activeTab === 'insurance'
               ? 'bg-amber-50 text-amber-700 shadow-xs border border-amber-100'
               : 'text-slate-500 hover:text-slate-800'
           }`}
         >
           <ShieldAlert size={13} />
           เฉพาะค่าประกัน ({rules.filter(r => r.ruleType === 'insurance').length})
         </button>
       </div>

       <div className="p-0 overflow-x-auto min-h-[300px]">
         {loading ? (
           <div className="p-16 flex flex-col items-center justify-center text-center">
             <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">กำลังโหลดข้อมูล...</p>
           </div>
         ) : filteredRules.length === 0 ? (
           <div className="p-16 text-center flex flex-col items-center justify-center h-full">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-slate-300"/>
             </div>
             <p className="text-slate-500 text-sm font-bold">ไม่พบเงื่อนไขที่ตรงตามตัวกรอง</p>
             <p className="text-xs text-slate-400 mt-1">กรุณาเพิ่มเงื่อนไขจากฟอร์มด้านซ้าย</p>
           </div>
         ) : (
           <table className="w-full text-left">
             <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-wider">
               <tr>
                 <th className="px-5 py-4 border-b border-slate-100">ประเภทกฎ / บริษัทจัดส่ง</th>
                 <th className="px-5 py-4 border-b border-slate-100">ขอบเขตเงื่อนไขสินค้า</th>
                 <th className="px-5 py-4 border-b border-slate-100 text-center">จำนวนชิ้น</th>
                 <th className="px-5 py-4 border-b border-slate-100 text-right">ยอดเงิน (฿)</th>
                 <th className="px-5 py-4 border-b border-slate-100 text-center">สถานะ</th>
                 <th className="px-5 py-4 border-b border-slate-100 text-center">ลบ</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 text-sm">
               {filteredRules.map(rule => {
                 const isInsurance = rule.ruleType === 'insurance';
                 const isCombo = rule.matchType === 'combo';
                 
                 return (
                   <tr key={rule.id} className={`group transition-colors ${!rule.isActive ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                     
                     {/* --- ประเภทกฎ / บริษัทขนส่ง --- */}
                     <td className="px-5 py-4">
                       <div className="flex items-center gap-2">
                         {isInsurance ? (
                           <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg" title="ประกันภัยขนส่ง">
                             <ShieldAlert size={15} />
                           </span>
                         ) : isCombo ? (
                           <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg" title="เงื่อนไขจัดส่งแบบผสม">
                             <Layers size={15} />
                           </span>
                         ) : (
                           <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg" title="ค่าจัดส่งสินค้า">
                             <Truck size={15} />
                           </span>
                         )}
                         <div>
                           <div className={`font-black text-sm leading-tight ${!rule.isActive ? 'text-slate-400' : 'text-slate-800'}`}>
                             {isInsurance ? 'ประกันภัยจัดส่ง' : rule.company}
                           </div>
                           <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm inline-block mt-1 ${
                             isInsurance 
                               ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20' 
                               : isCombo 
                                 ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20' 
                                 : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20'
                           }`}>
                             {isInsurance ? 'Insurance' : (isCombo ? 'Combo Shipping' : 'Shipping Rule')}
                           </span>
                         </div>
                       </div>
                     </td>

                     {/* --- เงื่อนไขสินค้า --- */}
                     <td className="px-5 py-4">
                       {isCombo ? (
                         <div className="flex flex-col gap-1.5">
                           {(rule.conditions || []).map((cond, cIdx) => (
                             <div key={cIdx} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border w-max font-bold ${
                               !rule.isActive 
                                 ? 'bg-slate-50 text-slate-400 border-slate-200' 
                                 : cond.type === 'sku'
                                   ? 'bg-purple-50 text-purple-700 border-purple-100'
                                   : 'bg-slate-100 text-slate-700 border-slate-200'
                             }`}>
                               <span className="font-black text-[10px] text-slate-400">
                                 {cond.type === 'category' ? '📁 หมวด' : '🏷️ SKU'}
                               </span>
                               <span>{cond.value}</span>
                               <span className="text-[10px] font-medium text-slate-500">
                                 ({cond.minQty} - {cond.maxQty} ชิ้น)
                               </span>
                             </div>
                           ))}
                         </div>
                       ) : rule.matchType === 'sku' ? (
                         <div>
                           <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg border ${
                             !rule.isActive 
                               ? 'bg-slate-50 text-slate-400 border-slate-200' 
                               : 'bg-purple-50 text-purple-700 border-purple-100'
                           }`}>
                             SKU: {rule.sku}
                           </span>
                         </div>
                       ) : isInsurance && rule.matchType === 'all' ? (
                         <span className="text-xs font-bold text-slate-500">ทุกรายการสินค้า</span>
                       ) : (
                         <div>
                           <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                             !rule.isActive 
                               ? 'bg-slate-50 text-slate-400 border-slate-200' 
                               : 'bg-slate-100 text-slate-700 border-slate-200'
                           }`}>
                             หมวดหมู่: {rule.productType}
                           </span>
                         </div>
                       )}
                     </td>

                     {/* --- จำนวนชิ้น --- */}
                     <td className="px-5 py-4 text-center">
                       {isCombo ? (
                         <span className="text-xs font-medium text-slate-400 italic">
                           อิงตามเงื่อนไขย่อย
                         </span>
                       ) : (
                         <span className={`font-bold text-xs bg-slate-100 px-3 py-1 rounded-lg ${!rule.isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                           {rule.minQty} - {rule.maxQty} ชิ้น
                         </span>
                       )}
                     </td>

                     {/* --- ยอดเงิน (ค่าส่ง / ค่าประกัน) --- */}
                     <td className="px-5 py-4 text-right">
                       <span className={`font-black text-base ${
                         !rule.isActive 
                           ? 'text-slate-400' 
                           : isInsurance 
                             ? 'text-amber-600' 
                             : 'text-emerald-600'
                       }`}>
                         {rule.shippingFee} ฿
                       </span>
                     </td>

                     {/* --- ปุ่มเปิด/ปิด --- */}
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

                     {/* --- ปุ่มลบ --- */}
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
                 );
               })}
             </tbody>
           </table>
         )}
       </div>
    </div>
  );
}
