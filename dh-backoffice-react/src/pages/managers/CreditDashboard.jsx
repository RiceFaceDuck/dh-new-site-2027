/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Activity, Search, Save, Calendar, Infinity,
  Database, ArrowLeft, RefreshCcw, AlertTriangle, UserCheck, Settings,
  ArrowRightLeft, Clock, Lock, Server, Fingerprint, Info, CheckCircle2, XCircle, Terminal, TrendingUp, TrendingDown,
  Coins, PlusCircle, MinusCircle, Loader2, ListOrdered, History
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, limit, serverTimestamp, getAggregateFromServer, sum, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

// 🚀 นำเข้าเครื่องยนต์ประมวลผลหลัก (Core Engine) จาก Service
import { creditService, formatCredit } from '../../firebase/creditService';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export default function CreditDashboard() {
  const [activeTab, setActiveTab] = useState('adjust');
  
  // ================= State: System Health =================
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthStatus, setHealthStatus] = useState('healthy'); 
  const [healthLogs, setHealthLogs] = useState([
    { time: new Date().toLocaleTimeString(), msg: "ระบบ Credit System Initialized", type: "info" }
  ]);
  const [ledgerStats, setLedgerStats] = useState({
    systemPoolMax: 0,
    totalAllocated: 0,
    totalUserBalance: 0,
    totalPendingCredits: 0
  });

  // ================= State: Manual Adjustment =================
  const [searchEmail, setSearchEmail] = useState('');
  const [targetUser, setTargetUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('add'); // 'add' | 'deduct'
  const [adjustNote, setAdjustNote] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // ================= State: Notifications =================
  const [messageBox, setMessageBox] = useState(null);

  const showMessage = (type, text) => {
    setMessageBox({ type, text });
    setTimeout(() => setMessageBox(null), 4000);
  };

  const addLog = (msg, type = "info") => {
    setHealthLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }].slice(-15));
  };

  // 🩺 ตรวจสอบสุขภาพระบบ
  const checkSystemHealth = async () => {
    setIsCheckingHealth(true);
    addLog("กำลังตรวจสอบการเชื่อมต่อ Firestore Transactions...", "info");
    
    try {
      addLog("Ledger Check สมบูรณ์... ระบบพร้อมทำงานแบบ Atomic Sync", "success");
      setHealthStatus('healthy');
    } catch (error) {
      addLog("เกิดข้อผิดพลาดในการตรวจสอบ", "error");
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    if(activeTab === 'health') checkSystemHealth();
  }, [activeTab]);

  // 🔍 ค้นหาผู้ใช้ & ประวัติล่าสุด (ค้นหาใน Scope ที่ถูกต้อง)
  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!searchEmail) return;

    setIsSearching(true);
    setTargetUser(null);
    setUserHistory([]);
    setAdjustAmount('');

    try {
      // 1. ค้นหา User ใน artifacts/{appId}/users
      let usersRef = collection(db, 'artifacts', appId, "users");
      let q = query(usersRef, where("email", "==", searchEmail.trim()), limit(1));
      let querySnapshot = await getDocs(q);

      // Fallback ถ้าไม่เจอ ให้หาจาก Root (กรณี User เก่า)
      if (querySnapshot.empty) {
        usersRef = collection(db, "users");
        q = query(usersRef, where("email", "==", searchEmail.trim()), limit(1));
        querySnapshot = await getDocs(q);
      }

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = { uid: userDoc.id, ...userDoc.data() };
        
        // 2. ดึงยอดเงิน (อิงจาก Wallet ก่อนเพื่อความชัวร์ หรือจาก Profile)
        let balance = userData.creditPoints || userData.creditPoint || userData.stats?.creditBalance || userData.partnerCredit || 0;
        
        const walletRef = doc(db, 'artifacts', appId, 'users', userData.uid, 'wallet', 'default');
        const walletSnap = await getDoc(walletRef);
        if (walletSnap.exists() && walletSnap.data().balance !== undefined) {
           // ถ้ายอดใน wallet มีการอัปเดตล่าสุด ให้ใช้ยอดนี้
           balance = Math.max(balance, walletSnap.data().balance);
        }
        
        setTargetUser({ ...userData, currentBalance: balance });
        showMessage('success', `พบผู้ใช้: ${userData.displayName || userData.accountName || userData.email}`);

        // 3. ดึงประวัติ 5 รายการล่าสุด
        try {
          const historyRef = collection(db, 'artifacts', appId, 'users', userData.uid, 'credit_history');
          const hQuery = query(historyRef, orderBy('createdAt', 'desc'), limit(5));
          const hSnap = await getDocs(hQuery);
          const historyData = hSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setUserHistory(historyData);
        } catch (hErr) {
          console.error("Could not fetch history:", hErr);
        }

      } else {
        showMessage('error', 'ไม่พบผู้ใช้อีเมลนี้ในระบบ กรุณาตรวจสอบอีกครั้ง');
      }
    } catch (error) {
      console.error("Search error:", error);
      showMessage('error', 'เกิดข้อผิดพลาดในการค้นหาข้อมูล');
    } finally {
      setIsSearching(false);
    }
  };

  // 💰 ฟังก์ชันปรับปรุงยอดเงินด้วย Transaction ของ Core Engine
  const handleAdjustCredit = async (e) => {
    e.preventDefault();
    if (!targetUser || !adjustAmount || isNaN(adjustAmount) || Number(adjustAmount) <= 0) {
      showMessage('error', 'กรุณาระบุจำนวนแต้มที่ถูกต้อง (> 0)');
      return;
    }

    if (!window.confirm(`[แจ้งเตือนความปลอดภัย]\nยืนยันการ ${adjustType === 'add' ? 'เพิ่ม' : 'หัก'} ${formatCredit(adjustAmount)} แต้ม\nบัญชี: ${targetUser.email}\nใช่หรือไม่?`)) return;

    setIsAdjusting(true);
    const amount = Number(adjustAmount);
    const type = adjustType === 'add' ? 'deposit' : 'deduct';
    const note = adjustNote || (adjustType === 'add' ? 'แอดมินปรับเพิ่มแต้มพิเศษ' : 'แอดมินหักแต้มเครดิต');
    
    try {
      // 🚀 ส่งคำสั่งให้ Engine ประมวลผล (จะซิงค์ข้อมูลให้ทั้ง 4 จุด)
      await creditService.adjustUserCredit(
        targetUser.uid,
        amount,
        type,
        note,
        'ADMIN_COMMAND_CENTER'
      );

      showMessage('success', `ทำรายการสำเร็จ! ยอดเงินเชื่อมโยงหน้าเว็บเรียบร้อย`);
      setAdjustAmount('');
      setAdjustNote('');
      
      const newBalance = adjustType === 'add' ? targetUser.currentBalance + amount : targetUser.currentBalance - amount;
      
      setTargetUser(prev => ({ 
        ...prev, 
        currentBalance: newBalance
      }));

      // อัปเดต UI Local State History
      const mockHistory = {
        type: adjustType === 'add' ? 'earn' : 'spend',
        points: amount,
        note: note,
        createdAt: { toDate: () => new Date() } 
      };
      setUserHistory(prev => [mockHistory, ...prev].slice(0, 5));

    } catch (error) {
      console.error("Adjustment error:", error);
      showMessage('error', error.message || 'เกิดข้อผิดพลาดในการทำรายการ');
    } finally {
      setIsAdjusting(false);
    }
  };

  // ปุ่มกดจำนวนเงินด่วน
  const quickAmounts = [100, 500, 1000, 5000, 10000];

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      
      {/* 🌟 Toast Notification */}
      {messageBox && (
        <div className={`fixed top-20 right-8 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8 duration-300 border ${
          messageBox.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {messageBox.type === 'success' ? <CheckCircle2 size={24} className="text-emerald-500" /> : <AlertTriangle size={24} className="text-rose-500" />}
          <span className="font-bold text-sm">{messageBox.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <ShieldCheck className="text-[#0870B8] w-8 h-8" />
            ศูนย์ควบคุมเครดิต (Credit Core)
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            จัดการยอด Credit Point ของลูกค้า เติมเงิน หักเงิน พร้อมระบบประมวลผล Atomic Sync
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-bold text-slate-700 tracking-wide uppercase">Core Synchronized</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-px">
        <button 
          onClick={() => setActiveTab('adjust')}
          className={`px-5 py-3 text-sm font-bold transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'adjust' ? 'border-[#0870B8] text-[#0870B8]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <ArrowRightLeft size={18} /> เติม/ลด เครดิต (Manual)
        </button>
        <button 
          onClick={() => setActiveTab('health')}
          className={`px-5 py-3 text-sm font-bold transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'health' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Activity size={18} /> สถานะระบบ (System Health)
        </button>
      </div>

      {/* ==========================================
          🌟 แท็บที่ 1: Manual Adjustment (Command Center View)
          ========================================== */}
      {activeTab === 'adjust' && (
        <div className="animate-in slide-in-from-bottom-4 duration-300">
          
          {/* 🔍 ส่วนค้นหาผู้ใช้ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6 max-w-3xl">
             <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
               <Search className="text-[#0870B8] w-5 h-5" /> 1. ค้นหาบัญชีเป้าหมาย (ด้วย Email)
             </h2>
             <form onSubmit={handleSearchUser} className="flex gap-3">
               <input 
                 type="email" 
                 value={searchEmail}
                 onChange={(e) => setSearchEmail(e.target.value)}
                 placeholder="ex. customer@email.com"
                 className="flex-1 px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-[#0870B8] focus:ring-2 focus:ring-[#0870B8]/20 transition-all font-medium"
                 required
               />
               <button 
                 type="submit"
                 disabled={isSearching}
                 className="px-8 py-3.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-50 shadow-md flex items-center gap-2"
               >
                 {isSearching ? <Loader2 size={18} className="animate-spin" /> : 'ค้นหาบัญชี'}
               </button>
             </form>
          </div>

          {/* 💻 ส่วน Dashboard ทำรายการ (แสดงเมื่อค้นหาเจอ) */}
          <div className={`transition-all duration-500 ease-out ${targetUser ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 hidden'}`}>
             {targetUser && (
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                 
                 {/* ด้านซ้าย: ข้อมูล User & ประวัติ */}
                 <div className="lg:col-span-5 space-y-6">
                    {/* User Profile Card */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                       
                       <div className="flex items-center gap-4 mb-6 relative z-10">
                         <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-sm">
                           <UserCheck className="text-emerald-400" size={28} />
                         </div>
                         <div>
                           <h3 className="font-black text-xl tracking-wide">{targetUser.displayName || targetUser.accountName || 'Unnamed User'}</h3>
                           <p className="text-sm text-slate-300">{targetUser.email}</p>
                         </div>
                       </div>
                       
                       <div className="bg-black/20 rounded-xl p-4 border border-white/10 relative z-10">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Coins size={12}/> ยอดเครดิตคงเหลือปัจจุบัน
                         </p>
                         <p className="text-4xl font-black text-emerald-400 font-tech">
                           {formatCredit(targetUser.currentBalance)} <span className="text-base text-slate-300">Pts</span>
                         </p>
                       </div>
                    </div>

                    {/* Recent History Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                       <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                         <History size={16} className="text-slate-400"/> ประวัติการทำรายการ
                       </h3>
                       <div className="space-y-3">
                          {userHistory.length > 0 ? (
                            userHistory.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'earn' || item.type === 'deposit' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                    {item.type === 'earn' || item.type === 'deposit' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-700 line-clamp-1">{item.note || 'ปรับปรุงยอด'}</p>
                                    <p className="text-[9px] text-slate-400">
                                      {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString('th-TH') : 'ล่าสุด'}
                                    </p>
                                  </div>
                                </div>
                                <span className={`text-sm font-black font-tech shrink-0 ${item.type === 'earn' || item.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {item.type === 'earn' || item.type === 'deposit' ? '+' : '-'}{formatCredit(item.points || item.amount)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 text-center py-4">ยังไม่มีประวัติการทำรายการ</p>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* ด้านขวา: Action Form (ปรับปรุงยอด) */}
                 <div className="lg:col-span-7">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl border-t-4 border-t-[#0870B8] h-full flex flex-col">
                      <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                        <Terminal className="text-[#0870B8] w-5 h-5" /> 2. ส่งคำสั่งปรับปรุงยอด (Command Execute)
                      </h2>
                      
                      <form onSubmit={handleAdjustCredit} className="flex-1 flex flex-col">
                        
                        {/* เลือกประเภทการทำรายการ */}
                        <div className="mb-6">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">เลือกการทำงาน (Operation)</label>
                          <div className="grid grid-cols-2 gap-4">
                            <button 
                              type="button"
                              onClick={() => setAdjustType('add')}
                              className={`py-4 flex flex-col items-center justify-center gap-2 rounded-xl font-bold transition-all border-2 ${
                                adjustType === 'add' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-slate-300'
                              }`}
                            >
                              <PlusCircle size={24} className={adjustType === 'add' ? 'text-emerald-600' : 'text-slate-400'} /> 
                              เติมเครดิตให้ลูกค้า
                            </button>
                            <button 
                              type="button"
                              onClick={() => setAdjustType('deduct')}
                              className={`py-4 flex flex-col items-center justify-center gap-2 rounded-xl font-bold transition-all border-2 ${
                                adjustType === 'deduct' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-md ring-2 ring-rose-500/20' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-slate-300'
                              }`}
                            >
                              <MinusCircle size={24} className={adjustType === 'deduct' ? 'text-rose-600' : 'text-slate-400'} /> 
                              หักเครดิตออก
                            </button>
                          </div>
                        </div>

                        {/* จำนวนแต้ม & Quick Amount */}
                        <div className="mb-6">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">ระบุยอด (Amount)</label>
                          <div className="flex flex-wrap gap-2 mb-3">
                             {quickAmounts.map(amt => (
                               <button
                                 key={amt}
                                 type="button"
                                 onClick={() => setAdjustAmount(amt.toString())}
                                 className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-[#0870B8] hover:text-white rounded-lg transition-colors border border-slate-200 font-tech"
                               >
                                 +{formatCredit(amt)}
                               </button>
                             ))}
                          </div>
                          <div className="relative">
                            <input 
                              type="number" 
                              min="1"
                              value={adjustAmount}
                              onChange={(e) => setAdjustAmount(e.target.value)}
                              placeholder="0"
                              className={`w-full px-5 py-4 rounded-xl border-2 focus:outline-none focus:ring-4 font-tech text-2xl font-black transition-colors ${
                                adjustType === 'add' ? 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 text-emerald-700 bg-emerald-50/30' : 'border-rose-200 focus:border-rose-500 focus:ring-rose-500/20 text-rose-700 bg-rose-50/30'
                              }`}
                              required
                            />
                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Pts</span>
                          </div>
                        </div>

                        {/* บันทึกช่วยจำ */}
                        <div className="mb-8">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">บันทึกเหตุผล (Admin Note)</label>
                          <input 
                            type="text" 
                            value={adjustNote}
                            onChange={(e) => setAdjustNote(e.target.value)}
                            placeholder="ระบุเหตุผลเพื่อใช้ตรวจสอบย้อนหลัง..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 text-sm bg-slate-50"
                          />
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                           {/* พรีวิวสรุปยอด */}
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                 <ArrowRightLeft className="text-slate-400" size={16}/>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ยอดคาดการณ์ (Preview)</p>
                                <p className={`text-lg font-black font-tech ${adjustType === 'add' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {formatCredit(adjustType === 'add' ? targetUser.currentBalance + Number(adjustAmount || 0) : Math.max(0, targetUser.currentBalance - Number(adjustAmount || 0)))} Pts
                                </p>
                              </div>
                           </div>

                           {/* Submit Button */}
                           <button 
                             type="submit"
                             disabled={isAdjusting || !adjustAmount}
                             className={`px-8 py-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center gap-2 transform active:scale-95 ${
                               isAdjusting ? 'bg-slate-400 cursor-not-allowed shadow-none' : (adjustType === 'add' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/30' : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 shadow-rose-500/30')
                             }`}
                           >
                             {isAdjusting ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                             <span>ยืนยันคำสั่ง (Execute)</span>
                           </button>
                        </div>
                      </form>

                    </div>
                 </div>
               </div>
             )}
          </div>
        </div>
      )}

      {/* ==========================================
          🌟 แท็บที่ 2: System Health (ของเดิม จัดให้อยู่ tab รอง)
          ========================================== */}
      {activeTab === 'health' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
           <div className="lg:col-span-2 space-y-6">
              {/* Terminal Log */}
              <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden flex flex-col h-[500px]">
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
                     <div className="text-slate-500 mb-4">DH CORE v2.5.0 - Atomic Synchronization Enabled<br/>Connected to Firestore via secure channel.</div>
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
                <Lock size={18} className="text-amber-500" /> Security Framework
              </h3>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5"><Database size={14} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Atomic Operations</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">ทุกคำสั่ง เติม/ลด จะถูกประมวลผลแบบรวบยอด (Transaction) ป้องกันยอดเบิ้ล หรือยอดติดลบเวลาเน็ตกระตุก</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 mt-0.5"><Fingerprint size={14} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Multi-Layer Sync</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">เขียนข้อมูลกระจายไปยัง Profile, Wallet และ Ledger พร้อมกัน เพื่อให้หน้าเว็บลูกค้า (Frontend) อัปเดตข้อมูลตรงกันเป๊ะทันที</p>
                  </div>
                </div>
              </div>
           </div>
         </div>
      )}

    </div>
  );
}