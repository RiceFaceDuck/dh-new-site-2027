import React from 'react';
import { Landmark, Banknote, CreditCard, ScanLine, AlertCircle, UploadCloud, Trash2 } from 'lucide-react';

export default function PaymentMethods({
    activeTab, updateActiveTab,
    localCash, setLocalCash,
    localTxRef, setLocalTxRef,
    localTxDate, setLocalTxDate,
    localTxNote, setLocalTxNote,
    isCashShort, displayChange, remainingToPay, currentCashFloat, handleQuickCash,
    isScanning, ocrStatus, setOcrStatus, handleFileWithOCR,
    setPreviewSlip, isUploadingSlip
}) {
    const inputClass = "w-full bg-white border border-gray-300 rounded-sm px-2.5 text-sm font-medium text-[var(--dh-text-main)] outline-none focus:border-[var(--dh-accent)] transition-all";

    return (
        <div className="mb-4 flex-1">
            {/* แท็บเลือกวิธีจ่าย */}
            <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-sm border border-gray-200">
                <button onClick={() => updateActiveTab({ paymentMethod: 'Transfer' })} className={`flex-1 py-1.5 text-xs font-semibold rounded-sm transition-all flex items-center justify-center gap-1.5 ${activeTab.paymentMethod === 'Transfer' ? 'bg-[var(--dh-success)] text-white shadow-sm border border-[var(--dh-success)]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}><Landmark size={14}/> โอนเงิน</button>
                <button onClick={() => updateActiveTab({ paymentMethod: 'Cash' })} className={`flex-1 py-1.5 text-xs font-semibold rounded-sm transition-all flex items-center justify-center gap-1.5 ${activeTab.paymentMethod === 'Cash' ? 'bg-[var(--dh-success)] text-white shadow-sm border border-[var(--dh-success)]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}><Banknote size={14}/> เงินสด</button>
                <button disabled className="flex-1 py-1.5 text-xs font-semibold rounded-sm text-gray-400 flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed"><CreditCard size={14}/> เครดิต</button>
            </div>
            
            <div className="flex flex-col min-h-[140px] justify-center">
                {/* โหมดเงินสด */}
                {activeTab.paymentMethod === 'Cash' && (
                    <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                        <div className={`w-full flex items-center gap-3 p-3 rounded-sm border bg-gray-50 transition-colors ${isCashShort ? 'border-red-300' : 'border-gray-200'}`}>
                            <span className={`text-sm font-semibold whitespace-nowrap ${isCashShort ? 'text-red-600' : 'text-gray-600'}`}>รับเงินสด:</span>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">฿</span>
                                <input 
                                    type="number" placeholder={`ยอด ${(remainingToPay || 0).toLocaleString()}`} 
                                    value={localCash} onFocus={(e) => e.target.select()} 
                                    onChange={(e) => setLocalCash(e.target.value)} 
                                    onBlur={() => updateActiveTab({ cashReceived: localCash })}
                                    onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ cashReceived: localCash }); }}
                                    className={`w-full h-10 bg-white border rounded-sm pl-8 pr-3 text-right font-bold text-base outline-none transition-all ${isCashShort ? 'border-red-400 focus:border-red-500 text-red-600' : 'border-gray-300 focus:border-blue-500 text-gray-800'}`}
                                />
                            </div>
                            {isCashShort ? (
                                <span className="text-xs text-red-600 font-bold bg-red-50 px-2.5 h-10 flex items-center gap-1 rounded-sm border border-red-200 shrink-0"><AlertCircle size={14}/> ขาด ฿{(remainingToPay - currentCashFloat).toLocaleString()}</span>
                            ) : displayChange >= 0 && currentCashFloat > 0 ? (
                                <span className="text-xs text-blue-700 font-bold bg-blue-50 px-2.5 h-10 flex items-center rounded-sm border border-blue-200 shrink-0">ทอน ฿{displayChange.toLocaleString()}</span>
                            ) : null}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleQuickCash('exact')} className="flex-1 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-sm border border-gray-300 transition-colors">พอดี</button>
                            <button onClick={() => handleQuickCash(100)} className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-sm border border-gray-200 transition-colors">+ 100</button>
                            <button onClick={() => handleQuickCash(500)} className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-sm border border-gray-200 transition-colors">+ 500</button>
                            <button onClick={() => handleQuickCash(1000)} className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-sm border border-gray-200 transition-colors">+ 1K</button>
                        </div>
                    </div>
                )}

                {/* โหมดโอนเงิน */}
                {activeTab.paymentMethod === 'Transfer' && (
                    <div className="flex justify-between items-stretch animate-in fade-in duration-200 h-full gap-3">
                        <div className="flex-1 flex flex-col gap-2.5">
                            <select value={activeTab.bankAccount || 'KBANK'} onChange={(e) => updateActiveTab({ bankAccount: e.target.value })} className={`${inputClass} h-8 text-xs cursor-pointer`}>
                                <option value="KBANK">เข้าบัญชี: กสิกรไทย</option><option value="SCB">เข้าบัญชี: ไทยพาณิชย์</option><option value="BBL">เข้าบัญชี: กรุงเทพ</option><option value="KTB">เข้าบัญชี: กรุงไทย</option>
                            </select>
                            <div className="relative h-8 group">
                                <input type="text" placeholder="หมายเลขธุรกรรม (ถ้ามี)" value={localTxRef} onChange={(e) => setLocalTxRef(e.target.value)} onBlur={() => updateActiveTab({ transactionRef: localTxRef })} onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ transactionRef: localTxRef }); }} className={`${inputClass} h-full ${ocrStatus === 'error' ? 'border-red-300 focus:border-red-500' : ''}`} />
                                {isScanning && <ScanLine size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin-slow" />}
                            </div>
                            <div className="relative h-8 group">
                                <input type="text" placeholder="วันที่ และ เวลาโอน" value={localTxDate} onChange={(e) => setLocalTxDate(e.target.value)} onBlur={() => updateActiveTab({ transferDateTime: localTxDate })} onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ transferDateTime: localTxDate }); }} className={`${inputClass} h-full ${ocrStatus === 'error' ? 'border-red-300 focus:border-red-500' : ''}`} />
                            </div>
                            <input type="text" placeholder="ชื่อผู้โอน / หมายเหตุ" value={localTxNote} onChange={(e) => setLocalTxNote(e.target.value)} onBlur={() => updateActiveTab({ transferNote: localTxNote })} onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ transferNote: localTxNote }); }} className={`${inputClass} h-8`} />
                        </div>

                        {/* สลิปอัปโหลด */}
                        <div 
                            className={`w-28 shrink-0 border border-dashed rounded-sm flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group transition-all duration-300 ${activeTab.slipImage ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50 hover:bg-gray-50'}`} 
                            onClick={(e) => { if (activeTab.slipImage) { e.preventDefault(); setPreviewSlip(activeTab.slipImage); } }}
                        >
                            {isUploadingSlip && <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"><div className="w-5 h-5 border-[2px] border-gray-400 border-t-transparent rounded-full animate-spin mb-1"></div><span className="text-[9px] font-medium text-gray-500">UPLOADING...</span></div>}
                            {!activeTab.slipImage && !isUploadingSlip && <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30" onChange={handleFileWithOCR} />}
                            
                            {activeTab.slipImage && (
                                <>
                                    <img src={activeTab.slipImage} alt="Slip" className="absolute inset-0 w-full h-full object-contain z-10 p-1" />
                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                        <button onClick={(e) => { e.stopPropagation(); updateActiveTab({slipImage:null, transactionRef: '', transferDateTime: '', transferNote: ''}); setOcrStatus('idle'); }} className="p-1.5 bg-red-500 hover:bg-red-600 rounded-sm text-white shadow-sm transition-all scale-90 hover:scale-100"><Trash2 size={14}/></button>
                                    </div>
                                </>
                            )}
                            {!activeTab.slipImage && !isUploadingSlip && (
                                <div className="flex flex-col items-center gap-1.5 text-center p-2 text-gray-400 group-hover:text-gray-600 transition-colors">
                                    <UploadCloud size={20} strokeWidth={1.5} /> 
                                    <span className="text-[10px] font-medium leading-tight">แนบสลิป<br/><span className="text-[9px] opacity-70">(Ctrl+V)</span></span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
