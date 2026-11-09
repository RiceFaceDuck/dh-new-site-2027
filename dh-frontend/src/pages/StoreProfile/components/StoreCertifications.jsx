import React from 'react';

const StoreCertifications = ({ partner = {} }) => {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-[2px] shadow-xs border border-slate-100 p-6 md:p-8">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        การรับรองระบบ
      </h3>
      <ul className="space-y-3">
        <li className="flex items-start">
          <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-slate-600">ยืนยันตัวตนกับระบบแล้ว</span>
        </li>
        {Number(partner.points || 0) > 0 && (
          <li className="flex items-start">
            <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-slate-600">ช่างเครดิตดีเยี่ยม</span>
          </li>
        )}
      </ul>
    </div>
  );
};

export default React.memo(StoreCertifications);
