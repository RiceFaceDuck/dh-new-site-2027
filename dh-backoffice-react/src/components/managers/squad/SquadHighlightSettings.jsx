import React, { useState, useEffect } from 'react';
import { Save, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { squadConfigService } from '../../../firebase/squad/squadConfigService';

export default function SquadHighlightSettings() {
    const [config, setConfig] = useState({ isActive: true, displayLimit: 3 });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const data = await squadConfigService.getConfig();
            setConfig(data);
        } catch (error) {
            console.error("Failed to load config", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await squadConfigService.updateConfig({
                isActive: config.isActive,
                displayLimit: Number(config.displayLimit)
            });
            alert("บันทึกการตั้งค่าสำเร็จ ข้อมูลจะเปลี่ยนที่หน้าแรกทันที");
        } catch (error) {
            alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-indigo-600">
                <Loader2 size={32} className="animate-spin mb-3" />
                <span className="font-bold text-sm">กำลังโหลดการตั้งค่า...</span>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto w-full animate-fade-in">
            
            <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex gap-4 text-indigo-800 shadow-sm mb-8">
                <Sparkles size={24} className="shrink-0 text-indigo-500 mt-0.5"/>
                <div>
                    <p className="text-sm font-bold leading-relaxed mb-1">
                        จัดการแผงช่างแนะนำ (Squad Highlight)
                    </p>
                    <p className="text-xs text-indigo-600 font-medium">
                        ควบคุมการแสดงผลและจำนวนผู้ให้บริการ (ช่าง) ที่จะแสดงในหน้าแรกบริเวณ "ผู้ให้บริการ บริเวณใกล้เคียง"
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                
                {/* Toggle Active */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-700 tracking-wider">เปิดใช้งานแผงช่างแนะนำ</h3>
                        <p className="text-xs text-slate-500 mt-1">แสดงหรือซ่อนแผงนี้ในหน้าเว็บของลูกค้า (ประหยัดค่า Firebase Reads ได้หากปิดไว้)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={config.isActive}
                            onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                        />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-500 shadow-inner"></div>
                    </label>
                </div>

                {/* Display Limit */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-black text-slate-700 tracking-wider mb-4">จำนวนช่างที่ต้องการแสดงผลสูงสุด</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[3, 6, 9].map(num => (
                            <label key={num} className={`cursor-pointer flex justify-center items-center p-3 border-2 rounded-xl transition-all ${config.displayLimit === num ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-300 text-slate-600'}`}>
                                <input 
                                    type="radio" 
                                    name="displayLimit" 
                                    value={num}
                                    checked={config.displayLimit === num}
                                    onChange={() => setConfig({ ...config, displayLimit: num })}
                                    className="sr-only"
                                />
                                <span className="font-bold text-lg">{num} <span className="text-sm font-normal opacity-70">คน</span></span>
                            </label>
                        ))}
                    </div>
                </div>

            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end border-t border-slate-200 pt-6">
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </button>
            </div>

        </div>
    );
}
