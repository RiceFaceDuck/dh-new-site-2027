import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, HelpCircle, X, CloudOff, RefreshCw, ShoppingBag, Receipt } from 'lucide-react';
import { offlinePosService } from '../../../../firebase/offlinePosService';
import { toast } from 'react-hot-toast';

export default function PosHeader({
    onSwitchView, isProcessing, setIsGuideModalOpen, safeCartTabs, activeTabId,
    setActiveTabId, getTabTitle, createNewTab, setCartTabs, closeTab
}) {
    const [offlineCount, setOfflineCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        // Check offline orders periodically and on mount
        const checkOffline = () => {
            const orders = offlinePosService.getOfflineOrders();
            setOfflineCount(orders ? orders.length : 0);
        };
        checkOffline();
        
        const interval = setInterval(checkOffline, 5000); // Check every 5 seconds
        
        // Listen to online events to auto-sync or prompt
        const handleOnline = () => {
            checkOffline();
            if (offlinePosService.getOfflineOrders().length > 0) {
                toast("เชื่อมต่ออินเทอร์เน็ตแล้ว กรุณากดปุ่ม Sync ข้อมูลออฟไลน์", { icon: '🟢', duration: 5000 });
            }
        };
        
        window.addEventListener('online', handleOnline);
        return () => {
            clearInterval(interval);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    const handleSync = async () => {
        if (!navigator.onLine) {
            toast.error("ไม่มีการเชื่อมต่ออินเทอร์เน็ต");
            return;
        }
        setIsSyncing(true);
        try {
            const result = await offlinePosService.syncOfflineOrders();
            if (result.success > 0) {
                toast.success(`Sync สำเร็จ ${result.success} บิล`);
            }
            if (result.failed > 0) {
                toast.error(`Sync ไม่สำเร็จ ${result.failed} บิล กรุณาลองใหม่`);
            }
            setOfflineCount(offlinePosService.getOfflineOrders().length);
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการ Sync");
            console.error(error);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#D3DCEB] bg-[#EFF2F9] text-[#2A305A] shrink-0 z-20 shadow-xs">
            <div className="flex items-center gap-3 shrink-0">
                <button onClick={onSwitchView} disabled={isProcessing} className="p-1 text-gray-500 hover:text-[#2A305A] transition-colors dh-active-press"><ArrowLeft size={20}/></button>
                <h1 className="font-black text-sm tracking-wide text-[#2A305A]">เปิดบิลการขาย</h1>
                <button onClick={() => setIsGuideModalOpen(true)} className="text-gray-400 hover:text-[#D51C39] transition-colors ml-1" title="คู่มือการใช้งาน">
                    <HelpCircle size={16}/>
                </button>
                
                {offlineCount > 0 && (
                    <button 
                        onClick={handleSync} 
                        disabled={isSyncing || !navigator.onLine}
                        className="ml-2 flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 border border-amber-300 rounded-full text-xs font-bold hover:bg-amber-200 transition-colors shadow-xs disabled:opacity-50"
                        title={navigator.onLine ? "กดเพื่อส่งข้อมูลเข้าระบบ" : "รออินเทอร์เน็ตเพื่อ Sync"}
                    >
                        {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <CloudOff size={14} />}
                        <span>รอ Sync ({offlineCount})</span>
                    </button>
                )}
            </div>
            
            {/* 🌟 Modern Premium Draft Tabs Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-[70vw] custom-scrollbar py-0.5 px-1">
                {safeCartTabs.map((tab, idx) => {
                    const isActive = activeTabId === tab.id;
                    const items = tab.items || [];
                    const itemCount = items.reduce((sum, i) => sum + (i.qty || i.quantity || 1), 0);
                    const totalAmt = items.reduce((sum, i) => sum + ((i.price || 0) * (i.qty || i.quantity || 1)), 0);

                    const isDraft = !!(tab.docId || items.length > 0 || tab.customer || tab.walkInName);

                    return (
                        <button 
                            key={tab.id} 
                            onClick={() => !isProcessing && setActiveTabId(tab.id)}
                            className={`px-3 py-1.5 text-xs font-bold transition-all rounded-lg flex items-center gap-2 border group relative shrink-0 shadow-xs cursor-pointer ${
                                isActive 
                                    ? 'bg-white text-slate-900 border-red-500 shadow-md ring-2 ring-red-500/20 scale-[1.02] z-10 font-extrabold' 
                                    : 'bg-slate-200/90 text-slate-700 border-slate-300 hover:bg-slate-300 hover:text-slate-900'
                            }`}
                        >
                            <div className={`p-1 rounded-md transition-colors ${isActive ? 'bg-red-50 text-red-600' : 'bg-slate-300/60 text-slate-600'}`}>
                                <Receipt size={13} strokeWidth={2.5} />
                            </div>

                            <div className="flex flex-col items-start text-left leading-tight">
                                <div className="flex items-center gap-1.5">
                                    <span className="truncate max-w-[130px]">{getTabTitle(tab, idx)}</span>
                                    {isDraft && (
                                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase border ${
                                            isActive 
                                                ? 'bg-amber-100 text-amber-800 border-amber-300/80 shadow-2xs' 
                                                : 'bg-slate-300/80 text-slate-600 border-slate-400/50'
                                        }`}>
                                            Draft
                                        </span>
                                    )}
                                </div>

                                {itemCount > 0 ? (
                                    <span className={`text-[10px] font-semibold mt-0.5 ${isActive ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                                        {itemCount} รายการ • ฿{totalAmt.toLocaleString()}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-slate-400 mt-0.5 italic">
                                        ตะกร้าว่าง
                                    </span>
                                )}
                            </div>

                            {safeCartTabs.length > 1 && (
                                <div 
                                    onClick={(e) => { e.stopPropagation(); if (!isProcessing) closeTab(tab.id); }}
                                    className={`p-1 rounded-full transition-all flex items-center justify-center ml-0.5 ${
                                        isActive 
                                            ? 'bg-slate-100 hover:bg-red-500 hover:text-white text-slate-400' 
                                            : 'hover:bg-red-500 hover:text-white text-slate-400 opacity-60 group-hover:opacity-100'
                                    }`}
                                    title="ปิดแท็บ"
                                >
                                    <X size={11} strokeWidth={3}/>
                                </div>
                            )}
                        </button>
                    );
                })}

                <button 
                    onClick={() => { 
                        if (!isProcessing) { 
                            const emptyIdx = safeCartTabs.findIndex(t => (!t.items || t.items.length === 0) && !t.customer && !t.walkInName && !t.docId && (!t.orderId || String(t.orderId).startsWith('DH-TEMP-')));
                            if (emptyIdx !== -1) {
                                setActiveTabId(safeCartTabs[emptyIdx].id);
                            } else {
                                const newTab = createNewTab(); 
                                if(typeof setCartTabs === 'function') { 
                                    setCartTabs([...safeCartTabs, newTab]); 
                                    setActiveTabId(newTab.id); 
                                } 
                            }
                        } 
                    }} 
                    className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all rounded-lg shadow-xs cursor-pointer shrink-0 border border-emerald-700/50"
                    title="เปิดบิลร่างใหม่"
                >
                    <Plus size={15} strokeWidth={3}/>
                    <span className="text-[11px]">เปิดบิลใหม่</span>
                </button>
            </div>
        </div>
    );
}
