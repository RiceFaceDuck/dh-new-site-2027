import { MapPin, MessageCircle, Phone, Clock } from 'lucide-react';
import { trackFooterClick } from '../../firebase/footerAnalyticsService';

const FooterContact = ({ companyConfig, businessHoursConfig }) => {
  const lineUrl = companyConfig?.lineAddFriendUrl || 
    (companyConfig?.lineId ? `https://line.me/R/ti/p/${encodeURIComponent(companyConfig.lineId)}` : null);
  const phoneTel = companyConfig?.phone ? `tel:${companyConfig.phone.replace(/[^0-9+]/g, '')}` : null;

  return (
    <div>
      <h3 className="text-white font-bold mb-5 md:mb-6 flex items-center text-sm md:text-base tracking-wide group">
        <span className="w-1.5 h-4 bg-cyber-emerald rounded-xs mr-2.5 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-transform group-hover:scale-y-125 duration-300"></span>
        <span className="group-hover:text-slate-200 transition-colors">ติดต่อ & เวลาทำการ</span>
      </h3>
      <ul className="space-y-3 text-xs md:text-sm">
        <li className="flex items-start bg-slate-800/60 p-3 rounded-md border border-slate-700/50 hover:border-slate-500 hover:bg-slate-800 transition-all duration-300 group shadow-xs hover:shadow-md">
          <MapPin size={18} className="mr-3 text-slate-400 group-hover:text-cyber-blue shrink-0 mt-0.5 transition-colors"/>
          <span className="leading-relaxed text-slate-400 group-hover:text-slate-200 transition-colors">
            {companyConfig?.address || "ศูนย์การค้าเซียร์รังสิต ชั้น 3 ห้อง xxx ถ.พหลโยธิน จ.ปทุมธานี 12130"}
          </span>
        </li>
        <li className="bg-slate-800/60 p-3 rounded-md border border-slate-700/50 hover:border-cyber-emerald hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:bg-emerald-900/10 transition-all duration-300 group">
          {lineUrl ? (
            <a 
              href={lineUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => trackFooterClick('contact', 'line', lineUrl)}
              className="flex items-center text-slate-400 group-hover:text-slate-200 transition-colors"
            >
              <MessageCircle size={18} className="mr-3 text-slate-400 group-hover:text-cyber-emerald shrink-0 transition-colors"/>
              <span>
                Line ID: <strong className="text-white font-tech tracking-wider group-hover:text-cyber-emerald transition-colors">{companyConfig?.lineId || "@dhnotebook"}</strong>
              </span>
            </a>
          ) : (
            <div className="flex items-center text-slate-400 group-hover:text-slate-200 transition-colors">
              <MessageCircle size={18} className="mr-3 text-slate-400 group-hover:text-cyber-emerald shrink-0 transition-colors"/>
              <span>
                Line ID: <strong className="text-white font-tech tracking-wider group-hover:text-cyber-emerald transition-colors">{companyConfig?.lineId || "@dhnotebook"}</strong>
              </span>
            </div>
          )}
        </li>
        <li className="bg-slate-800/60 p-3 rounded-md border border-slate-700/50 hover:border-cyber-blue hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] hover:bg-sky-900/10 transition-all duration-300 group">
          {phoneTel ? (
            <a 
              href={phoneTel} 
              onClick={() => trackFooterClick('contact', 'phone', phoneTel)}
              className="flex items-center text-slate-400 group-hover:text-slate-200 transition-colors"
            >
              <Phone size={18} className="mr-3 text-slate-400 group-hover:text-cyber-blue shrink-0 transition-colors"/>
              <span>
                Tel: <strong className="text-white font-tech tracking-wider group-hover:text-cyber-blue transition-colors">{companyConfig?.phone || "02-xxx-xxxx"}</strong>
              </span>
            </a>
          ) : (
            <div className="flex items-center text-slate-400 group-hover:text-slate-200 transition-colors">
              <Phone size={18} className="mr-3 text-slate-400 group-hover:text-cyber-blue shrink-0 transition-colors"/>
              <span>
                Tel: <strong className="text-white font-tech tracking-wider group-hover:text-cyber-blue transition-colors">{companyConfig?.phone || "02-xxx-xxxx"}</strong>
              </span>
            </div>
          )}
        </li>
        {(businessHoursConfig?.openHours || businessHoursConfig?.days) && (
          <li className="flex items-start bg-slate-800/60 p-3 rounded-md border border-slate-700/50 hover:border-amber-500/50 hover:bg-slate-800 transition-all duration-300 group shadow-xs">
            <Clock size={18} className="mr-3 text-slate-400 group-hover:text-amber-400 shrink-0 mt-0.5 transition-colors"/>
            <div className="text-xs md:text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
              <div>
                เวลาทำการ: <strong className="text-white font-tech tracking-wider group-hover:text-amber-400 transition-colors">
                  {businessHoursConfig.openHours || '10:00'} - {businessHoursConfig.closeHours || '19:30'} น.
                </strong>
              </div>
              {businessHoursConfig.days && (
                <div className="text-slate-500 text-[11px] mt-0.5">{businessHoursConfig.days}</div>
              )}
            </div>
          </li>
        )}
      </ul>
    </div>
  );
};

export default FooterContact;
