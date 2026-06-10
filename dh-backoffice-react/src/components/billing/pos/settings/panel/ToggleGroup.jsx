import React from 'react';

export default function ToggleGroup({ options, activeValue, onChange, disabled }) {
    return (
        <div className={`flex bg-gray-100 p-0.5 rounded-md border border-gray-200 ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
            {options.map(opt => (
                <button
                    key={opt.value}
                    disabled={disabled}
                    onClick={() => onChange(opt.value)}
                    className={`flex-1 py-1.5 text-[11px] font-black rounded-sm uppercase transition-all duration-200 flex items-center justify-center gap-1 ${
                        activeValue === opt.value
                            ? 'bg-[#2A305A] text-white shadow-sm' 
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
