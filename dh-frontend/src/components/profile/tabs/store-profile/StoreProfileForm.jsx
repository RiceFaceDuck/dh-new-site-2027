import React from 'react';
import { Store } from 'lucide-react';
import StoreProfileBasicInfo from './StoreProfileBasicInfo';
import StoreProfileSocialLinks from './StoreProfileSocialLinks';
import StoreProfileLocation from './StoreProfileLocation';

import { useStoreProfile } from './hooks/useStoreProfile';
import { useGeolocation } from '../../../../hooks/useGeolocation';
import { useToast } from '../../../../context/ToastContext';

const StoreProfileForm = ({ storeData, setStoreData, user, appId, businessCardAd, fetchMyAds }) => {
  const { showToast } = useToast();
  const {
    savingStore,
    uploadingStoreImage,
    uploadingGallery,
    isAdPending,
    handleStoreImageUpload,
    handleGalleryImageUpload,
    handleRemoveGalleryImage,
    handleToggleSupport,
    handleSaveStore
  } = useStoreProfile(storeData, setStoreData, user, appId, businessCardAd, fetchMyAds);

  const { getUserCurrentLocation } = useGeolocation();

  const handleGetLocation = async () => {
    try {
      const coords = await getUserCurrentLocation();
      setStoreData({ ...storeData, latitude: coords.latitude, longitude: coords.longitude });
    } catch (error) {
      console.error("🔥 Error:", error);
      showToast(error.message, 'error');
    }
  };

  const isCardLive = businessCardAd ? ['APPROVED', 'ACTIVE'].includes(String(businessCardAd.status).toUpperCase()) : storeData.isSupportActive;

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden animate-in fade-in duration-300">
      
      <div className="bg-slate-900 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2"><Store className="text-indigo-400"/> ศูนย์ข้อมูลร้านค้า (Store Profile)</h3>
          <p className="text-[11px] text-slate-400 mt-1">ข้อมูลในหน้านี้จะถูกนำไปใช้สร้าง <b>"โฆษณานามบัตร"</b> และแสดงผลบนแผนที่เรดาร์อัตโนมัติ</p>
        </div>
        
        <div className="bg-slate-800 p-3 rounded-2xl flex items-center gap-4 border border-slate-700">
          <div className="text-right">
            <div className="text-xs font-bold text-white uppercase tracking-widest">นามบัตรโฆษณา</div>
            <div className="text-[10px]">
              {businessCardAd?.status?.toUpperCase() === 'PAUSED' ? (
                <span className="text-orange-400 font-bold">🟠 ถูกระงับการแสดงผล (Paused)</span>
              ) : isAdPending ? (
                <span className="text-amber-400 animate-pulse font-bold">🟡 รอตรวจสอบ (Pending)</span>
              ) : isCardLive ? (
                <span className="text-emerald-400 font-bold">🟢 โฆษณาทำงานอยู่ (Live)</span>
              ) : businessCardAd?.status?.toUpperCase() === 'REJECTED' ? (
                <span className="text-rose-400 font-bold">🔴 ไม่ผ่านอนุมัติ</span>
              ) : !storeData.isSupportActive ? (
                <span className="text-slate-400">⚫ ปิดการแสดงผล</span>
              ) : (
                <span className="text-amber-400">🟡 รอการบันทึก</span>
              )}
            </div>
          </div>
          
          <label className={`relative inline-flex items-center ${isAdPending ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={isCardLive} 
              onChange={handleToggleSupport} 
              disabled={isAdPending} 
            />
            <div className="w-14 h-7 bg-slate-600 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
          </label>
        </div>
      </div>

      <form onSubmit={handleSaveStore} className="p-6 md:p-8 space-y-10">
        
        <StoreProfileBasicInfo 
          storeData={storeData} 
          setStoreData={setStoreData} 
          uploadingStoreImage={uploadingStoreImage} 
          handleStoreImageUpload={handleStoreImageUpload} 
          uploadingGallery={uploadingGallery}
          handleGalleryImageUpload={handleGalleryImageUpload}
          handleRemoveGalleryImage={handleRemoveGalleryImage}
        />

        <StoreProfileSocialLinks 
          storeData={storeData} 
          setStoreData={setStoreData} 
        />

        <StoreProfileLocation 
          storeData={storeData} 
          setStoreData={setStoreData} 
          handleGetLocation={handleGetLocation} 
        />

        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={savingStore}
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {savingStore ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <span>บันทึกข้อมูลร้านค้า</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreProfileForm;
