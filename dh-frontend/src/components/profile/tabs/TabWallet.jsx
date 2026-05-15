/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Wallet, History, TrendingUp, TrendingDown, Clock, ShieldCheck, Award, Loader2 } from 'lucide-react';
import { getAuth } from 'firebase/auth';

// 🚀 นำเข้า Hook และ Services ตัวใหม่ล่าสุดจาก creditService
import { useUserCredit, getCreditHistory, formatCredit } from '../../../firebase/creditService';

const TabWallet = ({ userProfile }) => {
  const auth = getAuth();
  const user = auth.currentUser;

  // ⚡ ใช้ Custom Hook สำหรับดึงข้อมูล Wallet แบบ Real-time
  const { balance, tier, totalAccumulated, pendingCredits, loading: walletLoading } = useUserCredit(user?.uid);
  
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.uid) return;
      setLoadingHistory(true);
      try {
        // ใช้ชื่อฟังก์ชันใหม่ getCreditHistory (มีระบบ Smart Cache ในตัว)
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

  return (
    <div className="animate-in fade-in duration-500 relative">
      
      {/* 🎯 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet size={22} className="text-[#0870B8]" /> กระเป๋าเงินเครดิต (My Wallet)
          </h2>
          <p className="text-xs text-gray-500 mt-1">จัดการยอดเครดิตพอยต์และตรวจสอบประวัติการทำรายการ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* 💳 บัตรกระเป๋าเงิน (Wallet Card) - ซิงค์ข้อมูล Real-time */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-xl p-6 md:p-8">
           {/* Decorative Background */}
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
           <div className="absolute bottom-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           
           <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start mb-8">
                 <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                     <ShieldCheck size={14} className="text-emerald-400" /> ยอดเครดิตคงเหลือ
                   </p>
                   {walletLoading ? (
                     <div className="h-12 flex items-center"><Loader2 className="animate-spin text-emerald-400" size={24}/></div>
                   ) : (
                     <div className="flex items-baseline gap-2">
                       <h3 className="text-4xl md:text-5xl font-black font-tech text-emerald-400 tracking-tight">
                         {formatCredit(balance)}
                       </h3>
                       <span className="text-lg font-bold text-slate-300">Pts</span>
                     </div>
                   )}
                 </div>

                 {/* 🏆 Tier Badge (Gamification) */}
                 {!walletLoading && tier && (
                   <div className={`px-3 py-1.5 rounded-xl border ${tier.border} ${tier.bg} ${tier.color} flex items-center gap-1.5 shadow-sm transform transition-transform hover:scale-105 cursor-default`}>
                     <span className="text-lg">{tier.icon}</span>
                     <span className="text-xs font-bold uppercase tracking-wider">{tier.name}</span>
                   </div>
                 )}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
                 <div>
                   <p className="text-[10px] text-slate-400 font-medium">ชื่อบัญชีผู้ใช้</p>
                   <p className="text-sm font-bold text-white tracking-wide">{userProfile?.accountName || userProfile?.displayName || 'DH Member'}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] text-slate-400 font-medium">แต้มสะสมทั้งหมด</p>
                   <p className="text-sm font-bold text-white tracking-wide">{formatCredit(totalAccumulated)} Pts</p>
                 </div>
              </div>
           </div>
        </div>

        {/* ⏳ Pending Credits Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-center relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Clock size={80} className="text-amber-500" />
           </div>
           <div className="relative z-10">
             <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
               <Clock size={20} />
             </div>
             <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">รออนุมัติ (Pending)</p>
             <h3 className="text-3xl font-black text-gray-800 font-tech mb-2">
               {formatCredit(pendingCredits)} <span className="text-sm text-gray-500 font-bold">Pts</span>
             </h3>
             <p className="text-[10px] text-gray-400 leading-relaxed max-w-[200px]">
               แต้มที่รอการตรวจสอบจากระบบ (ใช้เวลา 11 วันหลังสั่งซื้อ)
             </p>
           </div>
        </div>
      </div>

      {/* 📜 ประวัติการทำรายการ (History) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <History size={18} className="text-[#0870B8]" /> ประวัติการทำรายการ
          </h3>
          <span className="text-xs text-gray-500 font-medium bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-sm">
            30 รายการล่าสุด
          </span>
        </div>

        <div className="p-0">
          {loadingHistory ? (
             <div className="flex flex-col items-center justify-center py-16">
               <Loader2 size={32} className="animate-spin text-[#0870B8] mb-3" />
               <p className="text-sm font-bold text-gray-500">กำลังโหลดประวัติ...</p>
             </div>
          ) : historyLogs.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 text-center px-4">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                 <History size={24} className="text-gray-300" />
               </div>
               <p className="text-sm font-bold text-gray-600">ยังไม่มีประวัติการทำรายการ</p>
               <p className="text-xs text-gray-400 mt-1">รายการสะสมหรือใช้แต้มของคุณจะแสดงที่นี่</p>
             </div>
          ) : (
             <div className="divide-y divide-gray-50">
               {historyLogs.map((log) => {
                 // แยกแยะประเภทรายการ
                 const isEarn = log.type === 'deposit' || log.type === 'earn';
                 const isSpend = log.type === 'spend' || log.type === 'deduct';
                 
                 return (
                   <div key={log.id} className="p-4 sm:px-6 hover:bg-gray-50/50 transition-colors flex items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                         isEarn ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                         'bg-rose-50 text-rose-600 border border-rose-100'
                       }`}>
                         {isEarn ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                       </div>
                       <div>
                         <p className="text-sm font-bold text-gray-800">{log.note || (isEarn ? 'ได้รับเครดิต' : 'ใช้เครดิต')}</p>
                         <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] text-gray-400 font-medium">
                             {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('th-TH') : (log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString('th-TH') : '-')}
                           </span>
                           {log.referenceId && (
                             <>
                               <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                               <span className="text-[10px] text-gray-400 font-mono tracking-wider text-ellipsis overflow-hidden max-w-[120px]">
                                 Ref: {log.referenceId}
                               </span>
                             </>
                           )}
                         </div>
                       </div>
                     </div>
                     <div className="text-right shrink-0">
                       <p className={`text-base font-black font-tech ${isEarn ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {isEarn ? '+' : '-'}{formatCredit(log.amount || log.points)}
                       </p>
                       <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                         คงเหลือ: {formatCredit(log.balanceAfter)}
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