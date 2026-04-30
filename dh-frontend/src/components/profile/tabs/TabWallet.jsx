/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Coins, Star, History, Zap, Loader2, Trophy, TrendingUp, ArrowUpRight, ArrowDownRight, Crown } from 'lucide-react';
import { getAuth } from 'firebase/auth';
// 🚀 เรียกใช้ Credit Service ที่เราสร้างไว้
import { subscribeToWallet, getCreditHistory, getUserTier, formatCredit } from '../../../firebase/creditService';

const TabWallet = () => {
  const [activeTab, setActiveTab] = useState('history'); 
  
  // State ข้อมูลจาก Firebase
  const [walletData, setWalletData] = useState({ balance: 0, totalAccumulated: 0, tier: getUserTier(0) });
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    // 1. 📡 สมัครรับข้อมูล Wallet แบบ Real-time
    const unsubscribe = subscribeToWallet(user.uid, (data) => {
      setWalletData(data);
    });

    // 2. 📡 ดึงประวัติผ่าน Smart Cache
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const history = await getCreditHistory(user.uid);
        setHistoryList(history || []);
      } catch (error) {
        console.error("Error loading credit history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();

    // เคลียร์ Listener ป้องกัน Memory Leak
    return () => unsubscribe();
  }, []);

  // 🧮 ฟังก์ชันคำนวณหลอดพลัง VIP 
  const calculateProgress = (points) => {
    if (points >= 10000) return { percent: 100, next: 'MAX', needed: 0 }; // Platinum
    if (points >= 5000) return { percent: (points/10000)*100, next: 'Platinum', needed: 10000 - points }; // Gold
    if (points >= 1000) return { percent: (points/5000)*100, next: 'Gold', needed: 5000 - points }; // Silver
    return { percent: (points/1000)*100, next: 'Silver', needed: 1000 - points }; // Member
  };

  const progress = calculateProgress(walletData.balance);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ==========================================
          🌟 ส่วนที่ 1: บัตร VIP กระเป๋าเงิน (Glassmorphism Card)
          ========================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-black p-6 sm:p-8 shadow-xl border border-slate-700">
        
        {/* เอฟเฟกต์แสงออโรร่า */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0870B8] rounded-full blur-[100px] opacity-30 -translate-y-20 translate-x-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500 rounded-full blur-[80px] opacity-10 translate-y-10 -translate-x-10 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          {/* ข้อมูลยอดเงินและระดับ */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md ${walletData.tier.bg} ${walletData.tier.color} border border-white/20 shadow-sm`}>
                <span className="text-sm">{walletData.tier.icon}</span> {walletData.tier.name} TIER
              </span>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                <Crown size={12} className="text-amber-400" /> DH Privileges
              </span>
            </div>
            
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md font-tech">
                {formatCredit(walletData.balance)}
              </h2>
              <span className="text-slate-400 font-bold uppercase tracking-widest">Points</span>
            </div>
          </div>

          {/* ปุ่ม Action */}
          <div className="w-full md:w-auto flex flex-col gap-3">
            <button 
               onClick={() => alert("แต้มสะสมจะได้จากการสั่งซื้อสินค้า และการเข้าร่วมกิจกรรมของพาร์ทเนอร์ครับ")}
               className="w-full md:w-auto px-6 py-3 bg-[#0870B8] hover:bg-[#0A85DA] text-white text-sm font-bold rounded-xl shadow-[0_4px_14px_rgba(8,112,184,0.4)] hover:shadow-[0_6px_20px_rgba(8,112,184,0.6)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <Zap size={16} /> วิธีรับคะแนนเพิ่ม
            </button>
          </div>
        </div>

        {/* 🚀 หลอดพลังเลื่อนขั้น (VIP Progress Bar) */}
        {progress.next !== 'MAX' ? (
          <div className="mt-8 relative z-10 bg-slate-800/60 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 shadow-inner">
            <div className="flex justify-between items-end mb-2.5">
              <span className="text-xs text-slate-400 font-medium">สะสมคะแนนเพื่ออัปเกรดระดับ</span>
              <span className="text-[10px] sm:text-xs font-bold text-white flex items-center gap-1.5">
                <Trophy size={14} className="text-amber-400" /> ขาดอีก <span className="text-amber-400 font-tech">{formatCredit(progress.needed)} Pts</span> สู่ระดับ {progress.next}
              </span>
            </div>
            <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700/50 shadow-inner relative">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#0870B8] via-cyan-400 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress.percent}%` }}
              >
                {/* แอนิเมชันแสงวิ่งในหลอด */}
                <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite] -skew-x-12"></div>
              </div>
            </div>
          </div>
        ) : (
           <div className="mt-8 relative z-10 bg-gradient-to-r from-amber-500/20 to-amber-600/20 backdrop-blur-md rounded-2xl p-4 border border-amber-500/30 flex items-center gap-3">
             <Trophy className="text-amber-400 w-8 h-8" />
             <div>
               <h4 className="text-white font-bold text-sm">ยินดีด้วย! คุณอยู่ระดับสูงสุดแล้ว</h4>
               <p className="text-amber-200/80 text-xs mt-0.5">คุณได้รับสิทธิพิเศษสูงสุดของ DH System</p>
             </div>
           </div>
        )}
      </div>

      {/* ==========================================
          🌟 ส่วนที่ 2: ประวัติการใช้งาน (Smart Cache History)
          ========================================== */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="border-b border-slate-100 px-4 py-4 bg-slate-50 flex items-center gap-2">
          <History size={18} className="text-[#0870B8]" /> 
          <h3 className="font-bold text-slate-800">ประวัติ DH Credit Points</h3>
        </div>

        <div className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 size={32} className="animate-spin mb-3 text-[#0870B8]" />
              <p className="text-xs font-tech font-bold tracking-widest uppercase">Fetching Transactions...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50/30">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200">
                <Star size={28} className="text-slate-300" />
              </div>
              <h4 className="font-bold text-slate-700">ยังไม่มีประวัติเครดิต</h4>
              <p className="text-xs font-medium text-slate-500 mt-1 max-w-[200px] text-center">คุณจะได้รับคะแนนสะสมเมื่อสั่งซื้อสินค้าสำเร็จ</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {historyList.map((tx) => {
                const isEarn = tx.type === 'earn'; // ตรวจสอบว่าเป็นรายรับ หรือรายจ่าย
                
                // สกัดเวลาแบบสวยงาม
                const txDate = tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt || Date.now());
                const formattedDate = txDate.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
                const formattedTime = txDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={tx.id} className="p-4 sm:p-5 hover:bg-[#f8fbff] transition-colors flex items-center justify-between group">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                      
                      {/* ไอคอนแสดงสถานะ (เขียว = ได้รับ, แดง = ใช้ไป) */}
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border ${
                        isEarn ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {isEarn ? <TrendingUp size={20} className="sm:w-6 sm:h-6" /> : <TrendingUp size={20} className="rotate-180 sm:w-6 sm:h-6" />}
                      </div>
                      
                      {/* รายละเอียด */}
                      <div className="flex flex-col justify-center">
                        <h4 className="text-sm sm:text-base font-bold text-slate-800 group-hover:text-[#0870B8] transition-colors line-clamp-1">
                          {tx.note || (isEarn ? 'ได้รับคะแนนสะสม' : 'ใช้งานคะแนน')}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                          <span className="text-[10px] sm:text-xs text-slate-500 font-tech flex items-center">
                            {formattedDate} <span className="mx-1">•</span> {formattedTime}
                          </span>
                          {tx.referenceId && (
                            <span className="text-[9px] sm:text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider border border-slate-200">
                              REF: {tx.referenceId.substring(0,8)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* จำนวนแต้มที่ขึ้น/ลง */}
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className={`text-sm sm:text-lg font-black font-tech flex items-center justify-end gap-0.5 ${
                        isEarn ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {isEarn ? <ArrowUpRight size={14} className="sm:w-5 sm:h-5" /> : <ArrowDownRight size={14} className="sm:w-5 sm:h-5" />}
                        {isEarn ? '+' : '-'}{formatCredit(tx.points)}
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5">Pts</span>
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