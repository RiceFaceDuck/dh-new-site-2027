import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function FormalManagerBadge({ show = true, text = "MANAGER APPROVAL" }) {
  if (!show) return null;
  
  return (
    <div className="absolute top-0 right-0 z-10">
      <div className="bg-slate-800 text-amber-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl shadow-sm flex items-center gap-1.5 border-b border-l border-slate-700">
        <ShieldCheck size={12} />
        <span>{text}</span>
      </div>
    </div>
  );
}
