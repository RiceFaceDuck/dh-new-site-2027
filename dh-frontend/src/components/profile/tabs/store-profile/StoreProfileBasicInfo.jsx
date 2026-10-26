import { Store, UploadCloud, Loader2, Clock, Image as ImageIcon } from 'lucide-react';
import LazyImage from '../../../common/LazyImage';

const StoreProfileBasicInfo = ({ storeData, setStoreData, isAdPending, uploadingStoreImage, handleStoreImageUpload, uploadingGallery, handleGalleryImageUpload, handleRemoveGalleryImage }) => {
  return (
    <div className="store-profile-basic-info-container">
      <h4 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3 mb-5 uppercase tracking-wide text-sm"><ImageIcon size={18} className="text-indigo-500"/> รูปภาพและข้อมูลหลัก</h4>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Store Image Upload */}
        <div className="w-full md:w-1/3 flex flex-col">
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">ภาพโปรไฟล์ร้าน / โลโก้</label>
          <div className="aspect-square w-full rounded-md bg-slate-50 border-2 border-dashed border-slate-200 relative overflow-hidden group hover:border-indigo-400 transition-colors">
            {storeData.storeImage ? (
              <LazyImage 
                src={storeData.storeImage} 
                alt="Store" 
                className="w-full h-full" 
                imgClassName="object-contain" 
                fallbackSrc="/logo.png"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400"><Store size={32} className="mb-2 opacity-50"/><span className="text-[10px] uppercase font-bold">อัปโหลดรูปภาพ</span></div>
            )}
            <label className={`absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs ${uploadingStoreImage ? 'pointer-events-none' : ''}`}>
              <input type="file" accept="image/*" onChange={handleStoreImageUpload} className="hidden" />
              {uploadingStoreImage ? <Loader2 className="animate-spin text-white"/> : <UploadCloud className="text-white" size={28}/>}
            </label>
          </div>
        </div>

        {/* Basic Info */}
        <div className="w-full md:w-2/3 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">ชื่อร้าน / ชื่อกิจการ <span className="text-rose-500">*</span></label>
            <input type="text" value={storeData.storeName} onChange={(e) => setStoreData({...storeData, storeName: e.target.value})} required placeholder="เช่น DH Computer Repair" className="w-full px-4 py-3 bg-slate-50/70 focus:bg-white border border-slate-300 rounded-md focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 font-medium shadow-xs placeholder:text-slate-400 hover:border-slate-400" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">คำอธิบายสั้นๆ (จุดเด่น)</label>
            <input type="text" value={storeData.description} onChange={(e) => setStoreData({...storeData, description: e.target.value})} placeholder="เช่น ซ่อมด่วน รอรับได้เลย ประเมินอาการฟรี" className="w-full px-4 py-3 bg-slate-50/70 focus:bg-white border border-slate-300 rounded-md focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 font-medium shadow-xs placeholder:text-slate-400 hover:border-slate-400" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">รูปแบบการให้บริการ (Services)</label>
            <textarea value={storeData.services} onChange={(e) => setStoreData({...storeData, services: e.target.value})} placeholder="เช่น รับซ่อมมือถือ, รับซ่อมคอมพิวเตอร์, งานเดินสายต่างๆ, ให้บริการถึงบ้าน..." rows="2" className="w-full px-4 py-3 bg-slate-50/70 focus:bg-white border border-slate-300 rounded-md resize-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 font-medium shadow-xs placeholder:text-slate-400 hover:border-slate-400"></textarea>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1"><Clock size={12}/> เวลาเปิด-ปิดร้าน</label>
            <input type="text" value={storeData.openHours} onChange={(e) => setStoreData({...storeData, openHours: e.target.value})} placeholder="เช่น จันทร์-ศุกร์ 09:00 - 18:00 น." className="w-full px-4 py-3 bg-slate-50/70 focus:bg-white border border-slate-300 rounded-md focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 font-medium shadow-xs placeholder:text-slate-400 hover:border-slate-400" />
          </div>
        </div>
      </div>
      
      {/* Rich Description */}
      <div className="mt-6">
        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">รายละเอียดร้านค้าแบบเต็ม (แสดงในหน้าร้าน)</label>
        <textarea 
          value={storeData.richDescription || ''} 
          onChange={(e) => setStoreData({...storeData, richDescription: e.target.value})} 
          placeholder="ประวัติร้าน, ความเชี่ยวชาญ, ทีมช่าง, เงื่อนไขการให้บริการ..." 
          rows="5" 
          className="w-full px-4 py-3 bg-slate-50/70 focus:bg-white border border-slate-300 rounded-md resize-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 font-medium shadow-xs placeholder:text-slate-400 hover:border-slate-400"
        ></textarea>
      </div>

      {/* Image Gallery */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-2">
            แกลลอรี่ร้านค้า (สูงสุด 20 รูป)
            {uploadingGallery && (
              <span className="inline-flex items-center gap-1.5 text-indigo-600 font-normal">
                <Loader2 className="animate-spin w-3.5 h-3.5" />
                กำลังบีบอัดและอัปโหลด...
              </span>
            )}
          </label>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {(storeData.galleryImages || []).length} / 20
          </span>
        </div>
        <div className="flex flex-wrap gap-4">
          {(storeData.galleryImages || []).map((imgUrl, idx) => (
            <div key={idx} className="relative w-24 h-24 rounded-md border border-slate-200 overflow-hidden group shadow-2xs">
              <LazyImage 
                src={imgUrl} 
                alt={`Gallery ${idx + 1}`} 
                className="w-full h-full" 
                imgClassName="object-contain" 
                fallbackSrc="/logo.png"
              />
              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-mono px-1 rounded-sm">
                #{idx + 1}
              </span>
              <button 
                type="button"
                onClick={() => handleRemoveGalleryImage(idx)}
                title="ลบรูปนี้"
                className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 text-xs font-bold shadow-xs cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
          {(storeData.galleryImages || []).length < 20 && (
            <label className={`w-24 h-24 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-md cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 transition-all ${uploadingGallery ? 'pointer-events-none opacity-50' : ''}`}>
              <UploadCloud className="text-slate-400 mb-1" size={20}/>
              <span className="text-[10px] font-bold text-slate-500">เพิ่มรูป</span>
              <span className="text-[9px] text-slate-400">เลือกได้หลายรูป</span>
              <input type="file" accept="image/*" multiple onChange={handleGalleryImageUpload} className="hidden" disabled={uploadingGallery} />
            </label>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreProfileBasicInfo;
