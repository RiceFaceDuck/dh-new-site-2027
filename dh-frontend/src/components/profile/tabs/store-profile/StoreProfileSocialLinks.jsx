import React from 'react';
import { MessageCircle, Phone, Link as LinkIcon, Youtube, ShoppingCart } from 'lucide-react';

const StoreProfileSocialLinks = ({ storeData, setStoreData }) => {
  return (
    <div>
      <h4 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-5 uppercase tracking-wide text-sm"><MessageCircle size={18} className="text-blue-500"/> ข้อมูลการติดต่อ & โซเชียล</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-emerald-600">เบอร์โทรศัพท์ <span className="text-rose-500">*</span></label>
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-emerald-500"><Phone size={16}/></div><input type="tel" value={storeData.phone} onChange={(e) => setStoreData({...storeData, phone: e.target.value})} required placeholder="081xxxxxxx" className="w-full pl-10 pr-4 py-3 bg-emerald-50/30 border border-emerald-200 rounded-xl focus:border-emerald-500 font-mono" /></div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-[#1877F2]">FB Messenger</label>
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#1877F2]"><MessageCircle size={16}/></div><input type="text" value={storeData.messengerUrl} onChange={(e) => setStoreData({...storeData, messengerUrl: e.target.value})} placeholder="m.me/yourpage" className="w-full pl-10 pr-4 py-3 bg-blue-50/30 border border-blue-200 rounded-xl focus:border-blue-500" /></div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-[#00B900]">LINE Official (@)</label>
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#00B900]"><MessageCircle size={16}/></div><input type="text" value={storeData.lineUrl} onChange={(e) => setStoreData({...storeData, lineUrl: e.target.value})} placeholder="lin.ee/xxxxxx" className="w-full pl-10 pr-4 py-3 bg-green-50/30 border border-green-200 rounded-xl focus:border-green-500" /></div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-slate-600">เว็บไซต์ร้าน (Website)</label>
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><LinkIcon size={16}/></div><input type="text" value={storeData.websiteUrl} onChange={(e) => setStoreData({...storeData, websiteUrl: e.target.value})} placeholder="www.yourstore.com" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-500" /></div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-[#FF0000]">YouTube Channel</label>
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#FF0000]"><Youtube size={16}/></div><input type="text" value={storeData.youtubeUrl} onChange={(e) => setStoreData({...storeData, youtubeUrl: e.target.value})} placeholder="youtube.com/c/yourchannel" className="w-full pl-10 pr-4 py-3 bg-red-50/30 border border-red-200 rounded-xl focus:border-red-500" /></div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-black">TikTok</label>
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-black"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg></div><input type="text" value={storeData.tiktokUrl} onChange={(e) => setStoreData({...storeData, tiktokUrl: e.target.value})} placeholder="tiktok.com/@yourusername" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-500" /></div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-[#EE4D2D]">Shopee Store</label>
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#EE4D2D]"><ShoppingCart size={16}/></div><input type="text" value={storeData.shopeeUrl} onChange={(e) => setStoreData({...storeData, shopeeUrl: e.target.value})} placeholder="shopee.co.th/yourstore" className="w-full pl-10 pr-4 py-3 bg-orange-50/30 border border-orange-200 rounded-xl focus:border-orange-500" /></div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-[#0F146D]">Lazada Store</label>
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#0F146D]"><ShoppingCart size={16}/></div><input type="text" value={storeData.lazadaUrl} onChange={(e) => setStoreData({...storeData, lazadaUrl: e.target.value})} placeholder="lazada.co.th/shop/yourstore" className="w-full pl-10 pr-4 py-3 bg-indigo-50/30 border border-indigo-200 rounded-xl focus:border-indigo-500" /></div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfileSocialLinks;
