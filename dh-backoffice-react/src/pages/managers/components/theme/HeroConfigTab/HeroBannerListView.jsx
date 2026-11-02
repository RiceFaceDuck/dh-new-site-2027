import { Plus, MoveUp, MoveDown, Edit3, Trash2, Eye, EyeOff, Layers, Sparkles, Sliders, RefreshCw } from 'lucide-react';
import { getRenderableImageUrl, handleImageError } from 'dh-shared/src/utils/imageProcessingUtils.js';

export default function HeroBannerListView({
  heroConfig,
  onSelectBanner,
  onCreateBanner,
  onDeleteBanner,
  onToggleStatus,
  onMoveBanner,
  onUpdateGlobalSettings
}) {
  const banners = heroConfig.banners || [];
  const aspectRatio = heroConfig.aspectRatio || '16:9';
  const transitionEffect = heroConfig.transitionEffect || 'slide';
  const autoplay = heroConfig.autoplay !== false;
  const autoplaySpeed = heroConfig.autoplaySpeed || 5000;

  return (
    <div className="w-full space-y-6">
      {/* 1. Global Settings Card (Full Width & Spacious) */}
      <div className="bg-white border border-slate-300 rounded-[2px] p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <label className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sliders size={18} className="text-blue-600" /> ตั้งค่าระบบสไลเดอร์และสัดส่วนภาพ (Global Carousel Settings)
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              กำหนดสัดส่วนความกว้าง:ยาวของกรอบป้าย และเอฟเฟกต์การสลับรูปภาพ
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 rounded-[2px] border border-slate-300">
            <span className="text-xs font-bold text-slate-700">เปิดระบบป้ายทั้งหมด:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={heroConfig.isActive !== false}
                onChange={(e) => onUpdateGlobalSettings({ isActive: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Aspect Ratio Box */}
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-[2px] space-y-2.5">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Layers size={14} className="text-blue-600" /> ล็อกอัตราส่วนกล่อง (Aspect Ratio)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: '16:9', label: '16:9 (มาตรฐาน)' },
                { key: '3:1', label: '3:1 (แนวนอนยาว)' },
                { key: '21:9', label: '21:9 (พาโนรามา)' },
                { key: 'auto', label: 'Auto (ตามสัดส่วนเดิม)' }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onUpdateGlobalSettings({ aspectRatio: opt.key })}
                  className={`py-2 px-2 text-xs font-bold rounded-[2px] border transition-all cursor-pointer text-center ${
                    aspectRatio === opt.key 
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              * ล็อกกล่องคงรูป ทั้งบน PC และ Mobile รูปจะไม่ถูกตัดขอบ
            </p>
          </div>

          {/* Transition Effect Box */}
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-[2px] space-y-2.5">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles size={14} className="text-pink-600" /> เอฟเฟกต์การสลับรูป (Transition)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateGlobalSettings({ transitionEffect: 'slide' })}
                className={`py-2.5 px-3 text-xs font-bold rounded-[2px] border transition-all cursor-pointer text-center ${
                  transitionEffect === 'slide'
                    ? 'bg-pink-600 text-white border-pink-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                เลื่อนสไลด์ (Slide)
              </button>
              <button
                type="button"
                onClick={() => onUpdateGlobalSettings({ transitionEffect: 'fade' })}
                className={`py-2.5 px-3 text-xs font-bold rounded-[2px] border transition-all cursor-pointer text-center ${
                  transitionEffect === 'fade'
                    ? 'bg-pink-600 text-white border-pink-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                ค่อยๆ จางสลับ (Fade)
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              เลือกลักษณะความนุ่มนวลในการเปลี่ยนป้ายโฆษณา
            </p>
          </div>

          {/* Autoplay Speed Box */}
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-[2px] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <RefreshCw size={14} className="text-emerald-600" /> สไลด์อัตโนมัติ (Autoplay)
              </label>
              <input
                type="checkbox"
                checked={autoplay}
                onChange={(e) => onUpdateGlobalSettings({ autoplay: e.target.checked })}
                className="w-4 h-4 rounded-[2px] text-emerald-600 accent-emerald-600 cursor-pointer"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { speed: 3000, label: '3 วินาที' },
                { speed: 5000, label: '5 วินาที' },
                { speed: 7000, label: '7 วินาที' }
              ].map(item => (
                <button
                  key={item.speed}
                  type="button"
                  disabled={!autoplay}
                  onClick={() => onUpdateGlobalSettings({ autoplaySpeed: item.speed })}
                  className={`py-2 px-1 text-xs font-bold rounded-[2px] border transition-all cursor-pointer text-center disabled:opacity-40 disabled:cursor-not-allowed ${
                    autoplaySpeed === item.speed && autoplay
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              เวลาหน่วงในการค้างรูปก่อนสไลด์ไปป้ายถัดไป
            </p>
          </div>
        </div>
      </div>

      {/* 2. Banner List Header & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
        <div>
          <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>รายการป้ายโฆษณา ({banners.length} ป้าย)</span>
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            คลิกปุ่ม "แก้ไขรายละเอียด" เพื่อเข้าไปเปลี่ยนรูปภาพ ข้อความ หรือปุ่มกดของป้ายนั้นๆ
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateBanner}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-[2px] border border-blue-700 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus size={16} /> + เพิ่มป้ายโฆษณาใหม่ (Add New Banner)
        </button>
      </div>

      {/* 3. Banners List Table */}
      <div className="space-y-3">
        {banners.map((banner, index) => {
          const isFirst = index === 0;
          const isLast = index === banners.length - 1;
          const rawImageUrl = banner.imageUrl || '/user-bg.jpg';
          const imageUrl = getRenderableImageUrl(rawImageUrl) || '/user-bg.jpg';
          const titlePreview = banner.titleSegments?.map(s => s.text).join('') || banner.title || 'ไม่มีข้อความ';

          return (
            <div
              key={banner.id || index}
              className={`bg-white border rounded-[2px] p-4 shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                banner.isActive ? 'border-slate-300 hover:border-blue-400' : 'border-slate-200 opacity-65 bg-slate-50/70'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-center gap-4 flex-1 min-w-0 w-full md:w-auto">
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => onMoveBanner(banner.id, -1)}
                    title="เลื่อนขึ้น"
                    className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-20 disabled:hover:text-slate-500 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <MoveUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => onMoveBanner(banner.id, 1)}
                    title="เลื่อนลง"
                    className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-20 disabled:hover:text-slate-500 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <MoveDown size={14} />
                  </button>
                </div>

                {/* Order Index */}
                <div className="w-9 h-9 rounded-[2px] bg-slate-100 text-slate-800 font-mono font-bold text-xs flex items-center justify-center border border-slate-300 shrink-0">
                  #{index + 1}
                </div>

                {/* Thumbnail Preview */}
                <div className="w-28 h-16 bg-slate-900 border border-slate-300 rounded-[2px] overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                  <img
                    src={imageUrl}
                    alt="Thumbnail"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageError(e, banner.imageUrl, '/user-bg.jpg')}
                    className={`w-full h-full ${banner.imageFit === 'contain' ? 'object-contain' : 'object-cover'}`}
                  />
                </div>

                {/* Title & Badges */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {banner.badge?.text ? `[${banner.badge.text}] ` : ''}
                      {titlePreview.replace(/<[^>]*>?/gm, '') || `ป้ายที่ ${index + 1}`}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[2px] border shrink-0 ${
                      banner.isActive 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}>
                      {banner.isActive ? 'เปิดใช้งาน' : 'ปิด'}
                    </span>
                    <span className="text-[10px] text-slate-600 border border-slate-300 px-2 py-0.5 rounded-[2px] bg-slate-50 shrink-0">
                      {banner.imageFit === 'contain' ? 'เห็นครบทั้งภาพ (Contain)' : 'เต็มขอบกล่อง (Cover)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    ปุ่มหลัก: {banner.primaryButton?.label || 'ไม่มี'} ({banner.primaryButton?.link || '-'})
                  </p>
                </div>
              </div>

              {/* Action Buttons (Spacious & No Wrapping) */}
              <div className="flex items-center gap-2.5 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleStatus(banner.id)}
                  title={banner.isActive ? 'คลิกเพื่อปิดพักป้าย' : 'คลิกเพื่อเปิดใช้งาน'}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-[2px] border transition-colors cursor-pointer shrink-0 ${
                    banner.isActive 
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300' 
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300'
                  }`}
                >
                  {banner.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{banner.isActive ? 'ปิดพักป้าย' : 'เปิดใช้งาน'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectBanner(banner.id)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-[2px] border border-blue-300 transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  <Edit3 size={14} />
                  <span>แก้ไขรายละเอียด</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteBanner(banner.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-[2px] border border-slate-300 transition-colors cursor-pointer shrink-0"
                  title="ลบป้ายนี้"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {banners.length === 0 && (
          <div className="text-center p-8 bg-white border border-dashed border-slate-300 rounded-[2px] text-slate-500 space-y-3">
            <p className="text-sm font-bold">ยังไม่มีป้ายโฆษณาในระบบ</p>
            <button
              type="button"
              onClick={onCreateBanner}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-[2px] shadow-sm hover:bg-blue-700 cursor-pointer"
            >
              <Plus size={16} /> สร้างป้ายโฆษณาแรก
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
