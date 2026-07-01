import React, { useState } from 'react';
import { Wrench, ArrowLeftRight } from 'lucide-react';
import { getStatusDisplay } from './HistoryStatusUtil';
import WarrantyStatusBadge from './WarrantyStatusBadge';

const HistoryItemCard = ({
  order,
  isExpanded,
  toggleOrderDetails,
  handleCancelOrder,
  cancellingOrderId,
  setSelectedOrder,
  openServiceModal
}) => {
  const [copyStatus, setCopyStatus] = useState(false);

  const handleCopyTracking = (e, trackingNum) => {
    e.stopPropagation();
    const el = document.createElement('textarea');
    el.value = trackingNum;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const statusObj = getStatusDisplay(order.status);
  const itemsList = order.items?.map(i => i.name).join(', ') || 'ไม่มีรายการสินค้า';
  
  const displayOrderId = order.orderId && order.orderId.startsWith('DH-') 
    ? order.orderId 
    : `#${(order.orderId || order.id)?.slice(-8).toUpperCase()}`;

  return (
    <div className={`bg-white border transition-all duration-300 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md ${isExpanded ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-gray-200'}`}>
      
      {/* Order Header Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 pb-3 mb-3 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900">ออเดอร์ {displayOrderId}</h3>
          <p className="text-xs text-gray-500 mt-0.5">สั่งซื้อเมื่อ: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'N/A'}</p>
        </div>
        <div className="flex flex-col sm:items-end gap-1">
            <span className={`px-3 py-1.5 text-xs font-bold rounded-full border w-max ${statusObj.color}`}>
              {statusObj.text}
            </span>
            {/* แจ้งเตือนบิลในหน้าย่อ ถ้ามีใบกำกับภาษีออกแล้ว */}
            {order.taxInvoiceUrl && !isExpanded && (
              <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-100 w-max">
                📄 มีใบกำกับภาษี
              </span>
            )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-700 line-clamp-2">
            <span className="font-semibold text-gray-900">สินค้า: </span>
            {itemsList}
          </p>
          <p className="text-base text-indigo-700 font-black mt-2">
            ยอดชำระสุทธิ: ฿{(order.totals?.netTotal ?? order.totals?.grandTotal ?? order.totals?.finalTotal ?? order.items?.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || item.quantity || 1)), 0) ?? 0).toLocaleString()}
          </p>
        </div>
        
        {/* ปุ่ม Action */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
          {['awaiting_wholesale_price', 'pending_payment'].includes(order.status) && (
            <button 
              onClick={() => handleCancelOrder(order.id)}
              disabled={cancellingOrderId === order.id}
              className="w-full sm:w-auto px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold border border-red-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
                ยกเลิกคำสั่งซื้อ
            </button>
          )}
          <button 
            onClick={() => toggleOrderDetails(order.id)}
            className="w-full sm:w-auto px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold border border-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            {isExpanded ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>

          {order.status === 'pending_payment' && (
            <button 
              onClick={() => setSelectedOrder(order)}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              แจ้งชำระเงิน
            </button>
          )}
        </div>
      </div>

      {/* 📋 รายละเอียดออเดอร์ (Expandable Details) */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
          
          {/* 🚚 ระบบแสดงเลขพัสดุ (อัปเดตใหม่) */}
          {order.trackingNumber && (
            <div className="mb-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg text-green-600 shadow-inner">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-0.5">จัดส่งแล้ว! หมายเลขพัสดุของคุณ</p>
                  <p className="text-xl font-black text-green-900 tracking-tight">{order.trackingNumber}</p>
                </div>
              </div>
              <button 
                onClick={(e) => handleCopyTracking(e, order.trackingNumber)}
                className={`w-full sm:w-auto px-4 py-2 border text-sm font-bold rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${copyStatus ? 'bg-green-600 text-white border-green-600' : 'bg-white border-green-300 text-green-700 hover:bg-green-100'}`}
              >
                {copyStatus ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    คัดลอกสำเร็จ!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    คัดลอกเลขพัสดุ
                  </>
                )}
              </button>
            </div>
          )}

          <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> รายการสินค้าที่สั่งซื้อ
          </h4>
          
          {/* List Items */}
          <div className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {order.items?.map((item, idx) => {
              const approvedPrice = order.totals?.wholesaleDetails?.approvedPrices?.[idx];
              const isWholesaleApplied = approvedPrice !== undefined && approvedPrice < item.price;
              const priceToShow = isWholesaleApplied ? approvedPrice : (item.price || 0);
              const orderDateStr = order.createdAt?.toDate ? order.createdAt.toDate().toISOString() : null;

              return (
                <div key={idx} className="flex gap-3 text-sm bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                  <div className="w-14 h-14 bg-white rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 shadow-sm">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 line-clamp-1">{item.name}</p>
                    <div className="flex justify-between mt-1.5 items-end">
                      <span className="text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded font-medium text-xs">x{item.quantity}</span>
                      
                      {isWholesaleApplied ? (
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-400 line-through">ปกติ: ฿{(item.price * item.quantity).toLocaleString()}</span>
                          <span className="font-bold text-indigo-600">ราคาส่ง: ฿{(priceToShow * item.quantity).toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-gray-900">฿{(priceToShow * item.quantity).toLocaleString()}</span>
                      )}
                    </div>
                    {/* Action Buttons for Claim/Return */}
                    {['shipped', 'completed'].includes(order.status) && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button onClick={(e) => { e.stopPropagation(); openServiceModal('claim', item, order); }} className="px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white rounded text-[11px] font-bold flex items-center gap-1.5 transition-all border border-orange-200">
                          <Wrench size={12}/> แจ้งเคลม
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); openServiceModal('return', item, order); }} className="px-3 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white rounded text-[11px] font-bold flex items-center gap-1.5 transition-all border border-purple-200">
                          <ArrowLeftRight size={12}/> แจ้งคืนสินค้า
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Breakdown */}
          <div className="bg-indigo-50/50 rounded-xl p-5 text-sm space-y-2 border border-indigo-100 text-gray-700 shadow-inner">
              <div className="flex justify-between">
                <span>ยอดรวมสินค้า</span>
                <span className="font-semibold text-gray-900">฿{order.totals?.subtotal?.toLocaleString() || 0}</span>
              </div>
              
              {order.calculationLog ? (
                <>
                  {order.calculationLog.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>ส่วนลด ({order.calculationLog.discountCode || 'โปรโมชั่น'})</span>
                      <span className="font-semibold">-฿{order.calculationLog.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {order.calculationLog.usedWallet > 0 && (
                    <div className="flex justify-between text-purple-600">
                      <span>หักลบด้วยยอดเงินใน Wallet</span>
                      <span className="font-semibold">-฿{order.calculationLog.usedWallet.toLocaleString()}</span>
                    </div>
                  )}
                  {order.calculationLog.usedPoints > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>หักลบด้วย Points สะสม</span>
                      <span className="font-semibold">-฿{order.calculationLog.usedPoints.toLocaleString()}</span>
                    </div>
                  )}
                </>
              ) : (
                order.totals?.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>ส่วนลดรวม / คูปอง</span>
                    <span className="font-semibold">-฿{(order.totals.discount - (order.totals?.wholesaleDetails?.itemLevelDiscount || 0) - (order.totals?.wholesaleDetails?.manualExtraDiscount || 0)).toLocaleString()}</span>
                  </div>
                )
              )}

              {(order.totals?.wholesaleDetails?.itemLevelDiscount > 0 || order.totals?.wholesaleDetails?.manualExtraDiscount > 0) && (
                <div className="flex justify-between text-indigo-700 bg-indigo-100/50 px-2.5 py-1.5 rounded-lg border border-indigo-100 mt-1">
                  <span className="font-bold flex items-center gap-1.5"><span className="text-lg leading-none">✨</span> ส่วนลดราคาส่ง (อนุมัติแล้ว)</span>
                  <span className="font-black">-฿{((order.totals?.wholesaleDetails?.itemLevelDiscount || 0) + (order.totals?.wholesaleDetails?.manualExtraDiscount || 0)).toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between mt-1">
                <span>ค่าจัดส่ง</span>
                <span>{order.totals?.shipping === 0 ? <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">ส่งฟรี</span> : `฿${order.totals?.shipping?.toLocaleString() || 0}`}</span>
              </div>
              
              <div className="flex justify-between items-end font-black text-indigo-950 text-base pt-3 border-t-2 border-indigo-100 border-dashed mt-3">
                <span>ยอดชำระสุทธิ</span>
                <span className="text-2xl text-indigo-700">฿{(order.totals?.grandTotal ?? order.totals?.netTotal ?? order.totals?.finalTotal ?? order.items?.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || item.quantity || 1)), 0) ?? 0).toLocaleString()}</span>
              </div>
          </div>

          {/* 📄 ระบบโหลดใบกำกับภาษี (อัปเดตใหม่) */}
          {order.taxInvoiceUrl && (
            <div className="mt-4 flex justify-end">
              <a 
                href={order.taxInvoiceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-3 bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-bold rounded-xl border border-teal-200 transition-colors shadow-sm active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                ดาวน์โหลดใบกำกับภาษี (PDF)
              </a>
            </div>
          )}

          {/* ที่อยู่จัดส่ง / รับหน้าร้าน */}
          {order.shippingMethod === 'pickup' ? (
            <div className="mt-5 text-sm text-gray-600 flex items-start gap-3 bg-green-50 p-4 rounded-xl border border-green-100">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              </div>
              <div>
                <p className="font-bold text-green-800">รับสินค้าที่สาขา (Store Pickup)</p>
                <p className="mt-1 text-green-700">สาขาเซียร์รังสิต ชั้น 3</p>
                {order.shippingAddress?.fullName && (
                  <p className="mt-1 font-medium text-green-700">ผู้มารับ: {order.shippingAddress.fullName} {order.shippingAddress.phone ? `(โทร: ${order.shippingAddress.phone})` : ''}</p>
                )}
              </div>
            </div>
          ) : order.shippingAddress ? (
            <div className="mt-5 text-sm text-gray-600 flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <div>
                <p className="font-bold text-gray-900">{order.shippingAddress.fullName}</p>
                <p className="mt-1">{order.shippingAddress.address} {order.shippingAddress.subdistrict} {order.shippingAddress.district} {order.shippingAddress.province} {order.shippingAddress.zipcode}</p>
                <p className="mt-1 font-medium text-gray-700">โทร: {order.shippingAddress.phone}</p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default HistoryItemCard;
