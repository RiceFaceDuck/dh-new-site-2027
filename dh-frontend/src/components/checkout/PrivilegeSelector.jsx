import React, { useState, useEffect } from 'react';
import { Coins, CheckCircle2, Sparkles, XCircle } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { subscribeToWallet, formatCredit } from '../../firebase/creditService';

/**
 * PrivilegeSelector - กล่องเลือกใช้สิทธิพิเศษ (DH Credit Points)
 * @param {number} orderTotal - ยอดรวมสั่งซื้อ (ใช้เพื่อคำนวณไม่ให้ใช้แต้มเกินยอด)
 * @param {function} onApplyPoints - Callback ส่งค่าแต้มที่เลือกใช้กลับไปหน้าหลัก
 */
const PrivilegeSelector = ({ orderTotal = 0, onApplyPoints }) => {
  // 🚀 [แก้ไขบั๊ก]: ย้าย State ทั้งหมดมารวมไว้ด้านบนสุด ป้องกัน ReferenceError
  const [walletBalance, setWalletBalance] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [appliedPoints, setAppliedPoints] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [isLoading, setIsLoading] = useState(true);
  const [walletData, setWalletData] = useState({ tier: { name: 'Member', color: 'text-slate-500' }});

  // 1. ดึงยอดแต้มคงเหลือแบบ Real-time
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      return;
    }

    const unsubscribe = subscribeToWallet(user.uid, (data) => {
      setWalletData(data);
      setWalletBalance(data.balance || 0);
      // setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. ฟังก์ชันตรวจสอบและจำกัดตัวเลข (Auto-Adjust)
  const handleInputChange = (e) => {
    // กรองให้เหลือแต่ตัวเลข
    const val = e.target.value.replace(/[^0-9]/g, '');
    let numVal = parseInt(val, 10);

    if (isNaN(numVal)) {
      setInputValue('');
      return;
    }

    // 🛑 ป้องกัน 1: ห้ามใช้เกินยอดคงเหลือที่มี
    if (numVal > walletBalance) {
      numVal = walletBalance;
    }
    // 🛑 ป้องกัน 2: ห้ามใช้เกินยอดสั่งซื้อสุทธิ (ไม่ให้ยอดติดลบ)
    if (numVal > orderTotal) {
      numVal = Math.floor(orderTotal);
    }

    setInputValue(numVal.toString());
  };

  // 3. ฟังก์ชันกดยืนยันการใช้แต้ม
  const handleApply = () => {
    const points = parseInt(inputValue, 10) || 0;
    setAppliedPoints(points);
    if (onApplyPoints) onApplyPoints(points);
  };

  // 4. ฟังก์ชันกดยกเลิกการใช้แต้ม
  const handleCancel = () => {
    setInputValue('');
    setAppliedPoints(0);
    if (onApplyPoints) onApplyPoints(0);
  };

  // 5. ปุ่มทางลัด "ใช้แต้มสูงสุด"
  const handleUseMax = () => {
    const maxUsable = Math.floor(Math.min(walletBalance, orderTotal));
    setInputValue(maxUsable.toString());
    setAppliedPoints(maxUsable);
    if (onApplyPoints) onApplyPoints(maxUsable);
  };

  if (isLoading) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
          <Coins size={18} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">ใช้ DH Credit เป็นส่วนลด</h3>
          <p className="text-[10px] text-slate-500 font-medium">1 Pts = 1 บาท • ระดับ: <span className={walletData.tier.color}>{walletData.tier.name}</span></p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-3">
        <div className="flex justify-between items-end">
          <span className="text-xs text-slate-500 font-medium">แต้มสะสมที่ใช้ได้</span>
          <span className="text-base font-black text-[#0870B8] font-tech">{formatCredit(walletBalance)} Pts</span>
        </div>

        {appliedPoints > 0 ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 size={16} />
              <span className="text-sm font-bold">ใช้ส่วนลด {formatCredit(appliedPoints)} บาท</span>
            </div>
            <button 
              onClick={handleCancel}
              className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <XCircle size={14} /> ยกเลิก
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="ระบุจำนวนแต้ม"
                disabled={walletBalance <= 0 || orderTotal <= 0}
                className="w-full px-4 py-2.5 text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0870B8] focus:ring-2 focus:ring-[#0870B8]/20 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
              />
              <button 
                onClick={handleUseMax}
                disabled={walletBalance <= 0 || orderTotal <= 0}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-[#E6F0F9] text-[#0870B8] px-2 py-1 rounded hover:bg-[#0870B8] hover:text-white transition-colors disabled:opacity-50"
              >
                ใช้สูงสุด
              </button>
            </div>
            <button
              onClick={handleApply}
              disabled={!inputValue || parseInt(inputValue) <= 0}
              className="px-5 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              <Sparkles size={14} /> ตกลง
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivilegeSelector;