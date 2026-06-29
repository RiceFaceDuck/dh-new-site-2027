import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, Minus, Loader2 } from 'lucide-react';

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

const CartItemCard = ({ item, index, updatingId, onUpdateQty, onRemoveItem }) => {
  const realId = item.id;
  const name = getVal(item, ['name', 'title', 'productname', 'ชื่อสินค้า']) || "Unknown Product / Corrupt Data";
  const price = parseSafeNumber(getVal(item, ['retailprice', 'regularprice', 'price', 'saleprice', 'ราคา']));
  
  const rawImg = getVal(item, ['imageurl', 'image', 'images', 'img', 'รูปภาพ']);
  const imageUrl = Array.isArray(rawImg) ? rawImg[0] : (rawImg || '/logo.png');
  
  const sku = getVal(item, ['sku', 'code', 'รหัสสินค้า']) || `SKU-ERR-${index}`;

  const isUpdating = updatingId === realId;
  const originalQty = item.qty || item.quantity || 1;

  // ⚡️ Local State สำหรับ Optimistic UI และ Debounce
  const [localQty, setLocalQty] = useState(originalQty);
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

  const handleQtyChange = (change) => {
    const newQty = localQty + change;
    if (newQty < 0) return;
    
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

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-4 relative overflow-hidden transition-all duration-300 hover:shadow-md ${isUpdating && localQty === originalQty ? 'opacity-70 pointer-events-none scale-[0.99]' : ''}`}>
      
      <div className="w-full sm:w-28 h-28 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-2 border border-gray-100 relative group">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
          onError={(e) => e.target.src='/logo.png'}
        />
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-4">
            <h3 className="text-sm md:text-base font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
              {name}
            </h3>
            <button 
              onClick={() => onRemoveItem(realId)}
              disabled={isUpdating}
              className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors shrink-0 disabled:opacity-50 active:scale-90"
              title="ลบสินค้า"
            >
              {isUpdating && localQty === originalQty ? <Loader2 size={18} className="animate-spin text-red-400" /> : <Trash2 size={18} />}
            </button>
          </div>
          <p className="text-[10px] md:text-xs text-gray-500 mt-1 font-medium font-tech uppercase tracking-wide">SKU: {sku}</p>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div className="font-black text-lg text-emerald-600 font-tech">
            ฿{price.toLocaleString()}
          </div>

          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-colors hover:border-emerald-300">
            <button 
              onClick={() => handleQtyChange(-1)}
              disabled={isUpdating && localQty === originalQty}
              className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50 active:bg-emerald-100"
            >
              <Minus size={14} strokeWidth={2.5} />
            </button>
            <div className="w-10 text-center text-sm font-bold text-gray-800 relative font-tech">
              {isUpdating && localQty === originalQty ? (
                <Loader2 size={14} className="animate-spin mx-auto text-emerald-600" />
              ) : (
                <span className="animate-fade-in inline-block">{localQty}</span>
              )}
            </div>
            <button 
              onClick={() => handleQtyChange(1)}
              disabled={isUpdating && localQty === originalQty}
              className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50 active:bg-emerald-100"
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;
