/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Megaphone, Loader2, Store, Settings2, Activity, Sparkles } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { driveService } from '../../../firebase/driveService';
import { marketingService } from '../../../firebase/marketingService';

import AdStatsOverview from './ad-manager/AdStatsOverview';
import AdListTable from './ad-manager/AdListTable';
import AdFormModal from './ad-manager/AdFormModal';

const sanitizeData = (obj) => {
  const cleaned = {};
  for (let key in obj) {
    if (obj[key] === undefined) cleaned[key] = null;
    else cleaned[key] = obj[key];
  }
  return cleaned;
};

const TabAdManager = () => {
  const [activeSubTab, setActiveSubTab] = useState('store');
  const [loading, setLoading] = useState(true);
  const [userCredit, setUserCredit] = useState(0);

  const [storeData, setStoreData] = useState({
    storeName: '', services: '', phone: '', googleMapLink: '', latitude: null, longitude: null, isSupportActive: false
  });
  const [savingStore, setSavingStore] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [ads, setAds] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submittingAd, setSubmittingAd] = useState(false);
  
  // 🚀 อัปเดต: เพิ่ม messengerUrl สำหรับนามบัตร
  const [formData, setFormData] = useState({
    type: 'BUSINESS_CARD', title: '', description: '', imageUrl: '', targetUrl: '', platform: 'other', 
    billboardRatio: '16:9', price: '', messengerUrl: ''
  });
  
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // 🚀 อัปเดต: เพิ่ม isUnlimited
  const [creditLimit, setCreditLimit] = useState(100); 
  const [isUnlimited, setIsUnlimited] = useState(false);
  const COST_PER_IMPRESSION = 1; 

  const auth = getAuth();
  const user = auth.currentUser;
  const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

  useEffect(() => {
    if (user) {
      fetchUserCredit();
      fetchStoreData();
      fetchMyAds();
    }
  }, [user]);

  const fetchUserCredit = async () => {
    try {
      const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
      const walletRef = doc(db, 'artifacts', appId, 'users', user.uid, 'wallet', 'default');
      const [userSnap, walletSnap] = await Promise.all([getDoc(userRef), getDoc(walletRef)]);
      
      let currentPoints = 0;
      if (walletSnap.exists()) currentPoints = Number(walletSnap.data().balance) || 0;
      else if (userSnap.exists()) currentPoints = Number(userSnap.data().creditPoints || userSnap.data().creditPoint || 0);
      setUserCredit(currentPoints);
    } catch (error) { console.error("Error fetching credit:", error); }
  };

  const fetchStoreData = async () => {
    try {
      const storeRef = doc(db, 'artifacts', appId, 'users', user.uid, 'storeProfile', 'main');
      const storeSnap = await getDoc(storeRef);
      if (storeSnap.exists()) setStoreData({ ...storeData, ...storeSnap.data() });
    } catch (error) { console.error("Error fetching store data:", error); } 
    finally { setLoading(false); }
  };

  const fetchMyAds = async () => {
    try {
      const myAds = await marketingService.getUserPartnerAds(user.uid);
      setAds(myAds);
    } catch (error) { console.error("Error fetching my ads:", error); }
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

  const handleSaveStore = async (e) => {
    e.preventDefault();
    if (!storeData.storeName || !storeData.phone) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    
    setSavingStore(true);
    try {
      const storeRef = doc(db, 'artifacts', appId, 'users', user.uid, 'storeProfile', 'main');
      await setDoc(storeRef, { ...storeData, updatedAt: serverTimestamp() }, { merge: true });

      const activePartnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'ActivePartners', user.uid);
      
      if (storeData.isSupportActive) {
        if (!storeData.latitude || !storeData.longitude) {
           alert("กรุณากดปุ่ม 'ดึงพิกัดปัจจุบัน' ก่อนเปิดรับการสนับสนุน");
           setStoreData({...storeData, isSupportActive: false});
           await updateDoc(storeRef, { isSupportActive: false });
        } else {
          await setDoc(activePartnerRef, {
            partnerId: user.uid, storeName: storeData.storeName, services: storeData.services,
            phone: storeData.phone, googleMapLink: storeData.googleMapLink,
            latitude: storeData.latitude, longitude: storeData.longitude, updatedAt: serverTimestamp()
          });
          alert("บันทึกข้อมูลและเปิดรับการสนับสนุนเรียบร้อย!");
        }
      } else {
        await deleteDoc(activePartnerRef).catch(()=>{});
        alert("บันทึกข้อมูลร้านเรียบร้อย (ปิดการรับการสนับสนุน)");
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally { setSavingStore(false); }
  };

  const handleToggleSupport = () => {
    setStoreData({ ...storeData, isSupportActive: !storeData.isSupportActive });
  };

  const handleLinkChange = (e) => {
    const url = e.target.value;
    setFormData({ ...formData, targetUrl: url, platform: marketingService.detectPlatform(url) });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("กรุณาเลือกรูปภาพที่มีขนาดไม่เกิน 5MB");

    setUploadingImage(true);
    try {
      const url = await driveService.uploadAdImage(file, formData.type);
      setFormData({ ...formData, imageUrl: url });
    } catch (error) {
      alert(error.message || "อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally { setUploadingImage(false); }
  };

  const handleSubmitAd = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.targetUrl || !formData.imageUrl) {
      return alert("กรุณากรอกข้อมูลและอัปโหลดรูปภาพให้ครบถ้วน");
    }
    
    // 🚀 อนุญาตให้ส่งผ่าน ถ้างบไม่จำกัด (-1)
    const finalCreditLimit = isUnlimited ? -1 : (Number(creditLimit) || 0);

    if (!isUnlimited && finalCreditLimit < 10) {
      return alert("กรุณาตั้งค่างบประมาณโฆษณาขั้นต่ำ 10 แต้ม หรือเลือกไม่จำกัดงบประมาณ");
    }

    setSubmittingAd(true);
    try {
      const adPayload = sanitizeData({
        title: formData.title,
        description: formData.description || '',
        imageUrl: formData.imageUrl,
        targetUrl: formData.targetUrl, 
        platform: formData.platform || 'other',
        billboardRatio: formData.type === 'BILLBOARD' ? formData.billboardRatio : null,
        price: formData.type === 'PRODUCT_LINK' ? formData.price : null,
        messengerUrl: formData.type === 'BUSINESS_CARD' ? formData.messengerUrl : null, // 🚀 ส่งลิงก์แชท
        partnerName: storeData?.storeName || user?.displayName || 'พาร์ทเนอร์',
        costPerImpression: COST_PER_IMPRESSION
      });
      
      // 🚀 ส่ง -1 ไปที่ Service เพื่อบอกว่าไม่จำกัดงบ
      await marketingService.submitPartnerAd(user.uid, formData.type, adPayload, finalCreditLimit);

      alert("สร้างคำขอโฆษณาสำเร็จ! ระบบได้ส่งเรื่องให้ผู้จัดการตรวจสอบแล้ว");
      setIsFormOpen(false);
      
      setFormData({ 
        type: 'BUSINESS_CARD', title: '', description: '', imageUrl: '', targetUrl: '', platform: 'other', billboardRatio: '16:9', price: '', messengerUrl: ''
      });
      setCreditLimit(100);
      setIsUnlimited(false);
      fetchMyAds();
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกโฆษณา (Error: " + error.message + ")");
    } finally { setSubmittingAd(false); }
  };

  const handleDeleteAd = async (adId) => {
    if(window.confirm("คุณต้องการลบโฆษณานี้ใช่หรือไม่? (หากลบแล้วจะใช้งานไม่ได้อีก)")) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'partner_ads', adId));
        fetchMyAds();
      } catch (error) { alert("ลบไม่สำเร็จ กรุณาลองใหม่"); }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
         <Loader2 size={32} className="animate-spin mb-3 text-indigo-500 drop-shadow-md" />
         <p className="text-sm font-tech tracking-widest uppercase">INITIALIZING AD MANAGER...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <Megaphone className="text-indigo-600 drop-shadow-sm" size={28} /> ศูนย์จัดการโฆษณา
          </h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
             <Sparkles size={14} className="text-amber-400"/>จัดการหน้าร้าน, นามบัตร, โปรโมทสินค้า และแผ่นป้าย
          </p>
        </div>
        <div className="flex bg-slate-100/80 p-1 rounded-xl shadow-inner border border-slate-200/50">
          <button onClick={() => setActiveSubTab('store')} className={`px-5 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeSubTab === 'store' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}><Settings2 size={16} /> ข้อมูลร้านซ่อม</button>
          <button onClick={() => setActiveSubTab('ads')} className={`px-5 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeSubTab === 'ads' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}><Activity size={16} /> โฆษณาทั้งหมด</button>
        </div>
      </div>

      {activeSubTab === 'store' && (
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-300">
          <form onSubmit={handleSaveStore} className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">ข้อมูลประจำตัวร้าน</h4>
                <input type="text" value={storeData.storeName} onChange={(e) => setStoreData({...storeData, storeName: e.target.value})} placeholder="ชื่อร้านซ่อม / ชื่อกิจการ *" required className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl" />
                <input type="tel" value={storeData.phone} onChange={(e) => setStoreData({...storeData, phone: e.target.value})} placeholder="เบอร์โทรศัพท์ติดต่อ *" required className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl" />
                <textarea value={storeData.services} onChange={(e) => setStoreData({...storeData, services: e.target.value})} placeholder="รายละเอียดบริการ (ย่อๆ)" rows="3" className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl resize-none"></textarea>
              </div>
              <div className="space-y-5">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">ตำแหน่งที่ตั้ง</h4>
                <input type="url" value={storeData.googleMapLink} onChange={(e) => setStoreData({...storeData, googleMapLink: e.target.value})} placeholder="ลิงก์ Google Maps (ถ้ามี)" className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl" />
                <div className="flex gap-3">
                  <input type="text" value={storeData.latitude ? `${storeData.latitude.toFixed(6)}, ${storeData.longitude.toFixed(6)}` : ''} placeholder="ยังไม่มีพิกัด GPS" readOnly className="flex-1 px-4 py-3 bg-slate-100/80 border border-slate-200 text-slate-500 rounded-xl" />
                  <button type="button" onClick={handleGetLocation} className="px-5 py-3 bg-slate-800 text-white rounded-xl font-bold">ดึงพิกัด</button>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-6 flex justify-between items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={storeData.isSupportActive} onChange={handleToggleSupport} className="w-5 h-5 text-indigo-600 rounded" />
                <span className="font-bold text-slate-700">เปิดรับลูกค้า (แสดงบนเรดาร์)</span>
              </label>
              <button type="submit" disabled={savingStore} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl">{savingStore ? 'กำลังบันทึก...' : 'บันทึกข้อมูลร้าน'}</button>
            </div>
          </form>
        </div>
      )}

      {activeSubTab === 'ads' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {!isFormOpen && <AdStatsOverview userCredit={userCredit} onOpenForm={() => setIsFormOpen(true)} />}
          
          {isFormOpen && (
            <AdFormModal 
              formData={formData} setFormData={setFormData} storeData={storeData} handleSubmitAd={handleSubmitAd}
              onCloseForm={() => setIsFormOpen(false)} handleLinkChange={handleLinkChange} handleImageUpload={handleImageUpload}
              uploadingImage={uploadingImage} submittingAd={submittingAd} 
              creditLimit={creditLimit} setCreditLimit={setCreditLimit} 
              isUnlimited={isUnlimited} setIsUnlimited={setIsUnlimited} // 🚀 ส่ง Props ตัวใหม่
              remainingCredit={isUnlimited ? 9999 : (userCredit - creditLimit)} 
              targetImpressions={isUnlimited ? '∞' : Math.floor(creditLimit / COST_PER_IMPRESSION)}
            />
          )}

          {!isFormOpen && <AdListTable ads={ads} onDeleteAd={handleDeleteAd} />}
        </div>
      )}
    </div>
  );
};
export default TabAdManager;