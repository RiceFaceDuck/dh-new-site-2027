import { useState, useEffect } from 'react';
import { auth } from '../../../../firebase/config';
import { historyService } from '../../../../firebase/historyService';
import { warrantyService } from '../../../../firebase/warrantyService';

export function useWarrantyManager() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [changesDiff, setChangesDiff] = useState([]);
    const [originalConfig, setOriginalConfig] = useState(null);
    const [warrantyConfig, setWarrantyConfig] = useState({ categories: {} });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // forceRefresh = true เพื่อให้เห็นค่าล่าสุดเสมอเมื่อเข้าหน้าตั้งค่า
                const warrantyData = await warrantyService.getWarrantySettings(true);
                if (warrantyData) {
                    setWarrantyConfig(warrantyData);
                    setOriginalConfig(warrantyData);
                }
            } catch (error) {
                console.error("🔥 Error fetching warranty settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const updateCategory = (catName, field, value) => {
        setWarrantyConfig(prev => ({
            ...prev,
            categories: {
                ...prev.categories,
                [catName]: {
                    ...prev.categories[catName],
                    [field]: Number(value)
                }
            }
        }));
    };

    const handlePreSave = () => {
        const changes = [];
        if (originalConfig) {
            Object.entries(warrantyConfig.categories).forEach(([catName, data]) => {
                const origData = originalConfig.categories[catName];
                if (origData) {
                    if (data.claimDays !== origData.claimDays) {
                        changes.push({ label: `[${catName}] เคลมซ่อม (วัน)`, oldVal: origData.claimDays, newVal: data.claimDays });
                    }
                    if (data.returnDays !== origData.returnDays) {
                        changes.push({ label: `[${catName}] คืนเงิน (วัน)`, oldVal: origData.returnDays, newVal: data.returnDays });
                    }
                }
            });
        }
        setChangesDiff(changes);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const uid = auth.currentUser?.uid;
        try {
            await warrantyService.updateWarrantySettings(warrantyConfig, uid);
            const diffMsg = changesDiff.map(c => `${c.label}: ${c.oldVal}->${c.newVal}`).join(', ');
            await historyService.addLog('SystemConfig', 'Update', 'warranty', `อัปเดตกติกาประกัน | ${diffMsg}`, uid);
            alert("✅ บันทึกกติกาประกันพื้นฐานสำเร็จ");
            setOriginalConfig(JSON.parse(JSON.stringify(warrantyConfig)));
            setIsModalOpen(false);
        } catch (error) {
            console.error("Save Error:", error);
            alert(`❌ เกิดข้อผิดพลาด: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return {
        isLoading,
        isSaving,
        isModalOpen, setIsModalOpen,
        changesDiff,
        warrantyConfig,
        updateCategory,
        handlePreSave,
        handleSave
    };
}
