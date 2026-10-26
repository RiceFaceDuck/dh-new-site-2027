import { useState } from 'react';
import PartnerReviews from './PartnerReviews';
import GalleryLightbox from './GalleryLightbox';
import { MapPin, ExternalLink } from 'lucide-react';

const formatLineUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (trimmed.includes('lin.ee') || trimmed.includes('line.me')) {
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }
  const cleaned = trimmed.replace(/^https?:\/\//i, '').replace(/^id:\s*/i, '').trim();
  if (!cleaned) return '';
  if (cleaned.startsWith('@')) return `https://line.me/R/ti/p/${cleaned}`;
  if (cleaned.includes('.') || cleaned.includes('/')) return `https://${cleaned}`;
  return `https://line.me/R/ti/p/~${cleaned}`;
};

const formatMessengerUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (trimmed.includes('m.me') || trimmed.includes('facebook.com')) {
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }
  const cleaned = trimmed.replace(/^https?:\/\//i, '').trim();
  if (!cleaned.includes('.') && !cleaned.includes('/')) return `https://m.me/${cleaned}`;
  return `https://${cleaned}`;
};

const formatYoutubeUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  const m = trimmed.match(/^https?:\/\/@(.*)/i);
  if (m) return `https://www.youtube.com/@${m[1]}`;
  if (trimmed.startsWith('@')) return `https://www.youtube.com/${trimmed}`;
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }
  const cleaned = trimmed.replace(/^https?:\/\//i, '').trim();
  if (!cleaned.includes('.') && !cleaned.includes('/')) return `https://www.youtube.com/@${cleaned}`;
  return `https://${cleaned}`;
};

const formatTiktokUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  const m = trimmed.match(/^https?:\/\/@(.*)/i);
  if (m) return `https://www.tiktok.com/@${m[1]}`;
  if (trimmed.startsWith('@')) return `https://www.tiktok.com/${trimmed}`;
  if (trimmed.includes('tiktok.com')) {
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }
  const cleaned = trimmed.replace(/^https?:\/\//i, '').trim();
  if (!cleaned.includes('.') && !cleaned.includes('/') && !cleaned.endsWith('@gmail.com')) {
    return `https://www.tiktok.com/@${cleaned}`;
  }
  return `https://${cleaned}`;
};

const formatExternalUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const StoreProfileInfo = ({ partner, currentUser }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(null);

  // 📍 คำนวณลิงก์ Google Maps จาก mapsUrl, googleMapLink หรือพิกัด GPS (latitude, longitude)
  const lat = Number(partner.latitude ?? partner.storeProfile?.latitude ?? 0);
  const lng = Number(partner.longitude ?? partner.storeProfile?.longitude ?? 0);
  const hasCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  const coordsUrl = hasCoords ? `https://www.google.com/maps?q=${lat},${lng}` : '';

  const rawMapsUrl = (partner.mapsUrl || partner.googleMapLink || partner.googleMapsUrl || partner.storeProfile?.mapsUrl || partner.storeProfile?.googleMapLink || coordsUrl || '').trim();
  const mapsUrl = rawMapsUrl 
    ? (rawMapsUrl.startsWith('http') ? rawMapsUrl : `https://www.google.com/maps?q=${encodeURIComponent(rawMapsUrl)}`)
    : '';

  const lineUrl = formatLineUrl(partner.lineUrl || partner.storeProfile?.lineUrl);
  const messengerUrl = formatMessengerUrl(partner.messengerUrl || partner.storeProfile?.messengerUrl);
  const websiteUrl = formatExternalUrl(partner.websiteUrl || partner.storeWebsite || partner.storeProfile?.websiteUrl || partner.storeProfile?.storeWebsite);
  const youtubeUrl = formatYoutubeUrl(partner.youtubeUrl || partner.storeProfile?.youtubeUrl);
  const tiktokUrl = formatTiktokUrl(partner.tiktokUrl || partner.storeProfile?.tiktokUrl);
  const shopeeUrl = formatExternalUrl(partner.shopeeUrl || partner.storeProfile?.shopeeUrl);
  const lazadaUrl = formatExternalUrl(partner.lazadaUrl || partner.storeProfile?.lazadaUrl);

  const hasSocialLinks = Boolean(lineUrl || messengerUrl || websiteUrl || youtubeUrl || tiktokUrl || shopeeUrl || lazadaUrl);

  return (
    <>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* 1. Service Details & Gallery */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 md:p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              รายละเอียดบริการ
            </h3>
            <div className="prose prose-slate max-w-none">
              {partner.richDescription || partner.description ? (
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{partner.richDescription || partner.description}</p>
              ) : (
                <p className="text-slate-500 italic">ร้านค้านี้ยังไม่ได้เพิ่มรายละเอียดเพิ่มเติม แต่พร้อมให้บริการตามหมวดหมู่ความเชี่ยวชาญครับ</p>
              )}
            </div>
            
            {partner.galleryImages && partner.galleryImages.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-slate-700">ผลงาน / แกลลอรี่ภาพ</h4>
                  <span className="text-xs text-slate-400 font-medium">คลิกเพื่อดูภาพเต็มจอ</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 items-center">
                  {partner.galleryImages.map((img, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setActiveImageIndex(idx)}
                      className="cursor-pointer flex items-center justify-center h-48 sm:h-56 md:h-64 w-full"
                    >
                      <div className="relative inline-block max-w-full max-h-full group">
                        <img 
                          loading="lazy" 
                          src={img} 
                          alt={`Gallery ${idx + 1}`} 
                          className="max-h-48 sm:max-h-56 md:max-h-64 max-w-full h-auto w-auto object-contain rounded-lg group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center pointer-events-none">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-xs shadow-md">
                            ดูภาพใหญ่
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
        </div>

      {/* 2. Contact, Location & Certifications (Middle on Mobile, Right Column on Desktop) */}
      <div className="space-y-6 md:col-start-3 md:row-start-1 md:row-span-2 self-start">
        {/* Social Links Section */}
        {hasSocialLinks && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              ช่องทางการติดต่อ
            </h3>
            <div className="flex flex-col gap-3">
              {lineUrl && (
                <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-green-50 transition-colors group">
                  <img src="/images/line_logo.png" alt="LINE" className="w-8 h-8 object-contain mr-3 shrink-0" />
                  <span className="text-sm text-slate-600 font-medium group-hover:text-green-700">LINE Official</span>
                </a>
              )}
              {messengerUrl && (
                <a href={messengerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-blue-50 transition-colors group">
                  <img src="/images/messenger_logo.png" alt="Messenger" className="w-8 h-8 object-contain mr-3 shrink-0" />
                  <span className="text-sm text-slate-600 font-medium group-hover:text-blue-700">Messenger</span>
                </a>
              )}
              {websiteUrl && (
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-slate-50 transition-colors group">
                  <img src="/images/website_logo.png" alt="Website" className="w-8 h-8 object-contain mr-3 shrink-0" />
                  <span className="text-sm text-slate-600 font-medium group-hover:text-slate-800">เว็บไซต์ร้าน</span>
                </a>
              )}
              {youtubeUrl && (
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors group">
                  <img src="/images/youtube_logo.png" alt="YouTube" className="w-8 h-8 object-contain mr-3 shrink-0" />
                  <span className="text-sm text-slate-600 font-medium group-hover:text-red-700">YouTube</span>
                </a>
              )}
              {tiktokUrl && (
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-slate-100 transition-colors group">
                  <img src="/images/tiktok_logo.png" alt="TikTok" className="w-8 h-8 object-contain mr-3 shrink-0" />
                  <span className="text-sm text-slate-600 font-medium group-hover:text-black">TikTok</span>
                </a>
              )}
              {shopeeUrl && (
                <a href={shopeeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-orange-50 transition-colors group">
                  <img src="/images/shopee_logo.png" alt="Shopee" className="w-8 h-8 object-contain mr-3 shrink-0" />
                  <span className="text-sm text-slate-600 font-medium group-hover:text-orange-700">Shopee</span>
                </a>
              )}
              {lazadaUrl && (
                <a href={lazadaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-indigo-50 transition-colors group">
                  <img src="/images/lazada_logo.png" alt="Lazada" className="w-8 h-8 object-contain mr-3 shrink-0" />
                  <span className="text-sm text-slate-600 font-medium group-hover:text-indigo-800">Lazada</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Location Section */}
        {(partner.address || partner.landmarks || hasCoords || mapsUrl) && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              ตำแหน่งที่ตั้งร้าน
            </h3>
            {partner.address && (
              <div className="mb-3">
                <p className="text-xs font-bold text-slate-500 uppercase">ที่อยู่ร้าน</p>
                <p className="text-sm text-slate-700">{partner.address}</p>
              </div>
            )}
            {partner.landmarks && (
              <div className="mb-3">
                <p className="text-xs font-bold text-slate-500 uppercase">จุดสังเกต</p>
                <p className="text-sm text-slate-700">{partner.landmarks}</p>
              </div>
            )}
            {mapsUrl && (
              <div className="pt-1">
                <a 
                  href={mapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
                >
                  <MapPin size={14} className="text-rose-500" />
                  <span>เปิดดูตำแหน่งบน Google Maps</span>
                  <ExternalLink size={12} className="text-sky-500" />
                </a>
              </div>
            )}
          </div>
        )}

        <div className="bg-linear-to-br from-slate-50 to-white rounded-2xl shadow-xs border border-slate-100 p-6 md:p-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            การรับรองระบบ
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-slate-600">ยืนยันตัวตนกับระบบแล้ว</span>
            </li>
            {partner.points > 0 && (
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-slate-600">ช่างเครดิตดีเยี่ยม</span>
              </li>
            )}
          </ul>
        </div>

      </div>

      {/* 3. Reviews & Ratings Section (Bottom on Mobile, Left Column Row 2 on Desktop) */}
      <div className="md:col-span-2 md:col-start-1 md:row-start-2 self-start">
        <PartnerReviews partnerId={partner.id} ownerId={partner.ownerId} currentUser={currentUser} />
      </div>
    </div>

    {/* Full Screen Lightbox Modal */}
    {activeImageIndex !== null && (
      <GalleryLightbox
        images={partner.galleryImages || []}
        initialIndex={activeImageIndex}
        onClose={() => setActiveImageIndex(null)}
      />
    )}
    </>
  );
};

export default StoreProfileInfo;
