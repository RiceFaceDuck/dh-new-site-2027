import { useState, useEffect } from 'react';
import { auth } from '../../../../../firebase/config';
import { bufferService } from '../../../../../firebase/bufferService';

export function useGlobalBufferSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [changesDiff, setChangesDiff] = useState([]);
    const [originalConfig, setOriginalConfig] = useState(null);
    const [inventoryConfig, setInventoryConfig] = useState({ defaultBufferStock: 2 });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await bufferService.getBufferConfig();
                if (data) {
                    setInventoryConfig(data);
                    setOriginalConfig(data);
                }
            } catch (error) {
                // error handled in service
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePreSave = () => {
        const changes = [];
        if (originalConfig) {
            if (Number(inventoryConfig.defaultBufferStock) !== Number(originalConfig.defaultBufferStock)) {
                changes.push({ label: 'ค่าบัฟเฟอร์สต็อกพื้นฐาน (Global Buffer)', oldVal: originalConfig.defaultBufferStock, newVal: inventoryConfig.defaultBufferStock });
            }
        }
        setChangesDiff(changes);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const uid = auth.currentUser?.uid;

        try {
            const buffer = Number(inventoryConfig.defaultBufferStock);
            if (buffer < 0) throw new Error("บัฟเฟอร์สต็อกห้ามติดลบ");

            const diffMsg = changesDiff.map(c => `${c.label}: ${c.oldVal}->${c.newVal}`).join(', ');
            
            const res = await bufferService.updateBufferConfig(buffer, diffMsg, uid);
            if (res.success) {
                alert("✅ บันทึกบัฟเฟอร์สต็อกสำเร็จ");
                setOriginalConfig({ ...inventoryConfig, defaultBufferStock: buffer });
                setIsModalOpen(false);
            } else {
                throw new Error(res.message);
            }
        } catch (error) {
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
        inventoryConfig,
        setInventoryConfig,
        handlePreSave,
        handleSave
    };
}
