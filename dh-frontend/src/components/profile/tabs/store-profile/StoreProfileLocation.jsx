import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, CheckCircle2, Loader2, Info } from 'lucide-react';
import { useToast } from '../../../../context/ToastContext';

// 🛡️ In-memory geocode cache to avoid rate-limiting (403 Forbidden) on Nominatim
const geocodeCache = new Map();

const StoreProfileLocation = ({ storeData, setStoreData, handleGetLocation, locationLoading }) => {
  const { showToast } = useToast();
  const [resolvingName, setResolvingName] = useState(false);
  const [resolvedName, setResolvedName] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const [justFetched, setJustFetched] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const successTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const isLoading = Boolean(locationLoading || internalLoading);

  const onGetLocation = async () => {
    if (isLoading) return;
    setInternalLoading(true);
    try {
      if (handleGetLocation) {
        await handleGetLocation();
      }
      setJustFetched(true);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        setJustFetched(false);
      }, 2500);
    } catch {
      // Toast error is handled in handleGetLocation
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    const lat = Number(storeData.latitude);
    const lng = Number(storeData.longitude);

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      setResolvedName('');
      return;
    }

    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (geocodeCache.has(cacheKey)) {
      setResolvedName(geocodeCache.get(cacheKey));
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setResolvingName(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Accept-Language': 'th,en;q=0.9'
            }
          }
        );

        if (!res.ok) {
          if (res.status === 403) {
            console.warn("Nominatim rate limit reached (403)");
          }
          setResolvedName('พิกัดถูกต้อง (ไม่สามารถดึงชื่อสถานที่ได้)');
          return;
        }

        const data = await res.json();
        const displayName = data?.display_name || 'พิกัดร้านค้าที่เลือกไว้';
        geocodeCache.set(cacheKey, displayName);
        setResolvedName(displayName);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Reverse geocoding error:", error);
          setResolvedName('พิกัดถูกต้อง (ไม่สามารถดึงชื่อสถานที่ได้)');
        }
      } finally {
        setResolvingName(false);
      }
    }, 600); // 600ms debounce to strictly respect OpenStreetMap usage policy

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [storeData.latitude, storeData.longitude]);


  const handleParseCoordinates = async () => {
    const text = storeData.googleMapLink || '';
    if (!text.trim()) {
      showToast('กรุณาวางตัวเลขพิกัดก่อนครับ', 'error');
      return;
    }

    const updateLocation = (lat, lng) => {
      setStoreData(prev => ({ ...prev, latitude: lat, longitude: lng }));
      setShowManualInput(false);
      showToast('ตรวจสอบและตั้งค่าพิกัดสำเร็จ 📍', 'success');
    };

    // 1. หาพิกัดแบบตรงๆ (13.956, 100.567 หรือ 13.956 100.567 หรือ 13.956+100.567)
    let match = text.match(/(-?\d+\.\d+)(?:\s*,\s*|\s+|\+)(-?\d+\.\d+)/);
    if (match) return updateLocation(parseFloat(match[1]), parseFloat(match[2]));

    // 2. หาพิกัดจากลิงก์ยาว (@13.956,100.567) หรือข้อความยาวๆ ที่มีพิกัดซ่อนอยู่
    match = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return updateLocation(parseFloat(match[1]), parseFloat(match[2]));

    // 3. หาพิกัดจาก URL ปักหมุด Google Maps แบบ !3d...!4d...
    match = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (match) return updateLocation(parseFloat(match[1]), parseFloat(match[2]));

    // 4. หาพิกัดจาก Query Parameter (เช่น ?lat=13.956&lng=100.567)
    match = text.match(/[?&]lat=(-?\d+\.\d+)[^&\s]*[?&]l(?:ng|on)=(-?\d+\.\d+)/i);
    if (match) return updateLocation(parseFloat(match[1]), parseFloat(match[2]));
    match = text.match(/[?&]l(?:ng|on)=(-?\d+\.\d+)[^&\s]*[?&]lat=(-?\d+\.\d+)/i);
    if (match) return updateLocation(parseFloat(match[2]), parseFloat(match[1]));

    showToast('ไม่พบตัวเลขพิกัดในข้อความ กรุณาคัดลอกเฉพาะ "ตัวเลขพิกัด" (เช่น 13.956842, 100.567251) จาก Google Maps มาวางครับ', 'error');
  };

  return (
    <div>
      <h4 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3 mb-5 uppercase tracking-wide text-sm">
        <MapPin size={18} className="text-rose-500"/> ตำแหน่งที่ตั้งร้าน
      </h4>
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ที่อยู่ร้านแบบละเอียด</label>
          <textarea 
            value={storeData.address || ''} 
            onChange={(e) => setStoreData({...storeData, address: e.target.value})} 
            placeholder="บ้านเลขที่, ซอย, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์" 
            rows="2" 
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-md resize-none focus:border-indigo-500"
          ></textarea>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">สถานที่สำคัญใกล้เคียง (จุดสังเกต)</label>
          <input 
            type="text" 
            value={storeData.landmarks || ''} 
            onChange={(e) => setStoreData({...storeData, landmarks: e.target.value})} 
            placeholder="เช่น ตรงข้ามเซเว่น, ใกล้ตลาด..." 
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-md focus:border-indigo-500" 
          />
        </div>

        {/* 🗺️ ระบบเรดาร์ GPS พร้อมปุ่มอัปเดตพิกัด และปุ่มวางพิกัดเองในแผงเดียวกัน */}
        <div className="bg-amber-50 p-4 rounded-md border border-amber-200/60 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex-1 w-full">
              <p className="text-[11px] font-bold text-amber-800 uppercase tracking-widest mb-1">ระบบเรดาร์ GPS</p>
              <p className="text-xs text-amber-700/80">ระบบจำเป็นต้องทราบพิกัดปัจจุบันของคุณ เพื่อให้ลูกค้าในพื้นที่ใกล้เคียงค้นหาร้านคุณเจอ</p>
              {storeData.latitude ? (
                <div className="mt-3 p-3 bg-white/60 rounded-lg border border-amber-200">
                  <p className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={14}/> พิกัด: {storeData.latitude.toFixed(6)}, {storeData.longitude.toFixed(6)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-start gap-1">
                    <MapPin size={12} className="mt-[2px] shrink-0 text-slate-400" /> 
                    <span className="line-clamp-2">
                      {resolvingName ? (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Loader2 size={10} className="animate-spin" /> กำลังตรวจสอบสถานที่...
                        </span>
                      ) : resolvedName}
                    </span>
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto self-stretch sm:self-end">
              {/* ปุ่มดึงพิกัดจาก GPS อัตโนมัติ */}
              <button 
                type="button" 
                disabled={isLoading} 
                onClick={onGetLocation} 
                className={`px-3.5 sm:px-4 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 shadow-xs transition-all whitespace-nowrap active:scale-95 ${
                  justFetched
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 scale-[1.02]'
                    : isLoading
                      ? 'bg-indigo-600 text-white cursor-wait shadow-inner animate-pulse ring-2 ring-indigo-300'
                      : 'bg-slate-800 hover:bg-slate-900 text-white hover:shadow-sm'
                }`}
              >
                {justFetched ? (
                  <>
                    <CheckCircle2 size={14} className="text-white animate-in zoom-in-75 duration-200" /> 
                    <span>ดึงพิกัดสำเร็จ!</span>
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-amber-300" /> 
                    <span>กำลังสแกน GPS...</span>
                  </>
                ) : (
                  <>
                    <MapPin size={14} className={storeData.latitude ? "text-indigo-300" : "animate-bounce text-amber-400"} /> 
                    <span>{storeData.latitude ? 'อัปเดตพิกัด' : 'ดึงพิกัด'}</span>
                  </>
                )}
              </button>

              {/* ปุ่มวางพิกัดเอง / ตรวจสอบ */}
              <button
                type="button"
                onClick={() => {
                  if (showManualInput) {
                    handleParseCoordinates();
                  } else {
                    setShowManualInput(true);
                  }
                }}
                className={`px-3.5 sm:px-4 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 shadow-xs transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                  showManualInput
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                    : 'bg-white hover:bg-amber-100/80 text-amber-900 border border-amber-300'
                }`}
              >
                <Search size={14} />
                <span>{showManualInput ? 'ตรวจสอบ' : 'วางพิกัดเอง'}</span>
              </button>
            </div>
          </div>

          {/* 🌟 ช่องกรอกตัวเลขพิกัด (แสดงเมื่อกดปุ่ม "วางพิกัดเอง") */}
          {showManualInput && (
            <div className="pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row gap-2 animate-in fade-in duration-200">
              <input 
                type="text" 
                autoFocus
                value={storeData.googleMapLink || ''} 
                onChange={(e) => setStoreData({...storeData, googleMapLink: e.target.value})} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleParseCoordinates();
                  }
                }}
                placeholder="วางลิงก์ Google Maps หรือตัวเลขพิกัด (เช่น 13.956, 100.567) แล้วกดตรวจสอบ" 
                className="flex-1 px-3.5 py-2 bg-white border border-amber-300 focus:border-indigo-500 rounded-md text-xs text-slate-800 placeholder:text-slate-400 shadow-2xs focus:ring-2 focus:ring-indigo-100" 
              />
              <button
                type="button"
                onClick={() => setShowManualInput(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer self-end sm:self-center"
              >
                ยกเลิก
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-6 p-5 bg-indigo-50/50 border border-indigo-100 rounded-md text-slate-600">
          <h5 className="font-bold text-indigo-800 mb-3 flex items-center gap-2 text-sm"><Info size={16}/> คู่มือการตั้งค่าพิกัดร้าน (Guide)</h5>
          <div className="space-y-3 text-xs leading-relaxed">
            <p><strong>📖 ตำรา / คำอธิบาย:</strong> พิกัดตำแหน่งมีความสำคัญมาก เพื่อให้ระบบสามารถแนะนำร้านของคุณให้กับลูกค้าในพื้นที่ใกล้เคียงได้อย่างแม่นยำ</p>
            <p><strong>⚙️ วิธีการใช้งาน (How-to):</strong><br/>
              <span className="ml-4 block mt-1">1. หากคุณอยู่ที่ร้านค้าตอนนี้: ให้กดปุ่ม <b>"ดึงพิกัด"</b> หรือ <b>"อัปเดตพิกัด"</b></span>
              <span className="ml-4 block mt-1">2. หากคุณไม่ได้อยู่ที่ร้าน: ให้กดปุ่ม <b>"วางพิกัดเอง"</b> นำตัวเลขพิกัด (เช่น 13.960080, 100.625249) หรือลิงก์ Google Maps มาวางในช่อง แล้วกดปุ่ม <b>"ตรวจสอบ"</b></span>
            </p>
            <p><strong>💡 เทคนิคการใช้งาน (Tips & Tricks):</strong> หากต้องการคัดลอกพิกัดจากแอป Google Maps บนมือถือ ให้กดค้างที่ตำแหน่งร้านในแผนที่จนขึ้นหมุดสีแดง จากนั้นให้แตะที่ตัวเลขพิกัดในหน้าต่างข้อมูลด้านล่าง ระบบจะคัดลอกพิกัดให้ทันที</p>
            <p><strong>✅ ตัวอย่างผลลัพธ์ (Expected Results):</strong> เมื่อตั้งค่าพิกัดสำเร็จ จะปรากฏกล่องแสดงตัวเลขพิกัดสีเขียวพร้อมเครื่องหมายถูก (✔) ขึ้นมาตรงบริเวณระบบเรดาร์ GPS</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfileLocation;
