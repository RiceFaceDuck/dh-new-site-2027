import React from 'react';
import { useCookieConsent } from '../../../hooks/useCookieConsent';
import { parseConsentText } from '../../../utils/textParser';

const CheckoutSummaryActions = ({
  isTermsAccepted,
  setIsTermsAccepted,
  isSubmitting,
  btnState,
  countdown,
  handlePlaceOrderClick,
  onRequestWholesale,
}) => {
  const { config } = useCookieConsent();

  return (
    <>
      <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="flex items-center h-5">
            <input 
              id="terms-checkbox"
              type="checkbox" 
              checked={isTermsAccepted}
              onChange={(e) => setIsTermsAccepted(e.target.checked)}
              className="w-5 h-5 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
          <div className="text-sm">
            {config?.consentTexts?.checkout 
              ? parseConsentText(config.consentTexts.checkout, undefined, config?.policyLinks?.privacyPolicyUrl)
              : parseConsentText("ข้าพเจ้าได้อ่านและยอมรับ [terms] และ [privacy] ของบริษัทแล้ว")}
          </div>
        </label>
      </div>

      <div className="space-y-3">
        <button
          id="place-order-btn"
          onClick={handlePlaceOrderClick}
          disabled={!isTermsAccepted || isSubmitting}
          className={`w-full py-4 px-4 rounded-xl text-white font-bold text-base transition-all duration-200 flex items-center justify-center gap-2
            ${isSubmitting || btnState === 'checking'
              ? 'bg-indigo-400 cursor-not-allowed' 
              : btnState === 'missing_slip'
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.98]'
            }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              กำลังดำเนินการ...
            </>
          ) : btnState === 'checking' ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              กำลังตรวจ
            </>
          ) : btnState === 'missing_slip' ? (
            <>
              ยังไม่ได้รับ สลิปโอน {countdown > 0 ? `(${countdown})` : ''}
            </>
          ) : (
            <>
              สั่งสินค้าทันที
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </>
          )}
        </button>

        <button
          onClick={onRequestWholesale}
          disabled={!isTermsAccepted || isSubmitting}
          className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 border-2
            ${(!isTermsAccepted || isSubmitting)
              ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
              : 'border-gray-200 text-gray-700 bg-white hover:border-indigo-600 hover:text-indigo-600 active:scale-[0.98]'
            }`}
        >
          ฉันเป็นร้านช่าง ต้องการ ราคาส่ง
        </button>
      </div>
    </>
  );
};

export default CheckoutSummaryActions;
