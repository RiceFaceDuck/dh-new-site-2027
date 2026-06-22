import React, { useState } from 'react';
import { Wrench, ArrowLeftRight, Package, CheckCircle, Clock, XCircle, Send } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../firebase/config';

const getClaimStatusDisplay = (status, type) => {
  const isCancel = type?.startsWith('CANCEL_');
  if (isCancel && status !== 'cancelled') {
    return { label: 'ขอยกเลิก (รออนุมัติ)', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle };
  }
  switch (status) {
    case 'pending_manager': return { label: 'รอรับเรื่อง', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: Clock };
    case 'waiting_item': return { label: 'รอรับของ', color: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: Package };
    case 'processing': return { label: 'กำลังตรวจสอบ', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: Wrench };
    case 'approved':
    case 'completed': return { label: 'เสร็จสิ้น', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle };
    case 'rejected': return { label: 'ไม่อนุมัติ', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: XCircle };
    case 'cancelled': return { label: 'ยกเลิกแล้ว', color: 'bg-gray-50 text-gray-600 border-gray-200', icon: XCircle };
    default: return { label: status, color: 'bg-gray-50 text-gray-600 border-gray-200', icon: Clock };
  }
};

const ClaimItemCard = ({ claim }) => {
  const { payload, type, status, createdAt } = claim;
  const isClaim = type.includes('CLAIM');
  const statusInfo = getClaimStatusDisplay(status, type);
  const StatusIcon = statusInfo.icon;
  
  const [trackingNo, setTrackingNo] = useState(payload?.trackingNo || '');
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);

  const handleUpdateTracking = async () => {
    if (!trackingNo.trim()) return alert('กรุณาระบุเลขพัสดุ');
    setIsUpdatingTracking(true);
    try {
      const docRef = doc(db, 'todos', claim.id);
      await updateDoc(docRef, {
        'payload.trackingNo': trackingNo.trim(),
        updatedAt: serverTimestamp()
      });
      alert('บันทึกเลขพัสดุเรียบร้อยแล้ว ผู้จัดการจะตรวจสอบพัสดุของคุณเร็วๆ นี้');
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsUpdatingTracking(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 border-b border-gray-100 pb-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl flex-shrink-0 ${isClaim ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'}`}>
            {isClaim ? <Wrench size={24} /> : <ArrowLeftRight size={24} />}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              {isClaim ? 'เคลม/ซ่อมสินค้า' : 'คืนสินค้า (Refund)'}
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                {payload?.claimId || payload?.returnId || 'N/A'}
              </span>
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              วันที่แจ้ง: {createdAt?.toDate ? createdAt.toDate().toLocaleString('th-TH') : '-'}
            </p>
          </div>
        </div>
        
        <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-bold ${statusInfo.color}`}>
          <StatusIcon size={14} />
          {statusInfo.label}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
        <p className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{payload?.productName}</p>
        <p className="text-xs text-gray-500 mb-3">SKU: {payload?.sku || '-'}</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-gray-200">
          <div>
            <p className="text-gray-500 text-xs mb-0.5 uppercase tracking-wider">อาการ / เหตุผล</p>
            <p className="font-medium text-gray-800">{payload?.symptomCode || payload?.returnReason || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-0.5 uppercase tracking-wider">บิลอ้างอิง</p>
            <p className="font-medium text-gray-800 font-mono">{payload?.orderId || '-'}</p>
          </div>
        </div>
      </div>

      {status === 'waiting_item' && !type.startsWith('CANCEL_') && (
        <div className={`border rounded-lg p-4 animate-in fade-in ${payload?.trackingNo ? 'bg-green-50 border-green-100' : 'bg-indigo-50 border-indigo-100'}`}>
          <p className={`text-sm font-bold mb-2 flex items-center gap-1.5 ${payload?.trackingNo ? 'text-green-800' : 'text-indigo-800'}`}>
            {payload?.trackingNo ? <CheckCircle size={16} /> : <Package size={16} />} 
            {payload?.trackingNo ? 'ทางร้านได้รับแจ้งเลขพัสดุของคุณแล้ว' : 'ผู้จัดการอนุมัติแล้ว กรุณาส่งสินค้ากลับมาและแจ้งเลขพัสดุ'}
          </p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="กรอกเลขพัสดุ (Tracking Number)" 
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
              className={`flex-1 p-2.5 rounded-lg border focus:outline-none text-sm font-bold ${payload?.trackingNo ? 'border-green-200 focus:border-green-500' : 'border-indigo-200 focus:border-indigo-500'}`}
            />
            <button 
              onClick={handleUpdateTracking}
              disabled={isUpdatingTracking || trackingNo === payload?.trackingNo}
              className={`px-4 py-2.5 disabled:opacity-50 text-white rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition-colors ${payload?.trackingNo ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isUpdatingTracking ? 'กำลังบันทึก...' : <><Send size={16} /> {payload?.trackingNo ? 'อัปเดตข้อมูล' : 'แจ้งจัดส่ง'}</>}
            </button>
          </div>
          {payload?.trackingNo && (
             <p className="text-xs text-green-600 mt-2">
               *คุณสามารถแก้ไขเลขพัสดุได้หากพิมพ์ผิด จนกว่าสถานะจะเปลี่ยนเป็นกำลังตรวจสอบ
             </p>
          )}
        </div>
      )}

      {payload?.trackingNo && status !== 'waiting_item' && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <span className="font-bold">Tracking No:</span> 
          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{payload.trackingNo}</span>
        </div>
      )}
    </div>
  );
};

export default ClaimItemCard;
