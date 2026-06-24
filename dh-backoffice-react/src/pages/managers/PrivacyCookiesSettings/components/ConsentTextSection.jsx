import React from 'react';
import { Type, Info } from 'lucide-react';

export default function ConsentTextSection({ consentTexts = {}, updateConsentText }) {
    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Type size={18} className="text-emerald-500" />
                        ข้อความขออนุญาตตามจุดต่างๆ (Consent Texts)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        กำหนดข้อความ PDPA ที่จะนำไปแสดงในจุดที่มีการเก็บข้อมูลลูกค้า
                    </p>
                </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg flex gap-3 text-sm text-blue-800 mb-4">
                <Info size={18} className="shrink-0 text-blue-500 mt-0.5" />
                <div>
                    <strong>คำแนะนำในการแทรกลิงก์นโยบาย:</strong>
                    <p className="text-xs mt-1 leading-relaxed">
                        คุณสามารถพิมพ์ <code className="bg-white px-1.5 py-0.5 rounded text-blue-600 font-bold">[terms]</code> เพื่อให้ระบบสร้างลิงก์ไปหน้า "เงื่อนไขการให้บริการ"<br/>
                        และพิมพ์ <code className="bg-white px-1.5 py-0.5 rounded text-blue-600 font-bold">[privacy]</code> เพื่อให้ระบบสร้างลิงก์ไปหน้า "นโยบายความเป็นส่วนตัว" อัตโนมัติ
                    </p>
                </div>
            </div>

            <div className="space-y-5">
                {/* Registration */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        1. หน้าสมัครสมาชิก (Auth & Registration)
                    </label>
                    <textarea 
                        value={consentTexts?.registration || ''}
                        onChange={(e) => updateConsentText('registration', e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none text-sm min-h-[80px]"
                        placeholder="ฉันยอมรับ [terms] และ [privacy]"
                    />
                </div>

                {/* Checkout */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        2. หน้าชำระเงิน (Checkout)
                    </label>
                    <textarea 
                        value={consentTexts?.checkout || ''}
                        onChange={(e) => updateConsentText('checkout', e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none text-sm min-h-[80px]"
                        placeholder="ข้าพเจ้าได้อ่านและยอมรับ [terms] และ [privacy] ของบริษัทแล้ว"
                    />
                </div>

                {/* Scanner */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        3. แจ้งเตือนในหน้า Hardware Scanner
                    </label>
                    <textarea 
                        value={consentTexts?.scanner || ''}
                        onChange={(e) => updateConsentText('scanner', e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none text-sm min-h-[140px]"
                        placeholder="อธิบายการทำงานและชี้แจงการเก็บข้อมูล..."
                    />
                </div>
            </div>
        </div>
    );
}
