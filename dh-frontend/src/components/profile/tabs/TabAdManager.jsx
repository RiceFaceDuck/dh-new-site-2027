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

// นำเข้า Sub-components
import AdStatsOverview from './ad-manager/AdStatsOverview';
import AdListTable from './ad-manager/AdListTable';
import AdFormModal from './ad-manager/AdFormModal';

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

  const handleDeleteAd = async (adId) => {
    if(window.confirm("คุณต้องการลบโฆษณานี้ใช่หรือไม่?")) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sponsored_ads', adId);
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
          
          {/* ส่วนสถิติและเครดิตคงเหลือ */}
          {!isFormOpen && (
            <AdStatsOverview 
              userCredit={userCredit} 
              onOpenForm={() => setIsFormOpen(true)} 
            />
          )}

          {/* ฟอร์มการสร้างโฆษณาใหม่ */}
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