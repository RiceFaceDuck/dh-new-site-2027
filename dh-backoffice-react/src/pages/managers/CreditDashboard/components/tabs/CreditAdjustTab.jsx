import React, { useState } from 'react';
import { auth } from '../../../../../firebase/config';
import { creditCoreService } from '../../../../../firebase/creditCoreService';

export default function CreditAdjustTab({ onSubmitTransaction, isSubmitting = false }) {
  const [partnerId, setPartnerId] = useState('');
  const [amount, setAmount] = useState('');
  const [actionType, setActionType] = useState('add'); 
  const [remark, setRemark] = useState('');

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setAmount(val);
  };

  const addQuickAmount = (val) => {
    const current = parseInt(amount || '0', 10);
    setAmount((current + val).toString());
  };

  const isFormValid = partnerId.trim() !== '' && parseInt(amount || '0', 10) > 0 && remark.trim() !== '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    
    const uid = auth.currentUser?.uid || 'Admin';
    const numAmt = parseInt(amount, 10);
    const dbType = actionType === 'add' ? 'deposit' : 'deduct';
    
    onSubmitTransaction && onSubmitTransaction(
      async () => await creditCoreService.adjustUserCredit(partnerId, numAmt, dbType, remark, uid),
      `ทำรายการ ${actionType === 'add' ? 'เพิ่ม' : 'หัก'}เครดิต ${numAmt.toLocaleString('th-TH')} บาท สำเร็จ`
    );
  };

  const numAmount = parseInt(amount || '0', 10);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      
      {/* แบบฟอร์ม ฝั่งซ้าย: ทรงเหลี่ยม ชิด ขอบบาง */}
      <div className="md:col-span-7">
        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Transaction Entry</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Account ID (รหัส/เบอร์โทร)</label>
            <input 
              type="text" 
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Operation Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActionType('add')}
                className={`flex-1 py-2 text-sm font-semibold border rounded-sm ${actionType === 'add' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-300 text-slate-600'}`}
              >
                Add Credit
              </button>
              <button
                type="button"
                onClick={() => setActionType('deduct')}
                className={`flex-1 py-2 text-sm font-semibold border rounded-sm ${actionType === 'deduct' ? 'bg-red-50 border-red-600 text-red-700' : 'bg-white border-slate-300 text-slate-600'}`}
              >
                Deduct Credit
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (THB)</label>
            <input 
              type="text" 
              value={amount ? parseInt(amount, 10).toLocaleString('th-TH') : ''}
              onChange={handleAmountChange}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm text-lg font-bold text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              required
            />
            <div className="flex gap-2 mt-2">
              {[1000, 5000, 10000].map(val => (
                <button key={val} type="button" onClick={() => addQuickAmount(val)} className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-sm hover:bg-slate-200">
                  +{val.toLocaleString('th-TH')}
                </button>
              ))}
              <button type="button" onClick={() => setAmount('')} className="px-2 py-1 text-slate-500 text-xs ml-auto hover:text-slate-800">Clear</button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remark</label>
            <textarea 
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none h-16 resize-none"
              required
            />
          </div>
        </form>
      </div>

      {/* สรุปรายการ ฝั่งขวา: เป็นกล่องข้อมูลธรรมดา ใช้พื้นที่คุ้มค่า */}
      <div className="md:col-span-5">
        <div className="bg-slate-50 border border-slate-300 rounded-sm p-4 h-full flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Preview</h3>
          
          <div className="space-y-3 text-sm flex-1">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Account:</span>
              <span className="font-semibold text-slate-800">{partnerId || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Current Balance:</span>
              <span className="font-mono text-slate-600">--</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Operation:</span>
              <span className={`font-mono font-bold ${actionType === 'add' ? 'text-blue-600' : 'text-red-600'}`}>
                {actionType === 'add' ? '+' : '-'} {numAmount.toLocaleString('th-TH')}
              </span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-2.5 mt-4 rounded-sm font-bold text-sm transition-none
              ${!isFormValid || isSubmitting
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            {isSubmitting ? 'Processing...' : 'Confirm Transaction'}
          </button>
        </div>
      </div>

    </div>
  );
}