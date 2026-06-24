import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle2, Search, Loader2, Info } from 'lucide-react';

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
      alert('กรุณาวางตัวเลขพิกัดก่อนครับ');
      return;
    }

    const updateLocation = (lat, lng) => {
      setStoreData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    };

    // 1. หาพิกัดแบบตรงๆ (13.956, 100.567)
    let match = text.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (match) return updateLocation(parseFloat(match[1]), parseFloat(match[2]));

    // 2. หาพิกัดจากลิงก์ยาว (@13.956,100.567) หรือข้อความยาวๆ ที่มีพิกัดซ่อนอยู่
    match = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return updateLocation(parseFloat(match[1]), parseFloat(match[2]));

    alert('ไม่พบตัวเลขพิกัดในข้อความ กรุณาคัดลอกเฉพาะ "ตัวเลขพิกัด" (เช่น 13.956842, 100.567251) จาก Google Maps มาวางครับ');
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
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">วางพิกัด ด้วยตัวเอง</label>
          <div className="flex gap-2 mb-3">
            <input type="text" value={storeData.googleMapLink || ''} onChange={(e) => setStoreData({...storeData, googleMapLink: e.target.value})} placeholder="ตัวเลขพิกัด (เช่น 13.956, 100.567)" className="flex-1 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500" />
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
                <><MapPin size={16} className={storeData.latitude ? "" : "animate-bounce"} /> {storeData.latitude ? 'ดึงพิกัด จากตำแหน่งที่คุณอยู่' : 'ดึงพิกัด จากตำแหน่งที่คุณอยู่'}</>
              )}
            </button>
          </div>
          
          <div className="mt-6 p-5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-slate-600">
            <h5 className="font-bold text-indigo-800 mb-3 flex items-center gap-2 text-sm"><Info size={16}/> คู่มือการตั้งค่าพิกัดร้าน (Guide)</h5>
            <div className="space-y-3 text-xs leading-relaxed">
              <p><strong>📖 ตำรา / คำอธิบาย:</strong> พิกัดตำแหน่งมีความสำคัญมาก เพื่อให้ระบบสามารถแนะนำร้านของคุณให้กับลูกค้าในพื้นที่ใกล้เคียงได้อย่างแม่นยำ</p>
              <p><strong>⚙️ วิธีการใช้งาน (How-to):</strong><br/>
                <span className="ml-4 block mt-1">1. หากคุณอยู่ที่ร้านค้าตอนนี้: ให้กดปุ่ม <b>"ดึงพิกัด จากตำแหน่งที่คุณอยู่"</b></span>
                <span className="ml-4 block mt-1">2. หากคุณไม่ได้อยู่ที่ร้าน: ให้ไปที่แอป Google Maps ค้นหาร้านของคุณ แล้วคัดลอกตัวเลขพิกัด (เช่น 13.960080, 100.625249) มาใส่ในช่อง <b>"วางพิกัด ด้วยตัวเอง"</b> แล้วกดปุ่ม <b>"ตรวจสอบพิกัด"</b></span>
              </p>
              <p><strong>💡 เทคนิคการใช้งาน (Tips & Tricks):</strong> หากต้องการคัดลอกพิกัดจากแอป Google Maps บนมือถือ ให้กดค้างที่ตำแหน่งร้านในแผนที่จนขึ้นหมุดสีแดง จากนั้นให้แตะที่ตัวเลขพิกัดในหน้าต่างข้อมูลด้านล่าง ระบบจะคัดลอกพิกัดให้ทันที</p>
              <p><strong>✅ ตัวอย่างผลลัพธ์ (Expected Results):</strong> เมื่อตั้งค่าพิกัดสำเร็จ จะปรากฏกล่องแสดงตัวเลขพิกัดสีเขียวพร้อมเครื่องหมายถูก (✔) ขึ้นมาตรงบริเวณระบบเรดาร์ GPS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfileLocation;
