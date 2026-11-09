import React from 'react';
import { resolveSocialLinks } from '../utils/storeUrlUtils';

const StoreContactChannels = ({ partner = {} }) => {
  const {
    lineUrl,
    messengerUrl,
    websiteUrl,
    youtubeUrl,
    tiktokUrl,
    shopeeUrl,
    lazadaUrl,
    hasSocialLinks
  } = resolveSocialLinks(partner);

  if (!hasSocialLinks) return null;

  return (
    <div className="bg-white rounded-[2px] shadow-xs border border-slate-100 p-6 md:p-8">
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
  );
};

export default React.memo(StoreContactChannels);
