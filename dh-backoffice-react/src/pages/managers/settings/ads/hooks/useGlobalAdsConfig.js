import { useState, useEffect } from 'react';
import { auth } from '../../../../../firebase/config';
import { settingsService } from '../../../../../firebase/settingsService';
import { historyService } from '../../../../../firebase/historyService';

export function useGlobalAdsConfig() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [changesDiff, setChangesDiff] = useState([]);
    
    const [adConfig, setAdConfig] = useState({
        costPerView: 1,
        costPerClick: 5,
        displayRatio: 10
    });
    const [originalConfig, setOriginalConfig] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const adData = await settingsService.getAdRates();
                if (adData) {
                    const loadedData = {
                        costPerView: adData.costPerView ?? 1,
                        costPerClick: adData.costPerClick ?? 5,
                        displayRatio: adData.displayRatio ?? 10
                    };
                    setAdConfig(loadedData);
                    setOriginalConfig(loadedData);
                }
            } catch (error) {
                console.error("🔥 Error fetching ads config:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePreSave = () => {
        const changes = [];
        if (originalConfig) {
            if (Number(adConfig.costPerView) !== Number(originalConfig.costPerView)) {
                changes.push({ label: 'หักเครดิตเมื่อมองเห็น (View)', oldVal: originalConfig.costPerView, newVal: adConfig.costPerView });
            }
            if (Number(adConfig.costPerClick) !== Number(originalConfig.costPerClick)) {
                changes.push({ label: 'หักเครดิตเมื่อถูกคลิก (Click)', oldVal: originalConfig.costPerClick, newVal: adConfig.costPerClick });
            }
            if (Number(adConfig.displayRatio) !== Number(originalConfig.displayRatio)) {
                changes.push({ label: 'ความถี่ในการแสดงผล (Ratio)', oldVal: originalConfig.displayRatio, newVal: adConfig.displayRatio });
            }
        }
        setChangesDiff(changes);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const uid = auth.currentUser?.uid;
        try {
            const cView = Number(adConfig.costPerView);
            const cClick = Number(adConfig.costPerClick);
            const ratio = Number(adConfig.displayRatio);
            
            if (cView < 0) throw new Error("ค่า Credit ต่อ View ห้ามติดลบ");
            if (cClick < 0) throw new Error("ค่า Credit ต่อ Click ห้ามติดลบ");
            if (ratio <= 0) throw new Error("อัตราส่วนความถี่ในการแสดงผลต้องมากกว่า 0");

            const res = await settingsService.updateAdRates(adConfig);
            if (res.success) {
                const diffMsg = changesDiff.map(c => `${c.label}: ${c.oldVal}->${c.newVal}`).join(', ');
                await historyService.addLog('SystemConfig', 'Update', 'marketing', `อัปเดตเรทโฆษณา | ${diffMsg}`, uid);
                alert("✅ บันทึกการตั้งค่าพื้นที่โฆษณาสำเร็จ");
                setOriginalConfig({ ...adConfig, costPerView: cView, costPerClick: cClick, displayRatio: ratio });
                setIsModalOpen(false);
            } else {
                throw new Error(res.message);
            }
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
        isModalOpen,
        setIsModalOpen,
        changesDiff,
        adConfig,
        setAdConfig,
        handlePreSave,
        handleSave
    };
}
