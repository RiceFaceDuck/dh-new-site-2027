/* eslint-disable react/prop-types */
import React from 'react';
import { Eye, ExternalLink, Image as ImageIcon } from 'lucide-react';
import ProductAdCard from '../../../ads/ProductAdCard';

const AdPreviewCard = ({ formData, storeData }) => {
  return (
    <div className="w-full lg:w-1/2 bg-[#f8fbff] rounded-3xl border-2 border-dashed border-[#0870B8]/30 p-8 flex flex-col items-center justify-center sticky top-6 self-start">
      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-full shadow-sm">
        <Eye size={16} className="text-[#0870B8]"/> Live Preview (พรีวิวโฆษณา)
      </h4>
      
      <div className={`w-full ${formData.type === 'product' ? 'max-w-[280px]' : 'max-w-full'} pointer-events-none transform origin-top shadow-2xl rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100`}>
        {formData.type === 'product' ? (
          <ProductAdCard 
            ad={{
              title: formData.title || 'ชื่อสินค้าจำลองที่น่าสนใจ',
              description: formData.description,
              imageUrl: formData.imageUrl || 'https://placehold.co/400x400/f1f5f9/94a3b8?text=1:1+Image',
              platform: formData.platform,
              partnerName: storeData.storeName || 'ร้านซ่อมคอมพิวเตอร์ของคุณ',
              youtubeUrl: formData.youtubeUrl,
              targetUrl: '#'
            }}
          />
        ) : (
          <div className="w-full aspect-video bg-slate-100 flex items-center justify-center relative group">
            {formData.imageUrl ? (
                <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Billboard Preview" />
            ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <ImageIcon size={48} className="mb-2 opacity-50"/>
                  <div className="text-xs font-bold uppercase tracking-wider">Billboard 16:9</div>
                </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5">
                <h3 className="text-white font-bold text-lg line-clamp-1">{formData.title || 'ข้อความป้ายแบนเนอร์โฆษณา'}</h3>
                <p className="text-blue-200 text-sm mt-1 flex items-center gap-1 font-medium"><ExternalLink size={14}/> คลิกเพื่อไปยังร้านค้า</p>
            </div>
          </div>
        )}
      </div>
      
      <p className="text-xs text-slate-400 mt-6 text-center max-w-[250px]">
        รูปแบบการแสดงผลจริงอาจปรับเปลี่ยนเล็กน้อยเพื่อให้เข้ากับหน้าจอของลูกค้า
      </p>
    </div>
  );
};

export default AdPreviewCard;