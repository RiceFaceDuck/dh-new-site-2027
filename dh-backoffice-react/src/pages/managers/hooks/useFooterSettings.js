import { useState, useEffect } from 'react';
import { auth } from '../../../firebase/config';
import { footerSettingsService, DEFAULT_FOOTER_CONFIG } from '../../../firebase/footerSettingsService';
import { historyService } from '../../../firebase/historyService';

export function useFooterSettings() {
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

    return {
        isLoading,
        isSaving,
        isModalOpen,
        setIsModalOpen,
        changesDiff,
        footerConfig,
        handlePreSave,
        handleSave,
        handleColorChange,
        handleCompanyChange,
        updateLink,
        addLink,
        removeLink
    };
}
