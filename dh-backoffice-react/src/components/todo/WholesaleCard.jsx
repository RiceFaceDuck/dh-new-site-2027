import React from 'react';
import { Calculator, Loader2, Tag, CheckCircle2 } from 'lucide-react';

export default function WholesaleCard({ todo, fetchedData, inputs, setWholesaleInputs }) {
  const isFetching = fetchedData === 'loading';
  const rawItems = todo.payload.itemsSnapshot || todo.payload.items || [];
  const itemsList = fetchedData?.items || rawItems;

  if (isFetching) {
      return <div className="p-8 flex items-center justify-center gap-2 text-indigo-500 font-bold text-sm"><Loader2 className="animate-spin" size={16} /> กำลังวิเคราะห์ราคาส่ง...</div>;
  }
  if (itemsList.length === 0) {
      return <div className="p-8 text-rose-500 text-sm font-bold text-center">ไม่พบรายการสินค้าในระบบ</div>;
  }

  let totalRetail = 0;
  let totalWholesale = 0;
  let totalCost = 0;
  
  itemsList.forEach((item, idx) => {
    const qty = Number(item.qty) || 0;
    const retailPrice = Number(item.retailPrice) || Number(item.price) || 0;
    const costPrice = Number(item.dbCost) || 0;
    
    totalRetail += retailPrice * qty;
    totalCost += costPrice * qty;
    
    const defaultWsPrice = Number(item.computedWsPrice) || retailPrice;
    const wsPrice = inputs.itemPrices?.[idx] !== undefined && inputs.itemPrices[idx] !== '' 
                  ? Number(inputs.itemPrices[idx]) : defaultWsPrice;
                  
    totalWholesale += wsPrice * qty;
  });

  const originalShipping = Number(fetchedData?.shippingFee ?? todo.payload.shippingFee ?? 0);
  const shippingFee = inputs.shipping !== undefined && inputs.shipping !== '' 
                    ? Number(inputs.shipping) : originalShipping; 
                    
  // ✨ อ้างอิงจาก input แบบ Manual ถ้าไม่มีใช้ค่าดั้งเดิมจากบิล
  const currentPromo = inputs.manualPromo !== undefined ? Number(inputs.manualPromo) : Number(fetchedData?.promoDiscount || 0);

  const grandTotalWholesale = Math.max(0, totalWholesale - currentPromo + shippingFee);
  const grandTotalRetail = Math.max(0, totalRetail - currentPromo + originalShipping);
  
  const discountAmount = Math.max(0, totalRetail - totalWholesale);
  const grossProfit = totalWholesale - totalCost;

  return (
    <div className="mt-5 ml-0 xl:ml-12 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
        <Calculator size={18} className="text-indigo-500" />
        {/* ✨ เปลี่ยนหัวข้อตารางให้ตรงความต้องการ */}
        <span className="text-sm font-black text-slate-800">ขอราคาส่ง จากลูกค้าหน้าเว็บ (Quotation Dashboard)</span>
      </div>

      <div className="bg-white">
        <div className="overflow-x-auto p-3">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-100 text-xs">
                <th className="p-3 font-bold pl-4 rounded-tl-lg">สินค้า</th>
                <th className="p-3 text-center font-bold">จำนวน</th>
                <th className="p-3 text-right font-bold text-slate-400 hidden sm:table-cell">ปลีกเดิม</th>
                <th className="p-3 text-center font-bold text-indigo-600 bg-indigo-50/30">ราคาส่ง/ชิ้น (อนุมัติ)</th>
                <th className="p-3 text-right font-bold text-slate-700 pr-4 rounded-tr-lg">รวมสุทธิ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {itemsList.map((item, idx) => {
                const retailPrice = Number(item.retailPrice) || Number(item.price) || 0;
                const defaultWsPrice = Number(item.computedWsPrice) || retailPrice;
                const wsPrice = inputs.itemPrices?.[idx] !== undefined && inputs.itemPrices[idx] !== '' 
                              ? Number(inputs.itemPrices[idx]) : defaultWsPrice;
                const qty = Number(item.qty) || 0;
                const itemTotal = wsPrice * qty;

                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg p-1 shrink-0 hidden sm:block">
                          <img src={item.image || item.imageUrl || 'https://via.placeholder.com/40'} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                        <p className="font-bold text-slate-700 line-clamp-2 text-xs min-w-[150px]">{item.name || item.title}</p>
                      </div>
                    </td>
                    <td className="p-3 text-center font-black text-indigo-500">{qty}</td>
                    <td className="p-3 text-right text-slate-400 font-medium line-through text-[11px] hidden sm:table-cell">
                      ฿{retailPrice.toLocaleString()}
                    </td>
                    <td className="p-3 text-center bg-indigo-50/10">
                      <div className="flex justify-center items-center gap-1">
                        <span className="text-slate-400 text-xs">฿</span>
                        <input
                          type="number"
                          value={inputs.itemPrices?.[idx] !== undefined ? inputs.itemPrices[idx] : defaultWsPrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWholesaleInputs(prev => ({
                              ...prev, [todo.id]: { ...prev[todo.id], itemPrices: { ...(prev[todo.id]?.itemPrices || {}), [idx]: val } }
                            }));
                          }}
                          className="w-24 bg-white border border-indigo-200 rounded-lg px-2 py-1.5 text-sm font-black text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-400 text-center shadow-sm"
                        />
                      </div>
                    </td>
                    <td className="p-3 text-right font-black text-slate-700 pr-4">
                      ฿{itemTotal.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ✨ ปรับ Layout ยุบ 3 คอลัมน์ให้เหลือ 2 คอลัมน์ตามคำสั่ง */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-t border-slate-200 bg-slate-50 rounded-b-2xl overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* กล่องซ้าย: ก่อนลดราคา + ส่วนของแถม */}
          <div className="p-5 flex flex-col justify-between">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
               <Tag size={12}/> ยอดสั่งปกติ & โปรโมชันเสริม
             </p>
             <div className="space-y-3.5">
               <div className="flex justify-between text-xs">
                 <span className="text-slate-500 font-medium">ยอดรวมสินค้าเดิม</span>
                 <span className="font-bold text-slate-600">฿{totalRetail.toLocaleString()}</span>
               </div>
               
               {/* ส่วนจัดการ โปรโมชัน */}
               <div className="flex justify-between text-xs items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                 <span className="text-slate-600 font-bold">หักส่วนลด / โปรโมชัน</span>
                 <div className="flex items-center gap-1">
                   <span className="text-slate-400 font-bold">- ฿</span>
                   <input
                     type="number"
                     value={inputs.manualPromo !== undefined ? inputs.manualPromo : currentPromo}
                     onChange={(e) => setWholesaleInputs(prev => ({ ...prev, [todo.id]: { ...prev[todo.id], manualPromo: e.target.value } }))}
                     className="w-20 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 text-xs font-black text-emerald-700 outline-none focus:ring-1 focus:ring-emerald-400 text-right"
                   />
                 </div>
               </div>

               {/* ส่วนจัดการ ของแถม */}
               <div className="flex flex-col text-xs gap-1.5">
                 <span className="text-slate-600 font-bold">ของแถมเสริม (ระบุให้ลูกค้าเห็น)</span>
                 <input
                     type="text"
                     placeholder="เช่น สายชาร์จ 1 เส้น, เมาส์ไร้สาย"
                     value={inputs.freebies !== undefined ? inputs.freebies : (fetchedData?.freebies || '')}
                     onChange={(e) => setWholesaleInputs(prev => ({ ...prev, [todo.id]: { ...prev[todo.id], freebies: e.target.value } }))}
                     className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 shadow-sm"
                 />
               </div>

               <div className="flex justify-between text-xs pt-1">
                 <span className="text-slate-500 font-medium">ค่าจัดส่งเดิม</span>
                 <span className="font-bold text-slate-600">฿{originalShipping.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-end pt-2 border-t border-slate-200/50 mt-2">
                 <span className="text-sm font-bold text-slate-700">ยอดรวมราคาปกติ</span>
                 <span className="text-lg font-black text-slate-400 line-through tracking-tight">฿{grandTotalRetail.toLocaleString()}</span>
               </div>
             </div>
          </div>

          {/* กล่องขวา: อนุมัติราคาส่ง & สรุปกำไร Admin */}
          <div className="flex flex-col bg-indigo-50/50 h-full">
             <div className="p-5 flex flex-col justify-between flex-1">
               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                 <CheckCircle2 size={12}/> ราคาส่งสุทธิ & กำไร (Admin)
               </p>
               <div className="space-y-3">
                 <div className="flex justify-between text-xs">
                   <span className="text-indigo-600 font-bold">ยอดสินค้าราคาส่ง</span>
                   <span className="font-bold text-indigo-700">฿{totalWholesale.toLocaleString()}</span>
                 </div>
                 {currentPromo > 0 && (
                   <div className="flex justify-between text-xs text-emerald-600 font-medium">
                     <span>ส่วนลดโปรโมชัน</span>
                     <span className="font-bold">-฿{currentPromo.toLocaleString()}</span>
                   </div>
                 )}
                 <div className="flex justify-between text-xs items-center">
                   <span className="text-slate-600 font-medium flex flex-col">
                     ค่าจัดส่ง 
                     <span className="text-[9px] text-slate-400">(ระบบประเมินออโต้ / แก้ได้)</span>
                   </span>
                   <div className="flex items-center gap-1">
                     <span className="text-slate-400">฿</span>
                     <input
                       type="number"
                       value={inputs.shipping !== undefined ? inputs.shipping : originalShipping}
                       onChange={(e) => setWholesaleInputs(prev => ({ ...prev, [todo.id]: { ...prev[todo.id], shipping: e.target.value } }))}
                       className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 text-right shadow-sm"
                     />
                   </div>
                 </div>
                 <div className="flex justify-between items-end pt-2 border-t border-indigo-100 mt-2 mb-4">
                   <div className="flex flex-col">
                     <span className="text-sm font-bold text-slate-800">ยอดชำระสุทธิ</span>
                     {discountAmount > 0 && <span className="text-[10px] text-emerald-600 font-bold">ประหยัดให้ลูกค้า ฿{discountAmount.toLocaleString()}</span>}
                   </div>
                   <span className="text-2xl font-black text-indigo-700 tracking-tight">฿{grandTotalWholesale.toLocaleString()}</span>
                 </div>
                 
                 {/* ส่วนกล่อง Admin Only ที่รวมอยู่ด้านล่างเพื่อให้สอดคล้อง */}
                 <div className="bg-slate-800 text-white p-4 rounded-xl mt-2 shadow-inner">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-400 font-medium">ต้นทุนสินค้ารวม</span>
                      <span className="font-bold text-rose-400">฿{totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-700">
                      <span className="font-bold text-xs text-emerald-400">กำไรขั้นต้นสุทธิ (Admin)</span>
                      <span className={`text-sm font-black ${grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {grossProfit >= 0 ? '+' : ''}฿{grossProfit.toLocaleString()}
                      </span>
                    </div>
                 </div>

               </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}