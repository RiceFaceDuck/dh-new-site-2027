import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, HelpCircle, X, CloudOff, RefreshCw } from 'lucide-react';
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
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#D3DCEB] bg-[#EFF2F9] text-[#2A305A] shrink-0 z-20 shadow-sm">
            <div className="flex items-center gap-3">
                <button onClick={onSwitchView} disabled={isProcessing} className="p-1 text-gray-500 hover:text-[#2A305A] transition-colors dh-active-press"><ArrowLeft size={20}/></button>
                <h1 className="font-black text-sm tracking-wide text-[#2A305A]">เปิดบิลการขาย</h1>
                <button onClick={() => setIsGuideModalOpen(true)} className="text-gray-400 hover:text-[#D51C39] transition-colors ml-1" title="คู่มือการใช้งาน">
                    <HelpCircle size={16}/>
                </button>
                
                {offlineCount > 0 && (
                    <button 
                        onClick={handleSync} 
                        disabled={isSyncing || !navigator.onLine}
                        className="ml-2 flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 border border-amber-300 rounded-full text-xs font-bold hover:bg-amber-200 transition-colors shadow-sm disabled:opacity-50"
                        title={navigator.onLine ? "กดเพื่อส่งข้อมูลเข้าระบบ" : "รออินเทอร์เน็ตเพื่อ Sync"}
                    >
                        {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <CloudOff size={14} />}
                        <span>รอ Sync ({offlineCount})</span>
                    </button>
                )}
            </div>
            
            <div className="flex items-center gap-1 overflow-x-auto max-w-[60vw] custom-scrollbar">
                {safeCartTabs.map((tab, idx) => (
                    <button key={tab.id} onClick={() => !isProcessing && setActiveTabId(tab.id)}
                        className={`px-3 py-2 text-xs font-black transition-all border-t-2 rounded-t-lg mt-1 mr-1 flex items-center gap-1.5 group
                            ${activeTabId === tab.id ? 'border-t-[#D51C39] text-[#2A305A] bg-[var(--dh-bg-base)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-10 relative' : 'border-t-transparent text-gray-500 bg-[#D9E2EC] hover:text-gray-800 hover:bg-[#CBD5E1]'}`}>
                        <span>{getTabTitle(tab, idx)} {tab.orderId && <span className="text-[9px] opacity-60 font-mono bg-black/5 px-1 rounded">(Draft)</span>}</span>
                        <div 
                            onClick={(e) => { e.stopPropagation(); if (!isProcessing) closeTab(tab.id); }}
                            className={`p-0.5 rounded-full transition-all flex items-center justify-center ${activeTabId === tab.id ? 'hover:bg-red-500/20 text-red-500 opacity-60 hover:opacity-100' : 'hover:bg-black/10 opacity-0 group-hover:opacity-50 hover:!opacity-100'}`}
                            title="ปิดแท็บ"
                        >
                            <X size={12} strokeWidth={3}/>
                        </div>
                    </button>
                ))}
                <button onClick={() => { if (!isProcessing) { const newTab = createNewTab(); if(typeof setCartTabs === 'function') { setCartTabs([...safeCartTabs, newTab]); setActiveTabId(newTab.id); } } }} className="p-1.5 ml-1 text-gray-500 hover:text-[#2A305A] hover:bg-gray-200 transition-colors bg-white/50 border border-gray-200 rounded-md dh-active-press mt-1"><Plus size={16}/></button>
            </div>
        </div>
    );
}
