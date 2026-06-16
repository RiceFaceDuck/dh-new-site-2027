import React from 'react';
import { MapPin, CheckCircle2 } from 'lucide-react';

const StoreProfileLocation = ({ storeData, setStoreData, handleGetLocation, locationLoading }) => {
  return (
    <div>
      <h4 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-5 uppercase tracking-wide text-sm"><MapPin size={18} className="text-rose-500"/> ตำแหน่งที่ตั้งร้าน</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ที่อยู่ร้านแบบละเอียด</label>
          <textarea value={storeData.address} onChange={(e) => setStoreData({...storeData, address: e.target.value})} placeholder="บ้านเลขที่, ซอย, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์" rows="2" className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl resize-none focus:border-indigo-500"></textarea>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">สถานที่สำคัญใกล้เคียง (จุดสังเกต)</label>
          <input type="text" value={storeData.landmarks} onChange={(e) => setStoreData({...storeData, landmarks: e.target.value})} placeholder="เช่น ตรงข้ามเซเว่น, ใกล้ตลาด..." className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">พิกัดแผนที่ (Google Maps)</label>
          <input type="url" value={storeData.googleMapLink} onChange={(e) => setStoreData({...storeData, googleMapLink: e.target.value})} placeholder="วางลิงก์ Google Maps ของร้านคุณที่นี่" className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl mb-3 focus:border-indigo-500" />
          
          <div className="flex flex-col sm:flex-row gap-3 items-center bg-amber-50 p-4 rounded-xl border border-amber-200/60">
            <div className="flex-1">
              <p className="text-[11px] font-bold text-amber-800 uppercase tracking-widest mb-1">ระบบเรดาร์ GPS</p>
              <p className="text-xs text-amber-700/80">ระบบจำเป็นต้องทราบพิกัดปัจจุบันของคุณ เพื่อให้ลูกค้าในพื้นที่ใกล้เคียงค้นหาร้านคุณเจอ</p>
              {storeData.latitude && (
                <p className="text-xs font-mono font-bold text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle2 size={14}/> {storeData.latitude.toFixed(6)}, {storeData.longitude.toFixed(6)}</p>
              )}
            </div>
            <button type="button" disabled={locationLoading} onClick={handleGetLocation} className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-50">
              <MapPin size={16}/> {locationLoading ? 'กำลังดึงพิกัด...' : (storeData.latitude ? 'อัปเดตพิกัดใหม่' : 'ดึงพิกัดปัจจุบัน')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfileLocation;
