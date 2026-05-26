/* eslint-disable react/prop-types */
import React from 'react';
import { 
  Megaphone, X, Link as LinkIcon, UploadCloud, Loader2, CheckCircle2, 
  Lock, Activity, CreditCard, ShoppingBag, MonitorPlay, Sparkles, AlertCircle,
  RectangleHorizontal, Square, RectangleVertical, Tag, 
  ShieldAlert, Eye // 🛠️ HOTFIX: ยืนยันการนำเข้า ShieldAlert และ Eye อย่างสมบูรณ์
} from 'lucide-react';
import AdPreviewCard from './AdPreviewCard';

const AdFormModal = ({
  formData,
  setFormData,
  storeData,
  handleSubmitAd,
  onCloseForm,
  handleLinkChange,
  handleImageUpload,
  uploadingImage,
  submittingAd,
  creditLimit,
  setCreditLimit,
  remainingCredit,
  targetImpressions
}) => {

  // 🚀 Helper: ปุ่ม Quick Add Budget
  const addBudget = (amount) => {
    setCreditLimit(prev => (Number(prev) || 0) + amount);
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
      
      {/* ✨ Premium Background Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-20 translate-x-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl translate-y-10 -translate-x-10 pointer-events-none"></div>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-8 pb-4 border-b border-slate-100 relative z-10">
        <div>
          <h3 className="font-black text-2xl text-slate-800 flex items-center gap-3 tracking-tight">
            <Megaphone className="text-indigo-600" size={28}/> สร้างแคมเปญโฆษณา
          </h3>
          <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500"/>
            ระบบจะหักเครดิตของคุณ เฉพาะเมื่อมีลูกค้าเห็นโฆษณาบนหน้าเว็บจริงๆ เท่านั้น
          </p>
        </div>
        <button 
          onClick={onCloseForm} 
          className="p-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-all hover:rotate-90 duration-300"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 xl:gap-12 relative z-10">
        
        {/* ==========================================
            📝 ฟอร์มกรอกข้อมูล (Dynamic Form)
            ========================================== */}
        <form onSubmit={handleSubmitAd} className="w-full lg:w-[55%] space-y-7">

          {/* 1. 🏷️ Type Selector (ประเภทโฆษณา) */}
          <div className="space-y-3">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
               1. เลือกรูปแบบโฆษณา <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'BUSINESS_CARD', label: 'นามบัตร', icon: <CreditCard size={20}/>, color: 'indigo' },
                { id: 'PRODUCT_LINK', label: 'สินค้า', icon: <ShoppingBag size={20}/>, color: 'emerald' },
                { id: 'BILLBOARD', label: 'แผ่นป้าย', icon: <MonitorPlay size={20}/>, color: 'rose' }
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({...formData, type: type.id})}
                  className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 ${
                    formData.type === type.id 
                      ? `bg-${type.color}-50 border-${type.color}-500 text-${type.color}-700 shadow-[0_4px_15px_rgba(0,0,0,0.05)] scale-105 z-10` 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {type.icon}
                  <span className="text-xs font-bold mt-2">{type.label}</span>
                  {formData.type === type.id && (
                    <div className={`absolute -top-1.5 -right-1.5 w-4 h-4 bg-${type.color}-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm`}>
                      <CheckCircle2 size={10} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 📝 Dynamic Fields ตามประเภทโฆษณา */}
          <div className="space-y-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            
            {/* --- โหมด: นามบัตร หรือ สินค้า --- */}
            {(formData.type === 'BUSINESS_CARD' || formData.type === 'PRODUCT_LINK') && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    {formData.type === 'BUSINESS_CARD' ? 'ชื่อร้าน / หัวข้อโฆษณา' : 'ชื่อสินค้า'} <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder={formData.type === 'BUSINESS_CARD' ? "เช่น ซ่อมคอมพิวเตอร์ครบวงจร" : "เช่น จอคอมพิวเตอร์ 24 นิ้ว"} required maxLength={50}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
                  />
                </div>
                
                {/* ช่องเสริมสำหรับนามบัตร */}
                {formData.type === 'BUSINESS_CARD' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">คำอธิบายสั้นๆ (จุดเด่น)</label>
                    <input 
                      type="text" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="เช่น ประเมินอาการฟรี! รับประกันงานซ่อม" maxLength={40}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                    />
                  </div>
                )}

                {/* ช่องเสริมสำหรับสินค้า */}
                {formData.type === 'PRODUCT_LINK' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">ราคาโปรโมชั่น (บาท)</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Tag size={16}/></div>
                       <input 
                         type="number" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: e.target.value})}
                         placeholder="เช่น 1500" min="0"
                         className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold text-emerald-600"
                       />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* --- โหมด: แผ่นป้ายโฆษณา --- */}
            {formData.type === 'BILLBOARD' && (
              <div>
                 <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                   สัดส่วนภาพโฆษณา (Aspect Ratio) <span className="text-rose-500">*</span>
                 </label>
                 <div className="flex gap-3">
                    {[
                      { id: '16:9', label: 'แนวนอน', icon: <RectangleHorizontal size={20}/> },
                      { id: '1:1', label: 'จัตุรัส', icon: <Square size={20}/> },
                      { id: '9:16', label: 'แนวตั้ง', icon: <RectangleVertical size={20}/> }
                    ].map(ratio => (
                      <button
                        key={ratio.id} type="button"
                        onClick={() => setFormData({...formData, billboardRatio: ratio.id})}
                        className={`flex-1 py-3 flex flex-col items-center justify-center gap-1.5 rounded-xl border transition-all ${
                          formData.billboardRatio === ratio.id 
                            ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {ratio.icon}
                        <span className="text-[10px] font-bold tracking-wider">{ratio.label}</span>
                      </button>
                    ))}
                 </div>
              </div>
            )}

            {/* --- สิ่งที่ต้องมีในทุกโฆษณา (Link & Image) --- */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                <span>ลิงก์ปลายทางเมื่อลูกค้าคลิก <span className="text-rose-500">*</span></span>
                <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold text-white uppercase shadow-sm tracking-wider ${
                  formData.platform === 'shopee' ? 'bg-[#EE4D2D]' : 
                  formData.platform === 'lazada' ? 'bg-[#0F146D]' : 
                  formData.platform === 'tiktok' ? 'bg-black' : 
                  formData.platform === 'facebook' ? 'bg-[#1877F2]' : 
                  formData.platform === 'thisshop' ? 'bg-[#E31E24]' : 
                  formData.platform === 'lineshopping' ? 'bg-[#06C755]' : 
                  'bg-slate-400'
                }`}>
                  {formData.platform || 'OTHER'}
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><LinkIcon size={16}/></div>
                <input 
                  type="url" value={formData.targetUrl || ''} onChange={handleLinkChange}
                  placeholder={formData.type === 'BUSINESS_CARD' ? "เช่น ลิงก์เพจร้าน, แผนที่, ไลน์ติดต่อ..." : "วางลิงก์ Shopee, Lazada ที่นี่..."} required
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-mono text-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                <span>อัปโหลดรูปภาพโฆษณา <span className="text-rose-500">*</span> </span>
                <span className="text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
                  {formData.type === 'BILLBOARD' ? `อัตราส่วน ${formData.billboardRatio || '16:9'}` : 'อัตราส่วน 1:1'}
                </span>
              </label>
              <label className={`relative flex flex-col items-center justify-center w-full px-4 py-6 bg-white border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-300 transition-all ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                <input 
                  type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage}
                  className="hidden" 
                />
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-3 text-indigo-600 font-bold">
                    <Loader2 size={28} className="animate-spin"/> กำลังประมวลผลรูปภาพ...
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <div className={`p-3 rounded-full mb-1 ${formData.imageUrl ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      <UploadCloud size={24} /> 
                    </div>
                    <span className="font-bold text-sm text-slate-700">
                      {formData.imageUrl ? 'อัปโหลดภาพสำเร็จ (คลิกเพื่อเปลี่ยน)' : 'คลิกเพื่อเลือกไฟล์รูปภาพ'}
                    </span>
                    <span className="text-[10px] text-slate-400">ขนาดไฟล์ไม่เกิน 5MB</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* 3. 💰 Smart Budget Estimator (ระบบตั้งงบประมาณอัจฉริยะ) */}
          <div className="bg-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-lg border border-slate-700">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none"></div>

            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              กำหนดงบประมาณ (Credit Limit)
            </label>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
              <div className="flex-1">
                <div className="relative flex items-center">
                  <input 
                    type="number" min="10" step="10"
                    value={creditLimit === 0 ? '' : creditLimit} 
                    onChange={(e) => setCreditLimit(Number(e.target.value) || 0)}
                    className="w-full pl-4 pr-16 py-3 bg-slate-900 border border-slate-600 rounded-xl text-lg font-black text-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all"
                  />
                  <span className="absolute right-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Pts</span>
                </div>
                
                <div className="flex gap-2 mt-3">
                  {[100, 500, 1000].map(amt => (
                    <button 
                      key={amt} type="button" onClick={() => addBudget(amt)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-bold rounded-lg transition-colors border border-slate-600/50"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="text-left sm:text-right bg-slate-900/50 p-3.5 rounded-xl border border-slate-700/50 w-full sm:w-auto min-w-[140px]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">คาดการณ์การมองเห็น</div>
                <div className="text-2xl font-black text-emerald-400 flex items-baseline sm:justify-end gap-1">
                  {targetImpressions.toLocaleString()} <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Views</span>
                </div>
                
                <div className="mt-2 flex items-center gap-1.5 sm:justify-end">
                  {remainingCredit < 0 ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                      <AlertCircle size={10}/> แต้มไม่พอ (ขาด {Math.abs(remainingCredit)})
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                      <CheckCircle2 size={10}/> แต้มเพียงพอ
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. ✅ Submit Button */}
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={submittingAd || remainingCredit < 0 || creditLimit < 10} 
              className={`w-full py-4.5 font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2.5 text-base sm:text-lg ${
                (remainingCredit < 0 || creditLimit < 10)
                  ? 'bg-slate-100 cursor-not-allowed text-slate-400 border border-slate-200' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/25 hover:-translate-y-0.5'
              }`}
            >
              {submittingAd ? (
                <><Loader2 size={22} className="animate-spin"/> กำลังส่งเข้าสู่ระบบ...</>
              ) : remainingCredit < 0 ? (
                <><Lock size={22}/> เครดิตไม่เพียงพอ</>
              ) : creditLimit < 10 ? (
                <><AlertCircle size={22}/> ขั้นต่ำ 10 แต้ม</>
              ) : (
                <><CheckCircle2 size={22}/> ยืนยันการฝากโฆษณา</>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-3.5 font-medium flex items-center justify-center gap-1">
              <ShieldAlert size={12} className="text-emerald-500"/>
              โฆษณาจะแสดงผลหลังจากผู้จัดการตรวจสอบอนุมัติแล้วเท่านั้น
            </p>
          </div>
        </form>

        {/* ==========================================
            👁️ Live Preview (แสดงผลจำลองแบบเรียลไทม์)
            ========================================== */}
        <div className="w-full lg:w-[45%] lg:pl-6 border-t lg:border-t-0 lg:border-l border-slate-100 pt-8 lg:pt-0">
          <div className="sticky top-6">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Eye className="text-indigo-500" size={18}/> ตัวอย่างการแสดงผล (Live Preview)
            </h4>
            
            <AdPreviewCard 
              formData={formData} 
              storeData={storeData} 
            />
            
            <div className="mt-6 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
               <h5 className="text-[11px] font-bold text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Activity size={14}/> หลักการแสดงผล
               </h5>
               <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside pl-2">
                 {formData.type === 'BUSINESS_CARD' && (
                   <>
                     <li>โฆษณาจะถูก <b>สุ่มแทรก</b> ในหน้ารวมสินค้าและหน้าค้นหา</li>
                     <li>อัตราส่วนการแสดงผลคือ สินค้าทั่วไป 10 ชิ้น : โฆษณา 1 ชิ้น</li>
                   </>
                 )}
                 {formData.type === 'PRODUCT_LINK' && (
                   <>
                     <li>สินค้าจะถูก <b>สุ่มแทรก</b> ในหน้าสินค้าแนะนำด้านล่างสุด</li>
                     <li>เมื่อลูกค้าคลิก จะเด้งไปที่ลิงก์หน้าร้านปลายทางของคุณทันที</li>
                   </>
                 )}
                 {formData.type === 'BILLBOARD' && (
                   <>
                     <li>แผ่นป้ายจะถูกแสดงใน <b>พื้นที่พิเศษ</b> คั่นกลางระหว่างหมวดหมู่</li>
                     <li>สัดส่วนภาพที่ต่างกัน จะถูกนำไปแสดงในจุดที่เหมาะสมโดยอัตโนมัติ</li>
                   </>
                 )}
               </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdFormModal;