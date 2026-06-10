import React from 'react';
import { User, Phone, ShieldCheck, Save, Loader2 } from 'lucide-react';

export default function WalkInCustomerCard({
    activeTab,
    updateActiveTab,
    showWalkInPhoneInput,
    setShowWalkInPhoneInput,
    handlePhoneChange,
    handleSaveNewCustomer,
    isSavingCustomer
}) {
    if (activeTab.customer || !activeTab.walkInName) return null;

    return (
        <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-2.5 shadow-sm animate-in fade-in slide-in-from-top-2 mb-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-100 rounded-md shrink-0"><User size={12} className="text-blue-600"/></div>
                <div>
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none">ลูกค้า Walk-in</p>
                    <p className="text-xs font-black text-blue-900 mt-0.5 truncate">{activeTab.walkInName}</p>
                </div>
            </div>

            {!showWalkInPhoneInput && !activeTab.hidePhone && !activeTab.walkInPhone ? (
                <div className="bg-white/80 p-2 rounded-lg border border-blue-100 flex items-center justify-between gap-2">
                    <p className="text-[9px] font-bold text-blue-800 leading-tight">ระบุเบอร์โทรศัพท์ <br/> หรือเลือกสงวนสิทธิ์</p>
                    <div className="flex gap-1">
                        <button onClick={() => setShowWalkInPhoneInput(true)} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded shadow-sm transition-all flex items-center gap-1">
                            <Phone size={10}/> ใส่เบอร์
                        </button>
                        <button onClick={() => updateActiveTab({ hidePhone: true })} className="px-2 py-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 text-[10px] font-bold rounded shadow-sm transition-all">
                            สงวนสิทธิ์
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2 animate-in fade-in">
                    {activeTab.hidePhone ? (
                        <div className="flex items-center justify-between bg-white/80 p-2 rounded-lg border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-600 flex items-center gap-1"><ShieldCheck size={12}/> สงวนสิทธิ์เบอร์โทร</span>
                            <button onClick={() => { updateActiveTab({ hidePhone: false }); setShowWalkInPhoneInput(true); }} className="text-[9px] text-blue-600 font-bold underline hover:text-blue-800 transition-colors">ใส่เบอร์</button>
                        </div>
                    ) : (
                        <div className="flex gap-2 relative bg-white/80 p-1.5 rounded-lg border border-blue-100">
                            <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500"/>
                            <input 
                                type="text" placeholder="(+66)XX-XXX-XXXX" 
                                value={activeTab.walkInPhone || ''} 
                                onChange={handlePhoneChange} autoFocus
                                className="w-full pl-7 pr-2 py-1 text-[11px] border border-blue-300 bg-white rounded-md font-mono font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-blue-900"
                            />
                        </div>
                    )}

                    {(activeTab.hidePhone || (activeTab.walkInPhone && activeTab.walkInPhone.length > 8)) && (
                        <div className="pt-2 border-t border-blue-200/50 flex items-center justify-between animate-in fade-in">
                            <span className="text-[9px] text-blue-700 font-medium">บันทึกเป็นลูกค้าประจำหรือไม่?</span>
                            <button 
                                onClick={handleSaveNewCustomer} disabled={isSavingCustomer}
                                className="px-2 py-1 bg-white border border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-[9px] font-black rounded shadow-sm transition-all flex items-center gap-1"
                            >
                                {isSavingCustomer ? <Loader2 size={10} className="animate-spin"/> : <Save size={10}/>} บันทึกลูกค้า
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
