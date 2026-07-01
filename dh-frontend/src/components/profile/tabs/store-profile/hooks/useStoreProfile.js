import { useState } from 'react';
import { driveService } from '../../../../../firebase/driveService';
import { storeProfileSubmitService } from '../../../../../firebase/storeProfileSubmitService';

export const useStoreProfile = (storeData, setStoreData, user, appId, businessCardAd, fetchMyAds) => {
  const [savingStore, setSavingStore] = useState(false);
  const [uploadingStoreImage, setUploadingStoreImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const handleStoreImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("ไฟล์ใหญ่เกินไป (Max 5MB)");
    
    setUploadingStoreImage(true);
    try {
      const url = await driveService.uploadAdImage(file, 'STORE_PROFILE');
      setStoreData({ ...storeData, storeImage: url });
    } catch (error) {
      alert("อัปโหลดไม่สำเร็จ: " + error.message);
    } finally { 
      setUploadingStoreImage(false); 
    }
  };

  const handleGalleryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("ไฟล์ใหญ่เกินไป (Max 5MB)");
    
    setUploadingGallery(true);
    try {
      const url = await driveService.uploadAdImage(file, 'STORE_GALLERY');
      const currentGallery = storeData.galleryImages || [];
      if (currentGallery.length >= 5) return alert("อัปโหลดได้สูงสุด 5 รูป");
      setStoreData({ ...storeData, galleryImages: [...currentGallery, url] });
    } catch (error) {
      alert("อัปโหลดไม่สำเร็จ: " + error.message);
    } finally { 
      setUploadingGallery(false); 
    }
  };

  const handleRemoveGalleryImage = (indexToRemove) => {
    const currentGallery = storeData.galleryImages || [];
    setStoreData({ ...storeData, galleryImages: currentGallery.filter((_, idx) => idx !== indexToRemove) });
  };

  const handleToggleSupport = () => {
    setStoreData({ ...storeData, isSupportActive: !storeData.isSupportActive });
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();
    if (!storeData.storeName || !storeData.phone) {
      return alert("กรุณากรอกข้อมูล ชื่อร้าน และ เบอร์โทร ให้ครบถ้วน");
    }
    
    setSavingStore(true);
    try {
      const updatedStoreData = await storeProfileSubmitService.saveStoreProfile(appId, user, storeData, businessCardAd);
      setStoreData(updatedStoreData);
      if (fetchMyAds) fetchMyAds();
      alert("บันทึกข้อมูลเรียบร้อยแล้ว");
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
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
