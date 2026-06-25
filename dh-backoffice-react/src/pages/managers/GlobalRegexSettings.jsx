import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Loader2 } from 'lucide-react';
import { auth } from '../../firebase/config';
import { settingsService } from '../../firebase/settingsService';
import { historyService } from '../../firebase/historyService';
import GlobalSettingsHeader from '../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../components/managers/SaveConfirmationModal';
import GuideModal from '../../components/common/GuideModal';

export default function GlobalRegexSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [changesDiff, setChangesDiff] = useState([]);
    const [originalConfig, setOriginalConfig] = useState(null);
    const [regexConfig, setRegexConfig] = useState({
        shopee: '', lazada: '', tiktok: '', facebook: ''
    });
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const regexData = await settingsService.getPlatformRegex();
                if (regexData) {
                    setRegexConfig(regexData);
                    setOriginalConfig(regexData);
                }
            } catch (error) {
                console.error("🔥 Error fetching regex settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePreSave = () => {
        const changes = [];
        if (originalConfig) {
            ['shopee', 'lazada', 'tiktok', 'facebook'].forEach(platform => {
                if (regexConfig[platform] !== originalConfig[platform]) {
                    changes.push({ label: `Regex: ${platform}`, oldVal: originalConfig[platform], newVal: regexConfig[platform] });
                }
            });
        }
        setChangesDiff(changes);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const uid = auth.currentUser?.uid;
        try {
            // Test Regex syntax before saving
            for (const key in regexConfig) {
                const pattern = regexConfig[key];
                if (pattern) new RegExp(pattern);
            }
            await settingsService.updatePlatformRegex(regexConfig);
            
            const diffMsg = changesDiff.map(c => `${c.label}: ${c.oldVal}->${c.newVal}`).join(', ');
            await historyService.addLog('SystemConfig', 'Update', 'regex', `อัปเดตกฎตรวจสอบลิงก์ (Regex) | ${diffMsg}`, uid);
            
            alert("✅ บันทึกกฎตรวจสอบลิงก์สำเร็จ");
            setOriginalConfig({ ...regexConfig });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Save Error:", error);
            alert(`❌ เกิดข้อผิดพลาด (Regex Syntax อาจไม่ถูกต้อง): ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

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
                <div className="flex justify-between items-center pr-6">
                    <div className="flex-1">
                        <GlobalSettingsHeader 
                            title="กฎความถูกต้องลิงก์ (Regex)" 
                            icon={LinkIcon}
                            onSave={handlePreSave}
                            isSaving={isSaving}
                        />
                    </div>
                    <button 
                        onClick={() => setIsGuideOpen(true)} 
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors border border-sky-200 shadow-sm dh-active-press shrink-0"
                    >
                        <LinkIcon size={16} /> คู่มือการใช้งาน
                    </button>
                </div>

                <div className="flex-1 p-6 sm:p-10 relative bg-slate-50/50">

                    <div className="space-y-8 max-w-full mx-auto">
                        <div className="bg-sky-50 border border-sky-100 p-5 rounded-2xl flex gap-4 text-sky-800 shadow-sm">
                            <LinkIcon size={24} className="shrink-0 text-sky-500 mt-0.5"/>
                            <p className="text-sm font-bold leading-relaxed">
                                ใช้ Regular Expression (Regex) ในการตรวจสอบความถูกต้องของลิงก์ที่พนักงานนำมาวาง หากไวยากรณ์ผิด ระบบจะไม่เซฟ
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {['shopee', 'lazada', 'tiktok', 'facebook'].map(platform => (
                                <div key={platform} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3 block capitalize flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                            platform === 'shopee' ? 'bg-orange-500' : 
                                            platform === 'lazada' ? 'bg-blue-600' :
                                            platform === 'tiktok' ? 'bg-black' : 'bg-blue-500'
                                        }`}></div>
                                        รูปแบบลิงก์ {platform}
                                    </label>
                                    <input 
                                        type="text" disabled={false}
                                        value={regexConfig[platform] || ''}
                                        onChange={(e) => setRegexConfig({...regexConfig, [platform]: e.target.value})}
                                        className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono text-sm font-bold text-sky-700 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                                        placeholder={`ตัวอย่าง: (${platform}\\.co\\.th)`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <GuideModal 
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
                title="คู่มือ: กฎความถูกต้องลิงก์ (Regex)"
                icon={LinkIcon}
                config={{
                    description: "หน้าจอนี้กำหนดกฎเกณฑ์ (Regular Expression) ที่ใช้ตรวจสอบว่าลิงก์ที่นำมาเพิ่มในระบบนั้น เป็นลิงก์ที่ถูกต้องของแพลตฟอร์มนั้นจริงๆ หรือไม่ ป้องกันการใส่ลิงก์สแปมหรือลิงก์เสีย",
                    howTo: [
                        "<strong>แก้ไข Regex:</strong> พิมพ์โค้ด Regex ที่ต้องการในช่องของแต่ละแพลตฟอร์ม",
                        "<strong>ทดสอบก่อนเซฟ:</strong> ระบบจะจำลองคอมไพล์โค้ดของคุณก่อนบันทึก หากไวยากรณ์ Regex ผิด จะไม่สามารถบันทึกได้"
                    ],
                    tips: [
                        "ถ้าคุณไม่เชี่ยวชาญด้าน Regex ควรหลีกเลี่ยงการแก้ไขหน้านี้ หรือให้ทีม Developer เป็นคนแก้ไขให้",
                        "ตัวอย่าง Regex สำหรับ Shopee: ^https?:\\/\\/(shopee\\.co\\.th|shp\\.ee)\\/.+"
                    ],
                    expectedResults: "มีผลทันทีกับฟอร์มเพิ่มลิงก์ต่างๆ ภายในระบบ (เช่น ลิงก์ร้านค้าในหน้าโปรไฟล์พันธมิตร)"
                }}
            />
        </div>
    );
}
