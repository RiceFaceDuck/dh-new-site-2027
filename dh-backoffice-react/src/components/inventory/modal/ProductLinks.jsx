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
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5 mb-1.5">
          <LinkIcon size={13} className={colorClass} /> {label}
        </label>
        <div className="relative">
          <input 
            type="url" 
            value={form.externalLinks?.[platform] || ''} 
            onChange={e => handleLinkChange(platform, e.target.value)}
            placeholder={placeholder}
            className={`w-full h-10 px-3 pr-8 border rounded-[2px] outline-hidden text-sm transition-all font-medium placeholder:text-slate-400 ${
              isValid === true ? 'border-emerald-500 focus:border-emerald-600 bg-emerald-50/30 text-emerald-800 dark:text-emerald-400' : 
              isValid === false ? 'border-red-500 focus:border-red-600 bg-red-50/30 text-red-800 dark:text-red-400' : 
              'border-slate-300 dark:border-slate-600 focus:border-slate-800 dark:focus:border-orange-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'
            }`} 
          />
          {isValid === true && <CheckCircle2 size={16} className="absolute right-2.5 top-3 text-emerald-600" />}
          {isValid === false && <XCircle size={16} className="absolute right-2.5 top-3 text-red-600" />}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-[2px] border border-slate-300 dark:border-slate-700 shadow-sm">
      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
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
