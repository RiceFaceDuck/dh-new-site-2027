import React from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import GlobalSettingsHeader from '../../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../../components/managers/SaveConfirmationModal';
import WarrantyCategoryCard from './components/WarrantyCategoryCard';
import { useWarrantyManager } from './hooks/useWarrantyManager';

export default function GlobalWarrantySettings() {
    const {
        isLoading,
        isSaving,
        isModalOpen, setIsModalOpen,
        changesDiff,
        warrantyConfig,
        updateCategory,
        handlePreSave,
        handleSave
    } = useWarrantyManager();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 size={32} className="animate-spin mb-3" />
                <span className="font-bold text-sm">กำลังโหลดข้อมูลระบบส่วนกลาง...</span>
            </div>
        );
    }

    return (
        <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
            <SaveConfirmationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleSave}
                changes={changesDiff}
                isSaving={isSaving}
            />

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden relative flex flex-col min-h-[60vh]">
                <GlobalSettingsHeader 
                    title="กติกาการรับประกัน" 
                    icon={ShieldCheck}
                    onSave={handlePreSave}
                    isSaving={isSaving}
                />

                <div className="flex-1 p-6 sm:p-10 relative bg-slate-50/50">
                    <div className="space-y-8 max-w-full mx-auto">
                        <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex gap-4 text-amber-800 shadow-sm">
                            <ShieldCheck size={24} className="shrink-0 text-amber-500 mt-0.5"/>
                            <p className="text-sm font-bold leading-relaxed">
                                ตั้งค่าการรับประกันพื้นฐานแบ่งตามหมวดหมู่สินค้า (หากสินค้านั้นไม่มีการตั้งค่าประกันพิเศษระดับ SKU ระบบจะใช้ค่าจากหน้านี้เป็นหลักในการคำนวณวันหมดประกัน)
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                            {Object.entries(warrantyConfig.categories).map(([catName, data]) => (
                                <WarrantyCategoryCard
                                    key={catName}
                                    catName={catName}
                                    data={data}
                                    updateCategory={updateCategory}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
