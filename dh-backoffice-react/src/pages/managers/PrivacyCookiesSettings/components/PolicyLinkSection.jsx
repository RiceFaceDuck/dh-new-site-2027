import React from 'react';
import { Link2 } from 'lucide-react';

export default function PolicyLinkSection({ policyLinks, updatePolicyLink }) {
    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Link2 size={18} className="text-purple-500" />
                การจัดการลิงก์นโยบาย (Policy Links)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">ลิงก์ นโยบายความเป็นส่วนตัว</label>
                    <input 
                        type="text" 
                        value={policyLinks.privacyPolicyUrl}
                        onChange={(e) => updatePolicyLink('privacyPolicyUrl', e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow outline-none text-sm"
                        placeholder="เช่น /privacy-policy หรือ https://..."
                    />
                </div>
                
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">ลิงก์ นโยบายคุกกี้</label>
                    <input 
                        type="text" 
                        value={policyLinks.cookiePolicyUrl}
                        onChange={(e) => updatePolicyLink('cookiePolicyUrl', e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow outline-none text-sm"
                        placeholder="เช่น /cookie-policy หรือ https://..."
                    />
                </div>
            </div>
            <p className="text-xs text-slate-500">
                * หากเป็นการเชื่อมโยงภายในเว็บไซต์เดียวกัน สามารถใส่แค่ Path เช่น `/privacy-policy` ได้
            </p>
        </div>
    );
}
