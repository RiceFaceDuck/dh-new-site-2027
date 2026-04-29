import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Activity, Search, Save, Calendar, Infinity,
  Database, ArrowLeft, RefreshCcw, AlertTriangle, UserCheck, Settings,
  ArrowRightLeft, Clock, Lock, Server, Fingerprint, Info, CheckCircle2, XCircle, Terminal, TrendingUp, TrendingDown,
  Coins, PlusCircle, MinusCircle, Loader2
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, limit, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

// 🚀 นำเข้า Component ลูก (ถ้ามี) หรือฟังก์ชันจาก Service 
import { formatCredit } from '../../firebase/creditService';

// App ID ของโปรเจกต์
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export default function CreditDashboard() {
  const [activeTab, setActiveTab] = useState('health'); // 'health', 'adjust'
  
  // State สำหรับ Health Check (ของเดิม)
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthStatus, setHealthStatus] = useState('healthy'); 
  const [healthLogs, setHealthLogs] = useState([
    { time: new Date().toLocaleTimeString(), msg: "ระบบ Credit System Initialized", type: "info" }
  ]);

  // State สำหรับ Manual Adjustment
  const [searchEmail, setSearchEmail] = useState('');
  const [targetUser, setTargetUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('add'); // 'add' | 'deduct'
  const [adjustNote, setAdjustNote] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [messageBox, setMessageBox] = useState(null);

  // ฟังก์ชันแสดงแจ้งเตือน
  const showMessage = (type, text) => {
    setMessageBox({ type, text });
    setTimeout(() => setMessageBox(null), 4000);
  };

  const addLog = (msg, type = "info") => {
    setHealthLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }].slice(-15));
  };

  const checkSystemHealth = () => {
    setIsCheckingHealth(true);
    addLog("กำลังตรวจสอบการเชื่อมต่อ Firestore Transactions...", "info");
    
    setTimeout(() => {
      addLog("Firestore Read/Write Response Time: 45ms", "success");
      addLog("ตรวจสอบ Index ของ Collection Users... ผ่าน", "success");
      addLog("ตรวจสอบ Atomic Operations... ผ่าน", "success");
      setHealthStatus('healthy');
      setIsCheckingHealth(false);
    }, 1500);
  };

  useEffect(() => {
    checkSystemHealth();
  }, []);

  // 🔍 ฟังก์ชันค้นหาผู้ใช้ด้วย Email เพื่อเติม/ลดแต้ม
  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!searchEmail) return;

    setIsSearching(true);
    setTargetUser(null);

    try {
      // ค้นหาใน Collection กลาง (users) ของ backoffice ก่อน
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", searchEmail), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = { uid: userDoc.id, ...userDoc.data() };
        
        // เมื่อเจอไอดีแล้ว ไปดึงยอด Wallet ปัจจุบันของเขา
        const walletRef = doc(db, 'artifacts', appId, 'users', userData.uid, 'wallet', 'default');
        const walletSnap = await getDoc(walletRef);
        
        const balance = walletSnap.exists() ? (walletSnap.data().balance || 0) : 0;
        
        setTargetUser({ ...userData, currentBalance: balance });
        showMessage('success', `พบผู้ใช้: ${userData.displayName || userData.accountName || userData.email}`);
      } else {
        showMessage('error', 'ไม่พบผู้ใช้อีเมลนี้ในระบบ');
      }
    } catch (error) {
      console.error("Search error:", error);
      showMessage('error', 'เกิดข้อผิดพลาดในการค้นหาข้อมูล');
    } finally {
      setIsSearching(false);
    }
  };

  // 💰 ฟังก์ชันปรับปรุงยอดเงิน (Manual Adjustment) ด้วย Transaction
  const handleAdjustCredit = async (e) => {
    e.preventDefault();
    if (!targetUser || !adjustAmount || isNaN(adjustAmount) || Number(adjustAmount) <= 0) {
      showMessage('error', 'กรุณาระบุจำนวนแต้มที่ถูกต้อง');
      return;
    }

    if (!window.confirm(`ยืนยันการ${adjustType === 'add' ? 'เพิ่ม' : 'หัก'} ${adjustAmount} แต้ม ให้กับ ${targetUser.email} ใช่หรือไม่?`)) return;

    setIsAdjusting(true);
    const amount = Number(adjustAmount);
    
    try {
      await runTransaction(db, async (transaction) => {
        const walletRef = doc(db, 'artifacts', appId, 'users', targetUser.uid, 'wallet', 'default');
        const walletDoc = await transaction.get(walletRef);
        
        let currentBalance = 0;
        let totalAccumulated = 0;

        if (walletDoc.exists()) {
          const data = walletDoc.data();
          currentBalance = data.balance || 0;
          totalAccumulated = data.totalAccumulated || 0;
        }

        // ตรวจสอบกรณีหักแต้ม ไม่ให้ยอดติดลบ
        if (adjustType === 'deduct' && currentBalance < amount) {
          throw new Error("ยอดเงินในระบบไม่เพียงพอสำหรับการหัก");
        }

        const newBalance = adjustType === 'add' ? currentBalance + amount : currentBalance - amount;
        // ถ้าเป็นการเติมแต้ม ให้อัปเดตยอดสะสมรวมด้วย (เพื่อเลื่อนขั้น VIP)
        const newTotalAccumulated = adjustType === 'add' ? totalAccumulated + amount : totalAccumulated;

        // 1. อัปเดตยอด Wallet
        transaction.set(walletRef, { 
          balance: newBalance,
          totalAccumulated: newTotalAccumulated,
          updatedAt: serverTimestamp() 
        }, { merge: true });

        // 2. บันทึกประวัติ (History Log)
        const historyRef = doc(collection(db, 'artifacts', appId, 'users', targetUser.uid, 'credit_history'));
        transaction.set(historyRef, {
          type: adjustType === 'add' ? 'earn' : 'spend',
          points: amount,
          note: adjustNote || (adjustType === 'add' ? 'แอดมินปรับเพิ่มแต้มพิเศษ' : 'แอดมินหักแต้มเครดิต'),
          referenceId: 'MANUAL-' + Date.now().toString().substring(5),
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
          adjustedBy: 'ADMIN' // หากมีชื่อแอดมินใส่ตรงนี้ได้
        });
        
        return newBalance;
      });

      showMessage('success', `ปรับปรุงยอดสำเร็จ!`);
      // เคลียร์ฟอร์ม
      setAdjustAmount('');
      setAdjustNote('');
      // อัปเดตหน้าจอโชว์ยอดใหม่
      setTargetUser(prev => ({ 
        ...prev, 
        currentBalance: adjustType === 'add' ? prev.currentBalance + amount : prev.currentBalance - amount 
      }));

    } catch (error) {
      console.error("Adjustment error:", error);
      showMessage('error', error.message || 'เกิดข้อผิดพลาดในการทำรายการ');
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      
      {/* 🌟 Toast Notification */}
      {messageBox && (
        <div className={`fixed top-20 right-8 z-[100] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8 duration-300 border ${
          messageBox.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {messageBox.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span className="font-medium text-sm">{messageBox.text}</span>
        </div>
      )}

      {/* Header (รักษาดีไซน์เดิม) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" />
            ศูนย์ควบคุมเครดิตพอยต์ (Credit Core)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ตรวจเช็คสถานะระบบคำนวณแบบ Real-time และปรับปรุงยอดลูกค้า (Manual Adjustment)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            System Online
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'health' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
        >
          <Activity size={16} /> System Health
        </button>
        <button 
          onClick={() => setActiveTab('adjust')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'adjust' ? 'bg-[#0870B8] text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
        >
          <ArrowRightLeft size={16} /> เติม/ลด เครดิต (Manual)
        </button>
      </div>

      {/* ==========================================
          🌟 แท็บที่ 1: System Health (โค้ดเดิมของคุณ)
          ========================================== */}
      {activeTab === 'health' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              {/* การ์ดสถิติ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><CheckCircle2 size={24} /></div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-md">Last 24h</span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-800 mb-1">100%</h3>
                  <p className="text-sm font-medium text-slate-500">Transaction Success Rate</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-[#E6F0F9] rounded-lg text-[#0870B8]"><Clock size={24} /></div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-md">Avg. Time</span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-800 mb-1">45ms</h3>
                  <p className="text-sm font-medium text-slate-500">Processing Speed</p>
                </div>
              </div>

              {/* Terminal Log */}
              <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden flex flex-col h-[400px]">
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="text-slate-400" size={16} />
                    <span className="text-xs font-tech font-bold text-slate-300 uppercase tracking-widest">Transaction Engine Diagnostics</span>
                  </div>
                  <button onClick={checkSystemHealth} disabled={isCheckingHealth} className="text-slate-400 hover:text-emerald-400 transition-colors">
                    <RefreshCcw size={14} className={isCheckingHealth ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div className="p-4 flex-1 overflow-y-auto font-tech text-xs leading-relaxed custom-scrollbar">
                  <div className="space-y-1.5 text-slate-400">
                     <div className="text-slate-500 mb-4">DH CORE v2.5.0 - Credit Transaction Subsystem<br/>Connected to Firestore via secure channel.</div>
                     {healthLogs.map((log, i) => (
                       <div key={i} className={`flex gap-4 ${log.type === 'error' ? 'text-rose-500' : log.type === 'success' ? 'text-emerald-400' : 'text-blue-300'}`}>
                         <span className="text-slate-600 shrink-0">[{log.time}]</span>
                         <span className={log.type === 'error' ? 'animate-pulse font-black' : ''}>{log.msg}</span>
                       </div>
                     ))}
                     {isCheckingHealth && <div className="text-blue-500 animate-pulse mt-3">_</div>}
                  </div>
                </div>
              </div>
           </div>
           
           {/* ข้อมูลความปลอดภัย */}
           <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Lock size={18} className="text-amber-500" /> Security Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5"><Database size={14} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Atomic Operations</h4>
                    <p className="text-xs text-slate-500 mt-1">เปิดใช้งานแล้ว. ทุกคำสั่งซื้อจะถูกล็อคการหักเครดิตและสต๊อกพร้อมกัน ป้องกันยอดติดลบ</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5"><Fingerprint size={14} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Double-Entry Logging</h4>
                    <p className="text-xs text-slate-500 mt-1">ประวัติการใช้แต้มทุกรายการถูกบันทึกด้วย Reference ID แยกชัดเจน</p>
                  </div>
                </div>
              </div>
           </div>
         </div>
      )}

      {/* ==========================================
          🌟 แท็บที่ 2: Manual Adjustment (เพิ่ม/หัก เครดิตด้วยมือ) - ส่วนที่สร้างใหม่
          ========================================== */}
      {activeTab === 'adjust' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* ส่วนค้นหาผู้ใช้ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
             <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
               <Search className="text-[#0870B8] w-5 h-5" /> ค้นหาบัญชีลูกค้า / พาร์ทเนอร์
             </h2>
             <form onSubmit={handleSearchUser} className="flex gap-2">
               <input 
                 type="email" 
                 value={searchEmail}
                 onChange={(e) => setSearchEmail(e.target.value)}
                 placeholder="กรอกอีเมลลูกค้า (เช่น user@dh.com)"
                 className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8]"
                 required
               />
               <button 
                 type="submit"
                 disabled={isSearching}
                 className="px-5 py-2.5 bg-[#0870B8] text-white font-bold rounded-xl hover:bg-[#065A96] transition-colors disabled:opacity-50"
               >
                 {isSearching ? <Loader2 size={20} className="animate-spin" /> : 'ค้นหา'}
               </button>
             </form>

             {/* ผลการค้นหา */}
             {targetUser && (
               <div className="mt-6 p-5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                     <UserCheck className="text-emerald-500" size={24} />
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-800">{targetUser.displayName || targetUser.accountName || 'ไม่ระบุชื่อ'}</h3>
                     <p className="text-xs text-slate-500">{targetUser.email}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ยอดเครดิตปัจจุบัน</p>
                   <p className="text-xl font-black text-[#0870B8] font-tech">
                     {formatCredit(targetUser.currentBalance)} <span className="text-xs">Pts</span>
                   </p>
                 </div>
               </div>
             )}
          </div>

          {/* ส่วนดำเนินการปรับปรุงยอด (แสดงเมื่อค้นหาเจอเท่านั้น) */}
          <div className={`transition-all duration-500 ${targetUser ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
             {targetUser && (
               <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md border-t-4 border-t-[#0870B8]">
                 <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                   <Coins className="text-[#0870B8] w-5 h-5" /> ดำเนินการปรับปรุงยอด
                 </h2>
                 
                 <form onSubmit={handleAdjustCredit} className="space-y-5">
                   
                   {/* เลือกประเภทการทำรายการ */}
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">ประเภทรายการ</label>
                     <div className="grid grid-cols-2 gap-3">
                       <button 
                         type="button"
                         onClick={() => setAdjustType('add')}
                         className={`py-3 flex items-center justify-center gap-2 rounded-xl font-bold transition-all border-2 ${
                           adjustType === 'add' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                         }`}
                       >
                         <PlusCircle size={18} /> เติมเครดิต (Add)
                       </button>
                       <button 
                         type="button"
                         onClick={() => setAdjustType('deduct')}
                         className={`py-3 flex items-center justify-center gap-2 rounded-xl font-bold transition-all border-2 ${
                           adjustType === 'deduct' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                         }`}
                       >
                         <MinusCircle size={18} /> หักเครดิต (Deduct)
                       </button>
                     </div>
                   </div>

                   {/* จำนวนแต้ม */}
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">จำนวนแต้ม (Points)</label>
                     <input 
                       type="number" 
                       min="1"
                       value={adjustAmount}
                       onChange={(e) => setAdjustAmount(e.target.value)}
                       placeholder="ตัวเลขเท่านั้น เช่น 500"
                       className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] font-tech text-lg font-bold"
                       required
                     />
                   </div>

                   {/* บันทึกช่วยจำ */}
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">เหตุผล (Note)</label>
                     <input 
                       type="text" 
                       value={adjustNote}
                       onChange={(e) => setAdjustNote(e.target.value)}
                       placeholder="เช่น ร่วมกิจกรรมพิเศษเดือนมีนาคม..."
                       className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0870B8] focus:ring-1 focus:ring-[#0870B8] text-sm"
                     />
                   </div>

                   {/* สรุปก่อนกดบันทึก */}
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <div className="flex justify-between items-center text-sm font-medium text-slate-600 mb-1">
                       <span>ยอดหลังการปรับปรุง:</span>
                       <span className={`font-tech text-lg font-bold ${adjustType === 'add' ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {formatCredit(adjustType === 'add' ? targetUser.currentBalance + Number(adjustAmount || 0) : targetUser.currentBalance - Number(adjustAmount || 0))} Pts
                       </span>
                     </div>
                     <p className="text-[10px] text-slate-400 text-right">ดำเนินการด้วยระบบ Secure Transaction</p>
                   </div>

                   {/* Submit Button */}
                   <button 
                     type="submit"
                     disabled={isAdjusting || !adjustAmount}
                     className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                       isAdjusting ? 'bg-slate-400 cursor-not-allowed' : (adjustType === 'add' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600')
                     }`}
                   >
                     {isAdjusting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                     ยืนยันการบันทึกรายการ
                   </button>
                 </form>

               </div>
             )}
          </div>

        </div>
      )}

    </div>
  );
}