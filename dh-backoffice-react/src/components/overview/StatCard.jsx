
export const StatCard = ({ title, value, unit, icon: Icon, colorClass, subtitleText, activePulse }) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500">
      
      <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity group-hover:scale-110 duration-700 text-slate-900 pointer-events-none`}>
        <Icon size={120} />
      </div>
      
      <div className="relative z-10 h-full flex flex-col justify-between min-h-[140px]">
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${activePulse ? `${colorClass.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor] animate-pulse` : 'bg-slate-200'}`}></span> 
            {title}
          </p>
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">
            {value} <span className="text-[11px] font-bold text-slate-400 uppercase tracking-normal">{unit}</span>
          </h3>
        </div>
        
        {subtitleText && (
          <div className="mt-4">
            <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border ${colorClass.replace('text-', 'bg-').replace('-500', '-50')} ${colorClass.replace('text-', 'border-').replace('-500', '-100')} ${colorClass}`}>
              <span>{subtitleText}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
