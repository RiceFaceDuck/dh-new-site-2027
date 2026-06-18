import React from 'react';
import { User, Building2 } from 'lucide-react';

export default function TaxTypeSelector({ type, onChange }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-300 ${
        type === 'personal' 
          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-[0_2px_10px_-3px_rgba(79,70,229,0.2)] ring-1 ring-indigo-600' 
          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
      }`}>
        <input 
          type="radio" name="type" value="personal" 
          checked={type === 'personal'} onChange={onChange}
          className="hidden" 
        />
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type === 'personal' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
          <User className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-sm block">บุคคลธรรมดา</span>
          <span className="text-[11px] opacity-70">สำหรับนามบุคคลทั่วไป</span>
        </div>
      </label>

      <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-300 ${
        type === 'company' 
          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-[0_2px_10px_-3px_rgba(79,70,229,0.2)] ring-1 ring-indigo-600' 
          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
      }`}>
        <input 
          type="radio" name="type" value="company" 
          checked={type === 'company'} onChange={onChange}
          className="hidden" 
        />
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type === 'company' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-sm block">นิติบุคคล</span>
          <span className="text-[11px] opacity-70">บริษัท / ห้างหุ้นส่วน</span>
        </div>
      </label>
    </div>
  );
}
