import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle2, ShieldCheck, Loader2 
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { auth } from '../../firebase/config';
import { userService } from '../../firebase/userService';
import TaxTypeSelector from './tax-invoice/TaxTypeSelector';
import TaxFormFields from './tax-invoice/TaxFormFields';

export default function TaxInvoiceForm() {
  const { checkoutState, updateCheckoutConfig } = useCart();
  
  const [requestTax, setRequestTax] = useState(checkoutState?.requestTax || false);
  const [taxInfo, setTaxInfo] = useState(checkoutState?.taxInfo || {
    type: 'company',
    name: '',
    taxId: '',
    address: '',
    isHeadOffice: true,
    branchCode: ''
  });

  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

  useEffect(() => {
    const fetchSecureTaxInfo = async () => {
      if (requestTax && auth.currentUser && !checkoutState?.taxInfo?.name) {
        setIsFetchingInfo(true);
        try {
          const secureData = await userService.getPrivateTaxInfo(auth.currentUser.uid);
          if (secureData && secureData.taxId) {
            setTaxInfo(prev => ({
              ...prev,
              type: secureData.type || 'company',
              name: secureData.name || '',
              taxId: secureData.taxId || '',
              address: secureData.address || '',
              isHeadOffice: secureData.isHeadOffice ?? true,
              branchCode: secureData.branchCode || ''
            }));
          }
        } catch (error) {
          console.error("Error auto-filling secure tax info:", error);
        } finally {
          setIsFetchingInfo(false);
        }
      }
    };

    fetchSecureTaxInfo();
  }, [requestTax, checkoutState?.taxInfo?.name]);

  const isComplete = 
    taxInfo.name.length > 2 && 
    taxInfo.taxId.length === 13 && 
    taxInfo.address.length > 10 &&
    (taxInfo.type === 'personal' || taxInfo.isHeadOffice || taxInfo.branchCode.length >= 4);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateCheckoutConfig({ requestTax, taxInfo });
    }, 300);
    return () => clearTimeout(timer);
  }, [requestTax, taxInfo, updateCheckoutConfig]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'taxId' && value && !/^\d{0,13}$/.test(value)) return;
    if (name === 'branchCode' && value && !/^\d{0,5}$/.test(value)) return;

    setTaxInfo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 relative overflow-hidden transition-all duration-300">
      
      <div className={`flex items-center justify-between transition-all duration-300 ${requestTax ? 'mb-6 pb-4 border-b border-slate-100' : ''}`}>
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className={`p-2 rounded-xl transition-colors duration-300 ${requestTax ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
              <FileText className="w-5 h-5" />
            </div>
            ต้องการใบกำกับภาษีเต็มรูปแบบ
          </h2>
          <p className={`text-xs mt-1 transition-colors duration-300 ${requestTax ? 'text-indigo-500 font-medium' : 'text-slate-400'}`}>
            สำหรับเบิกจ่ายบริษัท หรือลดหย่อนภาษี
          </p>
        </div>
        
        <button
          type="button"
          onClick={() => setRequestTax(!requestTax)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
            requestTax ? 'bg-indigo-600' : 'bg-slate-300'
          }`}
        >
          <span className="sr-only">Toggle Tax Invoice</span>
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${
              requestTax ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className={`grid transition-all duration-500 ease-in-out ${requestTax ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          
          {isFetchingInfo ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
              <p className="text-sm font-medium">กำลังดึงข้อมูลผู้เสียภาษี...</p>
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              
              <TaxTypeSelector type={taxInfo.type} onChange={handleChange} />
              
              <TaxFormFields taxInfo={taxInfo} handleChange={handleChange} />

              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  ข้อมูลส่วนนี้จะถูกส่งเข้าระบบบัญชีโดยตรง
                </div>

                {isComplete && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 animate-in fade-in duration-300">
                    <CheckCircle2 className="w-4 h-4" />
                    พร้อมออกใบกำกับภาษี
                  </span>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}