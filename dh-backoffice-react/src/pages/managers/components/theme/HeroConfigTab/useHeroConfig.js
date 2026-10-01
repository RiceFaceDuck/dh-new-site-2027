import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { heroConfigService, DEFAULT_HERO_CONFIG } from '../../../../../firebase/heroConfigService';
import { driveService } from '../../../../../firebase/driveService';

/**
 * Custom Hook for Hero Billboard Configuration State & Controller
 * Extracted according to Clean Architecture & SRP
 */
export function useHeroConfig() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState('');
  const [changesDiff, setChangesDiff] = useState([]);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [originalConfig, setOriginalConfig] = useState(null);
  const [heroConfig, setHeroConfig] = useState({ ...DEFAULT_HERO_CONFIG });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await heroConfigService.getHeroConfig();
        if (data) {
          setHeroConfig({ ...DEFAULT_HERO_CONFIG, ...data });
          setOriginalConfig({ ...DEFAULT_HERO_CONFIG, ...data });
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
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('❌ ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)');
      return;
    }

    setIsUploading(true);
    try {
      const url = await driveService.uploadImage(file);
      setHeroConfig(prev => ({ ...prev, imageUrl: url }));
      toast.success('อัพโหลดรูปภาพสำเร็จ');
    } catch (error) {
      console.error("🔥 Error uploading hero image:", error);
      toast.error(error?.message || 'เกิดข้อผิดพลาดในการอัพโหลด');
      alert('❌ อัพโหลดรูปล้มเหลว: ' + (error?.message || error));
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const handlePreSave = () => {
    const diff = [];
    if (originalConfig) {
      if (heroConfig.isActive !== originalConfig.isActive) {
        diff.push({ label: 'สถานะป้าย', oldVal: originalConfig.isActive ? 'เปิด' : 'ปิด', newVal: heroConfig.isActive ? 'เปิด' : 'ปิด' });
      }
      if (heroConfig.title !== originalConfig.title) {
        diff.push({ label: 'ข้อความหลัก (Title)', oldVal: 'ค่าเดิม', newVal: 'อัพเดทใหม่' });
      }
      if (heroConfig.badge?.text !== originalConfig.badge?.text || heroConfig.badge?.isActive !== originalConfig.badge?.isActive) {
        diff.push({ label: 'ป้ายกำกับ (Badge)', oldVal: originalConfig.badge?.text || 'ไม่มี', newVal: heroConfig.badge?.text || 'ไม่มี' });
      }
      if (heroConfig.subtitle?.text !== originalConfig.subtitle?.text || heroConfig.subtitle?.isActive !== originalConfig.subtitle?.isActive) {
        diff.push({ label: 'คำโปรยย่อย (Subtitle)', oldVal: originalConfig.subtitle?.text || 'ไม่มี', newVal: heroConfig.subtitle?.text || 'ไม่มี' });
      }
      if (heroConfig.imageUrl !== originalConfig.imageUrl) {
        diff.push({ label: 'รูปภาพพื้นหลัง', oldVal: originalConfig.imageUrl ? 'มีการตั้งค่า' : 'ไม่มี', newVal: heroConfig.imageUrl ? 'อัพเดทใหม่' : 'ไม่มี' });
      }
      if (heroConfig.imageLayout !== originalConfig.imageLayout) {
        diff.push({ label: 'รูปแบบภาพพื้นหลัง', oldVal: originalConfig.imageLayout === 'full' ? 'ภาพเต็มผืน 100%' : 'แยกฝั่งขวา 70%', newVal: heroConfig.imageLayout === 'full' ? 'ภาพเต็มผืน 100%' : 'แยกฝั่งขวา 70%' });
      }
      if (heroConfig.overlay?.enabled !== originalConfig.overlay?.enabled) {
        diff.push({ label: 'สถานะการไล่เฉดสี', oldVal: originalConfig.overlay?.enabled === false ? 'ปิด' : 'เปิด', newVal: heroConfig.overlay?.enabled === false ? 'ปิด' : 'เปิด' });
      }
      if (
        heroConfig.overlay?.color !== originalConfig.overlay?.color ||
        heroConfig.overlay?.opacity !== originalConfig.overlay?.opacity ||
        heroConfig.overlay?.direction !== originalConfig.overlay?.direction
      ) {
        diff.push({ label: 'การไล่เฉดสี', oldVal: 'ค่าเดิม', newVal: 'ค่าใหม่' });
      }
      if (
        heroConfig.primaryButton?.label !== originalConfig.primaryButton?.label ||
        heroConfig.primaryButton?.link !== originalConfig.primaryButton?.link
      ) {
        diff.push({ label: 'ปุ่มหลัก', oldVal: originalConfig.primaryButton?.label || 'ไม่มี', newVal: heroConfig.primaryButton?.label || 'ไม่มี' });
      }
      if (
        heroConfig.secondaryButton?.label !== originalConfig.secondaryButton?.label ||
        heroConfig.secondaryButton?.link !== originalConfig.secondaryButton?.link
      ) {
        diff.push({ label: 'ปุ่มรอง', oldVal: originalConfig.secondaryButton?.label || 'ไม่มี', newVal: heroConfig.secondaryButton?.label || 'ไม่มี' });
      }
    }
    setChangesDiff(diff);
    setSaveStatus(null);
    setIsModalOpen(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await heroConfigService.updateHeroConfig(heroConfig, changesDiff);
      setOriginalConfig({ ...heroConfig });
      setSaveStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1200);
    } catch (error) {
      console.error("🔥 Error saving hero config:", error);
      setSaveStatus('error');
      setErrorMessage(error?.message || 'เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading,
    isSaving,
    isUploading,
    isModalOpen,
    setIsModalOpen,
    isGuideOpen,
    setIsGuideOpen,
    saveStatus,
    setSaveStatus,
    errorMessage,
    changesDiff,
    previewDevice,
    setPreviewDevice,
    heroConfig,
    setHeroConfig,
    handleImageUpload,
    handlePreSave,
    handleConfirmSave
  };
}

export default useHeroConfig;
