import { MonitorPlay, Loader2, BookOpen, ArrowLeft } from 'lucide-react';
import GlobalSettingsHeader from '../../../../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../../../../components/managers/SaveConfirmationModal';
import GuideModal from '../../../../../components/common/GuideModal';
import { heroGuideConfig } from './HeroGuideConfig';

// Master List & Detail Components
import HeroBannerListView from './HeroBannerListView';
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
    currentView,
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
        title={
          currentView === 'edit'
            ? `จัดการป้าย: ${activeBanner?.title?.replace(/<[^>]*>?/gm, '') || 'ป้ายโฆษณา'}`
            : "ตั้งค่า ป้ายต้อนรับ (Hero Banner)"
        }
        subtitle={
          currentView === 'edit'
            ? "ปรับแต่งรูปภาพ สัดส่วนภาพ ข้อความ และปุ่มกดเฉพาะป้ายนี้"
            : "จัดการสไลเดอร์รูปภาพ อัตราส่วนกล่อง และป้ายโฆษณาทั้งหมด"
        }
        icon={MonitorPlay}
        onSave={handlePreSave}
        isSaving={isSaving}
        saveDisabled={isUploading || isSaving}
        extraAction={
          <div className="flex items-center gap-2">
            {currentView === 'edit' && (
              <button
                type="button"
                onClick={handleBackToList}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-300 rounded-[2px] hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                กลับหน้ารวมป้าย
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-100/70 border border-blue-300 rounded-[2px] hover:bg-blue-200 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              คู่มือการใช้งาน
            </button>
          </div>
        }
      />

      {/* VIEW 1: Master List View (Full Width & Spacious) */}
      {currentView === 'list' && (
        <div className="space-y-6">
          <HeroBannerListView
            heroConfig={heroConfig}
            onSelectBanner={handleSelectBanner}
            onCreateBanner={handleCreateBanner}
            onDeleteBanner={handleDeleteBanner}
            onToggleStatus={handleToggleBannerStatus}
            onMoveBanner={handleMoveBanner}
            onUpdateGlobalSettings={handleUpdateGlobalSettings}
          />

          {/* Live Preview Box Below List for verification */}
          <div className="pt-2">
            <HeroLivePreview config={heroConfig} />
          </div>
        </div>
      )}

      {/* VIEW 2: Detail Edit View (2-Column Form & Sticky Live Preview) */}
      {currentView === 'edit' && (
        <div className="space-y-4">
          {/* Top Return Bar */}
          <div className="flex items-center justify-between p-3.5 bg-slate-100 border border-slate-300 rounded-[2px]">
            <button
              type="button"
              onClick={handleBackToList}
              className="flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
            >
              <ArrowLeft size={16} /> กลับไปยังหน้ารวมรายการป้าย
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-[2px] border border-slate-300">
                ป้าย ID: {activeBanner.id}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Form: 7 Columns */}
            <div className="lg:col-span-7 space-y-6">
              <HeroStatusToggle
                isActive={activeBanner.isActive}
                onChange={(val) => handleUpdateActiveBanner({ isActive: val })}
              />

              <HeroImageUpload
                imageUrl={activeBanner.imageUrl}
                isUploading={isUploading}
                imageFit={activeBanner.imageFit || 'contain'}
                onFitChange={(fit) => handleUpdateActiveBanner({ imageFit: fit })}
                onUpload={(e) => handleImageUpload(e, activeBanner.id)}
              />

              <HeroGradientConfig
                overlay={activeBanner.overlay}
                bannerHeight={heroConfig.bannerHeight}
                imageLayout={activeBanner.imageLayout}
                onChange={({ overlay, bannerHeight, imageLayout }) => {
                  handleUpdateActiveBanner({
                    ...(overlay && { overlay }),
                    ...(imageLayout && { imageLayout })
                  });
                  if (bannerHeight) handleUpdateGlobalSettings({ bannerHeight });
                }}
              />

              <HeroTitleEditor
                titleSegments={activeBanner.titleSegments}
                badge={activeBanner.badge}
                subtitle={activeBanner.subtitle}
                textAlignment={activeBanner.textAlignment}
                onChange={({ title, titleSegments, badge, subtitle, textAlignment }) =>
                  handleUpdateActiveBanner({
                    title,
                    titleSegments,
                    ...(badge !== undefined && { badge }),
                    ...(subtitle !== undefined && { subtitle }),
                    ...(textAlignment !== undefined && { textAlignment })
                  })
                }
              />

              <HeroButtonConfig
                primaryButton={activeBanner.primaryButton}
                secondaryButton={activeBanner.secondaryButton}
                onChange={({ primaryButton, secondaryButton }) =>
                  handleUpdateActiveBanner({
                    ...(primaryButton && { primaryButton }),
                    ...(secondaryButton && { secondaryButton })
                  })
                }
              />
            </div>

            {/* Right Preview: 5 Columns (Sticky) */}
            <div className="lg:col-span-5">
              <div className="sticky top-6">
                <HeroLivePreview config={heroConfig} selectedBannerId={activeBanner.id} />
              </div>
            </div>
          </div>
        </div>
      )}

      <SaveConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSave}
        isSaving={isSaving}
        changes={changesDiff}
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
