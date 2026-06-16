import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { auth } from '../../firebase/config';
import { settingsService } from '../../firebase/settingsService';
import { historyService } from '../../firebase/historyService';
import GlobalSettingsHeader from '../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../components/managers/SaveConfirmationModal';

export default function GlobalThemeSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [changesDiff, setChangesDiff] = useState([]);
    const [originalConfig, setOriginalConfig] = useState(null);
    const [themeConfig, setThemeConfig] = useState({
        backgroundUrl: '/user-bg.jpg',
        blurLevel: '16',
        opacityTop: 75,
        opacityMid: 55,
        opacityBottom: 35
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const themeData = await settingsService.getStorefrontTheme();
                if (themeData) {
                    setThemeConfig(themeData);
                    setOriginalConfig(themeData);
                }
            } catch (error) {
                console.error("🔥 Error fetching theme settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePreSave = () => {
        const changes = [];
        if (originalConfig) {
            if (themeConfig.backgroundUrl !== originalConfig.backgroundUrl) {
                changes.push({ label: 'ลิงก์รูปภาพพื้นหลัง', oldVal: originalConfig.backgroundUrl, newVal: themeConfig.backgroundUrl });
            }
            if (String(themeConfig.blurLevel) !== String(originalConfig.blurLevel)) {
                changes.push({ label: 'ระดับความเบลอภาพ (Blur)', oldVal: `${originalConfig.blurLevel} px`, newVal: `${themeConfig.blurLevel} px` });
            }
            if (String(themeConfig.opacityTop) !== String(originalConfig.opacityTop)) {
                changes.push({ label: 'ความขาวด้านบน', oldVal: `${originalConfig.opacityTop}%`, newVal: `${themeConfig.opacityTop}%` });
            }
            if (String(themeConfig.opacityMid) !== String(originalConfig.opacityMid)) {
                changes.push({ label: 'ความขาวตรงกลาง', oldVal: `${originalConfig.opacityMid}%`, newVal: `${themeConfig.opacityMid}%` });
            }
            if (String(themeConfig.opacityBottom) !== String(originalConfig.opacityBottom)) {
                changes.push({ label: 'ความขาวด้านล่าง', oldVal: `${originalConfig.opacityBottom}%`, newVal: `${themeConfig.opacityBottom}%` });
            }
        }
        setChangesDiff(changes);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const uid = auth.currentUser?.uid;
        try {
            const cleanTheme = {
                backgroundUrl: themeConfig.backgroundUrl.trim() || '/user-bg.jpg',
                blurLevel: String(themeConfig.blurLevel),
                opacityTop: Number(themeConfig.opacityTop),
                opacityMid: Number(themeConfig.opacityMid),
                opacityBottom: Number(themeConfig.opacityBottom),
            };
            await settingsService.updateStorefrontTheme(cleanTheme);
            const diffMsg = changesDiff.map(c => `${c.label}: ${c.oldVal}->${c.newVal}`).join(', ');
            await historyService.addLog('SystemConfig', 'Update', 'theme', `อัปเดตธีมหน้าบ้านสำเร็จ | ${diffMsg}`, uid);
            alert("✅ บันทึกธีมหน้าบ้านสำเร็จ (หน้าบ้านจะเปลี่ยนตามทันที)");
            setOriginalConfig({ ...cleanTheme });
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
                    title="ธีมและพื้นหลังหน้าบ้าน" 
                    icon={ImageIcon}
                    onSave={handlePreSave}
                    isSaving={isSaving}
                />

                <div className="flex-1 p-6 sm:p-10 relative bg-slate-50/50">

                    <div className="space-y-8 max-w-full mx-auto">
                        <div className="bg-fuchsia-50 border border-fuchsia-100 p-5 rounded-2xl flex gap-4 text-fuchsia-800 shadow-sm">
                            <ImageIcon size={24} className="shrink-0 text-fuchsia-500 mt-0.5"/>
                            <p className="text-sm font-bold leading-relaxed">
                                ปรับเปลี่ยนภาพพื้นหลัง และการไล่สี (Gradient) ขาวแบบกระจกฝ้าหน้าบ้าน การตั้งค่านี้จะส่งผลต่อหน้าลูกค้า (Storefront) โดยอัตโนมัติทันที
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Background URL */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <label className="text-sm font-black text-slate-700 uppercase tracking-widest mb-3 block">
                                    ลิงก์รูปภาพพื้นหลัง (Background URL)
                                </label>
                                <input 
                                    type="text" disabled={false}
                                    value={themeConfig.backgroundUrl}
                                    onChange={(e) => setThemeConfig({...themeConfig, backgroundUrl: e.target.value})}
                                    placeholder="ตัวอย่าง: /user-bg.jpg หรือ https://.../image.jpg"
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-base text-slate-700 outline-none focus:border-fuchsia-500 focus:bg-white focus:ring-4 focus:ring-fuchsia-500/10 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                                />
                                <p className="text-xs text-slate-500 mt-3 font-medium leading-relaxed">
                                    ใช้พาธในระบบเช่น `/user-bg.jpg` หรือนำภาพไปฝากไว้ที่อื่นแล้วนำ URL มาวางได้เลย
                                </p>
                            </div>

                            {/* Blur & Opacity */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 hover:shadow-md transition-shadow">
                                {/* Blur */}
                                <div>
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center justify-between">
                                        <span>ระดับความเบลอภาพ (Blur)</span>
                                        <span className="text-fuchsia-600 bg-fuchsia-50 px-3 py-1 rounded-full">{themeConfig.blurLevel} px</span>
                                    </label>
                                    <input 
                                        type="range" min="0" max="60" step="2" disabled={false}
                                        value={themeConfig.blurLevel}
                                        onChange={(e) => setThemeConfig({...themeConfig, blurLevel: e.target.value})}
                                        className="w-full accent-fuchsia-600 disabled:opacity-50 cursor-pointer"
                                    />
                                </div>

                                {/* Top Opacity */}
                                <div>
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center justify-between">
                                        <span>ความขาวด้านบน (Top Opacity)</span>
                                        <span className="text-fuchsia-600 bg-fuchsia-50 px-3 py-1 rounded-full">{themeConfig.opacityTop}%</span>
                                    </label>
                                    <input 
                                        type="range" min="0" max="100" step="5" disabled={false}
                                        value={themeConfig.opacityTop}
                                        onChange={(e) => setThemeConfig({...themeConfig, opacityTop: e.target.value})}
                                        className="w-full accent-fuchsia-600 disabled:opacity-50 cursor-pointer"
                                    />
                                </div>

                                {/* Mid Opacity */}
                                <div>
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center justify-between">
                                        <span>ความขาวตรงกลาง (Mid Opacity)</span>
                                        <span className="text-fuchsia-600 bg-fuchsia-50 px-3 py-1 rounded-full">{themeConfig.opacityMid}%</span>
                                    </label>
                                    <input 
                                        type="range" min="0" max="100" step="5" disabled={false}
                                        value={themeConfig.opacityMid}
                                        onChange={(e) => setThemeConfig({...themeConfig, opacityMid: e.target.value})}
                                        className="w-full accent-fuchsia-600 disabled:opacity-50 cursor-pointer"
                                    />
                                </div>

                                {/* Bottom Opacity */}
                                <div>
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center justify-between">
                                        <span>ความขาวด้านล่าง (Bottom Opacity)</span>
                                        <span className="text-fuchsia-600 bg-fuchsia-50 px-3 py-1 rounded-full">{themeConfig.opacityBottom}%</span>
                                    </label>
                                    <input 
                                        type="range" min="0" max="100" step="5" disabled={false}
                                        value={themeConfig.opacityBottom}
                                        onChange={(e) => setThemeConfig({...themeConfig, opacityBottom: e.target.value})}
                                        className="w-full accent-fuchsia-600 disabled:opacity-50 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
