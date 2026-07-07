import React from 'react';
import { MapPin, CheckCircle2, Copy, Navigation } from 'lucide-react';

export default function ShippingInfo({ getFormattedAddress, handleCopy, copiedField, customer }) {
  // ดึงข้อมูลที่อยู่แบบ Structured
  const address = customer?.address || customer?.defaultDeliveryNote || {};
  const isStructured = address && typeof address === 'object';
  
  const googleMapsUrl = isStructured ? address.googleMapsUrl : null;
  
  // กรณีที่เป็นข้อความยาวๆ (Legacy data)
  const legacyAddress = !isStructured ? getFormattedAddress() : '';

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ข้อมูลจัดส่งสินค้า
      </h3>
      <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 relative group">
        <p className="text-[10px] text-emerald-600 font-bold mb-3 flex items-center gap-1.5">
          <MapPin size={12}/> ที่อยู่จัดส่ง
        </p>

        {isStructured ? (
          <div className="pr-8">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
              <div className="col-span-2">
                <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">บ้านเลขที่ / ถนน / อาคาร</p>
                <p className={address.addressLine ? "text-slate-700 font-medium" : "text-slate-300"}>
                  {address.addressLine || '-'}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">แขวง / ตำบล</p>
                <p className={address.subDistrict ? "text-slate-700 font-medium" : "text-slate-300"}>
                  {address.subDistrict || '-'}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">เขต / อำเภอ</p>
                <p className={address.district ? "text-slate-700 font-medium" : "text-slate-300"}>
                  {address.district || '-'}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">จังหวัด</p>
                <p className={address.province ? "text-slate-700 font-medium" : "text-slate-300"}>
                  {address.province || '-'}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">รหัสไปรษณีย์</p>
                <p className={address.zipCode ? "text-slate-700 font-bold" : "text-slate-300"}>
                  {address.zipCode || '-'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="pr-8">
            <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">รายละเอียดที่อยู่</p>
            <p className={legacyAddress && legacyAddress !== 'ไม่ได้ระบุข้อมูลที่อยู่' ? "text-slate-700 font-medium text-xs leading-relaxed" : "text-slate-300 text-xs"}>
              {legacyAddress === 'ไม่ได้ระบุข้อมูลที่อยู่' ? '-' : legacyAddress}
            </p>
          </div>
        )}
        
        {/* Google Maps Link */}
        <div className="mt-4 pt-3 border-t border-emerald-100/50 flex flex-col items-start">
          <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1.5">พิกัดร้านค้า (Google Maps)</p>
          {googleMapsUrl ? (
            <a 
              href={googleMapsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 hover:text-white bg-white hover:bg-emerald-500 px-3 py-1.5 rounded-sm border border-emerald-200 transition-all shadow-xs"
            >
              <Navigation size={12} />
              เปิดแผนที่นำทาง
            </a>
          ) : (
            <p className="text-xs text-slate-300">-</p>
          )}
        </div>

        {handleCopy && getFormattedAddress() !== 'ไม่ได้ระบุข้อมูลที่อยู่' && (
          <button 
            onClick={() => handleCopy(getFormattedAddress(), 'address')}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-emerald-600 bg-white shadow-xs border border-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            title="คัดลอกที่อยู่แบบเต็ม"
          >
            {copiedField === 'address' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
