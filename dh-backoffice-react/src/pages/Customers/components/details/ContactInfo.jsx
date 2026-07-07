import React from 'react';
import { Phone, Mail, MessageCircle, Facebook, MessageSquare, Youtube, Globe, Link2, Copy, CheckCircle2 } from 'lucide-react';

export default function ContactInfo({ customer, handleCopy, copiedField }) {
  // ฟังก์ชันช่วยสร้าง UI ของ Social Media
  const renderSocialLink = (icon, label, value, type) => {
    const isEmpty = !value;
    const isUrl = value && value.startsWith('http');
    const displayValue = value ? value : '-';
    
    return (
      <div className={`bg-slate-50 p-2.5 rounded-xl border flex items-center justify-between group relative overflow-hidden ${isEmpty ? 'border-slate-100/50 opacity-70' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2.5 min-w-0 pr-6">
          <div className={`shrink-0 transition-colors ${isEmpty ? 'text-slate-300 grayscale' : ''}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
            {isUrl ? (
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 truncate block hover:underline" title={value}>
                {value.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            ) : (
              <p className={`text-xs font-medium truncate block ${isEmpty ? 'text-slate-400' : 'text-slate-700'}`} title={displayValue}>{displayValue}</p>
            )}
          </div>
        </div>
        
        {value && handleCopy && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              handleCopy(value, type);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 bg-white shadow-xs border border-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
            title={`คัดลอก ${label}`}
          >
            {copiedField === type ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* ข้อมูลติดต่อพื้นฐาน */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> ข้อมูลติดต่อ
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className={`bg-slate-50 p-2.5 rounded-xl border relative group flex items-center gap-2.5 ${!customer.phone && !customer.phoneNumber ? 'border-slate-100/50 opacity-70' : 'border-slate-200'}`}>
            <Phone size={14} className={(!customer.phone && !customer.phoneNumber) ? 'text-slate-300' : 'text-slate-500'}/>
            <div className="min-w-0">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">เบอร์โทรศัพท์</p>
              <p className={`text-xs font-medium truncate ${(!customer.phone && !customer.phoneNumber) ? 'text-slate-400' : 'text-slate-800'}`}>
                {customer.phoneNumber || customer.phone || '-'}
              </p>
            </div>
            {(customer.phoneNumber || customer.phone) && handleCopy && (
              <button 
                onClick={() => handleCopy(customer.phoneNumber || customer.phone, 'phone')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-600 bg-white shadow-xs border border-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                title="คัดลอกเบอร์โทร"
              >
                {copiedField === 'phone' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            )}
          </div>
          <div className={`bg-slate-50 p-2.5 rounded-xl border relative group flex items-center gap-2.5 ${!customer.email ? 'border-slate-100/50 opacity-70' : 'border-slate-200'}`}>
            <Mail size={14} className={!customer.email ? 'text-slate-300' : 'text-slate-500'}/>
            <div className="min-w-0 pr-6">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">อีเมล</p>
              <p className={`text-xs font-medium truncate ${!customer.email ? 'text-slate-400' : 'text-slate-800'}`} title={customer.email}>
                {customer.email || '-'}
              </p>
            </div>
            {customer.email && handleCopy && (
              <button 
                onClick={() => handleCopy(customer.email, 'email')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-600 bg-white shadow-xs border border-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                title="คัดลอกอีเมล"
              >
                {copiedField === 'email' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ช่องทางติดต่ออื่นๆ (Social Media) */}
      <div className="pt-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> ช่องทางออนไลน์
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {renderSocialLink(<MessageCircle size={14} className="text-green-500" />, 'Line ID', customer.lineId, 'lineId')}
          {renderSocialLink(<Facebook size={14} className="text-blue-600" />, 'Facebook', customer.facebookUrl, 'facebookUrl')}
          {renderSocialLink(<MessageSquare size={14} className="text-blue-500" />, 'Messenger', customer.messengerUrl, 'messengerUrl')}
          {renderSocialLink(<Youtube size={14} className="text-red-500" />, 'YouTube', customer.youtubeUrl, 'youtubeUrl')}
          {renderSocialLink(<Globe size={14} className="text-slate-500" />, 'Website', customer.storeWebsite, 'storeWebsite')}
          {renderSocialLink(<Link2 size={14} className="text-slate-500" />, 'Other', customer.otherSocial, 'otherSocial')}
        </div>
      </div>
    </div>
  );
}
