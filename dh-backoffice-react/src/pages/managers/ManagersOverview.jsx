import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, CheckSquare, Activity, Bell, AlertTriangle, 
  CheckCircle2, Settings, ShieldAlert, X, Edit2, Save,
  Calculator, Receipt, History, Users, Search, Plus, Trash2,
  Megaphone, BarChart3, PackagePlus, FileText, PieChart, RefreshCcw, Link,
  Wrench, ArrowLeftRight, Crown, Gift, Coins, Wallet, Sun, Moon, Sunrise,
  Server, ExternalLink, ChevronRight, Truck
} from 'lucide-react';
import { collection, getDocs, query, limit, where, doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { userService } from '../../firebase/userService';
import { todoService } from '../../firebase/todoService';
import { inventoryService } from '../../firebase/inventoryService';
import { claimService } from '../../firebase/claimService'; 

import GlobalSettingsPanel from '../../components/managers/GlobalSettingsPanel';

const ToolCard = ({ title, subtitle, icon: Icon, colorTheme, onClick, badge, disabled }) => {
  const themes = {
    indigo: 'text-indigo-600 bg-indigo-500/10 group-hover:bg-indigo-500/20',
    orange: 'text-orange-600 bg-orange-500/10 group-hover:bg-orange-500/20',
    emerald: 'text-emerald-600 bg-emerald-500/10 group-hover:bg-emerald-500/20',
    teal: 'text-teal-600 bg-teal-500/10 group-hover:bg-teal-500/20',
    blue: 'text-blue-600 bg-blue-500/10 group-hover:bg-blue-500/20',
    yellow: 'text-yellow-600 bg-yellow-500/10 group-hover:bg-yellow-500/20',
    amber: 'text-amber-600 bg-amber-500/10 group-hover:bg-amber-500/20',
    fuchsia: 'text-fuchsia-600 bg-fuchsia-500/10 group-hover:bg-fuchsia-500/20',
    pink: 'text-pink-600 bg-pink-500/10 group-hover:bg-pink-500/20',
    slate: 'text-slate-600 bg-slate-500/10 group-hover:bg-slate-500/20',
  };
  const themeClass = themes[colorTheme] || themes.slate;

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`relative flex items-center p-3 bg-[var(--dh-bg-base)] rounded-xl border border-[var(--dh-border)] transition-all duration-200 group text-left w-full
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--dh-text-muted)] hover:shadow-sm'}`}
    >
      {badge > 0 && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-sm border-2 border-[var(--dh-bg-base)] z-10 animate-pulse">
          {badge}
        </div>
      )}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${themeClass}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <div className="text-[12px] font-black text-[var(--dh-text-main)] truncate">{title}</div>
        <div className="text-[10px] font-bold text-[var(--dh-text-muted)] truncate">{subtitle}</div>
      </div>
    </button>
  );
};

const QuickLink = ({ title, icon: Icon, onClick }) => (
  <button onClick={onClick} className="flex items-center justify-between p-2.5 bg-[var(--dh-bg-base)] hover:bg-[var(--dh-bg-surface)] rounded-lg border border-[var(--dh-border)] transition-colors group text-left">
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-[var(--dh-text-muted)] group-hover:text-[var(--dh-text-main)] transition-colors" />
      <span className="text-[11px] font-black text-[var(--dh-text-muted)] group-hover:text-[var(--dh-text-main)] transition-colors">{title}</span>
    </div>
    <ExternalLink size={12} className="text-[var(--dh-border)] group-hover:text-[var(--dh-text-muted)]" />
  </button>
);

export default function ManagersOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [greeting, setGreeting] = useState('');
  
  const [managerTasks, setManagerTasks] = useState([]); 
  const [pendingStaffCount, setPendingStaffCount] = useState(0);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [vipList, setVipList] = useState([]);
  const [vipSearchId, setVipSearchId] = useState('');
  const [vipSearchResult, setVipSearchResult] = useState(null);
  const [isSearchingVip, setIsSearchingVip] = useState(false);
  const [isUpdatingVip, setIsUpdatingVip] = useState(false);

  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);

  useEffect(() => {
    checkAccessAndLoadData();
    calculateGreeting();
  }, []);

  useEffect(() => {
    if (isAuthorized && auth.currentUser) {
      try {
        if (typeof todoService.subscribeManagerApprovals === 'function') {
          const unsubscribe = todoService.subscribeManagerApprovals((data) => {
            setManagerTasks(data); 
          });
          return () => unsubscribe();
        }
      } catch (error) { console.error("Error subscribing to tasks:", error); }
    }
  }, [isAuthorized]);

  const calculateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('อรุณสวัสดิ์ครับ');
    else if (hour < 18) setGreeting('สวัสดีตอนบ่ายครับ');
    else setGreeting('สวัสดีตอนเย็นครับ');
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return <Sunrise size={16} className="text-amber-500" />;
    if (hour < 18) return <Sun size={16} className="text-orange-500" />;
    return <Moon size={16} className="text-indigo-400" />;
  };

  const checkAccessAndLoadData = async () => {
    setLoading(true);
    if (!auth.currentUser) { setIsAuthorized(false); setLoading(false); return; }
    try {
      const profile = await userService.getUserProfile(auth.currentUser.uid);
      if (!profile || !['Manager', 'Owner', 'ผู้จัดการ', 'เจ้าของ'].includes(profile.role)) {
        setIsAuthorized(false); setLoading(false); return;
      }
      await fetchPendingCount();
    } catch (error) { console.error("Error loading manager data:", error); } finally { setLoading(false); }
  };

  const fetchPendingCount = async () => {
    try {
      const pending = await userService.getPendingStaff();
      if(pending) setPendingStaffCount(pending.length);
    } catch (error) { console.error("Error fetching pending staff count:", error); }
  };

  const handleOpenTask = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const getDisplayTitle = (task) => {
    if (!task) return '';
    if (task.type === 'CANCEL_CLAIM_APPROVAL') return task.title.replace('ขออนุมัติเคลม', 'ขอยกเลิกรายการเคลม');
    if (task.type === 'CANCEL_RETURN_APPROVAL') return task.title.replace('ขออนุมัติคืนสินค้า', 'ขอยกเลิกรายการคืนสินค้า');
    return task.title;
  };

  const handleApproveTask = async () => {
    if (!selectedTask) return;
    try {
      const profile = await userService.getUserProfile(auth.currentUser.uid);
      const approverName = profile ? `${profile.firstName} (${profile.nickname})` : auth.currentUser.email;

      if (selectedTask.type === 'DELETE_PRODUCT_APPROVAL') {
        await inventoryService.deleteProduct(selectedTask.payload.sku, selectedTask.payload.productName);
        await todoService.approveTodo(selectedTask.id, auth.currentUser.uid);
        alert('อนุมัติการลบสินค้าสำเร็จ (ปิดการแสดงผลหน้าเว็บแล้ว)');
      } 
      else if (selectedTask.type === 'STAFF_APPROVAL') {
        await userService.approveStaff(selectedTask.payload.uid, approverName);
        await todoService.approveTodo(selectedTask.id, auth.currentUser.uid);
        alert('อนุมัติสิทธิ์พนักงานสำเร็จ');
        fetchPendingCount(); 
      }
      else if (
        selectedTask.type === 'CLAIM_APPROVAL' || 
        selectedTask.type === 'RETURN_APPROVAL' ||
        selectedTask.type === 'CANCEL_CLAIM_APPROVAL' || 
        selectedTask.type === 'CANCEL_RETURN_APPROVAL'
      ) {
        await claimService.approveRequest(selectedTask, auth.currentUser.uid, approverName);
        await todoService.approveTodo(selectedTask.id, auth.currentUser.uid);
        
        let msg = 'ดำเนินการสำเร็จ';
        if (selectedTask.type === 'CLAIM_APPROVAL') msg = 'อนุมัติเคลมสำเร็จ พร้อมเบิกสต๊อกของใหม่ทดแทน';
        else if (selectedTask.type === 'RETURN_APPROVAL') msg = 'อนุมัติคืนสินค้าสำเร็จ นำสต๊อกกลับเข้าระบบและโอนเงินคืนเรียบร้อย';
        else msg = 'อนุมัติการยกเลิกรายการ และจัดการระบบสต๊อก/เงินเรียบร้อยแล้ว';
        
        alert(msg);
      } else {
        await todoService.approveTodo(selectedTask.id, auth.currentUser.uid);
      }
      
      setManagerTasks(prev => prev.filter(t => t.id !== selectedTask.id));
      setIsTaskModalOpen(false);
      setSelectedTask(null);
    } catch (err) {
      console.error("Error approving task:", err);
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleRejectTask = async () => {
    if (!selectedTask) return;
    const reason = window.prompt('ระบุเหตุผลที่ปฏิเสธ (เพื่อแจ้งให้พนักงานทราบ):');
    if (reason === null) return; 
    try {
      if (
        selectedTask.type === 'CLAIM_APPROVAL' || 
        selectedTask.type === 'RETURN_APPROVAL' ||
        selectedTask.type === 'CANCEL_CLAIM_APPROVAL' || 
        selectedTask.type === 'CANCEL_RETURN_APPROVAL'
      ) {
        await claimService.rejectRequest(selectedTask, reason || 'ผู้จัดการไม่อนุมัติ', auth.currentUser.uid);
      }
      await todoService.rejectTodo(selectedTask.id, reason || 'ผู้จัดการไม่อนุมัติ', auth.currentUser.uid);
      
      setManagerTasks(prev => prev.filter(t => t.id !== selectedTask.id));
      alert('ปฏิเสธคำร้องสำเร็จ');
      setIsTaskModalOpen(false);
      setSelectedTask(null);
    } catch (err) {
      console.error("Error rejecting task:", err);
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const fetchVipList = async () => {
    try {
      const q = query(collection(db, 'users'), where('rank', '==', 'VIP'));
      const snapshot = await getDocs(q);
      const vips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVipList(vips);
    } catch (error) { console.error("Error fetching VIPs:", error); }
  };

  const openVipModal = () => {
    setIsVipModalOpen(true);
    fetchVipList();
  };

  const searchVipCustomer = async (e) => {
    e.preventDefault();
    if (!vipSearchId.trim()) return;
    setIsSearchingVip(true);
    setVipSearchResult(null);
    try {
      let docRef = doc(db, 'users', vipSearchId.trim());
      let docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const q = query(collection(db, 'users'), where('customerCode', '==', vipSearchId.trim()), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          docSnap = snap.docs[0];
        }
      }

      if (docSnap && docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        if (data.rank === 'VIP') {
          alert('ลูกค้ารายนี้เป็น VIP อยู่แล้ว');
        } else {
          setVipSearchResult(data);
        }
      } else {
        alert('ไม่พบข้อมูลลูกค้าจากรหัสนี้ในระบบ');
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการค้นหา');
    } finally {
      setIsSearchingVip(false);
    }
  };

  const handleAddVip = async () => {
    if (!vipSearchResult) return;
    setIsUpdatingVip(true);
    try {
      await updateDoc(doc(db, 'users', vipSearchResult.id), {
        rank: 'VIP',
        role: 'VIP', 
        updatedAt: serverTimestamp()
      });
      alert('🌟 เลื่อนขั้นเป็น VIP สำเร็จ');
      setVipSearchResult(null);
      setVipSearchId('');
      fetchVipList();
    } catch (err) {
      alert('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setIsUpdatingVip(false);
    }
  };

  const handleRemoveVip = async (customer) => {
    if (!window.confirm(`⚠️ ยืนยันการปลด ${customer.accountName || customer.displayName} ออกจากกลุ่ม VIP หรือไม่?`)) return;
    try {
      await updateDoc(doc(db, 'users', customer.id), {
        rank: 'Customer',
        role: 'Customer',
        updatedAt: serverTimestamp()
      });
      fetchVipList();
    } catch (error) {
      alert('ปรับปรุงข้อมูลไม่สำเร็จ');
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center bg-[var(--dh-bg-base)]"><div className="animate-spin text-[var(--dh-accent)]"><Activity size={32} /></div></div>;

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[var(--dh-bg-base)] text-center transition-colors duration-300">
        <ShieldAlert size={64} className="text-rose-500/80 mb-4" />
        <h2 className="text-2xl font-black text-[var(--dh-text-main)] mb-2">เข้าถึงไม่ได้ (Access Denied)</h2>
        <p className="text-sm text-[var(--dh-text-muted)] font-bold mb-6">เฉพาะผู้จัดการ หรือ เจ้าของร้าน เท่านั้นที่สามารถเข้าถึงพื้นที่นี้ได้</p>
        <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-[var(--dh-accent)] hover:bg-[var(--dh-accent-hover)] text-white font-black rounded-xl shadow-md transition-all active:scale-95">กลับหน้าหลัก</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--dh-bg-base)] p-3 lg:p-4 overflow-hidden font-sans relative transition-colors duration-300 gap-3 lg:gap-4">
      
      {/* 🏷️ Header: System Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 bg-[var(--dh-bg-surface)] rounded-xl shadow-sm border border-[var(--dh-border)] shrink-0 z-20 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-md text-[10px] font-black uppercase tracking-widest mb-1.5 shadow-sm">
            <ShieldCheck size={12} /> Management Area
          </div>
          <h1 className="text-xl md:text-2xl font-black text-[var(--dh-text-main)] tracking-tight leading-none">
            ศูนย์ควบคุมระบบ
          </h1>
          <p className="text-[11px] text-[var(--dh-text-muted)] mt-1.5 font-bold flex items-center gap-1.5">
            {getGreetingIcon()} {greeting} 
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--dh-bg-base)] rounded-lg border border-[var(--dh-border)]">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <span className="text-[10px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest flex items-center gap-1">
            <Server size={12}/> System Online
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col xl:flex-row gap-4">
        
        {/* ⬅️ LEFT AREA */}
        <div className="w-full xl:flex-1 flex flex-col h-full bg-[var(--dh-bg-surface)] rounded-xl shadow-sm border border-[var(--dh-border)] overflow-hidden">
          
          <div className={`px-5 py-4 flex justify-between items-center shrink-0 border-b ${managerTasks.length > 0 ? 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-500/20' : 'bg-[var(--dh-bg-base)] border-[var(--dh-border)]'}`}>
            <h3 className={`font-black text-[14px] flex items-center gap-2 uppercase tracking-wide ${managerTasks.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--dh-text-main)]'}`}>
              <div className="relative flex items-center justify-center w-6 h-6">
                 {managerTasks.length > 0 && <span className="absolute inset-0 rounded-full bg-rose-400 opacity-30 animate-ping"></span>}
                 <Bell size={16} className={`relative z-10 ${managerTasks.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--dh-text-muted)]'}`}/>
              </div>
              ตะกร้างานรอพิจารณา (Inbox)
            </h3>
            {managerTasks.length > 0 && (
              <span className="bg-rose-500 text-white text-[11px] font-black px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                {managerTasks.length} รายการ
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-4 bg-[var(--dh-bg-base)]">
            {managerTasks.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5">
                {managerTasks.map(task => (
                   <div key={task.id} onClick={() => handleOpenTask(task)} className={`p-4 rounded-xl transition-all flex items-start gap-4 group cursor-pointer border bg-[var(--dh-bg-surface)] shadow-sm hover:shadow-md hover:-translate-y-0.5
                      ${task.type === 'STAFF_APPROVAL' ? 'border-l-4 border-l-blue-500 border-[var(--dh-border)]' 
                      : task.type.includes('CLAIM_APPROVAL') ? 'border-l-4 border-l-orange-500 border-[var(--dh-border)]' 
                      : task.type.includes('RETURN_APPROVAL') ? 'border-l-4 border-l-purple-500 border-[var(--dh-border)]' 
                      : 'border-l-4 border-l-indigo-500 border-[var(--dh-border)]'}`}>
                       
                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 
                         ${task.type === 'STAFF_APPROVAL' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                         : task.type.includes('CLAIM_APPROVAL') ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' 
                         : task.type.includes('RETURN_APPROVAL') ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                         : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                         {task.type === 'STAFF_APPROVAL' ? <Users size={18} strokeWidth={2.5}/> 
                         : task.type.includes('CLAIM_APPROVAL') ? <Wrench size={18} strokeWidth={2.5}/> 
                         : task.type.includes('RETURN_APPROVAL') ? <ArrowLeftRight size={18} strokeWidth={2.5}/> 
                         : <CheckSquare size={18} strokeWidth={2.5}/>}
                       </div>
                       
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between mb-1">
                           <p className="text-[14px] font-black text-[var(--dh-text-main)] truncate pr-4">{getDisplayTitle(task)}</p>
                           <ChevronRight size={14} className="text-[var(--dh-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                         </div>
                         <p className="text-[11px] font-bold text-[var(--dh-text-muted)] line-clamp-2 leading-relaxed">{task.description}</p>
                       </div>
                   </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[var(--dh-text-muted)] p-4">
                 <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                     <CheckCircle2 size={32} strokeWidth={2.5} />
                 </div>
                 <span className="text-[15px] font-black tracking-wide text-[var(--dh-text-main)] mb-1">ยอดเยี่ยม! เคลียร์งานครบถ้วน</span>
                 <span className="text-[12px] font-bold text-center">ไม่มีรายการรออนุมัติในขณะนี้ คุณสามารถไปจิบกาแฟได้เลย ☕</span>
              </div>
            )}
          </div>
        </div>

        {/* ➡️ RIGHT AREA */}
        <div className="w-full xl:w-[420px] 2xl:w-[460px] flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          
          <div className="bg-[var(--dh-bg-surface)] rounded-xl p-4 lg:p-5 border border-[var(--dh-border)] shadow-sm flex flex-col gap-4">
            <h3 className="text-[11px] font-black text-[var(--dh-text-muted)] flex items-center justify-between uppercase tracking-widest pl-1 border-b border-[var(--dh-border)] pb-2">
              <span className="flex items-center gap-1.5"><Settings size={14} /> เครื่องมือจัดการหลัก (Tools)</span>
              
              <button onClick={() => setIsGlobalSettingsOpen(true)} className="flex items-center gap-1 text-[10px] font-black bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 px-2.5 py-1 rounded-md hover:shadow-md transition-all active:scale-95">
                <Settings size={12}/> ตั้งค่าส่วนกลาง
              </button>
            </h3>
            
            <div className="grid grid-cols-2 gap-2.5">
              <ToolCard 
                title="สิทธิ์พนักงาน" subtitle="ตรวจสอบ KPI" icon={Users} colorTheme="indigo"
                badge={pendingStaffCount} onClick={() => navigate('/managers/staff')}
              />
              <ToolCard 
                title="ตั้งค่าการจัดส่ง" subtitle="Shipping Rules" icon={Truck} colorTheme="emerald" 
                onClick={() => navigate('/managers/shipping')}
              />
              <ToolCard 
                title="ตั้งค่าราคาปลีก" subtitle="Pricing Engine" icon={Calculator} colorTheme="blue" 
                onClick={() => navigate('/managers/pricing')}
              />
              <ToolCard 
                title="จัดการโปรโมชัน" subtitle="แคมเปญส่วนลด" icon={Megaphone} colorTheme="fuchsia" 
                onClick={() => navigate('/managers/promotions')}
              />
              <ToolCard 
                title="กระเป๋าเงินลูกค้า" subtitle="Wallet & คืนเงิน" icon={Wallet} colorTheme="teal"
                onClick={() => navigate('/managers/wallet')}
              />
              <ToolCard 
                title="เครดิต Partner" subtitle="ระบบเหรียญ" icon={Coins} colorTheme="amber" 
                onClick={() => navigate('/managers/credit')}
              />
              <ToolCard 
                title="ลูกค้าระดับ VIP" subtitle="เลื่อนขั้น/ปลดสิทธิ์" icon={Crown} colorTheme="yellow" 
                onClick={openVipModal}
              />
              <ToolCard 
                title="กฎของแถม" subtitle="เงื่อนไขแจกฟรี" icon={Gift} colorTheme="pink" 
                onClick={() => navigate('/managers/freebies')}
              />
            </div>
          </div>

          <div className="bg-[var(--dh-bg-surface)] rounded-xl p-4 border border-[var(--dh-border)] shadow-sm flex flex-col gap-3">
             <h3 className="text-[11px] font-black text-[var(--dh-text-muted)] flex items-center gap-1.5 uppercase tracking-widest pl-1">
               <FileText size={14} /> ระบบอ้างอิง / รายงาน (Reference)
             </h3>
             <div className="grid grid-cols-2 gap-2">
                <QuickLink title="ประวัติการเคลม/คืน" icon={ShieldAlert} onClick={() => navigate('/claims')} />
                <QuickLink title="ประวัติบัญชี / บิล" icon={Receipt} onClick={() => navigate('/billing')} />
                <QuickLink title="ประวัติระบบ (History)" icon={History} onClick={() => navigate('/history')} />
             </div>
          </div>

        </div>

      </div>

      {isTaskModalOpen && selectedTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#fdfdfd] dark:bg-[var(--dh-bg-surface)] rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden border border-[var(--dh-border)]">
            <div className={`p-4 border-b-2 flex justify-between items-start bg-[var(--dh-bg-base)]
               ${selectedTask.type === 'STAFF_APPROVAL' ? 'border-b-blue-500' 
               : selectedTask.type.includes('CLAIM_APPROVAL') ? 'border-b-orange-500' 
               : selectedTask.type.includes('RETURN_APPROVAL') ? 'border-b-purple-500' 
               : 'border-b-indigo-500'}`}>
              <div>
                <span className="text-[10px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest mb-1 block">Approval Document</span>
                <h2 className="text-[16px] font-black text-[var(--dh-text-main)] flex items-center gap-2">
                  {selectedTask.type.startsWith('CANCEL_') ? 'เอกสารขอยกเลิกรายการ' : 'เอกสารขออนุมัติ'}
                </h2>
              </div>
              <button onClick={() => { setIsTaskModalOpen(false); setSelectedTask(null); }} className="p-1 text-[var(--dh-text-muted)] hover:text-rose-500 bg-[var(--dh-bg-surface)] rounded-md border border-[var(--dh-border)] transition-colors"><X size={18}/></button>
            </div>
            
            <div className="p-6 bg-[#fdfdfd] dark:bg-[var(--dh-bg-surface)] flex-1 overflow-y-auto">
              <h3 className="font-black text-[var(--dh-text-main)] text-[15px] mb-4 pb-2 border-b border-dashed border-[var(--dh-border)]">{getDisplayTitle(selectedTask)}</h3>
              
              <div className="bg-[var(--dh-bg-base)] p-4 rounded-lg border border-[var(--dh-border)] text-[12px] font-bold text-[var(--dh-text-muted)] whitespace-pre-wrap leading-relaxed shadow-inner">
                {selectedTask.description}
              </div>

              {selectedTask.type.startsWith('CANCEL_') && selectedTask?.cancelReason && (
                <div className="mt-4 bg-rose-50 dark:bg-rose-900/10 border-l-4 border-l-rose-500 p-3 rounded-r-lg">
                  <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">เหตุผลที่ขอยกเลิก:</p>
                  <p className="text-[12px] font-bold text-rose-800 dark:text-rose-300">{selectedTask.cancelReason}</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-[var(--dh-border)] bg-[var(--dh-bg-base)] flex justify-between items-center">
              <button onClick={handleRejectTask} className="px-4 py-2.5 bg-white dark:bg-slate-800 text-rose-600 hover:text-rose-700 font-black rounded-lg transition-colors text-[12px] border border-rose-200 hover:border-rose-400 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-900/30">
                ปฏิเสธ (Reject)
              </button>
              <button onClick={handleApproveTask} className="px-6 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 font-black rounded-lg transition-colors flex items-center gap-2 shadow-sm text-[13px] active:scale-95">
                <CheckSquare size={16} strokeWidth={2.5}/> {selectedTask.type.startsWith('CANCEL_') ? 'อนุมัติการยกเลิก' : 'อนุมัติรายการนี้'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isVipModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[var(--dh-bg-surface)] rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] border border-[var(--dh-border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--dh-border)] flex justify-between items-center bg-[var(--dh-bg-base)] shrink-0">
              <h2 className="text-[13px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-2 uppercase tracking-wide"><Crown size={16} strokeWidth={2.5}/> บริหารจัดการลูกค้าระดับ VIP</h2>
              <button onClick={() => setIsVipModalOpen(false)} className="p-1 text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)] transition-colors"><X size={18}/></button>
            </div>
            
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-[var(--dh-bg-surface)] space-y-5">
              
              <div className="bg-[var(--dh-bg-base)] p-4 rounded-lg border border-[var(--dh-border)]">
                <h4 className="font-black text-[var(--dh-text-main)] mb-2 text-[11px] uppercase tracking-widest flex items-center gap-1.5"><Search size={12}/> ค้นหาเพื่อเพิ่ม VIP</h4>
                <form onSubmit={searchVipCustomer} className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="ระบุรหัสลูกค้า (Customer ID)..." 
                      value={vipSearchId} 
                      onChange={e => setVipSearchId(e.target.value)} 
                      className="w-full px-3 py-2 border border-[var(--dh-border)] rounded-md text-[12px] font-bold outline-none focus:border-[var(--dh-accent)] focus:ring-1 focus:ring-[var(--dh-accent)] bg-[var(--dh-bg-surface)] transition-all text-[var(--dh-text-main)]"
                    />
                  </div>
                  <button type="submit" disabled={isSearchingVip} className="px-4 py-2 bg-[var(--dh-text-main)] text-[var(--dh-bg-surface)] font-black text-[12px] rounded-md hover:bg-[var(--dh-accent)] transition-colors shadow-sm disabled:opacity-50">
                    {isSearchingVip ? 'ตรวจสอบ...' : 'ค้นหา'}
                  </button>
                </form>

                {vipSearchResult && (
                  <div className="mt-3 p-3 border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 rounded-md flex justify-between items-center animate-in slide-in-from-top-1">
                    <div>
                      <div className="font-black text-amber-700 dark:text-amber-400 text-[12px]">{vipSearchResult.accountName || vipSearchResult.displayName}</div>
                      <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-bold font-mono">
                        ID: {vipSearchResult.customerCode || vipSearchResult.id}
                      </div>
                    </div>
                    <button onClick={handleAddVip} disabled={isUpdatingVip} className="px-3 py-1.5 bg-amber-500 text-white font-black text-[11px] rounded-md hover:bg-amber-600 shadow-sm transition-colors flex items-center gap-1.5 active:scale-95">
                      {isUpdatingVip ? 'บันทึก...' : <><Plus size={12} strokeWidth={3}/> เพิ่มเป็น VIP</>}
                    </button>
                  </div>
                )}
              </div>

              <div className="border border-[var(--dh-border)] rounded-lg bg-[var(--dh-bg-base)] overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[var(--dh-border)] bg-[var(--dh-bg-surface)]">
                  <h4 className="font-black text-[var(--dh-text-main)] text-[11px] uppercase tracking-widest flex items-center gap-1.5">
                    รายชื่อ VIP ทั้งหมด <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-[9px]">{vipList.length}</span>
                  </h4>
                </div>
                <div className="max-h-[35vh] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="text-[10px] text-[var(--dh-text-muted)] font-black uppercase tracking-widest bg-[var(--dh-bg-surface)] border-b border-[var(--dh-border)] sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-2 font-black">ชื่อลูกค้า / รหัส</th>
                        <th className="px-4 py-2 text-right font-black">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--dh-border)]">
                      {vipList.length > 0 ? (
                        vipList.map((vip) => (
                          <tr key={vip.id} className="hover:bg-[var(--dh-bg-surface)] transition-colors group">
                            <td className="px-4 py-2.5">
                              <div className="font-black text-[var(--dh-text-main)] text-[12px] flex items-center gap-1.5">
                                {vip.accountName || vip.displayName} 
                                <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[9px] px-1 py-0.5 rounded font-black uppercase">VIP</span>
                              </div>
                              <div className="text-[10px] text-[var(--dh-text-muted)] font-bold font-mono mt-0.5">{vip.customerCode || vip.id}</div>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <button onClick={() => handleRemoveVip(vip)} className="text-[10px] font-black text-[var(--dh-text-muted)] hover:text-rose-600 bg-[var(--dh-bg-base)] hover:bg-rose-50 dark:hover:bg-rose-900/10 border border-[var(--dh-border)] hover:border-rose-200 dark:hover:border-rose-900/50 px-2.5 py-1 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                                ปลดสิทธิ์
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="2" className="px-4 py-8 text-center text-[var(--dh-text-muted)] font-bold text-[12px]">ยังไม่มีลูกค้าระดับ VIP ในระบบ</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {isGlobalSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-transparent w-full max-w-5xl flex flex-col items-end gap-2">
            <button onClick={() => setIsGlobalSettingsOpen(false)} className="bg-[var(--dh-bg-surface)] text-[var(--dh-text-main)] px-3 py-1.5 rounded-lg border border-[var(--dh-border)] font-black text-[12px] shadow-sm hover:bg-[var(--dh-bg-base)] flex items-center gap-1.5 transition-colors active:scale-95">
              <X size={14}/> ปิดหน้าต่างการตั้งค่า
            </button>
            <div className="w-full h-[85vh] overflow-hidden rounded-xl shadow-2xl border border-[var(--dh-border)]">
              <GlobalSettingsPanel />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}