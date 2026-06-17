import React from 'react';

export default function TrustBadges() {
  return (
    <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
        <span className="flex-shrink-0 bg-green-100 p-1.5 rounded-full text-green-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </span>
        <span>ข้อมูลทั้งหมดถูกเข้ารหัส 256-bit อย่างปลอดภัย</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span className="flex-shrink-0 bg-indigo-100 p-1.5 rounded-full text-indigo-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </span>
        <span>รับประกันสินค้าคุณภาพโดย DH Notebook</span>
      </div>
    </div>
  );
}
