import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { heroConfigService, DEFAULT_HERO_CONFIG, DEFAULT_HERO_BANNER } from '../../../../../firebase/heroConfigService';
import { bannerStorageService } from '../../../../../firebase/bannerStorageService';

/**
 * Custom Hook for Hero Billboard Configuration State & Controller
 * Implements Master-Detail pattern (List View <-> Edit View)
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

  // View Mode: 'list' (หน้ารวมรายการป้าย) vs 'edit' (หน้าปรับแต่งป้าย)
  const [currentView, setCurrentView] = useState('list');
  const [selectedBannerId, setSelectedBannerId] = useState(null);

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

  // Compute currently active banner object in edit mode
  const activeBanner = useMemo(() => {
    if (!heroConfig.banners || heroConfig.banners.length === 0) {
      return { ...DEFAULT_HERO_BANNER };
    }
    const found = heroConfig.banners.find(b => b.id === selectedBannerId);
    return found ? { ...DEFAULT_HERO_BANNER, ...found } : { ...DEFAULT_HERO_BANNER, ...heroConfig.banners[0] };
  }, [heroConfig.banners, selectedBannerId]);

  // Master-Detail Handlers
  const handleSelectBanner = (bannerId) => {
    setSelectedBannerId(bannerId);
    setCurrentView('edit');
  };

  const handleCreateBanner = () => {
    const newId = `banner_${Date.now()}`;
    const nextOrder = (heroConfig.banners?.length || 0) + 1;
    const newBanner = {
      ...DEFAULT_HERO_BANNER,
      id: newId,
      title: 'ป้ายโฆษณาใหม่',
      titleSegments: [
        { text: 'โปรโมชั่นพิเศษ ', color: '#facc15', isHighlight: true, isBold: true, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: false, breakAll: false },
        { text: 'สำหรับลูกค้าคนสำคัญ', color: '', isHighlight: false, isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: false, breakAll: false }
      ],
      order: nextOrder,
      isActive: true,
      imageUrl: ''
    };

    setHeroConfig(prev => ({
      ...prev,
      banners: [...(prev.banners || []), newBanner]
    }));
    setSelectedBannerId(newId);
    setCurrentView('edit');
    toast.success('สร้างป้ายโฆษณาใหม่เรียบร้อยแล้ว');
  };

  const handleDeleteBanner = (bannerId) => {
    if ((heroConfig.banners?.length || 0) <= 1) {
      toast.error('ไม่สามารถลบป้ายสุดท้ายได้ ต้องมีอย่างน้อย 1 ป้าย');
      return;
    }
    if (!window.confirm('คุณต้องการลบป้ายโฆษณานี้ใช่หรือไม่?')) return;

    setHeroConfig(prev => {
      const filtered = prev.banners.filter(b => b.id !== bannerId);
      return {
        ...prev,
        banners: filtered.map((b, idx) => ({ ...b, order: idx + 1 }))
      };
    });

    if (selectedBannerId === bannerId) {
      setCurrentView('list');
      setSelectedBannerId(null);
    }
    toast.success('ลบป้ายโฆษณาเรียบร้อยแล้ว');
  };

  const handleToggleBannerStatus = (bannerId) => {
    setHeroConfig(prev => ({
      ...prev,
      banners: (prev.banners || []).map(b => 
        b.id === bannerId ? { ...b, isActive: !b.isActive } : b
      )
    }));
  };

  const handleMoveBanner = (bannerId, direction) => {
    setHeroConfig(prev => {
      const list = [...(prev.banners || [])];
      const index = list.findIndex(b => b.id === bannerId);
      if (index < 0) return prev;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;

      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;

      return {
        ...prev,
        banners: list.map((b, idx) => ({ ...b, order: idx + 1 }))
      };
    });
  };

  const handleUpdateActiveBanner = (updater) => {
    setHeroConfig(prev => ({
      ...prev,
      banners: (prev.banners || []).map(b => {
        if (b.id === activeBanner.id) {
          const updated = typeof updater === 'function' ? updater(b) : { ...b, ...updater };
          return updated;
        }
        return b;
      })
    }));
  };

  const handleUpdateGlobalSettings = (newSettings) => {
    setHeroConfig(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  const handleBackToList = () => {
    setCurrentView('list');
  };

  const handleImageUpload = async (e, targetBannerId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const bId = targetBannerId || activeBanner?.id;
    setIsUploading(true);
    try {
      const result = await bannerStorageService.uploadBannerImage(file);
      const { url, savedPercent, compressedSize } = result;
      
      setHeroConfig(prev => ({
        ...prev,
        banners: (prev.banners || []).map(b => 
          b.id === bId ? { ...b, imageUrl: url } : b
        )
      }));

      const kbSize = Math.round(compressedSize / 1024);
      toast.success(`อัปโหลดสำเร็จ (ลดขนาด ${savedPercent}%, เหลือ ${kbSize} KB)`);
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
        diff.push({ label: 'สถานะระบบสไลเดอร์', oldVal: originalConfig.isActive ? 'เปิด' : 'ปิด', newVal: heroConfig.isActive ? 'เปิด' : 'ปิด' });
      }
      if (heroConfig.aspectRatio !== originalConfig.aspectRatio) {
        diff.push({ label: 'อัตราส่วนกล่อง (Aspect Ratio)', oldVal: originalConfig.aspectRatio || '16:9', newVal: heroConfig.aspectRatio || '16:9' });
      }
      if (heroConfig.transitionEffect !== originalConfig.transitionEffect) {
        diff.push({ label: 'เอฟเฟกต์สลับภาพ', oldVal: originalConfig.transitionEffect || 'slide', newVal: heroConfig.transitionEffect || 'slide' });
      }
      const oldBannerCount = originalConfig.banners?.length || 1;
      const newBannerCount = heroConfig.banners?.length || 1;
      if (oldBannerCount !== newBannerCount) {
        diff.push({ label: 'จำนวนป้ายโฆษณา', oldVal: `${oldBannerCount} ป้าย`, newVal: `${newBannerCount} ป้าย` });
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
      toast.success('บันทึกการตั้งค่าป้ายโฆษณา (Hero Banner) สำเร็จ!');
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1000);
    } catch (error) {
      console.error("🔥 Error saving hero config:", error);
      setSaveStatus('error');
      setErrorMessage(error?.message || 'เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลได้');
      toast.error(error?.message || 'เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลได้');
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
    currentView,
    setCurrentView,
    selectedBannerId,
    activeBanner,
    handleSelectBanner,
    handleCreateBanner,
    handleDeleteBanner,
    handleToggleBannerStatus,
    handleMoveBanner,
    handleUpdateActiveBanner,
    handleUpdateGlobalSettings,
    handleBackToList,
    handleImageUpload,
    handlePreSave,
    handleConfirmSave
  };
}

export default useHeroConfig;
