import { useState } from 'react';
import { driveService } from '../../../../../firebase/driveService';
import { storeProfileSubmitService } from '../../../../../firebase/storeProfileSubmitService';
import { useToast } from '../../../../../context/ToastContext';

export const useStoreProfile = (storeData, setStoreData, user, appId, businessCardAd, fetchMyAds) => {
  const { showToast } = useToast();
  const [savingStore, setSavingStore] = useState(false);
  const [uploadingStoreImage, setUploadingStoreImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const handleStoreImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showToast("ไฟล์ใหญ่เกินไป (Max 5MB)", 'error');
    
    setUploadingStoreImage(true);
    try {
      const url = await driveService.uploadAdImage(file, 'STORE_PROFILE');
      setStoreData({ ...storeData, storeImage: url });
    } catch (error) {
      console.error("🔥 Error:", error);
      showToast("อัปโหลดไม่สำเร็จ: " + error.message, 'error');
    } finally { 
      setUploadingStoreImage(false); 
    }
  };

  const handleGalleryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showToast("ไฟล์ใหญ่เกินไป (Max 5MB)", 'error');
    
    setUploadingGallery(true);
    try {
      const url = await driveService.uploadAdImage(file, 'STORE_GALLERY');
      const currentGallery = storeData.galleryImages || [];
      if (currentGallery.length >= 5) return showToast("อัปโหลดได้สูงสุด 5 รูป", 'error');
      setStoreData({ ...storeData, galleryImages: [...currentGallery, url] });
    } catch (error) {
      console.error("🔥 Error:", error);
      showToast("อัปโหลดไม่สำเร็จ: " + error.message, 'error');
    } finally { 
      setUploadingGallery(false); 
    }
  };

  const handleRemoveGalleryImage = (indexToRemove) => {
    const currentGallery = storeData.galleryImages || [];
    setStoreData({ ...storeData, galleryImages: currentGallery.filter((_, idx) => idx !== indexToRemove) });
  };

  const handleToggleSupport = async () => {
    const nextSupport = !storeData.isSupportActive;
    setStoreData(prev => ({ ...prev, isSupportActive: nextSupport }));

    if (businessCardAd && businessCardAd.id) {
      try {
        const { toggleAdStatus } = await import('../../../../../firebase/marketingService');
        await toggleAdStatus(businessCardAd.id, businessCardAd.status, 'BUSINESS_CARD');
        if (fetchMyAds) fetchMyAds();
      } catch (err) {
        console.error("🔥 Error toggling card ad status:", err);
      }
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
      setStoreData(updatedStoreData);
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
