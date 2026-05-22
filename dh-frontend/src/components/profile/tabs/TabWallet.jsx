import React, { useState, useEffect } from 'react';
import { 
  Wallet, History, TrendingUp, TrendingDown, Clock, ShieldCheck, 
  Loader2, CheckCircle2, AlertCircle, Building, User, CreditCard, X, ArrowRightLeft
} from 'lucide-react';
import { getAuth } from 'firebase/auth';

import { getCreditHistory, formatCredit } from '../../../firebase/creditService';
import { useWalletBalance, requestWalletWithdrawal, getWalletHistory } from '../../../firebase/walletService';

export default function TabWallet() {
  const auth = getAuth();
  const user = auth.currentUser;

  // ⚡ ดึงข้อมูลกระเป๋าเงินแบบ Real-time
  const { walletBalance, pendingWithdrawal, loading: walletLoading } = useWalletBalance(user?.uid);
  
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // 🏦 States สำหรับ Modal ถอนเงิน
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankInfo, setBankInfo] = useState({ bankName: '', accountName: '', accountNumber: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      if (!user?.uid) return;
      setLoadingHistory(true);
      try {
        // 🚀 ดึงข้อมูลจากโครงสร้าง Pagination แบบใหม่
        const creditData = await getCreditHistory(user.uid);
        const creditLogs = Array.isArray(creditData) ? creditData : (creditData?.logs || []);

        const walletData = await getWalletHistory(user.uid);
        const walletLogs = Array.isArray(walletData) ? walletData : (walletData?.logs || []);

        if (isMounted) {
          // รวมประวัติทั้ง Credit และ Wallet เข้าด้วยกัน แล้วเรียงตามเวลาจากใหม่ไปเก่า
          const combinedLogs = [...creditLogs, ...walletLogs].sort((a, b) => {
            const timeA = a.timestamp?.toMillis() || a.createdAt?.toMillis() || 0;
            const timeB = b.timestamp?.toMillis() || b.createdAt?.toMillis() || 0;
            return timeB - timeA;
          });
          setHistoryLogs(combinedLogs);
        }
      } catch (error) {
        console.error("❌ Error fetching history:", error);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };
    
    fetchHistory();
    return () => { isMounted = false; };
  }, [user]);

  // 🚀 ฟังก์ชันส่งคำร้องขอถอนเงิน
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
      // 🔗 เรียกใช้ Service ถอนเงินแบบ Atomic (ส่งเข้า To-do ฝั่ง Backoffice อัตโนมัติ)
      await requestWalletWithdrawal(user.uid, amount, bankInfo);
      
      setStatus({ type: 'success', message: 'ส่งคำร้องถอนเงินสำเร็จ ระบบจะโอนเงินภายใน 24 ชม.' });
      
      // หน่วงเวลาปิด Modal 3 วินาที
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

  if (walletLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative">
          <Wallet className="w-10 h-10 text-indigo-100 absolute" />
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin relative" />
        </div>
        <p className="text-sm font-bold text-slate-500 mt-4">กำลังเชื่อมต่อกระเป๋าเงินระบบ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 💳 Section 1: Wallet Card (Deep Luxury Theme) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        {/* Abstract Background Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-300">
              <Wallet className="w-5 h-5" />
              <span className="font-medium tracking-wide">DH Wallet Balance</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-mono tracking-tight">฿ {formatCredit(walletBalance)}</span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> ยอดเงินค้างในระบบ ปลอดภัย 100%
            </p>
          </div>

          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
            {pendingWithdrawal > 0 && (
              <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 animate-in fade-in">
                <Clock className="w-4 h-4 text-amber-300" />
                <div className="text-right">
                  <p className="text-[10px] text-slate-300 uppercase tracking-wider">กำลังรอตรวจสอบและโอนคืน</p>
                  <p className="font-mono font-bold text-amber-300">฿ {formatCredit(pendingWithdrawal)}</p>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setIsWithdrawModalOpen(true)}
              disabled={walletBalance <= 0}
              className="w-full md:w-auto px-6 py-3 bg-white text-slate-900 hover:bg-slate-50 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" /> ถอนเงินเข้าบัญชีธนาคาร
            </button>
          </div>
        </div>
      </div>

      {/* 📜 Section 2: Transaction History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
          <History className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800">ประวัติการทำรายการล่าสุด (Recent Transactions)</h3>
        </div>

        <div className="p-0">
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mb-3 text-indigo-500" />
              <span className="text-sm font-medium">กำลังโหลดประวัติ...</span>
            </div>
          ) : historyLogs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <History className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-500 font-bold text-sm">ยังไม่มีประวัติการทำรายการ</p>
              <p className="text-slate-400 text-xs mt-1">รายการได้เครดิตและการถอนเงินจะแสดงที่นี่</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {historyLogs.map((log, index) => {
                // เช็คประเภทรายการว่าเป็นรายรับหรือรายจ่าย
                const isEarn = log.type === 'deposit' || log.type === 'earn' || log.type === 'WITHDRAWAL_REJECTED';
                const isWithdraw = log.type === 'WITHDRAWAL_REQUEST' || log.type === 'WITHDRAWAL_COMPLETED' || log.type === 'spend';
                const amount = Number(log.amount || log.points || 0);
                
                return (
                  <div key={log.id || index} className="p-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between group">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isWithdraw ? 'bg-amber-100 text-amber-600' : isEarn ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {isWithdraw ? <Clock className="w-5 h-5" /> : isEarn ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{log.note || log.action || log.type}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 font-medium">
                            {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('th-TH') : 
                             (log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString('th-TH') : '-')}
                          </span>
                          {(log.referenceId || log.transactionId) && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span className="text-[10px] text-slate-400 font-mono tracking-wider truncate max-w-[120px]" title={log.transactionId || log.referenceId}>
                                {log.transactionId || log.referenceId}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-base font-black font-mono ${isWithdraw ? 'text-amber-600' : isEarn ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isWithdraw ? '-' : (isEarn ? '+' : '-')}฿ {formatCredit(amount)}
                      </p>
                      {log.status && (
                        <p className={`text-[10px] font-bold mt-0.5 uppercase tracking-wider ${
                          log.status === 'SUCCESS' ? 'text-emerald-500' : log.status === 'PENDING' ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                          {log.status === 'SUCCESS' ? 'สำเร็จ' : log.status === 'PENDING' ? 'รอดำเนินการ' : log.status}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 🏦 Withdraw Modal */}
      {isWithdrawModalOpen && (
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

              {/* Status Display */}
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
      )}

    </div>
  );
}