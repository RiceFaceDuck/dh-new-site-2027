import React, { useState } from 'react';
import { useMyClaims } from './claims/useMyClaims';
import ClaimItemCard from './claims/ClaimItemCard';
import { Loader2, Wrench } from 'lucide-react';

const TabClaims = () => {
  const { claims, loading } = useMyClaims();
  const [filter, setFilter] = useState('all');

  const filteredClaims = claims.filter(claim => {
    if (filter === 'all') return true;
    if (filter === 'pending') return claim.status === 'pending_manager' || claim.status === 'waiting_item';
    if (filter === 'processing') return claim.status === 'processing';
    if (filter === 'completed') return claim.status === 'completed' || claim.status === 'approved';
    if (filter === 'rejected') return claim.status === 'rejected' || claim.status === 'cancelled';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 min-h-[500px] animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-orange-500" />
            เคลม และ คืนสินค้า
          </h2>
          <p className="text-sm text-gray-500 mt-1">ติดตามสถานะการซ่อม เคลม และการคืนสินค้า</p>
        </div>
        
        <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200 overflow-x-auto w-full sm:w-auto custom-scrollbar">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>ทั้งหมด</button>
          <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-colors ${filter === 'pending' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>รอรับเรื่อง / รอส่งของ</button>
          <button onClick={() => setFilter('processing')} className={`px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-colors ${filter === 'processing' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>กำลังตรวจสอบ</button>
          <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-colors ${filter === 'completed' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>เสร็จสิ้น</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <Wrench className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500 font-medium">ไม่มีประวัติการเคลม/คืนสินค้าในหมวดหมู่นี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredClaims.map(claim => (
            <ClaimItemCard key={claim.id} claim={claim} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TabClaims;
