import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { featuredConfigService } from '../../../firebase/featured/featuredConfigService';

export default function FeaturedSettings() {
    const [config, setConfig] = useState({ isActive: true, displayLimit: 8 });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isReseeding, setIsReseeding] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const data = await featuredConfigService.getConfig();
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
            await featuredConfigService.updateConfig({
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

    const handleReseed = async () => {
        if (!window.confirm("การรีเซ็ตค่าการสุ่ม (Reseed) จะทำการอัปเดตสินค้าทุกชิ้นในระบบ เพื่อให้เกิดการเรียงลำดับแบบสุ่มใหม่ทั้งหมด อาจใช้เวลาสักครู่ ยืนยันหรือไม่?")) return;
        
        setIsReseeding(true);
        try {
            const count = await featuredConfigService.reseedAllProducts();
            alert(`รีเซ็ตค่าการสุ่มสำเร็จ อัปเดตสินค้าทั้งหมด ${count} รายการ`);
        } catch (error) {
            alert("เกิดข้อผิดพลาดในการรีเซ็ต: " + error.message);
        } finally {
            setIsReseeding(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-emerald-600">
                <Loader2 size={32} className="animate-spin mb-3" />
                <span className="font-bold text-sm">กำลังโหลดการตั้งค่า...</span>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto w-full animate-fade-in">
            
            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex gap-4 text-emerald-800 shadow-sm mb-8">
                <Sparkles size={24} className="shrink-0 text-emerald-500 mt-0.5"/>
                <div>
                    <p className="text-sm font-bold leading-relaxed mb-1">
                        จัดการแผงสินค้าแนะนำ (Featured Spares)
                    </p>
                    <p className="text-xs text-emerald-600 font-medium">
                        ควบคุมการแสดงผลและจำนวนสินค้าที่จะสุ่มแสดงในหน้าแรกของเว็บไซต์ ระบบนี้จะสุ่มเฉพาะสินค้าที่มีสถานะเปิดขาย (isActive) เท่านั้น
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                
                {/* Toggle Active */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-700 tracking-wider">เปิดใช้งานแผงสินค้าแนะนำ</h3>
                        <p className="text-xs text-slate-500 mt-1">แสดงหรือซ่อนแผงนี้ในหน้า Storefront</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={config.isActive}
                            onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                        />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                    </label>
                </div>

                {/* Display Limit */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-black text-slate-700 tracking-wider mb-4">จำนวนสินค้าที่ต้องการแสดงผล</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[4, 8, 12, 16].map(num => (
                            <label key={num} className={`cursor-pointer flex justify-center items-center p-3 border-2 rounded-xl transition-all ${config.displayLimit === num ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-emerald-300 text-slate-600'}`}>
                                <input 
                                    type="radio" 
                                    name="displayLimit" 
                                    value={num}
                                    checked={config.displayLimit === num}
                                    onChange={() => setConfig({ ...config, displayLimit: num })}
                                    className="sr-only"
                                />
                                <span className="font-bold text-lg">{num} <span className="text-sm font-normal opacity-70">ชิ้น</span></span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Reseed Option */}
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-black text-orange-800 flex items-center gap-2">
                            <AlertTriangle size={18} />
                            รีเซ็ตระบบการสุ่มใหม่ (Reseed Randomization)
                        </h3>
                        <p className="text-xs text-orange-600 mt-2 max-w-xl">
                            หากพบว่าสินค้าที่สุ่มมาแสดงผลเริ่มซ้ำเดิม หรือเพิ่งเพิ่มสินค้าใหม่เข้ามาเยอะๆ สามารถกดปุ่มนี้เพื่อสร้างค่าการสุ่มใหม่ให้สินค้าทุกชิ้นในระบบได้
                        </p>
                    </div>
                    <button 
                        onClick={handleReseed}
                        disabled={isReseeding}
                        className="px-5 py-2.5 bg-white border border-orange-200 text-orange-600 font-bold rounded-xl hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 shrink-0 whitespace-nowrap"
                    >
                        {isReseeding ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        รีเซ็ตการสุ่มตอนนี้
                    </button>
                </div>

            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end border-t border-slate-200 pt-6">
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </button>
            </div>

        </div>
    );
}
