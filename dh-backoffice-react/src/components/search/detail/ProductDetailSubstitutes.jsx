import React from 'react';
import { RefreshCw } from 'lucide-react';
import { HighlightText } from '../HighlightText';

export default function ProductDetailSubstitutes({ substitutes, handleSelectProduct, highlightData }) {
  if (!substitutes || substitutes.length === 0) return null;

  return (
    <div className="mt-4 p-3 bg-dh-accent-light/50 rounded-lg border border-dh-accent/30 transition-colors">
      <div className="text-[11px] font-extrabold text-dh-accent uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <RefreshCw size={14}/> สินค้าใช้แทนกันได้ (Substitutes)
      </div>
      <div className="grid grid-cols-2 gap-2">
        {substitutes.map(sub => (
          <div key={sub.id} onClick={() => handleSelectProduct(sub)} className="group/sub bg-dh-surface p-2.5 rounded-md border border-dh-border cursor-pointer hover:border-dh-accent flex justify-between items-center transition-all duration-300 hover:shadow-dh-card hover:-translate-y-[1px]">
            <div className="min-w-0 pr-2">
              <div className="font-extrabold text-dh-main text-[12px] mb-0.5 group-hover/sub:text-dh-accent transition-colors"><HighlightText text={sub.sku} highlightData={highlightData}/></div> 
              <div className="text-[10px] font-bold text-dh-muted truncate"><HighlightText text={sub.name} highlightData={highlightData}/></div>
            </div>
            <span className="text-[10px] font-black text-dh-accent bg-dh-base border border-dh-border px-1.5 py-0.5 rounded shrink-0 shadow-sm group-hover/sub:scale-105 transition-transform">มี {sub.stockQuantity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
