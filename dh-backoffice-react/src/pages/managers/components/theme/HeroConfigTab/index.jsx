import { MonitorPlay, Loader2, BookOpen } from 'lucide-react';
import GlobalSettingsHeader from '../../../../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../../../../components/managers/SaveConfirmationModal';
import GuideModal from '../../../../../components/common/GuideModal';
import { heroGuideConfig } from './HeroGuideConfig';

// Subcomponents
import HeroStatusToggle from './HeroStatusToggle';
import HeroImageUpload from './HeroImageUpload';
import HeroGradientConfig from './HeroGradientConfig';
import HeroTitleEditor from './HeroTitleEditor';
import HeroButtonConfig from './HeroButtonConfig';
import HeroLivePreview from './HeroLivePreview';

// Custom Controller Hook (Clean Architecture & SRP)
import { useHeroConfig } from './useHeroConfig';

export default function HeroConfigTab() {
  const {
    isLoading,
    isSaving,
    isUploading,
    isModalOpen,
    setIsModalOpen,
    isGuideOpen,
    setIsGuideOpen,
    saveStatus,
    errorMessage,
    changesDiff,
    heroConfig,
    setHeroConfig,
    handleImageUpload,
    handlePreSave,
    handleConfirmSave
  } = useHeroConfig();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-medium">กำลังโหลดข้อมูลการตั้งค่า...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <GlobalSettingsHeader
        title="ตั้งค่า ป้ายต้อนรับ (Hero Banner)"
        description="จัดการข้อความ รูปภาพ และปุ่มกดบนป้ายต้อนรับหน้าแรก B2B Storefront"
        icon={MonitorPlay}
        onSave={handlePreSave}
        isSaving={isSaving}
        saveDisabled={isUploading || isSaving}
        extraAction={
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            คู่มือการใช้งาน
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: 7 Columns */}
        <div className="lg:col-span-7 space-y-6">
          <HeroStatusToggle
            isActive={heroConfig.isActive}
            onChange={(val) => setHeroConfig((prev) => ({ ...prev, isActive: val }))}
          />
          <HeroImageUpload
            imageUrl={heroConfig.imageUrl}
            isUploading={isUploading}
            onUpload={handleImageUpload}
          />
          <HeroGradientConfig
            overlay={heroConfig.overlay}
            bannerHeight={heroConfig.bannerHeight}
            imageLayout={heroConfig.imageLayout}
            onChange={({ overlay, bannerHeight, imageLayout }) =>
              setHeroConfig((prev) => ({
                ...prev,
                ...(overlay && { overlay }),
                ...(bannerHeight && { bannerHeight }),
                ...(imageLayout && { imageLayout })
              }))
            }
          />
          <HeroTitleEditor
            titleSegments={heroConfig.titleSegments}
            badge={heroConfig.badge}
            subtitle={heroConfig.subtitle}
            textAlignment={heroConfig.textAlignment}
            onChange={({ title, titleSegments, badge, subtitle, textAlignment }) =>
              setHeroConfig((prev) => ({
                ...prev,
                title,
                titleSegments,
                ...(badge !== undefined && { badge }),
                ...(subtitle !== undefined && { subtitle }),
                ...(textAlignment !== undefined && { textAlignment })
              }))
            }
          />
          <HeroButtonConfig
            primaryButton={heroConfig.primaryButton}
            secondaryButton={heroConfig.secondaryButton}
            onChange={({ primaryButton, secondaryButton }) =>
              setHeroConfig((prev) => ({
                ...prev,
                ...(primaryButton && { primaryButton }),
                ...(secondaryButton && { secondaryButton })
              }))
            }
          />
        </div>

        {/* Right Preview: 5 Columns (Sticky) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6">
            <HeroLivePreview config={heroConfig} />
          </div>
        </div>
      </div>

      <SaveConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSave}
        isSaving={isSaving}
        changesDiff={changesDiff}
        status={saveStatus}
        errorMessage={errorMessage}
      />

      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        config={heroGuideConfig}
      />
    </div>
  );
}
