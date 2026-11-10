import { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { Plus, CheckCircle2, ShieldAlert, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { productKnowledgeService } from '../../firebase/productKnowledgeService';

function ExpandableBadgeList({ items = [], emptyText = "ยังไม่มีข้อมูล" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);

  // ขีดจำกัด 8 บรรทัด:
  // ความสูงแท็ก (~30px) + ระยะห่าง gap-2 (8px) = ~38px ต่อบรรทัด โดย 8 บรรทัด ≈ 304px - 315px
  const COLLAPSED_MAX_HEIGHT = 315;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const checkOverflow = () => {
      if (el) {
        setHasOverflow(el.scrollHeight > COLLAPSED_MAX_HEIGHT + 10);
      }
    };

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  // เมื่อกางออก แล้วผู้ใช้คลิกที่อื่นบนหน้าจอ ให้ย่อหุบกลับอัตโนมัติ
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isExpanded]);

  const handleToggle = () => {
    if (isExpanded && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    setIsExpanded(!isExpanded);
  };

  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-400 italic">{emptyText}</p>;
  }

  return (
    <div ref={wrapperRef} className="space-y-2">
      <div 
        ref={containerRef}
        style={{
          maxHeight: isExpanded ? 'none' : (hasOverflow ? `${COLLAPSED_MAX_HEIGHT}px` : 'none')
        }}
        className="relative overflow-hidden transition-all duration-300 ease-in-out"
      >
        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => (
            <span 
              key={idx} 
              className="bg-white shadow-xs text-slate-600 font-normal px-3 py-1 rounded-[2px] text-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {hasOverflow && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={handleToggle}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-normal text-blue-700 bg-blue-100 hover:bg-blue-200 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            {isExpanded ? (
              <>
                <span>ย่อข้อมูล</span>
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                <span>แสดงทั้งหมด</span>
                <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

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
    <div className="bg-slate-50/70 rounded-[2px] border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] overflow-hidden mt-2">
      <style>{`
        @keyframes headingAmbientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

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
          <div className="flex items-center justify-between mb-5">
            <h4 
              className="text-xl font-normal text-slate-900 inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-[4px] shadow-sm"
              style={{
                background: 'linear-gradient(120deg, #e2e8f0, #cbd5e1, #d8e1ea, #e2e8f0)',
                backgroundSize: '250% 250%',
                animation: 'headingAmbientFlow 12s ease infinite'
              }}
            >
              <Layers size={22} className="text-slate-600" /> Compatible Models
            </h4>
            <button 
              onClick={() => setShowForm(showForm === 'models' ? null : 'models')}
              className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 h-8 rounded-full flex items-center transition-all duration-500 overflow-hidden shadow-xs border border-blue-100"
            >
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <Plus size={16} strokeWidth={3} />
              </div>
              <div className={`whitespace-nowrap transition-all duration-500 ease-in-out ${showTooltip ? 'max-w-[200px] pr-3 opacity-100' : 'max-w-0 pr-0 opacity-0'}`}>
                แนะนำเรา +{creditReward} credit
              </div>
            </button>
          </div>
          
          <ExpandableBadgeList 
            items={modelsList} 
            emptyText="ยังไม่มีข้อมูลรุ่นที่รองรับ" 
          />

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
                className="flex-1 border border-slate-300 rounded-[2px] px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
          <div className="flex items-center justify-between mb-5">
            <h4 
              className="text-xl font-normal text-slate-900 inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-[4px] shadow-sm"
              style={{
                background: 'linear-gradient(120deg, #e2e8f0, #cbd5e1, #d8e1ea, #e2e8f0)',
                backgroundSize: '250% 250%',
                animation: 'headingAmbientFlow 12s ease infinite'
              }}
            >
              <Layers size={22} className="text-slate-600" /> Compatible Part Number
            </h4>
            <button 
              onClick={() => setShowForm(showForm === 'parts' ? null : 'parts')}
              className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 h-8 rounded-full flex items-center transition-all duration-500 overflow-hidden shadow-xs border border-blue-100"
            >
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <Plus size={16} strokeWidth={3} />
              </div>
              <div className={`whitespace-nowrap transition-all duration-500 ease-in-out ${showTooltip ? 'max-w-[200px] pr-3 opacity-100' : 'max-w-0 pr-0 opacity-0'}`}>
                แนะนำเรา +{creditReward} credit
              </div>
            </button>
          </div>
          
          <ExpandableBadgeList 
            items={partsList} 
            emptyText="ยังไม่มีข้อมูลรหัสพาร์ทที่รองรับ" 
          />

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
                className="flex-1 border border-slate-300 rounded-[2px] px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
