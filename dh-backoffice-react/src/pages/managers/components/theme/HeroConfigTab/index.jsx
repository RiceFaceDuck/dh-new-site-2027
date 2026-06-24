import React, { useState, useEffect } from 'react';
import { MonitorPlay, Loader2, BookOpen, Save, AlertTriangle, X, Check } from 'lucide-react';
import { heroConfigService } from '../../../../../firebase/heroConfigService';
import { driveService } from '../../../../../firebase/driveService';
import GlobalSettingsHeader from '../../../../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../../../../components/managers/SaveConfirmationModal';
import GuideModal from '../../../../../components/common/GuideModal';
import { heroGuideConfig } from './HeroGuideConfig';

// Import sub-components
import HeroStatusToggle from './HeroStatusToggle';
import HeroImageUpload from './HeroImageUpload';
import HeroGradientConfig from './HeroGradientConfig';
import HeroTitleEditor from './HeroTitleEditor';
import HeroButtonConfig from './HeroButtonConfig';
import HeroLivePreview from './HeroLivePreview';

export default function HeroConfigTab() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
    const [errorMessage, setErrorMessage] = useState('');
    const [changesDiff, setChangesDiff] = useState([]);
    
    const [originalConfig, setOriginalConfig] = useState(null);
    const [heroConfig, setHeroConfig] = useState({
        isActive: true,
        title: '',
        titleSegments: [],
        imageUrl: '',
        overlay: { color: '#1f2937', opacity: 90 },
        primaryButton: { label: '', link: '', isActive: true },
        secondaryButton: { label: '', link: '', isActive: true }
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await heroConfigService.getHeroConfig();
                if (data) {
                    setHeroConfig(data);
                    setOriginalConfig(data);
                }
            } catch (error) {
                console.error("🔥 Error fetching hero config:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('❌ ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)');
            return;
        }

        setIsUploading(true);
        try {
            const url = await driveService.uploadImage(file);
            setHeroConfig(prev => ({ ...prev, imageUrl: url }));
        } catch (error) {
            alert('❌ อัพโหลดรูปล้มเหลว: ' + error);
        } finally {
            setIsUploading(false);
            e.target.value = null;
        }
    };

    const handlePreSave = () => {
        const changes = [];
        if (originalConfig) {
            if (heroConfig.isActive !== originalConfig.isActive) {
                changes.push({ label: 'สถานะป้าย', oldVal: originalConfig.isActive ? 'เปิด' : 'ปิด', newVal: heroConfig.isActive ? 'เปิด' : 'ปิด' });
            }
            if (heroConfig.title !== originalConfig.title) {
                changes.push({ label: 'ข้อความหลัก (Title)', oldVal: 'ค่าเดิม', newVal: 'อัพเดทใหม่' });
            }
            if (heroConfig.imageUrl !== originalConfig.imageUrl) {
                changes.push({ label: 'รูปภาพพื้นหลัง', oldVal: originalConfig.imageUrl ? 'มีการตั้งค่า' : 'ไม่มี', newVal: heroConfig.imageUrl ? 'อัพเดทใหม่' : 'ไม่มี' });
            }
            if (heroConfig.overlay?.color !== originalConfig.overlay?.color || heroConfig.overlay?.opacity !== originalConfig.overlay?.opacity) {
                changes.push({ label: 'การไล่เฉดสี', oldVal: 'ค่าเดิม', newVal: 'ค่าใหม่' });
            }
        }
        setChangesDiff(changes);
        setSaveStatus(null);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await heroConfigService.updateHeroConfig(heroConfig, changesDiff);
            if (result.success) {
                setOriginalConfig({ ...heroConfig });
                setIsModalOpen(false); // ปิด modal ยืนยัน
                setSaveStatus('success'); // เปิด modal สำเร็จ
            } else {
                setIsModalOpen(false);
                setSaveStatus('error');
                setErrorMessage(result.error || 'ไม่สามารถบันทึกข้อมูลได้');
            }
        } catch (error) {
            console.error("Save error:", error);
            setIsModalOpen(false);
            setSaveStatus('error');
            setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 size={32} className="animate-spin mb-3" />
                <span className="font-bold text-sm">กำลังโหลดข้อมูลระบบป้ายโฆษณา...</span>
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

            {/* Success Modal */}
            {saveStatus === 'success' && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col items-center p-8 text-center border border-emerald-100">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-5 shadow-inner">
                            <Check size={40} className="stroke-[3]" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">บันทึกสำเร็จ!</h2>
                        <p className="text-slate-500 mb-8">การตั้งค่าป้ายโฆษณาหน้าแรกถูกอัปเดตเรียบร้อยแล้ว ข้อมูลหน้าเว็บจะเปลี่ยนทันที</p>
                        <button 
                            onClick={() => setSaveStatus(null)}
                            className="w-full px-5 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            ตกลง
                        </button>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {saveStatus === 'error' && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col items-center p-8 text-center border border-red-100">
                        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-5 shadow-inner">
                            <X size={40} className="stroke-[3]" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">เกิดข้อผิดพลาด</h2>
                        <p className="text-red-500 mb-8">{errorMessage}</p>
                        <button 
                            onClick={() => setSaveStatus(null)}
                            className="w-full px-5 py-3.5 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-all active:scale-95"
                        >
                            ลองใหม่อีกครั้ง
                        </button>
                    </div>
                </div>
            )}

            <GuideModal 
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
                title="คู่มือการใช้งาน: ตั้งค่าป้ายหน้าแรก"
                config={heroGuideConfig}
            />

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden relative flex flex-col min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative">
                    <GlobalSettingsHeader 
                        title="ตั้งค่าป้ายโฆษณาหลักหน้าแรก (Hero Billboard)" 
                        icon={MonitorPlay}
                        onSave={handlePreSave}
                        isSaving={isSaving}
                    />
                    
                    {/* ปุ่มคู่มือการใช้งาน (Guide Button) */}
                    <button 
                        onClick={() => setIsGuideOpen(true)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 mr-32 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-blue-200 hover:border-blue-300 dh-active-press shadow-sm"
                    >
                        <BookOpen size={16} />
                        คู่มือการใช้งาน
                    </button>
                </div>

                <div className="flex-1 p-6 sm:p-10 relative bg-slate-50/50 overflow-y-auto">
                    <div className="space-y-8 max-w-4xl mx-auto">
                        
                        <HeroStatusToggle 
                            isActive={heroConfig.isActive} 
                            onChange={(isActive) => setHeroConfig({...heroConfig, isActive})} 
                        />

                        <HeroImageUpload 
                            imageUrl={heroConfig.imageUrl} 
                            onUpload={handleImageUpload} 
                            isUploading={isUploading} 
                        />

                        <HeroGradientConfig
                            overlay={heroConfig.overlay}
                            onChange={(overlay) => setHeroConfig({...heroConfig, overlay})}
                        />

                        <HeroTitleEditor 
                            titleSegments={heroConfig.titleSegments || []} 
                            onChange={(segments) => {
                                const html = segments.map(seg => {
                                    let segHtml = seg.text;
                                    
                                    let classes = [];
                                    if (seg.isBold) classes.push('font-black');
                                    if (seg.isItalic) classes.push('italic');
                                    if (seg.isUnderline) classes.push('underline');
                                    if (seg.isStrikethrough) classes.push('line-through');
                                    
                                    const color = seg.color || (seg.isHighlight ? '#facc15' : '');
                                    const classStr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
                                    const styleStr = color ? ` style="color: ${color}"` : '';
                                    
                                    if (classStr || styleStr) {
                                        segHtml = `<span${classStr}${styleStr}>${segHtml}</span>`;
                                    }
                                    
                                    if (seg.breakAll) segHtml += `<br />`;
                                    else if (seg.breakDesktop) segHtml += `<br class="hidden md:block" />`;
                                    return segHtml;
                                }).join(' ');

                                setHeroConfig({...heroConfig, titleSegments: segments, title: html});
                            }} 
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <HeroButtonConfig 
                                {...heroConfig.primaryButton}
                                type="primary"
                                onChange={(btn) => setHeroConfig({...heroConfig, primaryButton: btn})}
                            />
                            <HeroButtonConfig 
                                {...heroConfig.secondaryButton}
                                type="secondary"
                                onChange={(btn) => setHeroConfig({...heroConfig, secondaryButton: btn})}
                            />
                        </div>

                        <HeroLivePreview config={heroConfig} />

                    </div>
                </div>
            </div>
        </div>
    );
}
