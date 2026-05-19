/* eslint-disable */
import React from 'react';
import { Package, Loader2 } from 'lucide-react';
import UserSkuCard from './UserSkuCard';

// 🚀 รับ Props onEdit และ onDelete ส่งต่อให้ Card
const UserSkuList = ({ skus, loading, balance, onToggleActive, onEdit, onDelete }) => {
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm min-h-[300px] relative">
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-[#0870B8] animate-spin mb-3" />
          <p className="text-sm font-bold text-gray-600">กำลังโหลดข้อมูลสินค้า...</p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-black text-gray-500 uppercase tracking-wider">
              <th className="p-4 pl-6">รูปภาพ & รหัส</th>
              <th className="p-4">รายละเอียดโฆษณา</th>
              <th className="p-4">สถานะตรวจสอบ</th>
              <th className="p-4">ปลายทางลิงก์</th>
              <th className="p-4 text-right pr-6">สวิตช์โฆษณา / จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!loading && skus.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-16 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package size={24} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-bold text-gray-600 mb-1">ยังไม่มีสินค้าในระบบ</p>
                  <p className="text-xs text-gray-400">กดปุ่ม "เพิ่มโฆษณาสินค้า" ด้านบนเพื่อเริ่มต้น</p>
                </td>
              </tr>
            ) : (
              skus.map(sku => (
                <UserSkuCard 
                  key={sku.id} 
                  sku={sku} 
                  balance={balance} 
                  onToggleActive={onToggleActive}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserSkuList;