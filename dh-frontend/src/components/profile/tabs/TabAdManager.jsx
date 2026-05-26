/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Search, Loader2, Link as LinkIcon, Image as ImageIcon, 
  CheckCircle2, ShieldAlert, X, Eye, Store, MapPin, Phone, 
  Settings2, Power, AlertCircle, MapPinned, Lock, ExternalLink, Activity,
  Video, UploadCloud, Sparkles
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { driveService } from '../../../firebase/driveService';
import { marketingService } from '../../../firebase/marketingService'; // 🚀 อัปเกรด: ใช้ Unified Service

// นำเข้า Sub-components
import AdStatsOverview from './ad-manager/AdStatsOverview';
import AdListTable from './ad-manager/AdListTable';
import AdFormModal from './ad-manager/AdFormModal';

// 🛡️ ระบบสแกนข้อมูลขั้นสูง: แปลงค่า undefined เป็น null ป้องกัน Firestore Error
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

  // ================= State สำหรับระบบ Unified Ads =================
  const [ads, setAds] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submittingAd, setSubmittingAd] = useState(false);
  
  // 🚀 อัปเกรด: State รองรับ 3 ระบบ (นามบัตร, สินค้า, ป้าย)
  const [formData, setFormData] = useState({
    type: 'BUSINESS_CARD', // Default: นามบัตร
    title: '', 
    description: '', 
    imageUrl: '', 
    targetUrl: '', 
    platform: 'other', 
    billboardRatio: '16:9', // สำหรับแผ่นป้าย
    price: '' // สำหรับสินค้า
  });
  
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // ระบบงบประมาณ (Budgeting)
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

  // ดึงข้อมูลเครดิตล่าสุดมาคำนวณงบ
  const fetchUserCredit = async () => {
    try {
      const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
      const walletRef = doc(db, 'artifacts', appId, 'users', user.uid, 'wallet', 'default');
      
      const [userSnap, walletSnap] = await Promise.all([getDoc(userRef), getDoc(walletRef)]);
      
      let currentPoints = 0;
      if (walletSnap.exists()) {
        currentPoints = Number(walletSnap.data().balance) || 0;
      } else if (userSnap.exists()) {
        currentPoints = Number(userSnap.data().creditPoints || userSnap.data().creditPoint || 0);
      }
      setUserCredit(currentPoints);
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
      // 🚀 ดึงข้อมูลด้วย Unified Service
      const myAds = await marketingService.getUserPartnerAds(user.uid);
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
      alert("กรุณาเลือกรูปภาพที่มีขนาดไม่เกิน 5MB เพื่อประสิทธิภาพสูงสุด");
      return;
    }

    setUploadingImage(true);
    try {
      // 🚀 ส่ง formData.type ไปให้ Drive จัดระเบียบ
      const url = await driveService.uploadAdImage(file, formData.type);
      setFormData({ ...formData, imageUrl: url });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(error.message || "อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setUploadingImage(false);
    }
  };

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
      // ทำความสะอาดข้อมูลก่อนส่งให้ Service
      const adPayload = sanitizeData({
        title: formData.title,
        description: formData.description || '',
        imageUrl: formData.imageUrl,
        targetUrl: formData.targetUrl, 
        platform: formData.platform || 'other',
        billboardRatio: formData.type === 'BILLBOARD' ? formData.billboardRatio : null,
        price: formData.type === 'PRODUCT_LINK' ? formData.price : null,
        partnerName: storeData?.storeName || user?.displayName || 'พาร์ทเนอร์',
        creditLimit: safeCreditLimit,
        costPerImpression: COST_PER_IMPRESSION
      });
      
      // 🚀 เรียกใช้ Unified Service ตัวใหม่! (ทำงานแบบ Atomic Transaction ประหยัด R/W)
      await marketingService.submitPartnerAd(user.uid, formData.type, adPayload, safeCreditLimit);

      alert("สร้างโฆษณาและส่งให้แอดมินตรวจสอบเรียบร้อยแล้ว!");
      setIsFormOpen(false);
      
      // รีเซ็ตฟอร์ม
      setFormData({ 
        type: 'BUSINESS_CARD', title: '', description: '', imageUrl: '', targetUrl: '', platform: 'other', billboardRatio: '16:9', price: ''
      });
      setCreditLimit(100);
      
      // ดึงสถิติใหม่
      fetchUserCredit();
      fetchMyAds();
    } catch (error) {
      console.error("Error submitting ad:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกโฆษณา (Error: " + error.message + ")");
    } finally {
      setSubmittingAd(false);
    }
  };

  const handleDeleteAd = async (adId) => {
    if(window.confirm("คุณต้องการลบโฆษณานี้ใช่หรือไม่? (หากลบแล้วจะใช้งานไม่ได้อีก)")) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'partner_ads', adId);
        await deleteDoc(docRef);
        fetchMyAds();
      } catch (error) {
        alert("ลบไม่สำเร็จ กรุณาลองใหม่");
      }
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
      
      {/* Header & Main Tabs (Corporate Premium Style) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <Megaphone className="text-indigo-600 drop-shadow-sm" size={28} /> ศูนย์จัดการโฆษณา
          </h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
             <Sparkles size={14} className="text-amber-400"/>
             จัดการหน้าร้าน, นามบัตร, โปรโมทสินค้า และแผ่นป้าย
          </p>
        </div>
        
        <div className="flex bg-slate-100/80 p-1 rounded-xl shadow-inner border border-slate-200/50">
          <button 
            onClick={() => setActiveSubTab('store')}
            className={`px-5 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${
              activeSubTab === 'store' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings2 size={16} /> ข้อมูลร้านซ่อม
          </button>
          <button 
            onClick={() => setActiveSubTab('ads')}
            className={`px-5 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${
              activeSubTab === 'ads' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Activity size={16} /> โฆษณาทั้งหมด
          </button>
        </div>
      </div>

      {/* =======================================================================
          TAB 1: PARTNER STORE (ข้อมูลร้านซ่อม และสวิตช์รับการสนับสนุน)
          ======================================================================= */}
      {activeSubTab === 'store' && (
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-300">
          
          <div className={`p-5 flex items-center justify-between border-b transition-colors duration-500 ${
            storeData.isSupportActive ? 'bg-gradient-to-r from-emerald-50 to-transparent border-emerald-100/50' : 'bg-slate-50 border-slate-200/50'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                storeData.isSupportActive ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-white border border-slate-200 text-slate-400'
              }`}>
                <Power size={24} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${storeData.isSupportActive ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {storeData.isSupportActive ? 'กำลังรับการสนับสนุน (Active)' : 'ปิดรับการสนับสนุน'}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  Credit Point ปัจจุบัน: <span className="font-black text-indigo-600 text-sm tracking-wide">{userCredit.toLocaleString()}</span> แต้ม
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer hover:scale-105 transition-transform">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={storeData.isSupportActive}
                onChange={handleToggleSupport}
              />
              <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
            </label>
          </div>

          <form onSubmit={handleSaveStore} className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-5">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Store size={18} className="text-indigo-500"/> ข้อมูลประจำตัวร้าน
                </h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">ชื่อร้านซ่อม / ชื่อกิจการ <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" value={storeData.storeName} onChange={(e) => setStoreData({...storeData, storeName: e.target.value})}
                    placeholder="เช่น สมหมาย คอมพิวเตอร์เซอร์วิส" required
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Phone size={18}/></div>
                    <input 
                      type="tel" value={storeData.phone} onChange={(e) => setStoreData({...storeData, phone: e.target.value})}
                      placeholder="08X-XXX-XXXX" required
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">รายละเอียดบริการ (ย่อๆ)</label>
                  <textarea 
                    value={storeData.services} onChange={(e) => setStoreData({...storeData, services: e.target.value})}
                    placeholder="เช่น ซ่อมคอม ซ่อมโน้ตบุ๊ก ปรึกษาฟรี บริการนอกสถานที่" rows="3"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-700 resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="space-y-5">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <MapPinned size={18} className="text-indigo-500"/> ตำแหน่งที่ตั้ง (สำคัญมาก)
                </h4>
                <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-4 text-sm text-amber-800 flex gap-3 shadow-sm">
                  <AlertCircle className="shrink-0 mt-0.5 text-amber-500" size={18} />
                  <p>ระบบจำเป็นต้องใช้พิกัด <strong>Latitude / Longitude</strong> เพื่อโชว์ให้ลูกค้าใกล้เคียงเห็นนามบัตรของคุณ</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">ลิงก์ Google Maps (ถ้ามี)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><MapPin size={18}/></div>
                    <input 
                      type="url" value={storeData.googleMapLink} onChange={(e) => setStoreData({...storeData, googleMapLink: e.target.value})}
                      placeholder="https://maps.app.goo.gl/..."
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-700"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">พิกัด GPS อัตโนมัติ <span className="text-rose-500">*</span></label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" value={storeData.latitude ? `${storeData.latitude.toFixed(6)}, ${storeData.longitude.toFixed(6)}` : ''} 
                      placeholder="ยังไม่มีพิกัด" readOnly
                      className="flex-1 px-4 py-3 bg-slate-100/80 border border-slate-200 text-slate-500 rounded-xl font-tech text-sm cursor-not-allowed text-center sm:text-left"
                    />
                    <button 
                      type="button" 
                      onClick={handleGetLocation}
                      disabled={locationLoading}
                      className="px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold active:scale-95"
                    >
                      {locationLoading ? <Loader2 size={16} className="animate-spin"/> : <MapPin size={16}/>}
                      ดึงพิกัดปัจจุบัน
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 flex justify-end">
              <button 
                type="submit" 
                disabled={savingStore}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                {savingStore ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}
                บันทึกข้อมูลร้านค้า
              </button>
            </div>
          </form>
        </div>
      )}


      {/* =======================================================================
          TAB 2: AD MANAGER (ระบบจัดการโฆษณาแบบรวมศูนย์ - นามบัตร/สินค้า/ป้าย)
          ======================================================================= */}
      {activeSubTab === 'ads' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* ส่วนสถิติและเครดิตคงเหลือ */}
          {!isFormOpen && (
            <AdStatsOverview 
              userCredit={userCredit} 
              onOpenForm={() => setIsFormOpen(true)} 
            />
          )}

          {/* ฟอร์มการสร้างโฆษณาใหม่ (Dynamic Form) */}
          {isFormOpen && (
            <AdFormModal 
              formData={formData}
              setFormData={setFormData}
              storeData={storeData}
              handleSubmitAd={handleSubmitAd}
              onCloseForm={() => setIsFormOpen(false)}
              handleLinkChange={handleLinkChange}
              handleImageUpload={handleImageUpload}
              uploadingImage={uploadingImage}
              submittingAd={submittingAd}
              creditLimit={creditLimit}
              setCreditLimit={setCreditLimit}
              remainingCredit={remainingCredit}
              targetImpressions={targetImpressions}
            />
          )}

          {/* รายการโฆษณาที่เคยส่งไปแล้ว */}
          {!isFormOpen && (
            <AdListTable 
              ads={ads} 
              onDeleteAd={handleDeleteAd} 
            />
          )}
        </div>
      )}
    </div>
  );
};

export default TabAdManager;