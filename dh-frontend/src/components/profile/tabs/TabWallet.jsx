import React, { useState, useEffect } from 'react';
import { Coins, Star, History, Zap, Loader2, Trophy, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { subscribeToWallet, getCreditHistory, getUserTier, formatCredit } from '../../../firebase/creditService';

const TabWallet = () => {
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'rewards'
  
  // State จัดการข้อมูลผ่าน Smart Service
  const [walletData, setWalletData] = useState({ balance: 0, totalAccumulated: 0, tier: getUserTier(0) });
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    // 1. 📡 สมัครรับข้อมูล Wallet แบบ Real-time (ประหยัด Reads ใช้แค่ 1 ครั้งต่อ Session)
    const unsubscribe = subscribeToWallet(user.uid, (data) => {
      setWalletData(data);
    });

    // 2. 📡 ดึงประวัติการทำรายการผ่าน Smart Cache Service
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

    // คืนค่า Unsubscribe เมื่อปิดหน้าต่าง เพื่อป้องกัน Memory Leak
    return () => unsubscribe();
  }, []);

  // 🧮 คำนวณหลอดพลัง VIP Progress
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
          🌟 ส่วนที่ 1: บัตรกระเป๋าเงิน (Glassmorphism VIP Card)
          ========================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 shadow-xl border border-slate-700">
        {/* เอฟเฟกต์แสง */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0870B8] rounded-full blur-[100px] opacity-20 -translate-y-20 translate-x-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500 rounded-full blur-[80px] opacity-10 translate-y-10 -translate-x-10 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          {/* ข้อมูลยอดเงิน */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-md ${walletData.tier.bg} ${walletData.tier.color} border border-white/20`}>
                {walletData.tier.icon} {walletData.tier.name}
              </span>
              <span className="text-slate-400 text-sm font-medium flex items-center gap-1">
                <Coins size={14} /> DH Credit Points
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
                {formatCredit(walletData.balance)}
              </h2>
              <span className="text-slate-400 font-medium">Pts</span>
            </div>
          </div>

          {/* ปุ่ม Action */}
          <div className="w-full md:w-auto flex flex-row md:flex-col gap-3">
            <button className="flex-1 md:flex-none px-6 py-2.5 bg-[#0870B8] hover:bg-[#0A85DA] text-white font-bold rounded-xl shadow-lg hover:shadow-[#0870B8]/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
              <Zap size={16} /> วิธีการได้แต้ม
            </button>
          </div>
        </div>

        {/* 🚀 Gamification: หลอดพลังเลื่อนขั้น (Tier Progress Bar) */}
        {progress.next !== 'MAX' && (
          <div className="mt-8 relative z-10 bg-slate-900/50 backdrop-blur-md rounded-2xl p-4 border border-white/5">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs text-slate-400 font-medium">สะสมคะแนนเพื่อเลื่อนระดับ</span>
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <Trophy size={12} className="text-amber-400" /> ขาดอีก {formatCredit(progress.needed)} Pts สู่ <span className="text-amber-400">{progress.next}</span>
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              <div 
                className="h-full bg-gradient-to-r from-[#0870B8] to-cyan-400 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${progress.percent}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          🌟 ส่วนที่ 2: ประวัติการใช้งาน (Smart Cache History)
          ========================================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header Tabs */}
        <div className="border-b border-slate-100 px-2 flex">
          <button 
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'history' ? 'border-[#0870B8] text-[#0870B8]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} /> ประวัติ Credit Point
          </button>
        </div>

        {/* Content */}
        <div className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 size={32} className="animate-spin mb-3 text-[#0870B8]" />
              <p className="text-sm font-tech">LOADING TRANSACTIONS...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50/50">
              <Star size={40} className="mb-3 text-slate-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-slate-500">ยังไม่มีประวัติการรับหรือใช้งานคะแนน</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {historyList.map((tx) => {
                const isEarn = tx.type === 'earn';
                return (
                  <div key={tx.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      {/* ไอคอนแสดงสถานะ (เขียว = ได้รับ, แดง = ใช้ไป) */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                        isEarn ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {isEarn ? <TrendingUp size={20} /> : <TrendingUp size={20} className="rotate-180" />}
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#0870B8] transition-colors">{tx.note || (isEarn ? 'ได้รับคะแนนสะสม' : 'ใช้งานคะแนน')}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 font-tech">
                            {new Date(tx.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {tx.referenceId && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block">
                              REF: {tx.referenceId.substring(0,8)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* จำนวนแต้ม */}
                    <div className="text-right">
                      <div className={`text-base font-black flex items-center justify-end gap-1 ${
                        isEarn ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {isEarn ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {isEarn ? '+' : '-'}{formatCredit(tx.points)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Pts</span>
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