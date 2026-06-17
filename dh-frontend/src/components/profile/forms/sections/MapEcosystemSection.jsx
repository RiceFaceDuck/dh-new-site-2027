import React from 'react';
import { Map, Navigation, AlertCircle } from 'lucide-react';

export default function MapEcosystemSection({ formData, handleChange, isValidMapUrl }) {
  return (
    <div className="bg-emerald-50/50 border border-emerald-100/60 p-5 rounded-xl mt-6">
      <label className="block text-sm font-bold text-emerald-800 mb-1 flex items-center gap-2">
        <Map className="w-4 h-4" /> พิกัดร้านค้า (Google Maps)
      </label>
      <p className="text-xs text-emerald-600 mb-3">ใช้สำหรับการเข้าร่วมระบบ Partner Ecosystem ของ DH Notebook</p>
      
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Navigation className={`h-5 w-5 transition-colors ${formData.mapUrl && isValidMapUrl(formData.mapUrl) ? 'text-emerald-500' : 'text-slate-400'}`} />
        </div>
        <input
          type="url"
          name="mapUrl"
          value={formData.mapUrl}
          onChange={handleChange}
          className={`block w-full pl-11 pr-12 py-2.5 border rounded-xl transition-all focus:bg-white text-slate-800 ${
            formData.mapUrl && !isValidMapUrl(formData.mapUrl) 
              ? 'border-rose-300 focus:ring-rose-500/20 bg-rose-50' 
              : 'border-emerald-200/60 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white'
          }`}
          placeholder="https://maps.app.goo.gl/..."
        />
        
        {/* Gimmick: ปุ่มพรีวิวแผนที่สีเขียว */}
        {formData.mapUrl && isValidMapUrl(formData.mapUrl) && (
          <a 
            href={formData.mapUrl} 
            target="_blank" 
            rel="noreferrer" 
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors"
            title="ทดสอบลิงก์แผนที่"
          >
            <Map className="w-4 h-4" />
          </a>
        )}
      </div>
      
      {formData.mapUrl && !isValidMapUrl(formData.mapUrl) && (
        <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium animate-fade-in">
          <AlertCircle className="w-3 h-3" /> กรุณาตรวจสอบลิงก์ (ต้องเป็น Google Maps เท่านั้น)
        </p>
      )}
    </div>
  );
}
