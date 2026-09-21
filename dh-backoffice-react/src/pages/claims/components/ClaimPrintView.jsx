import { forwardRef, useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { auth } from '../../../firebase/config';
import { userService } from '../../../firebase/userService';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';

// ==========================================
// 🖨️ Component: Print Form 
// ==========================================
const ClaimPrintView = forwardRef(({ req, preloadedCustomerProfile = null, preloadedStaffProfile = null }, ref) => {
  const [customerProfile, setCustomerProfile] = useState(preloadedCustomerProfile);
  const [staffProfile, setStaffProfile] = useState(preloadedStaffProfile);

  useEffect(() => {
    if (preloadedCustomerProfile) {
      setCustomerProfile(preloadedCustomerProfile);
      return;
    }
    const customerUid = req?.payload?.customerUid;
    if (!customerUid || customerUid === 'Walk-in' || customerUid.includes('WALK-IN')) {
      setCustomerProfile(null);
      return;
    }
    let isActive = true;
    userService.getUserProfile(customerUid)
      .then(profile => {
        if (profile && isActive) setCustomerProfile(profile);
      })
      .catch(console.error);
    return () => { isActive = false; };
  }, [req?.payload?.customerUid, preloadedCustomerProfile]);

  useEffect(() => {
    if (preloadedStaffProfile) {
      setStaffProfile(preloadedStaffProfile);
      return;
    }
    const uid = auth?.currentUser?.uid;
    if (!uid) return;
    let isActive = true;
    userService.getUserProfile(uid)
      .then(profile => {
        if (profile && isActive) setStaffProfile(profile);
      })
      .catch(console.error);
    return () => { isActive = false; };
  }, [preloadedStaffProfile]);

  if (!req || !req.payload) return <div ref={ref} className="hidden" />;

  const { payload } = req;
  const isClaim = req.originalType === 'CLAIM_APPROVAL' || req.type === 'CLAIM_APPROVAL';
  const isReturn = req.originalType === 'RETURN_APPROVAL' || req.type === 'RETURN_APPROVAL' || payload.actionType === 'คืนสินค้า';
  const isExchange = !!(payload.isSwapSku || payload.swapSku) || req.type === 'EXCHANGE_APPROVAL' || req.originalType === 'EXCHANGE_APPROVAL' || payload.actionType === 'เปลี่ยนสินค้า';

  const getStatusText = (status) => {
    switch (status) {
      case 'pending_manager': return 'รอผู้จัดการอนุมัติ';
      case 'waiting_item': return 'รอรับของ';
      case 'processing':
      case 'completed':
      case 'approved':
        return isExchange ? 'อนุมัติการเปลี่ยนสินค้า' : isReturn ? 'อนุมัติการคืนสินค้า' : 'อนุมัติการเคลมสินค้า';
      case 'rejected': return 'ไม่อนุมัติ';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };

  const rawStatus = req.status || payload.status;
  const displayStatus = getStatusText(rawStatus);

  const rawProductName = payload.productName || '';
  const displayProductName = rawProductName.length > 100 ? rawProductName.substring(0, 100) + '...' : rawProductName;

  const customerName = getCustomerDisplayName(customerProfile) === 'ลูกค้าทั่วไป'
    ? getCustomerDisplayName(payload, 'ลูกค้าทั่วไป')
    : getCustomerDisplayName(customerProfile);

  const customerPhone = customerProfile?.phone || customerProfile?.tel || customerProfile?.mobile || payload.customerPhone || payload.phone || null;

  const staffName = (() => {
    if (staffProfile) {
      const name = `${staffProfile.firstName || staffProfile.displayName || ''} ${staffProfile.nickname ? `(${staffProfile.nickname})` : ''}`.trim();
      if (name) return name;
    }
    if (auth?.currentUser?.displayName) return auth.currentUser.displayName;
    if (auth?.currentUser?.email) return auth.currentUser.email.split('@')[0];
    return payload.requestedByName || payload.handledByName || req.handledBy || 'พนักงานผู้ทำรายการ';
  })();

  const qty = Number(payload.qty || 1);
  const effectivePrice = Number(payload.effectivePurchasePrice ?? payload.originalPricePerUnit ?? payload.purchasePrice ?? 0);
  const basePrice = isReturn ? effectivePrice : Number(payload.originalPricePerUnit || payload.purchasePrice || 0);
  const swapPrice = Number(payload.swapPricePerUnit || 0);
  const penalty = Number(payload.freebiePenaltyAmount || 0);
  const additionalCost = Number(payload.additionalCost || payload.extraFee || payload.repairFee || payload.shippingFee || 0);
  const returnAmount = Math.max(0, effectivePrice * qty - penalty);
  const defaultDiff = isReturn ? -returnAmount : (swapPrice - basePrice) * qty;
  const priceDiff = (payload.priceDifference !== undefined && payload.priceDifference !== null && !isReturn)
    ? Number(payload.priceDifference)
    : defaultDiff;

  const extraToPay = (priceDiff > 0 ? priceDiff : 0) + (isReturn ? 0 : penalty) + additionalCost;
  const refundToCustomer = isReturn ? returnAmount : (priceDiff < 0 ? Math.abs(priceDiff) : 0);
  const hasFinancialSummary = isExchange || isReturn || priceDiff !== 0 || penalty > 0 || additionalCost > 0;

  const formTitle = isExchange ? 'EXCHANGE FORM' : isClaim ? 'CLAIM FORM' : 'RETURN FORM';
  const docSubtitle = isExchange ? 'เอกสารเปลี่ยนสินค้า / สลับรุ่น' : isClaim ? 'เอกสารแจ้งเคลม/ซ่อมสินค้า' : 'เอกสารแจ้งคืนสินค้า/คืนเงิน';
  const refCode = payload.exchangeId || payload.claimId || payload.returnId || 'DH-EXCHANGE';

  return (
    <div ref={ref} id="printable-claim" className="w-[148mm] mx-auto text-black font-sans bg-white px-2 py-2 text-[11px]">
      {/* Header */}
      <div className="flex justify-between items-start mb-3 border-b-2 border-black pb-2">
        <div className="flex items-center gap-3">
          <img src="/dh-logo.png" alt="DH Logo" className="h-10 w-auto object-contain" loading="lazy" />
          <div>
            <h1 className="text-[15px] font-black text-gray-900 leading-tight">DH NOTE BOOK CO.,LTD</h1>
            <p className="text-[10px] text-gray-600 font-medium">{docSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div>
            <h2 className="text-[16px] font-black uppercase tracking-widest text-gray-900">{formTitle}</h2>
            <p className="text-[11px] font-bold text-gray-800 mt-0.5">{refCode}</p>
          </div>
          <div className="w-[48px] h-[48px] border border-gray-300 p-0.5 rounded-xs shrink-0 bg-white">
            <QRCode value={refCode} size={42} style={{ height: 'auto', maxWidth: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex justify-between text-[11px] mb-3">
        <div className="w-1/2 pr-3 space-y-1">
          <p><span className="text-gray-500">ลูกค้า:</span> <strong className="text-gray-900">{customerName}</strong></p>
          {customerPhone && <p><span className="text-gray-500">เบอร์โทร:</span> <strong className="text-gray-900">{customerPhone}</strong></p>}
          <p><span className="text-gray-500">บิลอ้างอิง:</span> <strong className="text-gray-900">{payload.orderId}</strong></p>
          <p><span className="text-gray-500">วันที่แจ้ง:</span> <strong className="text-gray-900">{req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString('th-TH') : '-'}</strong></p>
          <p><span className="text-gray-500">วันที่ซื้อ(ประกัน):</span> <strong className="text-gray-900">{payload.purchaseDate && !isNaN(new Date(payload.purchaseDate)) ? new Date(payload.purchaseDate).toLocaleDateString('th-TH') : '-'}</strong></p>
        </div>
        <div className="w-1/2 pl-3 border-l border-gray-300 space-y-1">
          <p><span className="text-gray-500">ผู้รับเรื่อง:</span> <strong className="text-gray-900">{payload.requestedByName}</strong></p>
          <p><span className="text-gray-500">ผู้ตรวจสอบ:</span> <strong className="text-gray-900">{payload.inspectorName || '-'}</strong></p>
          <p><span className="text-gray-500">สถานะ:</span> <strong className="text-blue-900 font-black">{displayStatus}</strong></p>
          {payload.trackingNo && <p><span className="text-gray-500">Tracking:</span> <strong className="text-gray-900">{payload.trackingNo}</strong></p>}
        </div>
      </div>

      {/* Products Table */}
      <table className="w-full text-[11px] mb-2.5 border-collapse">
        <thead>
          <tr className="border-y border-black text-left font-bold text-gray-900">
            <th className="py-1.5 w-3/5">รหัสและชื่อสินค้า (Product)</th>
            <th className="py-1.5 text-center w-1/5">จำนวน (Qty)</th>
            <th className="py-1.5 text-right w-1/5">ราคา/มูลค่า</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {isExchange && (
            <tr className="bg-blue-50/50">
              <td className="py-1.5 max-w-[280px]">
                <span className="text-[9px] font-black text-blue-700 block uppercase">✨ [สินค้าเปลี่ยนใหม่ / เบิกจัดส่งให้ลูกค้า]</span>
                <p className="font-bold text-blue-900 truncate block text-[11px]" title={payload.swapProductName || payload.swapSku}>
                  {payload.swapProductName || payload.swapSku}
                </p>
                <p className="font-mono text-[13px] font-black text-blue-900 mt-0.5 bg-blue-100/80 w-fit px-1 rounded-xs">
                  {payload.swapSku}
                </p>
              </td>
              <td className="py-1.5 text-center font-black text-blue-900">+{qty}</td>
              <td className="py-1.5 text-right font-bold text-blue-900">{swapPrice > 0 ? `฿${(swapPrice * qty).toLocaleString()}` : '-'}</td>
            </tr>
          )}
          <tr className={isExchange ? 'bg-gray-50/40 text-gray-500' : ''}>
            <td className="py-1.5 max-w-[280px]">
              <span className="text-[8.5px] font-medium text-gray-400 block uppercase">
                {isExchange ? '🔄 [สินค้าเดิมที่ส่งคืน / รับเข้า]' : isReturn ? '📥 [สินค้าที่รับคืนเข้าคลัง]' : '[สินค้าเดิม]'}
              </span>
              <p className="font-normal text-gray-700 truncate block text-[10.5px]" title={displayProductName}>
                {displayProductName}
              </p>
              <p className="font-mono text-[11px] font-medium text-gray-500 mt-0.5 bg-gray-100/70 border border-gray-200/80 w-fit px-1 rounded-xs">
                {payload.sku}
              </p>
              {isReturn && payload.discountPerUnit > 0 && (
                <span className="text-[9px] text-gray-500 font-medium mt-0.5 block">
                  (ราคาป้าย ฿{Number(payload.purchasePrice || 0).toLocaleString()} - ส่วนลดเฉลี่ย ฿{Number(payload.discountPerUnit || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ชิ้น)
                </span>
              )}
            </td>
            <td className="py-1.5 text-center font-bold text-gray-600">{isExchange ? `-${qty}` : isReturn ? `รับคืน ${qty}` : qty}</td>
            <td className="py-1.5 text-right font-normal text-gray-600 font-mono">
              {basePrice > 0 ? `฿${(basePrice * qty).toLocaleString('th-TH', { minimumFractionDigits: (basePrice * qty) % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}` : '-'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Symptom & Details */}
      <div className="p-2 bg-gray-50 border border-gray-300 rounded-sm text-[10.5px] mb-2.5">
        <p className="font-bold text-gray-900 mb-0.5 border-b border-gray-200 pb-0.5">รายละเอียดอาการเสีย / การกระทำ:</p>
        <p className="text-gray-800 font-bold">การกระทำ: {payload.actionType}</p>
        <p className="text-gray-800 font-bold">อาการ: {isClaim ? payload.symptomCode : payload.returnReason}</p>
        <p className="text-gray-700 whitespace-pre-wrap line-clamp-2">{isClaim ? payload.symptomDetails : payload.returnDetails}</p>
      </div>

      {/* Financial Summary */}
      {hasFinancialSummary && (
        <div className="p-2 border-2 border-gray-800 rounded-md bg-gray-50/80 mb-2.5 text-[10.5px]">
          <p className="font-black text-gray-900 mb-1 border-b border-gray-300 pb-0.5 uppercase tracking-wide">💵 สรุปรายการค่าใช้จ่ายและส่วนต่างทางการเงิน:</p>
          <div className="space-y-0.5 text-gray-800">
            {isExchange && (
              <div className="flex justify-between items-center">
                <span>ส่วนต่างการสลับรุ่น (Swap SKU):</span>
                <span className="font-mono font-bold">
                  {priceDiff > 0 ? `+฿${priceDiff.toLocaleString()}` : priceDiff < 0 ? `-฿${Math.abs(priceDiff).toLocaleString()}` : '฿0'}
                </span>
              </div>
            )}
            {penalty > 0 && (
              <div className="flex justify-between items-center">
                <span>ค่าหักคืนสินค้าของแถม:</span>
                <span className="font-mono font-bold text-red-600">+฿{penalty.toLocaleString()}</span>
              </div>
            )}
            {additionalCost > 0 && (
              <div className="flex justify-between items-center">
                <span>ค่าบริการ / ค่าใช้จ่ายเพิ่มเติม:</span>
                <span className="font-mono font-bold text-red-600">+฿{additionalCost.toLocaleString()}</span>
              </div>
            )}
          </div>

          {extraToPay > 0 ? (
            <div className="mt-1.5 p-1.5 bg-red-100 border-2 border-red-500 rounded-sm flex justify-between items-center text-[11px]">
              <span className="font-black text-red-900">ค่าใช้จ่ายเพิ่มเติม:</span>
              <span className="font-black text-red-600 text-[14px] font-mono">฿{extraToPay.toLocaleString()}</span>
            </div>
          ) : refundToCustomer > 0 ? (
            <div className="mt-1.5 p-1.5 bg-emerald-100 border-2 border-emerald-500 rounded-sm flex justify-between items-center text-[11px]">
              <span className="font-black text-emerald-900">
                DH ค้างยอด {refundToCustomer.toLocaleString('th-TH', { minimumFractionDigits: refundToCustomer % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })} บาท เข้า (Wallet)
              </span>
              <span className="font-black text-emerald-700 text-[14px] font-mono">
                ฿{refundToCustomer.toLocaleString('th-TH', { minimumFractionDigits: refundToCustomer % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ) : (
            <div className="mt-1.5 p-1 bg-gray-200 border border-gray-400 rounded-sm flex justify-between items-center text-[10.5px]">
              <span className="font-bold text-gray-700">ส่วนต่างทางการเงิน:</span>
              <span className="font-bold text-gray-900">ไม่มีค่าใช้จ่ายเพิ่มเติม (ยอดเท่ากัน)</span>
            </div>
          )}
        </div>
      )}

      {/* Return notice banner */}
      {isReturn && (
        <div className="p-2 bg-amber-50 border border-amber-300 rounded-xs text-[10.5px] text-amber-950 mb-2.5 font-bold flex items-center justify-between">
          <span>📌 เอกสารรับคืนสินค้าและคืนเงินเข้า Wallet เรียบร้อยแล้ว</span>
          <span className="text-red-700 font-black">⛔ ไม่ต้องจัดส่งสินค้า / ไม่ต้องส่งงานต่อฝ่ายจัดแพ็ค</span>
        </div>
      )}

      {/* Signature Section */}
      <div className="mt-5 flex justify-end items-end">
        <div className="text-center w-48 text-[10.5px] text-gray-800">
          <div className="h-10 border-b border-black mb-1 flex items-end justify-center" />
          <p className="font-bold truncate text-[11px] text-blue-900">{staffName}</p>
          <p className="text-[9.5px] text-gray-600 font-medium mt-0.5">พนักงานผู้ทำรายการ (Account)</p>
        </div>
      </div>
    </div>
  );
});

ClaimPrintView.displayName = 'ClaimPrintView';

export default ClaimPrintView;
