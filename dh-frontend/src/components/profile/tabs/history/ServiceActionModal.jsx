import React, { useEffect } from 'react';
import { Wrench, ArrowLeftRight, X, UploadCloud, Loader2, Check } from 'lucide-react';
import { useServiceAction } from './useServiceAction';

const ServiceActionModal = ({ serviceModal, setServiceModal }) => {
  const {
    serviceForm,
    setServiceForm,
    initForm,
    isSubmittingService,
    isUploading,
    handleServiceImageUpload,
    handleSubmitService
  } = useServiceAction(serviceModal, setServiceModal);

  useEffect(() => {
    if (serviceModal && !serviceForm) {
      initForm(serviceModal.type, serviceModal.item, serviceModal.order);
    }
  }, [serviceModal, serviceForm, initForm]);

  if (!serviceModal || !serviceForm) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setServiceModal(null)}></div>
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 custom-scrollbar">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {serviceModal.type === 'claim' ? <Wrench className="w-6 h-6 text-orange-500"/> : <ArrowLeftRight className="w-6 h-6 text-purple-500"/>}
            แบบฟอร์มแจ้ง{serviceModal.type === 'claim' ? 'เคลมสินค้า' : 'คืนสินค้า'}
          </h3>
          <button onClick={() => setServiceModal(null)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-5">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">ชื่อสินค้า / SKU</label>
              <input type="text" value={serviceForm.productInfo} readOnly className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none font-bold shadow-inner" />
            </div>
            <div className="w-32 shrink-0">
              <label className="text-xs font-bold uppercase tracking-widest mb-1 block">จำนวน <span className="text-red-500">*</span></label>
              <input type="number" min="1" max={serviceModal.item.quantity} value={serviceForm.qty} onChange={e => setServiceForm({...serviceForm, qty: Number(e.target.value)})} className="w-full p-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm text-center font-black transition-all" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-1 block">สาเหตุ / อาการ <span className="text-red-500">*</span></label>
            <select value={serviceForm.reasonCode} onChange={e => setServiceForm({...serviceForm, reasonCode: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm font-bold transition-all" required>
              <option value="" disabled>เลือกสาเหตุ...</option>
              <option value="(E) สินค้า ไม่ตรงปก / ผิดสเป็ค / การผลิตผิดพลาด">(E) สินค้า ไม่ตรงปก / ผิดสเป็ค / การผลิตผิดพลาด</option>
              <option value="(S1) Screen : จอกระพริบ /ภาพสั่น">(S1) Screen : จอกระพริบ /ภาพสั่น</option>
              <option value="(S2) Screen : เปิดไม่ติด / ไม่มีสัญญาณภาพ / ไม่มีแสงอะไรเลย">(S2) Screen : เปิดไม่ติด / ไม่มีสัญญาณภาพ / ไม่มีแสงอะไรเลย</option>
              <option value="สาเหตุอื่นๆ">สาเหตุอื่นๆ (โปรดระบุในรายละเอียด)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-1 block">รายละเอียดเพิ่มเติม</label>
            <textarea rows="3" value={serviceForm.details} onChange={e => setServiceForm({...serviceForm, details: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm font-bold transition-all" placeholder="ระบุเพิ่มเติม..."></textarea>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-1 block">Tracking พัสดุ (ถ้ามี)</label>
            <input type="text" placeholder="ระบุเลขพัสดุ หากส่งของแล้ว" value={serviceForm.tracking} onChange={e => setServiceForm({...serviceForm, tracking: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm font-bold transition-all" />
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <label className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <UploadCloud size={14}/> อัพโหลดรูปภาพหลักฐาน
            </label>
            <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-dashed border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer relative">
              <input type="file" multiple accept="image/*" onChange={handleServiceImageUpload} className="w-full opacity-0 absolute inset-0 cursor-pointer z-10" />
              <div className="flex items-center justify-center w-full py-3 gap-2 text-sm font-bold text-gray-500">
                {isUploading ? <><Loader2 className="w-5 h-5 animate-spin text-indigo-500"/> กำลังอัพโหลด...</> : "คลิกเพื่อเลือกไฟล์ภาพ"}
              </div>
            </div>
            {serviceForm.images.length > 0 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2 custom-scrollbar">
                {serviceForm.images.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 shrink-0 group">
                    <img src={img} className="w-full h-full object-cover rounded-xl border border-gray-200 shadow-sm" />
                    <button type="button" onClick={() => setServiceForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 shadow-md transition-all">
                      <X size={12} strokeWidth={3}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setServiceModal(null)} className="px-5 py-2.5 text-gray-500 font-bold rounded-xl hover:bg-gray-100 border border-transparent text-sm transition-all">
              ยกเลิก
            </button>
            <button onClick={handleSubmitService} disabled={isSubmittingService || isUploading} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition-all text-sm disabled:opacity-50 flex items-center gap-2">
              {isSubmittingService ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>} ส่งเรื่อง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceActionModal;
