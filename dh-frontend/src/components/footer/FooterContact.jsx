import { Clock } from 'lucide-react';
import { trackFooterClick } from '../../firebase/footerAnalyticsService';
import locationPinImg from '../../assets/footer/contact-location-pin.png';
import lineOaImg from '../../assets/footer/contact-line-oa.png';
import phoneCallImg from '../../assets/footer/contact-phone-call.png';
import clockImg from '../../assets/footer/contact-business-clock.png';

const FooterContact = ({ companyConfig, businessHoursConfig }) => {
  const lineUrl =
    companyConfig?.lineAddFriendUrl ||
    (companyConfig?.lineId
      ? `https://line.me/R/ti/p/${encodeURIComponent(companyConfig.lineId)}`
      : null);
  const phoneTel = companyConfig?.phone
    ? `tel:${companyConfig.phone.replace(/[^0-9+]/g, '')}`
    : null;

  return (
    <div>
      <h3 className="font-heading text-[14.5px] font-semibold text-white mb-3 flex items-center">
        <span className="w-1 h-3.5 bg-emerald-400 rounded-xs mr-2"></span>
        <span>ติดต่อ & เวลาทำการ</span>
      </h3>

      {/* Borderless Unified Group (No Separate Card Shapes) */}
      <div className="space-y-2.5 text-[12.5px] font-light text-slate-300">
        {/* ที่อยู่ร้าน */}
        <div className="flex items-start gap-2.5">
          <img
            src={locationPinImg}
            alt="ที่อยู่ร้าน"
            className="w-7 h-7 object-contain shrink-0 mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
          />
          <span className="leading-snug pt-0.5">
            {companyConfig?.address ||
              'ศูนย์การค้าเซียร์รังสิต ชั้น 3 ห้อง xxx ถ.พหลโยธิน จ.ปทุมธานี 12130'}
          </span>
        </div>

        {/* LINE Official */}
        <div className="flex items-center gap-2.5">
          <img
            src={lineOaImg}
            alt="LINE Official"
            className="w-7 h-7 object-contain shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
          />
          {lineUrl ? (
            <a
              href={lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackFooterClick('contact', 'line', lineUrl)}
              className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              <span>LINE OA:</span>
              <strong className="text-white font-medium">
                {companyConfig?.lineId || '@dhnotebook'}
              </strong>
            </a>
          ) : (
            <div className="inline-flex items-center gap-1">
              <span>LINE OA:</span>
              <strong className="text-white font-medium">
                {companyConfig?.lineId || '@dhnotebook'}
              </strong>
            </div>
          )}
        </div>

        {/* เบอร์โทรศัพท์ */}
        <div className="flex items-center gap-2.5">
          <img
            src={phoneCallImg}
            alt="เบอร์โทรศัพท์"
            className="w-7 h-7 object-contain shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
          />
          {phoneTel ? (
            <a
              href={phoneTel}
              onClick={() => trackFooterClick('contact', 'phone', phoneTel)}
              className="hover:text-sky-400 transition-colors inline-flex items-center gap-1"
            >
              <span>Tel:</span>
              <strong className="text-white font-medium">
                {companyConfig?.phone || '02-xxx-xxxx'}
              </strong>
            </a>
          ) : (
            <div className="inline-flex items-center gap-1">
              <span>Tel:</span>
              <strong className="text-white font-medium">
                {companyConfig?.phone || '02-xxx-xxxx'}
              </strong>
            </div>
          )}
        </div>

        {/* เวลาทำการ */}
        {(businessHoursConfig?.openHours || businessHoursConfig?.days) && (
          <div className="flex items-start gap-2.5">
            <img
              src={clockImg}
              alt="Clock เวลาทำการ"
              className="w-7 h-7 object-contain shrink-0 mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
            />
            <div className="leading-snug pt-0.5">
              <div>
                <span>เวลาทำการ: </span>
                <strong className="text-white font-medium">
                  {businessHoursConfig.openHours || '10:00'} -{' '}
                  {businessHoursConfig.closeHours || '19:30'} น.
                </strong>
              </div>
              {businessHoursConfig.days && (
                <div className="text-slate-400 text-[11px] mt-0.5">
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
