import { ImageIcon, UploadCloud, Loader2, Check } from 'lucide-react';
import { getRenderableImageUrl, handleImageError } from 'dh-shared/src/utils/imageProcessingUtils.js';

export default function HeroImageUpload({ imageUrl, onUpload, isUploading, imageFit = 'contain', onFitChange }) {
    return (
        <div className="bg-white border border-slate-300 rounded-[2px] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={18} className="text-blue-600" /> รูปภาพป้ายโฆษณา (Firebase Storage)
                </label>
                {onFitChange && (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-[2px] border border-blue-300">
                        {imageFit === 'contain' ? 'เห็นครบทั้งภาพ 100%' : 'เต็มกล่องตัดขอบ'}
                    </span>
                )}
            </div>
            
            <div className="flex flex-col md:flex-row gap-5">
                <div className="w-full md:w-1/2 aspect-video bg-slate-900 rounded-[2px] overflow-hidden border-2 border-dashed border-slate-300 relative flex items-center justify-center p-1">
                    {imageUrl ? (
                        <img 
                            src={getRenderableImageUrl(imageUrl)} 
                            alt="Hero Preview" 
                            referrerPolicy="no-referrer"
                            onError={(e) => handleImageError(e, imageUrl)}
                            className={`w-full h-full transition-transform duration-300 ${
                                imageFit === 'contain' ? 'object-contain' : 'object-cover hover:scale-105'
                            }`} 
                            loading="lazy" 
                        />
                    ) : (
                        <span className="text-slate-500 font-bold text-xs">ไม่มีรูปภาพ</span>
                    )}
                </div>
                <div className="w-full md:w-1/2 flex flex-col justify-center space-y-3">
                    <label className={`relative cursor-pointer bg-slate-50 hover:bg-blue-50/70 text-blue-700 font-bold py-4 px-5 rounded-[2px] border-2 border-dashed border-blue-300 hover:border-blue-400 text-center transition-all flex flex-col items-center gap-2 dh-active-press ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <UploadCloud size={28} className={isUploading ? "animate-bounce text-blue-600" : "text-blue-600"} />
                        <span className="text-sm">คลิกเพื่ออัพโหลดรูปใหม่</span>
                        <span className="text-xs font-medium text-slate-500">ระบบบีบอัดภาพ WebP ให้อัตโนมัติ คมชัดระดับ Full HD และโหลดไว</span>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={onUpload} 
                            className="hidden" 
                            disabled={isUploading} 
                        />
                    </label>
                    {isUploading && (
                        <div className="flex items-center justify-center gap-2 text-blue-700 font-bold text-xs bg-blue-100/70 p-2.5 rounded-[2px] border border-blue-300 animate-pulse">
                            <Loader2 size={16} className="animate-spin text-blue-600" /> กำลังบีบอัดและอัปโหลดไปที่ Firebase Storage...
                        </div>
                    )}
                </div>
            </div>

            {/* Image Fit Selection */}
            {onFitChange && (
                <div className="pt-2 border-t border-slate-200">
                    <label className="text-xs font-bold text-slate-700 block mb-2">
                        รูปแบบการจัดวางรูปในกรอบ (Image Fit Style):
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => onFitChange('contain')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-[2px] border text-xs font-bold transition-all cursor-pointer ${
                                imageFit === 'contain'
                                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                        >
                            {imageFit === 'contain' && <Check size={14} />}
                            <span>เห็นครบทั้งภาพ (Contain - ไม่ตัดขอบ)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onFitChange('cover')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-[2px] border text-xs font-bold transition-all cursor-pointer ${
                                imageFit === 'cover'
                                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                        >
                            {imageFit === 'cover' && <Check size={14} />}
                            <span>เต็มกล่อง (Cover - ตัดขอบบนล่าง/ข้าง)</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
