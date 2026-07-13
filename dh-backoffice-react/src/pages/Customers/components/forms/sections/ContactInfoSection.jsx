import { Phone, Mail, MessageCircle, Facebook, MessageSquare, Youtube, Globe, Link2 } from 'lucide-react';

export default function ContactInfoSection({ formData, handleChange }) {
    return (
        <div className="space-y-6">
            {/* 1. ข้อมูลการติดต่อหลัก */}
            <div>
                <h3 className="text-sm font-bold text-dh-accent mb-3 flex items-center gap-2 border-b border-dh-border pb-2">
                    <Phone size={16} /> ข้อมูลการติดต่อ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-dh-muted">ชื่อผู้ติดต่อ</label>
                        <input 
                            type="text" 
                            placeholder="ชื่อผู้ติดต่อหลัก" 
                            className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                            value={formData.contactName || ''} 
                            onChange={e => handleChange('contactName', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-dh-muted">เบอร์โทรศัพท์</label>
                        <input 
                            type="tel" 
                            placeholder="เช่น 0812345678" 
                            className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                            value={formData.phone || ''} 
                            onChange={e => handleChange('phone', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-dh-muted flex items-center gap-1">
                            <Mail size={12}/> อีเมล
                        </label>
                        <input 
                            type="email" 
                            placeholder="email@example.com" 
                            className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                            value={formData.email || ''} 
                            onChange={e => handleChange('email', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* 2. ช่องทางออนไลน์ (Social Media) */}
            <div>
                <h3 className="text-sm font-bold text-dh-accent mb-3 flex items-center gap-2 border-b border-dh-border pb-2">
                    <MessageCircle size={16} /> ช่องทางออนไลน์ (Social Media)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-dh-muted flex items-center gap-1.5">
                            <MessageCircle size={12} className="text-green-500" /> Line ID
                        </label>
                        <input 
                            type="text" 
                            placeholder="@dhnotebook" 
                            className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                            value={formData.lineId || ''} 
                            onChange={e => handleChange('lineId', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-dh-muted flex items-center gap-1.5">
                            <Facebook size={12} className="text-blue-600" /> Facebook
                        </label>
                        <input 
                            type="text" 
                            placeholder="ลิงก์ Facebook Page" 
                            className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                            value={formData.facebookUrl || ''} 
                            onChange={e => handleChange('facebookUrl', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-dh-muted flex items-center gap-1.5">
                            <MessageSquare size={12} className="text-blue-500" /> Messenger
                        </label>
                        <input 
                            type="text" 
                            placeholder="ลิงก์ m.me/..." 
                            className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                            value={formData.messengerUrl || ''} 
                            onChange={e => handleChange('messengerUrl', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-dh-muted flex items-center gap-1.5">
                            <Youtube size={12} className="text-red-500" /> YouTube
                        </label>
                        <input 
                            type="text" 
                            placeholder="ลิงก์ YouTube Channel" 
                            className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                            value={formData.youtubeUrl || ''} 
                            onChange={e => handleChange('youtubeUrl', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-dh-muted flex items-center gap-1.5">
                            <Globe size={12} className="text-slate-500" /> Website
                        </label>
                        <input 
                            type="text" 
                            placeholder="https://..." 
                            className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                            value={formData.storeWebsite || ''} 
                            onChange={e => handleChange('storeWebsite', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-dh-muted flex items-center gap-1.5">
                            <Link2 size={12} className="text-slate-500" /> อื่นๆ (Other)
                        </label>
                        <input 
                            type="text" 
                            placeholder="ช่องทางติดต่ออื่นๆ" 
                            className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                            value={formData.otherSocial || ''} 
                            onChange={e => handleChange('otherSocial', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
