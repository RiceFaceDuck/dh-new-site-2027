import { Clock } from 'lucide-react';
import { trackFooterClick } from '../../firebase/footerAnalyticsService';
import locationPinImg from '../../assets/footer/contact-location-pin.png';
import lineOaImg from '../../assets/footer/contact-line-oa.png';
import phoneCallImg from '../../assets/footer/contact-phone-call.png';
import clockImg from '../../assets/footer/contact-business-clock.png';

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

      {/* กลุ่มข้อมูลเดียวกัน ไร้ขอบ (No Borders) และไร้รูปทรงกล่องแยก (No Separate Box Shapes) */}
      <div className="space-y-4 text-xs md:text-sm">
        {/* ที่อยู่ร้าน */}
        <div className="flex items-start gap-3.5 group">
          <img 
            src={locationPinImg} 
            alt="ที่อยู่ร้าน" 
            className="w-7 h-7 md:w-8 md:h-8 object-contain shrink-0 mt-0.5 filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-105"
          />
          <span className="leading-relaxed text-slate-300 group-hover:text-white transition-colors pt-0.5">
            {companyConfig?.address || "ศูนย์การค้าเซียร์รังสิต ชั้น 3 ห้อง xxx ถ.พหลโยธิน จ.ปทุมธานี 12130"}
          </span>
        </div>

        {/* LINE Official */}
        <div className="flex items-center gap-3.5 group">
          <img 
            src={lineOaImg} 
            alt="LINE Official" 
            className="w-7 h-7 md:w-8 md:h-8 object-contain shrink-0 filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-105"
          />
          {lineUrl ? (
            <a 
              href={lineUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => trackFooterClick('contact', 'line', lineUrl)}
              className="text-slate-300 hover:text-cyber-emerald transition-colors inline-flex items-center gap-1"
            >
              <span>Line ID: </span>
              <strong className="text-white font-tech tracking-wider group-hover:text-cyber-emerald transition-colors">
                {companyConfig?.lineId || "@dhnotebook"}
              </strong>
            </a>
          ) : (
            <div className="text-slate-300 group-hover:text-slate-100 transition-colors inline-flex items-center gap-1">
              <span>Line ID: </span>
              <strong className="text-white font-tech tracking-wider group-hover:text-cyber-emerald transition-colors">
                {companyConfig?.lineId || "@dhnotebook"}
              </strong>
            </div>
          )}
        </div>

        {/* เบอร์โทรศัพท์ */}
        <div className="flex items-center gap-3.5 group">
          <img 
            src={phoneCallImg} 
            alt="เบอร์โทรศัพท์" 
            className="w-7 h-7 md:w-8 md:h-8 object-contain shrink-0 filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-105"
          />
          {phoneTel ? (
            <a 
              href={phoneTel} 
              onClick={() => trackFooterClick('contact', 'phone', phoneTel)}
              className="text-slate-300 hover:text-cyber-blue transition-colors inline-flex items-center gap-1"
            >
              <span>Tel: </span>
              <strong className="text-white font-tech tracking-wider group-hover:text-cyber-blue transition-colors">
                {companyConfig?.phone || "02-xxx-xxxx"}
              </strong>
            </a>
          ) : (
            <div className="text-slate-300 group-hover:text-slate-100 transition-colors inline-flex items-center gap-1">
              <span>Tel: </span>
              <strong className="text-white font-tech tracking-wider group-hover:text-cyber-blue transition-colors">
                {companyConfig?.phone || "02-xxx-xxxx"}
              </strong>
            </div>
          )}
        </div>

        {/* เวลาทำการ */}
        {(businessHoursConfig?.openHours || businessHoursConfig?.days) && (
          <div className="flex items-start gap-3.5 group">
            <img 
              src={clockImg} 
              alt="Clock เวลาทำการ" 
              className="w-7 h-7 md:w-8 md:h-8 object-contain shrink-0 mt-0.5 filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-105"
            />
            <div className="text-xs md:text-sm text-slate-300 group-hover:text-slate-100 transition-colors leading-relaxed pt-0.5">
              <div>
                <span>เวลาทำการ: </span>
                <strong className="text-white font-tech tracking-wider group-hover:text-amber-400 transition-colors">
                  {businessHoursConfig.openHours || '10:00'} - {businessHoursConfig.closeHours || '19:30'} น.
                </strong>
              </div>
              {businessHoursConfig.days && (
                <div className="text-slate-400 text-[11px] mt-0.5 font-normal">
                  {businessHoursConfig.days}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FooterContact;
