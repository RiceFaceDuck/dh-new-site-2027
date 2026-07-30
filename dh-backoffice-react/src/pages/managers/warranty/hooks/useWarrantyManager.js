import { useState, useEffect } from 'react';
import { auth } from '../../../../firebase/config';
import { historyService } from '../../../../firebase/historyService';
import { warrantyService, normalizeCategoryName } from '../../../../firebase/warrantyService';

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

    const addCategory = (catName) => {
        if (!catName || !catName.trim()) return;
        const normName = normalizeCategoryName(catName);
        setWarrantyConfig(prev => {
            if (prev.categories[normName]) {
                alert(`⚠️ มีหมวดหมู่ "${normName}" (หรือหมวดเทียบเท่า) อยู่ในระบบแล้ว`);
                return prev;
            }
            return {
                ...prev,
                categories: {
                    ...prev.categories,
                    [normName]: { claimDays: 30, returnDays: 7, isUnconfigured: true }
                }
            };
        });
    };

    const removeCategory = (catName) => {
        if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบการ์ดประกันหมวด "${catName}"?`)) return;
        setWarrantyConfig(prev => {
            const nextCats = { ...prev.categories };
            delete nextCats[catName];
            return { ...prev, categories: nextCats };
        });
    };

    const updateCategory = (catName, field, value) => {
        setWarrantyConfig(prev => ({
            ...prev,
            categories: {
                ...prev.categories,
                [catName]: {
                    ...prev.categories[catName],
                    [field]: Number(value),
                    isUnconfigured: false
                }
            }
        }));
    };

    const handlePreSave = () => {
        const changes = [];
        if (originalConfig) {
            Object.entries(warrantyConfig.categories).forEach(([catName, data]) => {
                const origData = originalConfig.categories[catName];
                if (!origData || origData.isUnconfigured) {
                    changes.push({ label: `[เพิ่มหมวดใหม่: ${catName}]`, oldVal: 'ยังไม่ได้ตั้งค่า', newVal: `เคลม ${data.claimDays} วัน / คืนเงิน ${data.returnDays} วัน` });
                } else {
                    if (data.claimDays !== origData.claimDays) {
                        changes.push({ label: `[${catName}] เคลมซ่อม (วัน)`, oldVal: origData.claimDays, newVal: data.claimDays });
                    }
                    if (data.returnDays !== origData.returnDays) {
                        changes.push({ label: `[${catName}] คืนเงิน (วัน)`, oldVal: origData.returnDays, newVal: data.returnDays });
                    }
                }
            });

            // ตรวจหาหมวดที่ถูกลบออก
            Object.keys(originalConfig.categories).forEach(origCat => {
                if (!warrantyConfig.categories[origCat]) {
                    changes.push({ label: `[ลบหมวด: ${origCat}]`, oldVal: 'มีในระบบ', newVal: 'ถูกลบออก' });
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
            alert("✅ บันทึกกติกาประกันพื้นฐานสำเร็จ และปรับสถานะงาน To-Do เป็น completed เรียบร้อยแล้ว");
            
            // Reload settings to sync clean status
            const freshData = await warrantyService.getWarrantySettings(true);
            setWarrantyConfig(freshData);
            setOriginalConfig(JSON.parse(JSON.stringify(freshData)));
            setIsModalOpen(false);
        } catch (error) {
            console.error("Save Error:", error);
            alert(`❌ เกิดข้อผิดพลาด: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const unconfiguredCount = Object.values(warrantyConfig.categories).filter(c => c.isUnconfigured).length;

    return {
        isLoading,
        isSaving,
        isModalOpen, setIsModalOpen,
        changesDiff,
        warrantyConfig,
        unconfiguredCount,
        updateCategory,
        addCategory,
        removeCategory,
        handlePreSave,
        handleSave
    };
}
