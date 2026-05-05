import React, { useState, useEffect } from 'react';
import { todoService } from '../../firebase/todoService';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const WholesaleCard = ({ task, currentUser, onSuccess, onReject }) => {
  // 1. UI States
  const [isExpanded, setIsExpanded] = useState(false); // ค่าเริ่มต้นคือ "หุบ (ย่อ)" ไว้
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false); // สถานะตอนกำลังไปดึงราคาส่งจาก DB
  const [errorMsg, setErrorMsg] = useState('');

  // 2. Data States
  const checkoutState = task?.payload?.checkoutSnapshot || {};
  const cartItems = task?.payload?.items || [];
  const totals = task?.payload?.originalTotals || {};

  // เก็บราคาส่งที่พนักงาน "แก้ไขด้วยมือ" (แยกตาม Index ของสินค้า)
  const [editedPrices, setEditedPrices] = useState({});
  // ส่วนลดท้ายบิลเพิ่มเติม (ถ้าพนักงานอยากลดให้อีก)
  const [extraManualDiscount, setExtraManualDiscount] = useState(0);

  // 3. 🎯 ระบบดึง "ราคาส่ง" อัจฉริยะจาก Database ทันทีที่ออเดอร์มาถึง
  useEffect(() => {
    let isMounted = true;

    const fetchRealWholesalePrices = async () => {
      if (!cartItems || cartItems.length === 0) return;
      setIsLoadingPrices(true);
      
      const initialPrices = {};
      let hasAnyWholesalePrice = false;
      let retailSub = 0;

      for (let idx = 0; idx < cartItems.length; idx++) {
        const item = cartItems[idx];
        retailSub += (item.price || 0) * (item.quantity || 1);
        let finalWholesaleToUse = null;

        try {
          // วิ่งไปเช็คราคาส่งล่าสุดจากฐานข้อมูลโดยตรง (อ้างอิง Collection 'products')
          const productId = item.productId || item.id;
          if (productId) {
            const productRef = doc(db, 'products', productId);
            const productSnap = await getDoc(productRef);
            
            if (productSnap.exists()) {
              const productData = productSnap.data();
              // ตรวจสอบฟิลด์ wholesalePrice
              if (productData.wholesalePrice && productData.wholesalePrice < item.price) {
                finalWholesaleToUse = productData.wholesalePrice;
              }
            }
          }
        } catch (err) {
          console.warn(`ดึงข้อมูลสินค้ารหัส ${item.id} ไม่สำเร็จ, ใช้ราคาเดิมเป็นฐาน`, err);
        }

        // ถ้าใน DB ไม่มี ให้เช็คว่ามีแนบมากับ Payload หน้าเว็บหรือไม่
        if (!finalWholesaleToUse && item.wholesalePrice && item.wholesalePrice < item.price) {
          finalWholesaleToUse = item.wholesalePrice;
        }

        // สรุปราคาที่จะลงในตาราง
        if (finalWholesaleToUse) {
          initialPrices[idx] = finalWholesaleToUse;
          hasAnyWholesalePrice = true;
        } else {
          initialPrices[idx] = item.price || 0; // ไม่มีราคาส่ง ก็ใช้ราคาปลีก
        }
      }

      // 🤖 ระบบช่วยเหลือ (Fallback): ถ้าทั้งบิลไม่มีสินค้าไหนตั้งราคาส่งไว้เลยในระบบ
      // ระบบจะช่วยคิดส่วนลดเหมา 5% ให้เป็นตุ๊กตา (Guideline)
      if (!hasAnyWholesalePrice && retailSub > 0) {
        cartItems.forEach((item, idx) => {
          // ลด 5% ทันที (ปัดเศษลง)
          initialPrices[idx] = Math.floor((item.price || 0) * 0.95);
        });
      }

      if (isMounted) {
        setEditedPrices(initialPrices);
        setIsLoadingPrices(false);
      }
    };

    fetchRealWholesalePrices();

    return () => { isMounted = false; };
  }, [cartItems]); // ทำงานแค่ครั้งแรกที่โหลดตะกร้าสินค้าเข้ามา

  // 4. คำนวณตัวเลขฐาน (จากหน้าเว็บ)
  const shippingCost = checkoutState.shippingCost || 0;
  const appliedPromotions = checkoutState.appliedPromotions || [];
  const qualifiedFreebies = checkoutState.qualifiedFreebies || [];
  const webExtraDiscount = checkoutState.discountAmount || 0;
  const usedPoints = checkoutState.usePoints || 0;
  const usedWallet = checkoutState.useWallet || 0;

  const totalPromoDiscount = appliedPromotions.reduce((sum, promo) => sum + (promo.discountValue || 0), 0);
  const totalWebDiscount = totalPromoDiscount + webExtraDiscount;
  const totalCreditDiscount = usedPoints + usedWallet;

  // 5. 🧮 คำนวณแบบ Real-time ตามที่พนักงานแก้ไข
  const retailSubtotal = cartItems.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 1)), 0);
  
  // ยอดรวมราคาส่ง (อิงจากตัวเลขในช่อง Input ที่พนักงานกรอก)
  const wholesaleSubtotal = cartItems.reduce((acc, item, idx) => {
    const currentPrice = editedPrices[idx] !== undefined ? editedPrices[idx] : (item.price || 0);
    return acc + (currentPrice * (item.quantity || 1));
  }, 0);

  const itemLevelDiscount = Math.max(0, retailSubtotal - wholesaleSubtotal);

  // คำนวณยอดสุทธิเดิม (ราคาปลีก)
  const originalNetTotal = Math.max(0, (retailSubtotal - totalWebDiscount) + shippingCost - totalCreditDiscount);
  
  // 🌟 คำนวณยอดสุทธิใหม่ (ราคาส่งที่แก้แล้ว + ส่วนลดอื่นๆ)
  const newNetTotal = Math.max(0, (wholesaleSubtotal - totalWebDiscount - extraManualDiscount) + shippingCost - totalCreditDiscount);

  // 💾 ฟังก์ชันบันทึกการอนุมัติ
  const handleApprove = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const totalWholesaleDiscount = itemLevelDiscount + extraManualDiscount;

      // สร้าง Object Totals ใหม่ เพื่อยัดกลับไปใน Order ให้ลูกค้าจ่ายเงิน
      const newTotals = {
        ...totals,
        subtotal: retailSubtotal, 
        discount: totalWebDiscount + totalWholesaleDiscount, 
        shipping: shippingCost,
        netTotal: newNetTotal,
        wholesaleDetails: {
          itemLevelDiscount: itemLevelDiscount,
          manualExtraDiscount: extraManualDiscount,
          approvedPrices: editedPrices 
        }
      };

      await todoService.approveWholesaleRequest(task.id, task.orderId, newTotals, currentUser);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Approve Error:", error);
      setErrorMsg(error.message || 'เกิดข้อผิดพลาดในการอนุมัติ กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePriceChange = (idx, value) => {
    const numValue = Math.max(0, Number(value));
    setEditedPrices(prev => ({ ...prev, [idx]: numValue }));
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
              <h3 className={`text-base font-bold truncate ${isExpanded ? 'text-indigo-900' : 'text-gray-900'}`}>ออเดอร์ #{task.orderId?.slice(-8).toUpperCase()}</h3>
              <span className="text-sm font-medium text-gray-500 truncate hidden sm:inline-block">— {task.customerName}</span>
            </div>
            {/* แสดงเหตุผลเมื่อย่ออยู่ เพื่อให้พนักงานเห็นภาพรวมโดยไม่ต้องกางออก */}
            {!isExpanded && (
              <p className="text-sm text-indigo-600 truncate mt-1 flex items-center gap-1.5 font-medium bg-indigo-50/50 px-2 py-0.5 rounded-md inline-flex">
                <span>💬</span> 
                {task.payload?.reason || 'ไม่มีการระบุเหตุผลในการขอราคาส่ง'}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">เวลาส่งคำขอ</p>
            <p className="text-xs font-semibold text-gray-600">{task.requestedAt?.toDate().toLocaleString() || 'N/A'}</p>
          </div>
          <div className={`p-1.5 rounded-full transition-transform duration-300 ${isExpanded ? 'bg-indigo-100 text-indigo-600 rotate-180' : 'bg-gray-100 text-gray-400'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
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
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               </div>
               <div>
                 <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">เหตุผลในการขอราคาส่ง / ข้อความจากลูกค้า</p>
                 <p className="text-sm text-indigo-950 font-medium leading-relaxed">{task.payload?.reason || 'ไม่ได้ระบุเหตุผล'}</p>
               </div>
            </div>
          </div>

          {/* 📋 ตารางเปรียบเทียบสินค้ารายชิ้น (แก้ไขราคาได้) */}
          <div className="p-5">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"></path><path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>
                รายการสินค้า & ปรับแก้ราคาส่ง
              </h4>
              {isLoadingPrices && (
                <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded animate-pulse">
                  <svg className="animate-spin h-3.5 w-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  กำลังดึงข้อมูลราคาส่งจากฐานข้อมูล...
                </span>
              )}
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm relative">
              {/* Overlay บังตารางตอนกำลังโหลด */}
              {isLoadingPrices && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10"></div>}

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
                    const currentWholesale = editedPrices[idx] !== undefined ? editedPrices[idx] : (item.price || 0);
                    const lineTotal = currentWholesale * item.quantity;
                    const isDiscounted = currentWholesale < item.price;

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
                             {item.price?.toLocaleString()}
                           </span>
                        </td>
                        <td className="px-4 py-2 text-right bg-indigo-50/30 border-l border-indigo-50">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-indigo-400 font-bold text-xs">฿</span>
                            <input 
                              type="number" 
                              min="0"
                              value={currentWholesale}
                              onChange={(e) => handlePriceChange(idx, e.target.value)}
                              disabled={isLoadingPrices}
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
            <p className="text-[11px] text-gray-500 mt-2 text-right flex items-center justify-end gap-1 font-medium">
              <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
              ราคาส่งดึงมาจากฐานข้อมูลอัตโนมัติ (หากไม่มีระบบจะลด 5% เป็น Guideline) พิมพ์แก้ไขตัวเลขในช่องสีม่วงได้เลย
            </p>
          </div>

          {/* 📊 สรุปยอดเปรียบเทียบ (แบ่ง 2 คอลัมน์) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 border-t border-gray-100 bg-gray-50/30">
            
            {/* ซ้าย: ชี้แจง 8 ข้อ (ของเดิม) */}
            <div className="p-5">
               <h4 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-gray-400"></span> รายละเอียดบิลเดิม (ราคาปลีกหน้าเว็บ)
               </h4>
               <div className="space-y-2.5 text-[13px] text-gray-600 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center pb-1 border-b border-gray-50">
                    <span>1. ยอดรวมสินค้า ({cartItems.length} ชิ้น)</span>
                    <span className="font-bold text-gray-900">฿{retailSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span>2. โปรโมชั่นที่ใช้</span>
                    <div className="text-right flex flex-col gap-0.5">
                      {appliedPromotions.length > 0 ? appliedPromotions.map((p, i) => <span key={i} className="text-green-600 font-medium flex items-center justify-end gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>{p.name}</span>) : <span className="text-gray-400">ไม่มี</span>}
                    </div>
                  </div>
                  <div className="flex justify-between items-center"><span>3. ค่าจัดส่ง</span><span className="font-medium text-gray-900">{shippingCost === 0 ? <span className="text-green-600">ฟรี</span> : `฿${shippingCost}`}</span></div>
                  <div className="flex justify-between items-center"><span>4. ภาษีมูลค่าเพิ่ม (VAT 7%)</span><span className="text-gray-400 text-xs">รวมแล้ว</span></div>
                  <div className="flex justify-between items-center"><span>5. ใช้แต้มสะสม</span><span className={usedPoints > 0 ? "text-indigo-600 font-medium" : "text-gray-400"}>{usedPoints > 0 ? `-฿${usedPoints}` : '0'}</span></div>
                  <div className="flex justify-between items-center"><span>6. ใช้ Wallet</span><span className={usedWallet > 0 ? "text-indigo-600 font-medium" : "text-gray-400"}>{usedWallet > 0 ? `-฿${usedWallet}` : '0'}</span></div>
                  <div className="flex justify-between items-center"><span>7. ส่วนลดอื่นๆ</span><span className={webExtraDiscount > 0 ? "text-green-600 font-medium" : "text-gray-400"}>{webExtraDiscount > 0 ? `-฿${webExtraDiscount}` : '0'}</span></div>
                  <div className="flex justify-between items-start border-t border-gray-100 pt-2 mt-1">
                    <span className="font-medium text-gray-800">8. ของแถมที่ได้รับ</span>
                    <div className="text-right flex flex-col gap-0.5">
                      {qualifiedFreebies.length > 0 ? qualifiedFreebies.map((f, i) => <span key={i} className="text-orange-600 font-medium flex items-start gap-1"><span>🎁</span> {f.itemName} (x{f.quantity})</span>) : <span className="text-gray-400">ไม่มี</span>}
                    </div>
                  </div>
               </div>
            </div>

            {/* ขวา: สรุปราคาส่งใหม่ + อนุมัติ */}
            <div className="p-5 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-indigo-900 mb-3 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span> สรุปยอดใหม่ (หลังหักราคาส่ง)
                </h4>
                
                <div className="space-y-2.5 text-[13px] bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>ยอดรวมหลังหักส่วนลดรายชิ้น</span>
                    <span className="font-bold text-gray-900">฿{wholesaleSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>หักส่วนลดหน้าเว็บ (โปรฯ+แต้ม+Wallet)</span>
                    <span className="font-bold">-฿{(totalWebDiscount + totalCreditDiscount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>บวกค่าจัดส่ง</span>
                    <span className="font-bold">{shippingCost === 0 ? 'ฟรี' : `+฿${shippingCost}`}</span>
                  </div>
                  
                  {/* ช่องลดเพิ่มท้ายบิล */}
                  <div className="flex justify-between items-center bg-yellow-50 p-2.5 rounded-lg border border-yellow-200 mt-2 shadow-inner">
                    <span className="font-bold text-yellow-800 text-[13px] flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd"></path></svg>
                      ลดพิเศษท้ายบิล (ถ้ามี)
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-700 font-black text-sm">-฿</span>
                      <input 
                        type="number" min="0" value={extraManualDiscount} 
                        onChange={(e) => setExtraManualDiscount(Math.max(0, Number(e.target.value)))}
                        className="w-24 px-2 py-1.5 text-right border border-yellow-400 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-black text-yellow-800 bg-white shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t-2 border-dashed border-indigo-200 flex justify-between items-end">
                  <span className="font-black text-indigo-950 text-base">ยอดเรียกเก็บสุทธิ</span>
                  <div className="text-right">
                    <span className="text-[11px] text-gray-400 line-through mr-2 font-medium">ราคาปลีก: ฿{originalNetTotal.toLocaleString()}</span>
                    <span className="text-3xl font-black text-indigo-700 tracking-tight">฿{newNetTotal.toLocaleString()}</span>
                  </div>
                </div>

                {errorMsg && <p className="mt-3 text-[13px] text-red-600 font-semibold bg-red-50 p-2 rounded border border-red-100 text-center flex items-center justify-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                  {errorMsg}
                </p>}
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
                  onClick={handleApprove} disabled={isSubmitting || isLoadingPrices}
                  className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-bold rounded-xl hover:from-indigo-700 hover:to-indigo-800 shadow-md hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                     <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      กำลังยืนยันข้อมูล...
                     </>
                  ) : 'อนุมัติราคาส่ง และแจ้งลูกค้า'}
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