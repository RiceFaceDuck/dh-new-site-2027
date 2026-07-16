import { Building2, Hash, Wand2, CheckCircle2, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function MainInfoSection({
    formData,
    handleChange,
    isEditMode,
    isValidatingId,
    isSyncing,
    idSuccess,
    idError,
    duplicateIdToSync,
    handleGenerateId,
    setFormData,
    handleSyncAccount
}) {
    return (
        <div>
            <h3 className="text-sm font-bold text-dh-accent mb-3 flex items-center gap-2 border-b border-dh-border pb-2">
                <Building2 size={16} /> ข้อมูลหลักของร้านค้า
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-dh-muted flex items-center gap-1">
                            <Hash size={12}/> รหัสลูกค้า (Account ID)
                        </label>
                        <div className="flex items-center gap-2">
                            {isEditMode && formData.originalAccountId && (
                                <>
                                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-sm border border-indigo-100">
                                        ID ปัจจุบัน: {formData.originalAccountId}
                                    </span>
                                    {formData.email ? (
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] font-bold tracking-wider bg-teal-50 text-teal-600 border border-teal-200" title={`ซิงค์กับอีเมล: ${formData.email}`}>
                                            <CheckCircle2 size={10} strokeWidth={3} />
                                            <span>SYNCED</span>
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] font-bold tracking-wider bg-rose-50 text-rose-600 border border-rose-200" title="ยังไม่เชื่อมต่อบัญชีหน้าเว็บ">
                                            <X size={10} strokeWidth={3} />
                                            <span>NO EMAIL SYNC</span>
                                        </span>
                                    )}
                                </>
                            )}
                            <button type="button" onClick={handleGenerateId} className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 rounded-sm transition-colors shrink-0">
                                <Wand2 size={10} /> สุ่มรหัสใหม่
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="เช่น GHUE8VJZ" 
                            className={`w-full px-3 py-2.5 pr-8 border rounded-lg focus:ring-1 outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main uppercase font-mono ${
                                idError ? 'border-rose-400 focus:ring-rose-400' : 
                                idSuccess ? 'border-emerald-400 focus:ring-emerald-400' : 'border-dh-border focus:ring-dh-accent'
                            }`}
                            value={formData.customerCode || formData.accountId || ''} 
                            onChange={e => {
                                const val = e.target.value.toUpperCase();
                                setFormData(prev => ({ ...prev, customerCode: val, accountId: val }));
                            }}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {(isValidatingId || isSyncing) && <Loader2 size={14} className="animate-spin text-slate-400" />}
                            {(!isValidatingId && !isSyncing) && idSuccess && <CheckCircle2 size={14} className="text-emerald-500" />}
                            {(!isValidatingId && !isSyncing) && idError && <AlertCircle size={14} className="text-rose-500" />}
                        </div>
                    </div>
                    {idError && !duplicateIdToSync && <p className="text-[10px] text-rose-500 font-medium">{idError}</p>}
                    
                    {/* ปุ่มโอนย้ายบัญชี (กรณีตรวจพบว่ารหัสซ้ำ) */}
                    {duplicateIdToSync && isEditMode && (
                        <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                            <p className="text-xs text-indigo-800 font-bold mb-2 flex items-center gap-1">
                                <RefreshCw size={12} className="text-indigo-600" /> พบรหัสนี้ในระบบ (ต้องการโอนย้ายข้อมูลหรือไม่?)
                            </p>
                            <p className="text-[10px] text-indigo-600 mb-3 leading-relaxed">
                                หากลูกค้านำรหัสนี้มาจากหน้าเว็บ คุณสามารถคลิกปุ่มด้านล่างเพื่อโอนย้ายข้อมูลคำสั่งซื้อและเครดิตเดิม ทั้งหมดไปรวมกับบัญชีรหัสใหม่ได้ทันที
                            </p>
                            <button 
                                type="button" 
                                onClick={() => handleSyncAccount(duplicateIdToSync)}
                                disabled={isSyncing}
                                className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-md shadow-md hover:bg-indigo-700 flex items-center justify-center gap-1 transition-colors"
                            >
                                {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <><RefreshCw size={14} /> ยืนยันการโอนย้ายและควบรวมบัญชี</>}
                            </button>
                        </div>
                    )}
                    {duplicateIdToSync && !isEditMode && <p className="text-[10px] text-rose-500 font-medium">รหัสนี้ถูกใช้งานแล้ว กรุณาสุ่มใหม่</p>}
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-dh-muted flex items-center gap-1">
                        ชื่อร้าน / ชื่อบริษัท <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        placeholder="ระบุชื่อร้านค้า" 
                        required
                        className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main font-medium"
                        value={formData.accountName || ''} 
                        onChange={e => handleChange('accountName', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}
