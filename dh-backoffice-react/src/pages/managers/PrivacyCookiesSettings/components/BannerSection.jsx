import React from 'react';
import { MessageSquareText } from 'lucide-react';

export default function BannerSection({ bannerText, updateConfig }) {
    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <MessageSquareText size={18} className="text-emerald-500" />
                ข้อความแจ้งเตือนคุกกี้ (Cookie Consent Banner)
            </h3>
            
            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">ข้อความที่จะแสดงบนหน้าเว็บ (ด้านล่างสุด)</label>
                <textarea 
                    value={bannerText}
                    onChange={(e) => updateConfig('bannerText', e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none text-sm resize-y"
                    placeholder="เว็บไซต์นี้มีการใช้งานคุกกี้..."
                />
            </div>

            {/* Preview Banner */}
            <div className="mt-4 p-4 bg-slate-800 rounded-lg shadow-inner">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-200 leading-relaxed flex-1">
                        {bannerText}
                    </p>
                    <div className="flex gap-2 shrink-0">
                        <button className="px-4 py-2 border border-slate-400 text-slate-200 rounded text-sm hover:bg-slate-700 pointer-events-none">
                            ตั้งค่าคุกกี้
                        </button>
                        <button className="px-4 py-2 bg-white text-slate-800 rounded text-sm font-bold hover:bg-slate-200 pointer-events-none">
                            ยอมรับทั้งหมด
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
