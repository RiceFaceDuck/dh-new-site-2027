import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { Plus, CheckCircle2, ShieldAlert, BookOpen, Layers } from 'lucide-react';
import { productKnowledgeService } from '../../firebase/productKnowledgeService';

export default function ProductKnowledgeSection({ 
  product, 
  compatibleModels = [], 
  compatiblePartNumbers = [] 
}) {
  const [creditReward, setCreditReward] = useState(2);
  const [showForm, setShowForm] = useState(null); // 'models' or 'parts'
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    let timeout;
    const cycleTooltip = () => {
      setShowTooltip(true);
      timeout = setTimeout(() => {
        setShowTooltip(false);
        timeout = setTimeout(cycleTooltip, 20000);
      }, 3000);
    };
    cycleTooltip();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      const reward = await productKnowledgeService.getKnowledgeCreditConfig();
      setCreditReward(reward);
    };
    fetchConfig();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setAlertMessage({ type: 'error', text: 'กรุณาเข้าสู่ระบบก่อนเพิ่มความรู้' });
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      await productKnowledgeService.submitKnowledgeApproval({
        productId: product.id,
        productName: product.name || product.id,
        userId: user.uid,
        userName: user.displayName || user.email || 'ไม่ระบุชื่อ',
        fieldType: showForm === 'models' ? 'compatibleModels' : 'compatiblePartNumbers',
        suggestedValue: inputValue.trim(),
        creditReward: creditReward
      });

      setAlertMessage({ type: 'success', text: 'ส่งข้อมูลเรียบร้อยแล้ว รอผู้จัดการตรวจสอบ!' });
      setInputValue('');
      setShowForm(null);
    } catch (err) {
      console.error(err);
      setAlertMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการส่งข้อมูล' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  const parseArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') return data.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  const modelsList = parseArray(compatibleModels);
  const partsList = parseArray(compatiblePartNumbers);

  return (
    <div className="bg-slate-50 rounded-2xl shadow-md border border-slate-300 overflow-hidden mt-2">

      {alertMessage && (
        <div className={`m-6 px-4 py-3 rounded-md flex items-center gap-2 text-sm font-medium ${
          alertMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {alertMessage.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
          {alertMessage.text}
        </div>
      )}

      <div className="p-6 md:p-8 space-y-8">
        {/* Compatible Models */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Layers size={16} className="text-slate-400" /> Compatible Models
            </h4>
            <button 
              onClick={() => setShowForm(showForm === 'models' ? null : 'models')}
              className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 h-8 rounded-full flex items-center transition-all duration-500 overflow-hidden shadow-sm border border-blue-100"
            >
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <Plus size={16} strokeWidth={3} />
              </div>
              <div className={`whitespace-nowrap transition-all duration-500 ease-in-out ${showTooltip ? 'max-w-[200px] pr-3 opacity-100' : 'max-w-0 pr-0 opacity-0'}`}>
                แนะนำเรา +{creditReward} credit
              </div>
            </button>
          </div>
          
          {modelsList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {modelsList.map((model, idx) => (
                <span key={idx} className="bg-white border border-slate-300 shadow-sm text-slate-700 font-medium px-3 py-1 rounded-md text-sm">
                  {model}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">ยังไม่มีข้อมูลรุ่นที่รองรับ</p>
          )}

          {showForm === 'models' && (
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2 animate-in slide-in-from-top-2">
              <input 
                autoFocus
                type="text" 
                placeholder="ระบุรุ่นเครื่องที่รองรับ (เช่น Acer Swift 3)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={(e) => {
                  if (!e.relatedTarget || e.relatedTarget.type !== 'submit') {
                    if (!inputValue.trim()) setShowForm(null);
                  }
                }}
                className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                required
              />
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'กำลังส่ง...' : 'ส่งข้อมูล'}
              </button>
            </form>
          )}
        </div>

        {/* Compatible Part Numbers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Layers size={16} className="text-slate-400" /> Compatible Part Number
            </h4>
            <button 
              onClick={() => setShowForm(showForm === 'parts' ? null : 'parts')}
              className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 h-8 rounded-full flex items-center transition-all duration-500 overflow-hidden shadow-sm border border-blue-100"
            >
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <Plus size={16} strokeWidth={3} />
              </div>
              <div className={`whitespace-nowrap transition-all duration-500 ease-in-out ${showTooltip ? 'max-w-[200px] pr-3 opacity-100' : 'max-w-0 pr-0 opacity-0'}`}>
                แนะนำเรา +{creditReward} credit
              </div>
            </button>
          </div>
          
          {partsList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {partsList.map((part, idx) => (
                <span key={idx} className="bg-white border border-slate-300 shadow-sm text-slate-700 font-medium px-3 py-1 rounded-md text-sm">
                  {part}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">ยังไม่มีข้อมูลรหัสพาร์ทที่รองรับ</p>
          )}

          {showForm === 'parts' && (
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2 animate-in slide-in-from-top-2">
              <input 
                autoFocus
                type="text" 
                placeholder="ระบุรหัสพาร์ทที่ใช้งานร่วมได้ (เช่น AP12345)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={(e) => {
                  if (!e.relatedTarget || e.relatedTarget.type !== 'submit') {
                    if (!inputValue.trim()) setShowForm(null);
                  }
                }}
                className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                required
              />
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'กำลังส่ง...' : 'ส่งข้อมูล'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
