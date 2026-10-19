import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { auth } from '../../../firebase/config';
import { 
    footerSettingsService, 
    DEFAULT_FOOTER_CONFIG, 
    CANONICAL_DEFAULT_FOOTER_CONFIG 
} from '../../../firebase/footerSettingsService';
import { historyService } from '../../../firebase/historyService';

const cloneDeep = (obj) => {
    if (typeof structuredClone === 'function') {
        try { return structuredClone(obj); } catch {}
    }
    return JSON.parse(JSON.stringify(obj));
};

const normalizeConfig = (config = {}) => {
    const base = CANONICAL_DEFAULT_FOOTER_CONFIG || DEFAULT_FOOTER_CONFIG;
    const defaultBadges = base.trustBadges?.badges || [];

    const labelSync = {
        'รับประกันของแท้ 100%': 'สินค้ามีการรับประกัน',
        'จัดส่งด่วน 24 ชม.': 'ส่งออกภายในวันทันที'
    };

    const resolvedBadges = Array.isArray(config.trustBadges?.badges) && config.trustBadges.badges.length > 0
        ? config.trustBadges.badges.map(b => ({
            ...b,
            label: labelSync[b.label] || b.label || ''
        }))
        : cloneDeep(defaultBadges);

    return {
        ...base,
        ...config,
        colors: { ...base.colors, ...(config.colors || {}) },
        company: { ...base.company, ...(config.company || {}) },
        socialHub: { ...base.socialHub, ...(config.socialHub || {}) },
        trustBadges: {
            ...base.trustBadges,
            ...(config.trustBadges || {}),
            badges: resolvedBadges
        },
        businessHours: {
            ...base.businessHours,
            ...(config.businessHours || {})
        },
        quickLinks: Array.isArray(config.quickLinks) ? config.quickLinks : cloneDeep(base.quickLinks),
        supportLinks: Array.isArray(config.supportLinks) ? config.supportLinks : cloneDeep(base.supportLinks)
    };
};

export function useFooterSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
    const [errorMessage, setErrorMessage] = useState('');
    const [changesDiff, setChangesDiff] = useState([]);
    const [originalConfig, setOriginalConfig] = useState(null);
    const [footerConfig, setFooterConfig] = useState(() => normalizeConfig(DEFAULT_FOOTER_CONFIG));

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const configData = await footerSettingsService.getFooterConfig();
                if (configData) {
                    const normalized = normalizeConfig(configData);
                    setFooterConfig(normalized);
                    setOriginalConfig(cloneDeep(normalized));
                } else {
                    const fallback = normalizeConfig(DEFAULT_FOOTER_CONFIG);
                    setFooterConfig(fallback);
                    setOriginalConfig(cloneDeep(fallback));
                }
            } catch (error) {
                console.error("🔥 Error fetching footer settings:", error);
                const fallback = normalizeConfig(DEFAULT_FOOTER_CONFIG);
                setFooterConfig(fallback);
                setOriginalConfig(cloneDeep(fallback));
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePreSave = () => {
        const changes = [];
        if (originalConfig) {
            // Colors
            if (footerConfig.colors && originalConfig.colors) {
                Object.keys(footerConfig.colors).forEach(key => {
                    if (footerConfig.colors[key] !== originalConfig.colors[key]) {
                        changes.push({ label: `ธีมสี (${key})`, oldVal: originalConfig.colors[key], newVal: footerConfig.colors[key] });
                    }
                });
            }

            // Company
            if (footerConfig.company && originalConfig.company) {
                Object.keys(footerConfig.company).forEach(key => {
                    if (footerConfig.company[key] !== originalConfig.company[key]) {
                        changes.push({ label: `ข้อมูลแบรนด์ (${key})`, oldVal: originalConfig.company[key], newVal: footerConfig.company[key] });
                    }
                });
            }

            // Social Hub
            if (footerConfig.socialHub && originalConfig.socialHub) {
                if (footerConfig.socialHub.enabled !== originalConfig.socialHub.enabled) {
                    changes.push({
                        label: 'Social Hub (เปิด/ปิดแสดงผล)',
                        oldVal: originalConfig.socialHub.enabled === false ? 'ซ่อนไว้' : 'เปิดแสดง',
                        newVal: footerConfig.socialHub.enabled === false ? 'ซ่อนไว้' : 'เปิดแสดง'
                    });
                }
                ['facebook', 'tiktok', 'line', 'youtube', 'instagram'].forEach(key => {
                    if (footerConfig.socialHub[key] !== originalConfig.socialHub[key]) {
                        changes.push({
                            label: `Social Link (${key})`,
                            oldVal: originalConfig.socialHub[key] || '(ว่าง)',
                            newVal: footerConfig.socialHub[key] || '(ลบออก)'
                        });
                    }
                });
            }

            // Trust Badges
            if (footerConfig.trustBadges && originalConfig.trustBadges) {
                if (footerConfig.trustBadges.enabled !== originalConfig.trustBadges.enabled) {
                    changes.push({
                        label: 'Trust Badges (เปิด/ปิดระบบ)',
                        oldVal: originalConfig.trustBadges.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน',
                        newVal: footerConfig.trustBadges.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'
                    });
                }
                const curBadges = footerConfig.trustBadges.badges || [];
                const origBadges = originalConfig.trustBadges.badges || [];
                curBadges.forEach(b => {
                    const orig = origBadges.find(o => o.id === b.id);
                    if (orig) {
                        if (orig.active !== b.active) {
                            changes.push({
                                label: `ตราความเชื่อมั่น: ${b.label || b.id} (สถานะ)`,
                                oldVal: orig.active ? 'เปิดแสดง' : 'ปิดซ่อน',
                                newVal: b.active ? 'เปิดแสดง' : 'ปิดซ่อน'
                            });
                        }
                        if (orig.label !== b.label) {
                            changes.push({
                                label: `ตราความเชื่อมั่น (${b.id}) ชื่อป้าย`,
                                oldVal: orig.label || '(ว่าง)',
                                newVal: b.label || '(ว่าง)'
                            });
                        }
                        if (orig.description !== b.description) {
                            changes.push({
                                label: `ตราความเชื่อมั่น (${b.id}) คำอธิบาย`,
                                oldVal: orig.description || '(ว่าง)',
                                newVal: b.description || '(ว่าง)'
                            });
                        }
                    }
                });
            }

            // Quick Links
            if (JSON.stringify(footerConfig.quickLinks) !== JSON.stringify(originalConfig.quickLinks)) {
                changes.push({
                    label: 'หมวดหมู่สินค้า (Quick Links)',
                    oldVal: `${originalConfig.quickLinks?.length || 0} ลิงก์`,
                    newVal: `${footerConfig.quickLinks?.length || 0} ลิงก์ (มีแก้)`
                });
            }

            // Support Links
            if (JSON.stringify(footerConfig.supportLinks) !== JSON.stringify(originalConfig.supportLinks)) {
                changes.push({
                    label: 'ศูนย์ช่วยเหลือ (Support Links)',
                    oldVal: `${originalConfig.supportLinks?.length || 0} ลิงก์`,
                    newVal: `${footerConfig.supportLinks?.length || 0} ลิงก์ (มีแก้)`
                });
            }

            // Business Hours
            if (footerConfig.businessHours && originalConfig.businessHours) {
                ['openHours', 'closeHours', 'days'].forEach(key => {
                    if (footerConfig.businessHours[key] !== originalConfig.businessHours[key]) {
                        changes.push({
                            label: `เวลาทำการ (${key})`,
                            oldVal: originalConfig.businessHours[key] || '(ว่าง)',
                            newVal: footerConfig.businessHours[key] || '(ว่าง)'
                        });
                    }
                });
            }
        }
        setChangesDiff(changes);
        setSaveStatus(null);
        setErrorMessage('');
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus(null);
        setErrorMessage('');
        const uid = auth.currentUser?.uid;
        try {
            await footerSettingsService.updateFooterConfig(footerConfig);
            const diffMsg = changesDiff.length > 0
                ? changesDiff.map(c => `${c.label}: ${c.oldVal}->${c.newVal}`).join(', ')
                : 'บันทึกโครงสร้างตามมาตรฐานล่าสุด';
            await historyService.addLog('SystemConfig', 'Update', 'footer_config', `อัปเดตตั้งค่าพื้นที่ส่วนล่างหน้าบ้านสำเร็จ | ${diffMsg}`, uid);
            setOriginalConfig(cloneDeep(footerConfig));
            setSaveStatus('success');
            toast.success('บันทึกตั้งค่าพื้นที่ส่วนล่างหน้าบ้านสำเร็จ!');
            setTimeout(() => {
                setIsModalOpen(false);
                setSaveStatus(null);
            }, 1000);
        } catch (error) {
            console.error("Save Error:", error);
            setSaveStatus('error');

            let formattedMsg = error?.message || 'เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลได้';
            const issues = error?.issues || error?.errors;
            if (Array.isArray(issues) && issues.length > 0) {
                formattedMsg = issues.map(iss => {
                    const pathStr = Array.isArray(iss.path) ? iss.path.join('.') : '';
                    return `• ${pathStr ? `[${pathStr}] ` : ''}${iss.message}`;
                }).join('\n');
            } else if (typeof error?.message === 'string' && (error.message.startsWith('[') || error.message.startsWith('{'))) {
                try {
                    const parsed = JSON.parse(error.message);
                    if (Array.isArray(parsed)) {
                        formattedMsg = parsed.map(iss => {
                            const pathStr = Array.isArray(iss.path) ? iss.path.join('.') : '';
                            return `• ${pathStr ? `[${pathStr}] ` : ''}${iss.message || iss.code}`;
                        }).join('\n');
                    }
                } catch {}
            }

            setErrorMessage(formattedMsg);
            toast.error('บันทึกไม่สำเร็จ กรุณาตรวจสอบข้อมูล');
        } finally {
            setIsSaving(false);
        }
    };

    const handleColorChange = (key, value) => {
        setFooterConfig(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
    };

    const handleApplyColorPreset = (preset) => {
        setFooterConfig(prev => ({ ...prev, colors: { ...(prev.colors || {}), ...preset } }));
    };

    const handleCompanyChange = (key, value) => {
        setFooterConfig(prev => ({ ...prev, company: { ...prev.company, [key]: value } }));
    };

    const handleBusinessHoursChange = (key, value) => {
        setFooterConfig(prev => ({ ...prev, businessHours: { ...(prev.businessHours || {}), [key]: value } }));
    };

    const handleSocialChange = (key, value) => {
        setFooterConfig(prev => ({ ...prev, socialHub: { ...(prev.socialHub || {}), [key]: value } }));
    };

    const handleSocialEnabled = (enabled) => {
        setFooterConfig(prev => ({ ...prev, socialHub: { ...(prev.socialHub || {}), enabled } }));
    };

    const handleTrustBadgeToggle = (badgeId) => {
        setFooterConfig(prev => {
            const badges = (prev.trustBadges?.badges || []).map(b => b.id === badgeId ? { ...b, active: !b.active } : b);
            return { ...prev, trustBadges: { ...(prev.trustBadges || {}), badges } };
        });
    };

    const handleTrustBadgeChange = (badgeId, key, value) => {
        setFooterConfig(prev => {
            const badges = (prev.trustBadges?.badges || []).map(b => b.id === badgeId ? { ...b, [key]: value } : b);
            return { ...prev, trustBadges: { ...(prev.trustBadges || {}), badges } };
        });
    };

    const handleTrustBadgesEnabled = (enabled) => {
        setFooterConfig(prev => ({ ...prev, trustBadges: { ...(prev.trustBadges || {}), enabled } }));
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
        saveStatus,
        setSaveStatus,
        errorMessage,
        changesDiff,
        footerConfig,
        handlePreSave,
        handleSave,
        handleColorChange,
        handleApplyColorPreset,
        handleCompanyChange,
        handleBusinessHoursChange,
        handleSocialChange,
        handleSocialEnabled,
        handleTrustBadgeToggle,
        handleTrustBadgeChange,
        handleTrustBadgesEnabled,
        updateLink,
        addLink,
        removeLink
    };
}
