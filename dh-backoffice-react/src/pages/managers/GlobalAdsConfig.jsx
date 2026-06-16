import React, { useState, useEffect } from 'react';
import { Megaphone, Eye, MousePointerClick, LayoutTemplate, Loader2 } from 'lucide-react';
import { auth } from '../../firebase/config';
import { settingsService } from '../../firebase/settingsService';
import { historyService } from '../../firebase/historyService';
import GlobalSettingsHeader from '../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../components/managers/SaveConfirmationModal';

export default function GlobalAdsConfig() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [changesDiff, setChangesDiff] = useState([]);
    
    const [adConfig, setAdConfig] = useState({
        costPerView: 1,
        costPerClick: 5,
        displayRatio: 10
    });
    const [originalConfig, setOriginalConfig] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const adData = await settingsService.getAdRates();
                if (adData) {
                    const loadedData = {
                        costPerView: adData.costPerView ?? 1,
                        costPerClick: adData.costPerClick ?? 5,
                        displayRatio: adData.displayRatio ?? 10
                    };
                    setAdConfig(loadedData);
                    setOriginalConfig(loadedData);
                }
            } catch (error) {
                console.error("🔥 Error fetching ads config:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePreSave = () => {
        const changes = [];
        if (originalConfig) {
            if (Number(adConfig.costPerView) !== Number(originalConfig.costPerView)) {
                changes.push({ label: 'หักเครดิตเมื่อมองเห็น (View)', oldVal: originalConfig.costPerView, newVal: adConfig.costPerView });
            }
            if (Number(adConfig.costPerClick) !== Number(originalConfig.costPerClick)) {
                changes.push({ label: 'หักเครดิตเมื่อถูกคลิก (Click)', oldVal: originalConfig.costPerClick, newVal: adConfig.costPerClick });
            }
            if (Number(adConfig.displayRatio) !== Number(originalConfig.displayRatio)) {
                changes.push({ label: 'ความถี่ในการแสดงผล (Ratio)', oldVal: originalConfig.displayRatio, newVal: adConfig.displayRatio });
            }
        }
        setChangesDiff(changes);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const uid = auth.currentUser?.uid;
        try {
            const cView = Number(adConfig.costPerView);
            const cClick = Number(adConfig.costPerClick);
            const ratio = Number(adConfig.displayRatio);
            
            if (cView < 0) throw new Error("ค่า Credit ต่อ View ห้ามติดลบ");
            if (cClick < 0) throw new Error("ค่า Credit ต่อ Click ห้ามติดลบ");
            if (ratio <= 0) throw new Error("อัตราส่วนความถี่ในการแสดงผลต้องมากกว่า 0");

            const res = await settingsService.updateAdRates(adConfig);
            if (res.success) {
                const diffMsg = changesDiff.map(c => `${c.label}: ${c.oldVal}->${c.newVal}`).join(', ');
                await historyService.addLog('SystemConfig', 'Update', 'marketing', `อัปเดตเรทโฆษณา | ${diffMsg}`, uid);
                alert("✅ บันทึกการตั้งค่าพื้นที่โฆษณาสำเร็จ");
                setOriginalConfig({ ...adConfig, costPerView: cView, costPerClick: cClick, displayRatio: ratio });
                setIsModalOpen(false);
            } else {
                throw new Error(res.message);
            }
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
                    title="ตั้งค่าพื้นที่โฆษณา" 
                    icon={Megaphone}
                    onSave={handlePreSave}
                    isSaving={isSaving}
                />

                <div className="flex-1 p-6 sm:p-10 relative bg-slate-50/50">
                    <div className="space-y-8 max-w-5xl mx-auto">
                        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex gap-4 text-indigo-800 shadow-sm">
                            <Megaphone size={24} className="shrink-0 text-indigo-500 mt-0.5"/>
                            <p className="text-sm font-bold leading-relaxed">
                                ตั้งค่าเรทราคา (Credit Points) สำหรับหักผู้ลงโฆษณาเมื่อมีผู้เข้าชมหรือคลิก รวมถึงตั้งค่าอัตราส่วนการสุ่มโฆษณาไปแสดงผลบนหน้าร้าน
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* ค่า Credit / 1 View */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Eye size={18} className="text-indigo-500"/> หักเครดิตเมื่อมองเห็น (View)
                                </label>
                                <div className="relative group">
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs bg-slate-100 px-2 py-1 rounded-md group-focus-within:bg-indigo-100 group-focus-within:text-indigo-600 transition-colors">แต้ม / 1 ครั้ง</span>
                                    <input 
                                        type="number" min="0" step="0.1" 
                                        value={adConfig.costPerView}
                                        onChange={(e) => setAdConfig({...adConfig, costPerView: e.target.value})}
                                        className="w-full pl-5 pr-28 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-black text-2xl text-indigo-600 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-3 font-medium leading-relaxed">
                                    หักเครดิตตามยอดนี้ เมื่อลูกค้าเลื่อนผ่านโฆษณาเกิน 50% ของขนาดภาพ
                                </p>
                            </div>

                            {/* ค่า Credit / 1 Click */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <MousePointerClick size={18} className="text-indigo-500"/> หักเครดิตเมื่อถูกคลิก (Click)
                                </label>
                                <div className="relative group">
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs bg-slate-100 px-2 py-1 rounded-md group-focus-within:bg-indigo-100 group-focus-within:text-indigo-600 transition-colors">แต้ม / 1 ครั้ง</span>
                                    <input 
                                        type="number" min="0" step="0.1" 
                                        value={adConfig.costPerClick}
                                        onChange={(e) => setAdConfig({...adConfig, costPerClick: e.target.value})}
                                        className="w-full pl-5 pr-28 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-black text-2xl text-indigo-600 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-3 font-medium leading-relaxed">
                                    หักเครดิตตามยอดนี้ เมื่อลูกค้ากดดูรายละเอียด หรือกดออกไปซื้อสินค้านอกเว็บ
                                </p>
                            </div>

                            {/* อัตราส่วน 10:1 */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sm:col-span-2 hover:shadow-md transition-shadow">
                                <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <LayoutTemplate size={18} className="text-indigo-500"/> ความถี่ในการแสดงผล (Display Ratio)
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-2xl group-focus-within:text-indigo-500 transition-colors">1 :</div>
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-[11px] sm:text-xs bg-slate-100 px-3 py-1.5 rounded-lg group-focus-within:bg-indigo-100 group-focus-within:text-indigo-600 transition-colors">โฆษณา 1 ชิ้น : สินค้าปกติ N ชิ้น</span>
                                    <input 
                                        type="number" min="1" step="1" 
                                        value={adConfig.displayRatio}
                                        onChange={(e) => setAdConfig({...adConfig, displayRatio: e.target.value})}
                                        className="w-full pl-16 pr-52 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-black text-2xl text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-3 font-medium leading-relaxed">
                                    ตัวอย่าง 1:10 หมายถึง ระบบจะแทรกโฆษณาแบบสุ่มตำแหน่ง 1 ชิ้น ในทุกๆ กลุ่มสินค้าปกติ 10 ชิ้นบนหน้าบ้าน
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
