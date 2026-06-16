import React from 'react';
import { Store, UploadCloud, Loader2, Clock, Image as ImageIcon } from 'lucide-react';

const StoreProfileBasicInfo = ({ storeData, setStoreData, isAdPending, uploadingStoreImage, handleStoreImageUpload }) => {
  return (
    <div>
      <h4 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-5 uppercase tracking-wide text-sm"><ImageIcon size={18} className="text-indigo-500"/> รูปภาพและข้อมูลหลัก</h4>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Store Image Upload */}
        <div className="w-full md:w-1/3 flex flex-col">
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">ภาพโปรไฟล์ร้าน / โลโก้</label>
          <div className="aspect-square w-full rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 relative overflow-hidden group hover:border-indigo-400 transition-colors">
            {storeData.storeImage ? (
              <img src={storeData.storeImage} alt="Store" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400"><Store size={32} className="mb-2 opacity-50"/><span className="text-[10px] uppercase font-bold">อัปโหลดรูปภาพ</span></div>
            )}
            <label className={`absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm ${uploadingStoreImage ? 'pointer-events-none' : ''}`}>
              <input type="file" accept="image/*" onChange={handleStoreImageUpload} className="hidden" />
              {uploadingStoreImage ? <Loader2 className="animate-spin text-white"/> : <UploadCloud className="text-white" size={28}/>}
            </label>
          </div>
        </div>

        {/* Basic Info */}
        <div className="w-full md:w-2/3 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ชื่อร้าน / ชื่อกิจการ <span className="text-rose-500">*</span></label>
            <input type="text" value={storeData.storeName} onChange={(e) => setStoreData({...storeData, storeName: e.target.value})} required placeholder="เช่น DH Computer Repair" className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">คำอธิบายสั้นๆ (จุดเด่น)</label>
            <input type="text" value={storeData.description} onChange={(e) => setStoreData({...storeData, description: e.target.value})} placeholder="เช่น ซ่อมด่วน รอรับได้เลย ประเมินอาการฟรี" className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">รูปแบบการให้บริการ (Services)</label>
            <textarea value={storeData.services} onChange={(e) => setStoreData({...storeData, services: e.target.value})} placeholder="เช่น รับซ่อมมือถือ, รับซ่อมคอมพิวเตอร์, งานเดินสายต่างๆ, ให้บริการถึงบ้าน..." rows="2" className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl resize-none focus:border-indigo-500"></textarea>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Clock size={12}/> เวลาเปิด-ปิดร้าน</label>
            <input type="text" value={storeData.openHours} onChange={(e) => setStoreData({...storeData, openHours: e.target.value})} placeholder="เช่น จันทร์-ศุกร์ 09:00 - 18:00 น." className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfileBasicInfo;
