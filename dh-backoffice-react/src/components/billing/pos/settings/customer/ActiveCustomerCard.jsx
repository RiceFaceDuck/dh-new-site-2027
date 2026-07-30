import { ShieldCheck, Phone, X, Wallet, Sparkles, Crown } from 'lucide-react';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';

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

    const displayName = getCustomerDisplayName(activeTab.customer, '-');
    const displayPhone = activeTab.customer.phone || activeTab.customer.phoneNumber || '';
    const walletBal = Number(activeTab.customer.walletBalance || 0);
    const pointsBal = Number(activeTab.customer.creditPoints || 0);

    return (
        <div className="bg-gradient-to-br from-slate-900 via-[#1E254A] to-[#121735] text-white p-3.5 rounded-xl shadow-lg border border-slate-700/80 relative overflow-hidden animate-in fade-in duration-300 mb-2">
            {/* Ambient Background Glow */}
            <div className="absolute -right-8 -top-8 w-28 h-28 bg-indigo-500/20 rounded-full blur-xl pointer-events-none"></div>
            <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-blue-500/15 rounded-full blur-xl pointer-events-none"></div>

            {/* Header: Customer Name & Phone */}
            <div className="flex items-start justify-between gap-2 mb-3 relative z-10">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {activeTab.customer.rank && (
                            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                                <Crown size={9} strokeWidth={3}/> {activeTab.customer.rank}
                            </span>
                        )}
                        {activeTab.customer.isPartner && (
                            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1 shadow-xs">
                                <ShieldCheck size={9} strokeWidth={2.5}/> Partner
                            </span>
                        )}
                    </div>
                    <h3 className="font-black text-sm text-white leading-snug truncate drop-shadow-xs" title={displayName}>
                        {displayName}
                    </h3>
                </div>

                {/* Phone Badge / Quick Edit */}
                <div className="shrink-0 text-right">
                    {(!displayPhone || displayPhone.trim() === '' || displayPhone === '-') && !activeTab.hidePhone ? (
                        <button 
                            type="button"
                            onClick={() => setIsEditingCustomerPhone(true)} 
                            className="text-[10px] text-cyan-300 hover:text-white font-extrabold bg-cyan-500/20 hover:bg-cyan-500/40 px-2 py-1 rounded-md border border-cyan-400/40 transition-all flex items-center gap-1 shadow-2xs"
                        >
                            + ใส่เบอร์โทร
                        </button>
                    ) : activeTab.hidePhone ? (
                        <span className="text-[10px] text-slate-400 font-extrabold flex items-center gap-1 justify-end bg-white/5 px-2 py-1 rounded-md border border-white/10">
                            <ShieldCheck size={11} className="text-slate-400"/> สงวนเบอร์
                        </span>
                    ) : (
                        <span className="text-[11px] text-indigo-100 font-extrabold font-mono flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 shadow-2xs backdrop-blur-xs">
                            <Phone size={11} className="text-cyan-400"/> {displayPhone}
                        </span>
                    )}
                </div>
            </div>

            {/* Phone Inline Editor */}
            {isEditingCustomerPhone && (
                <div className="flex gap-1.5 mb-3 bg-slate-800/90 p-2 rounded-lg border border-cyan-500/40 shadow-md animate-in zoom-in-95 relative z-10">
                    <input
                        type="text" 
                        placeholder="(+66)XX-XXX-XXXX" 
                        value={tempCustomerPhone} 
                        onChange={(e) => setTempCustomerPhone(formatPhoneNumber(e.target.value))} 
                        autoFocus
                        className="flex-1 px-2.5 py-1 text-xs border border-cyan-400/50 bg-slate-900 text-white rounded-md font-mono font-bold outline-hidden focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 placeholder-slate-500"
                    />
                    <button 
                        type="button"
                        onClick={() => { 
                            if(tempCustomerPhone.length > 8) { 
                                updateActiveTab({ customer: { ...activeTab.customer, phone: tempCustomerPhone } }); 
                                setIsEditingCustomerPhone(false); 
                            } 
                        }} 
                        className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-black rounded-md transition-colors"
                    >
                        บันทึก
                    </button>
                    <button 
                        type="button"
                        onClick={() => setIsEditingCustomerPhone(false)} 
                        className="px-1.5 text-slate-400 hover:text-white bg-slate-700/60 rounded-md border border-slate-600"
                    >
                        <X size={13}/>
                    </button>
                </div>
            )}

            {/* 🌟 Balance & Points Dashboard (2-Column Grid) */}
            <div className="grid grid-cols-2 gap-2 relative z-10">
                {/* 1. Wallet Balance Card */}
                <div className={`p-2.5 rounded-lg border transition-all ${
                    walletBal > 0 
                        ? 'bg-slate-800/80 border-indigo-500/40 hover:border-indigo-400' 
                        : 'bg-slate-800/40 border-slate-700/50 opacity-60'
                }`}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                            <Wallet size={11} className="text-indigo-400"/> DH ค้างยอด
                        </span>
                        {walletBal > 0 && (
                            <label className="flex items-center gap-1 cursor-pointer select-none">
                                <input 
                                    type="checkbox" 
                                    disabled={isProcessing}
                                    checked={activeTab.useWallet || activeTab.walletUsed > 0}
                                    onChange={(e) => {
                                        updateActiveTab({ 
                                            useWallet: e.target.checked, 
                                            walletUsed: e.target.checked ? Math.min(walletBal, netTotal) : 0 
                                        });
                                    }}
                                    className="w-3 h-3 text-cyan-400 rounded-xs border-slate-600 focus:ring-0 bg-slate-900"
                                />
                                <span className="text-[9px] font-bold text-cyan-300">ใช้หัก</span>
                            </label>
                        )}
                    </div>
                    <div className="text-sm font-black text-white font-mono tracking-tight">
                        ฿{walletBal.toLocaleString()}
                    </div>
                </div>

                {/* 2. Points Card */}
                <div className="p-2.5 rounded-lg border bg-slate-800/80 border-amber-500/40">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={11} className="text-amber-400"/> Points
                        </span>
                    </div>
                    <div className="text-sm font-black text-amber-400 font-mono tracking-tight flex items-center gap-1">
                        ⭐ {pointsBal.toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
}
