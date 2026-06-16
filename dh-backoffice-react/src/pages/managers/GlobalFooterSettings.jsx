import React, { useState, useEffect } from 'react';
import { LayoutPanelTop, Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import { auth } from '../../firebase/config';
import { footerSettingsService, DEFAULT_FOOTER_CONFIG } from '../../firebase/footerSettingsService';
import { historyService } from '../../firebase/historyService';
import GlobalSettingsHeader from '../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../components/managers/SaveConfirmationModal';

export default function GlobalFooterSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [changesDiff, setChangesDiff] = useState([]);
    const [originalConfig, setOriginalConfig] = useState(null);
    const [footerConfig, setFooterConfig] = useState(DEFAULT_FOOTER_CONFIG);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const configData = await footerSettingsService.getFooterConfig();
                if (configData) {
                    setFooterConfig(configData);
                    setOriginalConfig(configData);
                }
            } catch (error) {
                console.error("🔥 Error fetching footer settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePreSave = () => {
        const changes = [];
        if (originalConfig) {
            Object.keys(footerConfig.colors).forEach(key => {
                if (footerConfig.colors[key] !== originalConfig.colors[key]) {
                    changes.push({ label: `Color: ${key}`, oldVal: originalConfig.colors[key], newVal: footerConfig.colors[key] });
                }
            });
            Object.keys(footerConfig.company).forEach(key => {
                if (footerConfig.company[key] !== originalConfig.company[key]) {
                    changes.push({ label: `Company: ${key}`, oldVal: originalConfig.company[key], newVal: footerConfig.company[key] });
                }
            });
            if (JSON.stringify(footerConfig.quickLinks) !== JSON.stringify(originalConfig.quickLinks)) {
                changes.push({ label: 'หมวดหมู่สินค้า (Quick Links)', oldVal: `${originalConfig.quickLinks.length} ลิงก์`, newVal: `${footerConfig.quickLinks.length} ลิงก์ (มีแก้)` });
            }
            if (JSON.stringify(footerConfig.supportLinks) !== JSON.stringify(originalConfig.supportLinks)) {
                changes.push({ label: 'ศูนย์ช่วยเหลือ (Support Links)', oldVal: `${originalConfig.supportLinks.length} ลิงก์`, newVal: `${footerConfig.supportLinks.length} ลิงก์ (มีแก้)` });
            }
        }
        setChangesDiff(changes);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const uid = auth.currentUser?.uid;
        try {
            await footerSettingsService.updateFooterConfig(footerConfig);
            const diffMsg = changesDiff.map(c => `${c.label}: ${c.oldVal}->${c.newVal}`).join(', ');
            await historyService.addLog('SystemConfig', 'Update', 'footer_config', `อัปเดตตั้งค่าพื้นที่ส่วนล่างหน้าบ้านสำเร็จ | ${diffMsg}`, uid);
            alert("✅ บันทึกตั้งค่าพื้นที่ส่วนล่างหน้าบ้านสำเร็จ (ลบ Cache หน้าบ้านเพื่อดูผลลัพธ์ใหม่)");
            setOriginalConfig(JSON.parse(JSON.stringify(footerConfig)));
            setIsModalOpen(false);
        } catch (error) {
            console.error("Save Error:", error);
            alert(`❌ เกิดข้อผิดพลาด: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleColorChange = (key, value) => {
        setFooterConfig(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
    };

    const handleCompanyChange = (key, value) => {
        setFooterConfig(prev => ({ ...prev, company: { ...prev.company, [key]: value } }));
    };

    const updateLink = (category, index, key, value) => {
        const newLinks = [...footerConfig[category]];
        newLinks[index][key] = value;
        setFooterConfig(prev => ({ ...prev, [category]: newLinks }));
    };

    const addLink = (category) => {
        setFooterConfig(prev => ({
            ...prev,
            [category]: [...prev[category], { id: Date.now().toString(), label: 'เมนูใหม่', url: '#' }]
        }));
    };

    const removeLink = (category, index) => {
        const newLinks = footerConfig[category].filter((_, i) => i !== index);
        setFooterConfig(prev => ({ ...prev, [category]: newLinks }));
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
                    title="พื้นที่ส่วนล่าง (Footer)" 
                    icon={LayoutPanelTop}
                    onSave={handlePreSave}
                    isSaving={isSaving}
                />

                <div className="flex-1 p-6 sm:p-10 relative bg-slate-50/50">

                    <div className="space-y-8 max-w-full mx-auto">
                        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex gap-4 text-indigo-800 shadow-sm">
                            <LayoutPanelTop size={24} className="shrink-0 text-indigo-500 mt-0.5"/>
                            <p className="text-sm font-bold leading-relaxed">
                                ปรับแต่งพื้นที่ส่วนล่าง (Footer) ของหน้าบ้าน รวมถึงสี, ข้อมูลติดต่อ, และเมนูลิงก์ต่างๆ ข้อมูลนี้จะถูกดึงไปแสดงผลบนหน้าบ้าน
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Color Theme */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Color Theme (Tailwind Classes)</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1 block">Background Color</label>
                                        <input type="text" disabled={false} value={footerConfig.colors.bgDark} onChange={(e) => handleColorChange('bgDark', e.target.value)}
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100 outline-none focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1 block">Text Muted Color</label>
                                        <input type="text" disabled={false} value={footerConfig.colors.textMuted} onChange={(e) => handleColorChange('textMuted', e.target.value)}
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100 outline-none focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1 block">Primary Accent</label>
                                        <input type="text" disabled={false} value={footerConfig.colors.primaryAccent} onChange={(e) => handleColorChange('primaryAccent', e.target.value)}
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100 outline-none focus:border-indigo-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Brand & Company Info */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Brand & Contact Info</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1 block">Logo URL</label>
                                        <input type="text" disabled={false} value={footerConfig.company.logoUrl} onChange={(e) => handleCompanyChange('logoUrl', e.target.value)}
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100 outline-none focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1 block">Description</label>
                                        <textarea disabled={false} value={footerConfig.company.description} onChange={(e) => handleCompanyChange('description', e.target.value)} rows={3}
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100 outline-none focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1 block">Address</label>
                                        <input type="text" disabled={false} value={footerConfig.company.address} onChange={(e) => handleCompanyChange('address', e.target.value)}
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100 outline-none focus:border-indigo-500" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Line ID</label>
                                            <input type="text" disabled={false} value={footerConfig.company.lineId || ''} onChange={(e) => handleCompanyChange('lineId', e.target.value)}
                                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100 outline-none focus:border-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Phone</label>
                                            <input type="text" disabled={false} value={footerConfig.company.phone || ''} onChange={(e) => handleCompanyChange('phone', e.target.value)}
                                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100 outline-none focus:border-indigo-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1 block">Line Add Friend URL</label>
                                        <input type="text" disabled={false} value={footerConfig.company.lineAddFriendUrl || ''} onChange={(e) => handleCompanyChange('lineAddFriendUrl', e.target.value)} placeholder="https://line.me/ti/p/..."
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100 outline-none focus:border-indigo-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Link Zones */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Quick Links */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">หมวดหมู่สินค้า (Quick Links)</h3>
                                    <button disabled={false} onClick={() => addLink('quickLinks')} className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {footerConfig.quickLinks.map((link, index) => (
                                        <div key={link.id} className="flex gap-2 items-center">
                                            <GripVertical size={16} className="text-slate-300 shrink-0" />
                                            <input type="text" disabled={false} value={link.label} onChange={(e) => updateLink('quickLinks', index, 'label', e.target.value)} placeholder="Label" className="w-1/2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 disabled:bg-slate-100" />
                                            <input type="text" disabled={false} value={link.url} onChange={(e) => updateLink('quickLinks', index, 'url', e.target.value)} placeholder="URL" className="w-1/2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 disabled:bg-slate-100" />
                                            <button disabled={false} onClick={() => removeLink('quickLinks', index)} className="text-red-400 hover:text-red-600 disabled:opacity-50 shrink-0 p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Support Links */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">ศูนย์ช่วยเหลือ (Support Links)</h3>
                                    <button disabled={false} onClick={() => addLink('supportLinks')} className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {footerConfig.supportLinks.map((link, index) => (
                                        <div key={link.id} className="flex gap-2 items-center">
                                            <GripVertical size={16} className="text-slate-300 shrink-0" />
                                            <input type="text" disabled={false} value={link.label} onChange={(e) => updateLink('supportLinks', index, 'label', e.target.value)} placeholder="Label" className="w-1/2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 disabled:bg-slate-100" />
                                            <input type="text" disabled={false} value={link.url} onChange={(e) => updateLink('supportLinks', index, 'url', e.target.value)} placeholder="URL" className="w-1/2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 disabled:bg-slate-100" />
                                            <button disabled={false} onClick={() => removeLink('supportLinks', index)} className="text-red-400 hover:text-red-600 disabled:opacity-50 shrink-0 p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
