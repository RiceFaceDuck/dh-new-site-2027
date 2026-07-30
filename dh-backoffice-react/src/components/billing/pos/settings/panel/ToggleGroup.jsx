
export default function ToggleGroup({ options, activeValue, onChange, disabled }) {
    return (
        <div className={`flex bg-slate-200/80 p-1 rounded-lg border border-slate-300/80 shadow-2xs ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
            {options.map(opt => {
                const isActive = activeValue === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(opt.value)}
                        className={`flex-1 py-1.5 text-[11px] font-black rounded-md uppercase transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer ${
                            isActive
                                ? 'bg-gradient-to-r from-slate-900 via-[#1E254A] to-[#141B3B] text-white shadow-md ring-1 ring-indigo-500/30 scale-[1.01]' 
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60 font-extrabold'
                        }`}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}
