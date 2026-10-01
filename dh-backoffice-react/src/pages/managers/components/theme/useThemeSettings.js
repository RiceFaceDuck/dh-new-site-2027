import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { settingsService, DEFAULT_THEME_CONFIG } from '../../../../firebase/settingsService';

/**
 * Custom Hook for Storefront Theme Configuration State & Controller
 * Implements Clean Architecture & SRP by decoupling logic from ThemeConfigTab UI
 */
export function useThemeSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [changesDiff, setChangesDiff] = useState([]);
  const [originalConfig, setOriginalConfig] = useState(null);
  const [themeConfig, setThemeConfig] = useState({
    themeId: 'theme-trusted-partner',
    backgroundUrl: '/user-bg.jpg',
    blurLevel: '16',
    opacityTop: 75,
    opacityMid: 55,
    opacityBottom: 35
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const themeData = await settingsService.getStorefrontTheme();
        if (themeData) {
          setThemeConfig(themeData);
          setOriginalConfig(themeData);
        }
      } catch (error) {
        console.error("🔥 Error fetching theme settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePreSave = () => {
    const changes = [];
    if (originalConfig) {
      if (themeConfig.themeId !== originalConfig.themeId) {
        changes.push({ label: 'ระบบธีมสี', oldVal: originalConfig.themeId || 'N/A', newVal: themeConfig.themeId });
      }
      if (themeConfig.backgroundUrl !== originalConfig.backgroundUrl) {
        changes.push({ label: 'ลิงก์รูปภาพพื้นหลัง', oldVal: originalConfig.backgroundUrl, newVal: themeConfig.backgroundUrl });
      }
      if (String(themeConfig.blurLevel) !== String(originalConfig.blurLevel)) {
        changes.push({ label: 'ระดับความเบลอภาพ (Blur)', oldVal: `${originalConfig.blurLevel} px`, newVal: `${themeConfig.blurLevel} px` });
      }
      if (String(themeConfig.opacityTop) !== String(originalConfig.opacityTop)) {
        changes.push({ label: 'ความขาวด้านบน', oldVal: `${originalConfig.opacityTop}%`, newVal: `${themeConfig.opacityTop}%` });
      }
      if (String(themeConfig.opacityMid) !== String(originalConfig.opacityMid)) {
        changes.push({ label: 'ความขาวตรงกลาง', oldVal: `${originalConfig.opacityMid}%`, newVal: `${themeConfig.opacityMid}%` });
      }
      if (String(themeConfig.opacityBottom) !== String(originalConfig.opacityBottom)) {
        changes.push({ label: 'ความขาวด้านล่าง', oldVal: `${originalConfig.opacityBottom}%`, newVal: `${themeConfig.opacityBottom}%` });
      }
    }
    setChangesDiff(changes);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const cleanTheme = {
        themeId: themeConfig.themeId || 'theme-trusted-partner',
        backgroundUrl: (themeConfig.backgroundUrl?.trim() || '/user-bg.jpg'),
        blurLevel: String(themeConfig.blurLevel || '16'),
        opacityTop: Number(themeConfig.opacityTop) || 0,
        opacityMid: Number(themeConfig.opacityMid) || 0,
        opacityBottom: Number(themeConfig.opacityBottom) || 0,
      };
      await settingsService.updateStorefrontTheme(cleanTheme);
      setOriginalConfig({ ...cleanTheme });
      setIsModalOpen(false);
      toast.success('บันทึกธีมหน้าบ้านสำเร็จ');
      alert("✅ บันทึกธีมหน้าบ้านสำเร็จ (หน้าบ้านจะเปลี่ยนตามทันที)");
    } catch (error) {
      console.error("Save Error:", error);
      toast.error(error?.message || 'เกิดข้อผิดพลาดในการบันทึก');
      alert(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (confirm("ต้องการคืนค่าธีมเริ่มต้นทั้งหมดใช่หรือไม่?")) {
      setThemeConfig({ ...DEFAULT_THEME_CONFIG, themeId: 'theme-trusted-partner' });
    }
  };

  return {
    isLoading,
    isSaving,
    isModalOpen,
    setIsModalOpen,
    changesDiff,
    themeConfig,
    setThemeConfig,
    originalConfig,
    handlePreSave,
    handleSave,
    handleResetToDefault
  };
}

export default useThemeSettings;
