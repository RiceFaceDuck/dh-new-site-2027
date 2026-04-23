import React, { useState, useEffect } from 'react';
import { Coins, CreditCard, Star, History, Info, Zap, Loader2 } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getAuth } from 'firebase/auth';

const TabWallet = ({ stats }) => {
  const [historyTab, setHistoryTab] = useState('wallet');
  
  // State สำหรับเก็บประวัติการทำรายการ
  const [walletHistory, setWalletHistory] = useState([]);
  const [creditHistory, setCreditHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // 🚀 Smart Fetch: ดึงประวัติการทำรายการเมื่อ Component โหลด
  useEffect(() => {
    const fetchTransactionHistory = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      try {
        setIsLoadingHistory(true);
        
        // Query 1: ประวัติกระเป๋าเงินสด (Wallet)
        const walletQ = query(
          collection(db, 'credit_transactions'),
          where('uid', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        
        // Query 2: ประวัติแต้มสะสม (Partner Credit)
        const creditQ = query(
          collection(db, 'point_transactions'),
          where('uid', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(10)
        );

        // ดึงข้อมูลพร้อมกัน (ประหยัดเวลา)
        const [walletSnap, creditSnap] = await Promise.all([
          getDocs(walletQ),
          getDocs(creditQ)
        ]);

        setWalletHistory(walletSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setCreditHistory(creditSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
      } catch (error) {
        console.error("🔥 Error fetching transaction history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchTransactionHistory();
  }, []);

  // ฟังก์ชันแปลง Timestamp เป็นวันที่และเวลา
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return { date: '-', time: '-' };
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return {
      date: date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'
    };
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Coins size={22} className="text-emerald-600" /> กระเป๋าเงิน & เครดิต (Financial Hub)
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
        {/* บัตร Wallet (เงินสดค้างในระบบ) */}
        <div className="bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col h-full group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute top-6 right-6"><CreditCard size={32} className="text-white/20" /></div>

          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">DH Wallet (ยอดค้างในระบบ)</p>
          <p className="text-4xl font-black tracking-tight mt-2 mb-6">
            ฿ {(stats?.creditBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          
          <div className="mt-auto border-t border-white/10 pt-4">
            <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
              ยอดเงินเกิดจากการเคลม/คืนสินค้า หรือชำระเงินเกิน สามารถใช้เป็นส่วนลดสั่งซื้อครั้งถัดไป หรือแจ้งเบิกถอนเข้าบัญชีธนาคารได้
            </p>
            <button className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors backdrop-blur-sm shadow-sm active:scale-95">
              แจ้งเบิกถอนเงินสด
            </button>
          </div>
        </div>

        {/* บัตร Partner Credit (แต้มสะสม) */}
        <div className="bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col h-full group">
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full translate-y-1/3 translate-x-1/4 blur-xl group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute top-6 right-6"><Star size={32} className="text-white/30" /></div>

          <p className="text-[10px] text-amber-100 font-bold uppercase tracking-widest mb-1">Partner Credit (แต้มเครดิต)</p>
          <p className="text-4xl font-black tracking-tight mt-2 mb-6 drop-shadow-sm">
            {(stats?.rewardPoints || 0).toLocaleString()} <span className="text-base font-medium opacity-80">Pts</span>
          </p>
          
          <div className="mt-auto border-t border-white/20 pt-4">
            <p className="text-[10px] text-amber-50 mb-3 leading-relaxed flex items-start gap-1">
              <Zap size={12} className="flex-shrink-0 mt-0.5" /> 
              ได้รับเครดิตจากการซื้อสินค้า หรือการให้ความรู้ในคอมเมนต์ ใช้สำหรับลงโฆษณาหน้า Profile และแลกพื้นที่แบนเนอร์
            </p>
            <button className="w-full bg-white text-amber-600 hover:bg-amber-50 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm active:scale-95">
              + เติมเครดิตด้วยเงินสด
            </button>
          </div>
        </div>
      </div>

      {/* History Log (Double-entry Bookkeeping UI) */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <History size={18} className="text-gray-400" /> ประวัติการทำรายการ
        </h3>
        <div className="bg-gray-100 p-1 rounded-lg flex text-[10px] font-bold">
          <button 
            onClick={() => setHistoryTab('wallet')} 
            className={`px-4 py-2 rounded-md transition-colors ${historyTab === 'wallet' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            เงินสด (Wallet)
          </button>
          <button 
            onClick={() => setHistoryTab('credit')} 
            className={`px-4 py-2 rounded-md transition-colors ${historyTab === 'credit' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            เครดิต (Credit)
          </button>
        </div>
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm relative min-h-[200px]">
         {/* Loading State */}
         {isLoadingHistory && (
           <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
             <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
             <span className="text-xs font-bold text-gray-500">กำลังโหลดประวัติ...</span>
           </div>
         )}

         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                 <th className="p-4 whitespace-nowrap w-32">วันที่ / เวลา</th>
                 <th className="p-4">ประเภท / รายละเอียด</th>
                 <th className="p-4 text-right whitespace-nowrap w-32">จำนวน</th>
               </tr>
             </thead>
             <tbody>
               {/* ---------------- แท็บประวัติ Wallet ---------------- */}
               {historyTab === 'wallet' && (
                 walletHistory.length === 0 && !isLoadingHistory ? (
                   <tr>
                     <td colSpan="3" className="p-8 text-center text-xs text-gray-400 font-medium">ไม่มีประวัติการทำรายการกระเป๋าเงินสด</td>
                   </tr>
                 ) : (
                   walletHistory.map(tx => {
                     const isPositive = ['refund', 'deposit', 'bonus'].includes(tx.type);
                     const sign = isPositive ? '+' : '-';
                     const colorClass = isPositive ? 'text-emerald-600' : 'text-red-500';
                     const { date, time } = formatTimestamp(tx.timestamp);

                     return (
                       <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                         <td className="p-4 text-xs text-gray-500">
                           {date}<br/><span className="text-[10px]">{time}</span>
                         </td>
                         <td className="p-4">
                           <p className="text-xs font-bold text-gray-800">{tx.note || 'ปรับปรุงยอดระบบ'}</p>
                           {tx.referenceId && (
                             <p className="text-[10px] text-gray-400 mt-0.5">อ้างอิง: {tx.referenceId}</p>
                           )}
                         </td>
                         <td className={`p-4 text-right text-xs font-black ${colorClass}`}>
                           {sign} ฿{tx.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                         </td>
                       </tr>
                     );
                   })
                 )
               )}

               {/* ---------------- แท็บประวัติ Credit ---------------- */}
               {historyTab === 'credit' && (
                 creditHistory.length === 0 && !isLoadingHistory ? (
                   <tr>
                     <td colSpan="3" className="p-8 text-center text-xs text-gray-400 font-medium">ไม่มีประวัติการได้รับแต้มเครดิต</td>
                   </tr>
                 ) : (
                   creditHistory.map(tx => {
                     const isPositive = tx.type === 'earn';
                     const sign = isPositive ? '+' : '-';
                     const colorClass = isPositive ? 'text-emerald-600' : 'text-red-500';
                     const { date, time } = formatTimestamp(tx.timestamp);

                     return (
                       <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                         <td className="p-4 text-xs text-gray-500">
                           {date}<br/><span className="text-[10px]">{time}</span>
                         </td>
                         <td className="p-4">
                           <p className="text-xs font-bold text-gray-800">{tx.note || 'รับแต้มสะสม'}</p>
                           {tx.referenceId && (
                             <p className="text-[10px] text-gray-400 mt-0.5">อ้างอิง: {tx.referenceId}</p>
                           )}
                         </td>
                         <td className={`p-4 text-right text-xs font-black ${colorClass}`}>
                           {sign} {tx.points?.toLocaleString() || '0'} Pts
                         </td>
                       </tr>
                     );
                   })
                 )
               )}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
};

export default TabWallet;