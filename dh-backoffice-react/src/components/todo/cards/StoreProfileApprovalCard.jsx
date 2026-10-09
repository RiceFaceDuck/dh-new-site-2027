import { useState } from 'react';
import { 
  Store, 
  Phone, 
  MapPin, 
  Clock, 
  ExternalLink, 
  Image as ImageIcon, 
  Check, 
  X, 
  Globe, 
  Navigation, 
  ZoomIn,
  Sparkles,
  Wrench,
  FileText
} from 'lucide-react';
import { getRenderableImageUrl, handleImageError } from 'dh-shared/src/utils/imageProcessingUtils.js';

export default function StoreProfileApprovalCard({ 
  todo, 
  isProcessing, 
  urgencyLevel, 
  handleAction, 
  getStatusBadge, 
  formatDate, 
  handleRejectClick 
}) {
  const [previewImage, setPreviewImage] = useState(null);

  // สกัดข้อมูลร้านค้าจาก Payload หรือ Details
  const store = todo.adPayload || todo.adDetails || todo.payload?.adPayload || todo.payload?.adDetails || {};
  const storeName = store.title || store.partnerName || todo.customerName || todo.title?.replace('ตรวจสอบนามบัตร: ', '') || 'ไม่ระบุชื่อร้าน';
  const phone = store.phone || todo.phone || '';
  const description = store.description || '';
  const services = store.services || '';
  const richDescription = store.richDescription || '';
  const openHours = store.openHours || '';
  const address = store.address || '';
  const landmarks = store.landmarks || '';
  const latitude = store.latitude;
  const longitude = store.longitude;
  const hasCoordinates = Boolean(latitude && longitude);
  const mapLink = store.googleMapLink || (hasCoordinates ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}` : null);
  
  const rawStoreImage = store.imageUrl || store.storeImage || '';
  const storeImage = rawStoreImage && rawStoreImage !== '/logo.png' ? rawStoreImage : '';
  const galleryImages = Array.isArray(store.galleryImages) ? store.galleryImages : [];

  // สีขอบตามระดับความเร่งด่วน
  const borderAccent = urgencyLevel === 'high' 
    ? 'border-red-300 dark:border-red-900 ring-1 ring-red-400/30' 
    : urgencyLevel === 'medium'
    ? 'border-amber-300 dark:border-amber-900'
    : 'border-slate-200 dark:border-slate-700';

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xs border ${borderAccent} flex flex-col h-full relative overflow-hidden transition-all hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600`}>
      
      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center transition-all duration-300">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-indigo-600 mb-2"></div>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">กำลังดำเนินการ...</span>
        </div>
      )}

      {/* 1. Header: ชื่อร้านและสถานะ */}
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-800/60 shadow-xs shrink-0 mt-0.5">
            <Store size={22} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 tracking-wider">
                🏪 ข้อมูลร้านค้าพาร์ทเนอร์
              </span>
              {todo.priority === 'High' && (
                <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-md shadow-xs">
                  ด่วนมาก
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-snug mt-1 truncate" title={storeName}>
              {storeName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-slate-400 font-mono">
                #{todo.id?.slice(-8).toUpperCase()}
              </span>
              {getStatusBadge ? getStatusBadge(todo.status) : (
                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">รอตรวจสอบ</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. เนื้อหาหลัก */}
      <div className="flex-1 space-y-3.5 mb-5 text-xs text-slate-600 dark:text-slate-300">

        {/* รูปหน้าร้าน และ เบอร์โทร/เวลาเปิดปิด */}
        <div className="flex gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <div 
            onClick={() => storeImage && setPreviewImage(storeImage)}
            className="w-22 h-22 rounded-xl bg-white dark:bg-slate-800 overflow-hidden shadow-xs shrink-0 border border-slate-200 dark:border-slate-700 relative group cursor-pointer flex items-center justify-center"
          >
            {storeImage ? (
              <img 
                src={getRenderableImageUrl(storeImage)} 
                alt={storeName} 
                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                loading="lazy" 
                referrerPolicy="no-referrer"
                onError={(e) => handleImageError(e, storeImage, '/dh-logo.png')}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50 dark:bg-slate-800/50">
                <Store size={26} className="text-slate-400 mb-1" />
                <span className="text-[9px] text-slate-400 font-bold">ไม่มีรูปภาพ</span>
              </div>
            )}
            {storeImage && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <ZoomIn size={18} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              {phone ? (
                <a 
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
                >
                  <Phone size={14} className="text-emerald-500 shrink-0" />
                  <span>{phone}</span>
                </a>
              ) : (
                <span className="text-slate-400 italic">ไม่มีเบอร์โทร</span>
              )}

              {openHours && (
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 mt-1 font-medium">
                  <Clock size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">เวลาทำการ: {openHours}</span>
                </div>
              )}
            </div>

            {/* พิกัด GPS & แผนที่ */}
            <div className="mt-1 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                <MapPin size={13} className="text-rose-500 shrink-0" />
                <span className="truncate font-mono">
                  {hasCoordinates ? `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}` : (address || 'ไม่ระบุพิกัด')}
                </span>
              </div>
              {mapLink && (
                <a 
                  href={mapLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md"
                >
                  <Navigation size={10} /> แผนที่
                </a>
              )}
            </div>
          </div>
        </div>

        {/* จุดเด่น / คำอธิบายสั้นๆ */}
        {description && (
          <div className="bg-amber-50/60 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/70 dark:border-amber-900/40">
            <div className="flex items-center gap-1 font-bold text-amber-900 dark:text-amber-300 text-[11px] mb-0.5">
              <Sparkles size={12} className="text-amber-500 shrink-0" /> คำอธิบายสั้นๆ (จุดเด่นร้าน)
            </div>
            <p className="text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
              {description}
            </p>
          </div>
        )}

        {/* รูปแบบการให้บริการ (Services) */}
        {services && (
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <div className="flex items-center gap-1 font-bold text-indigo-900 dark:text-indigo-300 text-[11px] mb-0.5">
              <Wrench size={12} className="text-indigo-500 shrink-0" /> รูปแบบการให้บริการ (Services)
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {services}
            </p>
          </div>
        )}

        {/* รายละเอียดร้านค้าแบบเต็ม */}
        {richDescription && richDescription !== services && richDescription !== description && (
          <div className="bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] leading-relaxed">
            <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 text-[11px] mb-0.5">
              <FileText size={12} className="text-slate-400 shrink-0" /> รายละเอียดร้านค้าแบบเต็ม
            </div>
            <p className="text-slate-600 dark:text-slate-300 line-clamp-3">
              {richDescription}
            </p>
          </div>
        )}

        {/* จุดสังเกตและที่อยู่ (ถ้ามี) */}
        {(address || landmarks) && (
          <div className="bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] leading-relaxed">
            <span className="font-bold text-slate-500">📍 ที่ตั้ง/จุดสังเกต: </span>
            <span>{[address, landmarks].filter(Boolean).join(' (จุดสังเกต: ') + (landmarks ? ')' : '')}</span>
          </div>
        )}

        {/* ลิงก์โซเชียลมีเดีย */}
        {(() => {
          const links = [
            { label: 'LINE', url: store.lineUrl, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' },
            { label: 'Messenger', url: store.messengerUrl, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200' },
            { label: 'Shopee', url: store.shopeeUrl, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200' },
            { label: 'Lazada', url: store.lazadaUrl, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200' },
            { label: 'TikTok', url: store.tiktokUrl, color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40 border-pink-200' },
            { label: 'YouTube', url: store.youtubeUrl, color: 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-200' },
            { label: 'Website', url: store.websiteUrl, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200' },
          ].filter(l => Boolean(l.url));

          if (links.length === 0) return null;

          return (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${link.color} hover:opacity-80 transition-opacity`}
                >
                  <Globe size={10} /> {link.label} <ExternalLink size={9} />
                </a>
              ))}
            </div>
          );
        })()}

        {/* ภาพแกลเลอรีร้าน (ถ้ามี) */}
        {galleryImages.length > 0 && (
          <div className="pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              📸 ภาพบรรยากาศร้าน ({galleryImages.length} รูป)
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {galleryImages.map((imgUrl, idx) => (
                <div 
                  key={idx}
                  onClick={() => setPreviewImage(imgUrl)}
                  className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 relative group"
                >
                  <img 
                    src={getRenderableImageUrl(imgUrl)} 
                    alt={`gallery-${idx}`} 
                    className="w-full h-full object-cover" 
                    loading="lazy" 
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageError(e, imgUrl, '/dh-logo.png')}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <ZoomIn size={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ข้อมูลการสร้างคำขอ */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] text-slate-400">
          <span>ส่งคำขอเมื่อ:</span>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            {formatDate(todo.createdAt || todo.requestedAt)}
          </span>
        </div>
      </div>

      {/* 3. Action Buttons: ปุ่มอนุมัติและปฏิเสธสำหรับแอดมิน */}
      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
        <button
          onClick={() => handleAction(todo.id, 'approve', todo.type, todo.payload || todo)}
          disabled={isProcessing}
          className="flex-1 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          title="อนุมัติข้อมูลร้านค้าให้เปิดใช้งานบนระบบ"
        >
          <Check size={16} strokeWidth={3} /> อนุมัติร้านค้า
        </button>

        <button
          onClick={handleRejectClick}
          disabled={isProcessing}
          className="flex justify-center items-center gap-1.5 bg-white dark:bg-slate-800 border-2 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="ปฏิเสธคำขอและระบุเหตุผล"
        >
          <X size={16} strokeWidth={2.5} /> ปฏิเสธ
        </button>
      </div>

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black text-white p-2 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
            <img 
              src={getRenderableImageUrl(previewImage)} 
              alt="Preview" 
              className="w-full h-full max-h-[85vh] object-contain" 
              referrerPolicy="no-referrer"
              onError={(e) => handleImageError(e, previewImage, '/dh-logo.png')}
            />
          </div>
        </div>
      )}
    </div>
  );
}
