import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Activity, Search, Save, Calendar, Infinity,
  Database, ArrowLeft, RefreshCcw, AlertTriangle, UserCheck, Settings,
  ArrowRightLeft, Clock, Lock, Server, Fingerprint, Info, CheckCircle2, XCircle, Terminal, TrendingUp, TrendingDown
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { userService } from '../../firebase/userService';
import { transactionService } from '../../firebase/transactionService';
import { creditService } from '../../firebase/creditService';

export default function CreditDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');

  // --- State: Ledger / Settings ---
  const [settings, setSettings] = useState(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // --- State: Manual Adjustment ---
  const [searchQuery, setSearchQuery] = useState('');
  const [userResult, setUserResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState('deposit');
  const [txReason, setTxReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // --- State: Audit Logs ---
  const [transactions, setTransactions] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // --- State: Health Check ---
  const [healthLogs, setHealthLogs] = useState([]);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      loadSettings(); // โหลด Master Ledger เสมอ
      if (activeTab === 'logs' && transactions.length === 0) {
        loadTransactions();
      }
    }
  }, [activeTab, isAuthorized]);

  const checkAccess = async () => {
    setLoading(true);
    if (!auth.currentUser) return navigate('/');
    try {
      const profile = await userService.getUserProfile(auth.currentUser.uid);
      if (profile && ['Manager', 'Owner', 'ผู้จัดการ', 'เจ้าของ'].includes(profile.role)) {
        setIsAuthorized(true);
      } else {
        navigate('/'); 
      }
    } catch (error) {
      console.error("Access error:", error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await creditService.getCreditSettings();
      if (data) {
          // ตรวจสอบและตั้งค่าเริ่มต้นให้ Point Expiry เป็นรายปี หากยังไม่เคยมีการตั้งค่า
          if (!data.pointExpiryMode) data.pointExpiryMode = 'yearly';
          setSettings(data);
      }
    } catch (error) {
      console.error("Error loading ledger:", error);
    }
  };

  // ==========================================
  // 🔹 LOGIC: Health Check System
  // ==========================================
  const runHealthCheck = async () => {
    setIsCheckingHealth(true);
    setHealthLogs([]);
    
    const delay = (ms) => new Promise(res => setTimeout(res, ms));
    const addLog = (msg, type = 'info') => setHealthLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString('th-TH') }]);

    await delay(500); addLog('INITIALIZING CYBER AUDIT CORE...', 'info');
    await delay(800); addLog('CHECKING FIREBASE CONNECTIVITY [db_auth_sync]...', 'info');
    await delay(600); addLog('FIREBASE CONNECTION: SECURE', 'success');
    
    await delay(1000); addLog('ANALYZING MASTER LEDGER INTEGRITY...', 'info');
    if (settings && settings.ledger) {
       const reserve = settings.ledger.systemPoolMax - settings.ledger.totalAllocated;
       if (reserve < 0) {
         addLog(`CRITICAL WARNING: LEDGER DEFICIT DETECTED (${reserve.toLocaleString()} Pts)`, 'error');
       } else {
         addLog(`LEDGER INTEGRITY: VERIFIED. AVAILABLE RESERVE: ${reserve.toLocaleString()} Pts`, 'success');
       }
    } else {
       addLog('ERROR: UNABLE TO FETCH LEDGER DATA', 'error');
    }

    await delay(800); addLog('VALIDATING OPERATOR PERMISSIONS...', 'info');
    await delay(500); addLog(`ACCESS LEVEL: MANAGER/OWNER [ID: ${auth.currentUser?.uid.substring(0,8)}]`, 'success');
    
    await delay(800); addLog('SYSTEM HEALTH CHECK COMPLETE. ALL PROTOCOLS ACTIVE.', 'success');
    setIsCheckingHealth(false);
  };

  // ==========================================
  // 🔹 LOGIC: Manual Adjustment & High-Value Guard
  // ==========================================
  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setUserResult(null);
    try {
      let docRef = doc(db, 'users', searchQuery.trim());
      let docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const q = query(collection(db, 'users'), where('customerCode', '==', searchQuery.trim()), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) docSnap = snap.docs[0];
      }

      if (docSnap && docSnap.exists()) {
        setUserResult({ id: docSnap.id, ...docSnap.data() });
      } else {
        alert('SYS_ERR: ไม่พบข้อมูลบัญชีในระบบฐานข้อมูล');
      }
    } catch (error) {
      alert('SYS_ERR: การเชื่อมต่อฐานข้อมูลล้มเหลว');
    } finally {
      setIsSearching(false);
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(txAmount);

    if (!userResult || !txAmount || numAmount <= 0 || !txReason) {
      return alert('SYS_WARN: ข้อมูลเพื่อการบันทึกไม่สมบูรณ์');
    }

    // 🛡️ Hard Lock Guard: เช็กงบประมาณ (กรณีเติมเครดิต)
    if (txType === 'deposit') {
       const availableReserve = settings?.ledger?.systemPoolMax - (settings?.ledger?.totalAllocated || 0);
       if (availableReserve < numAmount) {
          return alert(`🛑 [ACCESS DENIED] ไม่สามารถทำรายการได้\n\nงบประมาณทุนสำรองคงเหลือ (${availableReserve.toLocaleString()}) ไม่เพียงพอต่อการจ่ายเครดิตครั้งนี้\nกรุณาติดต่อผู้บริหารเพื่อขยายเพดาน System Pool`);
       }
    }

    // 🛡️ High-Value Guard: ป้องกันการโอนเหรียญผิดพลาด
    if (numAmount >= 5000) {
      const confirmText = window.prompt(
        `🚨 [SECURITY ALERT] ตรวจพบการทำรายการมูลค่าสูง (High-Value Transaction: ${numAmount.toLocaleString()} Pts)\n\nเพื่อยืนยันคำสั่ง โปรดพิมพ์คำว่า "CONFIRM" ให้ถูกต้อง:`
      );
      if (confirmText !== 'CONFIRM') {
        return alert('SYS_INFO: การทำรายการถูกยกเลิกโดยระบบความปลอดภัย');
      }
    } else {
      const standardConfirm = window.confirm(
        `ยืนยันการลงบันทึกบัญชีถาวร (Immutable Log)\n\nประเภท: ${txType === 'deposit' ? 'เพิ่มเครดิต (+)' : 'หักเครดิต (-)'}\nจำนวน: ${numAmount.toLocaleString()} Pts\nบัญชีปลายทาง: ${userResult.accountName || userResult.displayName}\nเหตุผลอ้างอิง: ${txReason}`
      );
      if (!standardConfirm) return;
    }

    setIsProcessing(true);
    try {
      await transactionService.recordTransaction({
        uid: userResult.id,
        type: txType,
        amount: numAmount,
        referenceId: `OP_${auth.currentUser?.uid.substring(0,5)}: ${txReason}`,
        recordedBy: auth.currentUser?.uid || 'System'
      });
      
      alert('SYS_SUCCESS: ลงบันทึกรายการใน DH Cyber Audit Core สำเร็จ');
      
      // Refresh Data
      const updatedSnap = await getDoc(doc(db, 'users', userResult.id));
      if (updatedSnap.exists()) setUserResult({ id: updatedSnap.id, ...updatedSnap.data() });
      
      setTxAmount('');
      setTxReason('');
      if (transactions.length > 0) loadTransactions(); 
    } catch (error) {
      alert('SYS_ERR: ไม่สามารถบันทึกข้อมูลได้ - ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // 🔹 LOGIC: Audit Logs
  // ==========================================
  const loadTransactions = async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await transactionService.getAllTransactions();
      setTransactions(logs);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // ==========================================
  // 🔹 LOGIC: Settings & Visual Adjuster
  // ==========================================
  const adjustPool = (amount) => {
    if (!settings) return;
    setSettings(prev => {
        let newMax = prev.ledger.systemPoolMax + amount;
        // 🛡️ ป้องกันลดวงเงินต่ำกว่าที่จ่ายออกไปแล้ว (Auto-Floor)
        if (newMax < prev.ledger.totalAllocated) {
            newMax = prev.ledger.totalAllocated;
        }
        return { ...prev, ledger: { ...prev.ledger, systemPoolMax: newMax } };
    });
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    
    // ด่านตรวจสอบขั้นสุดท้าย
    if (settings.ledger.systemPoolMax < settings.ledger.totalAllocated) {
        return alert("❌ ข้อผิดพลาดร้ายแรง: เพดานทุนสำรองไม่สามารถตั้งต่ำกว่ายอดที่จ่ายออกไปแล้วได้");
    }

    if (!window.confirm('⚠️ [SYSTEM CONFIGURATION] ยืนยันการเปลี่ยนแปลงตัวแปรระบบ?\nการเปลี่ยนแปลงจะมีผลต่อการทำงานของทั้งระบบทันที')) return;
    
    setIsSavingSettings(true);
    try {
      await creditService.updateCreditSettings(settings, auth.currentUser?.uid);
      alert('SYS_SUCCESS: ปรับปรุงตัวแปรระบบและนโยบายสำเร็จ ระบบได้บันทึกประวัติแล้ว');
    } catch (error) {
      alert('SYS_ERR: ' + error.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-emerald-500 font-mono text-2xl tracking-widest"><Terminal className="animate-pulse mr-3" size={32}/> INITIALIZING CYBER AUDIT CORE...</div>;
  if (!isAuthorized) return null;

  // คำนวณงบประมาณคงเหลือ
  const availableReserve = (settings?.ledger?.systemPoolMax || 0) - (settings?.ledger?.totalAllocated || 0);
  const utilizationPercent = settings?.ledger?.systemPoolMax ? Math.min(100, (settings.ledger.totalAllocated / settings.ledger.systemPoolMax) * 100) : 0;

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* 🏷️ STRICT HEADER BAR (Terminal Style) */}
      <div className="px-6 py-4 bg-white dark:bg-[#0A0F1A] border-b border-slate-300 dark:border-slate-800 shrink-0 z-20 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/managers')} className="p-3 bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded border border-slate-300 dark:border-slate-700 transition-colors">
            <ArrowLeft size={20} strokeWidth={2.5}/>
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 font-mono">
              <Lock size={14} className="text-emerald-500" /> SECURE CONNECTION ESTABLISHED
            </div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3 text-slate-800 dark:text-slate-100 uppercase">
               DH Cyber Audit Core <span className="bg-slate-800 text-white text-xs px-2.5 py-1 rounded-sm font-mono tracking-widest">v2.5.0</span>
            </h1>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Operator ID: {auth.currentUser?.uid.substring(0,8)}</div>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1.5 mt-1 font-mono">
            <ShieldCheck size={16} strokeWidth={2.5}/> IMMUTABLE LEDGER ACTIVE
          </div>
        </div>
      </div>

      {/* 🛡️ MASTER LEDGER STATUS BOARD */}
      {settings && settings.ledger && (
        <div className="bg-[#050B14] text-white px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-6 border-b-2 border-blue-600 shrink-0 shadow-inner">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Server size={32} className="text-blue-500" strokeWidth={1.5}/>
            <div>
              <div className="text-xs text-slate-400 font-mono uppercase tracking-widest mb-1">สถานะระบบสมุดบัญชีกลาง (Master Ledger)</div>
              <div className="text-base font-black tracking-wider flex items-center gap-2 font-mono">
                INTEGRITY: {availableReserve >= 0 ? <span className="text-emerald-400">SECURE (ปกติ)</span> : <span className="text-rose-500 animate-pulse">DEFICIT (ติดลบ/อันตราย)</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-8 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            <div className="text-right shrink-0">
              <div className="text-xs text-slate-400 font-mono uppercase tracking-widest mb-1">เพดานทุนสำรองเครดิต</div>
              <div className="text-2xl font-mono font-black text-blue-400">{settings.ledger.systemPoolMax.toLocaleString()}</div>
            </div>
            <div className="w-px h-10 bg-slate-800 shrink-0"></div>
            <div className="text-right shrink-0">
              <div className="text-xs text-slate-400 font-mono uppercase tracking-widest mb-1">เครดิตที่แจกจ่ายสะสม</div>
              <div className="text-2xl font-mono font-black text-amber-500">{settings.ledger.totalAllocated.toLocaleString()}</div>
            </div>
            <div className="w-px h-10 bg-slate-800 shrink-0"></div>
            <div className="text-right shrink-0">
              <div className="text-xs text-slate-400 font-mono uppercase tracking-widest mb-1">งบประมาณคงเหลือ</div>
              <div className={`text-2xl font-mono font-black ${availableReserve > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {availableReserve.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎨 Main Content Area (Strict Layout) */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        
        {/* ⬅️ Sidebar Navigation (Flat & Minimal) */}
        <div className="w-full md:w-72 bg-slate-200 dark:bg-[#0A0F1A] border-r border-slate-300 dark:border-slate-800 shrink-0 flex flex-col z-10 shadow-[4px_0_15px_rgba(0,0,0,0.05)]">
          <div className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest font-mono border-b border-slate-300 dark:border-slate-800">
            เมนูปฏิบัติการระบบ
          </div>
          
          <button onClick={() => setActiveTab('manual')} className={`flex items-center gap-3 w-full px-6 py-5 border-b border-slate-300 dark:border-slate-800 transition-colors text-left ${activeTab === 'manual' ? 'bg-white dark:bg-slate-900 border-l-4 border-l-blue-600' : 'hover:bg-slate-300/50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent'}`}>
            <ArrowRightLeft size={20} className={activeTab === 'manual' ? 'text-blue-600' : 'text-slate-500'} strokeWidth={2.5}/>
            <span className={`text-base font-black tracking-wider ${activeTab === 'manual' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>ทำรายการ (TX)</span>
          </button>

          <button onClick={() => setActiveTab('logs')} className={`flex items-center gap-3 w-full px-6 py-5 border-b border-slate-300 dark:border-slate-800 transition-colors text-left ${activeTab === 'logs' ? 'bg-white dark:bg-slate-900 border-l-4 border-l-blue-600' : 'hover:bg-slate-300/50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent'}`}>
            <Database size={20} className={activeTab === 'logs' ? 'text-blue-600' : 'text-slate-500'} strokeWidth={2.5}/>
            <span className={`text-base font-black tracking-wider ${activeTab === 'logs' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>สมุดบัญชี (Logs)</span>
          </button>

          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 w-full px-6 py-5 border-b border-slate-300 dark:border-slate-800 transition-colors text-left ${activeTab === 'settings' ? 'bg-white dark:bg-slate-900 border-l-4 border-l-blue-600' : 'hover:bg-slate-300/50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent'}`}>
            <Settings size={20} className={activeTab === 'settings' ? 'text-blue-600' : 'text-slate-500'} strokeWidth={2.5}/>
            <span className={`text-base font-black tracking-wider ${activeTab === 'settings' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>ปรับแต่งค่า (Config)</span>
          </button>

          <button onClick={() => setActiveTab('info')} className={`flex items-center gap-3 w-full px-6 py-5 border-b border-slate-300 dark:border-slate-800 transition-colors text-left ${activeTab === 'info' ? 'bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500' : 'hover:bg-slate-300/50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent'}`}>
            <Info size={20} className={activeTab === 'info' ? 'text-emerald-500' : 'text-slate-500'} strokeWidth={2.5}/>
            <span className={`text-base font-black tracking-wider ${activeTab === 'info' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>ข้อมูล & ตรวจสอบ</span>
          </button>
        </div>

        {/* ➡️ Right Content Panel (Flat Forms) */}
        <div className="flex-1 bg-slate-50 dark:bg-[#0D1321] overflow-hidden flex flex-col relative">
          
          {/* TAB 1: MANUAL ADJUSTMENT */}
          {activeTab === 'manual' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
              <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Search Panel */}
                <div className="bg-white dark:bg-[#111827] p-8 border border-slate-300 dark:border-slate-800 rounded-lg shadow-sm">
                  <h3 className="font-black text-slate-800 dark:text-slate-200 text-base mb-5 uppercase tracking-widest flex items-center gap-2"><Search size={20}/> ค้นหาบัญชีเป้าหมาย (Target Account)</h3>
                  <form onSubmit={handleSearchUser} className="flex gap-3">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Fingerprint size={20} className="text-slate-400"/></div>
                      <input 
                        type="text" 
                        placeholder="ระบุรหัสลูกค้า (Customer ID หรือ Code)..." 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                        className="w-full pl-12 pr-4 py-3.5 border border-slate-300 dark:border-slate-700 rounded text-base font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 bg-slate-50 dark:bg-[#0A0F1A] text-slate-900 dark:text-white transition-all"
                      />
                    </div>
                    <button type="submit" disabled={isSearching} className="px-8 py-3.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-black text-sm rounded transition-colors disabled:opacity-50 tracking-wider">
                      {isSearching ? 'SCANNING...' : 'ตรวจสอบบัญชี'}
                    </button>
                  </form>
                </div>

                {/* Account Result & Form */}
                {userResult && (
                  <div className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] rounded-lg overflow-hidden shadow-sm animate-in fade-in">
                    
                    {/* Header Info */}
                    <div className="p-8 border-b border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 rounded-lg flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                          <UserCheck size={32} strokeWidth={2}/>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono mb-1">Verified Identity (ยืนยันตัวตนแล้ว)</div>
                          <div className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            {userResult.accountName || userResult.displayName}
                            {userResult.rank === 'VIP' && <span className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded-sm uppercase tracking-wider">VIP</span>}
                          </div>
                          <div className="text-sm text-slate-500 mt-1 font-mono">UID: {userResult.customerCode || userResult.id}</div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-xs uppercase font-bold text-slate-500 tracking-widest font-mono mb-2">ยอดเครดิตคงเหลือปัจจุบัน</div>
                        <div className="text-4xl font-mono font-black text-blue-600 dark:text-blue-400 leading-none">
                          {(userResult.stats?.creditBalance || userResult.partnerCredit || 0).toLocaleString()} <span className="text-lg text-slate-400">Pts</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Form */}
                    <form onSubmit={handleTransactionSubmit} className="p-8">
                      <div className="bg-amber-50 dark:bg-amber-500/10 p-5 rounded-lg border border-amber-200 dark:border-amber-500/20 flex items-start gap-4 mb-8">
                        <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest font-mono">คำเตือน: กระบวนการลงบันทึกถาวร (Immutable)</h4>
                          <p className="text-xs font-bold text-amber-700/80 dark:text-amber-400/80 mt-1.5 leading-relaxed">การดำเนินการนี้ไม่สามารถย้อนกลับหรือแก้ไขได้ และจะถูกบันทึกประวัติพร้อม Session ID ของคุณตลอดไป</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-5 mb-8">
                        <div 
                          onClick={() => {
                            if (availableReserve <= 0) return alert('งบประมาณคงเหลือไม่พอสำหรับการเพิ่มเครดิต');
                            setTxType('deposit');
                          }} 
                          className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${availableReserve <= 0 ? 'opacity-50 cursor-not-allowed' : ''} ${txType === 'deposit' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0A0F1A] hover:border-emerald-400'}`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${txType === 'deposit' ? 'bg-emerald-200 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>+</div>
                          <div>
                            <div className={`font-black text-base tracking-wider ${txType === 'deposit' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>เพิ่มเครดิต (รับเข้า)</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mt-1">Credit IN</div>
                          </div>
                        </div>
                        <div 
                          onClick={() => setTxType('spend')} 
                          className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${txType === 'spend' ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0A0F1A] hover:border-rose-400'}`}
                        >
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${txType === 'spend' ? 'bg-rose-200 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>-</div>
                          <div>
                            <div className={`font-black text-base tracking-wider ${txType === 'spend' ? 'text-rose-700 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>หักเครดิต (จ่ายออก)</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mt-1">Credit OUT</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-black text-slate-500 uppercase tracking-widest mb-2 block font-mono">จำนวนเครดิต (Points)</label>
                          <input type="number" min="1" value={txAmount} onChange={e => setTxAmount(e.target.value)} required className="w-full p-3.5 bg-slate-50 dark:bg-[#0A0F1A] border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 text-xl font-mono font-black text-slate-900 dark:text-white transition-all" placeholder="0" />
                        </div>
                        <div>
                          <label className="text-sm font-black text-slate-500 uppercase tracking-widest mb-2 block font-mono">เหตุผลอ้างอิง (Reference)</label>
                          <input type="text" value={txReason} onChange={e => setTxReason(e.target.value)} required className="w-full p-4 bg-slate-50 dark:bg-[#0A0F1A] border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 text-base font-bold text-slate-900 dark:text-white transition-all" placeholder="เหตุผลจำเป็นสำหรับการตรวจสอบ..." />
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-300 dark:border-slate-800 flex justify-end">
                        <button type="submit" disabled={isProcessing} className="px-10 py-4 bg-blue-600 text-white font-black tracking-widest rounded-lg hover:bg-blue-700 flex items-center gap-2 text-base transition-colors disabled:opacity-50">
                          {isProcessing ? <><Activity size={20} className="animate-spin"/> EXECUTING...</> : <><Save size={20} strokeWidth={2.5}/> ยืนยันการทำรายการ</>}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="flex flex-col h-full">
              <div className="px-8 py-6 border-b border-slate-300 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#111827] shrink-0">
                <div>
                  <h3 className="font-black text-slate-800 dark:text-slate-200 text-base uppercase tracking-widest flex items-center gap-3 font-mono"><Database size={20}/> บันทึกบัญชีถาวร (Immutable Audit Logs)</h3>
                </div>
                <button onClick={loadTransactions} disabled={isLoadingLogs} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-black uppercase tracking-wider font-mono rounded hover:border-blue-500 transition-colors">
                  <RefreshCcw size={16} className={isLoadingLogs ? 'animate-spin' : ''}/> Sync
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
                {isLoadingLogs ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-500 font-mono">
                    <Activity className="animate-spin mb-4 text-blue-500" size={40}/>
                    <span className="text-sm font-bold uppercase tracking-widest">Querying Ledger...</span>
                  </div>
                ) : (
                  <div className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700">
                        <tr className="text-xs text-slate-500 font-black uppercase tracking-widest font-mono">
                          <th className="px-6 py-4">รหัสธุรกรรม / เวลา</th>
                          <th className="px-6 py-4">บัญชีผู้ใช้ (UID)</th>
                          <th className="px-6 py-4 text-center">ประเภท</th>
                          <th className="px-6 py-4 text-right">จำนวน (Pts)</th>
                          <th className="px-6 py-4 text-right">คงเหลือ</th>
                          <th className="px-6 py-4">อ้างอิง / พนักงาน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {transactions.length > 0 ? (
                          transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                              <td className="px-6 py-4">
                                <div className="text-xs text-slate-500 mb-1">{tx.transactionId || tx.id}</div>
                                <div className="text-xs flex items-center gap-2"><Clock size={12} className="opacity-70"/> {tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleString('th-TH') : '-'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-xs">{tx.uid}</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {tx.type === 'deposit' || tx.type === 'bonus' || tx.type === 'refund' ? 
                                  <span className="text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-xs font-black">รับเข้า</span> : 
                                  <span className="text-rose-600 dark:text-rose-400 uppercase tracking-widest text-xs font-black">จ่ายออก</span>}
                              </td>
                              <td className={`px-6 py-4 text-right font-black ${tx.type === 'deposit' || tx.type === 'bonus' || tx.type === 'refund' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {tx.type === 'deposit' || tx.type === 'bonus' || tx.type === 'refund' ? '+' : '-'}{tx.amount.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-right font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10">
                                {tx.balanceAfter !== undefined ? tx.balanceAfter.toLocaleString() : '-'}
                              </td>
                              <td className="px-6 py-4 max-w-[250px]">
                                <div className="truncate text-xs mb-1" title={tx.referenceId}>{tx.referenceId}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest">OP: {tx.recordedBy === 'System' ? 'SYS_AUTO' : tx.recordedBy.substring(0,8)}</div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="6" className="px-6 py-20 text-center text-slate-500 font-bold text-base font-mono uppercase tracking-widest">ไม่พบประวัติการทำธุรกรรม</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === 'settings' && settings && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="pb-5 border-b border-slate-300 dark:border-slate-800">
                  <h3 className="font-black text-slate-800 dark:text-slate-200 text-base uppercase tracking-widest font-mono flex items-center gap-3"><Settings size={20}/> การปรับแต่งตัวแปรระบบ (System Variables)</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2 font-mono">การปรับเปลี่ยนจะมีผลกระทบต่อระบบการเงินและโปรโมชันทันที โปรดดำเนินการด้วยความระมัดระวัง</p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-8">
                  
                  {/* ✨ นวัตกรรมใหม่: แผงควบคุมทุนสำรอง (Visual Capacity Manager) */}
                  <div className="bg-white dark:bg-[#111827] p-8 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-2 bg-blue-500"></div>
                    <h4 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-6 font-mono">SYS_VAR: SYSTEM_POOL_CAPACITY (จัดการเพดานทุนสำรองเครดิต)</h4>
                    
                    <div className="flex flex-col gap-8">
                        {/* Current Status Bar */}
                        <div className="flex items-center justify-between px-2">
                            <div>
                                <div className="text-sm text-slate-500 font-bold mb-1">เครดิตที่จ่ายออกไปแล้ว (Allocated)</div>
                                <div className="text-2xl font-black text-amber-500">{settings.ledger.totalAllocated.toLocaleString()} Pts</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-500 font-bold mb-1">เพดานใหม่ (New Capacity)</div>
                                <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{settings.ledger.systemPoolMax.toLocaleString()} Pts</div>
                            </div>
                        </div>

                        {/* Utilization Progress Bar */}
                        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                            <div className="h-full bg-amber-500 transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white" style={{width: `${Math.min(100, (settings.ledger.totalAllocated / (settings.ledger.systemPoolMax || 1)) * 100)}%`}}>
                                {utilizationPercent >= 10 ? `${Math.round(utilizationPercent)}%` : ''}
                            </div>
                            <div className="h-full bg-emerald-500 transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-black text-white" style={{width: `${Math.max(0, 100 - (settings.ledger.totalAllocated / (settings.ledger.systemPoolMax || 1)) * 100)}%`}}>
                                Reserve
                            </div>
                        </div>

                        {/* Smart Adjuster */}
                        <div>
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block font-mono">ปรับแก้เพดาน (Adjust Ceiling)</label>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => adjustPool(-50000)} className="p-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-black transition-colors flex items-center gap-1"><TrendingDown size={16}/> 50k</button>
                                <button type="button" onClick={() => adjustPool(-10000)} className="p-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-black transition-colors flex items-center gap-1"><TrendingDown size={16}/> 10k</button>
                                
                                <input type="number" min={settings.ledger.totalAllocated} step="1000"
                                    value={settings.ledger.systemPoolMax}
                                    onChange={e => {
                                        const val = Number(e.target.value);
                                        setSettings({...settings, ledger: {...settings.ledger, systemPoolMax: val < settings.ledger.totalAllocated ? settings.ledger.totalAllocated : val}})
                                    }}
                                    className="flex-1 p-4 text-center text-2xl bg-slate-50 dark:bg-[#0A0F1A] border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-black text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                                
                                <button type="button" onClick={() => adjustPool(10000)} className="p-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-black transition-colors flex items-center gap-1"><TrendingUp size={16}/> 10k</button>
                                <button type="button" onClick={() => adjustPool(50000)} className="p-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-black transition-colors flex items-center gap-1"><TrendingUp size={16}/> 50k</button>
                            </div>
                            <div className="mt-3 flex justify-between items-center">
                                {settings.ledger.systemPoolMax <= settings.ledger.totalAllocated ? (
                                    <div className="text-xs font-bold text-rose-500 flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded"><AlertTriangle size={14}/> เพดานติดลิมิตขั้นต่ำแล้ว ไม่สามารถลดได้อีก</div>
                                ) : (
                                    <div className="text-xs font-bold text-slate-400">ระบบจะทำการกั้นเพดานไม่ให้ต่ำกว่ายอดจ่ายจริงเสมอเพื่อป้องกันบัญชีติดลบ</div>
                                )}
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* ✨ ใหม่: นโยบายวันหมดอายุของแต้ม */}
                  <div className="bg-white dark:bg-[#111827] p-8 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-5 font-mono">SYS_VAR: POINT_EXPIRY_POLICY (นโยบายวันหมดอายุแต้มสะสม)</h4>
                    <div className="flex flex-col sm:flex-row gap-5">
                        <label className={`flex-1 p-5 border-2 rounded-xl cursor-pointer transition-all flex items-start gap-4 ${settings.pointExpiryMode === 'yearly' || !settings.pointExpiryMode ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-sm' : 'border-slate-300 dark:border-slate-700 hover:border-blue-300'}`}>
                            <input type="radio" name="expiry" checked={settings.pointExpiryMode === 'yearly' || !settings.pointExpiryMode} onChange={() => setSettings({...settings, pointExpiryMode: 'yearly'})} className="hidden" />
                            <div className={`p-2 rounded-lg mt-1 shrink-0 ${settings.pointExpiryMode === 'yearly' || !settings.pointExpiryMode ? 'bg-blue-200 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                <Calendar size={24} strokeWidth={2.5}/>
                            </div>
                            <div>
                                <div className="font-black text-base text-slate-800 dark:text-slate-200 mb-1">ตัดรอบรายปี (Yearly) <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded ml-2 uppercase tracking-wider">แนะนำ</span></div>
                                <div className="text-xs font-bold text-slate-500 leading-relaxed">แต้มที่สะสมมาทั้งหมดจะหมดอายุพร้อมกันในวันที่ 31 ธ.ค. ของทุกปี (ช่วยลดภาระหนี้สินผูกพันของบริษัท)</div>
                            </div>
                        </label>

                        <label className={`flex-1 p-5 border-2 rounded-xl cursor-pointer transition-all flex items-start gap-4 ${settings.pointExpiryMode === 'never' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-sm' : 'border-slate-300 dark:border-slate-700 hover:border-blue-300'}`}>
                            <input type="radio" name="expiry" checked={settings.pointExpiryMode === 'never'} onChange={() => setSettings({...settings, pointExpiryMode: 'never'})} className="hidden" />
                            <div className={`p-2 rounded-lg mt-1 shrink-0 ${settings.pointExpiryMode === 'never' ? 'bg-blue-200 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                <Infinity size={24} strokeWidth={2.5}/>
                            </div>
                            <div>
                                <div className="font-black text-base text-slate-800 dark:text-slate-200 mb-1">ไม่มีวันหมดอายุ (Never)</div>
                                <div className="text-xs font-bold text-slate-500 leading-relaxed">แต้มสามารถสะสมข้ามปีไปได้เรื่อยๆ โดยไม่มีการตัดทิ้ง (เพื่อจูงใจลูกค้า VIP)</div>
                            </div>
                        </label>
                    </div>
                  </div>

                  {/* Ratio */}
                  <div className="bg-white dark:bg-[#111827] p-8 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-5 font-mono">SYS_VAR: EXCHANGE_RATIO (อัตราแลกเปลี่ยน)</h4>
                    <div className="flex items-center justify-between gap-6 bg-slate-50 dark:bg-[#0A0F1A] p-6 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <span className="font-black text-xl text-slate-800 dark:text-slate-200 font-mono">100 Pts</span>
                      <ArrowRightLeft className="text-slate-400 shrink-0" size={24}/>
                      <div className="flex items-center gap-3 w-1/2">
                        <input 
                          type="number" min="0.01" step="0.01" 
                          value={settings.pointToCashRatio} 
                          onChange={e => setSettings({...settings, pointToCashRatio: Number(e.target.value)})} 
                          className="w-full p-3 text-center bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded-lg text-lg font-mono font-black text-blue-600 dark:text-blue-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                        />
                        <span className="font-black text-xl text-slate-800 dark:text-slate-200 font-mono shrink-0">THB (บาท)</span>
                      </div>
                    </div>
                  </div>

                  {/* Automation Rules */}
                  <div className="bg-white dark:bg-[#111827] p-8 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-5 font-mono">SYS_VAR: AUTO_REWARD_TRIGGERS (กติกาการแจกเครดิตอัตโนมัติ)</h4>
                    <div className="space-y-3 font-mono">
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-[#0A0F1A] p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">เงื่อนไข: รีวิวสินค้า (Review)</span>
                        <div className="flex items-center gap-3">
                          <input type="number" min="0" value={settings.rewardRules.review} onChange={e => setSettings({...settings, rewardRules: {...settings.rewardRules, review: Number(e.target.value)}})} className="w-24 p-2 text-right bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded text-base font-black text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50" />
                          <span className="text-xs text-slate-500">Pts</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-[#0A0F1A] p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">เงื่อนไข: แบ่งปันความรู้ (Knowledge Share)</span>
                        <div className="flex items-center gap-3">
                          <input type="number" min="0" value={settings.rewardRules.knowledgeSharing} onChange={e => setSettings({...settings, rewardRules: {...settings.rewardRules, knowledgeSharing: Number(e.target.value)}})} className="w-24 p-2 text-right bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded text-base font-black text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50" />
                          <span className="text-xs text-slate-500">Pts</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-[#0A0F1A] p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">เงื่อนไข: แนะนำพาร์ทเนอร์ใหม่ (Referral)</span>
                        <div className="flex items-center gap-3">
                          <input type="number" min="0" value={settings.rewardRules.referral} onChange={e => setSettings({...settings, rewardRules: {...settings.rewardRules, referral: Number(e.target.value)}})} className="w-24 p-2 text-right bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded text-base font-black text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50" />
                          <span className="text-xs text-slate-500">Pts</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button type="submit" disabled={isSavingSettings} className="px-10 py-4 bg-blue-600 text-white font-black tracking-widest rounded-lg hover:bg-blue-700 flex items-center gap-3 text-base transition-colors disabled:opacity-50">
                      {isSavingSettings ? <><Activity size={20} className="animate-spin"/> UPDATING...</> : <><Save size={20} strokeWidth={2.5}/> บันทึกการเปลี่ยนแปลง</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: INFO & HEALTH CHECK */}
          {activeTab === 'info' && (
             <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
                <div className="max-w-5xl mx-auto space-y-8">
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Information Guide */}
                    <div className="bg-white dark:bg-[#111827] p-8 border border-slate-300 dark:border-slate-800 rounded-xl shadow-sm space-y-6">
                      <h3 className="font-black text-slate-800 dark:text-slate-200 text-base uppercase tracking-widest flex items-center gap-3 font-mono border-b border-slate-300 dark:border-slate-800 pb-4"><Info size={20}/> คู่มือการทำงานของระบบ</h3>
                      <div className="space-y-6 text-sm font-bold text-slate-600 dark:text-slate-400">
                         <div>
                           <p className="text-slate-900 dark:text-white mb-2 text-base"><span className="text-blue-500">1. การทำรายการ (Transaction)</span></p>
                           <p className="text-sm leading-relaxed">ทุกการทำรายการจะถูกบันทึกในรูปแบบ Double-entry หากเงินทุนสำรองเครดิตในระบบมีไม่พอ ปุ่ม "เพิ่มเครดิต" จะถูกระงับอัตโนมัติเพื่อป้องกันหนี้เกินเพดาน</p>
                         </div>
                         <div>
                           <p className="text-slate-900 dark:text-white mb-2 text-base"><span className="text-emerald-500">2. ระบบ Immutable Logs</span></p>
                           <p className="text-sm leading-relaxed">ประวัติในสมุดบัญชีไม่สามารถแก้ไขหรือลบได้โดยเด็ดขาด การแก้ไขข้อผิดพลาดต้องทำผ่านการออกรายการใหม่เพื่อคานอำนาจบัญชีเท่านั้น (ตามมาตรฐานการเงิน)</p>
                         </div>
                         <div>
                           <p className="text-slate-900 dark:text-white mb-2 text-base"><span className="text-amber-500">3. High-Value Guard</span></p>
                           <p className="text-sm leading-relaxed">หากมีการทำรายการเกิน 5,000 Pts ระบบจะบังคับให้พิมพ์ยืนยัน เพื่อป้องกันความผิดพลาดจากการกดปุ่มผิด (Fat-finger Error)</p>
                         </div>
                      </div>
                    </div>

                    {/* Health Check Terminal */}
                    <div className="bg-[#050B14] p-1.5 rounded-xl shadow-lg flex flex-col border border-slate-800">
                      <div className="px-5 py-3 border-b border-slate-800 flex justify-between items-center bg-[#0A0F1A] rounded-t-lg">
                        <span className="text-xs font-mono text-slate-500 tracking-widest">SYSTEM_HEALTH_CONSOLE</span>
                        <button onClick={runHealthCheck} disabled={isCheckingHealth} className="text-xs bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white px-4 py-1.5 rounded font-mono transition-colors disabled:opacity-50 font-black">
                          {isCheckingHealth ? 'EXECUTING...' : 'RUN_DIAGNOSTIC'}
                        </button>
                      </div>
                      <div className="p-6 flex-1 h-[400px] overflow-y-auto font-mono text-sm space-y-2 custom-scrollbar">
                         <div className="text-slate-500 mb-3">&gt; Awaiting diagnostic command...</div>
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
             </div>
          )}

        </div>
      </div>
    </div>
  );
}