import React from 'react';
import { ImageIcon, UploadCloud, Loader2 } from 'lucide-react';

export default function HeroImageUpload({ imageUrl, onUpload, isUploading }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <label className="text-sm font-black text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                <ImageIcon size={18} className="text-blue-500" /> รูปภาพป้ายโฆษณา (Google Drive)
            </label>
            
            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2 aspect-video bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 relative flex items-center justify-center dh-inner-shadow">
                    {imageUrl ? (
                        <img src={imageUrl} alt="Hero Preview" className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                    ) : (
                        <span className="text-slate-400 font-bold">ไม่มีรูปภาพ</span>
                    )}
                </div>
                <div className="w-full md:w-1/2 flex flex-col justify-center space-y-4">
                    <label className={`relative cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-4 px-6 rounded-xl border-2 border-blue-200 text-center transition-all flex flex-col items-center gap-2 dh-active-press ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <UploadCloud size={32} className={isUploading ? "animate-bounce" : ""} />
                        <span>คลิกเพื่ออัพโหลดรูปใหม่</span>
                        <span className="text-xs font-normal text-blue-500">ขนาดแนะนำ: 1200x800px (ไม่เกิน 5MB)</span>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={onUpload} 
                            className="hidden" 
                            disabled={isUploading} 
                        />
                    </label>
                    {isUploading && (
                        <div className="flex items-center justify-center gap-2 text-blue-500 font-bold text-sm bg-blue-50/50 p-2 rounded-lg animate-pulse">
                            <Loader2 size={16} className="animate-spin" /> กำลังอัพโหลดไปที่ Google Drive...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
