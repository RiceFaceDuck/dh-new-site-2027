/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Search, Loader2, Link as LinkIcon, Image as ImageIcon, CheckCircle2, ShieldAlert, X, Eye } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';

// 🚀 นำเข้า Component การ์ดโฆษณา เพื่อเอามาทำ Live Preview!
import ProductAdCard from '../../ads/ProductAdCard';

const TabAdManager = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // State สำหรับฟอร์มสร้างโฆษณา
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    platform: 'shopee' // ค่าเริ่มต้น
  });

  const [previewError, setPreviewError] = useState(false);

  // 1. 📡 Fetch ข้อมูลโฆษณาของตัวเอง (Real-time ไม่ผ่าน Cache เพื่อให้พาร์ทเนอร์เห็นสถานะล่าสุด)
  const fetchMyAds = async () => {
    setLoading(true);
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const q = query(
        collection(db, 'artifacts', typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id', 'public', 'data', 'marketing_ads'),
        where('partnerId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const myAds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAds(myAds);
    } catch (error) {
      console.error("Error fetching my ads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAds();
  }, []);

  // 2. 🤖 Smart Feature: ตรวจจับ Platform อัตโนมัติจาก Link
  const handleLinkChange = (e) => {
    const url = e.target.value;
    let detectedPlatform = formData.platform;
    
    if (url.toLowerCase().includes('shopee')) detectedPlatform = 'shopee';
    else if (url.toLowerCase().includes('lazada')) detectedPlatform = 'lazada';
    else if (url.toLowerCase().includes('tiktok')) detectedPlatform = 'tiktok';

    setFormData({ ...formData, link: url, platform: detectedPlatform });
  };

  // 3. ฟังก์ชันกดยืนยันส่งโฆษณา (ถูกล็อกสถานะให้รออนุมัติเสมอ)
  const handleSubmitAd = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.link) {
      alert("กรุณากรอกชื่อสินค้าและลิงก์ให้ครบถ้วน");
      return;
    }

    setSubmitting(true);
    const auth = getAuth();
    const user = auth.currentUser;

    try {
      const adPayload = {
        ...formData,
        partnerId: user.uid,
        partnerName: user.displayName || 'พาร์ทเนอร์',
        status: 'pending_approval', // 🔒 ล็อกสถานะไว้รอแอดมินอนุมัติ
        clicks: 0,
        impressions: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(
        collection(db, 'artifacts', typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id', 'public', 'data', 'marketing_ads'), 
        adPayload
      );
      
      alert("ส่งข้อมูลโฆษณาเรียบร้อยแล้ว แอดมินจะทำการตรวจสอบลิงก์ก่อนอนุมัติครับ");
      setIsFormOpen(false);
      setFormData({ title: '', description: '', imageUrl: '', link: '', platform: 'shopee' });
      fetchMyAds(); // รีเฟรชรายการ

    } catch (error) {
      console.error("Error submitting ad:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกโฆษณา");
    } finally {
      setSubmitting(false);
    }
  };

  // ฟังก์ชันช่วยแสดงป้ายสถานะ
  const getStatusBadge = (status) => {
    if (status === 'active') return <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12}/> ออนไลน์</span>;
    if (status === 'rejected') return <span className="bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><ShieldAlert size={12}/> ไม่ผ่านอนุมัติ</span>;
    return <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> รอตรวจสอบ</span>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
         <Loader2 size={32} className="animate-spin mb-3 text-[#0870B8]" />
         <p className="text-sm font-tech">LOADING ADVERTISEMENTS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ==========================================
          🌟 Header & Summary
          ========================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Megaphone className="text-[#0870B8]" size={24} /> ศูนย์ควบคุมโฆษณาพาร์ทเนอร์
          </h2>
          <p className="text-sm text-slate-500 mt-1">โปรโมทสินค้าของคุณบนหน้าเว็บ DH เพื่อเพิ่มยอดขาย</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="px-5 py-2.5 bg-[#0870B8] hover:bg-[#0A85DA] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} /> สร้างโฆษณาใหม่
          </button>
        )}
      </div>

      {/* ==========================================
          🌟 โหมด 1: ฟอร์มสร้างโฆษณา (เปิด-ปิดได้) พร้อม Live Preview
          ========================================== */}
      {isFormOpen && (
        <div className="bg-white border border-[#0870B8]/20 rounded-3xl p-6 shadow-xl relative overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0870B8] opacity-5 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
          
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h3 className="font-bold text-lg text-slate-800">สร้างป้ายโฆษณาใหม่</h3>
            <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-rose-500">
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* ซ้าย: ฟอร์มกรอกข้อมูล */}
            <form onSubmit={handleSubmitAd} className="w-full lg:w-1/2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">1. ชื่อสินค้าที่จะโปรโมท <span className="text-rose-500">*</span></label>
                <input 
                  type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="เช่น กล้องวงจรปิดไร้สาย WiFi" required maxLength={50}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                  <span>2. ลิงก์ร้านค้า (Shopee/Lazada/Tiktok) <span className="text-rose-500">*</span></span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white uppercase ${
                    formData.platform === 'shopee' ? 'bg-[#EE4D2D]' : formData.platform === 'lazada' ? 'bg-[#0F146D]' : formData.platform === 'tiktok' ? 'bg-black' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {formData.platform}
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><LinkIcon size={16}/></div>
                  <input 
                    type="url" value={formData.link} onChange={handleLinkChange}
                    placeholder="https://..." required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">3. ลิงก์รูปภาพสินค้า</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><ImageIcon size={16}/></div>
                  <input 
                    type="url" value={formData.imageUrl} onChange={(e) => { setFormData({...formData, imageUrl: e.target.value}); setPreviewError(false); }}
                    placeholder="https://... (ถ้ารูปไม่ขึ้นในกล่องขวา ให้ลองเปลี่ยนลิงก์)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">4. ข้อความกระตุ้น (สั้นๆ)</label>
                <input 
                  type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="เช่น โค้ดส่วนลด 50% เก็บด่วน!" maxLength={30}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] transition-all text-sm"
                />
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex gap-3">
                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2">
                  {submitting ? <><Loader2 size={18} className="animate-spin"/> ส่งข้อมูล...</> : <><CheckCircle2 size={18}/> ส่งแอดมินตรวจสอบ</>}
                </button>
              </div>
            </form>

            {/* ขวา: Live Preview จำลองการ์ด */}
            <div className="w-full lg:w-1/2 bg-[#f8fbff] rounded-2xl border-2 border-dashed border-[#0870B8]/20 p-6 flex flex-col items-center justify-center">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Eye size={16}/> ตัวอย่างการแสดงผล (Live Preview)
              </h4>
              
              <div className="w-full max-w-[240px] pointer-events-none transform scale-105 origin-top shadow-2xl rounded-2xl">
                {/* 🚀 เรียกใช้ Component จริง เพื่อให้พาร์ทเนอร์เห็น 100% ว่ามันหน้าตายังไง */}
                <ProductAdCard 
                  ad={{
                    title: formData.title || 'ชื่อสินค้าจำลอง',
                    description: formData.description,
                    imageUrl: formData.imageUrl || 'https://placehold.co/400x400/f8fafc/94a3b8?text=Image',
                    platform: formData.platform,
                    partnerName: 'ชื่อร้านของคุณ'
                  }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-6 text-center">การ์ดใบนี้จะไปแทรกอยู่ในหน้า "สินค้าแนะนำ" หากได้รับการอนุมัติ</p>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          🌟 โหมด 2: รายการโฆษณาที่เคยฝากไว้
          ========================================== */}
      {!isFormOpen && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {ads.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100"><Megaphone size={28} className="text-slate-300"/></div>
              <h3 className="font-bold text-slate-700">ยังไม่เคยสร้างป้ายโฆษณา</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">โปรโมทร้านค้าของคุณได้ง่ายๆ เพียงกดปุ่ม "สร้างโฆษณาใหม่" ด้านบน</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">โฆษณา (Ad Info)</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">สถานะ (Status)</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">ประสิทธิภาพ (Stats)</th>
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
                              <span className="text-[10px] text-slate-400 font-tech">{new Date(ad.createdAt?.toDate()).toLocaleDateString('th-TH')}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(ad.status)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-slate-700">{ad.clicks || 0}</span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider">คลิก (Clicks)</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={async () => {
                            if(window.confirm("คุณต้องการลบโฆษณานี้ใช่หรือไม่?")) {
                              const docRef = doc(db, 'artifacts', typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id', 'public', 'data', 'marketing_ads', ad.id);
                              await deleteDoc(docRef);
                              fetchMyAds();
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="ลบโฆษณา"
                        >
                          <X size={18} />
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
  );
};

export default TabAdManager;