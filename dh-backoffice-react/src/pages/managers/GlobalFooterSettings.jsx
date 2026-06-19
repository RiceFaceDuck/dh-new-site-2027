import React from 'react';
import { LayoutPanelTop, Loader2 } from 'lucide-react';
import GlobalSettingsHeader from '../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../components/managers/SaveConfirmationModal';
import { useFooterSettings } from './hooks/useFooterSettings';
import ColorThemeSection from './components/footer/ColorThemeSection';
import ContactInfoSection from './components/footer/ContactInfoSection';
import LinkZoneSection from './components/footer/LinkZoneSection';
import GuideModal from '../../components/common/GuideModal';
import { HelpCircle } from 'lucide-react';

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
        handleCompanyChange,
        updateLink,
        addLink,
        removeLink
    } = useFooterSettings();

    const [isGuideOpen, setIsGuideOpen] = React.useState(false);

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
                    title="พื้นที่ส่วนล่าง (Footer)" 
                    icon={LayoutPanelTop}
                    onSave={handlePreSave}
                    isSaving={isSaving}
                />

                <div className="flex-1 p-6 sm:p-10 relative bg-slate-50/50">
                    <div className="space-y-8 max-w-full mx-auto">
                        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-indigo-800 shadow-sm">
                            <div className="flex gap-4">
                                <LayoutPanelTop size={24} className="shrink-0 text-indigo-500 mt-0.5"/>
                                <p className="text-sm font-bold leading-relaxed">
                                    ปรับแต่งพื้นที่ส่วนล่าง (Footer) ของหน้าบ้าน รวมถึงสี, ข้อมูลติดต่อ, และเมนูลิงก์ต่างๆ ข้อมูลนี้จะถูกดึงไปแสดงผลบนหน้าบ้าน
                                </p>
                            </div>
                            <button onClick={() => setIsGuideOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 rounded-lg transition-colors border border-indigo-200 shadow-sm dh-active-press shrink-0">
                                <HelpCircle size={14} /> คู่มือการตั้งค่า
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <ColorThemeSection footerConfig={footerConfig} handleColorChange={handleColorChange} />
                            <ContactInfoSection footerConfig={footerConfig} handleCompanyChange={handleCompanyChange} />
                        </div>

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
                    </div>
                </div>
            </div>

            <GuideModal 
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
                title="คู่มือ: ตั้งค่า Footer หน้าบ้าน"
                icon={LayoutPanelTop}
                config={{
                    description: "ระบบสำหรับแก้ไขข้อมูลส่วนล่าง (Footer) ของเว็บไซต์หน้าร้าน (Storefront) ได้ด้วยตนเอง ไม่ต้องพึ่งนักพัฒนา",
                    howTo: [
                        "<strong>ตั้งค่าสี (Color Theme):</strong> เลือกสีพื้นหลังและสีตัวอักษรของ Footer รองรับการใส่รหัสสี HEX (เช่น #FFFFFF)",
                        "<strong>ข้อมูลติดต่อ (Contact Info):</strong> ระบุชื่อบริษัท ที่อยู่ และเบอร์โทรศัพท์ เพื่อสร้างความน่าเชื่อถือให้กับลูกค้า",
                        "<strong>เมนูลิงก์ (Quick Links & Support):</strong> คุณสามารถเพิ่ม แก้ไข ลบ เมนูลัด เช่น นโยบายความเป็นส่วนตัว ลิงก์ติดตามพัสดุ",
                        "<strong>การบันทึก:</strong> หลังจากแก้ไขเสร็จ ให้กด <code>บันทึกการเปลี่ยนแปลง</code> ที่มุมขวาบน ระบบจะให้ยืนยันอีกครั้ง"
                    ],
                    tips: [
                        "ควรใช้สีที่มีความแตกต่างกันระหว่างพื้นหลัง (Background) และตัวอักษร (Text) เพื่อให้อ่านง่าย (High Contrast)",
                        "สามารถจัดเรียงลิงก์ได้ตามต้องการ เพื่อให้ลูกค้าเข้าถึงหน้าสำคัญๆ ได้ง่ายที่สุด"
                    ],
                    expectedResults: "การเปลี่ยนแปลงจะถูกอัปเดตไปที่เว็บไซต์หน้าร้านทันทีหลังจากบันทึก หากไม่เห็นการเปลี่ยนแปลงให้ลองรีเฟรชหน้าเว็บไซต์ (Ctrl + F5)"
                }}
            />
        </div>
    );
}
