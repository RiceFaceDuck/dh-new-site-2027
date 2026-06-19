import React from 'react';

export default function ContactInfoSection({ footerConfig, handleCompanyChange }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Brand & Contact Info</h3>
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Logo URL</label>
                    <input type="text" value={footerConfig.company.logoUrl} onChange={(e) => handleCompanyChange('logoUrl', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Description</label>
                    <textarea value={footerConfig.company.description} onChange={(e) => handleCompanyChange('description', e.target.value)} rows={3}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Address</label>
                    <input type="text" value={footerConfig.company.address} onChange={(e) => handleCompanyChange('address', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Line ID</label>
                        <input type="text" value={footerConfig.company.lineId || ''} onChange={(e) => handleCompanyChange('lineId', e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Phone</label>
                        <input type="text" value={footerConfig.company.phone || ''} onChange={(e) => handleCompanyChange('phone', e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Line Add Friend URL</label>
                    <input type="text" value={footerConfig.company.lineAddFriendUrl || ''} onChange={(e) => handleCompanyChange('lineAddFriendUrl', e.target.value)} placeholder="https://line.me/ti/p/..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors" />
                </div>
            </div>
        </div>
    );
}
