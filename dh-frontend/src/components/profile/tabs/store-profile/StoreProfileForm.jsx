import React, { useState } from 'react';
import { Store, Power, Loader2 } from 'lucide-react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { driveService } from '../../../../firebase/driveService';
import { storeProfileSubmitService } from '../../../../firebase/storeProfileSubmitService';
import StoreProfileBasicInfo from './StoreProfileBasicInfo';
import StoreProfileSocialLinks from './StoreProfileSocialLinks';
import StoreProfileLocation from './StoreProfileLocation';

import { useStoreProfile } from './hooks/useStoreProfile';
import { useGeolocation } from '../../../../hooks/useGeolocation';

const StoreProfileForm = ({ storeData, setStoreData, user, appId, businessCardAd, fetchMyAds }) => {
  const {
    savingStore,
    uploadingStoreImage,
    isAdPending,
    handleStoreImageUpload,
    handleToggleSupport,
    handleSaveStore
  } = useStoreProfile(storeData, setStoreData, user, appId, businessCardAd, fetchMyAds);

  const { getUserCurrentLocation, isLocating } = useGeolocation();

  const handleGetLocation = async () => {
    try {
      const coords = await getUserCurrentLocation();
      setStoreData({ ...storeData, latitude: coords.latitude, longitude: coords.longitude });
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-300">
      
      <div className="bg-slate-900 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2"><Store className="text-indigo-400"/> ศูนย์ข้อมูลร้านค้า (Store Profile)</h3>
          <p className="text-[11px] text-slate-400 mt-1">ข้อมูลในหน้านี้จะถูกนำไปใช้สร้าง <b>"โฆษณานามบัตร"</b> และแสดงผลบนแผนที่เรดาร์อัตโนมัติ</p>
        </div>
        
        <div className="bg-slate-800 p-3 rounded-2xl flex items-center gap-4 border border-slate-700">
          <div className="text-right">
            <div className="text-xs font-bold text-white uppercase tracking-widest">นามบัตรโฆษณา</div>
            <div className="text-[10px]">
              {!storeData.isSupportActive ? (
                <span className="text-slate-400">⚫ ปิดการแสดงผล</span>
              ) : isAdPending ? (
                <span className="text-amber-400 animate-pulse font-bold">🟡 รอตรวจสอบ (Pending)</span>
              ) : ['APPROVED', 'ACTIVE'].includes(businessCardAd?.status?.toUpperCase()) ? (
                <span className="text-emerald-400 font-bold">🟢 โฆษณาทำงานอยู่ (Live)</span>
              ) : businessCardAd?.status?.toUpperCase() === 'REJECTED' ? (
                <span className="text-rose-400 font-bold">🔴 ไม่ผ่านอนุมัติ</span>
              ) : businessCardAd?.status?.toUpperCase() === 'PAUSED' ? (
                <span className="text-orange-400 font-bold">🟠 ถูกระงับการแสดงผล</span>
              ) : (
                <span className="text-amber-400">🟡 รอการบันทึก</span>
              )}
            </div>
          </div>
          
          {/* ล็อกสวิตช์: ปิดการใช้งาน เมื่ออยู่ในสถานะ PENDING เพื่อไม่ให้สับสน แต่ยังสามารถบันทึกข้อมูลหลักร้านได้ */}
          <label className={`relative inline-flex items-center ${isAdPending ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={storeData.isSupportActive} 
              onChange={handleToggleSupport} 
              disabled={isAdPending} 
            />
            <div className="w-14 h-7 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
          </label>
        </div>
      </div>

      <form onSubmit={handleSaveStore} className="p-6 md:p-8 space-y-10">
        
        <StoreProfileBasicInfo 
          storeData={storeData} 
          setStoreData={setStoreData} 
          uploadingStoreImage={uploadingStoreImage} 
          handleStoreImageUpload={handleStoreImageUpload} 
        />

        <StoreProfileSocialLinks 
          storeData={storeData} 
          setStoreData={setStoreData} 
        />

        <StoreProfileLocation 
          storeData={storeData} 
          setStoreData={setStoreData} 
          handleGetLocation={handleGetLocation} 
          locationLoading={isLocating} 
        />

        {/* PDPA Consent Checkbox */}
        <div className="pt-6 border-t border-slate-200">
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-4 items-start">
            <div className="mt-1">
              <input
                type="checkbox"
                id="pdpa-consent"
                checked={storeData.pdpaConsent || false}
                onChange={(e) => setStoreData({ ...storeData, pdpaConsent: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="pdpa-consent" className="text-sm text-slate-700 font-medium cursor-pointer block leading-relaxed">
                <span className="text-indigo-700 font-bold block mb-1">การให้ความยินยอมเปิดเผยข้อมูล (PDPA)</span>
                ข้าพเจ้ายินยอมให้นำข้อมูลที่กรอกทั้งหมด ได้แก่ <b className="text-slate-900">ชื่อร้าน, รูปภาพ, เบอร์โทรศัพท์, ช่องทางการติดต่อ, ที่อยู่ และพิกัดสถานที่ตั้ง (GPS)</b> ไปแสดงผลต่อสาธารณะบนแพลตฟอร์ม เพื่อวัตถุประสงค์ในการโฆษณาและการค้นหาร้านซ่อม
              </label>
            </div>
          </div>
        </div>

        {/* ปุ่ม Submit: กดได้ตลอดเวลาเพื่ออัปเดตข้อมูล แม้ว่าจะรออนุมัติโฆษณาอยู่ก็ตาม */}
        <div className="pt-2 flex justify-end">
          <button 
            type="submit" 
            disabled={savingStore || !storeData.pdpaConsent} 
            className="w-full sm:w-auto px-10 py-4 font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg active:scale-95 bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
          >
            {savingStore ? (
              <><Loader2 size={24} className="animate-spin"/> กำลังบันทึกข้อมูล...</>
            ) : isAdPending ? (
              <><Power size={24}/> บันทึกและอัปเดตคำขอโฆษณาใหม่</>
            ) : (
              <><Power size={24}/> บันทึกข้อมูล</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreProfileForm;
