import React, { useState, useMemo } from 'react';
import { todoService } from '../../firebase/todoService';
import { ChevronDown, ChevronUp, AlertCircle, Check, X } from 'lucide-react';

const WholesaleCard = ({ task, currentUser, fetchedData = {}, onReject }) => {
  // 1. UI States
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 2. Data States
  const checkoutState = task?.payload?.checkoutSnapshot || {};
  const cartItems = task?.payload?.items || [];
  const totals = task?.payload?.originalTotals || {};
  const orderId = task?.orderId || task?.payload?.orderId || 'ไม่ระบุ';
  const customerName = task?.customerName || task?.payload?.customerName || 'ลูกค้าไม่ระบุชื่อ';

  // 3. Local Form States
  const [editedPrices, setEditedPrices] = useState({});
  const [extraManualDiscount, setExtraManualDiscount] = useState(0);

  // 4. สกัดข้อมูลเดิมของออเดอร์ (ปลอดภัยจาก Undefined)
  const shippingCost = checkoutState.shippingCost || totals.shippingFee || 0;
  const appliedPromotions = checkoutState.appliedPromotions || [];
  const qualifiedFreebies = checkoutState.qualifiedFreebies || [];
  const webExtraDiscount = checkoutState.discountAmount || 0;
  const usedPoints = checkoutState.usePoints || 0;
  const usedWallet = checkoutState.useWallet || 0;

  const totalPromoDiscount = appliedPromotions.reduce((sum, promo) => sum + (promo.discountValue || 0), 0);
  const totalWebDiscount = totalPromoDiscount + webExtraDiscount;
  const totalCreditDiscount = usedPoints + usedWallet;

  // 5. 🧮 Live Calculator: คำนวณแบบ Real-time โดยไม่ทำให้จอกระตุก
  const calculations = useMemo(() => {
    let retailSubtotal = 0;
    let wholesaleSubtotal = 0;

    cartItems.forEach((item, idx) => {
      const rPrice = item.price || 0;
      const qty = item.quantity || 1;
      retailSubtotal += rPrice * qty;

      // ลำดับความสำคัญของราคาส่ง: 1. พนักงานกรอกมือ -> 2. ดึงจาก DB (fetchedData) -> 3. ติดมากับตะกร้า -> 4. ราคาปลีก
      let finalWholesalePrice = rPrice;

      if (editedPrices[idx] !== undefined && editedPrices[idx] !== '') {
        finalWholesalePrice = Number(editedPrices[idx]);
      } else if (fetchedData && fetchedData[item.productId] !== undefined) {
        finalWholesalePrice = fetchedData[item.productId];
      } else if (item.wholesalePrice && item.wholesalePrice < rPrice) {
        finalWholesalePrice = item.wholesalePrice;
      } else {
        // Fallback: ถ้าระบบไม่มีราคาส่งเลย ให้ไกด์ไลน์ลด 5%
        finalWholesalePrice = Math.floor(rPrice * 0.95);
      }

      wholesaleSubtotal += Math.max(0, finalWholesalePrice) * qty;
    });

    const extra = Number(extraManualDiscount) || 0;
    const itemLevelDiscount = Math.max(0, retailSubtotal - wholesaleSubtotal);
    
    // ยอดรวมปลีกเดิม
    const originalNetTotal = Math.max(0, (retailSubtotal - totalWebDiscount) + shippingCost - totalCreditDiscount);
    // ยอดอนุมัติใหม่
    const newNetTotal = Math.max(0, (wholesaleSubtotal - totalWebDiscount - extra) + shippingCost - totalCreditDiscount);

    return {
      retailSubtotal,
      wholesaleSubtotal,
      itemLevelDiscount,
      originalNetTotal,
      newNetTotal,
      extra
    };
  }, [cartItems, fetchedData, editedPrices, extraManualDiscount, totalWebDiscount, shippingCost, totalCreditDiscount]);

  // 6. Action Handlers
  const handlePriceChange = (idx, value) => {
    setEditedPrices(prev => ({ ...prev, [idx]: Math.max(0, Number(value)) }));
  };

  const handleApprove = async () => {
    if (!window.confirm(`ยืนยันการอนุมัติราคาส่ง ยอดเรียกเก็บใหม่: ฿${calculations.newNetTotal.toLocaleString()} ใช่หรือไม่?`)) return;
    
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const totalWholesaleDiscount = calculations.itemLevelDiscount + calculations.extra;

      // จัดโครงสร้างให้ตรงกับ Backend เดิมเป๊ะๆ เพื่อไม่ให้ข้อมูลออเดอร์หน้าเว็บเสียหาย
      const newTotals = {
        ...totals,
        subtotal: calculations.retailSubtotal, 
        discount: totalWebDiscount + totalWholesaleDiscount, 
        shipping: shippingCost,
        netTotal: calculations.newNetTotal,
        wholesaleDetails: {
          itemLevelDiscount: calculations.itemLevelDiscount,
          manualExtraDiscount: calculations.extra,
          approvedPrices: editedPrices 
        }
      };

      await todoService.approveWholesaleRequest(task.id, orderId, newTotals, currentUser);
    } catch (error) {
      console.error("Approve Error:", error);
      setErrorMsg(error.message || 'เกิดข้อผิดพลาดในการอนุมัติ กรุณาลองใหม่');
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4 transition-all duration-300 hover:shadow-md">
      
      {/* 🔴 ส่วนหัว: ย่อ/ขยาย (Accordion Header) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`px-5 py-4 cursor-pointer select-none flex items-center justify-between gap-4 transition-colors ${isExpanded ? 'bg-gradient-to-r from-indigo-50/80 to-white border-b border-indigo-100' : 'hover:bg-gray-50'}`}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded uppercase tracking-wider shadow-sm transition-colors ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-white'}`}>
              Wholesale Request
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-bold truncate ${isExpanded ? 'text-indigo-900' : 'text-gray-900'}`}>ออเดอร์ #{orderId.slice(-8).toUpperCase()}</h3>
              <span className="text-sm font-medium text-gray-500 truncate hidden sm:inline-block">— {customerName}</span>
            </div>
            {!isExpanded && (
              <p className="text-sm text-indigo-600 truncate mt-1 flex items-center gap-1.5 font-medium bg-indigo-50/50 px-2 py-0.5 rounded-md inline-flex">
                <span>💬</span> 
                {task.payload?.reason || 'ขออนุมัติราคาส่งสำหรับ Dealer'}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">เวลาส่งคำขอ</p>
            <p className="text-xs font-semibold text-gray-600">
               {task.requestedAt?.toDate ? task.requestedAt.toDate().toLocaleString('th-TH') : 'N/A'}
            </p>
          </div>
          <div className={`p-1.5 rounded-full transition-transform duration-300 ${isExpanded ? 'bg-indigo-100 text-indigo-600 rotate-180' : 'bg-gray-100 text-gray-400'}`}>
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      {/* 🔴 ส่วนเนื้อหา: แสดงเมื่อขยาย (Expanded Body) */}
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* ข้อมูลลูกค้าและเหตุผล (แบบเต็ม) */}
          <div className="p-5 bg-white border-b border-gray-100">
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 flex gap-3 items-start shadow-inner">
               <div className="text-indigo-500 mt-0.5 bg-white p-1.5 rounded-md shadow-sm border border-indigo-50">
                 <AlertCircle size={20} />
               </div>
               <div>
                 <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">เหตุผลในการขอราคาส่ง / ข้อความจากลูกค้า</p>
                 <p className="text-sm text-indigo-950 font-medium leading-relaxed">{task.payload?.reason || 'ไม่ได้ระบุเหตุผล (คำขอจากตะกร้าสินค้า Dealer)'}</p>
               </div>
            </div>
          </div>

          {/* 📋 ตารางเปรียบเทียบสินค้ารายชิ้น */}
          <div className="p-5">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                รายการสินค้า & ปรับแก้ราคาส่ง
              </h4>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm relative">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 border-b">สินค้า</th>
                    <th className="px-4 py-3 border-b text-center w-20">จำนวน</th>
                    <th className="px-4 py-3 border-b text-right w-28">ราคาปลีก (บ.)</th>
                    <th className="px-4 py-3 border-b text-right w-36 bg-indigo-50/80 text-indigo-800 shadow-inner">เสนอราคาส่ง/ชิ้น</th>
                    <th className="px-4 py-3 border-b text-right w-32">ยอดรวมใหม่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cartItems.map((item, idx) => {
                    const rPrice = item.price || 0;
                    
                    // หาค่าที่จะเอามาแสดงใน Input ปัจจุบัน
                    let currentWholesale = rPrice;
                    if (editedPrices[idx] !== undefined && editedPrices[idx] !== '') {
                        currentWholesale = editedPrices[idx];
                    } else if (fetchedData && fetchedData[item.productId] !== undefined) {
                        currentWholesale = fetchedData[item.productId];
                    } else if (item.wholesalePrice && item.wholesalePrice < rPrice) {
                        currentWholesale = item.wholesalePrice;
                    } else {
                        currentWholesale = Math.floor(rPrice * 0.95); // ไกด์ไลน์ลด 5%
                    }

                    const lineTotal = currentWholesale * item.quantity;
                    const isDiscounted = currentWholesale < rPrice;

                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded border border-gray-200 overflow-hidden flex-shrink-0 bg-white shadow-sm">
                              {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-50"></div>}
                            </div>
                            <p className="font-semibold text-gray-800 line-clamp-2 leading-tight">{item.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-gray-600">x{item.quantity}</td>
                        <td className="px-4 py-3 text-right">
                           <span className={`font-semibold ${isDiscounted ? "line-through text-gray-400 decoration-red-400" : "text-gray-700"}`}>
                             {rPrice.toLocaleString()}
                           </span>
                        </td>
                        <td className="px-4 py-2 text-right bg-indigo-50/30 border-l border-indigo-50">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-indigo-400 font-bold text-xs">฿</span>
                            <input 
                              type="number" 
                              min="0"
                              value={editedPrices[idx] !== undefined ? editedPrices[idx] : currentWholesale}
                              onChange={(e) => handlePriceChange(idx, e.target.value)}
                              disabled={isSubmitting}
                              className="w-20 px-2 py-1.5 text-right border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-black text-indigo-700 bg-white shadow-sm transition-all disabled:opacity-50"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-indigo-900">
                          {lineTotal.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-gray-500 mt-2 text-right font-medium">
              * ราคาส่งดึงมาจากระบบอัตโนมัติ (หากไม่มีจะแสดงไกด์ไลน์ลด 5%) สามารถพิมพ์แก้ไขตัวเลขได้เลย
            </p>
          </div>

          {/* 📊 สรุปยอดเปรียบเทียบ (คงรายละเอียดเดิมไว้ทั้งหมด) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 border-t border-gray-100 bg-gray-50/30">
            
            {/* ซ้าย: ชี้แจง 8 ข้อ */}
            <div className="p-5">
               <h4 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-gray-400"></span> รายละเอียดบิลเดิม (ราคาปลีกหน้าเว็บ)
               </h4>
               <div className="space-y-2.5 text-[13px] text-gray-600 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center pb-1 border-b border-gray-50">
                    <span>1. ยอดรวมสินค้าปลีก ({cartItems.length} ชิ้น)</span>
                    <span className="font-bold text-gray-900">฿{calculations.retailSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span>2. โปรโมชันหน้าเว็บที่ใช้</span>
                    <div className="text-right flex flex-col gap-0.5">
                      {appliedPromotions.length > 0 ? appliedPromotions.map((p, i) => <span key={i} className="text-emerald-600 font-medium">{p.name}</span>) : <span className="text-gray-400">ไม่มี</span>}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>3. ค่าจัดส่ง</span>
                    <span className="font-medium text-gray-900">{shippingCost === 0 ? <span className="text-emerald-600">ฟรี</span> : `฿${shippingCost}`}</span>
                  </div>
                  <div className="flex justify-between items-center"><span>4. ภาษีมูลค่าเพิ่ม (VAT 7%)</span><span className="text-gray-400 text-xs">รวมแล้ว</span></div>
                  <div className="flex justify-between items-center">
                    <span>5. ใช้คะแนน (Points)</span>
                    <span className={usedPoints > 0 ? "text-indigo-600 font-medium" : "text-gray-400"}>{usedPoints > 0 ? `-฿${usedPoints}` : '0'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>6. ใช้ Wallet Balance</span>
                    <span className={usedWallet > 0 ? "text-indigo-600 font-medium" : "text-gray-400"}>{usedWallet > 0 ? `-฿${usedWallet}` : '0'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>7. ส่วนลดเพิ่มเติมหน้าเว็บ</span>
                    <span className={webExtraDiscount > 0 ? "text-emerald-600 font-medium" : "text-gray-400"}>{webExtraDiscount > 0 ? `-฿${webExtraDiscount}` : '0'}</span>
                  </div>
                  <div className="flex justify-between items-start border-t border-gray-100 pt-2 mt-1">
                    <span className="font-medium text-gray-800">8. ของแถมที่ได้รับ</span>
                    <div className="text-right flex flex-col gap-0.5">
                      {qualifiedFreebies.length > 0 ? qualifiedFreebies.map((f, i) => <span key={i} className="text-orange-600 font-medium">🎁 {f.itemName} (x{f.quantity})</span>) : <span className="text-gray-400">ไม่มี</span>}
                    </div>
                  </div>
               </div>
            </div>

            {/* ขวา: สรุปราคาส่งใหม่ + อนุมัติ */}
            <div className="p-5 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-indigo-900 mb-3 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span> สรุปยอดใหม่ (หลังเคาะราคาส่ง)
                </h4>
                
                <div className="space-y-2.5 text-[13px] bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>ยอดรวมหลังหักส่วนลดรายชิ้น</span>
                    <span className="font-bold text-gray-900">฿{calculations.wholesaleSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>หักลบส่วนลดจากหน้าเว็บ (ข้อ 2,5,6,7)</span>
                    <span className="font-bold">-฿{(totalWebDiscount + totalCreditDiscount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>บวกค่าจัดส่ง (ข้อ 3)</span>
                    <span className="font-bold">{shippingCost === 0 ? 'ฟรี' : `+฿${shippingCost}`}</span>
                  </div>
                  
                  {/* ช่องลดเพิ่มท้ายบิล */}
                  <div className="flex justify-between items-center bg-yellow-50 p-2.5 rounded-lg border border-yellow-200 mt-2 shadow-inner">
                    <span className="font-bold text-yellow-800 text-[13px] flex items-center gap-1.5">
                      ลดพิเศษท้ายบิลให้ลูกค้า (ถ้ามี)
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-700 font-black text-sm">-฿</span>
                      <input 
                        type="number" min="0" value={extraManualDiscount} 
                        onChange={(e) => setExtraManualDiscount(Math.max(0, Number(e.target.value)))}
                        className="w-24 px-2 py-1.5 text-right border border-yellow-400 rounded-md focus:ring-2 focus:ring-yellow-500 font-black text-yellow-800 bg-white shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t-2 border-dashed border-indigo-200 flex justify-between items-end">
                  <span className="font-black text-indigo-950 text-base">ยอดเรียกเก็บสุทธิ</span>
                  <div className="text-right">
                    <span className="text-[11px] text-gray-400 line-through mr-2 font-medium">ราคาปลีก: ฿{calculations.originalNetTotal.toLocaleString()}</span>
                    <span className="text-3xl font-black text-indigo-700 tracking-tight">฿{calculations.newNetTotal.toLocaleString()}</span>
                  </div>
                </div>

                {errorMsg && (
                  <p className="mt-3 text-[13px] text-red-600 font-semibold bg-red-50 p-2 rounded border border-red-100 text-center flex items-center justify-center gap-1">
                    <AlertCircle size={16} /> {errorMsg}
                  </p>
                )}
              </div>

              {/* ปุ่ม Action */}
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={onReject} disabled={isSubmitting}
                  className="px-5 py-3.5 bg-white border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
                >
                  ปฏิเสธ
                </button>
                <button 
                  onClick={handleApprove} disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-bold rounded-xl hover:from-indigo-700 shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                     <><Check size={18} strokeWidth={3}/> อนุมัติราคาส่ง และแจ้งลูกค้า</>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WholesaleCard;