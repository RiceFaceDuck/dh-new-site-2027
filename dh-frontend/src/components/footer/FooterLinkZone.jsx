import { ChevronRight } from 'lucide-react';
import { trackFooterClick } from '../../firebase/footerAnalyticsService';

const FooterLinkZone = ({ title, links, markerColor }) => {
  return (
    <div>
      <h3 className="font-heading text-[14.5px] font-semibold text-white mb-3 flex items-center">
        <span className={`w-1 h-3.5 rounded-xs mr-2 ${markerColor || 'bg-sky-400'}`}></span>
        <span>{title}</span>
      </h3>
      <ul className="space-y-2 text-[13px]">
        {links?.map((item, index) => (
          <li key={index}>
            <a
              href={item.url}
              onClick={() => trackFooterClick(title, item.label, item.url)}
              className="inline-flex items-center text-slate-400 hover:text-sky-400 font-light transition-colors duration-150 group"
            >
              <ChevronRight
                size={13}
                className="mr-1 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
              />
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FooterLinkZone;
