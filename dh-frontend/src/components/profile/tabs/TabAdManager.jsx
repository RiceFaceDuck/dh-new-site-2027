/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Search, Loader2, Link as LinkIcon, Image as ImageIcon, 
  CheckCircle2, ShieldAlert, X, Eye, Store, MapPin, Phone, 
  Settings2, Power, AlertCircle, MapPinned, Lock, ExternalLink, Activity,
  Video, UploadCloud
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { driveService } from '../../../firebase/driveService';
import { consumeAdCredit } from '../../../firebase/creditService'; // 🚀 อัปเกรด: เชื่อมต่อ Service หักแต้มใหม่

// นำเข้า Component การ์ดโฆษณา
import ProductAdCard from '../../ads/ProductAdCard';

// 🛡️ ระบบสแกนข้อมูลขั้นสูง: แปลงค่า undefined เป็น null
const sanitizeData = (obj) => {
  const cleaned = {};
  for (let key in obj) {
    if (obj[key] === undefined) {
      cleaned[key] = null;
    } else {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
};

const TabAdManager = () => {
  // ================= State ทั่วไป =================
  const [activeSubTab, setActiveSubTab] = useState('store'); // 'store' หรือ 'ads'
  const [loading, setLoading] = useState(true);
  const [userCredit, setUserCredit] = useState(0);

  // ================= State สำหรับระบบ Partner Store =================
  const [storeData, setStoreData] = useState({
    storeName: '',
    services: '',
    phone: '',
    googleMapLink: '',
    latitude: null,
    longitude: null,
    isSupportActive: false
  });
  const [savingStore, setSavingStore] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // ================= State สำหรับระบบโฆษณาสินค้า =================
  const [ads, setAds] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submittingAd, setSubmittingAd] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', imageUrl: '', targetUrl: '', platform: 'shopee', type: 'product', youtubeUrl: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // ระบบงบประมาณ
  const [creditLimit, setCreditLimit] = useState(100); 
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

  const targetImpressions = Math.floor((creditLimit || 0) / COST_PER_IMPRESSION);
  const remainingCredit = userCredit - (creditLimit || 0);

  const fetchUserCredit = async () => {
    try {
      const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().creditPoint !== undefined) {
        setUserCredit(Number(userSnap.data().creditPoint) || 0);
      } else {
        setUserCredit(0);
      }
    } catch (error) {
      console.error("Error fetching credit:", error);
    }
  };

  const fetchStoreData = async () => {
    try {
      const storeRef = doc(db, 'artifacts', appId, 'users', user.uid, 'storeProfile', 'main');
      const storeSnap = await getDoc(storeRef);
      if (storeSnap.exists()) {
        setStoreData({ ...storeData, ...storeSnap.data() });
      }
    } catch (error) {
      console.error("Error fetching store data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAds = async () => {
    try {
      const q = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'sponsored_ads'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const myAds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      myAds.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setAds(myAds);
    } catch (error) {
      console.error("Error fetching my ads:", error);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์ของคุณไม่รองรับการดึงพิกัดแผนที่");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStoreData({
          ...storeData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationLoading(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("ไม่สามารถดึงพิกัดได้ กรุณาอนุญาตให้เข้าถึงตำแหน่งที่ตั้ง");
        setLocationLoading(false);
      }
    );
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();
    if (!storeData.storeName || !storeData.phone) {
      alert("กรุณากรอกชื่อร้านและเบอร์ติดต่อให้ครบถ้วน");
      return;
    }
    
    setSavingStore(true);
    try {
      const storeRef = doc(db, 'artifacts', appId, 'users', user.uid, 'storeProfile', 'main');
      await setDoc(storeRef, { ...storeData, updatedAt: serverTimestamp() }, { merge: true });

      const activePartnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'ActivePartners', user.uid);
      
      if (storeData.isSupportActive) {
        if (userCredit <= 0) {
          alert("ไม่สามารถเปิดรับการสนับสนุนได้ เนื่องจาก Credit Point ของคุณไม่เพียงพอ");
          setStoreData({...storeData, isSupportActive: false});
          await updateDoc(storeRef, { isSupportActive: false });
          await deleteDoc(activePartnerRef).catch(()=>console.log("No active doc to delete"));
        } else if (!storeData.latitude || !storeData.longitude) {
           alert("กรุณากดปุ่ม 'ดึงพิกัดปัจจุบัน' ก่อนเปิดรับการสนับสนุน");
           setStoreData({...storeData, isSupportActive: false});
           await updateDoc(storeRef, { isSupportActive: false });
        } else {
          await setDoc(activePartnerRef, {
            partnerId: user.uid,
            storeName: storeData.storeName,
            services: storeData.services,
            phone: storeData.phone,
            googleMapLink: storeData.googleMapLink,
            latitude: storeData.latitude,
            longitude: storeData.longitude,
            updatedAt: serverTimestamp()
          });
          alert("บันทึกข้อมูลและเปิดรับการสนับสนุนเรียบร้อย!");
        }
      } else {
        await deleteDoc(activePartnerRef).catch(()=>console.log("Not in active list"));
        alert("บันทึกข้อมูลร้านเรียบร้อย (ปิดการรับการสนับสนุน)");
      }
    } catch (error) {
      console.error("Error saving store:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSavingStore(false);
    }
  };

  const handleToggleSupport = () => {
    if (!storeData.isSupportActive && userCredit <= 0) {
      alert("คุณต้องมี Credit Point มากกว่า 0 จึงจะสามารถเปิดรับการสนับสนุนได้");
      return;
    }
    setStoreData({ ...storeData, isSupportActive: !storeData.isSupportActive });
  };

  const handleLinkChange = (e) => {
    const url = e.target.value;
    let detectedPlatform = formData.platform;
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('shopee.')) detectedPlatform = 'shopee';
    else if (lowerUrl.includes('lazada.')) detectedPlatform = 'lazada';
    else if (lowerUrl.includes('tiktok.')) detectedPlatform = 'tiktok';
    else if (lowerUrl.includes('facebook.')) detectedPlatform = 'facebook';
    else if (lowerUrl.includes('thisshop.')) detectedPlatform = 'thisshop';
    else if (lowerUrl.includes('line.me') || lowerUrl.includes('lineshopping')) detectedPlatform = 'lineshopping';
    
    setFormData({ ...formData, targetUrl: url, platform: detectedPlatform });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("กรุณาเลือกรูปภาพที่มีขนาดไม่เกิน 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const url = await driveService.uploadAdImage(file);
      setFormData({ ...formData, imageUrl: url });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(error.message || "อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setUploadingImage(false);
    }
  };

  // 🛡️ Submit Function (อัปเกรดเชื่อมระบบ Credit Service 100%)
  const handleSubmitAd = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.targetUrl || !formData.imageUrl) {
      alert("กรุณากรอกข้อมูลและอัปโหลดรูปภาพให้ครบถ้วน");
      return;
    }
    
    const safeCreditLimit = Number(creditLimit) || 0;

    if (safeCreditLimit < 10) {
      alert("กรุณาตั้งค่างบประมาณโฆษณาขั้นต่ำ 10 แต้ม");
      return;
    }

    if (userCredit < safeCreditLimit) {
      alert(`แต้มเครดิตของคุณไม่เพียงพอสำหรับงบประมาณที่ตั้งไว้ (คุณมี ${userCredit} แต้ม)`);
      return;
    }

    setSubmittingAd(true);
    try {
      // 1. สร้างเอกสารโฆษณา
      const baseAdData = sanitizeData({
        title: formData.title || '',
        description: formData.description || '',
        imageUrl: formData.imageUrl || '',
        targetUrl: formData.targetUrl || '', 
        youtubeUrl: formData.youtubeUrl || '',
        platform: formData.platform || 'other',
        type: formData.type || 'product',
        userId: user?.uid || 'unknown', 
        partnerName: storeData?.storeName || user?.displayName || 'พาร์ทเนอร์',
        status: 'pending',
        clicks: 0,
        impressions: 0,
        creditLimit: safeCreditLimit,
        costPerImpression: COST_PER_IMPRESSION || 1
      });
      
      const adDocRef = await addDoc(
        collection(db, 'artifacts', appId, 'public', 'data', 'sponsored_ads'), 
        {
          ...baseAdData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      );

      // 2. สร้างรายการ Todo ให้แอดมินอนุมัติ
      const baseTodoData = sanitizeData({
        type: 'AD_APPROVAL', 
        title: `ตรวจสอบโฆษณาใหม่: ${baseAdData.title}`,
        description: `พาร์ทเนอร์ ${baseAdData.partnerName} ฝากโปรโมทสินค้า (งบประมาณ ${baseAdData.creditLimit} แต้ม)`,
        status: 'todo',
        priority: 'High',
        adId: adDocRef.id,
        partnerId: user?.uid || 'unknown',
        customerName: baseAdData.partnerName,
        adPayload: baseAdData 
      });

      await addDoc(
        collection(db, 'artifacts', appId, 'public', 'data', 'todos'), 
        {
          ...baseTodoData,
          createdAt: serverTimestamp(),
          requestedAt: serverTimestamp()
        }
      );

      alert("สร้างโฆษณาและส่งให้แอดมินตรวจสอบเรียบร้อยแล้ว!");
      setIsFormOpen(false);
      setFormData({ title: '', description: '', imageUrl: '', targetUrl: '', platform: 'shopee', type: 'product', youtubeUrl: '' });
      setCreditLimit(100);
      
      fetchMyAds();
    } catch (error) {
      console.error("Error submitting ad:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกโฆษณา กรุณาลองใหม่อีกครั้ง (Error: " + error.message + ")");
    } finally {
      setSubmittingAd(false);
    }
  };


  const getStatusBadge = (status) => {
    if (status === 'active') return <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 w-max"><CheckCircle2 size={12}/> ออนไลน์</span>;
    if (status === 'rejected') return <span className="bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 w-max"><ShieldAlert size={12}/> ไม่ผ่านอนุมัติ</span>;
    if (status === 'paused') return <span className="bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 w-max"><AlertCircle size={12}/> ถูกระงับ</span>;
    return <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 w-max"><Loader2 size={12} className="animate-spin"/> รอตรวจสอบ</span>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
         <Loader2 size={32} className="animate-spin mb-3 text-[#0870B8]" />
         <p className="text-sm font-tech">LOADING PARTNER DATA...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header & Main Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Store className="text-[#0870B8]" size={24} /> ศูนย์ควบคุมพาร์ทเนอร์
          </h2>
          <p className="text-sm text-slate-500 mt-1">จัดการหน้าร้านและการโปรโมทสินค้าของคุณ</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveSubTab('store')}
            className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${
              activeSubTab === 'store' ? 'bg-white text-[#0870B8] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings2 size={16} /> ข้อมูลร้านซ่อม
          </button>
          <button 
            onClick={() => setActiveSubTab('ads')}
            className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${
              activeSubTab === 'ads' ? 'bg-white text-[#0870B8] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Megaphone size={16} /> โฆษณาสินค้า
          </button>
        </div>
      </div>

      {/* =======================================================================
          TAB 1: PARTNER STORE (ข้อมูลร้านซ่อม และสวิตช์รับการสนับสนุน)
          ======================================================================= */}
      {activeSubTab === 'store' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-300">
          
          <div className={`p-4 flex items-center justify-between border-b ${
            storeData.isSupportActive ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                storeData.isSupportActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'
              }`}>
                <Power size={20} />
              </div>
              <div>
                <h3 className={`font-bold ${storeData.isSupportActive ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {storeData.isSupportActive ? 'กำลังรับการสนับสนุน' : 'ปิดรับการสนับสนุน'}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  Credit Point ปัจจุบัน: <span className="font-bold text-[#0870B8] text-sm">{userCredit.toLocaleString()}</span> Credit
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={storeData.isSupportActive}
                onChange={handleToggleSupport}
              />
              <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
            </label>
          </div>

          <form onSubmit={handleSaveStore} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Store size={18} className="text-slate-400"/> ข้อมูลร้านของคุณ
                </h4>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ชื่อร้านซ่อม / ชื่อกิจการ <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" value={storeData.storeName} onChange={(e) => setStoreData({...storeData, storeName: e.target.value})}
                    placeholder="เช่น สมหมาย คอมพิวเตอร์เซอร์วิส" required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Phone size={16}/></div>
                    <input 
                      type="tel" value={storeData.phone} onChange={(e) => setStoreData({...storeData, phone: e.target.value})}
                      placeholder="08X-XXX-XXXX" required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">รายละเอียดบริการ (ย่อๆ)</label>
                  <textarea 
                    value={storeData.services} onChange={(e) => setStoreData({...storeData, services: e.target.value})}
                    placeholder="เช่น ซ่อมคอม ซ่อมโน้ตบุ๊ก ปรึกษาฟรี บริการนอกสถานที่" rows="3"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <MapPinned size={18} className="text-slate-400"/> ตำแหน่งที่ตั้ง (สำคัญมาก)
                </h4>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-3">
                  <AlertCircle className="shrink-0 mt-0.5 text-amber-500" size={18} />
                  <p>ระบบจำเป็นต้องใช้พิกัด <strong>Latitude / Longitude</strong> เพื่อแสดงร้านของคุณให้กับลูกค้าที่อยู่ในพื้นที่ใกล้เคียง</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ลิงก์ Google Maps (ถ้ามี)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><MapPin size={16}/></div>
                    <input 
                      type="url" value={storeData.googleMapLink} onChange={(e) => setStoreData({...storeData, googleMapLink: e.target.value})}
                      placeholder="https://maps.app.goo.gl/..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8]"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">พิกัด GPS อัตโนมัติ <span className="text-rose-500">*</span></label>
                  <div className="flex gap-2">
                    <input 
                      type="text" value={storeData.latitude ? `${storeData.latitude.toFixed(6)}, ${storeData.longitude.toFixed(6)}` : ''} 
                      placeholder="ยังไม่มีข้อมูลพิกัด" readOnly
                      className="flex-1 px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl font-tech text-sm cursor-not-allowed"
                    />
                    <button 
                      type="button" 
                      onClick={handleGetLocation}
                      disabled={locationLoading}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-md transition-colors flex items-center gap-2 whitespace-nowrap text-sm font-bold"
                    >
                      {locationLoading ? <Loader2 size={16} className="animate-spin"/> : <MapPin size={16}/>}
                      ดึงพิกัดปัจจุบัน
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    * แนะนำให้กดปุ่มนี้เมื่อคุณอยู่ที่ร้านของคุณ เพื่อความแม่นยำสูงสุด
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 flex justify-end">
              <button 
                type="submit" 
                disabled={savingStore}
                className="px-8 py-3 bg-[#0870B8] hover:bg-[#0A85DA] text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {savingStore ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}
                บันทึกข้อมูลร้าน
              </button>
            </div>
          </form>
        </div>
      )}


      {/* =======================================================================
          TAB 2: AD MANAGER (โฆษณาสินค้า)
          ======================================================================= */}
      {activeSubTab === 'ads' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          
          {!isFormOpen && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-[#0870B8]/10 p-5 rounded-2xl border border-[#0870B8]/20">
              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-[#0870B8]">
                  <Store size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">Credit Point ของคุณ</p>
                  <p className="text-2xl font-black text-[#0870B8]">{userCredit.toLocaleString()} <span className="text-base font-medium text-slate-600">แต้ม</span></p>
                </div>
              </div>
              <button 
                onClick={() => setIsFormOpen(true)}
                className="w-full sm:w-auto px-6 py-3 bg-[#0870B8] hover:bg-[#0A85DA] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} /> ลงโฆษณาสินค้าใหม่
              </button>
            </div>
          )}

          {isFormOpen && (
            <div className="bg-white border border-[#0870B8]/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0870B8] opacity-5 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
              
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                    <Megaphone className="text-[#0870B8]"/> ฝากลิงก์โปรโมทสินค้า
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">ตั้งค่างบประมาณโฆษณาของคุณ ระบบจะหักแต้มเมื่อมีการแสดงผลจริงเท่านั้น</p>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-rose-500">
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col lg:flex-row gap-8">
                <form onSubmit={handleSubmitAd} className="w-full lg:w-1/2 space-y-5">

                  <div className="flex gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer flex-1 justify-center">
                      <input type="radio" name="adType" value="product" checked={formData.type === 'product'} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-4 h-4 text-[#0870B8]" />
                      <span className="text-sm font-bold text-slate-700">Product Ad (1:1)</span>
                    </label>
                    <div className="w-px bg-slate-200"></div>
                    <label className="flex items-center gap-2 cursor-pointer flex-1 justify-center">
                      <input type="radio" name="adType" value="billboard" checked={formData.type === 'billboard'} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-4 h-4 text-[#0870B8]" />
                      <span className="text-sm font-bold text-slate-700">Billboard Ad (16:9)</span>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">1. ชื่อสินค้าที่จะโปรโมท <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="เช่น กล้องวงจรปิดไร้สาย WiFi รุ่นใหม่ล่าสุด" required maxLength={50}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                        <span>2. ลิงก์ร้านค้าปลายทาง <span className="text-rose-500">*</span></span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold text-white uppercase shadow-sm transition-colors ${
                          formData.platform === 'shopee' ? 'bg-[#EE4D2D]' : 
                          formData.platform === 'lazada' ? 'bg-[#0F146D]' : 
                          formData.platform === 'tiktok' ? 'bg-black' : 
                          formData.platform === 'facebook' ? 'bg-[#1877F2]' : 
                          formData.platform === 'thisshop' ? 'bg-[#E31E24]' : 
                          formData.platform === 'lineshopping' ? 'bg-[#06C755]' : 
                          'bg-slate-400'
                        }`}>
                          {formData.platform || 'OTHER'}
                        </span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><LinkIcon size={16}/></div>
                        <input 
                          type="url" value={formData.targetUrl || ''} onChange={handleLinkChange}
                          placeholder="วางลิงก์ Shopee, Lazada, Tiktok ที่นี่..." required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] text-sm font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        3. อัปโหลดรูปภาพ <span className="text-rose-500">*</span> 
                        <span className="text-[10px] text-slate-400 font-normal ml-2">
                          ({formData.type === 'product' ? 'อัตราส่วน 1:1' : 'อัตราส่วน 16:9'}) ขนาดไม่เกิน 5MB
                        </span>
                      </label>
                      <label className={`relative flex items-center justify-center w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                        <input 
                          type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage}
                          className="hidden" 
                        />
                        {uploadingImage ? (
                          <div className="flex flex-col items-center gap-2 text-[#0870B8] font-medium">
                            <Loader2 size={24} className="animate-spin"/> กำลังอัปโหลดภาพ...
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                            <UploadCloud size={28} className={formData.imageUrl ? 'text-emerald-500' : 'text-slate-400'}/> 
                            <span className="font-bold text-sm">
                              {formData.imageUrl ? 'เปลี่ยนรูปภาพใหม่' : 'คลิกเพื่อเลือกไฟล์รูปภาพ'}
                            </span>
                          </div>
                        )}
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">4. ข้อความกระตุ้นยอดขาย (สั้นๆ)</label>
                      <input 
                        type="text" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="เช่น โค้ดลด 50%, ส่งฟรี, Flash Sale!" maxLength={30}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] text-sm"
                      />
                    </div>

                    {formData.type === 'product' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">5. Video Review (YouTube Link) - <span className="font-normal lowercase text-slate-400">Optional</span></label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-rose-500"><Video size={16}/></div>
                          <input 
                            type="url" value={formData.youtubeUrl || ''} onChange={(e) => setFormData({...formData, youtubeUrl: e.target.value})}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ตั้งค่างบประมาณ (Pay Per Impression Logic) */}
                  <div className={`p-5 rounded-xl mb-4 border ${remainingCredit < 0 ? 'bg-rose-50 border-rose-200' : 'bg-blue-50 border-blue-200'}`}>
                    <label className={`block text-xs font-bold uppercase tracking-wide mb-3 ${remainingCredit < 0 ? 'text-rose-800' : 'text-blue-800'}`}>
                      ตั้งค่างบประมาณโฆษณา (Credit Limit)
                    </label>
                    
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 w-full">
                        <div className="relative flex items-center">
                          <input 
                            type="number" 
                            min="10" 
                            step="10"
                            value={creditLimit === 0 ? '' : creditLimit} 
                            onChange={(e) => setCreditLimit(Number(e.target.value) || 0)}
                            className="w-full pl-4 pr-12 py-2 border border-blue-200 rounded-lg text-sm font-bold text-slate-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <span className="absolute right-3 text-sm text-slate-400 font-medium">แต้ม</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                          <Activity size={12}/> หัก 1 Credit ต่อการแสดงผล 1 ครั้ง
                        </p>
                      </div>
                      
                      <div className="text-right whitespace-nowrap min-w-[120px]">
                        <div className="text-sm font-bold text-slate-600">แสดงผลได้: <span className="text-xl text-[#0870B8]">{targetImpressions.toLocaleString()}</span> <span className="text-xs font-normal">ครั้ง</span></div>
                        <div className={`text-[11px] mt-1 font-medium ${remainingCredit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {remainingCredit < 0 ? `แต้มไม่พอ (ขาดอีก ${Math.abs(remainingCredit)})` : `คงเหลือ(ถ้ารันเต็มงบ): ${remainingCredit}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={submittingAd || remainingCredit < 0 || creditLimit <= 0} 
                      className={`w-full py-4 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2 text-base sm:text-lg ${
                        (remainingCredit < 0 || creditLimit <= 0)
                          ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
                          : 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg'
                      }`}
                    >
                      {submittingAd ? (
                        <><Loader2 size={20} className="animate-spin"/> กำลังดำเนินการ...</>
                      ) : remainingCredit < 0 ? (
                        <><Lock size={20}/> เครดิตไม่เพียงพอ</>
                      ) : (
                        <><CheckCircle2 size={20}/> ส่งคำร้อง (ยังไม่หักแต้ม)</>
                      )}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-3 font-medium">
                      * ไม่หักแต้มตอนกดส่ง ระบบจะหักเฉพาะตอนที่โฆษณาถูกมองเห็นหน้าเว็บจริงๆ
                    </p>
                  </div>
                </form>

                {/* ---------------- Live Preview (แสดงผลแบบเรียลไทม์) ---------------- */}
                <div className="w-full lg:w-1/2 bg-[#f8fbff] rounded-3xl border-2 border-dashed border-[#0870B8]/30 p-8 flex flex-col items-center justify-center sticky top-6 self-start">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-full shadow-sm">
                    <Eye size={16} className="text-[#0870B8]"/> Live Preview (พรีวิวโฆษณา)
                  </h4>
                  
                  <div className={`w-full ${formData.type === 'product' ? 'max-w-[280px]' : 'max-w-full'} pointer-events-none transform origin-top shadow-2xl rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100`}>
                    {formData.type === 'product' ? (
                      <ProductAdCard 
                        ad={{
                          title: formData.title || 'ชื่อสินค้าจำลองที่น่าสนใจ',
                          description: formData.description,
                          imageUrl: formData.imageUrl || 'https://placehold.co/400x400/f1f5f9/94a3b8?text=1:1+Image',
                          platform: formData.platform,
                          partnerName: storeData.storeName || 'ร้านซ่อมคอมพิวเตอร์ของคุณ',
                          youtubeUrl: formData.youtubeUrl,
                          targetUrl: '#'
                        }}
                      />
                    ) : (
                      <div className="w-full aspect-video bg-slate-100 flex items-center justify-center relative group">
                        {formData.imageUrl ? (
                           <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Billboard Preview" />
                        ) : (
                           <div className="flex flex-col items-center text-slate-400">
                             <ImageIcon size={48} className="mb-2 opacity-50"/>
                             <div className="text-xs font-bold uppercase tracking-wider">Billboard 16:9</div>
                           </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5">
                            <h3 className="text-white font-bold text-lg line-clamp-1">{formData.title || 'ข้อความป้ายแบนเนอร์โฆษณา'}</h3>
                            <p className="text-blue-200 text-sm mt-1 flex items-center gap-1 font-medium"><ExternalLink size={14}/> คลิกเพื่อไปยังร้านค้า</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-400 mt-6 text-center max-w-[250px]">
                    รูปแบบการแสดงผลจริงอาจปรับเปลี่ยนเล็กน้อยเพื่อให้เข้ากับหน้าจอของลูกค้า
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* รายการโฆษณาที่ส่งไปแล้ว */}
          {!isFormOpen && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><Megaphone size={18} className="text-[#0870B8]"/> ประวัติโฆษณาของฉัน</h3>
              </div>
              
              {ads.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-center bg-slate-50/30">
                  <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 border border-slate-100"><Megaphone size={32} className="text-slate-300"/></div>
                  <h3 className="font-bold text-slate-700 text-lg">ยังไม่เคยสร้างโฆษณาสินค้า</h3>
                  <p className="text-slate-500 text-sm mt-2 max-w-sm">กำหนดงบประมาณ และสร้างโฆษณาแรกของคุณวันนี้ เพื่อดันยอดขาย!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">รายละเอียดโฆษณา</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">สถานะ</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">การแสดงผล / งบประมาณ</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">คลิกสะสม</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ads.map((ad) => (
                        <tr key={ad.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="p-4 min-w-[250px]">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 p-0.5 flex-shrink-0 shadow-sm">
                                <img src={ad.imageUrl || '/logo.png'} alt="Ad" className="w-full h-full object-cover rounded-md" onError={(e)=>{e.target.src='https://placehold.co/100x100?text=No+Img'}}/>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 line-clamp-1" title={ad.title}>{ad.title}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold text-white shadow-sm ${
                                    ad.platform === 'shopee' ? 'bg-[#EE4D2D]' : ad.platform === 'lazada' ? 'bg-[#0F146D]' : ad.platform === 'tiktok' ? 'bg-black' : ad.platform === 'thisshop' ? 'bg-[#E31E24]' : 'bg-slate-400'
                                  }`}>{ad.platform}</span>
                                  <a href={ad.targetUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                    ดูลิงก์ <ExternalLink size={10}/>
                                  </a>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center">{getStatusBadge(ad.status)}</div>
                            {ad.status === 'rejected' && ad.rejectReason && (
                              <p className="text-[10px] text-rose-500 mt-1 max-w-[150px] truncate mx-auto" title={ad.rejectReason}>
                                เหตุผล: {ad.rejectReason}
                              </p>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex items-center bg-blue-50 text-blue-800 rounded-lg px-3 py-1.5 border border-blue-100 font-mono text-sm">
                               <span className="font-black">{ad.impressions || 0}</span>
                               <span className="mx-1 text-blue-300">/</span>
                               <span className="text-slate-500">{Math.floor((ad.creditLimit || 0) / (ad.costPerImpression || 1))}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-black text-slate-700">{ad.clicks || 0}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={async () => {
                                if(window.confirm("คุณต้องการลบโฆษณานี้ใช่หรือไม่?")) {
                                  try {
                                    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sponsored_ads', ad.id);
                                    await deleteDoc(docRef);
                                    fetchMyAds();
                                  } catch (error) {
                                    alert("ลบไม่สำเร็จ กรุณาลองใหม่");
                                  }
                                }
                              }}
                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center justify-center opacity-0 group-hover:opacity-100"
                              title="ลบโฆษณา"
                            >
                              <X size={18} strokeWidth={3} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TabAdManager;