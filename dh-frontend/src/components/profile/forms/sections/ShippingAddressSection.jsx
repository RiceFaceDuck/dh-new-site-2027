import React from 'react';
import { Home, Building, Building2, MapPin, Hash } from 'lucide-react';

export default function ShippingAddressSection({ formData, handleChange }) {
  return (
    <div className="space-y-5 pt-4 border-t border-slate-100">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        ที่อยู่จัดส่งสินค้า (Shipping Address)
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* บ้านเลขที่ ซอย ถนน */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">บ้านเลขที่ / หมู่ / ซอย / ถนน / อาคาร</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-start pt-3 pointer-events-none">
              <Home className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <textarea
              name="address.addressLine"
              value={formData.address.addressLine}
              onChange={handleChange}
              rows="2"
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all bg-slate-50 focus:bg-white text-slate-800 resize-none"
              placeholder="เช่น 123/45 หมู่ 6 ซอยสุขุมวิท 1 ถ.สุขุมวิท อาคารเอ ชั้น 2..."
            ></textarea>
          </div>
        </div>

        {/* แขวง/ตำบล */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">แขวง / ตำบล</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              name="address.subDistrict"
              value={formData.address.subDistrict}
              onChange={handleChange}
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all bg-slate-50 focus:bg-white text-slate-800"
              placeholder="ตำบล / แขวง"
            />
          </div>
        </div>

        {/* เขต/อำเภอ */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">เขต / อำเภอ</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Building2 className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              name="address.district"
              value={formData.address.district}
              onChange={handleChange}
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all bg-slate-50 focus:bg-white text-slate-800"
              placeholder="อำเภอ / เขต"
            />
          </div>
        </div>

        {/* จังหวัด */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">จังหวัด</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              name="address.province"
              value={formData.address.province}
              onChange={handleChange}
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all bg-slate-50 focus:bg-white text-slate-800"
              placeholder="จังหวัด"
            />
          </div>
        </div>

        {/* รหัสไปรษณีย์ */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">รหัสไปรษณีย์</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Hash className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={handleChange}
              maxLength={5}
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all bg-slate-50 focus:bg-white text-slate-800 font-mono tracking-widest"
              placeholder="10XXX"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
