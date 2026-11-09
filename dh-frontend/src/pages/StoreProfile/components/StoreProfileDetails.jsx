import React from 'react';

const StoreProfileDetails = ({ partner = {}, onOpenLightbox }) => {
  const description = partner.richDescription || partner.description;
  const galleryImages = partner.galleryImages || [];

  return (
    <div className="bg-white rounded-[2px] shadow-xs border border-slate-100 p-6 md:p-8">
      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        รายละเอียดบริการ
      </h3>
      <div className="prose prose-slate max-w-none">
        {description ? (
          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{description}</p>
        ) : (
          <p className="text-slate-500 italic">ร้านค้านี้ยังไม่ได้เพิ่มรายละเอียดเพิ่มเติม แต่พร้อมให้บริการตามหมวดหมู่ความเชี่ยวชาญครับ</p>
        )}
      </div>
      
      {galleryImages.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-slate-700">ผลงาน / แกลลอรี่ภาพ</h4>
            <span className="text-xs text-slate-400 font-medium">คลิกเพื่อดูภาพเต็มจอ</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 items-center">
            {galleryImages.map((img, idx) => (
              <div 
                key={idx} 
                onClick={() => onOpenLightbox && onOpenLightbox(idx)}
                className="cursor-pointer flex items-center justify-center h-48 sm:h-56 md:h-64 w-full"
              >
                <div className="relative inline-block max-w-full max-h-full group">
                  <img 
                    loading="lazy" 
                    src={img} 
                    alt={`Gallery ${idx + 1}`} 
                    className="max-h-48 sm:max-h-56 md:max-h-64 max-w-full h-auto w-auto object-contain rounded-[2px] group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-[2px] transition-colors flex items-center justify-center pointer-events-none">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-xs shadow-md">
                      ดูภาพใหญ่
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(StoreProfileDetails);
