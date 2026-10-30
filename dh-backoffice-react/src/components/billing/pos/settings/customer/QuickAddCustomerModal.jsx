import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import CustomerDuplicateComparisonModal from '../../../../../pages/Customers/components/forms/CustomerDuplicateComparisonModal';
import { useQuickAddCustomer } from './hooks/useQuickAddCustomer';
import CustomerDetectedSheet from './components/CustomerDetectedSheet';
import NewCustomerPreviewSheet from './components/NewCustomerPreviewSheet';

/**
 * 🌟 QuickAddCustomerModal Component (Presentation Layer)
 * 
 * Re-architected Smart Quick Paste Modal with:
 * - 0.1 Border Radius spec on all containers/cards/inputs
 * - Buttons Exception (rounded-lg) preserved on interactive action buttons
 * - Solid amber-200 paste box with amber-400 border
 * - Unified 2-Button decision footer (Yellow: New vs Green: Continue)
 * - Single-Sheet Document layout (1 line per data field)
 */
export default function QuickAddCustomerModal({
    isOpen,
    onClose,
    initialText = '',
    existingCustomers = [],
    onCustomerCreated
}) {
    const {
        rawInputText,
        handleTextChange,
        handleReset,
        selectedRole,
        setSelectedRole,
        dynamicRoles,
        parsedData,
        handleFieldChange,
        isSaving,
        matchedCustomer,
        dismissedMatchedCustomer,
        setDismissedMatchedCustomer,
        isShowingDetected,
        isTaxRequested,
        setIsTaxRequested,
        stagedLineId,
        setStagedLineId,
        isEditingLine,
        setIsEditingLine,
        autoFillMissing,
        setAutoFillMissing,
        isDuplicateModalOpen,
        setIsDuplicateModalOpen,
        duplicateCandidates,
        pendingNewCustPayload,
        handleProceedWithCandidate,
        handleCreateNewCustomer,
        handleSelectExistingCustomer,
        handleOverwriteExistingCustomer,
        handleForceCreateNewCustomer
    } = useQuickAddCustomer({
        isOpen,
        initialText,
        existingCustomers,
        onCustomerCreated,
        onClose
    });

    const textareaRef = useRef(null);

    const onResetClick = () => {
        handleReset();
        setTimeout(() => {
            textareaRef.current?.focus();
        }, 50);
    };

    // ป้องกันการเผลอคลิกปิด Backdrop นอกกรอบ หากมีข้อมูลกำลังกรอกอยู่
    const hasUnsavedDraft = Boolean(rawInputText || parsedData.accountName || parsedData.phone);
    const handleBackdropClick = () => {
        if (isSaving) return;
        if (hasUnsavedDraft) {
            // หากมีข้อความอยู่ ไม่ปิดทันทีเพื่อป้องกันข้อมูลสูญหาย (ให้กดกากบาทหรือยกเลิกเท่านั้น)
            return;
        }
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <>
            <div 
                className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
                onClick={handleBackdropClick}
            >
                <div 
                    className="bg-white rounded-[0.1rem] shadow-2xl border border-slate-300 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 1. Header แถบสีเข้ม (Solid Slate-900) */}
                    <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-[0.1rem] bg-amber-400 text-slate-900 flex items-center justify-center text-sm font-bold shadow-xs">
                                ⚡
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold tracking-wide flex items-center gap-1.5">
                                    เพิ่มลูกค้าใหม่ <span className="text-xs font-normal text-amber-300">(Smart Quick Paste)</span>
                                </h2>
                                <p className="text-[11px] text-slate-400">
                                    วางข้อความชุดเดียว ระบบจัดสรรข้อมูลลงช่องให้อัตโนมัติ
                                </p>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="text-slate-400 hover:text-white p-1 rounded-[0.1rem] transition-colors text-base leading-none cursor-pointer disabled:opacity-50"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* 2. Modal Body */}
                    <div className="p-5 space-y-4 overflow-y-auto max-h-[82vh] bg-white custom-scrollbar">
                        {/* ส่วนบน: กล่องวางข้อความสีเหลืองอำพันทึบ Solid bg-amber-200 */}
                        <div className="p-3.5 bg-amber-200 border border-amber-400 rounded-[0.1rem] shadow-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                    <span className="text-amber-700 text-sm">✨</span>
                                    วางข้อมูลลูกค้าชุดเดียวที่นี่ (ก๊อปปี้จาก Chat / Line / FB)
                                </label>
                                {(rawInputText || parsedData.accountName || parsedData.phone) && (
                                    <button
                                        type="button"
                                        onClick={onResetClick}
                                        disabled={isSaving}
                                        className="text-[11px] font-medium text-amber-950/80 hover:text-amber-950 bg-amber-300/80 hover:bg-amber-300 active:bg-amber-400/80 px-2 py-0.5 rounded-[0.1rem] border border-amber-400/80 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                        title="ล้างข้อมูลทั้งหมดเพื่อเริ่มกรอกใหม่"
                                    >
                                        <RotateCcw size={12} />
                                        <span>ล้างข้อมูล (Reset)</span>
                                    </button>
                                )}
                            </div>
                            <textarea 
                                ref={textareaRef}
                                rows={2} 
                                value={rawInputText}
                                onChange={(e) => handleTextChange(e.target.value)}
                                disabled={isSaving}
                                placeholder="วางชื่อลูกค้า, ที่อยู่ และเบอร์โทรศัพท์ที่นี่..."
                                className="w-full p-2 border border-amber-300 rounded-[0.1rem] text-xs bg-white text-slate-900 outline-none resize-none font-mono leading-relaxed focus:ring-1 focus:ring-amber-500 shadow-2xs disabled:bg-slate-50 disabled:text-slate-500"
                                autoFocus
                            />
                        </div>

                        {/* โซนแสดงผลลัพธ์: สลับระหว่างพบบัญชีเดิม (CustomerDetectedSheet) กับ ลูกค้าใหม่ (NewCustomerPreviewSheet) */}
                        {isShowingDetected ? (
                            <CustomerDetectedSheet 
                                matchedCustomer={matchedCustomer}
                                parsedData={parsedData}
                                isTaxRequested={isTaxRequested}
                                setIsTaxRequested={setIsTaxRequested}
                                stagedLineId={stagedLineId}
                                setStagedLineId={setStagedLineId}
                                isEditingLine={isEditingLine}
                                setIsEditingLine={setIsEditingLine}
                                autoFillMissing={autoFillMissing}
                                setAutoFillMissing={setAutoFillMissing}
                            />
                        ) : (
                            <NewCustomerPreviewSheet 
                                parsedData={parsedData}
                                handleFieldChange={handleFieldChange}
                                selectedRole={selectedRole}
                                setSelectedRole={setSelectedRole}
                                dynamicRoles={dynamicRoles}
                                isTaxRequested={isTaxRequested}
                                setIsTaxRequested={setIsTaxRequested}
                                dismissedCandidate={dismissedMatchedCustomer}
                                onRestoreDismissed={() => setDismissedMatchedCustomer(null)}
                                onSubmitForm={handleCreateNewCustomer}
                            />
                        )}
                    </div>

                    {/* 3. Footer ล่างสุด: คลีน เรียบง่าย 2 ทางเลือกชัดเจน ไร้ไอคอน */}
                    <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 gap-3">
                        {/* ฝั่งซ้าย: ลิงก์ยกเลิก */}
                        <button 
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="text-sm font-normal text-slate-500 hover:text-slate-800 underline transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                        >
                            ยกเลิก
                        </button>

                        {/* ฝั่งขวา: 2 ปุ่มกด รวมศูนย์ ไม่ใช้ไอคอน ขนาด text-sm ฟอนต์ปกติ */}
                        <div className="flex items-center gap-3 flex-wrap justify-end">
                            {/* ทางเลือกที่ 1: นี่คือลูกค้าใหม่ (ปุ่มเหลือง) */}
                            <button 
                                type="button"
                                onClick={handleCreateNewCustomer}
                                disabled={isSaving || (!isShowingDetected && !parsedData.accountName.trim())}
                                className="py-2.5 px-5 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-normal text-sm rounded-lg shadow-xs border border-amber-500/70 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSaving && !isShowingDetected && <Loader2 size={16} className="animate-spin text-slate-900" />}
                                <span>นี่คือลูกค้าใหม่ (สร้าง)</span>
                            </button>

                            {/* ทางเลือกที่ 2: ดำเนินการต่อด้วยบัญชีนี้ (ปุ่มเขียว) */}
                            {isShowingDetected && (
                                <button 
                                    type="button"
                                    onClick={() => handleProceedWithCandidate()}
                                    disabled={isSaving}
                                    className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-normal text-sm rounded-lg shadow-sm shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSaving && <Loader2 size={16} className="animate-spin text-white" />}
                                    <span>(แนะนำ) ดำเนินการต่อด้วยบัญชีนี้</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Duplicate Comparison Modal */}
            <CustomerDuplicateComparisonModal 
                isOpen={isDuplicateModalOpen}
                onClose={() => setIsDuplicateModalOpen(false)}
                newCustomerData={pendingNewCustPayload}
                duplicateCandidates={duplicateCandidates}
                onSelectExisting={handleSelectExistingCustomer}
                onOverwriteExisting={handleOverwriteExistingCustomer}
                onForceCreateNew={handleForceCreateNewCustomer}
            />
        </>,
        document.body
    );
}
