/* eslint-disable react/prop-types */
import React from 'react';
import { 
  Megaphone, X, Link as LinkIcon, UploadCloud, Loader2, CheckCircle2, 
  Lock, Activity, CreditCard, ShoppingBag, MonitorPlay, Sparkles, AlertCircle,
  RectangleHorizontal, Square, RectangleVertical, Tag, MessageCircle, Infinity,
  Eye, ShieldAlert
} from 'lucide-react';
import AdPreviewCard from './AdPreviewCard';

const AdFormModal = ({
  formData, setFormData, storeData, handleSubmitAd, onCloseForm, handleLinkChange,
  handleImageUpload, uploadingImage, submittingAd, creditLimit, setCreditLimit, 
  isUnlimited, setIsUnlimited, remainingCredit, targetImpressions
}) => {

  const addBudget = (amount) => setCreditLimit(prev => (Number(prev) || 0) + amount);

  return (
    <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
      
      <div className="flex items-start justify-between mb-8 pb-4 border-b border-slate-100 relative z-10">
        <div>
          <h3 className="font-black text-2xl text-slate-800 flex items-center gap-3 tracking-tight">
            <Megaphone className="text-indigo-600" size={28}/> สร้างแคมเปญโฆษณา
          </h3>
          <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500"/>
            ระบบจะหักเครดิต เฉพาะเมื่อมีลูกค้าเห็นโฆษณาบนหน้าเว็บจริงเท่านั้น (Pay-Per-View)
          </p>
        </div>
        <button onClick={onCloseForm} className="p-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-all">
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 xl:gap-12 relative z-10">
        <form onSubmit={handleSubmitAd} className="w-full lg:w-[55%] space-y-7">

          <div className="space-y-3">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">1. เลือกรูปแบบโฆษณา <span className="text-rose-500">*</span></label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'BUSINESS_CARD', label: 'นามบัตร', icon: <CreditCard size={20}/>, color: 'indigo' },
                { id: 'PRODUCT_LINK', label: 'สินค้า', icon: <ShoppingBag size={20}/>, color: 'emerald' },
                { id: 'BILLBOARD', label: 'แผ่นป้าย', icon: <MonitorPlay size={20}/>, color: 'rose' }
              ].map((type) => (
                <button
                  key={type.id} type="button" onClick={() => setFormData({...formData, type: type.id})}
                  className={`relative flex flex-col items-center p-3 sm:p-4 rounded-2xl border-2 transition-all ${
                    formData.type === type.id ? `bg-${type.color}-50 border-${type.color}-500 text-${type.color}-700 scale-105` : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {type.icon}
                  <span className="text-xs font-bold mt-2">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            {(formData.type === 'BUSINESS_CARD' || formData.type === 'PRODUCT_LINK') && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">{formData.type === 'BUSINESS_CARD' ? 'ชื่อร้าน / หัวข้อโฆษณา' : 'ชื่อสินค้า'} <span className="text-rose-500">*</span></label>
                  <input type="text" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500" />
                </div>
                {formData.type === 'BUSINESS_CARD' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">คำอธิบายสั้นๆ (จุดเด่น)</label>
                    <input type="text" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} maxLength={40} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500" />
                  </div>
                )}
                {formData.type === 'PRODUCT_LINK' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">ราคาโปรโมชั่น (บาท)</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Tag size={16}/></div>
                       <input type="number" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 text-emerald-600 font-bold" />
                    </div>
                  </div>
                )}
              </>
            )}

            {formData.type === 'BILLBOARD' && (
              <div>
                 <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2.5">สัดส่วนภาพโฆษณา <span className="text-rose-500">*</span></label>
                 <div className="flex gap-3">
                    {[{ id: '16:9', label: 'แนวนอน', icon: <RectangleHorizontal size={20}/> }, { id: '1:1', label: 'จัตุรัส', icon: <Square size={20}/> }, { id: '9:16', label: 'แนวตั้ง', icon: <RectangleVertical size={20}/> }].map(ratio => (
                      <button key={ratio.id} type="button" onClick={() => setFormData({...formData, billboardRatio: ratio.id})} className={`flex-1 py-3 flex flex-col items-center gap-1.5 rounded-xl border ${formData.billboardRatio === ratio.id ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-white border-slate-200 text-slate-400'}`}>
                        {ratio.icon} <span className="text-[10px] font-bold">{ratio.label}</span>
                      </button>
                    ))}
                 </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">ลิงก์ปลายทาง (Website/Shopee) <span className="text-rose-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><LinkIcon size={16}/></div>
                <input 
                  type="text" /* 🚀 HOTFIX: เปลี่ยนเป็น text ป้องกัน Browser บล็อกเมื่อไม่ได้ใส่ https:// */
                  value={formData.targetUrl || ''} onChange={handleLinkChange} required 
                  placeholder={formData.type === 'BUSINESS_CARD' ? "เช่น ลิงก์เพจร้าน, แผนที่..." : "วางลิงก์ Shopee, Lazada ที่นี่..."}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500" 
                />
              </div>
            </div>

            {/* 💬 กล่องลิงก์ Facebook Messenger */}
            {formData.type === 'BUSINESS_CARD' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5 text-blue-600">ลิงก์ติดต่อ Facebook Messenger <span className="font-normal lowercase text-slate-400">- Option</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#1877F2]"><MessageCircle size={16}/></div>
                  <input 
                    type="text" /* 🚀 HOTFIX: เปลี่ยนเป็น text เพื่อแก้ปัญหาการบล็อกแบบเด็ดขาด */
                    value={formData.messengerUrl || ''} 
                    onChange={(e) => {
                      let val = e.target.value;
                      // 🌟 Smart Auto-Format: เติม https:// ให้อัตโนมัติถ้าพิมพ์แค่ m.me/...
                      if (val && !val.startsWith('http') && val.includes('m.me')) {
                        val = 'https://' + val;
                      }
                      setFormData({...formData, messengerUrl: val});
                    }} 
                    placeholder="พิมพ์ m.me/เพจของคุณ ได้เลย" 
                    className="w-full pl-11 pr-4 py-3 bg-[#1877F2]/5 border border-[#1877F2]/20 rounded-xl focus:border-[#1877F2] text-sm text-blue-800" 
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 flex justify-between">
                <span>อัปโหลดรูปภาพโฆษณา <span className="text-rose-500">*</span></span>
              </label>
              
              {/* 🖼️ แสดงรูปภาพจริงแทนไอคอนก้อนเมฆ เมื่ออัปโหลดสำเร็จ */}
              {formData.imageUrl && !uploadingImage ? (
                <div className="relative w-full h-44 bg-slate-100 rounded-2xl overflow-hidden group ring-2 ring-emerald-500 shadow-md">
                  <img src={formData.imageUrl} alt="Uploaded preview" className="w-full h-full object-contain" />
                  <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <div className="text-white flex flex-col items-center"><UploadCloud size={28} className="mb-2"/> <span className="font-bold text-sm tracking-wide">เปลี่ยนรูปภาพใหม่</span></div>
                  </label>
                </div>
              ) : (
                <label className={`relative flex flex-col items-center w-full px-4 py-8 bg-white border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-300 ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                  {uploadingImage ? (
                    <div className="flex flex-col items-center text-indigo-600 font-bold"><Loader2 size={28} className="animate-spin mb-2"/> กำลังประมวลผลรูปภาพ...</div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-500"><div className="p-3 rounded-full mb-1 bg-slate-100 text-slate-400"><UploadCloud size={24} /></div><span className="font-bold text-sm">คลิกเพื่อเลือกไฟล์รูปภาพ</span></div>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* 3. 💰 Smart Budget Estimator */}
          <div className="bg-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-lg border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[11px] font-bold text-slate-400 uppercase">กำหนดงบประมาณ (Credit Limit)</label>
              {/* ♾️ ปุ่มเปิดใช้งานโหมดไม่จำกัดงบประมาณ */}
              <label className="flex items-center gap-2 cursor-pointer bg-slate-700/50 px-3 py-1.5 rounded-full hover:bg-slate-600 transition-colors">
                 <input type="checkbox" checked={isUnlimited} onChange={(e) => setIsUnlimited(e.target.checked)} className="rounded text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5" />
                 <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1"><Infinity size={12}/> ไม่จำกัดงบ</span>
              </label>
            </div>
            
            <div className={`transition-all duration-300 ${isUnlimited ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
                <div className="flex-1">
                  <div className="relative flex items-center">
                    <input type="number" min="10" step="10" value={creditLimit === 0 ? '' : creditLimit} onChange={(e) => setCreditLimit(Number(e.target.value) || 0)} disabled={isUnlimited} className="w-full pl-4 pr-16 py-3 bg-slate-900 border border-slate-600 rounded-xl text-lg font-black text-white focus:border-indigo-400 outline-none" />
                  </div>
                  <div className="flex gap-2 mt-3">
                    {[100, 500, 1000].map(amt => (
                      <button key={amt} type="button" onClick={() => addBudget(amt)} disabled={isUnlimited} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-600/50">+{amt}</button>
                    ))}
                  </div>
                </div>
                <div className="text-left sm:text-right bg-slate-900/50 p-3.5 rounded-xl border border-slate-700/50 w-full sm:w-auto">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">คาดการณ์การมองเห็น</div>
                  <div className="text-2xl font-black text-emerald-400 flex items-baseline gap-1">{isUnlimited ? '∞' : targetImpressions} <span className="text-[10px] text-slate-500">Views</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={submittingAd || (!isUnlimited && creditLimit < 10)} 
              className={`w-full py-4.5 font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2.5 text-base sm:text-lg ${(!isUnlimited && creditLimit < 10) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:-translate-y-0.5'}`}
            >
              {submittingAd ? <><Loader2 size={22} className="animate-spin"/> กำลังส่งเข้าสู่ระบบผู้จัดการ...</> : <><CheckCircle2 size={22}/> ยืนยันการฝากโฆษณา</>}
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-3.5 font-medium flex items-center justify-center gap-1">
              <ShieldAlert size={12} className="text-emerald-500"/>
              โฆษณาจะแสดงผลหลังจากผู้จัดการตรวจสอบอนุมัติแล้วเท่านั้น
            </p>
          </div>
        </form>

        <div className="w-full lg:w-[45%] lg:pl-6 border-t lg:border-t-0 lg:border-l border-slate-100 pt-8 lg:pt-0">
          <div className="sticky top-6">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Eye className="text-indigo-500" size={18}/> ตัวอย่างการแสดงผล (Live Preview)
            </h4>
            <AdPreviewCard formData={formData} storeData={storeData} />
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdFormModal;