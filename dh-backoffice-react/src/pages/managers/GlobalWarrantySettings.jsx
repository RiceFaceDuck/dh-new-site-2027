import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { auth } from '../../firebase/config';
import { historyService } from '../../firebase/historyService';
import { warrantyService } from '../../firebase/warrantyService';
import GlobalSettingsHeader from '../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../components/managers/SaveConfirmationModal';

export default function GlobalWarrantySettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [changesDiff, setChangesDiff] = useState([]);
    const [originalConfig, setOriginalConfig] = useState(null);
    const [warrantyConfig, setWarrantyConfig] = useState({
        categories: {}
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const warrantyData = await warrantyService.getWarrantySettings();
                if (warrantyData) {
                    setWarrantyConfig(warrantyData);
                    setOriginalConfig(warrantyData);
                }
            } catch (error) {
                console.error("🔥 Error fetching warranty settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePreSave = () => {
        const changes = [];
        if (originalConfig) {
            Object.entries(warrantyConfig.categories).forEach(([catName, data]) => {
                const origData = originalConfig.categories[catName];
                if (origData) {
                    if (data.claimDays !== origData.claimDays) {
                        changes.push({ label: `[${catName}] เคลมซ่อม (วัน)`, oldVal: origData.claimDays, newVal: data.claimDays });
                    }
                    if (data.returnDays !== origData.returnDays) {
                        changes.push({ label: `[${catName}] คืนเงิน (วัน)`, oldVal: origData.returnDays, newVal: data.returnDays });
                    }
                }
            });
        }
        setChangesDiff(changes);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const uid = auth.currentUser?.uid;
        try {
            await warrantyService.updateWarrantySettings(warrantyConfig, uid);
            const diffMsg = changesDiff.map(c => `${c.label}: ${c.oldVal}->${c.newVal}`).join(', ');
            await historyService.addLog('SystemConfig', 'Update', 'warranty', `อัปเดตกติกาประกัน | ${diffMsg}`, uid);
            alert("✅ บันทึกกติกาประกันพื้นฐานสำเร็จ");
            setOriginalConfig(JSON.parse(JSON.stringify(warrantyConfig)));
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
                                <div key={catName} className="p-5 border-2 border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                                    <div className="font-black text-slate-800 text-sm border-b-2 border-slate-100 pb-3 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                        {catName}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">เคลมซ่อม (วัน)</label>
                                            <div className="relative">
                                                <input 
                                                    type="number" min="0" disabled={false} value={data.claimDays}
                                                    onChange={(e) => setWarrantyConfig(prev => ({...prev, categories: {...prev.categories, [catName]: {...data, claimDays: Number(e.target.value)}}}))}
                                                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-700 outline-none focus:border-amber-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-400 transition-all text-center"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">คืนเงิน (วัน)</label>
                                            <div className="relative">
                                                <input 
                                                    type="number" min="0" disabled={false} value={data.returnDays}
                                                    onChange={(e) => setWarrantyConfig(prev => ({...prev, categories: {...prev.categories, [catName]: {...data, returnDays: Number(e.target.value)}}}))}
                                                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-700 outline-none focus:border-amber-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-400 transition-all text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
