import React, { useState, useEffect } from 'react';
import { Box, AlertTriangle, Loader2, Lock } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { historyService } from '../../firebase/historyService';
import GlobalSettingsHeader from '../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../components/managers/SaveConfirmationModal';

export default function GlobalBufferSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [changesDiff, setChangesDiff] = useState([]);
    const [originalConfig, setOriginalConfig] = useState(null);
    const [inventoryConfig, setInventoryConfig] = useState({ defaultBufferStock: 2 });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const invSnap = await getDoc(doc(db, 'settings', 'inventory'));
                if (invSnap.exists()) {
                    setInventoryConfig(invSnap.data());
                    setOriginalConfig(invSnap.data());
                }
            } catch (error) {
                console.error("🔥 Error fetching buffer settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePreSave = () => {
        const changes = [];
        if (originalConfig) {
            if (Number(inventoryConfig.defaultBufferStock) !== Number(originalConfig.defaultBufferStock)) {
                changes.push({ label: 'ค่าบัฟเฟอร์สต็อกพื้นฐาน (Global Buffer)', oldVal: originalConfig.defaultBufferStock, newVal: inventoryConfig.defaultBufferStock });
            }
        }
        setChangesDiff(changes);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const uid = auth.currentUser?.uid;

        try {
            const buffer = Number(inventoryConfig.defaultBufferStock);
            if (buffer < 0) throw new Error("บัฟเฟอร์สต็อกห้ามติดลบ");

            await setDoc(doc(db, 'settings', 'inventory'), { defaultBufferStock: buffer }, { merge: true });
            const diffMsg = changesDiff.map(c => `${c.label}: ${c.oldVal}->${c.newVal}`).join(', ');
            await historyService.addLog('SystemConfig', 'Update', 'inventory', `อัปเดตบัฟเฟอร์กลางเป็น ${buffer} ชิ้น | ${diffMsg}`, uid);
            alert("✅ บันทึกบัฟเฟอร์สต็อกสำเร็จ");
            setOriginalConfig({ ...inventoryConfig, defaultBufferStock: buffer });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Save Error:", error);
            alert(`❌ เกิดข้อผิดพลาด: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

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
                    title="บัฟเฟอร์คลังสินค้า" 
                    icon={Box}
                    onSave={handlePreSave}
                    isSaving={isSaving}
                />

                <div className="flex-1 p-6 sm:p-10 relative">

                    <div className="space-y-8 max-w-4xl mx-auto">
                        <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex gap-4 text-rose-800 shadow-sm">
                            <AlertTriangle size={24} className="shrink-0 text-rose-500"/>
                            <p className="text-sm font-bold leading-relaxed">
                                ค่าบัฟเฟอร์ (Buffer) คือจำนวนสต็อกที่ระบบจะ "กั๊ก" ไว้ไม่ให้ขายหน้าร้านจนหมด เพื่อสำรองไว้สำหรับงานเคลมหรือพันธมิตร
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-black text-slate-700 uppercase tracking-widest mb-2.5 block">
                                ค่าบัฟเฟอร์สต็อกพื้นฐาน (Global Buffer)
                            </label>
                            <div className="relative group">
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-rose-500 text-sm">ชิ้น (Pcs)</span>
                                <input 
                                    type="number" min="0" 
                                    value={inventoryConfig.defaultBufferStock}
                                    onChange={(e) => setInventoryConfig({defaultBufferStock: e.target.value})}
                                    className="w-full pl-5 pr-24 py-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-3xl text-rose-600 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 disabled:bg-slate-50 disabled:text-slate-400 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
