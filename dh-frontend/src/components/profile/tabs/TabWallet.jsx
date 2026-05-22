import React, { useState, useEffect } from 'react';
import { Wallet, History, TrendingUp, TrendingDown, Clock, ShieldCheck, Award, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { getAuth } from 'firebase/auth';

// 🚀 นำเข้าฟังก์ชันดั้งเดิม (ห้ามลบ)
import { getCreditHistory, formatCredit } from '../../../firebase/creditService';
// 🚀 [NEW] นำเข้า Service ใหม่สำหรับ Ecosystem กระเป๋าเงิน
import { useWalletBalance, claimPendingCredit } from '../../../firebase/walletService';

const TabWallet = ({ userProfile }) => {
  const auth = getAuth();
  const user = auth.currentUser;

  // ⚡ ใช้ Custom Hook จากไฟล์ใหม่
  const { balance, tier, totalAccumulated, pendingCredits, loading: walletLoading } = useWalletBalance(user?.uid);
  
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // State สำหรับจัดการ Effect การกด Claim Credit
  const [claimingIds, setClaimingIds] = useState([]);
  const [successIds, setSuccessIds] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.uid) return;
      setLoadingHistory(true);
      try {
        const logs = await getCreditHistory(user.uid);
        setHistoryLogs(logs);
      } catch (error) {
        console.error("🔥 Error loading history:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [user?.uid]);

  // ==========================================
  // ⚙️ Gimmick & Logic: ระบบ Claim และนับเวลา 11 วัน (Zero Reads)
  // ==========================================

  const handleClaimCredit = async (creditId) => {
    if (claimingIds.includes(creditId)) return;
    
    setClaimingIds(prev => [...prev, creditId]);
    
    try {
      // 🚀 เรียกใช้ API จริงจาก walletService ตัวใหม่
      await claimPendingCredit(user.uid, creditId);
      
      setSuccessIds(prev => [...prev, creditId]);
      
      // เคลียร์ Effect สำเร็จหลังจากโชว์ไปแล้ว 3 วินาที
      setTimeout(() => {
        setSuccessIds(prev => prev.filter(id => id !== creditId));
      }, 3000);

    } catch (error) {
      console.error("Failed to claim credit:", error);
    } finally {
      setClaimingIds(prev => prev.filter(id => id !== creditId));
    }
  };

  // ฟังก์ชันคำนวณวันคงเหลือ (คำนวณสดบน UI ไม่ต้อง Query)
  const getDaysLeft = (matureDate) => {
    if (!matureDate) return 0;
    const now = new Date();
    const target = matureDate.toDate ? matureDate.toDate() : new Date(matureDate);
    const diffTime = Math.max(0, target - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* 💳 Section 1: Premium Digital Cards (สรุปยอด) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card: ยอดเงินในกระเป๋า (Wallet) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-700/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-slate-300" />
                <span className="text-sm font-medium text-slate-300">กระเป๋าเงิน (E-Wallet)</span>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-2">
              <span className="text-3xl md:text-4xl font-black tracking-tight font-mono">
                ฿{walletLoading ? '...' : formatCredit(userProfile?.walletBalance || 0)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">ยอดเงินสดที่สามารถใช้ชำระค่าสินค้าได้ทันที</p>
          </div>
        </div>

        {/* Card: DH Credit Point */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0870B8] to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-900/20 border border-blue-600/50">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-200" />
                <span className="text-sm font-medium text-blue-200">เครดิตส่วนลด (DH Point)</span>
              </div>
              <span className="px-2.5 py-1 bg-white/20 rounded-lg text-[10px] font-bold tracking-wider uppercase border border-white/10">
                {tier || 'MEMBER'}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-3xl md:text-4xl font-black tracking-tight font-mono flex items-baseline gap-2">
                {walletLoading ? '...' : formatCredit(balance || userProfile?.creditPoint || 0)}
                <span className="text-sm font-medium text-blue-200 uppercase tracking-widest">PTS</span>
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-2">สะสมรวม: {formatCredit(totalAccumulated || 0)} PTS</p>
          </div>
        </div>
      </div>

      {/* ⏳ Section 2: Pending Credits & 11-Day Lifecycle */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
        <div className="p-5 border-b border-amber-50 bg-gradient-to-r from-amber-50 to-white flex justify-between items-center">
          <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            เครดิตรอการอนุมัติ
          </h3>
          <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
            กฎ 11 วันทำการ
          </span>
        </div>
        <div className="p-5">
          {/* กรณีไม่มีรายการรออนุมัติ */}
          {(!pendingCredits || pendingCredits.length === 0) && (
             <div className="text-center py-8">
               <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                 <Sparkles className="w-6 h-6 text-slate-300" />
               </div>
               <p className="text-sm text-slate-500 font-medium">ยังไม่มีเครดิตรอการอนุมัติในขณะนี้</p>
               <p className="text-xs text-slate-400 mt-1">ซื้อสินค้าเพื่อรับเครดิตเงินคืนสุดคุ้ม</p>
             </div>
          )}

          {/* มีรายการรออนุมัติ */}
          {pendingCredits && pendingCredits.length > 0 && (
            <div className="space-y-3">
              {pendingCredits.map((credit, idx) => {
                const isClaiming = claimingIds.includes(credit.id || idx);
                const isSuccess = successIds.includes(credit.id || idx);
                const status = credit.status || 'action_required'; 
                const daysLeft = getDaysLeft(credit.matureDate);

                return (
                  <div key={credit.id || idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-100 hover:shadow-md transition-all gap-4">
                    
                    <div className="flex gap-3 items-start">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${status === 'maturing' || isSuccess ? 'bg-blue-50 text-[#0870B8]' : 'bg-amber-50 text-amber-500'}`}>
                        {status === 'maturing' || isSuccess ? <Clock className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          รับเครดิตคืน +{formatCredit(credit.amount || 0)} PTS
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">จากออเดอร์: <span className="font-mono">{credit.sourceRef || 'DH-ORD-XXX'}</span></p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto">
                      {/* State 1: รอให้ลูกค้ากดยืนยัน */}
                      {status === 'action_required' && !isSuccess && (
                        <button 
                          onClick={() => handleClaimCredit(credit.id || idx)}
                          disabled={isClaiming}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-70"
                        >
                          {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'กดยืนยันรับเครดิต'}
                        </button>
                      )}

                      {/* State 2: กดแล้วขึ้น Success Effect ทันที */}
                      {isSuccess && (
                         <div className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-lg border border-emerald-200 animate-fade-in">
                           <CheckCircle2 className="w-4 h-4" /> เริ่มนับเวลาแล้ว
                         </div>
                      )}

                      {/* State 3: กดไปแล้ว รอ 11 วัน (Progress Bar) */}
                      {status === 'maturing' && !isSuccess && (
                        <div className="w-full sm:w-48 bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                            <span>กำลังดำเนินการ</span>
                            <span className="text-[#0870B8]">เหลือ {daysLeft} วัน</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-[#0870B8] h-1.5 rounded-full transition-all duration-1000" 
                              style={{ width: `${Math.max(0, Math.min(100, ((11 - daysLeft) / 11) * 100))}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 📜 Section 3: Transaction History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            ประวัติการทำรายการ
          </h3>
        </div>
        
        <div className="p-0">
          {loadingHistory ? (
            <div className="flex flex-col justify-center items-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
              <p className="text-sm font-medium">กำลังโหลดประวัติ...</p>
            </div>
          ) : historyLogs.length === 0 ? (
             <div className="text-center py-12">
               <History className="w-10 h-10 text-slate-200 mx-auto mb-3" />
               <p className="text-sm text-slate-500 font-medium">ยังไม่มีประวัติการทำรายการ</p>
             </div>
          ) : (
             <div className="divide-y divide-slate-100">
               {historyLogs.map((log, index) => {
                 const isEarn = log.type === 'earn' || log.amount > 0 || log.points > 0;
                 
                 return (
                   <div key={log.id || index} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors group">
                     <div className="flex items-start gap-3">
                       <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isEarn ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                         {isEarn ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                       </div>
                       <div>
                         <p className="text-sm font-bold text-slate-800 group-hover:text-[#0870B8] transition-colors">
                           {log.description || (isEarn ? 'ได้รับเครดิต / คืนเงิน' : 'ใช้เครดิตเป็นส่วนลด')}
                         </p>
                         <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] text-slate-500 font-medium">
                             {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('th-TH') : 
                              (log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString('th-TH') : '-')}
                           </span>
                           {log.referenceId && (
                             <>
                               <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                               <span className="text-[10px] text-slate-400 font-mono tracking-wider truncate max-w-[120px]">
                                 Ref: {log.referenceId}
                               </span>
                             </>
                           )}
                         </div>
                       </div>
                     </div>
                     <div className="text-right shrink-0">
                       <p className={`text-base font-black font-mono ${isEarn ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {isEarn ? '+' : '-'}{formatCredit(Math.abs(log.amount || log.points || 0))}
                       </p>
                       <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                         ยอดคงเหลือ: {formatCredit(log.balanceAfter || 0)}
                       </p>
                     </div>
                   </div>
                 );
               })}
             </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default TabWallet;