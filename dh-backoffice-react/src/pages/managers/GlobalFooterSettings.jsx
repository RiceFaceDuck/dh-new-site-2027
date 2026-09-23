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

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden relative flex flex-col min-h-[60vh]">
                <GlobalSettingsHeader 
                    title="พื้นที่ส่วนล่าง (Footer Settings)" 
                    icon={LayoutPanelTop}
                    onSave={handlePreSave}
                    isSaving={isSaving}
                />

                <div className="flex-1 p-6 sm:p-10 relative bg-slate-50/50">
                    <div className="space-y-8 max-w-full mx-auto">
                        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-indigo-800 shadow-xs">
                            <div className="flex gap-4">
                                <LayoutPanelTop size={24} className="shrink-0 text-indigo-500 mt-0.5"/>
                                <p className="text-sm font-bold leading-relaxed">
                                    ปรับแต่งพื้นที่ส่วนล่าง (Footer) ของหน้าบ้าน รวมถึงสี, ข้อมูลติดต่อ, ตราความเชื่อมั่น และเมนูลิงก์ต่างๆ ข้อมูลนี้จะถูกดึงไปแสดงผลบนหน้าบ้าน
                                </p>
                            </div>
                            <button onClick={() => setIsGuideOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 rounded-lg transition-colors border border-indigo-200 shadow-xs dh-active-press shrink-0">
                                <HelpCircle size={14} /> คู่มือการตั้งค่า
                            </button>
                        </div>

                        {/* Row 1: Color Palette */}
                        <ColorThemeSection 
                            footerConfig={footerConfig} 
                            handleColorChange={handleColorChange} 
                            handleApplyColorPreset={handleApplyColorPreset} 
                        />

                        {/* Row 2: Brand Info & Business Hours */}
                        <ContactInfoSection 
                            footerConfig={footerConfig} 
                            handleCompanyChange={handleCompanyChange} 
                            handleBusinessHoursChange={handleBusinessHoursChange} 
                        />

                        {/* Row 3: Trust Badges & Social Media Hub */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

                        {/* Row 4: Link Zones */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

                        {/* Row 5: Live Storefront Preview */}
                        <LiveStorefrontPreview footerConfig={footerConfig} />
                    </div>
                </div>
            </div>

            <GuideModal 
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
                title="คู่มือ: ตั้งค่าพื้นที่ส่วนล่าง (Footer Settings)"
                icon={LayoutPanelTop}
                config={{
                    description: "ส่วนท้ายของเว็บไซต์เป็นจุดสำคัญในการสร้างความเชื่อมั่น ให้ข้อมูลติดต่อ และนำทางลูกค้าไปยังหมวดหมู่หลัก",
                    howTo: [
                        "<strong>ธีมสี:</strong> เลือกโทนสีสำเร็จรูปที่เหมาะกับสไตล์ร้าน หรือระบุคลาสแบบเจาะจง",
                        "<strong>ข้อมูลแบรนด์ & เวลาทำการ:</strong> ใส่รายละเอียดที่อยู่ เบอร์โทร Line ID และเวลาเปิด-ปิดร้าน",
                        "<strong>ตราความเชื่อมั่น (Trust Badges):</strong> เปิด/ปิด ตราสัญลักษณ์ความน่าเชื่อถือ เช่น B2B Partner หรือ DBD Registered",
                        "<strong>Social Media Hub:</strong> ใส่ลิงก์สำหรับติดตามร้านบนแพลตฟอร์มต่างๆ",
                        "<strong>ลิงก์หมวดหมู่ & ศูนย์ช่วยเหลือ:</strong> เพิ่มหรือแก้ไขลิงก์นำทางด่วน",
                        "<strong>Live Preview:</strong> เลื่อนลงด้านล่างสุดเพื่อดูตัวอย่าง Footer จริงที่จะแสดงบนหน้าบ้าน"
                    ],
                    tips: [
                        "ตรวจสอบข้อมูลติดต่อให้ถูกต้องเสมอ โดยเฉพาะ Line ID และเบอร์โทร เพื่อไม่ให้เสียโอกาสทางการค้า",
                        "ใช้ Live Preview ด้านล่างช่วยตรวจเช็คความสวยงามก่อนกดบันทึกข้อมูลจริง"
                    ],
                    expectedResults: "การเปลี่ยนแปลงทั้งหมดจะถูกนำไปอัปเดตลงระบบหน้าบ้านทันที"
                }}
            />
        </div>
    );
}
