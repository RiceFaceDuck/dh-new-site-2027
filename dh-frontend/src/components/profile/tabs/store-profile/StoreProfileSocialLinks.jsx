import { Phone, Share2 } from 'lucide-react';

const StoreProfileSocialLinks = ({ storeData, setStoreData }) => {
  return (
    <div>
      <h4 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3 mb-5 uppercase tracking-wide text-sm">
        <Share2 size={18} className="text-indigo-600"/> ข้อมูลการติดต่อ & โซเชียล
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phone */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 text-emerald-600">
            เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
              <Phone size={18} />
            </div>
            <input 
              type="tel" 
              value={storeData.phone || ''} 
              onChange={(e) => setStoreData({...storeData, phone: e.target.value})} 
              required 
              placeholder="081xxxxxxx" 
              className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/40 border border-emerald-300 rounded-md focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-mono text-slate-900 font-medium shadow-xs hover:border-emerald-400 transition-all text-xs" 
            />
          </div>
        </div>

        {/* FB Messenger */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 text-[#1877F2]">
            FB Messenger
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <img src="/images/messenger_logo.png" alt="Messenger" className="w-5 h-5 object-contain" />
            </div>
            <input 
              type="text" 
              value={storeData.messengerUrl || ''} 
              onChange={(e) => setStoreData({...storeData, messengerUrl: e.target.value})} 
              placeholder="m.me/yourpage" 
              className="w-full pl-10 pr-4 py-2.5 bg-blue-50/40 border border-blue-300 rounded-md focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-medium shadow-xs hover:border-blue-400 transition-all text-xs" 
            />
          </div>
        </div>

        {/* LINE Official */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 text-[#00B900]">
            LINE Official (@)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <img src="/images/line_logo.png" alt="LINE" className="w-5 h-5 object-contain" />
            </div>
            <input 
              type="text" 
              value={storeData.lineUrl || ''} 
              onChange={(e) => setStoreData({...storeData, lineUrl: e.target.value})} 
              placeholder="lin.ee/xxxxxx" 
              className="w-full pl-10 pr-4 py-2.5 bg-green-50/40 border border-green-300 rounded-md focus:border-green-500 focus:ring-4 focus:ring-green-500/10 text-slate-900 font-medium shadow-xs hover:border-green-400 transition-all text-xs" 
            />
          </div>
        </div>

        {/* Website */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 text-slate-600">
            เว็บไซต์ร้าน (Website)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <img src="/images/website_logo.png" alt="Website" className="w-5 h-5 object-contain" />
            </div>
            <input 
              type="text" 
              value={storeData.websiteUrl || ''} 
              onChange={(e) => setStoreData({...storeData, websiteUrl: e.target.value})} 
              placeholder="www.yourstore.com" 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-300 rounded-md focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 font-medium shadow-xs hover:border-slate-400 transition-all text-xs" 
            />
          </div>
        </div>

        {/* YouTube Channel */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 text-[#FF0000]">
            YouTube Channel
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <img src="/images/youtube_logo.png" alt="YouTube" className="w-5 h-5 object-contain" />
            </div>
            <input 
              type="text" 
              value={storeData.youtubeUrl || ''} 
              onChange={(e) => setStoreData({...storeData, youtubeUrl: e.target.value})} 
              placeholder="youtube.com/c/yourchannel" 
              className="w-full pl-10 pr-4 py-2.5 bg-red-50/40 border border-red-300 rounded-md focus:border-red-500 focus:ring-4 focus:ring-red-500/10 text-slate-900 font-medium shadow-xs hover:border-red-400 transition-all text-xs" 
            />
          </div>
        </div>

        {/* TikTok */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 text-black">
            TikTok
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <img src="/images/tiktok_logo.png" alt="TikTok" className="w-5 h-5 object-contain" />
            </div>
            <input 
              type="text" 
              value={storeData.tiktokUrl || ''} 
              onChange={(e) => setStoreData({...storeData, tiktokUrl: e.target.value})} 
              placeholder="tiktok.com/@yourusername" 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-300 rounded-md focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 font-medium shadow-xs hover:border-slate-400 transition-all text-xs" 
            />
          </div>
        </div>

        {/* Shopee Store */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 text-[#EE4D2D]">
            Shopee Store
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <img src="/images/shopee_logo.png" alt="Shopee" className="w-5 h-5 object-contain" />
            </div>
            <input 
              type="text" 
              value={storeData.shopeeUrl || ''} 
              onChange={(e) => setStoreData({...storeData, shopeeUrl: e.target.value})} 
              placeholder="shopee.co.th/yourstore" 
              className="w-full pl-10 pr-4 py-2.5 bg-orange-50/40 border border-orange-300 rounded-md focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-slate-900 font-medium shadow-xs hover:border-orange-400 transition-all text-xs" 
            />
          </div>
        </div>

        {/* Lazada Store */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 text-[#0F146D]">
            Lazada Store
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <img src="/images/lazada_logo.png" alt="Lazada" className="w-5 h-5 object-contain" />
            </div>
            <input 
              type="text" 
              value={storeData.lazadaUrl || ''} 
              onChange={(e) => setStoreData({...storeData, lazadaUrl: e.target.value})} 
              placeholder="lazada.co.th/shop/yourstore" 
              className="w-full pl-10 pr-4 py-2.5 bg-indigo-50/40 border border-indigo-300 rounded-md focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 font-medium shadow-xs hover:border-indigo-400 transition-all text-xs" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfileSocialLinks;
