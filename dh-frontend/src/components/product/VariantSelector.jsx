import React from 'react';

export default function VariantSelector({
  variantOptions,
  variants,
  selectedVariant,
  onVariantSelect,
  showError
}) {
  if (!variantOptions || variantOptions.length === 0) return null;

  return (
    <div id="variant-selector" className={`mb-6 space-y-4 p-4 rounded-xl transition-all duration-300 ${
      showError ? 'bg-red-50 border border-red-300 animate-[shake_0.5s_ease-in-out]' : 'bg-transparent border border-transparent'
    }`}>
      {showError && (
        <div className="text-red-500 font-bold text-sm mb-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          กรุณาเลือกตัวเลือกสินค้าให้ครบถ้วน
        </div>
      )}
      
      {variantOptions.map((opt, idx) => (
        <div key={idx} className="flex flex-col gap-2">
          <span className="text-sm font-bold text-slate-700">{opt.name}:</span>
          <div className="flex flex-wrap gap-2">
            {opt.values.map((val, vIdx) => {
              const isSelected = selectedVariant && selectedVariant[opt.name] === val;
              // ตรวจสอบว่ามี Variant นี้เปิดขายหรือไม่
              const isAvailable = variants && variants.some(v => 
                v.isActive && v.attributes[opt.name] === val
              );

              return (
                <button
                  key={vIdx}
                  onClick={() => onVariantSelect(opt.name, val)}
                  disabled={!isAvailable}
                  className={`px-4 py-2 text-sm font-medium border rounded-md transition-all ${
                    isSelected 
                      ? 'border-cyber-blue bg-blue-50 text-cyber-blue shadow-sm ring-2 ring-cyber-blue/20' 
                      : isAvailable 
                        ? 'border-slate-200 bg-white text-slate-600 hover:border-slate-300' 
                        : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
