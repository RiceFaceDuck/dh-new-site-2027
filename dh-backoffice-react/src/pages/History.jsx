import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { historyService } from '../firebase/historyService';
import { 
  History as HistoryIcon, Search, Filter, 
  Loader2, Clock, Users, Database, FileEdit, PlusCircle, Trash2,
  Boxes, Receipt, Undo2, ShieldAlert, Tags, Mail, Copy
} from 'lucide-react';

export default function History() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Users Map (สำหรับเอา UID มาดึง ชื่อเล่น และ อีเมล)
  const [usersMap, setUsersMap] = useState({});
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all'); 
  
  // Pagination
  const [lastVisibleDoc, setLastVisibleDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_LIMIT = 50;

  useEffect(() => {
    const fetchCoreData = async () => {
      try {
        // 1. โหลดข้อมูลพนักงานทั้งหมดมาทำ Map เพื่อใช้อ้างอิง ชื่อเล่น และ อีเมล
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
        const map = {};
        usersSnap.forEach(doc => {
          const data = doc.data();
          map[doc.id] = data; // หาด้วย UID
          if (data.firstName) map[data.firstName] = data; // สำรองหาด้วยชื่อ
          if (data.displayName) map[data.displayName] = data;
        });
        setUsersMap(map);
      } catch (err) {
        console.error("Error loading users for history map:", err);
      }

      // 2. โหลด Log
      fetchInitialData();
    };

    fetchCoreData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { logs: data, lastDoc } = await historyService.getRecentLogs(PAGE_LIMIT);
      setLogs(data);
      setFilteredLogs(data);
      setLastVisibleDoc(lastDoc);
      setHasMore(data.length === PAGE_LIMIT);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const { logs: newData, lastDoc } = await historyService.getRecentLogs(PAGE_LIMIT, lastVisibleDoc);
      const combinedLogs = [...logs, ...newData];
      setLogs(combinedLogs);
      applyFilters(combinedLogs, searchTerm, moduleFilter, actionFilter);
      setLastVisibleDoc(lastDoc);
      setHasMore(newData.length === PAGE_LIMIT);
    } catch (error) {
      console.error("Error loading more history:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    applyFilters(logs, searchTerm, moduleFilter, actionFilter);
  }, [searchTerm, moduleFilter, actionFilter, logs, usersMap]);

  const applyFilters = (sourceLogs, search, modFilter, actFilter) => {
    let result = sourceLogs;
    
    if (modFilter !== 'all') {
      result = result.filter(log => log.module === modFilter);
    }
    
    if (actFilter !== 'all') {
      result = result.filter(log => log.action === actFilter);
    }
    
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(log => {
        // ใช้ Map ช่วยหาข้อมูลลึกถึงชื่อเล่นและอีเมล เพื่อการค้นหาที่แม่นยำ
        const uid = log.uid || log.userId || log.actorId || '';
        const matched = usersMap[uid] || usersMap[log.actorName] || usersMap[log.performedBy] || {};
        
        const actorFirst = (matched.firstName || log.actorName || '').toLowerCase();
        const actorNick = (matched.nickname || '').toLowerCase();
        const actorMail = (matched.email || '').toLowerCase();
        
        return (
          (log.details && log.details.toLowerCase().includes(lowerSearch)) ||
          (log.action && log.action.toLowerCase().includes(lowerSearch)) ||
          (log.targetId && log.targetId.toLowerCase().includes(lowerSearch)) ||
          actorFirst.includes(lowerSearch) ||
          actorNick.includes(lowerSearch) ||
          actorMail.includes(lowerSearch)
        );
      });
    }
    setFilteredLogs(result);
  };

  // เวลาแบบ Relative
  const formatTimeInfo = (timestamp) => {
    if (!timestamp) return { absolute: '-', relative: '' };
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    const absolute = date.toLocaleString('th-TH', { 
      year: '2-digit', month: 'short', day: 'numeric', 
      hour: '2-digit', minute:'2-digit' 
    });

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    let relative = '';
    
    if (diffInSeconds < 60) relative = 'เมื่อสักครู่';
    else if (diffInSeconds < 3600) relative = `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
    else if (diffInSeconds < 86400) relative = `${Math.floor(diffInSeconds / 3600)} ชม.ที่แล้ว`;
    else relative = `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;

    return { absolute, relative };
  };

  const getModuleConfig = (module) => {
    const mod = module?.toLowerCase() || '';
    if (mod.includes('customer')) return { icon: <Users size={12} strokeWidth={2.5} />, color: 'text-[#3B82F6] bg-[#EFF6FF] border-[#BFDBFE] dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800', label: 'CUSTOMER' };
    if (mod.includes('staff') || mod.includes('user')) return { icon: <ShieldAlert size={12} strokeWidth={2.5} />, color: 'text-[#8B5CF6] bg-[#F5F3FF] border-[#DDD6FE] dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800', label: 'STAFF' };
    if (mod.includes('inventory') || mod.includes('product')) return { icon: <Boxes size={12} strokeWidth={2.5} />, color: 'text-[#F97316] bg-[#FFF7ED] border-[#FED7AA] dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800', label: 'INVENTORY' };
    if (mod.includes('order') || mod.includes('billing')) return { icon: <Receipt size={12} strokeWidth={2.5} />, color: 'text-[#10B981] bg-[#ECFDF5] border-[#A7F3D0] dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800', label: 'BILLING' };
    if (mod.includes('claim')) return { icon: <Undo2 size={12} strokeWidth={2.5} />, color: 'text-[#EF4444] bg-[#FEF2F2] border-[#FECACA] dark:text-red-400 dark:bg-red-900/20 dark:border-red-800', label: 'CLAIMS' };
    return { icon: <Database size={12} strokeWidth={2.5} />, color: 'text-gray-500 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700', label: module?.toUpperCase() || 'SYSTEM' };
  };

  const getActionConfig = (action) => {
    const act = action?.toUpperCase() || '';
    switch(act) {
      case 'CREATE': return { icon: <PlusCircle size={14} strokeWidth={2.5} />, color: 'text-[#10B981] dark:text-[#34D399]' };
      case 'UPDATE': return { icon: <FileEdit size={14} strokeWidth={2.5} />, color: 'text-[#3B82F6] dark:text-[#60A5FA]' };
      case 'DELETE': return { icon: <Trash2 size={14} strokeWidth={2.5} />, color: 'text-[#EF4444] dark:text-[#F87171]' };
      case 'UPDATE ROLE': return { icon: <ShieldAlert size={14} strokeWidth={2.5} />, color: 'text-[#8B5CF6] dark:text-[#A78BFA]' };
      default: return { icon: <Tags size={14} strokeWidth={2.5} />, color: 'text-gray-500 dark:text-gray-400' };
    }
  };

  const parseHumanReadableDetails = (details) => {
    if (!details) return <span className="text-dh-muted italic">ไม่มีรายละเอียด</span>;
    // ปรับให้คลีนตามแบบในรูปภาพ ไม่ต้องใช้ HTML badge แทรก
    return <span className="text-[13px] text-dh-main font-medium">{details}</span>;
  };

  const copyToClipboard = (text, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-dh-accent mb-4" />
        <p className="text-dh-muted font-medium">กำลังดึงข้อมูลประวัติระบบ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10 sm:p-2 min-h-[calc(100vh-80px)] text-dh-main">
      
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-dh-surface p-5 rounded-2xl shadow-dh-card border border-dh-border relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-dh-accent-light rounded-xl flex items-center justify-center text-dh-accent border border-dh-accent/20 shrink-0">
            <HistoryIcon size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none text-dh-main">System History</h1>
            <p className="text-dh-muted text-xs mt-1 font-medium">ประวัติการสร้าง แก้ไข และลบข้อมูลในระบบ (Audit Log)</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="flex items-center bg-dh-base border border-dh-border rounded-xl px-3 py-1.5 h-[40px] focus-within:border-dh-accent transition-colors">
            <Filter size={14} className="text-dh-muted mr-2 shrink-0" />
            <select 
              className="text-xs bg-transparent outline-none text-dh-main font-bold cursor-pointer w-full"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <option value="all">ทุกระบบ</option>
              <option value="Customer">👥 ลูกค้า</option>
              <option value="Staff">🛡️ พนักงาน</option>
              <option value="Inventory">📦 คลังสินค้า</option>
              <option value="Order">🧾 บิล/ขาย</option>
              <option value="Claim">🔄 เคลม</option>
            </select>
          </div>

          <div className="flex items-center bg-dh-base border border-dh-border rounded-xl px-3 py-1.5 h-[40px] focus-within:border-dh-accent transition-colors hidden sm:flex">
            <Tags size={14} className="text-dh-muted mr-2 shrink-0" />
            <select 
              className="text-xs bg-transparent outline-none text-dh-main font-bold cursor-pointer w-full"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">ทุกการกระทำ</option>
              <option value="Create">✨ สร้างใหม่</option>
              <option value="Update">📝 แก้ไข</option>
              <option value="Delete">🗑️ ลบข้อมูล</option>
            </select>
          </div>

          <div className="relative group flex-1 md:flex-none">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dh-muted group-focus-within:text-dh-accent transition-colors">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="pl-9 pr-4 py-2 h-[40px] bg-dh-base border border-dh-border rounded-xl w-full md:w-56 outline-none focus:ring-1 focus:ring-dh-accent focus:border-dh-accent transition-all font-medium text-xs text-dh-main placeholder:text-dh-muted"
              placeholder="ค้นหารายละเอียด, ชื่อ, อีเมล, Ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 🎨 Main Data Table - FIX: จัดรูปแบบความกว้างคอลัมน์และระยะห่างใหม่ */}
      <div className="bg-dh-surface rounded-2xl shadow-dh-card border border-dh-border overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto max-h-[calc(100vh-14rem)] custom-scrollbar">
          <table className="w-full min-w-[1000px] text-left border-collapse table-fixed">
            <thead className="bg-[#F8F9FA] dark:bg-dh-base/50 text-[#8C98A4] dark:text-dh-muted text-[10px] font-bold uppercase tracking-wider border-b border-dh-border sticky top-0 z-20">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap w-[15%]">วันเวลา (TIME)</th>
                <th className="px-6 py-4 whitespace-nowrap w-[15%] text-center">ระบบ (MODULE)</th>
                <th className="px-6 py-4 whitespace-nowrap w-[15%] text-center">ประเภท</th>
                <th className="px-6 py-4 w-[35%]">รายละเอียดภาษาคน (DETAILS)</th>
                <th className="px-6 py-4 whitespace-nowrap w-[20%]">ผู้ทำรายการ (BY)</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-dh-muted bg-dh-base/50">
                    <div className="w-16 h-16 bg-dh-surface rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dh-border shadow-sm">
                      <Search size={28} className="text-dh-muted/50" />
                    </div>
                    <p className="font-bold text-base text-dh-main">ไม่พบประวัติที่ตรงกับเงื่อนไข</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const actConf = getActionConfig(log.action);
                  const modConf = getModuleConfig(log.module);
                  const timeInfo = formatTimeInfo(log.timestamp);
                  
                  // ผสานข้อมูล User จาก Map ที่ดึงมา
                  const uid = log.uid || log.userId || log.actorId;
                  const matchedUser = usersMap[uid] || usersMap[log.actorName] || usersMap[log.performedBy] || {};

                  // ดึงค่าตาม Priority: ข้อมูลที่ Map ได้ -> ข้อมูลใน Log เดิม -> ค่าเริ่มต้น
                  const actorFirst = matchedUser.firstName || log.actorName || log.performedBy || 'ไม่ระบุชื่อ';
                  const actorNick = matchedUser.nickname || '';
                  const actorMail = matchedUser.email || '';

                  // จัด Format: {ชื่อเล่น} {ชื่อจริง}
                  const displayName = actorNick ? `${actorNick} ${actorFirst}` : actorFirst;
                  
                  // อักษรย่อโปรไฟล์อิงจากชื่อเล่นเป็นหลัก
                  const avatarInitial = actorNick ? actorNick.charAt(0) : actorFirst.charAt(0);

                  return (
                    <tr 
                      key={log.id} 
                      className="group transition-colors duration-200 border-b border-dh-border last:border-none hover:bg-dh-base/50 relative"
                    >
                      <td className="px-6 py-4 align-middle whitespace-nowrap">
                        <div className="flex flex-col justify-center">
                          <span className="text-xs font-bold text-dh-main">
                            {timeInfo.absolute}
                          </span>
                          {timeInfo.relative && (
                            <span className="text-[10px] text-dh-muted mt-1 flex items-center gap-1 font-medium">
                              <Clock size={10} className="opacity-70" /> {timeInfo.relative}
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 align-middle whitespace-nowrap text-center">
                        <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border text-[10px] font-bold tracking-wider ${modConf.color}`}>
                          {modConf.icon} {modConf.label}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 align-middle whitespace-nowrap text-center">
                        <div className={`flex items-center justify-center gap-1.5 font-bold ${actConf.color}`}>
                          <span>{actConf.icon}</span>
                          <span className="text-xs uppercase tracking-wide">
                            {log.action}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 align-middle whitespace-normal break-words">
                        <div className="mb-1.5">
                          {parseHumanReadableDetails(log.details)}
                        </div>
                        {log.targetId && (
                          <div 
                            onClick={(e) => copyToClipboard(log.targetId, e)}
                            className="inline-flex items-center gap-1.5 text-[10px] font-mono font-medium text-dh-muted bg-dh-base hover:bg-dh-surface border border-dh-border px-2 py-1 rounded transition-colors cursor-pointer" 
                            title="คลิกเพื่อคัดลอก Ref ID"
                          >
                            <Tags size={10} className="opacity-70" /> {log.targetId}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-dh-accent-light text-dh-accent border border-dh-accent/20 flex items-center justify-center font-bold text-sm shrink-0">
                            {avatarInitial.toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-dh-main text-xs truncate">
                              {displayName}
                            </span>
                            {actorMail ? (
                              <span 
                                onClick={(e) => copyToClipboard(actorMail, e)}
                                className="text-[10px] text-dh-muted flex items-center gap-1 mt-0.5 truncate cursor-pointer hover:text-dh-accent transition-colors"
                              >
                                <Mail size={10} className="opacity-70 shrink-0" /> 
                                {actorMail}
                              </span>
                            ) : (
                              <span className="text-[10px] text-dh-muted/50 flex items-center gap-1 mt-0.5 truncate">
                                ไม่มีอีเมล
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          
          {hasMore && !searchTerm && moduleFilter === 'all' && actionFilter === 'all' && (
            <div className="flex justify-center p-3 bg-dh-base border-t border-dh-border shadow-inner">
              <button 
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full max-w-sm py-2 bg-dh-surface border border-dh-border text-dh-accent font-bold rounded-xl hover:bg-dh-accent-light hover:border-dh-accent/30 transition-all text-xs flex justify-center items-center gap-2 shadow-sm active:scale-95"
              >
                {loadingMore ? <Loader2 className="animate-spin w-4 h-4" /> : <HistoryIcon size={14} />}
                {loadingMore ? 'กำลังขุดประวัติ...' : 'โหลดประวัติย้อนหลังเพิ่มเติม'}
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}