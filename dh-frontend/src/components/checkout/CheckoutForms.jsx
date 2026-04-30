/* eslint-disable */
import React from 'react';
import { Truck, Receipt, Briefcase, AlertCircle, CreditCard, Upload } from 'lucide-react';

const SectionHeader = ({ icon: Icon, title, color = "text-[#0870B8]" }) => (
  <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
    <Icon size={20} className={color} /> {title}
  </h2>
);

export const ShippingForm = ({ info, setInfo, saveAddress, setSaveAddress }) => (
  <section className="card-premium p-6">
    <SectionHeader icon={Truck} title="ข้อมูลการจัดส่ง" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="md:col-span-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1 block">Logistic Provider</label>
        <select 
          value={info.logisticProvider} 
          onChange={e => setInfo({...info, logisticProvider: e.target.value})} 
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-[#0870B8]/10 outline-none font-bold"
        >
          <option value="Kerry Express">Kerry Express</option>
          <option value="Flash Express">Flash Express</option>
          <option value="ไปรษณีย์ไทย (EMS)">ไปรษณีย์ไทย (EMS)</option>
          <option value="Lalamove / Grab">Lalamove / Grab (ในพื้นที่)</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Recipient Name</label>
        <input required type="text" value={info.fullName} onChange={e => setInfo({...info, fullName: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white outline-none transition-all font-medium" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Phone Number</label>
        <input required type="tel" value={info.phone} onChange={e => setInfo({...info, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white outline-none transition-all font-medium" />
      </div>
      <div className="md:col-span-2 space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Full Address</label>
        <textarea required rows="2" value={info.address} onChange={e => setInfo({...info, address: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white outline-none transition-all resize-none font-medium"></textarea>
      </div>
    </div>
    <label className="mt-5 flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} className="sr-only peer" />
        <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#0870B8] transition-all"></div>
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5 shadow-sm"></div>
      </div>
      <span className="text-xs font-bold text-gray-500 group-hover:text-[#0870B8] transition-colors">บันทึกที่อยู่นี้เป็นที่อยู่หลัก</span>
    </label>
  </section>
);

export const B2BTaxForm = ({ b2b, setB2b, tax, setTax }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className={`card-premium p-6 border-l-4 transition-all ${b2b.isRequesting ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <SectionHeader icon={Briefcase} title="B2B / Wholesale" color={b2b.isRequesting ? "text-indigo-600" : "text-gray-400"} />
        <input type="checkbox" className="sr-only peer" id="b2b-check" checked={b2b.isRequesting} onChange={e => setB2b({...b2b, isRequesting: e.target.checked})} />
        <label htmlFor="b2b-check" className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer peer-checked:bg-indigo-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></label>
      </div>
      {b2b.isRequesting && (
        <textarea value={b2b.note} onChange={e => setB2b({...b2b, note: e.target.value})} placeholder="ระบุหมายเหตุ (เช่น ขอใบเสนอราคาพาร์ทเนอร์)" className="w-full p-3 bg-white border border-indigo-100 rounded-md text-xs outline-none focus:border-indigo-400 resize-none h-20 font-medium"></textarea>
      )}
    </div>

    <div className={`card-premium p-6 border-l-4 transition-all ${tax.isRequesting ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <SectionHeader icon={Receipt} title="Tax Invoice" color={tax.isRequesting ? "text-emerald-500" : "text-gray-400"} />
        <input type="checkbox" className="sr-only peer" id="tax-check" checked={tax.isRequesting} onChange={e => setTax({...tax, isRequesting: e.target.checked})} />
        <label htmlFor="tax-check" className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></label>
      </div>
      {tax.isRequesting && (
        <div className="space-y-2">
          <input placeholder="ชื่อบริษัท/ผู้เสียภาษี" value={tax.name} onChange={e => setTax({...tax, name: e.target.value})} className="w-full p-2 bg-white border border-emerald-100 rounded-md text-xs outline-none" />
          <input placeholder="เลขผู้เสียภาษี 13 หลัก" value={tax.taxId} onChange={e => setTax({...tax, taxId: e.target.value})} className="w-full p-2 bg-white border border-emerald-100 rounded-md text-xs outline-none" />
        </div>
      )}
    </div>
  </div>
);

export const PaymentForm = ({ finalPayable, slipPreview, handleFileChange }) => (
  <section className="card-premium p-6 overflow-hidden relative">
    <div className="absolute top-0 right-0 w-32 h-32 bg-[#E6F0F9] rounded-full -mr-16 -mt-16 opacity-50 blur-3xl"></div>
    <SectionHeader icon={CreditCard} title="ช่องทางชำระเงิน" />
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
      <div className="md:col-span-5 bg-gray-900 rounded-md p-6 text-white shadow-xl">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex justify-between items-center">
          DH Bank Transfer <div className="w-8 h-5 bg-white/10 rounded"></div>
        </p>
        <p className="text-xs text-gray-300 mb-1">ธนาคารกสิกรไทย (KBank)</p>
        <p className="text-xl font-black tracking-widest mb-6">123-4-56789-0</p>
        <p className="text-[11px] font-bold">บจก. ดีเอช โน๊ตบุ๊ค</p>
      </div>

      <div className="md:col-span-7">
        <label className="text-xs font-bold text-gray-600 mb-3 block flex items-center gap-2">
          แนบสลิปชำระเงิน <span className="text-red-500">*</span> ยอดสุทธิ <span className="text-[#0870B8] text-lg font-black italic">฿{finalPayable.toLocaleString()}</span>
        </label>
        {slipPreview ? (
          <div className="relative rounded-md overflow-hidden border border-gray-200 group aspect-video bg-black">
            <img src={slipPreview} alt="Slip" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
              <label className="cursor-pointer bg-white text-gray-800 px-5 py-2 rounded-md text-xs font-black shadow-xl hover:scale-105 transition-transform uppercase tracking-widest">
                Change Slip <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-md bg-gray-50/50 hover:bg-[#E6F0F9]/30 cursor-pointer transition-all hover:border-[#0870B8]/30 group">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-premium mb-3 group-hover:scale-110 transition-transform">
              <Upload size={20} className="text-[#0870B8]" />
            </div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Click to Upload Slip</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        )}
      </div>
    </div>
  </section>
);