import React, { useState, useEffect } from 'react';
import { footerClientService } from '../firebase/footerClientService';
import FooterBrand from './footer/FooterBrand';
import FooterLinkZone from './footer/FooterLinkZone';
import FooterContact from './footer/FooterContact';

const Footer = () => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const data = await footerClientService.getFooterConfig();
      setConfig(data);
    };
    fetchConfig();
  }, []);

  if (!config) return null; // Or a subtle skeleton if preferred, but footer is at bottom so usually okay to pop in.

  // Dynamic classes for colors
  const bgClass = `bg-${config.colors.bgDark}`;
  const textMutedClass = `text-${config.colors.textMuted}`;
  const borderClass = `border-slate-800`; // Could also be dynamic

  return (
    <footer className={`relative border-t pt-16 pb-24 md:pb-12 mt-12 md:mt-24 overflow-hidden transition-colors duration-500 ${bgClass} ${borderClass}`}>
      
      {/* Tech Background Layer */}
      <div className="absolute inset-0 bg-tech-grid-dark opacity-20 pointer-events-none z-0"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-12">
          
          <FooterBrand companyConfig={config.company} />

          <FooterLinkZone 
            title="หมวดหมู่สินค้า" 
            links={config.quickLinks} 
            markerColor="bg-cyber-blue shadow-[0_0_8px_rgba(14,165,233,0.5)]" 
          />

          <FooterLinkZone 
            title="ศูนย์ช่วยเหลือ" 
            links={config.supportLinks} 
            markerColor="bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
          />

          <FooterContact companyConfig={config.company} />

        </div>
        
        {/* Bottom Bar */}
        <div className={`border-t pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] md:text-xs space-y-4 md:space-y-0 ${borderClass} ${textMutedClass}`}>
          <p className="font-tech tracking-widest uppercase">
            © {new Date().getFullYear()} DH NOTEBOOK SYSTEM. ALL RIGHTS RESERVED.
          </p>
          <div className="flex space-x-6 font-medium">
            <span className={`hover:text-${config.colors.primaryAccent} cursor-pointer transition-colors`}>Privacy Policy</span>
            <span className={`hover:text-${config.colors.primaryAccent} cursor-pointer transition-colors`}>Terms of Service</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;