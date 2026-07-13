import { useState, useEffect } from 'react';
import { collection, collectionGroup, getAggregateFromServer, sum, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Wallet, Coins, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import GuidePanel from '../common/GuidePanel';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export default function TotalLiabilityDashboard() {
  const [stats, setStats] = useState({
    walletBalance: 0,
    creditPoints: 0,
    pendingWithdrawal: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAggregation = async () => {
    setIsRefreshing(true);
    try {
      const usersRef = collection(db, getCollectionPath('users'));
      // Using zero-quota aggregation function in Firebase v10+
      const snapshot = await getAggregateFromServer(usersRef, {
        totalWallet: sum('walletBalance'),
        totalPoints: sum('creditPoints'),
        totalPending: sum('pendingWithdrawal')
      });
      
      setStats({
        walletBalance: snapshot.data().totalWallet || 0,
        creditPoints: snapshot.data().totalPoints || 0,
        pendingWithdrawal: snapshot.data().totalPending || 0
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching liability aggregation:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAggregation();

    // 🚀 Real-time triggers
    const walletTxQuery = query(collectionGroup(db, 'wallet_transactions'), orderBy('timestamp', 'desc'), limit(1));
    const creditTxQuery = query(collection(db, getCollectionPath('credit_transactions')), orderBy('timestamp', 'desc'), limit(1));

    const unsubscribeWallet = onSnapshot(walletTxQuery, (snapshot) => {
      if (!snapshot.empty && !snapshot.docs[0].metadata.hasPendingWrites) fetchAggregation();
    });

    const unsubscribeCredit = onSnapshot(creditTxQuery, (snapshot) => {
      if (!snapshot.empty && !snapshot.docs[0].metadata.hasPendingWrites) fetchAggregation();
    });

    return () => {
      unsubscribeWallet();
      unsubscribeCredit();
    };
  }, []);

  const totalLiability = stats.walletBalance + stats.pendingWithdrawal + stats.creditPoints;

  return (
    <div className="w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden group">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl border border-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              ภาพรวมภาระผูกพันองค์กร
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100/50 text-[10px] font-black uppercase tracking-widest">
                LIVE SYNC
              </span>
            </h2>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5 flex items-center gap-1.5">
              ระบบตรวจสอบความเคลื่อนไหวอัตโนมัติ 
              <button 
                onClick={fetchAggregation} 
                className="text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 p-0.5 rounded-md"
                disabled={isRefreshing}
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </p>
          </div>
        </div>
        
        <GuidePanel title="ข้อมูลภาระผูกพันทางการเงิน">
          <div className="space-y-2 text-sm">
            <p><strong>ภาระผูกพันทางการเงิน (Total Liability)</strong> คือ ยอดหนี้สินที่บริษัทค้างจ่ายหรือมูลค่าที่ลูกค้าสามารถนำมาใช้งานได้ในระบบ ประกอบด้วย:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li><span className="text-emerald-600 font-bold">กระเป๋าเงิน (Wallet)</span> - เงินสดจริงของลูกค้าที่เติมเข้ามาหรือได้คืนจากการยกเลิก</li>
              <li><span className="text-amber-600 font-bold">แต้มสะสม (Points)</span> - มูลค่าแต้ม 1 Pts = 1 บาท สำหรับใช้เป็นส่วนลด</li>
              <li><span className="text-rose-500 font-bold">ยอดรอถอนเงิน (Pending)</span> - เงินที่ลูกค้ากดขอถอนออก รอแอดมินอนุมัติโอน</li>
            </ul>
          </div>
        </GuidePanel>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-6 pt-6 border-t border-slate-100">
        
        {/* Total Liability */}
        <div className="flex flex-col relative group/stat">
          <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1 group-hover/stat:text-slate-600 transition-colors">ยอดภาระผูกพันรวม</p>
          {isLoading ? (
            <div className="h-10 bg-slate-50 rounded-xl animate-pulse w-3/4 mt-1"></div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-900 tracking-tighter">฿{totalLiability.toLocaleString()}</span>
            </div>
          )}
          <p className="text-[10px] text-slate-400 mt-2 font-medium">อัปเดต: {lastUpdated.toLocaleTimeString()}</p>
        </div>

        {/* Breakdown: Wallet */}
        <div className="flex flex-col lg:pl-8 lg:border-l border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600"><Wallet className="w-4 h-4" /></div>
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-600">กระเป๋าเงินลูกค้า</h3>
          </div>
          {isLoading ? (
            <div className="h-8 bg-slate-50 rounded-lg animate-pulse w-24 mt-1"></div>
          ) : (
            <p className="text-2xl font-black text-slate-900 tracking-tighter mt-1">
              ฿{stats.walletBalance.toLocaleString()}
            </p>
          )}
        </div>

        {/* Breakdown: Pending */}
        <div className="flex flex-col lg:pl-8 lg:border-l border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600"><Clock className="w-4 h-4" /></div>
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-600">รอแอดมินโอนออก</h3>
          </div>
          {isLoading ? (
            <div className="h-8 bg-slate-50 rounded-lg animate-pulse w-24 mt-1"></div>
          ) : (
            <p className="text-2xl font-black text-slate-900 tracking-tighter mt-1">
              ฿{stats.pendingWithdrawal.toLocaleString()}
            </p>
          )}
        </div>

        {/* Breakdown: Points */}
        <div className="flex flex-col lg:pl-8 lg:border-l border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600"><Coins className="w-4 h-4" /></div>
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-600">แต้มสะสมทั้งหมด</h3>
          </div>
          {isLoading ? (
            <div className="h-8 bg-slate-50 rounded-lg animate-pulse w-24 mt-1"></div>
          ) : (
            <p className="text-2xl font-black text-slate-900 tracking-tighter mt-1">
              {stats.creditPoints.toLocaleString()} <span className="text-sm font-bold text-slate-500 tracking-normal">Pts</span>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
