import { toast } from 'react-hot-toast';
import React, { useRef, useState } from 'react';
import { UploadCloud, Loader2, Star, Trash2, Eye, EyeOff } from 'lucide-react';
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
      
      setForm(prev => {
        const currentImages = Array.isArray(prev.images) ? prev.images : [];
        const nextImages = [...currentImages, ...uploadedUrls];
        return { 
          ...prev, 
          images: nextImages,
          image: prev.image || nextImages[0] || null
        };
      });

      if (!activeImageUrl && uploadedUrls.length > 0) {
        setActiveImageUrl(uploadedUrls[0]);
      }
      
    } catch (error) {
      console.error("🔥 Error:", error);
      toast.error(error?.message || "เกิดข้อผิดพลาดในการอัปโหลดภาพ");
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
      const currentImages = Array.isArray(prev.images) ? prev.images : [];
      const currentHidden = Array.isArray(prev.hiddenImages) ? prev.hiddenImages : [];
      const newImages = currentImages.filter((_, idx) => idx !== indexToRemove);
      const newHidden = urlToRemove ? currentHidden.filter(url => url !== urlToRemove) : currentHidden;

      if (activeImageUrl === urlToRemove) {
        setActiveImageUrl(newImages.length > 0 ? newImages[0] : '');
      }
      return { 
        ...prev, 
        images: newImages,
        hiddenImages: newHidden,
        image: newImages[0] || null
      };
    });
  };

  const setCoverImage = (indexToCover) => {
    if (indexToCover === 0) return;
    setForm(prev => {
      const currentImages = Array.isArray(prev.images) ? prev.images : [];
      const newImages = [...currentImages];
      const selected = newImages.splice(indexToCover, 1)[0];
      if (selected) {
        newImages.unshift(selected); 
        setActiveImageUrl(selected);
      }
      return { 
        ...prev, 
        images: newImages,
        image: newImages[0] || null
      };
    });
  };

  const toggleVisibility = (imgUrl) => {
    setForm(prev => {
      const hidden = prev.hiddenImages || [];
      if (hidden.includes(imgUrl)) {
        return { ...prev, hiddenImages: hidden.filter(url => url !== imgUrl) };
      } else {
        return { ...prev, hiddenImages: [...hidden, imgUrl] };
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div 
        className={`w-full aspect-video rounded-[2px] border-2 border-dashed flex flex-col items-center justify-center overflow-hidden relative group transition-all cursor-pointer shadow-sm
          ${isDragOver ? 'border-slate-900 bg-slate-200/50 dark:border-orange-500 dark:bg-orange-950/20' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400'}
        `}
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
        onClick={() => !isUploading && fileInputRef.current.click()}
      >
        <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={e => handleFiles(e.target.files)} />
        
        {isUploading ? (
          <div className="flex flex-col items-center text-slate-800 dark:text-orange-500">
            <Loader2 size={36} className="animate-spin mb-2" />
            <span className="font-bold text-xs">กำลังเชื่อมต่อ Drive...</span>
            <span className="text-[10px] font-mono mt-1">{uploadProgress}%</span>
          </div>
        ) : activeImageUrl ? (
          <div className="w-full h-full relative bg-white dark:bg-slate-900 flex items-center justify-center">
            <img src={getRenderableImageUrl(activeImageUrl)} alt="Active" className="w-full h-full object-contain" 
                 onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300?text=Image+Error'; }}  loading="lazy" />
            
            {activeImageUrl === form.images[0] && (
              <div className="absolute top-2.5 left-2.5 bg-yellow-400 text-yellow-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[2px] shadow-xs flex items-center gap-1 border border-yellow-500">
                <Star size={11}/> ภาพปก
              </div>
            )}
            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white font-bold text-xs flex items-center gap-2 bg-black/60 px-3.5 py-2 rounded-xl backdrop-blur-xs border border-white/20">
                <UploadCloud size={16}/> ลากภาพวางเพิ่ม
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 shadow-xs border border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-700 dark:text-slate-200">
              <UploadCloud size={22} />
            </div>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">ลากไฟล์ภาพวางที่นี่</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wide">หรือคลิกเพื่อเลือกไฟล์</p>
          </div>
        )}
      </div>
      
      {(form.images || []).length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {(form.images || []).map((imgUrl, idx) => {
            const isHidden = form.hiddenImages?.includes(imgUrl);
            return (
              <div key={idx} 
                   onClick={() => setActiveImageUrl(imgUrl)}
                   className={`aspect-square rounded-[2px] border-2 overflow-hidden relative group cursor-pointer transition-all bg-white dark:bg-slate-900 shadow-xs
                   ${activeImageUrl === imgUrl ? 'border-slate-900 dark:border-orange-500 ring-2 ring-slate-900/10' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'}`}>
                
                <img src={getRenderableImageUrl(imgUrl)} alt={`Thumb ${idx}`} className={`w-full h-full object-cover ${isHidden ? 'opacity-40 grayscale' : ''}`} 
                     onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=Err'; }}  loading="lazy" />
                
                {idx === 0 && <div className="absolute top-0 left-0 bg-yellow-400 text-white p-0.5 rounded-br-lg z-10"><Star size={10}/></div>}
                {isHidden && <div className="absolute top-0 right-0 bg-slate-500 text-white p-0.5 rounded-bl-lg z-10"><EyeOff size={10}/></div>}
                
                <div className="absolute inset-0 bg-dh-main/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap items-center justify-center gap-1.5 backdrop-blur-[1px] p-1">
                  {idx !== 0 && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setCoverImage(idx); }} className="p-1.5 bg-dh-surface text-yellow-500 rounded-full hover:bg-yellow-50 hover:text-yellow-600 shadow-xs transition-colors" title="ตั้งเป็นภาพปก"><Star size={12}/></button>
                  )}
                  <button type="button" onClick={(e) => { e.stopPropagation(); toggleVisibility(imgUrl); }} className="p-1.5 bg-dh-surface text-blue-500 rounded-full hover:bg-blue-50 hover:text-blue-600 shadow-xs transition-colors" title={isHidden ? "เปิดแสดงผล" : "ซ่อนภาพนี้"}>
                    {isHidden ? <Eye size={12}/> : <EyeOff size={12}/>}
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(idx, imgUrl); }} className="p-1.5 bg-dh-surface text-red-500 rounded-full hover:bg-red-50 hover:text-red-600 shadow-xs transition-colors" title="ลบภาพ"><Trash2 size={12}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
