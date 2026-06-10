import React from 'react';
import { Plus, ArrowLeft, HelpCircle, X } from 'lucide-react';

export default function PosHeader({
    onSwitchView, isProcessing, setIsGuideModalOpen, safeCartTabs, activeTabId,
    setActiveTabId, getTabTitle, createNewTab, setCartTabs, closeTab
}) {
    return (
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#D3DCEB] bg-[#EFF2F9] text-[#2A305A] shrink-0 z-20 shadow-sm">
            <div className="flex items-center gap-3">
                <button onClick={onSwitchView} disabled={isProcessing} className="p-1 text-gray-500 hover:text-[#2A305A] transition-colors dh-active-press"><ArrowLeft size={20}/></button>
                <h1 className="font-black text-sm tracking-wide text-[#2A305A]">เปิดบิลการขาย</h1>
                <button onClick={() => setIsGuideModalOpen(true)} className="text-gray-400 hover:text-[#D51C39] transition-colors ml-1" title="คู่มือการใช้งาน">
                    <HelpCircle size={16}/>
                </button>
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
