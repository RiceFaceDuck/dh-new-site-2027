import React, { useState, useEffect } from 'react';
import { MonitorPlay, Loader2, UploadCloud, Link as LinkIcon, Type, Image as ImageIcon } from 'lucide-react';
import { auth } from '../../../../firebase/config';
import { settingsService } from '../../../../firebase/settingsService';
import { historyService } from '../../../../firebase/historyService';
import { driveService } from '../../../../firebase/driveService';
import GlobalSettingsHeader from '../../../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../../../components/managers/SaveConfirmationModal';

export default function HeroConfigTab() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [changesDiff, setChangesDiff] = useState([]);
    const [originalConfig, setOriginalConfig] = useState(null);
    const [heroConfig, setHeroConfig] = useState({
        isActive: true,
        title: '',
        imageUrl: '',
        primaryButton: { label: '', link: '', isActive: true },
        secondaryButton: { label: '', link: '', isActive: true }
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await settingsService.getHeroConfig();
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
                changes.push({ label: 'ข้อความหลัก', oldVal: originalConfig.title, newVal: heroConfig.title });
            }
            if (heroConfig.imageUrl !== originalConfig.imageUrl) {
                changes.push({ label: 'รูปภาพพื้นหลัง', oldVal: originalConfig.imageUrl ? 'มีการตั้งค่า' : 'ไม่มี', newVal: heroConfig.imageUrl ? 'อัพเดทใหม่' : 'ไม่มี' });
            }
        }
        setChangesDiff(changes);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const uid = auth.currentUser?.uid;
        try {
            await settingsService.updateHeroConfig(heroConfig);
            const diffMsg = changesDiff.map(c => `${c.label}: ${c.oldVal}->${c.newVal}`).join(', ');
            await historyService.addLog('SystemConfig', 'Update', 'hero', `อัปเดตป้ายโฆษณาหน้าแรก | ${diffMsg}`, uid);
            alert("✅ บันทึกการตั้งค่าป้ายหน้าแรกสำเร็จ");
            setOriginalConfig({ ...heroConfig });
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

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden relative flex flex-col min-h-[60vh]">
                <GlobalSettingsHeader 
                    title="ตั้งค่าป้ายโฆษณาหลักหน้าแรก (Hero Billboard)" 
                    icon={MonitorPlay}
                    onSave={handlePreSave}
                    isSaving={isSaving}
                />

                <div className="flex-1 p-6 sm:p-10 relative bg-slate-50/50">
                    <div className="space-y-8 max-w-4xl mx-auto">
                        
                        {/* Status Toggle */}
                        <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
                            <div>
                                <h3 className="font-black text-slate-800 text-lg uppercase tracking-wider">เปิดใช้งานป้าย (Active)</h3>
                                <p className="text-sm text-slate-500 mt-1">หากปิด ลูกค้าจะเห็นป้ายรูปแบบดั้งเดิม</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={heroConfig.isActive}
                                    onChange={(e) => setHeroConfig({...heroConfig, isActive: e.target.checked})}
                                />
                                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {/* Image Upload Section */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <label className="text-sm font-black text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ImageIcon size={18} className="text-blue-500" /> รูปภาพป้ายโฆษณา (Google Drive)
                            </label>
                            
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="w-full md:w-1/2 aspect-video bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 relative flex items-center justify-center">
                                    {heroConfig.imageUrl ? (
                                        <img src={heroConfig.imageUrl} alt="Hero Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-slate-400 font-bold">ไม่มีรูปภาพ</span>
                                    )}
                                </div>
                                <div className="w-full md:w-1/2 flex flex-col justify-center space-y-4">
                                    <label className="relative cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-4 px-6 rounded-xl border-2 border-blue-200 text-center transition-colors flex flex-col items-center gap-2">
                                        <UploadCloud size={32} />
                                        <span>คลิกเพื่ออัพโหลดรูปใหม่</span>
                                        <span className="text-xs font-normal text-blue-500">ขนาดแนะนำ: 1200x800px (ไม่เกิน 5MB)</span>
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                                    </label>
                                    {isUploading && (
                                        <div className="flex items-center justify-center gap-2 text-blue-500 font-bold text-sm">
                                            <Loader2 size={16} className="animate-spin" /> กำลังอัพโหลดไปที่ Google Drive...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Title Section */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <label className="text-sm font-black text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Type size={18} className="text-yellow-500" /> ข้อความหลัก (Title)
                            </label>
                            <textarea
                                rows="4"
                                value={heroConfig.title}
                                onChange={(e) => setHeroConfig({...heroConfig, title: e.target.value})}
                                placeholder="ใส่ข้อความ..."
                                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono text-sm text-slate-700 outline-none focus:border-yellow-500 focus:bg-white transition-all"
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                สามารถใช้ HTML พื้นฐานได้ เช่น <code className="bg-slate-100 px-1 rounded">&lt;br /&gt;</code> เพื่อขึ้นบรรทัดใหม่, <code className="bg-slate-100 px-1 rounded">&lt;span className="text-yellow-400"&gt;ข้อความ&lt;/span&gt;</code> เพื่อเปลี่ยนสี
                            </p>
                        </div>

                        {/* Buttons Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Primary Button */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                        <MonitorPlay size={18} className="text-green-500" /> ปุ่มหลัก (สีเหลือง)
                                    </label>
                                    <input 
                                        type="checkbox" 
                                        checked={heroConfig.primaryButton.isActive}
                                        onChange={(e) => setHeroConfig({...heroConfig, primaryButton: {...heroConfig.primaryButton, isActive: e.target.checked}})}
                                    />
                                </div>
                                <input 
                                    type="text" value={heroConfig.primaryButton.label} placeholder="ข้อความบนปุ่ม (เช่น BOOK A SQUAD)"
                                    onChange={(e) => setHeroConfig({...heroConfig, primaryButton: {...heroConfig.primaryButton, label: e.target.value}})}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-500"
                                />
                                <div className="flex items-center gap-2">
                                    <LinkIcon size={16} className="text-slate-400 shrink-0" />
                                    <input 
                                        type="text" value={heroConfig.primaryButton.link} placeholder="ลิงก์ไปหน้า... (เช่น /squad)"
                                        onChange={(e) => setHeroConfig({...heroConfig, primaryButton: {...heroConfig.primaryButton, link: e.target.value}})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-500"
                                    />
                                </div>
                            </div>

                            {/* Secondary Button */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                        <MonitorPlay size={18} className="text-slate-500" /> ปุ่มรอง (สีขาว)
                                    </label>
                                    <input 
                                        type="checkbox" 
                                        checked={heroConfig.secondaryButton.isActive}
                                        onChange={(e) => setHeroConfig({...heroConfig, secondaryButton: {...heroConfig.secondaryButton, isActive: e.target.checked}})}
                                    />
                                </div>
                                <input 
                                    type="text" value={heroConfig.secondaryButton.label} placeholder="ข้อความบนปุ่ม (เช่น SHOP SPARES)"
                                    onChange={(e) => setHeroConfig({...heroConfig, secondaryButton: {...heroConfig.secondaryButton, label: e.target.value}})}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-500"
                                />
                                <div className="flex items-center gap-2">
                                    <LinkIcon size={16} className="text-slate-400 shrink-0" />
                                    <input 
                                        type="text" value={heroConfig.secondaryButton.link} placeholder="ลิงก์ไปหน้า... (เช่น /category/all)"
                                        onChange={(e) => setHeroConfig({...heroConfig, secondaryButton: {...heroConfig.secondaryButton, link: e.target.value}})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-500"
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
