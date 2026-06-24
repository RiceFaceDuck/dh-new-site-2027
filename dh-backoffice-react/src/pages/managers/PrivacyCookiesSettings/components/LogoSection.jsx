import React, { useState, useRef } from 'react';
import { Image, Upload, Loader2 } from 'lucide-react';
import { driveService } from '../../../../firebase/driveService';

export default function LogoSection({ logoUrl, updateConfig }) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const uploadedUrl = await driveService.uploadImage(file);
            updateConfig('logoUrl', uploadedUrl);
        } catch (error) {
            console.error('Failed to upload image:', error);
            alert('อัปโหลดรูปภาพล้มเหลว กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsUploading(false);
            // Reset input so the same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Image size={18} className="text-blue-500" />
                โลโก้สำหรับหน้าต่าง Cookies (160x160 px)
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="w-40 h-40 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Cookie Logo" className="w-full h-full object-contain p-2 transition-opacity group-hover:opacity-50" />
                    ) : (
                        <span className="text-sm text-slate-400">No Image</span>
                    )}
                    
                    {/* Hover Upload Overlay */}
                    <div 
                        onClick={handleUploadClick}
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-opacity ${logoUrl ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 hover:opacity-100'}`}
                    >
                        <Upload className="text-white" size={24} />
                    </div>
                    
                    {isUploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <Loader2 className="animate-spin text-blue-600" size={24} />
                        </div>
                    )}
                </div>
                
                <div className="w-full space-y-3">
                    <label className="block text-sm font-medium text-slate-700">URL รูปภาพโลโก้ หรือ อัปโหลดไฟล์</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={logoUrl}
                            onChange={(e) => updateConfig('logoUrl', e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-sm"
                            placeholder="https://..."
                        />
                        <button
                            type="button"
                            onClick={handleUploadClick}
                            disabled={isUploading}
                            className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 font-medium text-sm flex items-center gap-2 shrink-0 transition-colors disabled:opacity-50"
                        >
                            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            อัปโหลด
                        </button>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/png, image/jpeg, image/webp" 
                        className="hidden" 
                    />
                    <p className="text-xs text-slate-500">
                        * แนะนำให้ใช้รูปทรงสี่เหลี่ยมจัตุรัส ขนาด 160x160 pixel แบบโปร่งใส (PNG) <br />
                        * ไฟล์จะถูกอัปโหลดและจัดเก็บไว้ใน Google Drive ของระบบอัตโนมัติ
                    </p>
                </div>
            </div>
        </div>
    );
}
