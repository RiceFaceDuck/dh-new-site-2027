import React, { useState } from 'react';
import { X, Banknote, CreditCard, Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { executeCustomerRefund } from '../../firebase/customerRefundService';

export default function CustomerRefundModal({
    isOpen,
    onClose,
    customer,
    onSuccess
}) {
    const [amount, setAmount] = useState('');
    const [refundMethod, setRefundMethod] = useState('BANK_TRANSFER'); // 'BANK_TRANSFER' | 'CASH'
    const [note, setNote] = useState('');
    const [slipFile, setSlipFile] = useState(null);
    const [slipPreview, setSlipPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen || !customer) return null;

    const currentWallet = Number(customer.walletBalance || 0);
    const currentPending = Number(customer.pendingWithdrawal || 0);
    const totalRefundable = currentWallet + currentPending;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSlipFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setSlipPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setSlipFile(null);
            setSlipPreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        const cleanAmountStr = String(amount || '').replace(/,/g, '').trim();
        const numAmount = Number(cleanAmountStr);
        if (isNaN(numAmount) || numAmount <= 0) {
            setErrorMsg('เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธณเธเธงเธเน€เธเธดเธเนเธซเนเธ–เธนเธเธ•เนเธญเธ (เธกเธฒเธเธเธงเนเธฒ 0)');
            return;
        }

        if (numAmount > totalRefundable) {
            setErrorMsg(`เธเธณเธเธงเธเน€เธเธดเธเน€เธเธดเธเธขเธญเธ”เธเนเธฒเธเธเธเน€เธซเธฅเธทเธญ (เธชเธนเธเธชเธธเธ” เธฟ${totalRefundable.toLocaleString('th-TH')})`);
            return;
        }

        setIsSubmitting(true);

        try {
            await executeCustomerRefund({
                customerId: customer.uid || customer.id,
                amount: numAmount,
                refundMethod: refundMethod,
                slipUrl: slipPreview || null,
                note: note,
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setErrorMsg(err.message || 'เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธ—เธณเธฃเธฒเธขเธเธฒเธฃ');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                {/* Modal Header */}
                <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white relative">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Banknote className="w-6 h-6" />
                        เธ—เธณเธฃเธฒเธขเธเธฒเธฃเนเธญเธเน€เธเธดเธเธเธทเธ / เธเนเธฒเธขเน€เธเธดเธเธชเธ”
                    </h2>
                    <p className="text-white/80 text-xs mt-1 truncate pr-8">
                        เธฅเธนเธเธเนเธฒ: <span className="font-bold text-white">{customer.displayName || customer.accountName || customer.name || 'N/A'}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="p-6 bg-white flex flex-col gap-4">

                        {/* Error Alert */}
                        {errorMsg && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold animate-in fade-in">
                                <AlertCircle size={16} className="shrink-0 text-rose-500" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* เธขเธญเธ”เน€เธเธดเธเธเธเน€เธซเธฅเธทเธญ */}
                        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">เธขเธญเธ” DH เธเนเธฒเธเธเธณเธฃเธฐเธ—เธฑเนเธเธซเธกเธ”</p>
                                <p className="text-xs text-emerald-600 mt-0.5">เน€เธเธดเธเนเธเธเธฃเธฐเน€เธเนเธฒ + เธขเธญเธ”เธฃเธญเธ–เธญเธ</p>
                            </div>
                            <p className="text-xl font-black font-mono text-emerald-700">
                                เธฟ{totalRefundable.toLocaleString('th-TH')}
                            </p>
                        </div>

                        {/* เธเนเธญเธเน€เธฅเธทเธญเธเธเธฃเธฐเน€เธ เธ—เธเธฒเธฃเธเธทเธเน€เธเธดเธ */}
                        <div>
                            <label className="text-xs font-black text-slate-700 mb-1.5 block">
                                เธเธฃเธฐเน€เธ เธ—เธเธฒเธฃเธ—เธณเธฃเธฒเธขเธเธฒเธฃ <span className="text-rose-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRefundMethod('BANK_TRANSFER')}
                                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                        refundMethod === 'BANK_TRANSFER'
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <CreditCard size={15} /> เนเธญเธเธเนเธฒเธเธเธเธฒเธเธฒเธฃ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRefundMethod('CASH')}
                                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                        refundMethod === 'CASH'
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <Banknote size={15} /> เธเนเธฒเธขเน€เธเธดเธเธชเธ”
                                </button>
                            </div>
                        </div>

                        {/* เธเธณเธเธงเธเน€เธเธดเธ */}
                        <div>
                            <label className="text-xs font-black text-slate-700 mb-1.5 block">
                                เธเธณเธเธงเธเน€เธเธดเธเธ—เธตเนเธเธทเธ (เธเธฒเธ—) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">เธฟ</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={totalRefundable}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-16 py-3 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl font-black text-lg text-slate-800 outline-hidden transition-all"
                                    placeholder="0.00"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setAmount(totalRefundable.toString())}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-[10px] font-bold rounded-lg transition-colors"
                                >
                                    เธ—เธฑเนเธเธซเธกเธ”
                                </button>
                            </div>
                        </div>

                        {/* เนเธเธเธชเธฅเธดเธเนเธญเธเน€เธเธดเธ (เน€เธเธเธฒเธฐ BANK_TRANSFER) */}
                        {refundMethod === 'BANK_TRANSFER' && (
                            <div>
                                <label className="text-xs font-black text-slate-700 mb-1.5 block flex items-center justify-between">
                                    <span>เนเธเธเธชเธฅเธดเธเนเธญเธเน€เธเธดเธ (Slip)</span>
                                    <span className="text-[10px] text-slate-400 font-normal">เธฃเธนเธเธ เธฒเธ JPG, PNG</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer border border-slate-200 rounded-xl p-1 bg-slate-50"
                                    />
                                </div>
                                {slipPreview && (
                                    <div className="mt-2 relative rounded-xl border border-slate-200 overflow-hidden max-h-32 flex justify-center bg-slate-900">
                                        <img src={slipPreview} alt="Slip Preview" className="h-32 object-contain" />
                                        <span className="absolute bottom-1 right-2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-md font-bold">
                                            โ“ เนเธเธเนเธฅเนเธง
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* เธซเธกเธฒเธขเน€เธซเธ•เธธ / เธเธฑเธเธ—เธถเธเธขเนเธญ */}
                        <div>
                            <label className="text-xs font-black text-slate-700 mb-1.5 block">เธซเธกเธฒเธขเน€เธซเธ•เธธ / เธเธฑเธเธ—เธถเธเธขเนเธญ</label>
                            <div className="relative">
                                <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
                                <textarea
                                    rows={2}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder={refundMethod === 'BANK_TRANSFER' ? 'เน€เธเนเธ เนเธญเธเน€เธเนเธฒเธเธฑเธเธเธต เธเธชเธดเธเธฃเนเธ—เธข เน€เธฅเธเธ—เธตเน...' : 'เน€เธเนเธ เธเนเธฒเธขเน€เธเธดเธเธชเธ”เนเธซเนเธฅเธนเธเธเนเธฒเธซเธเนเธฒเธฃเนเธฒเธเนเธ”เธข...'}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-800 outline-hidden focus:border-emerald-500 focus:bg-white transition-all min-h-[60px]"
                                />
                            </div>
                        </div>

                    </div>

                    {/* Modal Footer */}
                    <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-white text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors text-xs border border-slate-200 shadow-xs"
                        >
                            เธขเธเน€เธฅเธดเธ
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-md text-xs active:scale-95 disabled:opacity-50 disabled:pointer-events-none bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" />
                                    เธเธณเธฅเธฑเธเธเธฑเธเธ—เธถเธ...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={15} />
                                    เธขเธทเธเธขเธฑเธเนเธญเธเน€เธเธดเธเธเธทเธ
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
