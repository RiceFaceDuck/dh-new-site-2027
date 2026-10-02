import { useState, useEffect } from 'react';
import { auth } from '../../../../firebase/config';
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

    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', targetId: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'skus'
    const [filterOnlyNew, setFilterOnlyNew] = useState(false);

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

    const requestDeleteCategory = (catName) => {
        setDeleteModal({ isOpen: true, type: 'category', targetId: catName });
    };

    const confirmDeleteCategory = () => {
        const catName = deleteModal.targetId;
        if (!catName) return;
        setWarrantyConfig(prev => {
            const nextCats = { ...prev.categories };
            delete nextCats[catName];
            return { ...prev, categories: nextCats };
        });
        setDeleteModal({ isOpen: false, type: '', targetId: '' });
    };

    const updateCategory = (catName, field, value) => {
        const safeNum = Math.max(0, parseInt(value, 10) || 0);
        setWarrantyConfig(prev => ({
            ...prev,
            categories: {
                ...prev.categories,
                [catName]: {
                    ...prev.categories[catName],
                    [field]: safeNum,
                    isUnconfigured: false
                }
            }
        }));
    };

    // --- SKU Overrides Handlers ---
    const addSkuOverride = (rawSku, claimDays = 365, returnDays = 14) => {
        const sku = (rawSku || '').trim().toUpperCase();
        if (!sku) return;
        const safeClaim = (claimDays !== undefined && claimDays !== null && claimDays !== '') ? Math.max(0, Number(claimDays)) : 365;
        const safeReturn = (returnDays !== undefined && returnDays !== null && returnDays !== '') ? Math.max(0, Number(returnDays)) : 14;
        setWarrantyConfig(prev => ({
            ...prev,
            skus: {
                ...(prev.skus || {}),
                [sku]: { 
                    claimDays: isNaN(safeClaim) ? 365 : safeClaim, 
                    returnDays: isNaN(safeReturn) ? 14 : safeReturn 
                }
            }
        }));
    };

    const updateSkuOverride = (sku, field, value) => {
        const safeNum = Math.max(0, parseInt(value, 10) || 0);
        setWarrantyConfig(prev => ({
            ...prev,
            skus: {
                ...(prev.skus || {}),
                [sku]: {
                    ...(prev.skus?.[sku] || {}),
                    [field]: safeNum
                }
            }
        }));
    };

    const requestDeleteSku = (sku) => {
        setDeleteModal({ isOpen: true, type: 'sku', targetId: sku });
    };

    const confirmDeleteSku = () => {
        const sku = deleteModal.targetId;
        if (!sku) return;
        setWarrantyConfig(prev => {
            const nextSkus = { ...(prev.skus || {}) };
            delete nextSkus[sku];
            return { ...prev, skus: nextSkus };
        });
        setDeleteModal({ isOpen: false, type: '', targetId: '' });
    };

    const handlePreSave = () => {
        const changes = [];
        if (originalConfig) {
            Object.entries(warrantyConfig.categories || {}).forEach(([catName, data]) => {
                const origData = originalConfig.categories?.[catName];
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
            Object.keys(originalConfig.categories || {}).forEach(origCat => {
                if (!warrantyConfig.categories?.[origCat]) {
                    changes.push({ label: `[ลบหมวด: ${origCat}]`, oldVal: 'มีในระบบ', newVal: 'ถูกลบออก' });
                }
            });

            // ตรวจหาการเปลี่ยนแปลง SKU Overrides
            Object.entries(warrantyConfig.skus || {}).forEach(([sku, data]) => {
                const orig = originalConfig.skus?.[sku];
                if (!orig) {
                    changes.push({ label: `[เพิ่ม SKU พิเศษ: ${sku}]`, oldVal: 'ไม่มี', newVal: `เคลม ${data.claimDays} วัน / คืน ${data.returnDays} วัน` });
                } else if (orig.claimDays !== data.claimDays || orig.returnDays !== data.returnDays) {
                    changes.push({ label: `[SKU: ${sku}]`, oldVal: `เคลม ${orig.claimDays}/คืน ${orig.returnDays}`, newVal: `เคลม ${data.claimDays}/คืน ${data.returnDays}` });
                }
            });

            Object.keys(originalConfig.skus || {}).forEach(origSku => {
                if (!warrantyConfig.skus?.[origSku]) {
                    changes.push({ label: `[ลบ SKU พิเศษ: ${origSku}]`, oldVal: 'มีในระบบ', newVal: 'ถูกลบออก' });
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
            const diffMsg = changesDiff.map(c => `${c.label}: ${c.oldVal}->${c.newVal}`).join(', ');
            await warrantyService.updateWarrantySettings(warrantyConfig, uid, diffMsg);
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

    const unconfiguredCount = Object.values(warrantyConfig?.categories || {}).filter(c => c?.isUnconfigured).length;

    return {
        isLoading,
        isSaving,
        isModalOpen, setIsModalOpen,
        changesDiff,
        warrantyConfig,
        unconfiguredCount,
        updateCategory,
        addCategory,
        removeCategory: requestDeleteCategory,
        requestDeleteCategory,
        confirmDeleteCategory,
        addSkuOverride,
        updateSkuOverride,
        requestDeleteSku,
        confirmDeleteSku,
        deleteModal,
        setDeleteModal,
        searchTerm,
        setSearchTerm,
        activeTab,
        setActiveTab,
        filterOnlyNew,
        setFilterOnlyNew,
        handlePreSave,
        handleSave
    };
}
