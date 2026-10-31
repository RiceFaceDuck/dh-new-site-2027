import React from 'react';
import { Store, ShieldAlert, ExternalLink, RefreshCw, Eye } from 'lucide-react';
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

  return (
    <div className="bg-white border border-slate-200/90 rounded-md shadow-md overflow-hidden animate-in fade-in duration-300">
      
      <div className="bg-slate-100/90 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/90">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><Store className="text-indigo-600"/> ศูนย์ข้อมูลร้านค้า (Store Profile)</h3>
          <p className="text-[11px] text-slate-500 mt-1">ข้อมูลในหน้านี้จะถูกนำไปใช้สร้าง <b>"โฆษณานามบัตร"</b> และแสดงผลบนแผนที่เรดาร์อัตโนมัติ</p>
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          {/* 🌟 ปุ่มทางลัด [หน้าร้าน] เพื่อเข้าสู่หน้าโปรไฟล์ตัวเอง */}
          {user?.uid && (
            <a
              href={`/store/${user.uid}`}
              target="_blank"
              rel="noopener noreferrer"
              title="เปิดดูหน้าร้านของคุณในมุมมองลูกค้า (แท็บใหม่)"
              className="bg-white hover:bg-slate-50 text-slate-800 hover:text-indigo-600 px-3.5 py-3 rounded-md flex items-center gap-2 border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all text-xs font-bold active:scale-95 group shrink-0"
            >
              <Store size={16} className="text-indigo-600 group-hover:scale-110 transition-transform" />
              <span>หน้าร้าน</span>
              <ExternalLink size={13} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </a>
          )}

          {/* 🌟 แสดงยอดเข้าชมหน้าร้าน (Store Profile Visits) แยกชัดเจนจากป้ายโฆษณา */}
          <div className="bg-white text-slate-800 px-3.5 py-2.5 rounded-md flex items-center gap-2 border border-slate-200 shadow-2xs shrink-0" title="ยอดเข้าชมหน้าร้านพาร์ทเนอร์ทั้งหมด">
            <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
              <Eye size={14} className="text-indigo-600" /> ยอดเข้าชมหน้าร้าน (Store Profile Visits):
            </span>
            <span className="font-mono font-black text-indigo-700 text-xs">
              {Number(storeData?.viewCount || 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">ครั้ง</span>
          </div>

          <div className="bg-white p-3 rounded-md flex items-center gap-4 border border-slate-200 shadow-2xs">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-widest">นามบัตรโฆษณา</div>
            <div className="text-[10px]">
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
          
          <label className={`relative inline-flex items-center ${isAdPending ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={isSwitchOn} 
              onChange={() => handleToggleSupport(!isSwitchOn)} 
              disabled={isAdPending} 
            />
            <div className="w-14 h-7 bg-slate-600 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
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

      {/* 📝 กล่องแจ้งเตือนกู้คืนแบบร่างชั่วคราวอัตโนมัติ */}
      {hasDraft && (
        <div className="mx-6 md:mx-8 mt-6 p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-[2px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs text-amber-900 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
            <span>
              <b>ระบบจำข้อมูลแบบร่างชั่วคราวให้แล้ว</b> (ข้อมูล รูปภาพ หรือพิกัด GPS ที่ทำค้างไว้ในเครื่องยังอยู่ครบ ไม่ต้องกรอกใหม่)
            </span>
          </div>
          {discardDraft && (
            <button
              type="button"
              onClick={discardDraft}
              className="text-amber-700 hover:text-rose-600 text-xs font-bold underline cursor-pointer shrink-0 transition-colors flex items-center gap-1"
            >
              <RefreshCw size={12} />
              <span>ยกเลิกแบบร่าง / คืนค่าข้อมูลเดิมจากระบบ</span>
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSaveStore} className="p-6 md:p-8 space-y-10">
        
        <StoreProfileBasicInfo 
          storeData={storeData} 
          setStoreData={setStoreData} 
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
