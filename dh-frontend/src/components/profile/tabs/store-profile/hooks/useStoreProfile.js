import { useState } from 'react';
import { driveService } from '../../../../../firebase/driveService';
import { storeProfileSubmitService } from '../../../../../firebase/storeProfileSubmitService';

export const useStoreProfile = (storeData, setStoreData, user, appId, businessCardAd, fetchMyAds) => {
  const [savingStore, setSavingStore] = useState(false);
  const [uploadingStoreImage, setUploadingStoreImage] = useState(false);

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
    isAdPending,
    handleStoreImageUpload,
    handleToggleSupport,
    handleSaveStore
  };
};
