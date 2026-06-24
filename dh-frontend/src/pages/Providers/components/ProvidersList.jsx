import React from 'react';
import PartnerCard from '../../Home/components/PartnerCard';

const ProvidersList = ({ 
  loading, 
  visiblePartners, 
  hasMore, 
  loadMore,
  totalCount
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
        <span className="ml-3 text-slate-500 font-medium">กำลังโหลดข้อมูลช่าง...</span>
      </div>
    );
  }

  if (visiblePartners.length === 0) {
    return (
      <div className="bg-slate-50 p-10 rounded-2xl text-center border border-slate-200 mt-4">
        <div className="text-4xl mb-3">🔍</div>
        <h3 className="text-lg font-bold text-slate-700 mb-1">ไม่พบร้านค้าที่ตรงกับเงื่อนไข</h3>
        <p className="text-sm text-slate-500">ลองเปลี่ยนคำค้นหา หรือขยายขอบเขตการค้นหาดูอีกครั้ง</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 text-sm text-slate-500 font-medium px-1">
        พบผู้ให้บริการทั้งหมด {totalCount} รายการ
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {visiblePartners.map((partner) => (
          <PartnerCard key={partner.id || partner.userId} partner={partner} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center pb-8">
          <button
            onClick={loadMore}
            className="px-6 py-3 bg-white text-brand border border-brand/30 rounded-xl font-bold shadow-sm hover:bg-brand/5 hover:border-brand/50 hover:shadow-md transition-all active:scale-95"
          >
            โหลดข้อมูลเพิ่ม...
          </button>
        </div>
      )}
    </div>
  );
};

export default ProvidersList;
