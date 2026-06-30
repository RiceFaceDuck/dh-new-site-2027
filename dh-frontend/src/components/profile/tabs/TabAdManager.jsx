/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Loader2, Store, Activity, Sparkles
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { driveService } from '../../../firebase/driveService';
import { marketingService } from '../../../firebase/marketingService';
import { useUserCredit } from '../../../firebase/creditService';

import AdStatsOverview from './ad-manager/AdStatsOverview';
import AdListTable from './ad-manager/AdListTable';
import AdFormModal from './ad-manager/AdFormModal';
import StoreProfileForm from './store-profile/StoreProfileForm';

const sanitizeData = (obj) => {
  const cleaned = {};
  for (let key in obj) {
    if (obj[key] === undefined) cleaned[key] = null;
    else cleaned[key] = obj[key];
  }
  return cleaned;
};

const TabAdManager = ({ user }) => {
  const [activeSubTab, setActiveSubTab] = useState('store');
  const [loading, setLoading] = useState(true);

  // Use the global realtime credit hook
  const { balance: userCredit } = useUserCredit(user?.uid);

  const [storeData, setStoreData] = useState({
    storeImage: '',
    storeName: '', description: '', services: '', openHours: '',
    phone: '', messengerUrl: '', lineUrl: '', youtubeUrl: '', tiktokUrl: '', shopeeUrl: '', lazadaUrl: '', websiteUrl: '',
    address: '', landmarks: '', googleMapLink: '', latitude: null, longitude: null, 
    isSupportActive: false, pdpaConsent: false
  });

  const [ads, setAds] = useState([]);
  const [businessCardAd, setBusinessCardAd] = useState(null); 
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submittingAd, setSubmittingAd] = useState(false);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAdId, setEditingAdId] = useState(null);

  const [formData, setFormData] = useState({
    type: 'PRODUCT_LINK', title: '', description: '', imageUrl: '', targetUrl: '', platform: 'other', 
    billboardRatio: '16:9', price: ''
  });
  
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [creditLimit, setCreditLimit] = useState(100); 
  const [isUnlimited, setIsUnlimited] = useState(false);
  const COST_PER_IMPRESSION = 1; 

  const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

  useEffect(() => {
    if (user) {
      fetchStoreData();
      fetchMyAds();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const adId = `AD-CARD-${user.uid}`;
    const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'partner_ads', adId);
    
    const unsubscribe = onSnapshot(adRef, (snap) => {
      if (snap.exists()) {
        setBusinessCardAd({ id: snap.id, ...snap.data() });
      } else {
        setBusinessCardAd(null);
      }
    });

    return () => unsubscribe();
  }, [user, appId]);



  const fetchStoreData = async () => {
    try {
      const storeRef = doc(db, 'artifacts', appId, 'users', user.uid, 'storeProfile', 'main');
      const rootStoreRef = doc(db, 'users', user.uid, 'storeProfile', 'main');
      
      const [storeSnap, rootSnap] = await Promise.all([
        getDoc(storeRef),
        getDoc(rootStoreRef)
      ]);
      
      let mergedData = { ...storeData };
      
      // ดึงข้อมูลจากทั้งสองแหล่ง โดยให้ความสำคัญกับแหล่งที่มีชื่อร้านก่อน
      if (rootSnap.exists()) {
        mergedData = { ...mergedData, ...rootSnap.data() };
      }
      
      if (storeSnap.exists()) {
        const artifactsData = storeSnap.data();
        // ทับด้วย Artifacts เฉพาะกรณีที่ข้อมูลไม่ได้โล่งเตียน (กันกรณีเผลอกดเซฟทับ)
        if (artifactsData.storeName || !mergedData.storeName) {
           mergedData = { ...mergedData, ...artifactsData };
        }
      }
      
      setStoreData(mergedData);
    } catch (error) { console.error("Error fetching store data:", error); } 
    finally { setLoading(false); }
  };

  const fetchMyAds = async () => {
    try {
      const myAds = await marketingService.getUserPartnerAds(user.uid);
      setAds(myAds);
    } catch (error) { console.error("Error fetching my ads:", error); }
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
      alert(error.message);
    } finally { setUploadingImage(false); }
  };

  const handleEditAd = (ad) => {
    if (ad.type === 'BUSINESS_CARD') {
       alert("นามบัตรถูกจัดการผ่าน 'ข้อมูลร้านซ่อม' กรุณาไปแก้ไขที่แท็บข้อมูลร้านซ่อมครับ");
       setActiveSubTab('store');
       return;
    }
    setFormData({
      type: ad.type || 'PRODUCT_LINK',
      title: ad.title || ad.productName || '',
      description: ad.description || '',
      imageUrl: ad.imageUrl || '',
      targetUrl: ad.targetUrl || '',
      platform: ad.platform || 'other',
      billboardRatio: ad.billboardRatio || '16:9',
      price: ad.price || ''
    });
    setCreditLimit(ad.creditLimit === -1 ? 100 : ad.creditLimit);
    setIsUnlimited(ad.creditLimit === -1);
    setIsEditMode(true);
    setEditingAdId(ad.id);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setIsEditMode(false);
    setEditingAdId(null);
    setFormData({ type: 'PRODUCT_LINK', title: '', description: '', imageUrl: '', targetUrl: '', platform: 'other', billboardRatio: '16:9', price: '' });
  };

  const handleSubmitAd = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.targetUrl || !formData.imageUrl) {
      return alert("กรุณากรอกข้อมูลและอัปโหลดรูปภาพให้ครบถ้วน");
    }
    
    const finalCreditLimit = isUnlimited ? -1 : (Number(creditLimit) || 0);
    if (!isUnlimited && finalCreditLimit < 10) return alert("กรุณาตั้งค่างบโฆษณาขั้นต่ำ 10 แต้ม");

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
        partnerName: storeData?.storeName || user?.displayName || 'พาร์ทเนอร์',
        costPerImpression: COST_PER_IMPRESSION
      });
      
      if (isEditMode && editingAdId) {
        await marketingService.updatePartnerAd(user.uid, editingAdId, formData.type, adPayload, finalCreditLimit);
        alert("ส่งคำขอแก้ไขโฆษณาสำเร็จ! ระบบได้ส่งเรื่องให้ผู้จัดการตรวจสอบอีกครั้ง");
      } else {
        await marketingService.submitPartnerAd(user.uid, formData.type, adPayload, finalCreditLimit);
        alert("สร้างคำขอโฆษณาสำเร็จ! ระบบได้ส่งเรื่องให้ผู้จัดการตรวจสอบแล้ว");
      }

      handleCloseForm();
      fetchMyAds();
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกโฆษณา");
    } finally { setSubmittingAd(false); }
  };

  const handleDeleteAd = async (adId) => {
    if(window.confirm("คุณต้องการลบโฆษณานี้ใช่หรือไม่? (หากลบแล้วจะใช้งานไม่ได้อีก)")) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'partner_ads', adId));
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_sku_ads', adId)).catch(()=>{});
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'billboard_ads', adId)).catch(()=>{});
        
        // 🚀 เก็บ History Log ว่ามีการลบ SKU โฆษณา
        const { setDoc, serverTimestamp } = await import('firebase/firestore');
        await setDoc(doc(db, 'system_logs', `delete_ad_${adId}_${Date.now()}`), {
          module: 'Marketing',
          action: 'DeleteAd',
          targetId: adId,
          details: `User ${user.uid} deleted ad/SKU: ${adId}`,
          timestamp: serverTimestamp(),
          performedBy: user.uid
        }).catch(() => {}); // catch error silent
        
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
            <Megaphone className="text-indigo-600 drop-shadow-sm" size={28} /> ศูนย์จัดการโฆษณาและร้านค้า
          </h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
             <Sparkles size={14} className="text-amber-400"/>ศูนย์รวมการโปรโมทร้านค้าและสินค้าแบบครบวงจร
          </p>
        </div>
        <div className="flex bg-slate-100/80 p-1 rounded-xl shadow-inner border border-slate-200/50">
          <button onClick={() => setActiveSubTab('store')} className={`px-5 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeSubTab === 'store' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}><Store size={16} /> ข้อมูลร้านซ่อม</button>
          <button onClick={() => setActiveSubTab('ads')} className={`px-5 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeSubTab === 'ads' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}><Activity size={16} /> โฆษณาสินค้า/แบนเนอร์</button>
        </div>
      </div>

      {activeSubTab === 'store' && (
        <StoreProfileForm 
          storeData={storeData} 
          setStoreData={setStoreData} 
          user={user} 
          appId={appId} 
          businessCardAd={businessCardAd} 
          fetchMyAds={fetchMyAds} 
        />
      )}

      {/* =========================================================================
          🛒 ADS MANAGER: จัดการเฉพาะสินค้าและแผ่นป้าย
          ========================================================================= */}
      {activeSubTab === 'ads' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {!isFormOpen && <AdStatsOverview userCredit={userCredit} onOpenForm={() => { setIsEditMode(false); setIsFormOpen(true); }} />}
          
          {isFormOpen && (
            <AdFormModal 
              formData={formData} setFormData={setFormData} storeData={storeData} handleSubmitAd={handleSubmitAd}
              onCloseForm={handleCloseForm} handleLinkChange={handleLinkChange} handleImageUpload={handleImageUpload}
              uploadingImage={uploadingImage} submittingAd={submittingAd} 
              creditLimit={creditLimit} setCreditLimit={setCreditLimit} 
              isUnlimited={isUnlimited} setIsUnlimited={setIsUnlimited} 
              remainingCredit={isUnlimited ? 9999 : (userCredit - creditLimit)} 
              targetImpressions={isUnlimited ? '∞' : Math.floor(creditLimit / COST_PER_IMPRESSION)}
              isEditMode={isEditMode}
            />
          )}

          {!isFormOpen && <AdListTable ads={ads} onEditAd={handleEditAd} onDeleteAd={handleDeleteAd} />}
        </div>
      )}
    </div>
  );
};
export default TabAdManager;