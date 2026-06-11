import React, { useRef, useState } from 'react';
import { UploadCloud, Loader2, Star, Trash2 } from 'lucide-react';
import { driveService } from '../../../firebase/driveService';

export default function ProductImageUpload({ 
  form, setForm, 
  activeImageUrl, setActiveImageUrl,
  isUploading, setIsUploading,
  uploadProgress, setUploadProgress
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const getRenderableImageUrl = (url) => {
    if (!url) return '';
    const match = url.match(/[-\w]{25,}/);
    if (url.includes('drive.google.com') && match) {
      return `https://lh3.googleusercontent.com/d/${match[0]}`;
    }
    return url;
  };

  const handleFiles = async (files) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setIsUploading(true);
    let uploadedUrls = [];
    
    try {
      for (let i = 0; i < imageFiles.length; i++) {
        setUploadProgress(Math.round(((i) / imageFiles.length) * 100));
        const directLink = await driveService.uploadImage(imageFiles[i]);
        uploadedUrls.push(directLink);
      }
      
      setForm(prev => ({ 
        ...prev, 
        images: [...prev.images, ...uploadedUrls]
      }));

      if (!activeImageUrl && uploadedUrls.length > 0) {
        setActiveImageUrl(uploadedUrls[0]);
      }
      
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการอัปโหลดภาพ: " + error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (indexToRemove, urlToRemove) => {
    setForm(prev => {
      const newImages = prev.images.filter((_, idx) => idx !== indexToRemove);
      if (activeImageUrl === urlToRemove) {
        setActiveImageUrl(newImages.length > 0 ? newImages[0] : '');
      }
      return { ...prev, images: newImages };
    });
  };

  const setCoverImage = (indexToCover) => {
    if (indexToCover === 0) return;
    setForm(prev => {
      const newImages = [...prev.images];
      const selected = newImages.splice(indexToCover, 1)[0];
      newImages.unshift(selected); 
      setActiveImageUrl(selected);
      return { ...prev, images: newImages };
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div 
        className={`w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden relative group transition-all cursor-pointer shadow-inner
          ${isDragOver ? 'border-dh-accent bg-dh-accent-light/20' : 'border-dh-border bg-dh-base hover:bg-dh-surface'}
        `}
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
        onClick={() => !isUploading && fileInputRef.current.click()}
      >
        <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={e => handleFiles(e.target.files)} />
        
        {isUploading ? (
          <div className="flex flex-col items-center text-dh-accent">
            <Loader2 size={36} className="animate-spin mb-2" />
            <span className="font-bold text-xs">กำลังเชื่อมต่อ Drive...</span>
            <span className="text-[10px] font-mono mt-1">{uploadProgress}%</span>
          </div>
        ) : activeImageUrl ? (
          <div className="w-full h-full relative bg-dh-surface">
            <img src={getRenderableImageUrl(activeImageUrl)} alt="Active" className="w-full h-full object-contain" 
                 onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300?text=Image+Error'; }} />
            
            {activeImageUrl === form.images[0] && (
              <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-sm flex items-center gap-1 border border-yellow-500">
                <Star size={12}/> ภาพปก
              </div>
            )}
            <div className="absolute inset-0 bg-dh-main/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white font-bold text-sm flex items-center gap-2 bg-black/50 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
                <UploadCloud size={18}/> ลากภาพวางเพิ่ม
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center p-4">
            <div className="w-14 h-14 bg-dh-surface shadow-sm border border-dh-border rounded-full flex items-center justify-center mx-auto mb-3 text-dh-accent">
              <UploadCloud size={24} />
            </div>
            <p className="font-bold text-sm">ลากไฟล์ภาพวางที่นี่</p>
            <p className="text-[10px] text-dh-muted mt-1 uppercase tracking-wide">หรือคลิกเพื่อเลือกไฟล์</p>
          </div>
        )}
      </div>
      
      {form.images.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {form.images.map((imgUrl, idx) => (
            <div key={idx} 
                 onClick={() => setActiveImageUrl(imgUrl)}
                 className={`aspect-square rounded-lg border-2 overflow-hidden relative group cursor-pointer transition-all bg-dh-base
                 ${activeImageUrl === imgUrl ? 'border-dh-accent shadow-sm scale-[1.02]' : 'border-dh-border hover:border-dh-accent/50'}`}>
              
              <img src={getRenderableImageUrl(imgUrl)} alt={`Thumb ${idx}`} className="w-full h-full object-cover" 
                   onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=Err'; }} />
              
              {idx === 0 && <div className="absolute top-0 left-0 bg-yellow-400 text-white p-0.5 rounded-br-lg"><Star size={10}/></div>}
              <div className="absolute inset-0 bg-dh-main/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 backdrop-blur-[1px]">
                {idx !== 0 && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setCoverImage(idx); }} className="p-1.5 bg-dh-surface text-yellow-500 rounded-full hover:bg-yellow-50 hover:text-yellow-600 shadow-sm transition-colors" title="ตั้งเป็นภาพปก"><Star size={12}/></button>
                )}
                <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(idx, imgUrl); }} className="p-1.5 bg-dh-surface text-red-500 rounded-full hover:bg-red-50 hover:text-red-600 shadow-sm transition-colors" title="ลบภาพ"><Trash2 size={12}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
