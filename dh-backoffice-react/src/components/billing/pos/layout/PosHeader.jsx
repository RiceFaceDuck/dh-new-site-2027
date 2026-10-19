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
            
            {/* 🌟 Modern Responsive Compact Draft Tabs Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0 custom-scrollbar py-0.5 px-2">
                {safeCartTabs.map((tab, idx) => {
                    const isActive = activeTabId === tab.id;
                    const isWebOrder = Boolean(tab.isWebOrder || tab.channel === 'storefront' || tab.source === 'storefront');
                    const orderLabel = tab.orderId || tab.docId || `บิล ${idx + 1}`;
                    const tabTitle = getTabTitle(tab, idx);

                    return (
                        <button 
                            key={tab.id} 
                            onClick={() => !isProcessing && setActiveTabId(tab.id)}
                            title={`${tabTitle} (${orderLabel})`}
                            className={`transition-all rounded-[0.2rem] flex items-center border group relative shrink-0 shadow-xs cursor-pointer px-2.5 py-1 gap-2 text-xs ${
                                isActive 
                                    ? 'bg-white text-slate-900 border-red-500 shadow-md ring-2 ring-red-500/20 scale-[1.01] z-10 font-black' 
                                    : 'bg-slate-200/90 text-slate-700 border-slate-300 hover:bg-slate-300 hover:text-slate-900 font-bold'
                            }`}
                        >
                            <div className="flex flex-col items-start text-left leading-tight">
                                <div className="flex items-center gap-1">
                                    <span className="truncate max-w-[110px] text-[11px] font-bold">
                                        {tabTitle}
                                    </span>
                                    {isWebOrder && (
                                        <span className="text-[8.5px] font-black px-1 py-0.1 rounded-xs bg-cyan-600 text-white shadow-2xs shrink-0 flex items-center" title="ออเดอร์หน้าเว็บ">
                                            🌐
                                        </span>
                                    )}
                                </div>

                                <span className={`text-[10px] font-mono font-bold mt-0.5 ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                                    {orderLabel}
                                </span>
                            </div>

                            {(safeCartTabs.length > 1 || (tab.items && tab.items.length > 0) || tab.customer || tab.walkInName || (tab.orderId && !String(tab.orderId).startsWith('DH-TEMP-'))) && (
                                <div 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if (isProcessing) return;
                                        if (tab.items && tab.items.length > 0) {
                                            const confirmed = window.confirm(`แท็บบิล "${tabTitle} (${orderLabel})" มีสินค้าค้างอยู่ ${tab.items.length} รายการ\n\nคุณแน่ใจหรือไม่ว่าต้องการปิดแท็บนี้ทิ้ง?`);
                                            if (!confirmed) return;
                                        }
                                        closeTab(tab.id); 
                                    }}
                                    className={`p-1 rounded-full transition-all flex items-center justify-center ml-0.5 shrink-0 ${
                                        isActive 
                                            ? 'bg-slate-100 hover:bg-red-500 hover:text-white text-slate-400' 
                                            : 'hover:bg-red-500 hover:text-white text-slate-400 opacity-60 group-hover:opacity-100'
                                    }`}
                                    title="ปิดแท็บ"
                                >
                                    <X size={10} strokeWidth={3}/>
                                </div>
                            )}
                        </button>
                    );
                })}

                <button 
                    onClick={() => { 
                        if (!isProcessing && typeof createNewTab === 'function') { 
                            createNewTab(); 
                        } 
                    }} 
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all rounded-[0.2rem] shadow-xs cursor-pointer shrink-0 border border-emerald-700/50 ml-1"
                    title="เปิดบิลใหม่"
                >
                    <Plus size={14} strokeWidth={3}/>
                    <span className="text-[11px] font-extrabold whitespace-nowrap">เปิดบิลใหม่</span>
                </button>
            </div>
        </div>
    );
}
