import { useState, useEffect } from 'react';
import { footerClientService } from '../firebase/footerClientService';
import FooterBrand from './footer/FooterBrand';
import FooterLinkZone from './footer/FooterLinkZone';
import FooterContact from './footer/FooterContact';

const Footer = () => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    let isMounted = true;
    footerClientService.getFooterConfig().then((data) => {
      if (isMounted && data) {
        setConfig(data);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!config) return null;

  const bgMap = {
    'slate-900': '#0F1D33',
    'zinc-900': '#18181b',
    'blue-950': '#082f49',
    'slate-950': '#020617'
  };
  const resolvedBg =
    bgMap[config.colors?.bgDark] ||
    (config.colors?.bgDark?.startsWith('#') ? config.colors.bgDark : '#0F1D33');

  return (
    <footer
      className="relative border-t border-[#1E3250] pt-10 pb-20 md:pb-8 mt-10 md:mt-16 overflow-hidden text-slate-300 transition-colors duration-300"
      style={{ backgroundColor: resolvedBg }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.35fr_0.85fr_0.9fr_1.25fr] gap-7 lg:gap-8 mb-8">
          <FooterBrand
            companyConfig={config.company}
            trustBadgesConfig={config.trustBadges}
            socialHubConfig={config.socialHub}
          />

          <FooterLinkZone
            title="สินค้าและบริการ"
            links={config.quickLinks}
            markerColor="bg-sky-400"
          />

          <FooterLinkZone
            title="ช่วยเหลือ & นโยบาย"
            links={config.supportLinks}
            markerColor="bg-amber-400"
          />

          <FooterContact
            companyConfig={config.company}
            businessHoursConfig={config.businessHours}
          />
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-4 flex flex-col md:flex-row justify-between items-center text-[11.5px] text-slate-500 gap-2.5">
          <p>
            © {new Date().getFullYear()} DH Notebook &amp; DH-Servicehub. สงวนลิขสิทธิ์ทั้งหมด
          </p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-5 text-slate-400">
            <span className="hover:text-slate-200 cursor-pointer transition-colors">
              นโยบายความเป็นส่วนตัว (Privacy Policy)
            </span>
            <span className="hover:text-slate-200 cursor-pointer transition-colors">
              เงื่อนไขการใช้งาน (Terms of Service)
            </span>
            <span className="hover:text-slate-200 cursor-pointer transition-colors">
              นโยบายคุกกี้ (Cookie Policy)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
