import React, { useState } from 'react';
import { 
  Search, PlusCircle, MinusCircle, Save, 
  User, ShieldCheck, AlertCircle, Loader2, ArrowRight 
} from 'lucide-react';

export default function CreditAdjustTab({ onSubmitTransaction, isSubmitting = false }) {
  const [partnerId, setPartnerId] = useState('');
  const [amount, setAmount] = useState('');
  const [actionType, setActionType] = useState('add'); // 'add' | 'deduct'
  const [remark, setRemark] = useState('');

  // ฟังก์ชันจัดฟอร์แมตตัวเลขเวลาพิมพ์
  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setAmount(val);
  };

  // ปุ่ม Quick Add
  const addQuickAmount = (val) => {
    const current = parseInt(amount || '0', 10);
    setAmount((current + val).toString());
  };

  const isFormValid = partnerId.trim() !== '' && parseInt(amount || '0', 10) > 0 && remark.trim() !== '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    if (onSubmitTransaction) {
      onSubmitTransaction({
        partnerId,
        amount: parseInt(amount, 10),
        actionType,
        remark
      });
    }
  };

  // Mock ยอดเดิมสำหรับทำ Preview (ในการใช้งานจริงต้องดึงจาก Database)
  const mockCurrentBalance = 15000;
  const numAmount = parseInt(amount || '0', 10);
  const projectedBalance = actionType === 'add' ? mockCurrentBalance + numAmount : mockCurrentBalance - numAmount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* ฝั่งซ้าย: ฟอร์มกรอกข้อมูล (Operation Form) */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-600" />
            Credit Operations Manager
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            ทำรายการเติมหรือลดเครดิต ทุกรายการจะถูกบันทึกลง Audit Trail โดยอัตโนมัติ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          
          {/* 1. ค้นหา/ระบุพาร์ทเนอร์ */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              ระบุรหัสพาร์ทเนอร์ (Partner ID / Phone) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                placeholder="ค้นหาด้วยรหัส หรือเบอร์โทรศัพท์..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* 2. เลือกประเภทรายการ (Add / Deduct) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              ประเภทการทำรายการ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActionType('add')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all
                  ${actionType === 'add' 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}
              >
                <PlusCircle size={18} className={actionType === 'add' ? 'text-emerald-600' : ''} />
                เติมเครดิต (Add)
              </button>
              
              <button
                type="button"
                onClick={() => setActionType('deduct')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all
                  ${actionType === 'deduct' 
                    ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm' 
                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}
              >
                <MinusCircle size={18} className={actionType === 'deduct' ? 'text-rose-600' : ''} />
                หักเครดิต (Deduct)
              </button>
            </div>
          </div>

          {/* 3. จำนวนเงิน */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              จำนวนเงิน (บาท) <span className="text-rose-500">*</span>
            </label>
            <div className="relative mb-3">
              <input 
                type="text" 
                value={amount ? parseInt(amount, 10).toLocaleString('th-TH') : ''}
                onChange={handleAmountChange}
                placeholder="0" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-right"
                required
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-bold">฿</span>
              </div>
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              {[500, 1000, 5000, 10000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => addQuickAmount(val)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors"
                >
                  +{val.toLocaleString('th-TH')}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount('')}
                className="px-3 py-1.5 text-slate-400 hover:text-rose-500 text-xs font-medium rounded-lg transition-colors ml-auto"
              >
                ล้างข้อมูล
              </button>
            </div>
          </div>

          {/* 4. หมายเหตุ (บังคับ) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              หมายเหตุ / Reference <span className="text-rose-500">*</span>
            </label>
            <textarea 
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="เช่น: โอนเงินผ่านบัญชี KBank เวลา 14:30 น., แก้ไขยอดผิดพลาดบิล #INV001" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none h-24"
              required
            />
          </div>

        </form>
      </div>

      {/* ฝั่งขวา: สรุปรายการ (Live Preview) */}
      <div className="space-y-6">
        
        {/* Transaction Summary Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-800/80 flex items-center gap-2">
            <AlertCircle size={16} className="text-blue-400" />
            <h3 className="font-bold text-white text-sm">Transaction Preview</h3>
          </div>
          
          <div className="p-5 flex-1 flex flex-col justify-center space-y-6">
            
            {/* User Info (Mock) */}
            <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                <User size={18} />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-slate-400">Account target</p>
                <p className="text-sm font-bold text-white truncate">
                  {partnerId || 'รอระบุพาร์ทเนอร์...'}
                </p>
              </div>
            </div>

            {/* Balance Projection */}
            <div className="relative">
              <div className="absolute left-[19px] top-8 bottom-8 w-px bg-slate-700 border-dashed border-l border-slate-600"></div>
              
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center z-10 shrink-0 text-slate-400">
                  <ArrowRight size={14} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-1">ยอดปัจจุบัน (Current)</p>
                  <p className="text-xl font-bold text-slate-300">
                    ฿{mockCurrentBalance.toLocaleString('th-TH')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.2)]
                  ${actionType === 'add' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-rose-500/10 border-rose-500 text-rose-400'}`}
                >
                  {actionType === 'add' ? <PlusCircle size={16} /> : <MinusCircle size={16} />}
                </div>
                <div>
                  <p className={`text-xs font-bold mb-1 ${actionType === 'add' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ยอดหลังทำรายการ (Projected)
                  </p>
                  <p className={`text-3xl font-black tracking-tight ${actionType === 'add' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ฿{projectedBalance.toLocaleString('th-TH')}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {actionType === 'add' ? '+' : '-'} ฿{numAmount.toLocaleString('th-TH')}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Action Button */}
          <div className="p-4 bg-slate-800/50 border-t border-slate-700/50">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg
                ${!isFormValid || isSubmitting
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed shadow-none' 
                  : actionType === 'add'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white hover:shadow-emerald-500/25'
                    : 'bg-rose-500 hover:bg-rose-400 text-white hover:shadow-rose-500/25'
                }`}
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSubmitting 
                ? 'กำลังประมวลผล...' 
                : !isFormValid
                  ? 'กรอกข้อมูลให้ครบถ้วน'
                  : actionType === 'add'
                    ? 'ยืนยันการเติมเครดิต'
                    : 'ยืนยันการหักเครดิต'
              }
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}