import React from 'react';
import { ShieldCheck, Phone, X, Wallet, Sparkles } from 'lucide-react';

export default function ActiveCustomerCard({
    activeTab,
    updateActiveTab,
    isEditingCustomerPhone,
    setIsEditingCustomerPhone,
    tempCustomerPhone,
    setTempCustomerPhone,
    formatPhoneNumber,
    isProcessing,
    netTotal
}) {
    if (!activeTab.customer) return null;

    // แก้ไขบั๊กการดึงข้อมูลชื่อและเบอร์โทร ให้ตรวจสอบฟิลด์อื่นเผื่อไว้
    const displayName = activeTab.customer.accountName || activeTab.customer.displayName || activeTab.customer.firstName || '-';
    const displayPhone = activeTab.customer.phone || activeTab.customer.phoneNumber || '';

    return (
        <div className="bg-white border border-blue-200 rounded-lg p-3 relative overflow-hidden shadow-sm animate-in fade-in transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            
            {/* Header + Badges */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1 pr-2">
                    <div className="flex gap-1 flex-wrap mb-1">
                        {activeTab.customer.rank && <span className="bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">{activeTab.customer.rank}</span>}
                        {activeTab.customer.isPartner && <span className="bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-0.5"><ShieldCheck size={8}/> Partner</span>}
                    </div>
                    <p className="font-bold text-[13px] text-gray-900 leading-tight truncate" title={displayName}>{displayName}</p>
                </div>
                
                {/* Phone inline */}
                <div className="shrink-0 text-right">
                    {(!displayPhone || displayPhone.trim() === '' || displayPhone === '-') && !activeTab.hidePhone ? (
                        <button onClick={() => setIsEditingCustomerPhone(true)} className="text-[9px] text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">+ เบอร์โทร</button>
                    ) : activeTab.hidePhone ? (
                        <p className="text-[9px] text-gray-500 font-bold flex items-center gap-1 justify-end"><ShieldCheck size={10}/> สงวนเบอร์</p>
                    ) : (
                        <p className="text-[10px] text-gray-600 flex items-center gap-1 font-mono justify-end"><Phone size={10}/> {displayPhone}</p>
                    )}
                </div>
            </div>
            
            {/* Phone Editing Inline */}
            {isEditingCustomerPhone && (
                <div className="flex gap-1 mb-2 bg-blue-50 p-1.5 rounded animate-in zoom-in-95">
                    <input
                        type="text" placeholder="(+66)XX-XXX-XXXX" value={tempCustomerPhone} onChange={(e) => setTempCustomerPhone(formatPhoneNumber(e.target.value))} autoFocus
                        className="flex-1 px-2 py-1 text-[10px] border border-blue-300 rounded font-mono font-bold outline-none focus:border-blue-500"
                    />
                    <button onClick={() => { if(tempCustomerPhone.length > 8) { updateActiveTab({ customer: { ...activeTab.customer, phone: tempCustomerPhone } }); setIsEditingCustomerPhone(false); } }} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold rounded">บันทึก</button>
                    <button onClick={() => setIsEditingCustomerPhone(false)} className="px-1 text-gray-400 hover:text-gray-600 bg-white rounded border"><X size={12}/></button>
                </div>
            )}

            {/* Stats Inline */}
            <div className="bg-gray-50 border border-gray-200 p-2 rounded-md flex flex-col gap-1.5 mt-1">
                <div className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-bold flex items-center gap-1"><Wallet size={10}/> DH ค้างยอด:</span>
                        <label className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors ${Number(activeTab.customer.walletBalance || 0) > 0 ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer' : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'}`}>
                            <input 
                                type="checkbox" 
                                disabled={isProcessing || Number(activeTab.customer.walletBalance || 0) <= 0}
                                checked={activeTab.useWallet || activeTab.walletUsed > 0}
                                onChange={(e) => {
                                    if (Number(activeTab.customer.walletBalance || 0) <= 0) return;
                                    updateActiveTab({ useWallet: e.target.checked, walletUsed: e.target.checked ? Math.min(Number(activeTab.customer.walletBalance || 0), netTotal) : 0 });
                                }}
                                className="w-2.5 h-2.5 text-blue-600 rounded border-gray-300"
                            />
                            <span className={`text-[9px] font-bold ${Number(activeTab.customer.walletBalance || 0) > 0 ? 'text-blue-700' : 'text-gray-400'}`}>ใช้งาน</span>
                        </label>
                    </div>
                    <span className="font-black text-blue-700 text-[11px]">฿{Number(activeTab.customer.walletBalance || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] pb-1.5 border-b border-gray-200">
                    <span className="text-gray-500 font-bold flex items-center gap-1"><Sparkles size={10}/> Points:</span>
                    <span className="font-black text-amber-600 text-[11px]">{Number(activeTab.customer.creditPoints || 0).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
