import React from 'react';
import { AlignLeft } from 'lucide-react';

export default function ProductDescriptionSection({ description }) {
  if (!description) return null;

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-md border border-slate-300 overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
        <AlignLeft className="text-cyber-blue w-5 h-5" />
        <h3 className="font-bold text-slate-800 tracking-wide">รายละเอียดสินค้า (Full Description)</h3>
      </div>
      <div className="p-6 md:p-8 prose prose-slate max-w-none text-slate-600 text-sm md:text-base leading-relaxed">
        <div 
          className="product-description-content"
          dangerouslySetInnerHTML={{ __html: description }} 
        />
      </div>
    </div>
  );
}
