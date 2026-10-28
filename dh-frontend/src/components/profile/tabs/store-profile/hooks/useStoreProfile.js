import { useState } from 'react';
import { storageService } from '../../../../../firebase/storageService';
import { driveService } from '../../../../../firebase/driveService';
import { storeProfileSubmitService } from '../../../../../firebase/storeProfileSubmitService';
import { useToast } from '../../../../../context/ToastContext';
import { compressImage } from '../../../../../utils/imageCompressor';

export const MAX_GALLERY_IMAGES = 20;

export const useStoreProfile = (storeData, setStoreData, user, appId, businessCardAd, fetchMyAds, commitSavedData) => {
  const { showToast } = useToast();
  const [savingStore, setSavingStore] = useState(false);
  const [uploadingStoreImage, setUploadingStoreImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const handleStoreImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingStoreImage(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 });
      const url = await storageService.uploadStoreImage(compressed, user?.uid, 'profile');
      setStoreData(prev => ({ ...prev, storeImage: url }));
      showToast("อัปโหลดรูปโปรไฟล์ร้านเรียบร้อย", 'success');
    } catch (error) {
      console.error("🔥 Error:", error);
      showToast("อัปโหลดไม่สำเร็จ: " + error.message, 'error');
    } finally { 
      setUploadingStoreImage(false); 
      if (e.target) e.target.value = '';
    }
  };

  const handleGalleryImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const currentGallery = storeData.galleryImages || [];
    if (currentGallery.length >= MAX_GALLERY_IMAGES) {
      return showToast(`อัปโหลดได้สูงสุด ${MAX_GALLERY_IMAGES} รูป`, 'error');
    }

    const availableSlots = MAX_GALLERY_IMAGES - currentGallery.length;
    const filesToUpload = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      showToast(`เลือกได้อีก ${availableSlots} รูป (ระบบจะอัปโหลดเฉพาะ ${availableSlots} รูปแรก)`, 'info');
    }
    
    setUploadingGallery(true);
    const newUrls = [];
    try {
      for (const file of filesToUpload) {
        const compressed = await compressImage(file, { maxWidth: 1440, maxHeight: 1440, quality: 0.8 });
        const url = await storageService.uploadStoreImage(compressed, user?.uid, 'gallery');
        newUrls.push(url);
      }
      setStoreData(prev => ({
        ...prev,
        galleryImages: [...(prev.galleryImages || []), ...newUrls]
      }));
      showToast(`อัปโหลดภาพแกลเลอรี่สำเร็จ ${newUrls.length} รูป`, 'success');
    } catch (error) {
      console.error("🔥 Error:", error);
      if (newUrls.length > 0) {
        setStoreData(prev => ({
          ...prev,
          galleryImages: [...(prev.galleryImages || []), ...newUrls]
        }));
      }
      showToast("อัปโหลดไม่สำเร็จบางส่วน: " + error.message, 'error');
    } finally { 
      setUploadingGallery(false); 
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveGalleryImage = (indexToRemove) => {
    const currentGallery = storeData.galleryImages || [];
    setStoreData({ ...storeData, galleryImages: currentGallery.filter((_, idx) => idx !== indexToRemove) });
  };

  const handleToggleSupport = async (explicitVal) => {
    const nextSupport = typeof explicitVal === 'boolean' ? explicitVal : !storeData.isSupportActive;
    setStoreData(prev => ({ ...prev, isSupportActive: nextSupport }));

    if (businessCardAd && businessCardAd.id) {
      try {
        const { toggleAdStatus } = await import('../../../../../firebase/marketingService');
        await toggleAdStatus(businessCardAd.id, businessCardAd.status, 'BUSINESS_CARD');
        if (fetchMyAds) fetchMyAds();
      } catch (err) {
        console.error("🔥 Error toggling card ad status:", err);
      }
    } else if (nextSupport) {
      showToast("เปิดขอรับการสนับสนุนแล้ว อย่าลืมเลื่อนลงไปกด 'บันทึกข้อมูลร้านค้า' เพื่อส่งตรวจนะครับ", 'info');
    }
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();
    if (!storeData.storeName || !storeData.phone) {
      return showToast("กรุณากรอกข้อมูล ชื่อร้าน และ เบอร์โทร ให้ครบถ้วน", 'info');
    }
    
    setSavingStore(true);
    try {
      const updatedStoreData = await storeProfileSubmitService.saveStoreProfile(appId, user, storeData, businessCardAd);
      if (typeof commitSavedData === 'function') {
        commitSavedData(updatedStoreData);
      } else {
        setStoreData(updatedStoreData);
      }
      if (fetchMyAds) fetchMyAds();
      showToast("บันทึกข้อมูลเรียบร้อยแล้ว", 'success');
    } catch (error) {
      console.error("🔥 Error:", error);
      showToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message, 'error');
    } finally { 
      setSavingStore(false); 
    }
  };

  const isAdPending = businessCardAd?.status?.toUpperCase() === 'PENDING';

  return {
    savingStore,
    uploadingStoreImage,
    uploadingGallery,
    isAdPending,
    handleStoreImageUpload,
    handleGalleryImageUpload,
    handleRemoveGalleryImage,
    handleToggleSupport,
    handleSaveStore
  };
};
