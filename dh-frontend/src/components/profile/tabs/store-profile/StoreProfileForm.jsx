import React from 'react';
import { Store, ShieldAlert, ExternalLink, RefreshCw, Eye, Heart } from 'lucide-react';
import StoreProfileBasicInfo from './StoreProfileBasicInfo';
import StoreProfileSocialLinks from './StoreProfileSocialLinks';
import StoreProfileLocation from './StoreProfileLocation';

import { useStoreProfile } from './hooks/useStoreProfile';
import { useGeolocation } from '../../../../hooks/useGeolocation';
import { useToast } from '../../../../context/ToastContext';

const StoreProfileForm = ({ 
  storeData, 
  setStoreData, 
  user, 
  appId, 
  businessCardAd, 
  fetchMyAds, 
  userCredit = 0,
  hasDraft = false,
  isDraftSaving = false,
  discardDraft,
  commitSavedData
}) => {
  const { showToast } = useToast();
  const {
    savingStore,
    uploadingStoreImage,
    uploadingGallery,
    isAdPending,
    handleStoreImageUpload,
    handleGalleryImageUpload,
    handleRemoveGalleryImage,
    handleToggleSupport,
    handleSaveStore
  } = useStoreProfile(storeData, setStoreData, user, appId, businessCardAd, fetchMyAds, commitSavedData);

  const { getUserCurrentLocation, isLocating } = useGeolocation();

  const handleGetLocation = async () => {
    try {
      const coords = await getUserCurrentLocation();
      setStoreData(prev => ({ ...prev, latitude: coords.latitude, longitude: coords.longitude }));
      showToast('ดึงพิกัดตำแหน่งปัจจุบันสำเร็จแล้วครับ 📍', 'success');
      return coords;
    } catch (error) {
      if (error?.isPermissionDenied || error?.code === 1) {
        // ไม่แสดง Error สีแดงที่ทำให้ตกใจ แนะนำวิธีเปิดสิทธิ์อย่างนุ่มนวล
        showToast('💡 หากต้องการให้ระบุพิกัดอัตโนมัติ สามารถแตะเปิดการอนุญาตที่ไอคอน 🔒 ข้างแถบ URL ได้ครับ', 'info');
      } else {
        console.error("🔥 Geolocation Error:", error);
        showToast(error?.message || 'ไม่สามารถค้นหาพิกัดได้ในขณะนี้', 'warning');
      }
      throw error;
    }
  };

  // 🛡️ ซิงค์สถานะการเปิดรับงาน: ต้องได้รับการอนุมัติจริงจากระบบเท่านั้นจึงจะถือว่า Live
  const isApprovedAndLive = businessCardAd 
    && ['APPROVED', 'ACTIVE'].includes(String(businessCardAd.status).toUpperCase());

  // สถานะเปิดสวิตช์ (ทั้งที่อนุมัติแล้ว หรือกำลังเปิดเพื่อเตรียมส่งบันทึก)
  const isSwitchOn = businessCardAd 
    ? ['APPROVED', 'ACTIVE'].includes(String(businessCardAd.status).toUpperCase()) 
    : Boolean(storeData.isSupportActive);

  const hasNoCredit = Number(userCredit || 0) <= 0;

  // 📊 สถิตินามบัตรและหน้าร้าน 4 มิติ (Views, Visits, CTR, Likes)
  const views = Math.max(0, Number(businessCardAd?.stats?.views || 0));
  const visits = Math.max(0, Number(businessCardAd?.stats?.clicks ?? storeData?.viewCount ?? 0));
  const ctr = views > 0 ? ((visits / views) * 100).toFixed(1) : '0.0';
  const likes = Math.max(0, Number(storeData?.likeCount || 0));

  return (
    <div className="bg-white border border-slate-200/90 rounded-md shadow-md overflow-hidden animate-in fade-in duration-300">
      
      {/* 🏛️ 2-Tier Dashboard Header */}
      <div className="bg-slate-100/90 p-5 md:p-6 border-b border-slate-200/90 space-y-4">
        {/* Tier 1: Title & Storefront Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Store className="text-indigo-600" size={22} />
              <span>ศูนย์ข้อมูลร้านค้า</span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-[2px] tracking-wide">STORE PROFILE</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ข้อมูลในหน้านี้จะถูกนำไปใช้สร้าง <b className="text-slate-700">"โฆษณานามบัตร"</b> และแสดงผลบนแผนที่เรดาร์อัตโนมัติ
            </p>
          </div>
          
          {/* 🌟 ปุ่มทางลัด [ดูหน้าร้านของคุณ ↗] */}
          {user?.uid && (
            <a
              href={`/store/${user.uid}`}
              target="_blank"
              rel="noopener noreferrer"
              title="เปิดดูหน้าร้านของคุณในมุมมองลูกค้า (แท็บใหม่)"
              className="self-start sm:self-center bg-white hover:bg-slate-50 text-slate-800 hover:text-indigo-600 px-3.5 py-2 rounded-md flex items-center gap-2 border border-slate-300 shadow-2xs hover:border-indigo-400 transition-all text-xs font-bold active:scale-95 group shrink-0"
            >
              <Store size={15} className="text-indigo-600 group-hover:scale-110 transition-transform" />
              <span>ดูหน้าร้านของคุณ</span>
              <ExternalLink size={13} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </a>
          )}
        </div>

        {/* Tier 2: Dedicated Metric & Ad Control Bar */}
        <div className="bg-white/90 p-3 sm:px-4 sm:py-3 rounded-[2px] border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* 🌟 สถิตินามบัตรและหน้าร้าน (Store & Ad Telemetry Metrics) */}
          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-2.5 gap-y-1.5 text-xs">
            {/* การมองเห็น */}
            <div className="flex items-baseline gap-1" title="จำนวนครั้งที่นามบัตรโฆษณาแสดงผลในระบบ">
              <span className="font-bold text-slate-600">การมองเห็น:</span>
              <span className="font-mono font-black text-slate-800 text-sm">
                {views.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400">ครั้ง</span>
            </div>

            <span className="text-slate-300 font-light select-none">|</span>

            {/* เข้าชมร้าน */}
            <div className="flex items-baseline gap-1" title="จำนวนครั้งที่มีผู้เข้าชมหน้าร้าน">
              <span className="font-bold text-slate-600">เข้าชมร้าน:</span>
              <span className="font-mono font-black text-indigo-700 text-sm">
                {visits.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400">ครั้ง</span>
            </div>

            <span className="text-slate-300 font-light select-none">|</span>

            {/* CTR */}
            <div className="flex items-baseline gap-1" title="อัตราส่วนการคลิกเข้าชมเทียบกับการมองเห็น (Click-Through Rate)">
              <span className="font-bold text-slate-600">CTR:</span>
              <span className="font-mono font-black text-emerald-600 text-sm">
                {ctr}%
              </span>
            </div>

            <span className="text-slate-300 font-light select-none">|</span>

            {/* ถูกใจ */}
            <div className="flex items-baseline gap-1" title="ยอดผู้กดถูกใจร้านค้า">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Heart size={13} className="text-rose-500 fill-rose-500 inline-block shrink-0" /> ถูกใจ:
              </span>
              <span className="font-mono font-black text-rose-600 text-sm">
                {likes.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 🌟 สวิตช์และสถานะนามบัตรโฆษณา */}
          <div className="flex items-center gap-3 self-end sm:self-center pl-2 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-left sm:text-right">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">นามบัตรโฆษณา</div>
              <div className="text-[11px] whitespace-nowrap">
                {businessCardAd?.status?.toUpperCase() === 'PAUSED' ? (
                  <span className="text-orange-600 font-bold">🟠 ถูกระงับการแสดงผล (Paused)</span>
                ) : isAdPending ? (
                  <span className="text-amber-600 font-bold">🟡 รอตรวจสอบ (Pending)</span>
                ) : isApprovedAndLive && hasNoCredit ? (
                  <span className="text-slate-500 font-bold">⚪ ไม่แสดง (No Credit)</span>
                ) : isApprovedAndLive ? (
                  <span className="text-emerald-600 font-bold">🟢 โฆษณาทำงานอยู่ (Live)</span>
                ) : businessCardAd?.status?.toUpperCase() === 'REJECTED' ? (
                  <span className="text-rose-600 font-bold">🔴 ไม่ผ่านอนุมัติ</span>
                ) : isSwitchOn ? (
                  <span className="text-amber-600 font-bold">🟡 รอการบันทึก (กรุณากดบันทึกด้านล่าง)</span>
                ) : (
                  <span className="text-slate-500">⚫ ปิดการแสดงผล</span>
                )}
              </div>
            </div>
            
            <label className={`relative inline-flex items-center shrink-0 ${isAdPending ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isSwitchOn} 
                onChange={() => handleToggleSupport(!isSwitchOn)} 
                disabled={isAdPending} 
              />
              <div className="w-12 h-6 bg-slate-400 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 🛑 กล่องแจ้งเตือนเหตุผลการปฏิเสธจากผู้จัดการ */}
      {businessCardAd?.status?.toUpperCase() === 'REJECTED' && (
        <div className="mx-6 md:mx-8 mt-6 p-4 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-3">
          <div className="p-1.5 bg-rose-100 text-rose-600 rounded-md shrink-0 mt-0.5">
            <ShieldAlert size={18} />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-black text-rose-800 uppercase tracking-wide">คำขอเปิดนามบัตรไม่ผ่านการอนุมัติ</h4>
            <p className="text-xs text-rose-700 mt-1">
              <b>เหตุผลจากผู้จัดการ:</b> {businessCardAd.rejectReason || 'ข้อมูลไม่ผ่านเกณฑ์การตรวจสอบ กรุณาตรวจสอบความถูกต้องของข้อมูลร้านและพิกัด'}
            </p>
            <p className="text-[11px] text-rose-600/80 mt-1">💡 ท่านสามารถแก้ไขข้อมูลร้านให้ถูกต้องด้านล่าง แล้วกด "บันทึกข้อมูลและส่งตรวจใหม่" ได้ทันที</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveStore} className="p-6 md:p-8 space-y-10">
        
        <StoreProfileBasicInfo 
          storeData={storeData} 
          setStoreData={setStoreData} 
          hasDraft={hasDraft}
          isDraftSaving={isDraftSaving}
          uploadingStoreImage={uploadingStoreImage} 
          handleStoreImageUpload={handleStoreImageUpload} 
          uploadingGallery={uploadingGallery}
          handleGalleryImageUpload={handleGalleryImageUpload}
          handleRemoveGalleryImage={handleRemoveGalleryImage}
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

        <div className="pt-6 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={savingStore}
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {savingStore ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <span>บันทึกข้อมูลร้านค้า</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreProfileForm;
