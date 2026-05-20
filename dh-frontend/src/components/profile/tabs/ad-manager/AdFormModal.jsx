/* eslint-disable react/prop-types */
import React from 'react';
import { Megaphone, X, Link as LinkIcon, UploadCloud, Video, Loader2, CheckCircle2, Lock, Activity } from 'lucide-react';
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
  return (
    <div className="bg-white border border-[#0870B8]/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#0870B8] opacity-5 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
      
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
            <Megaphone className="text-[#0870B8]"/> ฝากลิงก์โปรโมทสินค้า
          </h3>
          <p className="text-sm text-slate-500 mt-1">ตั้งค่างบประมาณโฆษณาของคุณ ระบบจะหักแต้มเมื่อมีการแสดงผลจริงเท่านั้น</p>
        </div>
        <button onClick={onCloseForm} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-rose-500">
          <X size={24} />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmitAd} className="w-full lg:w-1/2 space-y-5">

          <div className="flex gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer flex-1 justify-center">
              <input type="radio" name="adType" value="product" checked={formData.type === 'product'} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-4 h-4 text-[#0870B8]" />
              <span className="text-sm font-bold text-slate-700">Product Ad (1:1)</span>
            </label>
            <div className="w-px bg-slate-200"></div>
            <label className="flex items-center gap-2 cursor-pointer flex-1 justify-center">
              <input type="radio" name="adType" value="billboard" checked={formData.type === 'billboard'} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-4 h-4 text-[#0870B8]" />
              <span className="text-sm font-bold text-slate-700">Billboard Ad (16:9)</span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">1. ชื่อสินค้าที่จะโปรโมท <span className="text-rose-500">*</span></label>
              <input 
                type="text" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="เช่น กล้องวงจรปิดไร้สาย WiFi รุ่นใหม่ล่าสุด" required maxLength={50}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                <span>2. ลิงก์ร้านค้าปลายทาง <span className="text-rose-500">*</span></span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold text-white uppercase shadow-sm transition-colors ${
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
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><LinkIcon size={16}/></div>
                <input 
                  type="url" value={formData.targetUrl || ''} onChange={handleLinkChange}
                  placeholder="วางลิงก์ Shopee, Lazada, Tiktok ที่นี่..." required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                3. อัปโหลดรูปภาพ <span className="text-rose-500">*</span> 
                <span className="text-[10px] text-slate-400 font-normal ml-2">
                  ({formData.type === 'product' ? 'อัตราส่วน 1:1' : 'อัตราส่วน 16:9'}) ขนาดไม่เกิน 5MB
                </span>
              </label>
              <label className={`relative flex items-center justify-center w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                <input 
                  type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage}
                  className="hidden" 
                />
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-2 text-[#0870B8] font-medium">
                    <Loader2 size={24} className="animate-spin"/> กำลังอัปโหลดภาพ...
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <UploadCloud size={28} className={formData.imageUrl ? 'text-emerald-500' : 'text-slate-400'}/> 
                    <span className="font-bold text-sm">
                      {formData.imageUrl ? 'เปลี่ยนรูปภาพใหม่' : 'คลิกเพื่อเลือกไฟล์รูปภาพ'}
                    </span>
                  </div>
                )}
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">4. ข้อความกระตุ้นยอดขาย (สั้นๆ)</label>
              <input 
                type="text" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="เช่น โค้ดลด 50%, ส่งฟรี, Flash Sale!" maxLength={30}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] text-sm"
              />
            </div>

            {formData.type === 'product' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">5. Video Review (YouTube Link) - <span className="font-normal lowercase text-slate-400">Optional</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-rose-500"><Video size={16}/></div>
                  <input 
                    type="url" value={formData.youtubeUrl || ''} onChange={(e) => setFormData({...formData, youtubeUrl: e.target.value})}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ตั้งค่างบประมาณ (Pay Per Impression Logic) */}
          <div className={`p-5 rounded-xl mb-4 border ${remainingCredit < 0 ? 'bg-rose-50 border-rose-200' : 'bg-blue-50 border-blue-200'}`}>
            <label className={`block text-xs font-bold uppercase tracking-wide mb-3 ${remainingCredit < 0 ? 'text-rose-800' : 'text-blue-800'}`}>
              ตั้งค่างบประมาณโฆษณา (Credit Limit)
            </label>
            
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 w-full">
                <div className="relative flex items-center">
                  <input 
                    type="number" 
                    min="10" 
                    step="10"
                    value={creditLimit === 0 ? '' : creditLimit} 
                    onChange={(e) => setCreditLimit(Number(e.target.value) || 0)}
                    className="w-full pl-4 pr-12 py-2 border border-blue-200 rounded-lg text-sm font-bold text-slate-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute right-3 text-sm text-slate-400 font-medium">แต้ม</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                  <Activity size={12}/> หัก 1 Credit ต่อการแสดงผล 1 ครั้ง
                </p>
              </div>
              
              <div className="text-right whitespace-nowrap min-w-[120px]">
                <div className="text-sm font-bold text-slate-600">แสดงผลได้: <span className="text-xl text-[#0870B8]">{targetImpressions.toLocaleString()}</span> <span className="text-xs font-normal">ครั้ง</span></div>
                <div className={`text-[11px] mt-1 font-medium ${remainingCredit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {remainingCredit < 0 ? `แต้มไม่พอ (ขาดอีก ${Math.abs(remainingCredit)})` : `คงเหลือ(ถ้ารันเต็มงบ): ${remainingCredit}`}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={submittingAd || remainingCredit < 0 || creditLimit <= 0} 
              className={`w-full py-4 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2 text-base sm:text-lg ${
                (remainingCredit < 0 || creditLimit <= 0)
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
                  : 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg'
              }`}
            >
              {submittingAd ? (
                <><Loader2 size={20} className="animate-spin"/> กำลังดำเนินการ...</>
              ) : remainingCredit < 0 ? (
                <><Lock size={20}/> เครดิตไม่เพียงพอ</>
              ) : (
                <><CheckCircle2 size={20}/> ส่งคำร้อง (ยังไม่หักแต้ม)</>
              )}
            </button>
            <p className="text-center text-xs text-slate-400 mt-3 font-medium">
              * ไม่หักแต้มตอนกดส่ง ระบบจะหักเฉพาะตอนที่โฆษณาถูกมองเห็นหน้าเว็บจริงๆ
            </p>
          </div>
        </form>

        {/* ---------------- Live Preview (แสดงผลแบบเรียลไทม์) ---------------- */}
        <AdPreviewCard formData={formData} storeData={storeData} />
      </div>
    </div>
  );
};

export default AdFormModal;