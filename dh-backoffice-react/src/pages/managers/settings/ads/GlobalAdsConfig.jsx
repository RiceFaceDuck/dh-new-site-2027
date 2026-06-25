import React from 'react';
import { Megaphone, Eye, MousePointerClick, LayoutTemplate, Loader2 } from 'lucide-react';
import GlobalSettingsHeader from '../../../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../../../components/managers/SaveConfirmationModal';
import GuideModal from '../../../../components/common/GuideModal';
import { useGlobalAdsConfig } from './hooks/useGlobalAdsConfig';

export default function GlobalAdsConfig() {
    const {
        isLoading,
        isSaving,
        isModalOpen,
        setIsModalOpen,
        changesDiff,
        adConfig,
        setAdConfig,
        handlePreSave,
        handleSave
    } = useGlobalAdsConfig();

    const [isGuideOpen, setIsGuideOpen] = React.useState(false);

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
                            title="ตั้งค่าพื้นที่โฆษณา" 
                            icon={Megaphone}
                            onSave={handlePreSave}
                            isSaving={isSaving}
                        />
                    </div>
                    <button 
                        onClick={() => setIsGuideOpen(true)} 
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200 shadow-sm dh-active-press"
                    >
                        <Megaphone size={16} /> คู่มือการใช้งาน
                    </button>
                </div>

                <div className="flex-1 p-6 sm:p-10 relative bg-slate-50/50">
                    <div className="space-y-8 max-w-5xl mx-auto">
                        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex gap-4 text-indigo-800 shadow-sm transition-all hover:shadow-md">
                            <Megaphone size={24} className="shrink-0 text-indigo-500 mt-0.5"/>
                            <p className="text-sm font-bold leading-relaxed">
                                ตั้งค่าเรทราคา (Credit Points) สำหรับหักผู้ลงโฆษณาเมื่อมีผู้เข้าชมหรือคลิก รวมถึงตั้งค่าอัตราส่วนการสุ่มโฆษณาไปแสดงผลบนหน้าร้าน
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* ค่า Credit / 1 View */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
                                <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Eye size={18} className="text-indigo-500 group-hover:scale-110 transition-transform"/> หักเครดิตเมื่อมองเห็น (View)
                                </label>
                                <div className="relative">
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs bg-slate-100 px-2 py-1 rounded-md transition-colors">แต้ม / 1 ครั้ง</span>
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
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
                                <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <MousePointerClick size={18} className="text-indigo-500 group-hover:scale-110 transition-transform"/> หักเครดิตเมื่อถูกคลิก (Click)
                                </label>
                                <div className="relative">
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs bg-slate-100 px-2 py-1 rounded-md transition-colors">แต้ม / 1 ครั้ง</span>
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
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sm:col-span-2 hover:shadow-md hover:border-indigo-200 transition-all group">
                                <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <LayoutTemplate size={18} className="text-indigo-500 group-hover:scale-110 transition-transform"/> ความถี่ในการแสดงผล (Display Ratio)
                                </label>
                                <div className="relative">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-2xl transition-colors">1 :</div>
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-[11px] sm:text-xs bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">โฆษณา 1 ชิ้น : สินค้าปกติ N ชิ้น</span>
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

            <GuideModal 
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
                title="คู่มือ: ตั้งค่าพื้นที่โฆษณา (Global Ads Config)"
                icon={Megaphone}
                config={{
                    description: "หน้าจอนี้ใช้สำหรับกำหนดกฎเกณฑ์ในการหักเครดิตของ Partner เมื่อโฆษณาถูกแสดงผลหรือถูกคลิก และกำหนดความถี่ที่โฆษณาจะปรากฏแทรกระหว่างสินค้าปกติบนหน้าร้าน",
                    howTo: [
                        "<strong>ตั้งค่าเรท View/Click:</strong> ระบุจำนวนแต้ม (Credit Points) ที่ต้องการหักออกจาก Wallet ของ Partner เมื่อเกิดเหตุการณ์นั้นๆ",
                        "<strong>ตั้งค่าความถี่ (Ratio):</strong> เช่น 10 หมายความว่า โฆษณา 1 ชิ้นจะถูกแทรกให้แสดงผลทุกๆ การเลื่อนผ่านสินค้า 10 ชิ้นบนหน้าเว็บ"
                    ],
                    tips: [
                        "ถ้าตั้งเรท View ไว้ต่ำ (เช่น 0.1 หรือ 0.5) จะช่วยดึงดูดให้ Partner อยากลงโฆษณามากขึ้น แต่ต้องระวังเรื่องการแสดงผลบ่อยเกินไปจนกวนใจลูกค้า",
                        "แนะนำให้ตั้งค่าความถี่ Ratio ระหว่าง 10-20 เพื่อให้ดูเป็นธรรมชาติ"
                    ],
                    expectedResults: "การเปลี่ยนแปลงนี้จะส่งผลกับโฆษณาทั้งหมดในระบบทันที และทุกๆ การตั้งค่าจะถูกบันทึกไว้ใน History Log เพื่อตรวจสอบย้อนหลัง"
                }}
            />
        </div>
    );
}
