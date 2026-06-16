import React from 'react';
import { FileText } from 'lucide-react';

export default function ProductSpecsSection({ specs }) {
  const hasSpecs = specs && Object.keys(specs).length > 0;

  if (!hasSpecs) return null;

  return (
    <div className="border-t border-slate-200 bg-slate-50">
      {/* Technical Specifications */}
      {hasSpecs && (
        <div className="p-6 md:p-10">
          <h3 className="text-xs font-tech font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest border-b border-slate-200 pb-3">
            <FileText size={16} className="text-cyber-blue" />
            Technical Specifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {Object.entries(specs).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="text-slate-800 text-sm font-medium text-right">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
