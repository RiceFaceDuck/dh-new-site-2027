import { ImageIcon, UploadCloud, Loader2 } from 'lucide-react';
import { getRenderableImageUrl, handleImageError } from 'dh-shared/src/utils/imageProcessingUtils.js';

export default function HeroImageUpload({ imageUrl, onUpload, isUploading }) {
    return (
        <div className="bg-white border border-slate-300 rounded-[2px] p-5 shadow-sm space-y-3">
            <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={18} className="text-blue-600" /> รูปภาพป้ายโฆษณา (Google Drive)
            </label>
            
            <div className="flex flex-col md:flex-row gap-5">
                <div className="w-full md:w-1/2 aspect-video bg-slate-100 rounded-[2px] overflow-hidden border-2 border-dashed border-slate-300 relative flex items-center justify-center">
                    {imageUrl ? (
                        <img 
                            src={getRenderableImageUrl(imageUrl)} 
                            alt="Hero Preview" 
                            referrerPolicy="no-referrer"
                            onError={(e) => handleImageError(e, imageUrl)}
                            className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" 
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
                        <span className="text-xs font-medium text-slate-500">ขนาดแนะนำ: 1200x800px หรืออัตราส่วน 16:9 (ไม่เกิน 5MB)</span>
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
                            <Loader2 size={16} className="animate-spin text-blue-600" /> กำลังอัพโหลดไปที่ Google Drive...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
