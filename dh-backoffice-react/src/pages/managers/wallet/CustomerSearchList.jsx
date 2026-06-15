import React from 'react';
import { Search, Loader2, User, Megaphone } from 'lucide-react';

export default function CustomerSearchList({
    searchTerm, setSearchTerm, handleSearch, isSearching, hasSearched,
    displayUsers, selectedUser, handleSelectUser, copyAllPhones
}) {
    return (
        <div className="w-full lg:w-[35%] xl:w-[30%] flex flex-col gap-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 shrink-0">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="รหัสลูกค้า, เบอร์โทร, ชื่อ..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        />
                    </div>
                    <button type="submit" disabled={isSearching} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-colors shadow-sm disabled:opacity-50">
                        {isSearching ? <Loader2 size={18} className="animate-spin"/> : 'ค้นหา'}
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {hasSearched ? 'ผลการค้นหา' : 'ลูกค้ายอดเงินค้างสูงสุด'}
                    </span>
                    {!hasSearched && (
                        <button onClick={copyAllPhones} className="text-[10px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold bg-white px-2 py-1 rounded border border-indigo-200 shadow-sm flex items-center gap-1 transition-colors">
                            <Megaphone size={12}/> คัดลอกเบอร์โทร
                        </button>
                    )}
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <Loader2 size={32} className="animate-spin mb-2 opacity-50 text-indigo-500" />
                        </div>
                    ) : displayUsers.length > 0 ? (
                        <div className="space-y-1">
                            {displayUsers.map(user => {
                                const bal = user.walletBalance || 0;
                                return (
                                <div 
                                    key={user.id} 
                                    onClick={() => handleSelectUser(user)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group
                                        ${selectedUser?.id === user.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'}`}
                                >
                                    <div className="flex-1 min-w-0 pr-3">
                                        <div className={`font-black text-sm truncate flex items-center gap-2 ${selectedUser?.id === user.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                                            {user.accountName || user.displayName || user.firstName || 'ไม่ระบุชื่อ'}
                                            {user.role === 'partner' && <span className="shrink-0 text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded">Partner</span>}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 font-mono mt-1">ID: {user.customerCode || user.id.substring(0,8)}</div>
                                    </div>
                                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                        <div className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                                            ฿{bal.toLocaleString('th-TH', {minimumFractionDigits: 2})}
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                            <User size={40} className="mb-2" strokeWidth={1.5} />
                            <span className="font-bold text-xs">ไม่พบข้อมูลลูกค้า</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
