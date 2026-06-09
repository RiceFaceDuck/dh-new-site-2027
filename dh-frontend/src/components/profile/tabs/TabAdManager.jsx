/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Loader2, Store, Settings2, Activity, Sparkles, MessageCircle, 
  MapPin, Phone, Link as LinkIcon, Youtube, ShoppingCart, Clock, Image as ImageIcon,
  Power, UploadCloud, CheckCircle2 
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
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
    storeImage: '',
    storeName: '', description: '', services: '', openHours: '',
    phone: '', messengerUrl: '', lineUrl: '', youtubeUrl: '', tiktokUrl: '', shopeeUrl: '', lazadaUrl: '', websiteUrl: '',
    address: '', landmarks: '', googleMapLink: '', latitude: null, longitude: null, 
    isSupportActive: false 
  });
  
  const [savingStore, setSavingStore] = useState(false);
  const [uploadingStoreImage, setUploadingStoreImage] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [ads, setAds] = useState([]);
  const [businessCardAd, setBusinessCardAd] = useState(null); // 🚀 เก็บ State ของนามบัตรแยกไว้
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

  // 🚀 [THE FIX] ระบบฟังเสียงการเปลี่ยนแปลงสถานะนามบัตรแบบ Real-time
  useEffect(() => {
    if (!user) return;
    const adId = `AD-CARD-${user.uid}`;
    const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'partner_ads', adId);
    
    // ทันทีที่กดเซฟ หรือผู้จัดการกดอนุมัติ ระบบจะเปลี่ยนสถานะหน้าจอนี้ทันที!
    const unsubscribe = onSnapshot(adRef, (snap) => {
      if (snap.exists()) {
        setBusinessCardAd({ id: snap.id, ...snap.data() });
      } else {
        setBusinessCardAd(null);
      }
    });

    return () => unsubscribe();
  }, [user, appId]);

  const fetchUserCredit = async () => {
    try {
      const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
      const walletRef = doc(db, 'artifacts', appId, 'users', user.uid, 'wallet', 'default');
      const [userSnap, walletSnap] = await Promise.all([getDoc(userRef), getDoc(walletRef)]);
      
      let currentPoints = 0;
      if (walletSnap.exists()) currentPoints = Number(walletSnap.data().balance) || 0;
      else if (userSnap.exists()) currentPoints = Number(userSnap.data().creditPoints || 0);
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
          partnerId: user.uid, storeName: finalStoreData.storeName, services: finalStoreData.services,
          phone: finalStoreData.phone, messengerUrl: finalStoreData.messengerUrl || '',
          googleMapLink: finalStoreData.googleMapLink, latitude: finalStoreData.latitude, longitude: finalStoreData.longitude, 
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
           phone: finalStoreData.phone || '',
           partnerName: finalStoreData.storeName,
           status: 'PENDING', 
           creditLimit: -1, 
           updatedAt: serverTimestamp()
        };

        // หากยังไม่เคยมีโฆษณานี้มาก่อน ให้สร้างฟิลด์ stats เตรียมไว้
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
        batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'manager_todos', taskId), todoPayload, { merge: true });
        batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'todos', taskId), todoPayload, { merge: true });

      } else {
        batch.delete(activePartnerRef);
        batch.set(adRef, { status: 'INACTIVE', updatedAt: serverTimestamp() }, { merge: true });
        batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'manager_todos', taskId));
        batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'todos', taskId));
      }
      
      await batch.commit();
      setStoreData(finalStoreData);
      fetchMyAds(); 
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
    } finally { setSavingStore(false); }
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

  // 🚀 ตัวแปรตรวจสอบสถานะว่า "กำลังรออนุมัติหรือไม่?"
  const isAdPending = businessCardAd?.status?.toUpperCase() === 'PENDING';

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
                    <span className="text-amber-400 animate-pulse font-bold">🟡 กำลังตรวจสอบ</span>
                  ) : businessCardAd?.status?.toUpperCase() === 'APPROVED' ? (
                    <span className="text-emerald-400 font-bold">🟢 เปิดแสดงผล (Live)</span>
                  ) : businessCardAd?.status?.toUpperCase() === 'REJECTED' ? (
                    <span className="text-rose-400 font-bold">🔴 ไม่ผ่านอนุมัติ</span>
                  ) : (
                    <span className="text-amber-400">🟡 รอการบันทึก</span>
                  )}
                </div>
              </div>
              
              {/* 🚀 ล็อกสวิตช์: ปิดการใช้งาน และทำสีจางลงเมื่ออยู่ในสถานะ PENDING */}
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
            
            {/* SECTION 1: รูปภาพและข้อมูลหลัก */}
            <div>
              <h4 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-5 uppercase tracking-wide text-sm"><ImageIcon size={18} className="text-indigo-500"/> รูปภาพและข้อมูลหลัก</h4>
              <div className="flex flex-col md:flex-row gap-8">
                {/* Store Image Upload */}
                <div className="w-full md:w-1/3 flex flex-col">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">ภาพโปรไฟล์ร้าน / โลโก้</label>
                  <div className="aspect-square w-full rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 relative overflow-hidden group hover:border-indigo-400 transition-colors">
                    {storeData.storeImage ? (
                      <img src={storeData.storeImage} alt="Store" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400"><Store size={32} className="mb-2 opacity-50"/><span className="text-[10px] uppercase font-bold">อัปโหลดรูปภาพ</span></div>
                    )}
                    <label className={`absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm ${uploadingStoreImage || isAdPending ? 'pointer-events-none' : ''}`}>
                      <input type="file" accept="image/*" onChange={handleStoreImageUpload} disabled={isAdPending} className="hidden" />
                      {uploadingStoreImage ? <Loader2 className="animate-spin text-white"/> : <UploadCloud className="text-white" size={28}/>}
                    </label>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="w-full md:w-2/3 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ชื่อร้าน / ชื่อกิจการ <span className="text-rose-500">*</span></label>
                    <input type="text" value={storeData.storeName} onChange={(e) => setStoreData({...storeData, storeName: e.target.value})} disabled={isAdPending} required placeholder="เช่น DH Computer Repair" className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">คำอธิบายสั้นๆ (จุดเด่น)</label>
                    <input type="text" value={storeData.description} onChange={(e) => setStoreData({...storeData, description: e.target.value})} disabled={isAdPending} placeholder="เช่น ซ่อมด่วน รอรับได้เลย ประเมินอาการฟรี" className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">รูปแบบการให้บริการ (Services)</label>
                    <textarea value={storeData.services} onChange={(e) => setStoreData({...storeData, services: e.target.value})} disabled={isAdPending} placeholder="เช่น รับซ่อมมือถือ, รับซ่อมคอมพิวเตอร์, งานเดินสายต่างๆ, ให้บริการถึงบ้าน..." rows="2" className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl resize-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"></textarea>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Clock size={12}/> เวลาเปิด-ปิดร้าน</label>
                    <input type="text" value={storeData.openHours} onChange={(e) => setStoreData({...storeData, openHours: e.target.value})} disabled={isAdPending} placeholder="เช่น จันทร์-ศุกร์ 09:00 - 18:00 น." className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed" />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: การติดต่อและโซเชียล */}
            <div className={isAdPending ? 'opacity-60 pointer-events-none' : ''}>
              <h4 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-5 uppercase tracking-wide text-sm"><MessageCircle size={18} className="text-blue-500"/> ข้อมูลการติดต่อ & โซเชียล</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-emerald-600">เบอร์โทรศัพท์ <span className="text-rose-500">*</span></label>
                  <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-emerald-500"><Phone size={16}/></div><input type="tel" value={storeData.phone} onChange={(e) => setStoreData({...storeData, phone: e.target.value})} required placeholder="081xxxxxxx" className="w-full pl-10 pr-4 py-3 bg-emerald-50/30 border border-emerald-200 rounded-xl focus:border-emerald-500 font-mono" /></div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-[#1877F2]">FB Messenger</label>
                  <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#1877F2]"><MessageCircle size={16}/></div><input type="text" value={storeData.messengerUrl} onChange={(e) => setStoreData({...storeData, messengerUrl: e.target.value})} placeholder="m.me/yourpage" className="w-full pl-10 pr-4 py-3 bg-blue-50/30 border border-blue-200 rounded-xl focus:border-blue-500" /></div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-[#00B900]">LINE Official (@)</label>
                  <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#00B900]"><MessageCircle size={16}/></div><input type="text" value={storeData.lineUrl} onChange={(e) => setStoreData({...storeData, lineUrl: e.target.value})} placeholder="lin.ee/xxxxxx" className="w-full pl-10 pr-4 py-3 bg-green-50/30 border border-green-200 rounded-xl focus:border-green-500" /></div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-slate-600">เว็บไซต์ร้าน (Website)</label>
                  <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><LinkIcon size={16}/></div><input type="text" value={storeData.websiteUrl} onChange={(e) => setStoreData({...storeData, websiteUrl: e.target.value})} placeholder="www.yourstore.com" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-500" /></div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-[#FF0000]">YouTube Channel</label>
                  <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#FF0000]"><Youtube size={16}/></div><input type="text" value={storeData.youtubeUrl} onChange={(e) => setStoreData({...storeData, youtubeUrl: e.target.value})} placeholder="youtube.com/c/yourchannel" className="w-full pl-10 pr-4 py-3 bg-red-50/30 border border-red-200 rounded-xl focus:border-red-500" /></div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-black">TikTok</label>
                  <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-black"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg></div><input type="text" value={storeData.tiktokUrl} onChange={(e) => setStoreData({...storeData, tiktokUrl: e.target.value})} placeholder="tiktok.com/@yourusername" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-500" /></div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-[#EE4D2D]">Shopee Store</label>
                  <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#EE4D2D]"><ShoppingCart size={16}/></div><input type="text" value={storeData.shopeeUrl} onChange={(e) => setStoreData({...storeData, shopeeUrl: e.target.value})} placeholder="shopee.co.th/yourstore" className="w-full pl-10 pr-4 py-3 bg-orange-50/30 border border-orange-200 rounded-xl focus:border-orange-500" /></div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-[#0F146D]">Lazada Store</label>
                  <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#0F146D]"><ShoppingCart size={16}/></div><input type="text" value={storeData.lazadaUrl} onChange={(e) => setStoreData({...storeData, lazadaUrl: e.target.value})} placeholder="lazada.co.th/shop/yourstore" className="w-full pl-10 pr-4 py-3 bg-indigo-50/30 border border-indigo-200 rounded-xl focus:border-indigo-500" /></div>
                </div>
              </div>
            </div>

            {/* SECTION 3: ที่ตั้งและแผนที่ */}
            <div className={isAdPending ? 'opacity-60 pointer-events-none' : ''}>
              <h4 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-5 uppercase tracking-wide text-sm"><MapPin size={18} className="text-rose-500"/> ตำแหน่งที่ตั้งร้าน</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ที่อยู่ร้านแบบละเอียด</label>
                  <textarea value={storeData.address} onChange={(e) => setStoreData({...storeData, address: e.target.value})} placeholder="บ้านเลขที่, ซอย, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์" rows="2" className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl resize-none focus:border-indigo-500"></textarea>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">สถานที่สำคัญใกล้เคียง (จุดสังเกต)</label>
                  <input type="text" value={storeData.landmarks} onChange={(e) => setStoreData({...storeData, landmarks: e.target.value})} placeholder="เช่น ตรงข้ามเซเว่น, ใกล้ตลาด..." className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">พิกัดแผนที่ (Google Maps)</label>
                  <input type="url" value={storeData.googleMapLink} onChange={(e) => setStoreData({...storeData, googleMapLink: e.target.value})} placeholder="วางลิงก์ Google Maps ของร้านคุณที่นี่" className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl mb-3 focus:border-indigo-500" />
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-center bg-amber-50 p-4 rounded-xl border border-amber-200/60">
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-amber-800 uppercase tracking-widest mb-1">ระบบเรดาร์ GPS</p>
                      <p className="text-xs text-amber-700/80">ระบบจำเป็นต้องทราบพิกัดปัจจุบันของคุณ เพื่อให้ลูกค้าในพื้นที่ใกล้เคียงค้นหาร้านคุณเจอ</p>
                      {storeData.latitude && (
                        <p className="text-xs font-mono font-bold text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle2 size={14}/> {storeData.latitude.toFixed(6)}, {storeData.longitude.toFixed(6)}</p>
                      )}
                    </div>
                    <button type="button" onClick={handleGetLocation} className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md">
                      <MapPin size={16}/> {storeData.latitude ? 'อัปเดตพิกัดใหม่' : 'ดึงพิกัดปัจจุบัน'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 🚀 ล็อกปุ่ม Submit: ป้องกันการกดซ้ำซ้อนและโชว์สถานะชัดเจน */}
            <div className="pt-6 border-t border-slate-200 flex justify-end">
              <button 
                type="submit" 
                disabled={savingStore || isAdPending} 
                className={`w-full sm:w-auto px-10 py-4 font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg active:scale-95 ${
                  isAdPending 
                    ? 'bg-amber-500/80 text-white cursor-not-allowed shadow-none' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30'
                }`}
              >
                {savingStore ? (
                  <><Loader2 size={24} className="animate-spin"/> กำลังบันทึกข้อมูล...</>
                ) : isAdPending ? (
                  <><Loader2 size={24} className="animate-spin"/> ล็อกระบบ (รอผู้จัดการอนุมัติ)</>
                ) : (
                  <><Power size={24}/> บันทึกและอัปเดตระบบ</>
                )}
              </button>
            </div>
          </form>
        </div>
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