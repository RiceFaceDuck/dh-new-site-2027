import React, { useState } from 'react';
import { X, Building, CreditCard, User, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { formatCredit } from '../../../../firebase/creditService';
import { requestWalletWithdrawal } from '../../../../firebase/walletService';

const WithdrawModal = ({ user, walletBalance, isWithdrawModalOpen, setIsWithdrawModalOpen }) => {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankInfo, setBankInfo] = useState({ bankName: '', accountName: '', accountNumber: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  if (!isWithdrawModalOpen) return null;

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    
    if (amount <= 0 || amount > walletBalance) {
      setStatus({ type: 'error', message: 'จำนวนเงินไม่ถูกต้อง หรือเกินยอดคงเหลือ' });
      return;
    }
    if (!bankInfo.bankName || !bankInfo.accountName || !bankInfo.accountNumber) {
      setStatus({ type: 'error', message: 'กรุณากรอกข้อมูลธนาคารให้ครบถ้วน' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      await requestWalletWithdrawal(user.uid, amount, bankInfo);
      setStatus({ type: 'success', message: 'ส่งคำร้องถอนเงินสำเร็จ ระบบจะโอนเงินภายใน 24 ชม.' });
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawAmount('');
        setBankInfo({ bankName: '', accountName: '', accountNumber: '' });
        setStatus({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'เกิดข้อผิดพลาดในการทำรายการ' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="p-6 bg-slate-900 text-white relative">
          <button 
            onClick={() => setIsWithdrawModalOpen(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/30">
            <Building className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold">แจ้งถอนเงินเข้าบัญชี</h2>
          <p className="text-sm text-slate-400 mt-1">จำนวนเงินจะถูกหักไว้เพื่อรอแอดมินตรวจสอบและโอนเงินเข้าบัญชีภายใน 24 ชั่วโมงทำการ</p>
        </div>

        <form onSubmit={handleWithdraw} className="p-6 space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">จำนวนเงินที่ต้องการถอน</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-bold group-focus-within:text-indigo-600 transition-colors">฿</span>
              </div>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={walletBalance}
                step="0.01"
                className="block w-full pl-10 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-mono font-bold text-lg"
                placeholder="0.00"
                required
              />
              <button 
                type="button"
                onClick={() => setWithdrawAmount(walletBalance)}
                className="absolute inset-y-0 right-2 flex items-center px-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                ถอนทั้งหมด
              </button>
            </div>
            <div className="flex justify-between items-center mt-2 px-1">
              <span className="text-xs text-slate-500 font-medium">ยอดเงินที่ถอนได้</span>
              <span className="text-xs font-bold text-slate-700 font-mono">฿ {formatCredit(walletBalance)}</span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ข้อมูลบัญชีธนาคาร</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={bankInfo.bankName}
                  onChange={(e) => setBankInfo(prev => ({...prev, bankName: e.target.value}))}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                  placeholder="ชื่อธนาคาร (เช่น กสิกรไทย)"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <CreditCard className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={bankInfo.accountNumber}
                onChange={(e) => setBankInfo(prev => ({...prev, accountNumber: e.target.value}))}
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-mono font-bold tracking-wider"
                placeholder="เลขที่บัญชี"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={bankInfo.accountName}
                onChange={(e) => setBankInfo(prev => ({...prev, accountName: e.target.value}))}
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                placeholder="ชื่อ-นามสกุล เจ้าของบัญชี"
                required
              />
            </div>
          </div>

          {status.message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-fade-in ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> กำลังประมวลผลคำขอ...</> : 'ยืนยันการถอนเงิน'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WithdrawModal;
