import React, { useState, useEffect } from 'react';
import { useCookieConsent } from '../../hooks/useCookieConsent';
import { ShieldCheck, X, Settings2, Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CookieConsentBanner() {
  const { 
    config, 
    isLoading, 
    isBannerVisible, 
    userPreferences, 
    acceptAll, 
    savePreferences,
    setIsBannerVisible
  } = useCookieConsent();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempPreferences, setTempPreferences] = useState({});

  useEffect(() => {
    if (userPreferences) {
      setTempPreferences(userPreferences);
    }
  }, [userPreferences]);

  if (isLoading || !config || !isBannerVisible) return null;

  const handleToggle = (id, isMandatory) => {
    if (isMandatory) return; // Cannot toggle mandatory cookies
    
    setTempPreferences(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSaveSettings = () => {
    savePreferences(tempPreferences);
    setIsSettingsOpen(false);
  };

  return (
    <>
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
        <div className="max-w-6xl mx-auto bg-[#0f172a]/95 backdrop-blur-xl rounded-2xl shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.3)] border border-white/10 p-5 sm:p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between pointer-events-auto transform transition-all duration-500 translate-y-0">
          
          <div className="flex gap-4 sm:gap-6 items-start flex-1">
            {config.logoUrl && (
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="text-blue-400 w-5 h-5" />
                <h3 className="font-bold text-white text-base sm:text-lg">การตั้งค่าคุกกี้และข้อมูลส่วนบุคคล</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                {config.bannerText}
                {' '}
                <Link to={config.policyLinks?.privacyPolicyUrl || '/privacy-policy'} className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2">
                  นโยบายความเป็นส่วนตัว
                </Link>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="px-6 py-2.5 rounded-xl border-2 border-slate-600 text-slate-300 font-bold hover:bg-white/10 hover:border-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
            >
              <Settings2 size={16} /> ตั้งค่าคุกกี้
            </button>
            <button 
              onClick={acceptAll}
              className="px-6 py-2.5 rounded-xl bg-[#0870B8] text-white font-bold hover:bg-[#0A85D9] shadow-md hover:shadow-lg hover:shadow-[#0870B8]/20 transition-all flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
            >
              <Check size={16} /> ยอมรับทั้งหมด
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setIsSettingsOpen(false)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Settings2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">การตั้งค่าคุกกี้</h2>
                  <p className="text-xs text-slate-500">จัดการสิทธิ์การเข้าถึงข้อมูลส่วนบุคคลของคุณ</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {config.cookieTypes?.map((type) => (
                <div key={type.id} className="flex gap-4 items-start pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="pt-1 flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-800">{type.name}</h4>
                      
                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggle(type.id, type.isMandatory)}
                        disabled={type.isMandatory}
                        className={`
                          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
                          ${tempPreferences[type.id] ? 'bg-blue-600' : 'bg-slate-200'}
                          ${type.isMandatory ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <span className="sr-only">Toggle {type.name}</span>
                        <span
                          className={`
                            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                            ${tempPreferences[type.id] ? 'translate-x-5' : 'translate-x-0'}
                          `}
                        />
                      </button>
                    </div>
                    <p className="text-sm text-slate-600">{type.description}</p>
                    {type.isMandatory && (
                      <span className="inline-block mt-2 text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded">
                        จำเป็นเสมอ (Always Active)
                      </span>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-4 flex flex-wrap gap-4 text-sm font-medium">
                <Link to={config.policyLinks?.privacyPolicyUrl || '/privacy-policy'} className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  นโยบายความเป็นส่วนตัว <ExternalLink size={14} />
                </Link>
                <Link to={config.policyLinks?.cookiePolicyUrl || '/cookie-policy'} className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  นโยบายคุกกี้ <ExternalLink size={14} />
                </Link>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3">
              <button 
                onClick={acceptAll}
                className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors w-full sm:w-auto"
              >
                ยอมรับทั้งหมด
              </button>
              <button 
                onClick={handleSaveSettings}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md transition-colors w-full sm:w-auto"
              >
                บันทึกการตั้งค่า
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
