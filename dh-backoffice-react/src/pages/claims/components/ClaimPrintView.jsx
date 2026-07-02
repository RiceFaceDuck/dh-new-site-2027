import React, { forwardRef } from 'react';

// ==========================================
// 🖨️ Component: Print Form 
// ==========================================
const ClaimPrintView = forwardRef(({ req }, ref) => {
  if (!req || !req.payload) return <div ref={ref} className="hidden"></div>;
  const { payload } = req;
  const isClaim = req.originalType === 'CLAIM_APPROVAL' || req.type === 'CLAIM_APPROVAL';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(payload.claimId || payload.returnId)}`;

  const getStatusText = (status) => {
    switch (status) {
      case 'pending_manager': return 'รอผู้จัดการอนุมัติ';
      case 'waiting_item': return 'รอรับของ';
      case 'processing': return 'กำลังตรวจสอบ';
      case 'completed': return 'เสร็จสิ้น';
      case 'rejected': return 'ไม่อนุมัติ';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };
  const rawStatus = req.status || payload.status;
  const displayStatus = getStatusText(rawStatus);

  const rawProductName = payload.productName || '';
  const displayProductName = rawProductName.length > 100 ? rawProductName.substring(0, 100) + '...' : rawProductName;

  return (
    <div ref={ref} id="printable-claim" className="w-[148mm] mx-auto text-black font-sans bg-white px-2 py-4">
      <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
        <div className="flex items-center gap-3">
          <img src="/dh-logo.png" alt="DH Logo" className="h-12 w-auto object-contain" />
          <div>
            <h1 className="text-[16px] font-black text-gray-900 leading-tight">DH NOTE BOOK CO.,LTD</h1>
            <p className="text-[11px] text-gray-600 font-medium">เอกสารแจ้ง{isClaim ? 'เคลม/ซ่อมสินค้า' : 'คืนสินค้า/คืนเงิน'}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-[18px] font-black uppercase tracking-widest text-gray-900">{isClaim ? 'CLAIM FORM' : 'RETURN FORM'}</h2>
          <p className="text-[12px] font-bold text-gray-800 mt-1">{payload.claimId || payload.returnId}</p>
        </div>
      </div>

      <div className="flex justify-between text-[12px] mb-6">
        <div className="w-1/2 pr-4 space-y-1.5">
          <p><span className="text-gray-500">ลูกค้า:</span> <strong className="text-gray-900">{payload.customerName}</strong></p>
          <p><span className="text-gray-500">บิลอ้างอิง:</span> <strong className="text-gray-900">{payload.orderId}</strong></p>
          <p><span className="text-gray-500">วันที่แจ้ง:</span> <strong className="text-gray-900">{req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString('th-TH') : '-'}</strong></p>
          <p><span className="text-gray-500">วันที่ซื้อ(ประกัน):</span> <strong className="text-gray-900">{payload.purchaseDate && !isNaN(new Date(payload.purchaseDate)) ? new Date(payload.purchaseDate).toLocaleDateString('th-TH') : '-'}</strong></p>
        </div>
        <div className="w-1/2 pl-4 border-l border-gray-300 space-y-1.5">
          <p><span className="text-gray-500">ผู้รับเรื่อง:</span> <strong className="text-gray-900">{payload.requestedByName}</strong></p>
          <p><span className="text-gray-500">ผู้ตรวจสอบ:</span> <strong className="text-gray-900">{payload.inspectorName || '-'}</strong></p>
          <p><span className="text-gray-500">สถานะ:</span> <strong className="text-gray-900">{displayStatus}</strong></p>
          {payload.trackingNo && <p><span className="text-gray-500">Tracking:</span> <strong className="text-gray-900">{payload.trackingNo}</strong></p>}
        </div>
      </div>

      <table className="w-full text-[12px] mb-6 border-collapse">
        <thead>
          <tr className="border-y border-black text-left font-bold text-gray-900">
            <th className="py-2.5 w-3/5">รหัสและชื่อสินค้า (Product)</th>
            <th className="py-2.5 text-center w-1/5">จำนวน (Qty)</th>
            <th className="py-2.5 text-right w-1/5">{isClaim ? '' : 'มูลค่า (Value)'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          <tr>
            <td className="py-3">
              <p className="font-bold text-gray-900">{displayProductName}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{payload.sku}</p>
            </td>
            <td className="py-3 text-center font-bold text-gray-900">{payload.qty || 1}</td>
            <td className="py-3 text-right font-bold text-gray-900">{isClaim ? '-' : `฿${((payload.purchasePrice || 0) * (payload.qty || 1)).toLocaleString()}`}</td>
          </tr>
        </tbody>
      </table>

      <div className="p-3 bg-gray-50 border border-gray-300 rounded text-[11px] min-h-[100px]">
        <p className="font-bold text-gray-900 mb-1 border-b border-gray-200 pb-1">รายละเอียดอาการเสีย / การกระทำ:</p>
        <p className="text-gray-800 font-bold mb-1">การกระทำ: {payload.actionType}</p>
        <p className="text-gray-800 font-bold mb-1">อาการ: {isClaim ? payload.symptomCode : payload.returnReason}</p>
        <p className="text-gray-700 whitespace-pre-wrap">{isClaim ? payload.symptomDetails : payload.returnDetails}</p>
      </div>

      <div className="mt-12 flex justify-between items-end">
        <img src={qrCodeUrl} alt="QR" className="w-[60px] h-[60px]" />
        <div className="text-center w-40 text-[11px] text-gray-800">
          <p className="border-b border-black mb-1.5"></p>
          <p className="font-bold truncate mt-1">{req.status === 'approved' ? (req.handledBy || 'ผู้จัดการ') : 'ผู้จัดการสาขา'}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">ผู้อนุมัติรายการ</p>
        </div>
      </div>
    </div>
  );
});

export default ClaimPrintView;
