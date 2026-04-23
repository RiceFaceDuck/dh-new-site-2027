import React, { useState, useEffect } from 'react';
import { 
    Lock, Unlock, ShieldAlert, Save, AlertTriangle, 
    Box, Link as LinkIcon, ShieldCheck, Loader2, Info 
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { settingsService } from '../../firebase/settingsService';
import { warrantyService } from '../../firebase/warrantyService';
import { historyService } from '../../firebase/historyService';

export default function GlobalSettingsPanel() {
    // 🛡️ Security State
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('inventory'); // เปลี่ยน Default เป็น Inventory

    // 📊 Data States
    const [inventoryConfig, setInventoryConfig] = useState({
        defaultBufferStock: 2
    });

    const [regexConfig, setRegexConfig] = useState({
        shopee: '', lazada: '', tiktok: '', facebook: ''
    });

    const [warrantyConfig, setWarrantyConfig] = useState({
        categories: {}
    });

    // 📥 โหลดข้อมูลทั้งหมดเมื่อ Component ทำงาน
    useEffect(() => {
        fetchAllSettings();
    }, []);

    const fetchAllSettings = async () => {
        setIsLoading(true);
        try {
            // 1. Inventory Settings
            const invSnap = await getDoc(doc(db, 'settings', 'inventory'));
            if (invSnap.exists()) setInventoryConfig(invSnap.data());

            // 2. Regex Settings
            const regexData = await settingsService.getPlatformRegex();
            if (regexData) setRegexConfig(regexData);

            // 3. Warranty Settings
            const warrantyData = await warrantyService.getWarrantySettings();
            if (warrantyData) setWarrantyConfig(warrantyData);

        } catch (error) {
            console.error("🔥 Error fetching global settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // 🔒 ระบบสลักนิรภัย (Security Lock)
    const toggleLock = () => {
        if (isUnlocked) {
            setIsUnlocked(false);
        } else {
            const confirmUnlock = window.confirm("⚠️ คำเตือน: คุณกำลังเข้าสู่โหมดแก้ไขการตั้งค่าระดับระบบ (Global Settings)\n\nการเปลี่ยนแปลงค่าผิดพลาดอาจส่งผลกระทบต่อระบบสต็อกและกฎเกณฑ์ทั้งบริษัท\nคุณยืนยันที่จะปลดล็อกหรือไม่?");
            if (confirmUnlock) setIsUnlocked(true);
        }
    };

    // 💾 ฟังก์ชันบันทึกข้อมูลตาม Tab
    const handleSave = async () => {
        if (!isUnlocked) return;
        setIsSaving(true);
        const uid = auth.currentUser?.uid;

        try {
            if (activeTab === 'inventory') {
                const buffer = Number(inventoryConfig.defaultBufferStock);
                if (buffer < 0) throw new Error("บัฟเฟอร์สต็อกห้ามติดลบ");

                await setDoc(doc(db, 'settings', 'inventory'), { defaultBufferStock: buffer }, { merge: true });
                await historyService.addLog('SystemConfig', 'Update', 'inventory', `อัปเดตบัฟเฟอร์กลางเป็น ${buffer} ชิ้น`, uid);
                alert("✅ บันทึกบัฟเฟอร์สต็อกสำเร็จ");
            }
            else if (activeTab === 'regex') {
                // Test Regex syntax before saving
                for (const pattern of Object.values(regexConfig)) {
                    if (pattern) new RegExp(pattern); 
                }
                await settingsService.updatePlatformRegex(regexConfig);
                alert("✅ บันทึกกฎตรวจสอบลิงก์สำเร็จ");
            }
            else if (activeTab === 'warranty') {
                await warrantyService.updateWarrantySettings(warrantyConfig, uid);
                alert("✅ บันทึกกติกาประกันพื้นฐานสำเร็จ");
            }

            // ล็อกกลับอัตโนมัติหลังเซฟเสร็จ เพื่อความปลอดภัย
            setIsUnlocked(false); 
        } catch (error) {
            console.error("Save Error:", error);
            alert(`❌ เกิดข้อผิดพลาด: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-2xl border border-slate-200">
                <Loader2 size={32} className="animate-spin mb-3" />
                <span className="font-bold text-sm">กำลังโหลดข้อมูลระบบส่วนกลาง...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full min-h-[600px] font-sans">
            
            {/* 🛡️ Header & Security Lock */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <ShieldAlert size={20} className="text-blue-600" />
                        ศูนย์ควบคุมตัวแปรระบบ (Global Settings)
                    </h2>
                    <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                        ระมัดระวังการแก้ไขข้อมูลในส่วนนี้ มีผลกระทบทั้งระบบ
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={toggleLock}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all shadow-sm active:scale-95 ${
                            isUnlocked 
                            ? 'bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200' 
                            : 'bg-slate-700 text-white hover:bg-slate-800'
                        }`}
                    >
                        {isUnlocked ? <Unlock size={14} strokeWidth={2.5}/> : <Lock size={14} strokeWidth={2.5}/>}
                        {isUnlocked ? 'ปลดล็อกแล้ว (อันตราย)' : 'คลิกเพื่อปลดล็อกแก้ไข'}
                    </button>
                    
                    <button 
                        onClick={handleSave}
                        disabled={!isUnlocked || isSaving}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs transition-all shadow-sm disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 active:scale-95"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14} strokeWidth={2.5}/>}
                        บันทึกข้อมูล
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
                
                {/* 📑 Sidebar Tabs */}
                <div className="w-full md:w-56 bg-slate-50 border-r border-slate-200 flex flex-row md:flex-col p-2 gap-1 overflow-x-auto shrink-0 custom-scrollbar">
                    <button onClick={() => setActiveTab('inventory')} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-black text-xs transition-all whitespace-nowrap md:whitespace-normal text-left ${activeTab === 'inventory' ? 'bg-rose-100 text-rose-700 shadow-sm border border-rose-200' : 'text-slate-600 hover:bg-slate-200'}`}>
                        <Box size={16} strokeWidth={2.5}/> บัฟเฟอร์คลังสินค้า
                    </button>
                    <button onClick={() => setActiveTab('regex')} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-black text-xs transition-all whitespace-nowrap md:whitespace-normal text-left ${activeTab === 'regex' ? 'bg-sky-100 text-sky-700 shadow-sm border border-sky-200' : 'text-slate-600 hover:bg-slate-200'}`}>
                        <LinkIcon size={16} strokeWidth={2.5}/> กฎความถูกต้องลิงก์
                    </button>
                    <button onClick={() => setActiveTab('warranty')} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-black text-xs transition-all whitespace-nowrap md:whitespace-normal text-left ${activeTab === 'warranty' ? 'bg-amber-100 text-amber-700 shadow-sm border border-amber-200' : 'text-slate-600 hover:bg-slate-200'}`}>
                        <ShieldCheck size={16} strokeWidth={2.5}/> กติกาการรับประกัน
                    </button>
                </div>

                {/* 📄 Content Area */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white relative">
                    
                    {/* Overlay บังจอตอน Lock */}
                    {!isUnlocked && (
                        <div className="absolute inset-0 z-10 bg-slate-50/50 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                            <div className="bg-slate-800 text-white px-4 py-2 rounded-lg font-black text-xs shadow-lg flex items-center gap-2 opacity-80">
                                <Lock size={14}/> ถูกล็อกเพื่อความปลอดภัย
                            </div>
                        </div>
                    )}

                    {/* --- TAB 1: INVENTORY --- */}
                    {activeTab === 'inventory' && (
                        <div className="space-y-6 max-w-lg animate-in fade-in">
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex gap-3 text-rose-800">
                                <AlertTriangle size={20} className="shrink-0"/>
                                <p className="text-xs font-bold leading-relaxed">ค่าบัฟเฟอร์ (Buffer) คือจำนวนสต็อกที่ระบบจะ "กั๊ก" ไว้ไม่ให้ขายหน้าร้านจนหมด เพื่อสำรองไว้สำหรับงานเคลมหรือพันธมิตร</p>
                            </div>

                            <div>
                                <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-1.5 block">ค่าบัฟเฟอร์สต็อกพื้นฐาน (Global Buffer)</label>
                                <div className="relative">
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-rose-500 text-xs">ชิ้น (Pcs)</span>
                                    <input 
                                        type="number" min="0" disabled={!isUnlocked}
                                        value={inventoryConfig.defaultBufferStock}
                                        onChange={(e) => setInventoryConfig({defaultBufferStock: e.target.value})}
                                        className="w-full pl-4 pr-20 py-3 bg-white border-2 border-slate-200 rounded-xl font-black text-2xl text-rose-600 outline-none focus:border-rose-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 2: REGEX --- */}
                    {activeTab === 'regex' && (
                        <div className="space-y-6 max-w-2xl animate-in fade-in">
                            <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl flex gap-3 text-sky-800">
                                <LinkIcon size={20} className="shrink-0 mt-0.5"/>
                                <p className="text-xs font-bold leading-relaxed">ใช้ Regular Expression (Regex) ในการตรวจสอบความถูกต้องของลิงก์ที่พนักงานนำมาวาง หากไวยากรณ์ผิด ระบบจะไม่เซฟ</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {['shopee', 'lazada', 'tiktok', 'facebook'].map(platform => (
                                    <div key={platform}>
                                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5 block capitalize">รูปแบบลิงก์ {platform}</label>
                                        <input 
                                            type="text" disabled={!isUnlocked}
                                            value={regexConfig[platform] || ''}
                                            onChange={(e) => setRegexConfig({...regexConfig, [platform]: e.target.value})}
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-sky-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50 disabled:text-slate-400 transition-all"
                                            placeholder="ตัวอย่าง: (shopee\.co\.th)"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- TAB 3: WARRANTY --- */}
                    {activeTab === 'warranty' && (
                        <div className="space-y-6 max-w-2xl animate-in fade-in">
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-amber-800">
                                <ShieldCheck size={20} className="shrink-0 mt-0.5"/>
                                <p className="text-xs font-bold leading-relaxed">ตั้งค่าการรับประกันพื้นฐานแบ่งตามหมวดหมู่สินค้า (หากสินค้านั้นไม่มีการตั้งค่าประกันพิเศษระดับ SKU ระบบจะใช้ค่าจากหน้านี้)</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.entries(warrantyConfig.categories).map(([catName, data]) => (
                                    <div key={catName} className="p-3 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col gap-2">
                                        <div className="font-black text-slate-800 text-xs border-b border-slate-100 pb-1.5 uppercase tracking-wider">{catName}</div>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="text-[9px] font-black text-slate-500">เคลมซ่อม (วัน)</label>
                                                <input 
                                                    type="number" min="0" disabled={!isUnlocked} value={data.claimDays}
                                                    onChange={(e) => setWarrantyConfig(prev => ({...prev, categories: {...prev.categories, [catName]: {...data, claimDays: Number(e.target.value)}}}))}
                                                    className="w-full mt-0.5 p-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-700 outline-none focus:border-amber-500 disabled:opacity-60"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[9px] font-black text-slate-500">คืนเงิน (วัน)</label>
                                                <input 
                                                    type="number" min="0" disabled={!isUnlocked} value={data.returnDays}
                                                    onChange={(e) => setWarrantyConfig(prev => ({...prev, categories: {...prev.categories, [catName]: {...data, returnDays: Number(e.target.value)}}}))}
                                                    className="w-full mt-0.5 p-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-700 outline-none focus:border-amber-500 disabled:opacity-60"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}