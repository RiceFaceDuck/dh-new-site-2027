import React from 'react';
import { Link as LinkIcon, CheckCircle2, XCircle } from 'lucide-react';

export default function ProductLinks({
  form,
  handleLinkChange,
  linkValidation
}) {
  const renderLinkInput = (platform, label, placeholder, colorClass) => {
    const isValid = linkValidation[platform];
    return (
      <div className="md:col-span-1">
        <label className="text-[10px] font-bold text-dh-muted uppercase flex items-center gap-1.5 mb-1.5">
          <LinkIcon size={12} className={colorClass} /> {label}
        </label>
        <div className="relative">
          <input 
            type="url" 
            value={form.externalLinks?.[platform] || ''} 
            onChange={e => handleLinkChange(platform, e.target.value)}
            placeholder={placeholder}
            className={`w-full p-2.5 pr-8 border rounded-xl outline-none text-sm transition-all font-medium placeholder:text-dh-muted/50 ${
              isValid === true ? 'border-green-500/50 focus:border-green-500 bg-green-500/5 text-green-700 dark:text-green-400' : 
              isValid === false ? 'border-red-500/50 focus:border-red-500 bg-red-500/5 text-red-600 dark:text-red-400' : 
              'border-dh-border focus:border-dh-accent bg-dh-base focus:bg-dh-surface text-dh-main'
            }`} 
          />
          {isValid === true && <CheckCircle2 size={16} className="absolute right-2.5 top-3 text-green-500" />}
          {isValid === false && <XCircle size={16} className="absolute right-2.5 top-3 text-red-500" />}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-dh-surface p-5 rounded-2xl border border-dh-border shadow-sm">
      <h3 className="text-sm font-black text-dh-main mb-4 flex items-center gap-2">
        🌐 ลิงก์สินค้าภายนอก (Marketplace)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderLinkInput('shopee', 'Shopee', 'https://shopee.co.th/...', 'text-[#ee4d2d]')}
        {renderLinkInput('lazada', 'Lazada', 'https://lazada.co.th/...', 'text-[#0f136d] dark:text-[#2b31a8]')}
        {renderLinkInput('tiktok', 'TikTok', 'https://shop.tiktok.com/...', 'text-black dark:text-white')}
        {renderLinkInput('facebook', 'Facebook', 'https://facebook.com/...', 'text-[#0866ff]')}
      </div>
    </div>
  );
}
