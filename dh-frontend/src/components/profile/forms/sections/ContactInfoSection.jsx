import React from 'react';
import { User, Phone } from 'lucide-react';

export default function ContactInfoSection({ formData, handleChange }) {
  return (
    <div className="space-y-5">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0870B8]"></span>
        ข้อมูลผู้ติดต่อ (Contact Info)
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">ชื่อ - นามสกุล / ชื่อร้านค้า</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-slate-400 group-focus-within:text-[#0870B8] transition-colors" />
            </div>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0870B8]/10 focus:border-[#0870B8] transition-all bg-slate-50 focus:bg-white text-slate-800"
              placeholder="ระบุชื่อที่ต้องการให้แสดง"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">เบอร์โทรศัพท์ติดต่อ</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-[#0870B8] transition-colors" />
            </div>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0870B8]/10 focus:border-[#0870B8] transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium"
              placeholder="08X-XXX-XXXX"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
