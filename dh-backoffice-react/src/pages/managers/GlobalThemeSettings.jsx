import { useState } from 'react';
import { ImageIcon, MonitorPlay, Settings2 } from 'lucide-react';
import ThemeConfigTab from './components/theme/ThemeConfigTab';
import HeroConfigTab from './components/theme/HeroConfigTab/index';
import GuideModal from '../../components/common/GuideModal';

export default function GlobalThemeSettings() {
    const [activeTab, setActiveTab] = useState('theme');
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    return (
        <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-300 pb-4">
                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={() => setActiveTab('theme')}
                        className={`flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-[2px] transition-all border ${activeTab === 'theme' ? 'bg-fuchsia-600 text-white border-fuchsia-700 shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'}`}
                    >
                        <ImageIcon size={18} /> ธีมและพื้นหลังหน้าบ้าน
                    </button>
                    <button 
                        onClick={() => setActiveTab('hero')}
                        className={`flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-[2px] transition-all border ${activeTab === 'hero' ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'}`}
                    >
                        <MonitorPlay size={18} /> ป้ายโฆษณาหลัก (Hero Banner)
                    </button>
                </div>
                <button 
                    onClick={() => setIsGuideOpen(true)} 
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-[2px] transition-colors border border-slate-300 shadow-xs dh-active-press shrink-0"
                >
                    <Settings2 size={16} /> คู่มือการใช้งาน
                </button>
            </div>

            {activeTab === 'theme' && <ThemeConfigTab />}
            {activeTab === 'hero' && <HeroConfigTab />}
            
            <GuideModal 
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
                title="คู่มือ: ตั้งค่ารูปลักษณ์หน้าเว็บไซต์ (Theme Settings)"
                icon={Settings2}
                config={{
                    description: "หน้าจอนี้ใช้สำหรับปรับเปลี่ยนรูปลักษณ์ สีสัน และแบนเนอร์ของเว็บไซต์ส่วนหน้าบ้าน (Storefront) ให้เข้ากับเทศกาลหรือแคมเปญปัจจุบัน",
                    howTo: [
                        "<strong>ธีมและพื้นหลัง:</strong> สามารถเลือกรูปแบบสีของปุ่ม และภาพพื้นหลังของเว็บไซต์ได้",
                        "<strong>ป้ายโฆษณาหลัก:</strong> จัดการสไลเดอร์รูปภาพ (Carousel) ด้านบนสุดของเว็บ สามารถเพิ่มลิงก์ให้คลิกไปยังหน้าแคมเปญได้"
                    ],
                    tips: [
                        "รูปภาพที่ใช้อัปโหลดควรมีขนาดตามที่ระบบแนะนำ เพื่อไม่ให้ภาพแตกหรือเบลอเมื่อแสดงผลบนจอคอมพิวเตอร์",
                        "การเปลี่ยนธีมบ่อยๆ ตามเทศกาล (เช่น ปีใหม่ สงกรานต์) จะช่วยให้ลูกค้าประทับใจและรู้สึกว่าเว็บมีความเคลื่อนไหวตลอดเวลา"
                    ],
                    expectedResults: "การเปลี่ยนแปลงจะถูกแสดงบนเว็บไซต์หน้าบ้านทันทีเมื่อกดบันทึก"
                }}
            />
        </div>
    );
}
