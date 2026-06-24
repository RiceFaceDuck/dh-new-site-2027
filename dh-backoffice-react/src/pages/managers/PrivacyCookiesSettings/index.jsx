import React, { useState } from 'react';
import { ShieldCheck, Loader2, HelpCircle } from 'lucide-react';
import GlobalSettingsHeader from '../../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../../components/managers/SaveConfirmationModal';
import GuideModal from '../../../components/common/GuideModal';
import { usePrivacyCookies } from '../hooks/usePrivacyCookies';

// Components
import BannerSection from './components/BannerSection';
import PolicyLinkSection from './components/PolicyLinkSection';
import CookieTypesSection from './components/CookieTypesSection';
import LogoSection from './components/LogoSection';
import ConsentTextSection from './components/ConsentTextSection';

export default function PrivacyCookiesSettings() {
    const {
        isLoading,
        isSaving,
        isModalOpen,
        setIsModalOpen,
        changesDiff,
        privacyConfig,
        handlePreSave,
        handleSave,
        updateConfig,
        updatePolicyLink,
        updateCookieType,
        updateConsentText
    } = usePrivacyCookies();

    const [isGuideOpen, setIsGuideOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 size={32} className="animate-spin mb-3" />
                <span className="font-bold text-sm">กำลังโหลดข้อมูลระบบส่วนกลาง...</span>
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
                    title="Privacy & Cookies (PDPA)" 
                    icon={ShieldCheck}
                    onSave={handlePreSave}
                    isSaving={isSaving}
                />

                <div className="flex-1 p-6 sm:p-10 relative bg-slate-50/50">
                    <div className="space-y-8 max-w-4xl mx-auto">
                        
                        {/* Information Banner */}
                        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-indigo-800 shadow-sm">
                            <div className="flex gap-4">
                                <ShieldCheck size={24} className="shrink-0 text-indigo-500 mt-0.5"/>
                                <div>
                                    <h2 className="text-base font-bold leading-relaxed mb-1">
                                        ระบบจัดการข้อมูลส่วนบุคคลและคุกกี้
                                    </h2>
                                    <p className="text-sm">
                                        ตั้งค่าข้อความและลิงก์สำหรับ Cookie Consent แบนเนอร์บนหน้าเว็บไซต์หลัก เพื่อให้สอดคล้องกับพ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA)
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsGuideOpen(true)} 
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 rounded-lg transition-colors border border-indigo-200 shadow-sm dh-active-press shrink-0"
                            >
                                <HelpCircle size={14} /> คู่มือการใช้งาน
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Logo */}
                            <LogoSection 
                                logoUrl={privacyConfig.logoUrl} 
                                updateConfig={updateConfig} 
                            />

                            {/* Banner Text */}
                            <BannerSection 
                                bannerText={privacyConfig.bannerText} 
                                updateConfig={updateConfig} 
                            />

                            {/* Policy Links */}
                            <PolicyLinkSection 
                                policyLinks={privacyConfig.policyLinks} 
                                updatePolicyLink={updatePolicyLink} 
                            />

                            {/* Cookie Types */}
                            <CookieTypesSection 
                                cookieTypes={privacyConfig.cookieTypes} 
                                updateCookieType={updateCookieType} 
                            />

                            {/* Consent Texts */}
                            <ConsentTextSection
                                consentTexts={privacyConfig.consentTexts}
                                updateConsentText={updateConsentText}
                            />
                        </div>

                    </div>
                </div>
            </div>

            {/* In-App Documentation */}
            <GuideModal 
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
                title="คู่มือ: การจัดการ Privacy & Cookies"
                icon={ShieldCheck}
                config={{
                    description: "ใช้จัดการนโยบายความเป็นส่วนตัวและ Cookie Consent สำหรับผู้เยี่ยมชมเว็บไซต์ให้เป็นไปตามกฎหมาย PDPA ของไทย",
                    howTo: [
                        "<strong>โลโก้ (Logo):</strong> ใส่ URL ของโลโก้บริษัทที่ต้องการแสดงในหน้าต่างตั้งค่าคุกกี้ แนะนำให้ใช้รูปทรงจัตุรัสแบบไม่มีพื้นหลัง",
                        "<strong>ข้อความแบนเนอร์ (Banner Text):</strong> กำหนดข้อความที่จะแสดงครั้งแรกที่ผู้ใช้เข้าเว็บ (แจ้งให้ทราบว่ามีการใช้คุกกี้)",
                        "<strong>ลิงก์นโยบาย (Policy Links):</strong> ใส่ลิงก์ไปยังหน้าเพจที่อธิบาย นโยบายความเป็นส่วนตัว (Privacy Policy) อย่างละเอียด",
                        "<strong>ประเภทคุกกี้ (Cookie Types):</strong> คุณสามารถแก้ชื่อหรือคำอธิบายของคุกกี้แต่ละประเภท รวมถึงตั้งค่าสถานะเปิด/ปิด เป็นค่าเริ่มต้นให้กับผู้เข้าชมได้ (ยกเว้นประเภท Necessary ที่ต้องเปิดเสมอ)",
                        "<strong>การบันทึก:</strong> หลังจากแก้ไขเสร็จ ให้กดปุ่ม `บันทึกการเปลี่ยนแปลง` สีน้ำเงินด้านบนขวา"
                    ],
                    tips: [
                        "เขียนคำอธิบายคุกกี้ให้เป็นภาษาที่เข้าใจง่าย หลีกเลี่ยงศัพท์เทคนิคเกินความจำเป็น",
                        "การใส่ลิงก์สามารถใช้แบบ Relative Path ได้ เช่น `/privacy-policy` หากลิงก์อยู่ในโดเมนเดียวกัน"
                    ],
                    expectedResults: "การตั้งค่าเหล่านี้จะถูกดึงไปแสดงผลที่ Cookie Banner บนหน้าเว็บไซต์หลักโดยอัตโนมัติ (อาจมีผลล่าช้าเล็กน้อยจากการแคชของระบบ)"
                }}
            />
        </div>
    );
}
