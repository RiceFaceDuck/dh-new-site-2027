import React from 'react';
import { LayoutPanelTop, Loader2, HelpCircle } from 'lucide-react';
import GlobalSettingsHeader from '../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../components/managers/SaveConfirmationModal';
import { useFooterSettings } from './hooks/useFooterSettings';
import ColorThemeSection from './components/footer/ColorThemeSection';
import ContactInfoSection from './components/footer/ContactInfoSection';
import TrustBadgesSection from './components/footer/TrustBadgesSection';
import SocialMediaHubSection from './components/footer/SocialMediaHubSection';
import LinkZoneSection from './components/footer/LinkZoneSection';
import LiveStorefrontPreview from './components/footer/LiveStorefrontPreview';
import GuideModal from '../../components/common/GuideModal';

export default function GlobalFooterSettings() {
    const {
        isLoading,
        isSaving,
        isModalOpen,
        setIsModalOpen,
        changesDiff,
        footerConfig,
        handlePreSave,
        handleSave,
        handleColorChange,
        handleApplyColorPreset,
        handleCompanyChange,
        handleBusinessHoursChange,
        handleSocialChange,
        handleSocialEnabled,
        handleTrustBadgeToggle,
        handleTrustBadgesEnabled,
        updateLink,
        addLink,
        removeLink
    } = useFooterSettings();

    const [isGuideOpen, setIsGuideOpen] = React.useState(false);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 size={32} className="animate-spin mb-3 text-sky-500" />
                <span className="font-bold text-sm text-slate-600">กำลังโหลดข้อมูลระบบส่วนกลาง...</span>
            </div>
        );
    }

    return (
        <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
            <SaveConfirmationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleSave}
                changes={changesDiff}
                isSaving={isSaving}
            />

            <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden relative flex flex-col min-h-[60vh]">
                <GlobalSettingsHeader 
                    title="พื้นที่ส่วนล่าง (Footer Settings)" 
                    icon={LayoutPanelTop}
                    onSave={handlePreSave}
                    isSaving={isSaving}
                    titleExtra={
                        <button 
                            type="button" 
                            onClick={() => setIsGuideOpen(true)} 
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 shadow-xs shrink-0 cursor-pointer"
                        >
                            <HelpCircle size={14} className="text-sky-500" /> คู่มือการตั้งค่า
                        </button>
                    }
                />

                <div className="flex-1 p-5 sm:p-7 relative bg-slate-50/50">
                    <div className="space-y-6 max-w-full mx-auto">
                        {/* Row 1: Live Storefront Preview (Top Position - Production Parity) */}
                        <LiveStorefrontPreview footerConfig={footerConfig} />

                        {/* Row 2: Color Palette */}
                        <ColorThemeSection 
                            footerConfig={footerConfig} 
                            handleColorChange={handleColorChange} 
                            handleApplyColorPreset={handleApplyColorPreset} 
                        />

                        {/* Row 3: Brand Info & Business Hours (Left) + Trust Badges & Social Media Hub (Right) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            <ContactInfoSection 
                                footerConfig={footerConfig} 
                                handleCompanyChange={handleCompanyChange} 
                                handleBusinessHoursChange={handleBusinessHoursChange} 
                            />
                            <div className="space-y-6">
                                <TrustBadgesSection 
                                    footerConfig={footerConfig} 
                                    handleTrustBadgeToggle={handleTrustBadgeToggle} 
                                    handleTrustBadgesEnabled={handleTrustBadgesEnabled} 
                                />
                                <SocialMediaHubSection 
                                    footerConfig={footerConfig} 
                                    handleSocialChange={handleSocialChange} 
                                    handleSocialEnabled={handleSocialEnabled} 
                                />
                            </div>
                        </div>

                        {/* Row 4: Link Zones */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <LinkZoneSection 
                                title="หมวดหมู่สินค้า (Quick Links)" 
                                category="quickLinks" 
                                links={footerConfig.quickLinks} 
                                updateLink={updateLink} 
                                addLink={addLink} 
                                removeLink={removeLink} 
                            />
                            <LinkZoneSection 
                                title="ศูนย์ช่วยเหลือ (Support Links)" 
                                category="supportLinks" 
                                links={footerConfig.supportLinks} 
                                updateLink={updateLink} 
                                addLink={addLink} 
                                removeLink={removeLink} 
                            />
                        </div>
                    </div>
                </div>
            </div>

            <GuideModal 
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
                title="คู่มือ: ตั้งค่า Footer หน้าบ้าน"
                icon={LayoutPanelTop}
                config={{
                    description: "ระบบสำหรับบริหารจัดการข้อมูลส่วนล่าง (Footer) และตราสัญลักษณ์ความเชื่อมั่น (Trust Badges) ของเว็บไซต์หน้าร้าน (Storefront) ได้ด้วยตนเอง",
                    howTo: [
                        "<strong>ตั้งค่าสี (Color Theme):</strong> ปรับโทนสีพื้นหลังและสีเน้นข้อความของ Footer รองรับทั้ง Tailwind class และโค้ดสี HEX",
                        "<strong>ข้อมูลติดต่อ (Brand & Contact):</strong> ระบุโลโก้ คำบรรยายร้าน ที่อยู่ เบอร์โทรศัพท์ และลิงก์ LINE OA",
                        "<strong>ตราความเชื่อมั่น (Trust Badges):</strong> เปิด/ปิดการแสดงผลตราสัญลักษณ์ความเชื่อมั่นระดับ B2B แบบไฟล์ภาพมาตรฐานสากล ขนาดเท่ากัน สวยงาม",
                        "<strong>เมนูลิงก์ (Links):</strong> เพิ่ม ลบ หรือแก้ไขชื่อเมนูและ URL ในหมวดหมู่สินค้าและศูนย์ช่วยเหลือ",
                        "<strong>การบันทึก:</strong> ตรวจสอบผลลัพธ์ผ่าน Live Preview ด้านบน แล้วกดปุ่ม <code>บันทึกข้อมูล</code> เพื่ออัปเดตสู่ระบบส่วนกลาง"
                    ],
                    tips: [
                        "ภาพจำลอง (Live Preview) แสดงผลตามการพิมพ์ของคุณแบบ Real-time โดยไม่ต้องรีเฟรชหน้าจอ",
                        "ข้อมูลทั้งหมดจะถูกจัดเก็บรวบลงใน Single Document 'settings/storefront_config' เพื่อความเร็วและการประหยัดโควตา Firestore"
                    ],
                    expectedResults: "การเปลี่ยนแปลงจะถูกส่งไปยังเว็บไซต์หน้าร้านทันทีหลังจากบันทึกเสร็จสมบูรณ์"
                }}
            />
        </div>
    );
}
