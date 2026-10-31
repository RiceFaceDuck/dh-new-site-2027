import { useState, useEffect } from 'react';
import { Store, Megaphone, Loader2, Sparkles, Eye, MousePointerClick, Zap, Ban, Trash2, Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adManagementService } from '../../../../firebase/adManagementService';

// ⏱️ 5-Minute Cache TTL (300,000ms) to prevent stale data and unbounded memory growth
const MARKETING_CACHE_TTL_MS = 300000;
const marketingCache = {};

const getMarketingCache = (uid) => {
  const entry = marketingCache[uid];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > MARKETING_CACHE_TTL_MS) {
    delete marketingCache[uid];
    return null;
  }
  return entry;
};

const setMarketingCache = (uid, data) => {
  const now = Date.now();
  // Prune expired entries to prevent unbounded memory leak
  Object.keys(marketingCache).forEach((key) => {
    if (now - marketingCache[key].timestamp > MARKETING_CACHE_TTL_MS) {
      delete marketingCache[key];
    }
  });
  marketingCache[uid] = {
    ...data,
    timestamp: now
  };
};

export default function MarketingInfo({ customer }) {
  const [storeProfile, setStoreProfile] = useState(null);
  const [activePartner, setActivePartner] = useState(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const uid = customer?.uid || customer?.id;
      if (!uid) return;
      
      // ✅ 5-Minute TTL Cache: ลด Quota อ่าน/เขียน ขณะตรวจข้อมูล แต่รีเฟรชอัตโนมัติเมื่อครบ 5 นาที
      const cached = getMarketingCache(uid);
      if (cached) {
        setStoreProfile(cached.storeProfile);
        setActivePartner(cached.activePartner || cached.storeProfile?.activePartner || null);
        setAds(cached.ads);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [profileRes, adsRes, partnerRes] = await Promise.all([
          adManagementService.getStoreProfile(uid),
          adManagementService.getAdsByUserId(uid),
          adManagementService.getActivePartner ? adManagementService.getActivePartner(uid) : Promise.resolve(null)
        ]);

        const resolvedPartner = partnerRes || profileRes?.activePartner || null;
        setStoreProfile(profileRes);
        setActivePartner(resolvedPartner);
        setAds(adsRes || []);
        
        // Save to cache with timestamped TTL
        setMarketingCache(uid, {
          storeProfile: profileRes,
          activePartner: resolvedPartner,
          ads: adsRes || []
        });
      } catch (err) {
        console.error("Failed to load marketing data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [customer]);

  const handlePauseAd = async (adId) => {
    if (!window.confirm('คุณต้องการระงับ (Block) โฆษณานี้ชั่วคราวหรือไม่?')) return;
    const res = await adManagementService.pauseAd(adId);
    if (res.success) {
      toast.success('ระงับโฆษณาชั่วคราวเรียบร้อยแล้ว');
      const newAds = ads.map(ad => ad.id === adId ? { ...ad, status: 'paused', isActive: false } : ad);
      setAds(newAds);
      const uid = customer?.uid || customer?.id;
      if (marketingCache[uid]) marketingCache[uid].ads = newAds;
    } else {
      toast.error(res.message || 'เกิดข้อผิดพลาดในการระงับโฆษณา');
    }
  };

  const handleDeleteAd = async (adId) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบโฆษณานี้ถาวร? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;
    const res = await adManagementService.deleteAd(adId);
    if (res.success) {
      toast.success('ลบโฆษณาถาวรเรียบร้อยแล้ว');
      const newAds = ads.filter(ad => ad.id !== adId);
      setAds(newAds);
      const uid = customer?.uid || customer?.id;
      if (marketingCache[uid]) marketingCache[uid].ads = newAds;
    } else {
      toast.error(res.message || 'เกิดข้อผิดพลาดในการลบโฆษณา');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-indigo-500">
        <Loader2 className="animate-spin mb-2" size={28} />
        <span className="text-xs font-semibold animate-pulse">กำลังโหลดข้อมูลร้านค้าและโฆษณา...</span>
      </div>
    );
  }

  const effectiveStore = storeProfile || activePartner;

  // If no store profile and no ads, show empty state
  if (!effectiveStore && ads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-4 text-center bg-white border border-slate-200 rounded-[2px] shadow-2xs">
        <div className="w-12 h-12 bg-slate-100 rounded-[2px] flex items-center justify-center mb-3">
          <Megaphone className="text-slate-400" size={24} />
        </div>
        <h4 className="text-sm font-bold text-slate-700 mb-1">ลูกค้ารายนี้ยังไม่มีข้อมูลร้านค้าและโฆษณา</h4>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          ลูกค้ายังไม่ได้สร้างโปรไฟล์ร้านค้า หรือยังไม่เคยลงโฆษณากับเราผ่านระบบศูนย์จัดการโฆษณา
        </p>
      </div>
    );
  }

  const renderStatus = (status) => {
    switch(status) {
      case 'active': return <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 border border-emerald-300/60 rounded-[2px] text-[9px] font-bold">ACTIVE</span>;
      case 'pending': return <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-700 border border-amber-300/60 rounded-[2px] text-[9px] font-bold">PENDING</span>;
      case 'rejected': return <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-700 border border-rose-300/60 rounded-[2px] text-[9px] font-bold">REJECTED</span>;
      case 'paused': return <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 border border-slate-300 rounded-[2px] text-[9px] font-bold">PAUSED</span>;
      case 'OUT_OF_CREDIT': return <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-700 border border-purple-300/60 rounded-[2px] text-[9px] font-bold">OUT OF CREDIT</span>;
      case 'COMPLETED': return <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-700 border border-blue-300/60 rounded-[2px] text-[9px] font-bold">COMPLETED</span>;
      default: return <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-[2px] text-[9px] font-bold">{status?.toUpperCase() || 'UNKNOWN'}</span>;
    }
  };

  // 💖 สถิติยอดเข้าชมหน้าร้าน และยอดถูกใจ (Store Profile Visits vs Store Likes)
  const storeViewCount = Number(storeProfile?.viewCount || activePartner?.viewCount || 0);
  const storeLikeCount = Number(storeProfile?.likeCount || activePartner?.likeCount || 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-6">
      
      {/* 1. Store Profile Card */}
      {effectiveStore && (
        <div className="bg-white border border-slate-200 rounded-[2px] p-4 shadow-2xs">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-[2px] bg-indigo-500"></span> ข้อมูลร้านค้าพาร์ทเนอร์
            </h3>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-[2px] flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500" /> หน้าร้าน
            </span>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-16 h-16 rounded-[2px] bg-slate-50 border border-slate-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
              {effectiveStore.storeImage ? (
                <img src={effectiveStore.storeImage} alt="Store" className="w-full h-full object-cover rounded-[2px]" loading="lazy" />
              ) : (
                <Store size={26} className="text-slate-400" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 truncate" title={effectiveStore.storeName || 'ไม่มีชื่อร้าน'}>
                {effectiveStore.storeName || 'ไม่มีชื่อร้าน'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mt-1">
                {effectiveStore.description || 'ไม่มีคำอธิบายร้านค้า'}
              </p>
            </div>
          </div>

          {/* 🌟 Store Profile Metrics: Distinct Store Visits vs Likes */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
            <div className="bg-indigo-50/50 rounded-[2px] p-2.5 border border-indigo-100 min-w-0">
              <span className="text-indigo-700 block text-[10px] uppercase font-bold tracking-tight flex items-center gap-1 mb-0.5">
                <Eye size={12} className="text-indigo-600 shrink-0" /> ยอดเข้าชมหน้าร้าน (Store Profile Visits)
              </span>
              <span className="font-mono font-black text-sm text-indigo-950 block">
                {storeViewCount.toLocaleString()} <span className="text-[10px] font-medium text-slate-500">ครั้ง</span>
              </span>
            </div>

            <div className="bg-rose-50/50 rounded-[2px] p-2.5 border border-rose-100 min-w-0">
              <span className="text-rose-700 block text-[10px] uppercase font-bold tracking-tight flex items-center gap-1 mb-0.5">
                <Heart size={12} className="text-rose-500 fill-rose-500 shrink-0" /> ยอดถูกใจร้านค้า (Store Likes)
              </span>
              <span className="font-mono font-black text-sm text-rose-950 block">
                {storeLikeCount.toLocaleString()} <span className="text-[10px] font-medium text-slate-500">ครั้ง</span>
              </span>
            </div>
          </div>

          {/* Services & Open Hours */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
            <div className="bg-slate-50 rounded-[2px] p-2 border border-slate-100 min-w-0">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Services</span>
              <span className="font-medium text-xs text-slate-700 truncate block mt-0.5" title={effectiveStore.services || '-'}>
                {effectiveStore.services || '-'}
              </span>
            </div>
            <div className="bg-slate-50 rounded-[2px] p-2 border border-slate-100 min-w-0">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Open Hours</span>
              <span className="font-medium text-xs text-slate-700 truncate block mt-0.5" title={effectiveStore.openHours || '-'}>
                {effectiveStore.openHours || '-'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Ads Campaigns List */}
      <div className="bg-white border border-slate-200 rounded-[2px] shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Megaphone size={14} className="text-indigo-600" /> แคมเปญโฆษณา
          </h3>
          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded-[2px] uppercase tracking-wider">
            {ads.length} แคมเปญ
          </span>
        </div>
        
        {ads.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {ads.map((ad, idx) => (
              <div key={ad.id || idx} className="p-4 hover:bg-slate-50/50 transition-colors space-y-3">
                
                {/* 1. Header Row: Image + Details + Action Buttons */}
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-[2px] border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                    {ad.imageUrl ? (
                      <img src={ad.imageUrl} alt="Ad" className="w-full h-full object-cover rounded-[2px]" loading="lazy" />
                    ) : (
                      <span className="text-[9px] text-slate-400 font-bold uppercase">No IMG</span>
                    )}
                  </div>
                  
                  {/* Title & Badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-[2px] text-[9px] font-mono font-bold border border-indigo-100">
                        {ad.type || 'AD'}
                      </span>
                      {renderStatus(ad.status)}
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs truncate" title={ad.title || ad.partnerName || 'Unnamed Ad'}>
                      {ad.title || ad.partnerName || 'Unnamed Ad'}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5" title={ad.description || ad.services || 'ไม่มีคำอธิบาย'}>
                      {ad.description || ad.services || 'ไม่มีคำอธิบาย'}
                    </p>
                  </div>

                  {/* Actions (Block / Delete) */}
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <button 
                      onClick={() => handlePauseAd(ad.id)}
                      disabled={ad.status === 'paused'}
                      title="ระงับโฆษณา (Block)"
                      className="p-1.5 bg-white border border-slate-200 text-amber-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 rounded-[2px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                    >
                      <Ban size={13} />
                    </button>
                    <button 
                      onClick={() => handleDeleteAd(ad.id)}
                      title="ลบโฆษณาถาวร"
                      className="p-1.5 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-[2px] transition-colors shadow-2xs"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* 2. Stats bar: Distinct Ad Impressions vs Clicks vs Limit */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-[2px] text-center" title="ยอดการมองเห็นป้ายโฆษณา (Ad Impressions)">
                    <div className="flex items-center justify-center gap-1 text-[9px] text-slate-500 font-bold tracking-tight mb-0.5 truncate">
                      <Eye size={10} className="text-indigo-500 shrink-0" /> ยอดการมองเห็นป้ายโฆษณา (Ad Impressions)
                    </div>
                    <div className="font-bold font-mono text-slate-800 text-xs">
                      {Number(ad.stats?.views || ad.impressions || 0).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-[2px] text-center" title="ยอดคลิกโฆษณา (Ad Clicks)">
                    <div className="flex items-center justify-center gap-1 text-[9px] text-slate-500 font-bold tracking-tight mb-0.5 truncate">
                      <MousePointerClick size={10} className="text-indigo-500 shrink-0" /> คลิกโฆษณา (Ad Clicks)
                    </div>
                    <div className="font-bold font-mono text-slate-800 text-xs">
                      {Number(ad.stats?.clicks || ad.clicks || 0).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-[2px] text-center">
                    <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                      <Zap size={10} /> Limit
                    </div>
                    <div className="font-bold text-[10px] text-emerald-600 truncate">
                      {ad.creditLimit === -1 || ad.isUnlimited ? '∞ ไม่จำกัด' : (ad.creditLimit ? `${ad.creditLimit} Pts` : 'N/A')}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <Megaphone size={20} className="mb-1.5 opacity-40" />
            <p className="text-xs font-medium">ไม่มีรายการแคมเปญ</p>
          </div>
        )}
      </div>

    </div>
  );
}
