import React from 'react';
import { ChevronRight } from 'lucide-react';

const FooterLinkZone = ({ title, links, markerColor }) => {
  // markerColor: e.g. "bg-cyber-blue shadow-[0_0_8px_rgba(14,165,233,0.5)]"
  return (
    <div>
      <h3 className="text-white font-bold mb-5 md:mb-6 flex items-center text-sm md:text-base tracking-wide group">
        <span className={`w-1.5 h-4 rounded-sm mr-2.5 transition-transform group-hover:scale-y-125 duration-300 ${markerColor}`}></span>
        <span className="group-hover:text-slate-200 transition-colors">{title}</span>
      </h3>
      <ul className="space-y-3.5 text-sm">
        {links?.map((item, index) => (
          <li key={index}>
            <a 
              href={item.url} 
              className="flex items-center text-slate-400 hover:text-white hover:translate-x-1.5 transition-all duration-300 group"
            >
              <ChevronRight size={14} className="mr-1.5 opacity-40 group-hover:opacity-100 group-hover:text-[var(--dh-accent)] transition-all" />
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FooterLinkZone;
