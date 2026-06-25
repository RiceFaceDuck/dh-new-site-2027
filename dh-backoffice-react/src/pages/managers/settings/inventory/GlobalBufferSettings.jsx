import React, { useState } from 'react';
import { Box, AlertTriangle, Loader2 } from 'lucide-react';
import GlobalSettingsHeader from '../../../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../../../components/managers/SaveConfirmationModal';
import GuideModal from '../../../../components/common/GuideModal';
import { useGlobalBufferSettings } from './hooks/useGlobalBufferSettings';

export default function GlobalBufferSettings() {
    const {
        isLoading,
        isSaving,
        isModalOpen,
        setIsModalOpen,
        changesDiff,
        inventoryConfig,
        setInventoryConfig,
        handlePreSave,
        handleSave
    } = useGlobalBufferSettings();

    const [isGuideOpen, setIsGuideOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 size={32} className="animate-spin mb-3" />
                <span className="font-bold text-sm">กำลังโหลดข้อมูลระบบส่วนกลาง...</span>
            </div>
        );
    }

    return (
        <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
            <SaveConfirmationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleSave}
                changes={changesDiff}
                isSaving={isSaving}
            />

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden relative flex flex-col min-h-[60vh]">
                <div className="flex justify-between items-center pr-6">
                    <div className="flex-1">
                        <GlobalSettingsHeader 
                            title="บัฟเฟอร์คลังสินค้า" 
                            icon={Box}
                            onSave={handlePreSave}
                            isSaving={isSaving}
                        />
                    </div>
                    <button 
                        onClick={() => setIsGuideOpen(true)} 
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200 shadow-sm dh-active-press"
                    >
                        <Box size={16} /> คู่มือการใช้งาน
                    </button>
                </div>

                <div className="flex-1 p-6 sm:p-10 relative">
                    <div className="space-y-8 max-w-4xl mx-auto">
                        <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex gap-4 text-rose-800 shadow-sm transition-all hover:shadow-md">
                            <AlertTriangle size={24} className="shrink-0 text-rose-500"/>
                            <p className="text-sm font-bold leading-relaxed">
                                ค่าบัฟเฟอร์ (Buffer) คือจำนวนสต็อกที่ระบบจะ "กั๊ก" ไว้ไม่ให้ขายหน้าร้านจนหมด เพื่อสำรองไว้สำหรับงานเคลมหรือพันธมิตร
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-black text-slate-700 uppercase tracking-widest mb-2.5 block flex items-center gap-2">
                                <Box size={18} className="text-rose-500"/>
                                ค่าบัฟเฟอร์สต็อกพื้นฐาน (Global Buffer)
                            </label>
                            <div className="relative group">
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-rose-500 text-sm bg-rose-100 px-3 py-1.5 rounded-lg transition-colors group-hover:bg-rose-200">ชิ้น (Pcs)</span>
                                <input 
                                    type="number" min="0" 
                                    value={inventoryConfig.defaultBufferStock}
                                    onChange={(e) => setInventoryConfig({...inventoryConfig, defaultBufferStock: e.target.value})}
                                    className="w-full pl-5 pr-24 py-4 bg-slate-50 hover:bg-white border-2 border-slate-200 rounded-2xl font-black text-3xl text-rose-600 outline-none focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 disabled:bg-slate-50 disabled:text-slate-400 transition-all shadow-sm group-hover:border-rose-200"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <GuideModal 
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
                title="คู่มือ: ตั้งค่าบัฟเฟอร์คลังสินค้า"
                icon={Box}
                config={{
                    description: "ระบบบัฟเฟอร์ช่วยป้องกันปัญหาสินค้าหมดสต็อกกะทันหัน โดยระบบจะสำรองสินค้าไว้ไม่ให้ลูกค้าหน้าร้านกดซื้อได้ เพื่อให้คุณมีสินค้าสำรองสำหรับงานเคลม หรือสำหรับพันธมิตรระดับ VIP",
                    howTo: [
                        "<strong>แก้ไขค่า:</strong> พิมพ์ตัวเลขใหม่ลงในช่อง (ค่าปกติคือ 2 ชิ้น)",
                        "<strong>บันทึก:</strong> กดปุ่ม 'บันทึก' มุมบนขวา ระบบจะอัปเดตให้ทันที"
                    ],
                    tips: [
                        "หากสินค้าบางประเภทเป็นสินค้าที่หายาก ควรเพิ่มบัฟเฟอร์สต็อกให้สูงขึ้นเพื่อความปลอดภัย",
                        "สินค้าที่มีบัฟเฟอร์สต็อก จะขึ้นสถานะ 'สินค้าหมด' ในหน้าร้านออนไลน์ เมื่อสต็อกจริงเหลือน้อยกว่าหรือเท่ากับค่าบัฟเฟอร์"
                    ],
                    expectedResults: "การเปลี่ยนแปลงนี้มีผลกระทบทันทีกับจำนวนสต็อกที่สามารถขายได้จริงในหน้าเว็บ (Available Stock = Actual Stock - Buffer Stock)"
                }}
            />
        </div>
    );
}
