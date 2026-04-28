import React from 'react';

const PrivilegeSelector = ({
  availableCredit,
  availableWallet,
  appliedCredit,
  setAppliedCredit,
  appliedWallet,
  setAppliedWallet,
  maxDiscountAllowed
}) => {

  // ฟังก์ชันคำนวณยอดสูงสุดของแต้มที่สามารถใช้ได้
  const handleUseAllCredit = () => {
    // ห้ามใช้เกินยอดรวม (ลบด้วย wallet ที่ใช้ไปแล้ว)
    const maxUsable = Math.max(0, maxDiscountAllowed - appliedWallet);
    setAppliedCredit(Math.min(availableCredit, maxUsable));
  };

  // ฟังก์ชันคำนวณยอดสูงสุดของเงินในกระเป๋าที่สามารถใช้ได้
  const handleUseAllWallet = () => {
    // ห้ามใช้เกินยอดรวม (ลบด้วยแต้มที่ใช้ไปแล้ว)
    const maxUsable = Math.max(0, maxDiscountAllowed - appliedCredit);
    setAppliedWallet(Math.min(availableWallet, maxUsable));
  };

  // ถ้าไม่มีทั้งแต้มและเงินกระเป๋า ให้ซ่อน Component นี้ไปเลยเพื่อความสะอาดตา
  if (availableCredit === 0 && availableWallet === 0) {
    return null;
  }

  return (
    <div className="card-premium p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center">
        <span className="bg-[#D4AF37] text-white w-8 h-8 rounded-md flex items-center justify-center mr-3 shadow-[0_0_10px_rgba(212,175,55,0.4)]">
          ✨
        </span>
        สิทธิพิเศษของคุณ
      </h3>
      
      <div className="space-y-4">
        {/* ส่วนของ Credit Point */}
        {availableCredit > 0 && (
          <div className="card-premium-inner p-5 bg-white/50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                Credit Point: <span className="text-[#0870B8] font-black">{availableCredit.toLocaleString()}</span> PTS
              </span>
            </div>
            <div className="flex gap-2">
              <input 
                type="number" 
                min="0"
                max={availableCredit}
                placeholder="กรอกจำนวนแต้มที่ต้องการใช้"
                className="flex-1 border border-gray-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] font-medium transition-all"
                value={appliedCredit || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  const maxUsable = Math.max(0, maxDiscountAllowed - appliedWallet);
                  if (val <= availableCredit && val <= maxUsable) {
                    setAppliedCredit(val);
                  }
                }}
              />
              <button 
                type="button"
                onClick={handleUseAllCredit}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-md text-xs font-black uppercase hover:bg-[#E6F0F9] hover:text-[#0870B8] transition-colors"
              >
                ใช้ทั้งหมด
              </button>
            </div>
          </div>
        )}

        {/* ส่วนของ Wallet Balance */}
        {availableWallet > 0 && (
          <div className="card-premium-inner p-5 bg-white/50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                DH Wallet: <span className="text-emerald-600 font-black">฿{availableWallet.toLocaleString()}</span>
              </span>
            </div>
            <div className="flex gap-2">
              <input 
                type="number" 
                min="0"
                max={availableWallet}
                placeholder="กรอกจำนวนเงินใน Wallet ที่ต้องการใช้"
                className="flex-1 border border-gray-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium transition-all"
                value={appliedWallet || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  const maxUsable = Math.max(0, maxDiscountAllowed - appliedCredit);
                  if (val <= availableWallet && val <= maxUsable) {
                    setAppliedWallet(val);
                  }
                }}
              />
              <button 
                type="button"
                onClick={handleUseAllWallet}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-md text-xs font-black uppercase hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                ใช้ทั้งหมด
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivilegeSelector;