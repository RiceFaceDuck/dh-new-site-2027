import React from 'react';
import { Phone, Mail } from 'lucide-react';

export default function ContactInfo({ customer }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> ข้อมูลติดต่อ
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-[10px] text-slate-500 font-semibold mb-1 flex items-center gap-1.5"><Phone size={12}/> เบอร์โทรศัพท์</p>
          <p className="text-sm font-bold text-slate-800">{customer.phoneNumber || customer.phone || '-'}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-[10px] text-slate-500 font-semibold mb-1 flex items-center gap-1.5"><Mail size={12}/> อีเมล</p>
          <p className="text-sm font-bold text-slate-800 truncate" title={customer.email}>{customer.email || '-'}</p>
        </div>
      </div>
    </div>
  );
}
