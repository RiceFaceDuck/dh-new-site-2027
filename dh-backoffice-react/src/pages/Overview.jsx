import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Package, AlertCircle, Activity, 
  Users, Search, DollarSign, ShoppingCart, 
  ArrowUpRight, Clock, CheckCircle2, FileText,
  Download, Sparkles, Target, Zap
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { billingService } from '../firebase/billingService';
import { todoService } from '../firebase/todoService';
import { historyService } from '../firebase/historyService';

const Overview = () => {
  const [orders, setOrders] = useState([]);
  const [todos, setTodos] = useState([]);
  const [logs, setLogs] = useState([]);
  const [sourcing, setSourcing] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🎯 ตั้งเป้าหมายยอดขายรายวัน (Gamification Target)
  const DAILY_TARGET = 50000; 

  // 1. Data Subscriptions (Real-time Stream)
  useEffect(() => {
    const unsubOrders = billingService.subscribeRecentOrders(100, (data) => {
      setOrders(data);
    });

    const unsubTodos = todoService.subscribePendingTodos((data) => {
      setTodos(data);
    });

    const fetchLogs = async () => {
      try {
        const data = await historyService.getRecentLogs(6);
        setLogs(data);
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    };
    fetchLogs();

    const qSourcing = query(collection(db, 'sourcing_requests'), orderBy('demandCount', 'desc'), limit(5));
    const unsubSourcing = onSnapshot(qSourcing, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSourcing(data);
    });

    const timer = setTimeout(() => setLoading(false), 800);

    return () => {
      if (unsubOrders) unsubOrders();
      if (unsubTodos) unsubTodos();
      if (unsubSourcing) unsubSourcing();
      clearTimeout(timer);
    };
  }, []);

  // 2. Data Intelligence (Calculations)
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(o => {
      if (!o.createdAt) return false;
      const orderDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return orderDate >= today;
    });

    const paidToday = todayOrders.filter(o => o.paymentStatus === 'Paid');
    const revenueToday = paidToday.reduce((sum, o) => sum + (o.netTotal || 0), 0);
    const conversionRate = todayOrders.length > 0 ? ((paidToday.length / todayOrders.length) * 100).toFixed(0) : 0;
    const aov = paidToday.length > 0 ? (revenueToday / paidToday.length) : 0;

    const pendingShipments = orders.filter(o => 
      (o.orderStatus === 'Paid' || o.orderStatus === 'Pending') && 
      o.fulfillmentType !== 'StorePickup' && 
      !o.trackingNo 
    ).length;

    const criticalClaims = todos.filter(t => t.type?.includes('CLAIM') || t.type?.includes('RETURN')).length;
    const pendingStaff = todos.filter(t => t.type === 'STAFF_APPROVAL').length;

    return {
      revenueToday,
      ordersToday: todayOrders.length,
      conversionRate,
      aov,
      pendingShipments,
      criticalClaims,
      pendingStaff
    };
  }, [orders, todos]);

  // Helper for Formatting
  const formatMoney = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(amount);
  
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'เมื่อสักครู่';
    const time = timestamp.toDate ? timestamp.toDate().getTime() : new Date(timestamp).getTime();
    const diff = Math.floor((new Date().getTime() - time) / 60000); 
    if (diff < 1) return 'เมื่อสักครู่';
    if (diff < 60) return `${diff} นาทีที่แล้ว`;
    if (diff < 1440) return `${Math.floor(diff / 60)} ชม.ที่แล้ว`;
    return `${Math.floor(diff / 1440)} วันที่แล้ว`;
  };

  // ✨ Dynamic Greeting & Motivation
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'อรุณสวัสดิ์ ⛅';
    if (hour < 17) return 'สวัสดีตอนบ่าย ☀️';
    return 'สวัสดีตอนเย็น 🌙';
  };

  const getMotivation = () => {
    if (metrics.revenueToday >= DAILY_TARGET) return 'ยอดเยี่ยมมาก! ทะลุเป้าหมายของวันนี้แล้ว 🏆';
    if (metrics.revenueToday > DAILY_TARGET * 0.5) return 'ยอดขายกำลังมาแรง ลุยกันต่อเลย! 🔥';
    if (metrics.revenueToday > 0) return 'เริ่มต้นได้ดี มาสร้างยอดขายให้ทะลุเป้ากัน 🚀';
    return 'พร้อมสำหรับการสร้างสถิติใหม่ของวันนี้หรือยัง? 🌟';
  };

  // ✨ Print / Export PDF Handler
  const handleExportPDF = () => {
    window.print();
  };

  const progressPercent = Math.min((metrics.revenueToday / DAILY_TARGET) * 100, 100);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse flex flex-col justify-center items-center h-[70vh]">
        <div className="relative flex justify-center items-center">
          <div className="absolute w-24 h-24 border-4 border-dh-accent rounded-full animate-ping opacity-20"></div>
          <Zap size={48} className="text-dh-accent animate-bounce" />
        </div>
        <h3 className="text-xl font-black text-dh-main tracking-widest uppercase mt-4">Initializing Command Center...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      
      {/* 🌟 Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-dh-surface p-6 rounded-3xl shadow-dh-card border border-dh-border relative overflow-hidden print:shadow-none print:border-none print:bg-transparent print:p-0">
        {/* Glow Effect */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-dh-accent rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-pulse pointer-events-none print:hidden"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-dh-accent font-bold text-sm tracking-wide">{getGreeting()}</span>
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 print:hidden">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Live Feed
            </span>
          </div>
          <h2 className="text-3xl font-black text-dh-main tracking-tight leading-none mb-2">
            DH Command Center
          </h2>
          <p className="text-sm font-medium text-dh-muted flex items-center gap-1.5">
            <Sparkles size={14} className="text-dh-accent" /> {getMotivation()}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 relative z-10 print:hidden">
          {metrics.pendingStaff > 0 && (
            <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-2.5 rounded-xl border border-amber-500/20 shadow-sm animate-bounce">
              <Users size={16} />
              <span className="text-sm font-bold">{metrics.pendingStaff} พนักงานรออนุมัติ</span>
            </div>
          )}
          
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-dh-base text-dh-main hover:bg-dh-accent hover:text-white border border-dh-border px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95 group"
          >
            <Download size={16} className="group-hover:-translate-y-0.5 transition-transform" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 🚀 Layer 1: Financial & Operation Pulse (Top Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Revenue (Premium Grand Design) */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-black dark:to-slate-900 rounded-3xl p-6 text-white shadow-dh-elevated relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-dh-accent rounded-full mix-blend-screen filter blur-[40px] opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none"></div>
          <div className="absolute top-4 right-4 text-white/10 group-hover:text-white/20 transition-colors group-hover:rotate-12 duration-500"><DollarSign size={80} /></div>
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">ยอดขายวันนี้ (Real-time)</p>
              <h3 className="text-4xl font-black tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                {formatMoney(metrics.revenueToday)}
              </h3>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Target size={12} className="text-dh-accent"/> เป้าหมายรายวัน</span>
                <span className="text-xs font-black text-white">{progressPercent.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden backdrop-blur-sm border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-dh-accent to-yellow-400 h-2 rounded-full transition-all duration-1000 ease-out relative" 
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-[2px] animate-[ping_2s_ease-in-out_infinite]"></div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] font-medium bg-white/10 w-fit px-2.5 py-1.5 rounded-lg backdrop-blur-md border border-white/5 text-slate-200">
                <TrendingUp size={12} className="text-emerald-400" />
                <span>AOV {formatMoney(metrics.aov)}/บิล</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Orders */}
        <div className="bg-dh-surface rounded-3xl p-6 border border-dh-border shadow-dh-card relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 rounded-full filter blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"></div>
          <div className="absolute top-4 right-4 text-blue-500/10 group-hover:text-blue-500/20 transition-colors group-hover:scale-110 duration-500"><ShoppingCart size={64} /></div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <p className="text-dh-muted text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span> บิลขายวันนี้
              </p>
              <h3 className="text-4xl font-black text-dh-main tracking-tight mb-2">
                {metrics.ordersToday} <span className="text-sm font-bold text-dh-muted uppercase">รายการ</span>
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-dh-main font-bold bg-blue-500/10 w-fit px-2.5 py-1.5 rounded-lg border border-blue-500/20 mt-4">
              <CheckCircle2 size={14} className="text-blue-600 dark:text-blue-400" />
              <span>ปิดสำเร็จ {metrics.conversionRate}%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Logistics */}
        <div className="bg-dh-surface rounded-3xl p-6 border border-dh-border shadow-dh-card relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500 rounded-full filter blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"></div>
          <div className="absolute top-4 right-4 text-amber-500/10 group-hover:text-amber-500/20 transition-colors group-hover:-translate-x-2 duration-500"><Package size={64} /></div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <p className="text-dh-muted text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${metrics.pendingShipments > 0 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse' : 'bg-slate-300'}`}></span> รอจัดส่ง
              </p>
              <h3 className="text-4xl font-black text-dh-main tracking-tight mb-2">
                {metrics.pendingShipments} <span className="text-sm font-bold text-dh-muted uppercase">กล่อง</span>
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10 w-fit px-2.5 py-1.5 rounded-lg border border-amber-500/20 mt-4">
              <Clock size={14} />
              <span>รอนำส่งให้ขนส่ง</span>
            </div>
          </div>
        </div>

        {/* Card 4: Claims / Support */}
        <div className="bg-dh-surface rounded-3xl p-6 border border-dh-border shadow-dh-card relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500 rounded-full filter blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"></div>
          <div className="absolute top-4 right-4 text-red-500/10 group-hover:text-red-500/20 transition-colors group-hover:rotate-12 duration-500"><AlertCircle size={64} /></div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <p className="text-dh-muted text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${metrics.criticalClaims > 0 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-slate-300'}`}></span> งานเคลมค้าง
              </p>
              <h3 className="text-4xl font-black text-dh-main tracking-tight mb-2">
                {metrics.criticalClaims} <span className="text-sm font-bold text-dh-muted uppercase">เคส</span>
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-bold bg-red-500/10 w-fit px-2.5 py-1.5 rounded-lg border border-red-500/20 mt-4">
              <AlertCircle size={14} />
              <span>รอตรวจสอบสภาพ/ส่งคืน</span>
            </div>
          </div>
        </div>

      </div>

      {/* 📈 Layer 2: Insight & Activity Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Sourcing Radar (โอกาสในการขาย) */}
        <div className="bg-dh-surface rounded-3xl shadow-dh-card border border-dh-border p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-dh-border">
            <div>
              <h3 className="text-xl font-black text-dh-main flex items-center gap-2">
                <Search className="text-dh-accent" size={24} strokeWidth={2.5} />
                โอกาสในการขาย (Sourcing Radar)
              </h3>
              <p className="text-xs text-dh-muted mt-1 font-medium">สินค้าที่ลูกค้าหาบ่อย แต่ระบบยังไม่มีสต๊อก (Top 5)</p>
            </div>
            <div className="animate-pulse flex items-center justify-center w-10 h-10 rounded-full bg-dh-accent-light text-dh-accent border border-dh-accent/20 print:hidden">
              <Zap size={20} />
            </div>
          </div>

          <div className="space-y-3">
            {sourcing.length > 0 ? sourcing.map((req, index) => (
              <div key={req.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-dh-base border border-dh-border hover:border-dh-accent hover:shadow-md transition-all group cursor-default">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${index === 0 ? 'bg-gradient-to-br from-[#FF9B51] to-red-500 text-white border-none' : index === 1 ? 'bg-dh-surface text-dh-main border border-dh-border' : 'bg-dh-surface/50 text-dh-muted border border-dh-border'}`}>
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-dh-main group-hover:text-dh-accent transition-colors">{req.keyword}</h4>
                    <p className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mt-0.5">{req.category || 'ไม่ระบุหมวดหมู่'}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-dh-main">{req.demandCount}</span>
                    <span className="text-[9px] font-bold text-dh-muted uppercase tracking-wider bg-dh-surface px-1.5 py-0.5 rounded border border-dh-border mt-0.5">Demands</span>
                  </div>
                  <div className={`p-1.5 rounded-full ${index < 2 ? 'bg-red-500/10 text-red-500' : 'bg-dh-surface text-dh-muted'} border border-transparent group-hover:border-current transition-colors`}>
                    <ArrowUpRight size={16} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 flex flex-col items-center">
                <Search size={40} className="text-dh-border mb-3" />
                <p className="text-dh-muted font-bold text-sm">ยังไม่มีข้อมูลความต้องการสินค้าในขณะนี้</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Audit Trail (High-tech Timeline) */}
        <div className="bg-dh-surface rounded-3xl shadow-dh-card border border-dh-border p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-dh-border">
            <div>
              <h3 className="text-xl font-black text-dh-main flex items-center gap-2">
                <Activity className="text-blue-500" size={24} strokeWidth={2.5} />
                ความเคลื่อนไหวล่าสุด
              </h3>
              <p className="text-xs text-dh-muted mt-1 font-medium">บันทึกเหตุการณ์ภายในระบบ (Audit Trail)</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-dh-base border border-dh-border text-dh-muted px-3 py-1.5 rounded-lg shadow-sm">Live Feed</span>
          </div>

          <div className="relative pl-3">
            {/* เส้นเชื่อม Timeline */}
            <div className="absolute top-4 bottom-4 left-[23px] w-0.5 bg-dh-border rounded-full print:hidden"></div>

            <div className="space-y-5">
              {logs.length > 0 ? logs.map((log, index) => (
                <div key={log.id} className="flex gap-4 items-start group relative">
                  {/* จุดวงกลมบน Timeline */}
                  <div className="mt-1.5 relative z-10">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 bg-dh-surface shadow-sm transition-all duration-300 ${index === 0 ? 'border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] group-hover:scale-110' : 'border-dh-border text-dh-muted group-hover:border-dh-accent group-hover:text-dh-accent'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${index === 0 ? 'bg-blue-500 animate-ping' : 'bg-transparent'}`}></div>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 bg-dh-base border border-dh-border p-3.5 rounded-2xl group-hover:border-dh-accent/50 group-hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-black text-dh-main truncate pr-2 group-hover:text-dh-accent transition-colors">
                        {log.actorName || 'System'} 
                        <span className="font-bold text-[10px] uppercase tracking-wider text-dh-muted bg-dh-surface px-1.5 py-0.5 rounded border border-dh-border ml-2 shadow-sm">
                          {log.module}
                        </span>
                      </p>
                      <p className="text-[10px] font-bold text-dh-muted flex items-center gap-1 shrink-0 bg-dh-surface px-2 py-1 rounded-md border border-dh-border shadow-sm">
                        <Clock size={10} className="text-dh-accent" />
                        {formatTimeAgo(log.timestamp)}
                      </p>
                    </div>
                    <p className="text-xs font-medium text-dh-main/80 line-clamp-2 leading-relaxed">
                      {log.details}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-dh-muted text-sm font-bold border border-dashed border-dh-border rounded-2xl">
                  ไม่มีประวัติการเคลื่อนไหวล่าสุด
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Style พิเศษสำหรับการพิมพ์ (PDF Export) */}
      <style jsx>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { background-color: white !important; }
          .shadow-dh-card, .shadow-dh-elevated { box-shadow: none !important; border-color: #E2E8F0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
};

export default Overview;