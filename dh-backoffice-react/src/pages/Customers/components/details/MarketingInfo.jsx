import React, { useState, useEffect } from 'react';
import { Store, Megaphone, Loader2, Sparkles, Eye, MousePointerClick, Zap } from 'lucide-react';
import { adManagementService } from '../../../../firebase/adManagementService';

export default function MarketingInfo({ customer }) {
  const [storeProfile, setStoreProfile] = useState(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const uid = customer?.uid || customer?.id;
        if (!uid) return;
        const [profileRes, adsRes] = await Promise.all([
          adManagementService.getStoreProfile(uid),
          adManagementService.getAdsByUserId(uid)
        ]);
        setStoreProfile(profileRes);
        setAds(adsRes || []);
      } catch (err) {
        console.error("Failed to load marketing data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [customer]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-indigo-400">
        <Loader2 className="animate-spin mb-3" size={32} />
        <span className="text-sm font-semibold animate-pulse">กำลังโหลดข้อมูลร้านค้า...</span>
      </div>
    );
  }

  // If no store profile and no ads, show empty state
  if (!storeProfile && ads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Megaphone className="text-slate-400" size={32} />
        </div>
        <h4 className="text-lg font-bold text-slate-700 mb-2">ลูกค้ารายนี้ยังไม่มีข้อมูลร้านค้าและโฆษณา</h4>
        <p className="text-sm text-slate-500 max-w-sm">
          ลูกค้ายังไม่ได้สร้างโปรไฟล์ร้านค้า หรือยังไม่เคยลงโฆษณากับเราผ่านระบบศูนย์จัดการโฆษณา
        </p>
      </div>
    );
  }

  const renderStatus = (status) => {
    switch(status) {
      case 'active': return <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-bold">ACTIVE</span>;
      case 'pending': return <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-200 rounded-full text-[10px] font-bold">PENDING</span>;
      case 'rejected': return <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 border border-rose-200 rounded-full text-[10px] font-bold">REJECTED</span>;
      default: return <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">{status?.toUpperCase() || 'UNKNOWN'}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-8">
      
      {/* 1. Store Profile Card */}
      {storeProfile && (
        <div className="bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 shadow-xl relative overflow-hidden border border-slate-700/50">
          <div className="absolute -top-10 -right-10 p-4 opacity-5 rotate-12">
            <Store size={200} />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row gap-5 items-start">
            <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
              {storeProfile.storeImage ? (
                <img src={storeProfile.storeImage} alt="Store" className="w-full h-full object-cover rounded-xl"  loading="lazy" />
              ) : (
                <Store size={32} className="text-indigo-300/50" />
              )}
            </div>
            
            <div className="flex-1 text-white w-full">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-slate-300">
                  {storeProfile.storeName || 'ไม่มีชื่อร้าน'}
                </h3>
                <Sparkles size={16} className="text-amber-400 drop-shadow-md" />
              </div>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed line-clamp-2">
                {storeProfile.description || 'ไม่มีคำอธิบายร้านค้า'}
              </p>
              
              <div className="grid grid-cols-2 gap-3 text-xs w-full max-w-md">
                <div className="bg-white/5 rounded-lg p-2.5 border border-white/10 backdrop-blur-xs">
                  <span className="text-indigo-200 block mb-1 text-[10px] uppercase font-bold tracking-wider">Services</span>
                  <span className="font-medium truncate block text-slate-100">{storeProfile.services || '-'}</span>
                </div>
                <div className="bg-white/5 rounded-lg p-2.5 border border-white/10 backdrop-blur-xs">
                  <span className="text-indigo-200 block mb-1 text-[10px] uppercase font-bold tracking-wider">Open Hours</span>
                  <span className="font-medium truncate block text-slate-100">{storeProfile.openHours || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Ads Campaigns List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Megaphone size={18} className="text-indigo-600" /> แคมเปญโฆษณา
          </h3>
          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {ads.length} Campaigns
          </span>
        </div>
        
        {ads.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {ads.map((ad, idx) => (
              <div key={ad.id || idx} className="p-5 flex flex-col xl:flex-row gap-4 items-start xl:items-center hover:bg-slate-50/80 transition-colors group">
                
                {/* Image */}
                <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center shadow-xs group-hover:shadow-md transition-all">
                  {ad.imageUrl ? (
                    <img src={ad.imageUrl} alt="Ad" className="w-full h-full object-cover"  loading="lazy" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold uppercase">No IMG</span>
                  )}
                </div>
                
                {/* Details */}
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h4 className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{ad.title || ad.partnerName || 'Unnamed Ad'}</h4>
                    {renderStatus(ad.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-sm font-mono font-medium border border-indigo-100/50">{ad.type || 'UNKNOWN'}</span>
                    <span className="truncate">{ad.description || ad.services || 'No description'}</span>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex gap-4 md:gap-6 items-center mt-3 xl:mt-0 bg-white border border-slate-100 xl:border-transparent xl:bg-transparent p-3 xl:p-0 rounded-xl w-full xl:w-auto justify-around xl:justify-end shadow-xs xl:shadow-none">
                  <div className="text-center xl:text-right min-w-[60px]">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1 justify-center xl:justify-end font-medium uppercase tracking-wider">
                      <Eye size={12} /> Views
                    </div>
                    <div className="font-bold text-slate-700 text-sm">{ad.impressions?.toLocaleString() || 0}</div>
                  </div>
                  
                  <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
                  
                  <div className="text-center xl:text-right min-w-[60px]">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1 justify-center xl:justify-end font-medium uppercase tracking-wider">
                      <MousePointerClick size={12} /> Clicks
                    </div>
                    <div className="font-bold text-slate-700 text-sm">{ad.clicks?.toLocaleString() || 0}</div>
                  </div>
                  
                  <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
                  
                  <div className="text-center xl:text-right min-w-[60px]">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1 justify-center xl:justify-end font-medium uppercase tracking-wider">
                      <Zap size={12} /> Limit
                    </div>
                    <div className="font-bold text-emerald-600 text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                      {ad.isUnlimited ? '∞ ไม่จำกัด' : (ad.creditLimit || 'N/A')}
                    </div>
                  </div>
                </div>
                
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <Megaphone size={24} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">ไม่มีรายการแคมเปญ</p>
          </div>
        )}
      </div>

    </div>
  );
}
