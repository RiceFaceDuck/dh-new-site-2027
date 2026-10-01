import { Image as ImageIcon, Loader2, RotateCcw } from 'lucide-react';
import GlobalSettingsHeader from '../../../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../../../components/managers/SaveConfirmationModal';
import useThemeSettings from './useThemeSettings';
import ThemeLivePreview from './ThemeLivePreview';

export default function ThemeConfigTab() {
    const {
        isLoading,
        isSaving,
        isModalOpen,
        setIsModalOpen,
        changesDiff,
        themeConfig,
        setThemeConfig,
        handlePreSave,
        handleSave,
        handleResetToDefault
    } = useThemeSettings();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 size={32} className="animate-spin mb-3 text-fuchsia-600" />
                <span className="font-bold text-sm">กำลังโหลดข้อมูลระบบส่วนกลาง...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SaveConfirmationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleSave}
                changes={changesDiff}
                isSaving={isSaving}
            />

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden relative flex flex-col min-h-[60vh]">
                <div className="relative">
                    <GlobalSettingsHeader 
                        title="ธีมและพื้นหลังหน้าบ้าน" 
                        icon={ImageIcon}
                        onSave={handlePreSave}
                        isSaving={isSaving}
                    />

                    {/* Reset to Default Button */}
                    <button
                        onClick={handleResetToDefault}
                        type="button"
                        className="absolute right-6 top-1/2 -translate-y-1/2 mr-32 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-300 dh-active-press shadow-xs"
                    >
                        <RotateCcw size={14} /> คืนค่าเริ่มต้น
                    </button>
                </div>

                <div className="flex-1 p-6 sm:p-10 relative bg-slate-50/50">
                    <div className="space-y-8 max-w-full mx-auto">
                        <div className="bg-fuchsia-50 border border-fuchsia-100 p-5 rounded-2xl flex gap-4 text-fuchsia-800 shadow-xs">
                            <ImageIcon size={24} className="shrink-0 text-fuchsia-500 mt-0.5"/>
                            <p className="text-sm font-bold leading-relaxed">
                                ปรับเปลี่ยนภาพพื้นหลัง และการไล่สี (Gradient) ขาวแบบกระจกฝ้าหน้าบ้าน การตั้งค่านี้จะส่งผลต่อหน้าลูกค้า (Storefront) โดยอัตโนมัติทันที
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Theme Selection */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow">
                                <label className="text-sm font-black text-slate-700 uppercase tracking-widest mb-3 block">
                                    ระบบธีมสี (Theme Selection)
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className={`cursor-pointer flex items-center p-4 border-2 rounded-xl transition-all ${themeConfig.themeId === 'theme-trusted-partner' ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-slate-200 hover:border-fuchsia-300'}`}>
                                        <input 
                                            type="radio" 
                                            name="themeId" 
                                            value="theme-trusted-partner"
                                            checked={themeConfig.themeId === 'theme-trusted-partner'}
                                            onChange={(e) => setThemeConfig({...themeConfig, themeId: e.target.value})}
                                            className="w-5 h-5 text-fuchsia-600 focus:ring-fuchsia-500"
                                        />
                                        <div className="ml-3">
                                            <span className="block text-sm font-bold text-slate-800">Trusted Partner (แนะนำ)</span>
                                            <span className="block text-xs text-slate-500 mt-1">โทนสีอบอุ่น สบายตา เข้าถึงง่าย ดูเป็นมิตร</span>
                                        </div>
                                    </label>
                                    <label className={`cursor-pointer flex items-center p-4 border-2 rounded-xl transition-all ${themeConfig.themeId === 'theme-tech-professional' ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-slate-200 hover:border-fuchsia-300'}`}>
                                        <input 
                                            type="radio" 
                                            name="themeId" 
                                            value="theme-tech-professional"
                                            checked={themeConfig.themeId === 'theme-tech-professional'}
                                            onChange={(e) => setThemeConfig({...themeConfig, themeId: e.target.value})}
                                            className="w-5 h-5 text-fuchsia-600 focus:ring-fuchsia-500"
                                        />
                                        <div className="ml-3">
                                            <span className="block text-sm font-bold text-slate-800">Tech Professional (ดั้งเดิม)</span>
                                            <span className="block text-xs text-slate-500 mt-1">โทนสีฟ้าไซเบอร์ ดุดัน เน้นความเป็นเทคโนโลยี</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Background URL */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow">
                                <label className="text-sm font-black text-slate-700 uppercase tracking-widest mb-3 block">
                                    ลิงก์รูปภาพพื้นหลัง (Background URL)
                                </label>
                                <input 
                                    type="text" 
                                    value={themeConfig.backgroundUrl}
                                    onChange={(e) => setThemeConfig({...themeConfig, backgroundUrl: e.target.value})}
                                    placeholder="ตัวอย่าง: /user-bg.jpg หรือ https://.../image.jpg"
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-base text-slate-700 outline-hidden focus:border-fuchsia-500 focus:bg-white focus:ring-4 focus:ring-fuchsia-500/10 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                                />
                                <p className="text-xs text-slate-500 mt-3 font-medium leading-relaxed">
                                    ใช้พาธในระบบเช่น `/user-bg.jpg` หรือนำภาพไปฝากไว้ที่อื่นแล้วนำ URL มาวางได้เลย
                                </p>
                            </div>

                            {/* Blur & Opacity Sliders */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 hover:shadow-md transition-shadow">
                                {/* Blur */}
                                <div>
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center justify-between">
                                        <span>ระดับความเบลอภาพ (Blur)</span>
                                        <span className="text-fuchsia-600 bg-fuchsia-50 px-3 py-1 rounded-full">{themeConfig.blurLevel} px</span>
                                    </label>
                                    <input 
                                        type="range" min="0" max="60" step="2"
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
                                        type="range" min="0" max="100" step="5"
                                        value={themeConfig.opacityTop}
                                        onChange={(e) => setThemeConfig({...themeConfig, opacityTop: Number(e.target.value) || 0})}
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
                                        type="range" min="0" max="100" step="5"
                                        value={themeConfig.opacityMid}
                                        onChange={(e) => setThemeConfig({...themeConfig, opacityMid: Number(e.target.value) || 0})}
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
                                        type="range" min="0" max="100" step="5"
                                        value={themeConfig.opacityBottom}
                                        onChange={(e) => setThemeConfig({...themeConfig, opacityBottom: Number(e.target.value) || 0})}
                                        className="w-full accent-fuchsia-600 disabled:opacity-50 cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Live Realtime Preview */}
                            <ThemeLivePreview themeConfig={themeConfig} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
