import React from 'react';

export const StatCard = ({ title, value, unit, icon: Icon, colorClass, shadowColorClass, subtitleIcon: SubtitleIcon, subtitleText, glowColor, bgIconColor, activePulse }) => {
  return (
    <div className="bg-dh-surface rounded-md p-6 border border-dh-border shadow-dh-card relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      <div className={`absolute top-0 right-0 w-24 h-24 ${glowColor} rounded-full filter blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none`}></div>
      <div className={`absolute top-4 right-4 ${bgIconColor} transition-colors group-hover:scale-110 duration-500`}>
        <Icon size={64} />
      </div>
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div>
          <p className="text-dh-muted text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${activePulse ? `${colorClass} ${shadowColorClass} animate-pulse` : 'bg-slate-300'}`}></span> {title}
          </p>
          <h3 className="text-4xl font-black text-dh-main tracking-tight mb-2">
            {value} <span className="text-sm font-bold text-dh-muted uppercase">{unit}</span>
          </h3>
        </div>
        {subtitleText && (
          <div className={`flex items-center gap-1.5 text-xs font-bold w-fit px-2.5 py-1.5 rounded-sm border mt-4 ${colorClass.replace('bg-', 'text-').replace('-500', '-600 dark:text-[color]-400')} ${colorClass.replace('bg-', 'bg-').replace('-500', '-500/10')} ${colorClass.replace('bg-', 'border-').replace('-500', '-500/20')}`}>
            {SubtitleIcon && <SubtitleIcon size={14} />}
            <span>{subtitleText}</span>
          </div>
        )}
      </div>
    </div>
  );
};
