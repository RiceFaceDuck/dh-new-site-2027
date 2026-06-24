import { useState, useEffect } from 'react';
import { auth } from '../../../firebase/config';
import { privacyCookiesService, DEFAULT_PRIVACY_CONFIG } from '../../../firebase/privacyCookiesService';
import { historyService } from '../../../firebase/historyService';

export function usePrivacyCookies() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [changesDiff, setChangesDiff] = useState([]);
    const [originalConfig, setOriginalConfig] = useState(null);
    const [privacyConfig, setPrivacyConfig] = useState(DEFAULT_PRIVACY_CONFIG);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const configData = await privacyCookiesService.getPrivacyConfig();
                if (configData) {
                    setPrivacyConfig(configData);
                    setOriginalConfig(configData);
                }
            } catch (error) {
                console.error("🔥 Error fetching privacy settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePreSave = () => {
        const changes = [];
        if (originalConfig) {
            if (privacyConfig.logoUrl !== originalConfig.logoUrl) {
                changes.push({ label: 'Logo URL', oldVal: originalConfig.logoUrl, newVal: privacyConfig.logoUrl });
            }
            if (privacyConfig.bannerText !== originalConfig.bannerText) {
                changes.push({ label: 'Banner Text', oldVal: 'มีการแก้ไขข้อความ', newVal: 'ข้อความใหม่' });
            }
            if (privacyConfig.policyLinks.privacyPolicyUrl !== originalConfig.policyLinks.privacyPolicyUrl) {
                changes.push({ label: 'Privacy Policy URL', oldVal: originalConfig.policyLinks.privacyPolicyUrl, newVal: privacyConfig.policyLinks.privacyPolicyUrl });
            }
            if (privacyConfig.policyLinks.cookiePolicyUrl !== originalConfig.policyLinks.cookiePolicyUrl) {
                changes.push({ label: 'Cookie Policy URL', oldVal: originalConfig.policyLinks.cookiePolicyUrl, newVal: privacyConfig.policyLinks.cookiePolicyUrl });
            }
            if (JSON.stringify(privacyConfig.cookieTypes) !== JSON.stringify(originalConfig.cookieTypes)) {
                changes.push({ label: 'Cookie Types', oldVal: 'การตั้งค่าเดิม', newVal: 'การตั้งค่าใหม่' });
            }
            if (JSON.stringify(privacyConfig.consentTexts) !== JSON.stringify(originalConfig.consentTexts)) {
                changes.push({ label: 'Consent Texts', oldVal: 'ข้อความเดิม', newVal: 'ข้อความใหม่' });
            }
        }
        setChangesDiff(changes);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const uid = auth.currentUser?.uid;
        try {
            await privacyCookiesService.updatePrivacyConfig(privacyConfig);
            const diffMsg = changesDiff.map(c => `${c.label}`).join(', ');
            await historyService.addLog('SystemConfig', 'Update', 'privacy_cookies_config', `อัปเดตตั้งค่า Privacy & Cookies สำเร็จ | แก้ไข: ${diffMsg}`, uid);
            alert("✅ บันทึกการตั้งค่า Privacy & Cookies สำเร็จ");
            setOriginalConfig(JSON.parse(JSON.stringify(privacyConfig)));
            setIsModalOpen(false);
        } catch (error) {
            console.error("Save Error:", error);
            alert(`❌ เกิดข้อผิดพลาด: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const updateConfig = (key, value) => {
        setPrivacyConfig(prev => ({ ...prev, [key]: value }));
    };

    const updatePolicyLink = (key, value) => {
        setPrivacyConfig(prev => ({ ...prev, policyLinks: { ...prev.policyLinks, [key]: value } }));
    };

    const updateCookieType = (index, field, value) => {
        const newTypes = [...privacyConfig.cookieTypes];
        newTypes[index] = { ...newTypes[index], [field]: value };
        setPrivacyConfig(prev => ({ ...prev, cookieTypes: newTypes }));
    };

    const updateConsentText = (key, value) => {
        setPrivacyConfig(prev => ({ ...prev, consentTexts: { ...prev.consentTexts, [key]: value } }));
    };

    return {
        isLoading,
        isSaving,
        isModalOpen,
        setIsModalOpen,
        changesDiff,
        privacyConfig,
        handlePreSave,
        handleSave,
        updateConfig,
        updatePolicyLink,
        updateCookieType,
        updateConsentText
    };
}
