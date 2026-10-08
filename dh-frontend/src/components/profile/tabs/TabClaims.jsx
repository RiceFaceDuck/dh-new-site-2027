import { useState } from 'react';
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
            <Wrench className="w-6 h-6 text-orange-400 drop-shadow-xs" />
            เคลม และ คืนสินค้า
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">ติดตามสถานะการซ่อม เคลม และการคืนสินค้า</p>
        </div>
        
        <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-700/80 shadow-inner overflow-x-auto w-full sm:w-auto custom-scrollbar gap-1.5">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${filter === 'all' ? 'bg-amber-400 text-slate-950 shadow-md font-black hover:bg-amber-300 active:scale-95' : 'text-slate-300 bg-slate-800/80 border border-slate-700/60 hover:text-white hover:bg-slate-700 hover:border-slate-600 active:scale-95'}`}>ทั้งหมด</button>
          <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${filter === 'pending' ? 'bg-amber-400 text-slate-950 shadow-md font-black hover:bg-amber-300 active:scale-95' : 'text-slate-300 bg-slate-800/80 border border-slate-700/60 hover:text-white hover:bg-slate-700 hover:border-slate-600 active:scale-95'}`}>รอรับเรื่อง / รอส่งของ</button>
          <button onClick={() => setFilter('processing')} className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${filter === 'processing' ? 'bg-amber-400 text-slate-950 shadow-md font-black hover:bg-amber-300 active:scale-95' : 'text-slate-300 bg-slate-800/80 border border-slate-700/60 hover:text-white hover:bg-slate-700 hover:border-slate-600 active:scale-95'}`}>กำลังตรวจสอบ</button>
          <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${filter === 'completed' ? 'bg-amber-400 text-slate-950 shadow-md font-black hover:bg-amber-300 active:scale-95' : 'text-slate-300 bg-slate-800/80 border border-slate-700/60 hover:text-white hover:bg-slate-700 hover:border-slate-600 active:scale-95'}`}>เสร็จสิ้น</button>
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
