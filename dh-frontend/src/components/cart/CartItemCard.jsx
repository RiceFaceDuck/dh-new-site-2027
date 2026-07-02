import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, Minus, Loader2, AlertTriangle } from 'lucide-react';

// 🚀 ฟังก์ชันตัวช่วย: ดึงค่า Key แบบไม่สนใจตัวพิมพ์เล็กใหญ่ หรืออักษรพิเศษ
const normalizeKey = (k) => String(k).replace(/[_-\s]/g, '').toLowerCase();

const getVal = (obj, possibleKeys) => {
  if (!obj || typeof obj !== 'object') return null;
  const normalizedObj = Object.keys(obj).reduce((acc, key) => {
    acc[normalizeKey(key)] = obj[key];
    return acc;
  }, {});
  for (let key of possibleKeys) {
    const val = normalizedObj[normalizeKey(key)];
    if (val !== undefined && val !== null && val !== '') return val;
  }
  return null;
};

// 🚀 ฟังก์ชันตัวช่วย: แปลงข้อมูลทุกรูปแบบให้เป็นตัวเลข ป้องกัน NaN ยอดพัง
const parseSafeNumber = (val) => {
  if (val === null || val === undefined) return 0;
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g, "")) : Number(val);
  return isNaN(num) ? 0 : num;
};

const CartItemCard = ({ item, index, updatingId, itemError, maxQty, onUpdateQty, onRemoveItem }) => {
  const realId = item.id;
  const name = getVal(item, ['name', 'title', 'productname', 'ชื่อสินค้า']) || "Unknown Product / Corrupt Data";
  const price = parseSafeNumber(getVal(item, ['retailprice', 'regularprice', 'price', 'saleprice', 'ราคา']));
  
  const rawImg = getVal(item, ['imageurl', 'image', 'images', 'img', 'รูปภาพ']);
  const imageUrl = Array.isArray(rawImg) ? rawImg[0] : (rawImg || '/logo.png');
  
  const rawSku = getVal(item, ['sku', 'code', 'รหัสสินค้า']);
  const sku = rawSku || null;

  useEffect(() => {
    // เก็บ History Log ถ้าหาสินค้าไม่เจอ SKU (ตาม Request)
    if (!sku) {
      console.warn(`[History Log] Missing SKU for product ID: ${realId} - Name: ${name}`);
      // TODO: สามารถยิง API ไปยังระบบหลังบ้านเพื่อบันทึก log แบบถาวรในอนาคตได้
    }
  }, [sku, realId, name]);

  const isUpdating = updatingId === realId;
  const originalQty = item.qty || item.quantity || 1;

  // ⚡️ Local State สำหรับ Optimistic UI และ Debounce
  const [localQty, setLocalQty] = useState(originalQty);
  const [shake, setShake] = useState(false);
  const [localError, setLocalError] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Sync ค่ากลับถ้าการอัปเดตเสร็จสิ้น หรือค่าจากฐานข้อมูลเปลี่ยน
    if (!isUpdating) {
      setLocalQty(originalQty);
    }
  }, [originalQty, isUpdating]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // ซิงค์ Error จาก Context เข้ามาใน State ของการ์ด
  useEffect(() => {
    setLocalError(itemError || null);
  }, [itemError]);

  const handleQtyChange = (change) => {
    const newQty = localQty + change;
    if (newQty < 0) return;
    
    // ตรวจสอบสต๊อกทันทีและแสดงเอฟเฟกต์ แต่ยอมให้เพิ่มเพื่อให้ตะกร้าติดสถานะ Invalid (โชว์ปุ่มติดต่อ)
    if (change > 0 && maxQty !== null && newQty > maxQty) {
      setShake(true);
      setLocalError("สินค้าไม่เพียงพอ");
      setTimeout(() => setShake(false), 500);
    }

    if (change < 0) {
      // ถ้าลบลงมาจนอยู่ในระดับที่พอดีกับสต๊อก ให้เคลียร์ Error
      if (maxQty === null || newQty <= maxQty) {
        setLocalError(null);
      }
    }
    
    setLocalQty(newQty); // อัปเดต UI ทันที

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // หน่วงเวลา 500ms ก่อนยิง Request
    timeoutRef.current = setTimeout(() => {
      const delta = newQty - originalQty;
      if (delta !== 0) {
        onUpdateQty(realId, originalQty, delta);
      }
    }, 500);
  };

  const displayError = localError;

  return (
    <div className={`rounded-2xl shadow-sm border p-4 flex flex-col sm:flex-row gap-4 relative overflow-hidden transition-all duration-300 hover:shadow-md ${displayError ? 'border-red-400 bg-red-50/70 shadow-red-100/50' : 'bg-white border-gray-100'} ${isUpdating && localQty === originalQty ? 'opacity-70 pointer-events-none scale-[0.99]' : ''} ${shake ? 'animate-shake' : ''}`}>
      
      <div className={`w-full sm:w-28 h-28 bg-white rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-2 border relative group shadow-sm transition-colors ${displayError ? 'border-red-200' : 'border-gray-100'}`}>
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
          onError={(e) => e.target.src='/logo.png'}
        />
        {/* Glow effect ข้างหลังรูปเวลา Error */}
        {displayError && <div className="absolute inset-0 bg-red-500/5 animate-pulse mix-blend-multiply rounded-xl"></div>}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-4">
            <h3 className={`text-sm md:text-base font-bold line-clamp-2 leading-snug transition-colors ${displayError ? 'text-red-900' : 'text-gray-800 group-hover:text-emerald-600'}`}>
              {name}
            </h3>
            <button 
              onClick={() => onRemoveItem(realId)}
              disabled={isUpdating}
              className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors shrink-0 disabled:opacity-50 active:scale-90"
              title="ลบสินค้า"
            >
              {isUpdating && localQty === originalQty ? <Loader2 size={18} className={`animate-spin ${displayError ? 'text-red-400' : 'text-gray-400'}`} /> : <Trash2 size={18} />}
            </button>
          </div>
          {sku && (
            <p className={`text-[10px] md:text-xs mt-1 font-medium font-tech uppercase tracking-wide transition-colors ${displayError ? 'text-red-400' : 'text-gray-500'}`}>
              SKU: {sku}
            </p>
          )}
        </div>

        <div className="flex flex-col justify-end mt-4 h-full">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div className={`font-black text-lg font-tech transition-colors ${displayError ? 'text-red-600' : 'text-emerald-600'}`}>
              ฿{price.toLocaleString()}
            </div>

            <div className="flex items-center gap-3 justify-end flex-1">
              {/* แจ้งเตือนข้อผิดพลาดที่ตัวสินค้า (Premium Interaction) วางข้างซ้ายของปุ่มบวกลบ */}
              {displayError && (
                <div className={`flex items-center gap-1.5 animate-fade-in transition-transform duration-300 ${shake ? 'scale-110' : 'scale-100'}`}>
                  <AlertTriangle size={14} className={`transition-colors duration-300 ${shake ? 'text-red-600' : 'text-red-500'}`} />
                  <span className={`text-[11px] sm:text-xs font-bold whitespace-nowrap transition-colors duration-300 ${shake ? 'text-red-700' : 'text-red-600'}`}>
                    {displayError}
                  </span>
                </div>
              )}

              <div className={`flex items-center border rounded-xl overflow-hidden shadow-sm transition-colors duration-300 ${displayError ? 'bg-red-50 border-red-300 hover:border-red-400' : 'bg-white border-gray-200 hover:border-emerald-300'}`}>
                <button 
                  onClick={() => handleQtyChange(-1)}
                  disabled={(isUpdating && localQty === originalQty) || localQty <= 1}
                  className={`p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${displayError ? 'text-red-500 hover:bg-red-100 active:bg-red-200' : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100'}`}
                >
                  <Minus size={14} strokeWidth={2.5} />
                </button>
                <div className={`w-10 text-center text-sm font-bold relative font-tech ${displayError ? 'text-red-700' : 'text-gray-800'}`}>
                  {isUpdating && localQty === originalQty ? (
                    <Loader2 size={14} className={`animate-spin mx-auto ${displayError ? 'text-red-500' : 'text-emerald-600'}`} />
                  ) : (
                    <span className={`inline-block transition-transform duration-300 ${shake ? 'scale-125' : 'scale-100'}`}>{localQty}</span>
                  )}
                </div>
                <button 
                  onClick={() => handleQtyChange(1)}
                  disabled={isUpdating && localQty === originalQty}
                  className={`p-2 transition-colors disabled:opacity-50 ${displayError ? 'text-red-500 hover:bg-red-100 active:bg-red-200' : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100'}`}
                >
                  <Plus size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;
