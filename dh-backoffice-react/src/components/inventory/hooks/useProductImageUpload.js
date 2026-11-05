import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { productStorageService } from '../../../firebase/productStorageService';

/**
 * 🎣 useProductImageUpload Hook
 * Controller จัดการลอจิกการอัปโหลดรูปภาพ จัดลำดับรูปภาพปก ซ่อนภาพ และคิวลบภาพ
 * ตามหลัก Clean Architecture & Single Responsibility Principle
 */
export default function useProductImageUpload({
  form,
  setForm,
  activeImageUrl,
  setActiveImageUrl,
  isUploading,
  setIsUploading,
  uploadProgress,
  setUploadProgress
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // ติดตามรูปที่เพิ่งอัปโหลดในเซสชันนี้ (สำหรับลบออกทันทีหากผู้ใช้กดถังขยะก่อนบันทึก)
  const [sessionUploadedUrls, setSessionUploadedUrls] = useState([]);

  const handleFiles = async (files) => {
    const imageFiles = Array.from(files || []).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setIsUploading(true);
    const newUploadedUrls = [];

    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const progressBase = Math.round((i / imageFiles.length) * 100);
        
        const directLink = await productStorageService.uploadProductImage(
          file, 
          form?.sku || 'general',
          (percent) => {
            const stepPercent = Math.round(progressBase + (percent / imageFiles.length));
            setUploadProgress(Math.min(99, stepPercent));
          }
        );

        newUploadedUrls.push(directLink);
      }

      setForm(prev => {
        const currentImages = Array.isArray(prev.images) ? prev.images : [];
        const nextImages = [...currentImages, ...newUploadedUrls];
        return {
          ...prev,
          images: nextImages,
          image: prev.image || nextImages[0] || null
        };
      });

      setSessionUploadedUrls(prev => [...prev, ...newUploadedUrls]);

      if (!activeImageUrl && newUploadedUrls.length > 0) {
        setActiveImageUrl(newUploadedUrls[0]);
      }

      toast.success(`อัปโหลดรูปภาพสำเร็จ ${newUploadedUrls.length} รูป`);

    } catch (error) {
      console.error("🔥 Image Upload Error:", error);
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

  const removeImage = async (indexToRemove, urlToRemove) => {
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

    // 🛡️ Hybrid Deletion: หากเป็นรูปที่เพิ่งอัปโหลดในรอบนี้ ให้ลบไฟล์จริงออกจาก Storage ทันที
    if (urlToRemove && sessionUploadedUrls.includes(urlToRemove)) {
      try {
        await productStorageService.deleteProductImage(urlToRemove);
        setSessionUploadedUrls(prev => prev.filter(u => u !== urlToRemove));
      } catch (err) {
        console.warn("Could not delete session image immediately:", err);
      }
    }
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

  return {
    isDragOver,
    fileInputRef,
    handleFiles,
    onDragOver,
    onDragLeave,
    onDrop,
    removeImage,
    setCoverImage,
    toggleVisibility
  };
}
