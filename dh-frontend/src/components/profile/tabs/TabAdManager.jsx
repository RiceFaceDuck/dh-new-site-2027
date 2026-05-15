/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Search, Loader2, Link as LinkIcon, Image as ImageIcon, 
  CheckCircle2, ShieldAlert, X, Eye, Store, MapPin, Phone, 
  Settings2, Power, AlertCircle, MapPinned 
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { driveService } from '../../../firebase/driveService';
import { holdAdCredit } from '../../../firebase/creditService';
import { Video, UploadCloud } from 'lucide-react';

// นำเข้า Component การ์ดโฆษณา
import ProductAdCard from '../../ads/ProductAdCard';

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

  // ================= State สำหรับระบบโฆษณาสินค้า (Ad Manager เดิม) =================
  const [ads, setAds] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submittingAd, setSubmittingAd] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', imageUrl: '', link: '', platform: 'shopee', type: 'product', youtubeUrl: ''
  });
  const [previewError, setPreviewError] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [durationDays, setDurationDays] = useState(7);

  const auth = getAuth();
  const user = auth.currentUser;
  const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';

  // 1. Fetch ข้อมูลเริ่มต้น
  useEffect(() => {
    if (user) {
      fetchUserCredit();
      fetchStoreData();
      fetchMyAds();
    }
  }, [user]);

  const DAILY_AD_COST = 10; // หักวันละ 10 แต้ม
  const requiredCredit = durationDays * DAILY_AD_COST;

  // --- Fetch Credit (จำลองการดึงจาก User Document) ---
  const fetchUserCredit = async () => {
    try {
      const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().creditPoint) {
        setUserCredit(userSnap.data().creditPoint);
      } else {
        setUserCredit(0); // ค่าเริ่มต้นถ้าไม่มี
      }
    } catch (error) {
      console.error("Error fetching credit:", error);
    }
  };

  // --- Fetch ข้อมูลร้านซ่อม ---
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

  // --- Fetch ข้อมูลโฆษณา ---
  const fetchMyAds = async () => {
    try {
      const q = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'marketing_ads'),
        where('partnerId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const myAds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAds(myAds);
    } catch (error) {
      console.error("Error fetching my ads:", error);
    }
  };


  // ================= ฟังก์ชันส่วนระบบ Partner Store =================

  // ดึงพิกัด (Geolocation)
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

  // บันทึกข้อมูลร้าน
  const handleSaveStore = async (e) => {
    e.preventDefault();
    if (!storeData.storeName || !storeData.phone) {
      alert("กรุณากรอกชื่อร้านและเบอร์ติดต่อให้ครบถ้วน");
      return;
    }
    
    setSavingStore(true);
    try {
      // 1. บันทึกโปรไฟล์ร้านไว้ที่ user
      const storeRef = doc(db, 'artifacts', appId, 'users', user.uid, 'storeProfile', 'main');
      await setDoc(storeRef, {
        ...storeData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 2. จัดการ Collection ActivePartners
      const activePartnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'ActivePartners', user.uid);
      
      if (storeData.isSupportActive) {
        if (userCredit <= 0) {
          alert("ไม่สามารถเปิดรับการสนับสนุนได้ เนื่องจาก Credit Point ของคุณไม่เพียงพอ");
          setStoreData({...storeData, isSupportActive: false});
          // อัปเดตกลับให้เป็นปิด
          await updateDoc(storeRef, { isSupportActive: false });
          // ลบออกจาก Active
          await deleteDoc(activePartnerRef).catch(()=>console.log("No active doc to delete"));
        } else if (!storeData.latitude || !storeData.longitude) {
           alert("กรุณากดปุ่ม 'ดึงพิกัดปัจจุบัน' ก่อนเปิดรับการสนับสนุน เพื่อให้ระบบหาร้านคุณเจอ");
           setStoreData({...storeData, isSupportActive: false});
           await updateDoc(storeRef, { isSupportActive: false });
        } else {
          // มี Credit และพิกัดพร้อม -> เอาขึ้นบอร์ด Active!
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
          alert("บันทึกข้อมูลและเปิดรับการสนับสนุนเรียบร้อย ร้านของคุณพร้อมแสดงผลแล้ว!");
        }
      } else {
        // ถ้าปิดสวิตช์ ให้ถอดออกจาก ActivePartners
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

  // Toggle สวิตช์แบบอัจฉริยะ (เช็ค Credit ก่อนคลิก)
  const handleToggleSupport = () => {
    if (!storeData.isSupportActive && userCredit <= 0) {
      alert("คุณต้องมี Credit Point มากกว่า 0 จึงจะสามารถเปิดรับการสนับสนุนได้");
      return;
    }
    setStoreData({ ...storeData, isSupportActive: !storeData.isSupportActive });
  };


  // ================= ฟังก์ชันส่วนระบบ โฆษณาสินค้า =================

  const handleLinkChange = (e) => {
    const url = e.target.value;
    let detectedPlatform = formData.platform;
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('shopee')) detectedPlatform = 'shopee';
    else if (lowerUrl.includes('lazada')) detectedPlatform = 'lazada';
    else if (lowerUrl.includes('tiktok')) detectedPlatform = 'tiktok';
    else if (lowerUrl.includes('facebook')) detectedPlatform = 'facebook';
    else if (lowerUrl.includes('thisshop')) detectedPlatform = 'thisshop';
    else if (lowerUrl.includes('line.me') || lowerUrl.includes('lineshopping')) detectedPlatform = 'lineshopping';
    setFormData({ ...formData, link: url, platform: detectedPlatform });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // เช็คขนาดไฟล์เบื้องต้นไม่เกิน 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("กรุณาเลือกรูปภาพที่มีขนาดไม่เกิน 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const url = await driveService.uploadAdImage(file);
      setFormData({ ...formData, imageUrl: url });
      setPreviewError(false);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(error.message || "อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitAd = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.link || !formData.imageUrl) {
      alert("กรุณากรอกข้อมูลและอัปโหลดรูปภาพให้ครบถ้วน");
      return;
    }
    
    if (userCredit < requiredCredit) {
      alert(`แต้มเครดิตของคุณไม่เพียงพอ (ต้องการ ${requiredCredit} แต้ม แต่คุณมี ${userCredit} แต้ม)`);
      return;
    }

    setSubmittingAd(true);
    try {
      // 1. กันแต้ม (Hold Credit) ทันที
      const isCreditHeld = await holdAdCredit(user.uid, requiredCredit, formData.title);
      if (!isCreditHeld) {
        throw new Error("ไม่สามารถหักแต้มเครดิตได้ กรุณาลองใหม่อีกครั้ง");
      }

      // 2. บันทึกข้อมูลโฆษณา
      const adPayload = {
        ...formData,
        partnerId: user.uid,
        partnerName: storeData.storeName || user.displayName || 'พาร์ทเนอร์',
        status: 'pending_approval',
        clicks: 0,
        impressions: 0,
        durationDays: durationDays,
        creditCost: requiredCredit,
        createdAt: serverTimestamp()
      };
      
      const adDocRef = await addDoc(
        collection(db, 'artifacts', appId, 'public', 'data', 'marketing_ads'), 
        adPayload
      );

      // 3. สร้าง Task ให้ผู้จัดการตรวจสอบ
      await addDoc(collection(db, 'todos'), {
        type: 'AD_APPROVAL',
        title: `ตรวจสอบโฆษณา: ${formData.title}`,
        description: `พาร์ทเนอร์ ${adPayload.partnerName} ต้องการลงโฆษณาประเภท ${formData.type} เป็นเวลา ${durationDays} วัน (ใช้ไป ${requiredCredit} แต้ม)`,
        status: 'todo',
        priority: 'Medium',
        adId: adDocRef.id,
        partnerId: user.uid,
        adPayload: adPayload,
        createdAt: serverTimestamp()
      });

      alert("ส่งข้อมูลโฆษณาเรียบร้อยแล้ว แอดมินจะทำการตรวจสอบก่อนอนุมัติ (แต้มถูกกันไว้แล้ว)");
      setIsFormOpen(false);
      setFormData({ title: '', description: '', imageUrl: '', link: '', platform: 'shopee', type: 'product', youtubeUrl: '' });
      setDurationDays(7);
      fetchUserCredit(); // อัปเดตแต้มใหม่
      fetchMyAds();
    } catch (error) {
      console.error("Error submitting ad:", error);
      alert(error.message || "เกิดข้อผิดพลาดในการบันทึกโฆษณา");
    } finally {
      setSubmittingAd(false);
    }
  };


  const getStatusBadge = (status) => {
    if (status === 'active') return <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12}/> ออนไลน์</span>;
    if (status === 'rejected') return <span className="bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><ShieldAlert size={12}/> ไม่ผ่านอนุมัติ</span>;
    return <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> รอตรวจสอบ</span>;
  };

  // ================= RENDER =================
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
          
          {/* Status Banner */}
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
                  Credit Point ปัจจุบัน: <span className="font-bold text-[#0870B8] text-sm">{userCredit.toLocaleString()}</span> Cradit
                </p>
              </div>
            </div>

            {/* อัจฉริยะ: ปุ่มเปิด-ปิด สไตล์ iOS */}
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
              
              {/* ข้อมูลพื้นฐาน */}
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

              {/* ข้อมูลแผนที่ */}
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
          
          {/* ส่วนสร้างโฆษณา (ถ้าไม่ได้เปิดอยู่ ให้โชว์ปุ่ม) */}
          {!isFormOpen && (
            <div className="flex justify-end">
              <button 
                onClick={() => setIsFormOpen(true)}
                className="px-5 py-2.5 bg-[#0870B8] hover:bg-[#0A85DA] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} /> ฝากลิงก์สินค้าใหม่
              </button>
            </div>
          )}

          {isFormOpen && (
            <div className="bg-white border border-[#0870B8]/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0870B8] opacity-5 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
              
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-800">ฝากลิงก์โปรโมทสินค้า</h3>
                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-rose-500">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col lg:flex-row gap-8">
                {/* ฟอร์มกรอกข้อมูล (เหมือนเดิม แต่อยู่ใน Tab 2) */}
                <form onSubmit={handleSubmitAd} className="w-full lg:w-1/2 space-y-4">

                  <div className="flex gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="adType" value="product" checked={formData.type === 'product'} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-4 h-4 text-[#0870B8]" />
                      <span className="text-sm font-bold text-slate-700">Product Ad (1:1)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="adType" value="billboard" checked={formData.type === 'billboard'} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-4 h-4 text-[#0870B8]" />
                      <span className="text-sm font-bold text-slate-700">Billboard Ad (16:9)</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">1. ชื่อสินค้าที่จะโปรโมท <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="เช่น กล้องวงจรปิดไร้สาย WiFi" required maxLength={50}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                      <span>2. ลิงก์ร้านค้า (Shopee/Lazada/Tiktok) <span className="text-rose-500">*</span></span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white uppercase ${
                        formData.platform === 'shopee' ? 'bg-[#EE4D2D]' : 
                        formData.platform === 'lazada' ? 'bg-[#0F146D]' : 
                        formData.platform === 'tiktok' ? 'bg-black' : 
                        formData.platform === 'facebook' ? 'bg-[#1877F2]' : 
                        formData.platform === 'thisshop' ? 'bg-[#E31E24]' : 
                        formData.platform === 'lineshopping' ? 'bg-[#06C755]' : 
                        'bg-slate-300 text-slate-600'
                      }`}>
                        {formData.platform}
                      </span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><LinkIcon size={16}/></div>
                      <input 
                        type="url" value={formData.link} onChange={handleLinkChange}
                        placeholder="https://..." required
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      3. อัปโหลดรูปภาพ <span className="text-rose-500">*</span> 
                      <span className="text-[10px] text-slate-400 font-normal ml-2">
                        ({formData.type === 'product' ? 'แนะนำ 1:1' : 'แนะนำ 16:9'})
                      </span>
                    </label>
                    <label className="relative flex items-center justify-center w-full px-4 py-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <input 
                        type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage}
                        className="hidden" 
                      />
                      {uploadingImage ? (
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Loader2 size={16} className="animate-spin"/> กำลังอัปโหลด...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <UploadCloud size={18}/> {formData.imageUrl ? 'เปลี่ยนรูปภาพ' : 'คลิกเพื่อเลือกไฟล์รูปภาพ'}
                        </div>
                      )}
                    </label>
                  </div>


                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">4. ข้อความกระตุ้น (สั้นๆ)</label>
                    <input 
                      type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="เช่น โค้ดส่วนลด 50% เก็บด่วน!" maxLength={30}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] text-sm"
                    />
                  </div>
                  {formData.type === 'product' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">5. Video Review (YouTube Link)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Video size={16}/></div>
                        <input 
                          type="url" value={formData.youtubeUrl} onChange={(e) => setFormData({...formData, youtubeUrl: e.target.value})}
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] text-sm"
                        />
                      </div>
                    </div>
                  )}

                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4">
                    <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">ระยะเวลาที่ต้องการลงโฆษณา</label>
                    <div className="flex items-center gap-4">
                      <select 
                        value={durationDays} 
                        onChange={(e) => setDurationDays(Number(e.target.value))}
                        className="px-4 py-2 border border-blue-200 rounded-lg text-sm font-bold text-blue-900 bg-white"
                      >
                        <option value={7}>7 วัน (70 Credit)</option>
                        <option value={15}>15 วัน (150 Credit)</option>
                        <option value={30}>30 วัน (300 Credit)</option>
                      </select>
                      <div className="text-sm">
                        ใช้แต้ม: <span className="font-bold text-rose-500">{requiredCredit}</span> Credit
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <button type="submit" disabled={submittingAd} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2">
                      {submittingAd ? <><Loader2 size={18} className="animate-spin"/> ส่งข้อมูล...</> : <><CheckCircle2 size={18}/> ส่งแอดมินตรวจสอบ</>}
                    </button>
                  </div>
                </form>

                {/* Live Preview */}
                <div className="w-full lg:w-1/2 bg-[#f8fbff] rounded-2xl border-2 border-dashed border-[#0870B8]/20 p-6 flex flex-col items-center justify-center">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <Eye size={16}/> ตัวอย่างการแสดงผล
                  </h4>
                  <div className={`w-full ${formData.type === 'product' ? 'max-w-[240px]' : 'max-w-full'} pointer-events-none transform scale-105 origin-top shadow-2xl rounded-2xl overflow-hidden`}>
                    {formData.type === 'product' ? (
                      <ProductAdCard 
                        ad={{
                          title: formData.title || 'ชื่อสินค้าจำลอง',
                          description: formData.description,
                          imageUrl: formData.imageUrl || 'https://placehold.co/400x400/f8fafc/94a3b8?text=Image',
                          platform: formData.platform,
                          partnerName: storeData.storeName || 'ชื่อร้านของคุณ',
                          youtubeUrl: formData.youtubeUrl
                        }}
                      />
                    ) : (
                      <div className="w-full aspect-video bg-slate-100 flex items-center justify-center relative border border-slate-200">
                        {formData.imageUrl ? (
                           <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Billboard Preview" />
                        ) : (
                           <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Billboard 16:9</div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                           <h3 className="text-white font-bold line-clamp-1">{formData.title || 'ป้ายแบนเนอร์จำลอง'}</h3>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* รายการโฆษณาที่ส่งไปแล้ว */}
          {!isFormOpen && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {ads.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100"><Megaphone size={28} className="text-slate-300"/></div>
                  <h3 className="font-bold text-slate-700">ยังไม่เคยสร้างป้ายโฆษณา</h3>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">โฆษณา</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">สถานะ</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">ประสิทธิภาพ</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ads.map((ad) => (
                        <tr key={ad.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 p-1 flex-shrink-0">
                                <img src={ad.imageUrl || '/logo.png'} alt="Ad" className="w-full h-full object-cover rounded" onError={(e)=>{e.target.src='https://placehold.co/100x100?text=No+Img'}}/>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 line-clamp-1">{ad.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold text-white ${
                                    ad.platform === 'shopee' ? 'bg-[#EE4D2D]' : ad.platform === 'lazada' ? 'bg-[#0F146D]' : ad.platform === 'tiktok' ? 'bg-black' : 'bg-slate-400'
                                  }`}>{ad.platform}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">{getStatusBadge(ad.status)}</td>
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-black text-slate-700">{ad.clicks || 0}</span>
                              <span className="text-[9px] text-slate-400 uppercase">คลิก</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={async () => {
                                if(window.confirm("คุณต้องการลบโฆษณานี้ใช่หรือไม่?")) {
                                  const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'marketing_ads', ad.id);
                                  await deleteDoc(docRef);
                                  fetchMyAds();
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            ><X size={18} /></button>
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