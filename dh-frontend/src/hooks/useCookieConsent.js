import { useState, useEffect } from 'react';
import { privacyCookiesClientService } from '../firebase/privacyCookiesClientService';

const LOCAL_STORAGE_KEY = 'dh_cookie_consent';

export function useCookieConsent() {
  const [config, setConfig] = useState(null);
  const [consentStatus, setConsentStatus] = useState(null); // null = unknown, 'accepted' = user made a choice
  const [userPreferences, setUserPreferences] = useState({});
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      
      // 1. Load config from Firebase (or cache)
      const fetchedConfig = await privacyCookiesClientService.getConfig();
      setConfig(fetchedConfig);

      // 2. Load user consent from local storage
      const savedConsent = localStorage.getItem(LOCAL_STORAGE_KEY);
      
      if (savedConsent) {
        try {
          const parsed = JSON.parse(savedConsent);
          setConsentStatus('accepted');
          setUserPreferences(parsed.preferences || {});
          setIsBannerVisible(false);
        } catch (e) {
          console.error("Error parsing cookie consent", e);
          setIsBannerVisible(true);
        }
      } else {
        // No consent found, need to show banner
        setConsentStatus(null);
        
        // Initialize default preferences based on config
        const defaults = {};
        if (fetchedConfig && fetchedConfig.cookieTypes) {
          fetchedConfig.cookieTypes.forEach(type => {
            defaults[type.id] = type.isMandatory || type.defaultEnabled;
          });
        }
        setUserPreferences(defaults);
        
        // Small delay before showing banner for better UX
        setTimeout(() => setIsBannerVisible(true), 1500);
      }
      
      setIsLoading(false);
    }
    
    init();
  }, []);

  const acceptAll = () => {
    if (!config) return;
    
    const allAccepted = {};
    config.cookieTypes.forEach(type => {
      allAccepted[type.id] = true;
    });
    
    saveConsent(allAccepted);
  };

  const savePreferences = (preferences) => {
    saveConsent(preferences);
  };

  const saveConsent = (preferences) => {
    const consentData = {
      timestamp: new Date().toISOString(),
      preferences: preferences,
      version: '1.0' // Can be used to prompt again if policy changes significantly
    };
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(consentData));
    setUserPreferences(preferences);
    setConsentStatus('accepted');
    setIsBannerVisible(false);
    
    // Optional: trigger event for analytics or other scripts that rely on cookies
    window.dispatchEvent(new CustomEvent('dh_cookie_consent_updated', { detail: preferences }));
  };

  return {
    config,
    isLoading,
    isBannerVisible,
    consentStatus,
    userPreferences,
    acceptAll,
    savePreferences,
    setIsBannerVisible
  };
}
