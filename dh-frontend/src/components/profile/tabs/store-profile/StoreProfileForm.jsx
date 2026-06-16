import React, { useState } from 'react';
import { Store, Power, Loader2 } from 'lucide-react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { driveService } from '../../../../firebase/driveService';
import StoreProfileBasicInfo from './StoreProfileBasicInfo';
import StoreProfileSocialLinks from './StoreProfileSocialLinks';
import StoreProfileLocation from './StoreProfileLocation';

const StoreProfileForm = ({ storeData, setStoreData, user, appId, businessCardAd, fetchMyAds }) => {
  const [savingStore, setSavingStore] = useState(false);
  const [uploadingStoreImage, setUploadingStoreImage] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

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
    } finally { setUploadingStoreImage(false); }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert("เบราว์เซอร์ของคุณไม่รองรับการดึงพิกัดแผนที่");
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStoreData({ ...storeData, latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationLoading(false);
      },
      (error) => {
        alert("ไม่สามารถดึงพิกัดได้ กรุณาอนุญาตให้เข้าถึงตำแหน่งที่ตั้ง");
        setLocationLoading(false);
      }
    );
  };

  const handleToggleSupport = () => {
    setStoreData({ ...storeData, isSupportActive: !storeData.isSupportActive });
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();
    if (!storeData.storeName || !storeData.phone) return alert("กรุณากรอกข้อมูล ชื่อร้าน และ เบอร์โทร ให้ครบถ้วน");
    
    setSavingStore(true);
    try {
      const finalStoreData = { ...storeData };
      const urlFields = ['messengerUrl', 'lineUrl', 'youtubeUrl', 'tiktokUrl', 'shopeeUrl', 'lazadaUrl', 'websiteUrl'];
      urlFields.forEach(field => {
        if (finalStoreData[field] && !finalStoreData[field].startsWith('http')) {
          if (field === 'messengerUrl' && finalStoreData[field].includes('m.me')) {
            finalStoreData[field] = 'https://' + finalStoreData[field];
          } else {
             finalStoreData[field] = 'https://' + finalStoreData[field];
          }
        }
      });

      const batch = writeBatch(db); 

      // 1. บันทึกข้อมูลร้านลงระบบ Profile
      const storeRef = doc(db, 'artifacts', appId, 'users', user.uid, 'storeProfile', 'main');
      batch.set(storeRef, { ...finalStoreData, updatedAt: serverTimestamp() }, { merge: true });

      // 2. จัดการ ActivePartners (เรดาร์)
      const activePartnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'ActivePartners', user.uid);
      
      // 3. จัดการโฆษณานามบัตร (BUSINESS_CARD)
      const adId = `AD-CARD-${user.uid}`;
      const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'partner_ads', adId);
      const taskId = `TODO-${adId}`;
      
      if (finalStoreData.isSupportActive) {
        if (!finalStoreData.latitude || !finalStoreData.longitude) {
           alert("กรุณากดปุ่ม 'ดึงพิกัดปัจจุบัน' ก่อนเปิดรับการสนับสนุน");
           setSavingStore(false);
           return;
        }

        batch.set(activePartnerRef, {
          partnerId: user.uid, 
          storeName: finalStoreData.storeName, 
          services: finalStoreData.services,
          phone: finalStoreData.phone, 
          messengerUrl: finalStoreData.messengerUrl || '',
          lineUrl: finalStoreData.lineUrl || '',
          googleMapLink: finalStoreData.googleMapLink, 
          latitude: finalStoreData.latitude, 
          longitude: finalStoreData.longitude, 
          storeImage: finalStoreData.storeImage || '',
          updatedAt: serverTimestamp()
        });

        const adPayload = {
           id: adId,
           type: 'BUSINESS_CARD',
           ownerId: user.uid,
           title: finalStoreData.storeName,
           description: finalStoreData.description || finalStoreData.services || '',
           imageUrl: finalStoreData.storeImage || 'https://placehold.co/400x400/e2e8f0/475569?text=Store',
           targetUrl: finalStoreData.websiteUrl || finalStoreData.messengerUrl || finalStoreData.lineUrl || finalStoreData.googleMapLink || '#',
           messengerUrl: finalStoreData.messengerUrl || '',
           lineUrl: finalStoreData.lineUrl || '',
           phone: finalStoreData.phone || '',
           partnerName: finalStoreData.storeName,
           status: 'PENDING', 
           creditLimit: -1, 
           updatedAt: serverTimestamp()
        };

        if (!businessCardAd) {
           adPayload.stats = { views: 0, clicks: 0 };
        }

        const todoPayload = {
          taskId: taskId,
          type: 'AD_APPROVAL',
          taskType: 'AD_APPROVAL',
          status: 'pending',
          priority: 'High',
          title: `ตรวจสอบนามบัตร: ${finalStoreData.storeName}`,
          description: `พาร์ทเนอร์อัปเดตข้อมูลและขอเปิดใช้นามบัตรโฆษณา`,
          targetSkuId: adId,
          partnerId: user.uid,
          customerName: finalStoreData.storeName,
          adDetails: adPayload,
          requestedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          createdBy: user.uid
        };

        batch.set(adRef, adPayload, { merge: true });
        // ใช้ todos ที่ root level เพียงที่เดียวเพื่อลดความซ้ำซ้อน 
        batch.set(doc(db, 'todos', taskId), todoPayload, { merge: true });

      } else {
        batch.delete(activePartnerRef);
        batch.set(adRef, { status: 'INACTIVE', updatedAt: serverTimestamp() }, { merge: true });
        // ลบ todo หากผู้ใช้ปิดการโฆษณา
        batch.delete(doc(db, 'todos', taskId));
      }
      
      await batch.commit();
      
      sessionStorage.removeItem(`active_partners_cache_${appId}`);
      
      setStoreData(finalStoreData);
      if (fetchMyAds) fetchMyAds();
      alert("บันทึกข้อมูลเรียบร้อยแล้ว");
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
    } finally { setSavingStore(false); }
  };

  const isAdPending = businessCardAd?.status?.toUpperCase() === 'PENDING';

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
                <span className="text-amber-400 animate-pulse font-bold">🟡 รอผู้จัดการอนุมัติ (Pending)</span>
              ) : businessCardAd?.status?.toUpperCase() === 'APPROVED' ? (
                <span className="text-emerald-400 font-bold">🟢 เปิดแสดงผล (Live)</span>
              ) : businessCardAd?.status?.toUpperCase() === 'REJECTED' ? (
                <span className="text-rose-400 font-bold">🔴 ไม่ผ่านอนุมัติ</span>
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
          locationLoading={locationLoading} 
        />

        {/* ปุ่ม Submit: กดได้ตลอดเวลาเพื่ออัปเดตข้อมูล แม้ว่าจะรออนุมัติโฆษณาอยู่ก็ตาม */}
        <div className="pt-6 border-t border-slate-200 flex justify-end">
          <button 
            type="submit" 
            disabled={savingStore} 
            className="w-full sm:w-auto px-10 py-4 font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg active:scale-95 bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30 disabled:bg-indigo-400 disabled:shadow-none"
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
