import React from 'react';
import { Crown } from 'lucide-react';

export default function ManagerBadge({ show = true, text = "to-do ผู้จัดการ" }) {
  if (!show) return null;
  
  return (
    <div className="absolute top-0 right-0">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-bl-xl shadow-md flex items-center gap-1.5 border-b border-l border-amber-600/50">
        <Crown size={12} className="animate-pulse" />
        <span>{text}</span>
      </div>
    </div>
  );
}
