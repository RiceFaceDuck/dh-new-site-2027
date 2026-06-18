import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle2, Search, Loader2 } from 'lucide-react';

const StoreProfileLocation = ({ storeData, setStoreData, handleGetLocation, locationLoading }) => {
  const [resolvingName, setResolvingName] = useState(false);
  const [resolvedName, setResolvedName] = useState('');

  useEffect(() => {
    if (storeData.latitude && storeData.longitude) {
      reverseGeocode(storeData.latitude, storeData.longitude);
    }
  }, [storeData.latitude, storeData.longitude]);

  const reverseGeocode = async (lat, lng) => {
    try {
      setResolvingName(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        setResolvedName(data.display_name);
      } else {
        setResolvedName('ไม่ทราบชื่อสถานที่แน่ชัด');
      }
    } catch (error) {
      console.error(error);
      setResolvedName('ไม่สามารถดึงชื่อสถานที่ได้');
    } finally {
      setResolvingName(false);
    }
  };

  const handleParseCoordinates = async () => {
    const text = storeData.googleMapLink || '';
    if (!text.trim()) {
      alert('กรุณาวางลิงก์หรือข้อความที่มีพิกัดก่อนครับ');
      return;
    }

    const updateLocation = (lat, lng) => {
      setStoreData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    };

    // 1. หาพิกัดแบบตรงๆ (13.956, 100.567)
    let match = text.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (match) return updateLocation(parseFloat(match[1]), parseFloat(match[2]));

    // 2. หาพิกัดจากลิงก์ยาว (@13.956,100.567)
    match = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return updateLocation(parseFloat(match[1]), parseFloat(match[2]));

    // 3. ถ้าเป็นลิงก์สั้น (maps.app.goo.gl) ให้ใช้ Proxy แกะรอย URL
    if (text.includes('maps.app.goo.gl') || text.includes('goo.gl/maps')) {
      try {
        setResolvingName(true);
        const urlMatch = text.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(urlMatch[0])}`);
          const data = await res.json();
          if (data && data.contents) {
             const htmlMatch = data.contents.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || 
                               data.contents.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/) || 
                               data.contents.match(/\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/);
             if (htmlMatch) {
               return updateLocation(parseFloat(htmlMatch[1]), parseFloat(htmlMatch[2]));
             }
          }
        }
      } catch (error) {
        console.error("Error resolving short link:", error);
      } finally {
        setResolvingName(false);
      }
    }

    alert('ดึงพิกัดจากลิงก์ไม่สำเร็จ แนะนำให้คัดลอกเฉพาะ "ตัวเลขพิกัด" (เช่น 13.956842, 100.567251) มาวางแทนครับ');
  };

  return (
    <div>
      <h4 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-5 uppercase tracking-wide text-sm"><MapPin size={18} className="text-rose-500"/> ตำแหน่งที่ตั้งร้าน</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ที่อยู่ร้านแบบละเอียด</label>
          <textarea value={storeData.address || ''} onChange={(e) => setStoreData({...storeData, address: e.target.value})} placeholder="บ้านเลขที่, ซอย, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์" rows="2" className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl resize-none focus:border-indigo-500"></textarea>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">สถานที่สำคัญใกล้เคียง (จุดสังเกต)</label>
          <input type="text" value={storeData.landmarks || ''} onChange={(e) => setStoreData({...storeData, landmarks: e.target.value})} placeholder="เช่น ตรงข้ามเซเว่น, ใกล้ตลาด..." className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">พิกัดแผนที่ (Google Maps Link หรือ Coordinates)</label>
          <div className="flex gap-2 mb-3">
            <input type="text" value={storeData.googleMapLink || ''} onChange={(e) => setStoreData({...storeData, googleMapLink: e.target.value})} placeholder="วางลิงก์ Google Maps หรือ พิกัด (เช่น 13.956, 100.567)" className="flex-1 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500" />
            <button type="button" onClick={handleParseCoordinates} className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold flex items-center gap-2 border border-indigo-200 transition-colors whitespace-nowrap">
              <Search size={16}/> ตรวจสอบพิกัด
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-center bg-amber-50 p-4 rounded-xl border border-amber-200/60">
            <div className="flex-1 w-full">
              <p className="text-[11px] font-bold text-amber-800 uppercase tracking-widest mb-1">ระบบเรดาร์ GPS</p>
              <p className="text-xs text-amber-700/80">ระบบจำเป็นต้องทราบพิกัดปัจจุบันของคุณ เพื่อให้ลูกค้าในพื้นที่ใกล้เคียงค้นหาร้านคุณเจอ</p>
              {storeData.latitude ? (
                <div className="mt-3 p-3 bg-white/60 rounded-lg border border-amber-200">
                  <p className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14}/> พิกัด: {storeData.latitude.toFixed(6)}, {storeData.longitude.toFixed(6)}</p>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-start gap-1">
                    <MapPin size={12} className="mt-[2px] shrink-0 text-slate-400" /> 
                    <span className="line-clamp-2">
                      {resolvingName ? <span className="flex items-center gap-1 text-slate-400"><Loader2 size={10} className="animate-spin" /> กำลังตรวจสอบสถานที่...</span> : resolvedName}
                    </span>
                  </p>
                </div>
              ) : null}
            </div>
            <button type="button" disabled={locationLoading} onClick={handleGetLocation} className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all whitespace-nowrap ${locationLoading ? 'bg-indigo-100 text-indigo-500 cursor-not-allowed shadow-inner' : (storeData.latitude ? 'bg-slate-800 hover:bg-slate-900 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white')}`}>
              {locationLoading ? (
                <><Loader2 size={16} className="animate-spin" /> กำลังสแกนหาดาวเทียม...</>
              ) : (
                <><MapPin size={16} className={storeData.latitude ? "" : "animate-bounce"} /> {storeData.latitude ? 'ดึงพิกัด GPS อัตโนมัติ' : 'ดึงพิกัดปัจจุบัน'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfileLocation;
