import { ShieldCheck, Award, CheckCircle2, Truck } from 'lucide-react';
import { trackFooterClick } from '../../firebase/footerAnalyticsService';

const BADGE_ICONS = {
  b2bPartner: ShieldCheck,
  dbdRegistered: Award,
  genuineWarranty: CheckCircle2,
  expressDelivery: Truck
};

const FacebookIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const TikTokIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const LineIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

const YouTubeIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const InstagramIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const FooterBrand = ({ companyConfig, trustBadgesConfig, socialHubConfig }) => {
  const isTrustBadgesEnabled = trustBadgesConfig?.enabled !== false;
  const activeBadges = (trustBadgesConfig?.badges || []).filter(b => b.active !== false);
  const isSocialEnabled = socialHubConfig?.enabled !== false && !!(
    socialHubConfig?.facebook || 
    socialHubConfig?.tiktok || 
    socialHubConfig?.line || 
    socialHubConfig?.youtube || 
    socialHubConfig?.instagram
  );

  return (
    <div className="col-span-1 space-y-5">
      <div className="flex flex-col items-start leading-none">
        {/* Logo in Corporate Badge Style */}
        <div className="bg-white p-2.5 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] inline-block transform hover:scale-105 transition-transform duration-300">
          <img 
            src={companyConfig?.logoUrl || "/logo.png"} 
            alt="Brand Logo" 
            className="h-7 md:h-9 object-contain" 
            loading="lazy" 
          />
        </div>
      </div>

      <p className="text-sm text-slate-400 pr-2 leading-relaxed font-normal">
        {companyConfig?.description || "ผู้นำเข้าและจัดจำหน่ายอะไหล่โน๊ตบุ๊คครบวงจร พร้อมเครือข่ายช่างพันธมิตรทั่วประเทศ"}
      </p>

      {/* Dynamic Trust Badges Grid */}
      {isTrustBadgesEnabled && activeBadges.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeBadges.map((badge) => {
              const IconComponent = BADGE_ICONS[badge.id] || ShieldCheck;
              return (
                <div 
                  key={badge.id}
                  className="flex items-center gap-2 text-cyber-emerald text-xs font-tech font-bold tracking-wider uppercase bg-emerald-950/40 px-3 py-2 rounded-lg border border-emerald-500/20 shadow-xs hover:border-emerald-500/40 transition-all"
                  title={badge.description || badge.label}
                >
                  <IconComponent size={16} className="text-emerald-400 shrink-0" />
                  <span className="text-[11px] leading-tight text-emerald-300 truncate">{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Social Media Hub */}
      {isSocialEnabled && (
        <div className="pt-2">
          <span className="text-[11px] font-bold text-slate-400 block mb-2 uppercase tracking-wider font-tech">
            ช่องทางติดตามเรา
          </span>
          <div className="flex items-center gap-2">
            {socialHubConfig.facebook && (
              <a 
                href={socialHubConfig.facebook} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={() => trackFooterClick('social_hub', 'facebook', socialHubConfig.facebook)}
                className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center hover:bg-blue-600/30 transition-colors" 
                title="Facebook"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
            )}
            {socialHubConfig.tiktok && (
              <a 
                href={socialHubConfig.tiktok} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={() => trackFooterClick('social_hub', 'tiktok', socialHubConfig.tiktok)}
                className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center hover:bg-rose-600/30 transition-colors" 
                title="TikTok"
              >
                <TikTokIcon className="w-4 h-4" />
              </a>
            )}
            {socialHubConfig.line && (
              <a 
                href={socialHubConfig.line} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={() => trackFooterClick('social_hub', 'line', socialHubConfig.line)}
                className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-600/30 transition-colors" 
                title="LINE OA"
              >
                <LineIcon className="w-4 h-4" />
              </a>
            )}
            {socialHubConfig.youtube && (
              <a 
                href={socialHubConfig.youtube} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={() => trackFooterClick('social_hub', 'youtube', socialHubConfig.youtube)}
                className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center hover:bg-red-600/30 transition-colors" 
                title="YouTube"
              >
                <YouTubeIcon className="w-4 h-4" />
              </a>
            )}
            {socialHubConfig.instagram && (
              <a 
                href={socialHubConfig.instagram} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={() => trackFooterClick('social_hub', 'instagram', socialHubConfig.instagram)}
                className="w-8 h-8 rounded-lg bg-pink-600/20 text-pink-400 border border-pink-500/30 flex items-center justify-center hover:bg-pink-600/30 transition-colors" 
                title="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FooterBrand;
