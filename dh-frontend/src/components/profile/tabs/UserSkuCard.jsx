/* eslint-disable */
import React from 'react';
import { Image as ImageIcon, Youtube, Edit2, Trash2 } from 'lucide-react';
import { SKU_STATUS } from '../../../firebase/userSkuService';

// 🚀 รับ Props เพิ่มเติม: onEdit, onDelete เพื่อเรียกใช้จากหน้าหลัก
const UserSkuCard = ({ sku, balance, onToggleActive, onEdit, onDelete }) => {
  const isCreditDepleted = sku.isActive && balance <= 0;

  const getStatusBadge = (status) => {
    switch(status) {
      case SKU_STATUS.APPROVED: return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-bold border border-emerald-200">อนุมัติแล้ว</span>;
      case SKU_STATUS.PENDING: return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-[10px] font-bold border border-amber-200">รอตรวจสอบ</span>;
      case SKU_STATUS.REJECTED: return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-[10px] font-bold border border-red-200">ไม่อนุมัติ</span>;
      default: return <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md text-[10px] font-bold border border-slate-200">ไม่ทราบสถานะ</span>;
    }
  };

  return (
    <tr className="hover:bg-blue-50/30 transition-colors group">
      <td className="p-4 pl-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200 shadow-sm">
          {sku.imageUrl ? (
            <img src={sku.imageUrl} alt={sku.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <ImageIcon size={20} className="text-gray-400 m-auto h-full" />
          )}
        </div>
        <span className="text-sm font-black font-tech text-[#0870B8] bg-blue-50 px-2 py-1 rounded-md border border-blue-100">{sku.skuId}</span>
      </td>
      <td className="p-4 align-top">
        <p className="text-sm font-bold text-gray-800 line-clamp-2 max-w-[250px] mb-1 leading-snug">{sku.name}</p>
        <p className="text-xs font-bold text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded border border-emerald-100">฿{sku.price?.toLocaleString() || 0}</p>
      </td>
      <td className="p-4 align-top pt-5">
        {getStatusBadge(sku.status)}
      </td>
      <td className="p-4 align-top pt-4">
        <div className="flex flex-wrap gap-1.5 max-w-[180px]">
          {sku.links?.shopee && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold shadow-sm">Shopee</span>}
          {sku.links?.lazada && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold shadow-sm">Lazada</span>}
          {sku.links?.tiktok && <span className="text-[10px] bg-black text-white px-2 py-1 rounded font-bold shadow-sm">TikTok</span>}
          {sku.links?.youtube && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-bold shadow-sm flex items-center gap-1"><Youtube size={10}/> YouTube</span>}
          {(!sku.links?.shopee && !sku.links?.lazada && !sku.links?.tiktok && !sku.links?.youtube) && <span className="text-xs text-gray-400">-</span>}
        </div>
      </td>
      <td className="p-4 pr-6 text-right align-top pt-4">
        <div className="flex flex-col items-end gap-2">
          
          {/* 🔘 สวิตช์เปิด-ปิด โฆษณา */}
          <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border w-full justify-end ${isCreditDepleted ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-200'}`}>
            <span className={`text-[11px] font-bold ${
              isCreditDepleted ? 'text-rose-600' : 
              (sku.isActive ? 'text-emerald-600' : 'text-gray-400')
            }`}>
                {isCreditDepleted ? 'ระงับ (เครดิตหมด)' : (sku.isActive ? 'กำลังเปิดโฆษณา' : 'ปิดโฆษณา')}
            </span>
            <button
              onClick={() => onToggleActive(sku)}
              disabled={!sku.isActive && balance <= 0}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                sku.isActive && balance > 0 ? 'bg-emerald-500' : 
                (isCreditDepleted ? 'bg-rose-400 opacity-50 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400')
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${sku.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* 🛠️ ปุ่มดำเนินการ (แก้ไข / ลบ) */}
          <div className="flex items-center gap-2 mt-1">
            <button 
              onClick={() => onEdit(sku)}
              className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 px-2.5 py-1.5 rounded-lg border border-blue-100 transition-colors"
            >
              <Edit2 size={12} /> แก้ไข
            </button>
            <button 
              onClick={() => onDelete(sku)}
              className="flex items-center gap-1 text-[11px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 hover:text-rose-600 px-2.5 py-1.5 rounded-lg border border-rose-100 transition-colors"
            >
              <Trash2 size={12} /> ลบ
            </button>
          </div>
          
          {/* สถิติการคลิก */}
          {sku.status === SKU_STATUS.APPROVED && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                คลิก: <span className="font-bold text-gray-800">{sku.stats?.clicks || 0}</span>
              </span>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default UserSkuCard;