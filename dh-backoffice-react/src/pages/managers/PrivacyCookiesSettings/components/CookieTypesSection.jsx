import React from 'react';
import { Settings2 } from 'lucide-react';

export default function CookieTypesSection({ cookieTypes, updateCookieType }) {
    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Settings2 size={18} className="text-orange-500" />
                ตั้งค่าประเภทคุกกี้ (Cookie Types)
            </h3>
            
            <div className="space-y-4">
                {cookieTypes.map((cookie, index) => (
                    <div key={cookie.id} className="p-4 border border-slate-100 rounded-lg bg-slate-50 space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between gap-2 items-start sm:items-center">
                            <input 
                                type="text"
                                value={cookie.name}
                                onChange={(e) => updateCookieType(index, 'name', e.target.value)}
                                className="font-bold text-slate-800 p-1.5 border border-slate-300 rounded bg-white w-full sm:w-1/2 text-sm"
                                placeholder="ชื่อประเภทคุกกี้"
                            />
                            
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-slate-500 mr-2">สถานะเริ่มต้น:</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={cookie.isEnabled}
                                        onChange={(e) => updateCookieType(index, 'isEnabled', e.target.checked)}
                                        disabled={cookie.isMandatory}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                                <span className="text-xs font-medium ml-2 w-10 text-center">
                                    {cookie.isEnabled ? 'เปิด' : 'ปิด'}
                                </span>
                            </div>
                        </div>

                        <textarea
                            value={cookie.description}
                            onChange={(e) => updateCookieType(index, 'description', e.target.value)}
                            rows={2}
                            className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 outline-none text-xs sm:text-sm text-slate-600 resize-y"
                            placeholder="คำอธิบายคุกกี้ประเภทนี้..."
                        />
                        
                        {cookie.isMandatory && (
                            <p className="text-xs text-red-500 font-medium">
                                * คุกกี้ประเภทนี้จำเป็นต่อการทำงานของระบบ (บังคับเปิดเสมอ ไม่สามารถปิดได้)
                            </p>
                        )}
                    </div>
                ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
                * ผู้ใช้งานเว็บจะสามารถเลือกเปิด/ปิดคุกกี้ได้เองในหน้าต่าง "ตั้งค่าคุกกี้" แต่สถานะ "เริ่มต้น" จะเป็นไปตามที่คุณกำหนดไว้ที่นี่
            </p>
        </div>
    );
}
