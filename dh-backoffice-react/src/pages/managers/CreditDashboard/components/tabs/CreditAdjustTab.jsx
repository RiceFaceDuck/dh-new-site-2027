import { useState, useEffect } from 'react';
import { Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { auth } from '../../../../../firebase/config';
import { creditCoreService } from '../../../../../firebase/creditCoreService';

export default function CreditAdjustTab({ onSubmitTransaction, isSubmitting = false }) {
  const [partnerId, setPartnerId] = useState('');
  const [amount, setAmount] = useState('');
  const [actionType, setActionType] = useState('add'); 
  const [remark, setRemark] = useState('');
  const [resolvedUser, setResolvedUser] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState(null);

  // ⚡ Smart UID / Account Verification with Debounce
  useEffect(() => {
    const q = partnerId.trim();
    if (!q || q.length < 3) {
      setResolvedUser(null);
      setIsResolving(false);
      setResolveError(null);
      return;
    }

    setIsResolving(true);
    setResolveError(null);

    const timer = setTimeout(async () => {
      try {
        const info = await creditCoreService.resolveSmartUserInfo(q);
        if (info) {
          setResolvedUser(info);
          setResolveError(null);
        } else {
          setResolvedUser(null);
          setResolveError('ไม่พบบัญชีผู้ใช้งานในระบบ');
        }
      } catch (err) {
        console.error('Account verification error:', err);
        setResolveError('ตรวจสอบบัญชีไม่สำเร็จ');
      } finally {
        setIsResolving(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [partnerId]);

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setAmount(val);
  };

  const addQuickAmount = (val) => {
    const current = parseInt(amount || '0', 10);
    setAmount((current + val).toString());
  };

  const numAmount = parseInt(amount || '0', 10);
  const isFormValid = partnerId.trim() !== '' && numAmount > 0 && remark.trim() !== '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    
    const actorUid = auth.currentUser?.uid || 'Admin';
    const dbType = actionType === 'add' ? 'deposit' : 'deduct';
    const targetUid = resolvedUser?.uid || partnerId;
    
    onSubmitTransaction && onSubmitTransaction(
      async () => {
        const res = await creditCoreService.adjustUserCredit(targetUid, numAmount, dbType, remark, actorUid);
        if (resolvedUser?.uid) {
          const updated = await creditCoreService.resolveSmartUserInfo(resolvedUser.uid);
          if (updated) setResolvedUser(updated);
        }
        return res;
      },
      `ทำรายการ ${actionType === 'add' ? 'เพิ่ม' : 'หัก'}เครดิต ${numAmount.toLocaleString('th-TH')} แต้ม (Pts) สำเร็จ`
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      
      {/* แบบฟอร์ม ฝั่งซ้าย: ทรงเหลี่ยม ชิด ขอบบาง */}
      <div className="md:col-span-7">
        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Transaction Entry</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Target Account ID (รหัส/เบอร์โทร/อีเมล)
              </label>
              {isResolving && (
                <span className="text-[11px] text-indigo-600 flex items-center gap-1 font-medium">
                  <Loader2 size={12} className="animate-spin" /> กำลังตรวจสอบ...
                </span>
              )}
            </div>
            <input 
              type="text" 
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              placeholder="กรอก Account ID (เช่น 7U9S9EHF), เบอร์โทร หรือ อีเมล"
              className={`w-full px-3 py-2 bg-white border rounded-xs text-sm outline-hidden transition-colors ${
                resolvedUser 
                  ? 'border-emerald-500 ring-1 ring-emerald-500' 
                  : resolveError 
                  ? 'border-rose-400 ring-1 ring-rose-400' 
                  : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              }`}
              required
            />
            {resolvedUser && (
              <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-medium truncate">
                  <UserCheck size={14} className="text-emerald-600 shrink-0" />
                  <span className="truncate">{resolvedUser.displayName}</span>
                  <span className="text-[10px] font-mono bg-emerald-200/70 text-emerald-900 px-1.5 py-0.5 rounded uppercase">
                    ID: {resolvedUser.accountId}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 shrink-0 ml-2">
                  {resolvedUser.creditPoints.toLocaleString('th-TH')} Pts
                </span>
              </div>
            )}
            {resolveError && partnerId.trim().length >= 3 && !isResolving && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle size={12} /> {resolveError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Operation Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActionType('add')}
                className={`flex-1 py-2 text-sm font-semibold border rounded-xs ${
                  actionType === 'add' 
                    ? 'bg-blue-50 border-blue-600 text-blue-700' 
                    : 'bg-white border-slate-300 text-slate-600'
                }`}
              >
                Add Credit
              </button>
              <button
                type="button"
                onClick={() => setActionType('deduct')}
                className={`flex-1 py-2 text-sm font-semibold border rounded-xs ${
                  actionType === 'deduct' 
                    ? 'bg-red-50 border-red-600 text-red-700' 
                    : 'bg-white border-slate-300 text-slate-600'
                }`}
              >
                Deduct Credit
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (THB)</label>
            <input 
              type="text" 
              value={amount ? parseInt(amount, 10).toLocaleString('th-TH') : ''}
              onChange={handleAmountChange}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xs text-lg font-bold text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
              required
            />
            <div className="flex gap-2 mt-2">
              {[1000, 5000, 10000].map(val => (
                <button 
                  key={val} 
                  type="button" 
                  onClick={() => addQuickAmount(val)} 
                  className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-xs hover:bg-slate-200"
                >
                  +{val.toLocaleString('th-TH')}
                </button>
              ))}
              <button 
                type="button" 
                onClick={() => setAmount('')} 
                className="px-2 py-1 text-slate-500 text-xs ml-auto hover:text-slate-800"
              >
                Clear
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remark</label>
            <textarea 
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xs text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden h-16 resize-none"
              required
            />
          </div>

        </form>
      </div>

      {/* สรุปรายการ ฝั่งขวา (Preview Panel) */}
      <div className="md:col-span-5">
        <div className="bg-slate-50 border border-slate-300 rounded-xs p-4 h-full flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Preview</h3>
          
          <div className="space-y-3 text-sm flex-1">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Account:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={resolvedUser?.displayName || partnerId}>
                {resolvedUser ? `${resolvedUser.displayName} (${resolvedUser.accountId})` : (partnerId || '-')}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Current Balance:</span>
              <span className="font-mono text-slate-800 font-semibold">
                {resolvedUser ? `${resolvedUser.creditPoints.toLocaleString('th-TH')} Pts` : '--'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Operation:</span>
              <span className={`font-mono font-bold ${actionType === 'add' ? 'text-blue-600' : 'text-red-600'}`}>
                {actionType === 'add' ? '+' : '-'} {numAmount.toLocaleString('th-TH')}
              </span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-2.5 mt-4 rounded-xs font-bold text-sm transition-none
              ${!isFormValid || isSubmitting
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
              }`}
          >
            {isSubmitting ? 'Processing...' : 'Confirm Transaction'}
          </button>
        </div>
      </div>

    </div>
  );
}