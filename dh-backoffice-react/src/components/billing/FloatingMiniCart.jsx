import { useState, useEffect } from 'react';
import { ShoppingCart, X, ChevronRight, Store } from 'lucide-react';
import { auth } from '../../firebase/config';
import { safeJsonParse } from 'dh-shared';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRef } from 'react';

export default function FloatingMiniCart() {
  const [isOpen, setIsOpen] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // --- Drag & Drop State ---
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Default position: Middle Right
    setPosition({
      x: window.innerWidth - 80,
      y: window.innerHeight / 2 - 28,
    });
  }, []);

  const handlePointerDown = (e) => {
    // Only drag on left click or touch
    if (e.button && e.button !== 0) return;
    
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { x: position.x, y: position.y };
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    
    // Boundary check
    let newX = elementStartPos.current.x + dx;
    let newY = elementStartPos.current.y + dy;
    
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;
    
    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;
    if (newX > maxX) newX = maxX;
    if (newY > maxY) newY = maxY;

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  // Prevent click from firing if we dragged
  const handleClick = (e) => {
    if (Math.abs(position.x - elementStartPos.current.x) > 5 || 
        Math.abs(position.y - elementStartPos.current.y) > 5) {
      // It was a drag, not a click
      return;
    }
    setIsOpen(!isOpen);
  };

  const loadDrafts = () => {
    const uid = auth?.currentUser?.uid || 'guest';
    const saved = localStorage.getItem(`dh_pos_autosave_${uid}`);
    if (saved) {
      const parsed = safeJsonParse(saved);
      if (Array.isArray(parsed)) {
        // Filter out empty tabs (no items and no customer and no docId)
        const validDrafts = parsed.filter(t => t.items?.length > 0 || t.customer || t.docId);
        setDrafts(validDrafts);
        
        // Auto-select first tab if current activeTabId is not found
        if (validDrafts.length > 0) {
            setDrafts(prev => {
                if (!validDrafts.some(d => d.id === activeTabId)) {
                    setActiveTabId(validDrafts[0].id);
                }
                return validDrafts;
            });
        }
      }
    }
  };

  useEffect(() => {
    loadDrafts();
    const interval = setInterval(loadDrafts, 2000); // Poll for updates from other tabs
    return () => clearInterval(interval);
  }, []);

  // Hide the widget if we are already on the billing page (POS active)
  if (location.pathname.includes('/billing')) {
    return null;
  }

  if (drafts.length === 0) {
    return null; // Hide if no drafts
  }

  const handleResume = (draftId) => {
    setIsOpen(false);
    // Navigate to billing and pass the resumeTab ID in state
    navigate('/billing', { state: { resumeTabId: draftId } });
  };

  if (position.x === -1) return null; // Wait for initial position

  const activeDraft = drafts.find(d => d.id === activeTabId) || drafts[0];

  return (
    <div 
      className="fixed z-[9999] flex flex-col items-end"
      style={{ left: position.x, top: position.y }}
    >
      {isOpen && activeDraft && (
        <div className="absolute right-0 bottom-full mb-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-96 overflow-hidden animate-in zoom-in-95 fade-in duration-200 origin-bottom-right flex flex-col">
          {/* Header */}
          <div className="bg-slate-900 dark:bg-slate-950 p-3 flex justify-between items-center text-white shrink-0">
            <h3 className="font-bold flex items-center gap-2 text-sm">
              <Store size={18} className="text-[#D51C39]" />
              งานค้าง ({drafts.length})
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-slate-800 p-1 rounded-full transition-colors text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Horizontal Tabs */}
          {drafts.length > 1 && (
            <div className="flex overflow-x-auto border-b border-slate-100 dark:border-slate-700 p-2 gap-2 shrink-0 scrollbar-hide bg-slate-50 dark:bg-slate-800/50">
              {drafts.map((draft, idx) => {
                const cName = draft.customer?.accountName || draft.customer?.displayName || draft.customer?.firstName || draft.walkInName || `บิล #${idx + 1}`;
                const isActive = activeTabId === draft.id;
                return (
                  <button 
                    key={draft.id}
                    onClick={() => setActiveTabId(draft.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${isActive ? 'bg-[#D51C39] text-white border-[#D51C39] shadow-sm' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                  >
                    {cName}
                  </button>
                );
              })}
            </div>
          )}
          
          {/* Cart Details - Vertical Layout */}
          <div className="p-4 flex-1 overflow-y-auto max-h-96">
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">รายการสินค้า</h4>
              {(!activeDraft.items || activeDraft.items.length === 0) ? (
                <p className="text-sm text-slate-500 italic text-center py-4">ยังไม่มีสินค้าในตะกร้า</p>
              ) : (
                activeDraft.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start text-xs border-b border-slate-50 dark:border-slate-700/50 pb-2 last:border-0">
                    <div className="flex-1 pr-3 overflow-hidden">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate" title={item.name}>{item.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{item.qty} x ฿{(item.price || 0).toLocaleString()}</p>
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap pt-0.5">
                      ฿{((item.qty || 0) * (item.price || 0)).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Summary */}
            <div className="mt-3 pt-3 border-t-2 border-dashed border-slate-100 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>ส่วนลดทั้งหมด:</span>
                <span>-฿{((activeDraft.overallDiscount || 0) + (activeDraft.promoDiscount || 0)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>ค่าจัดส่ง:</span>
                <span>฿{(activeDraft.shippingFee || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-black text-[#D51C39] pt-2 text-sm">
                <span>ยอดสุทธิ:</span>
                <span>
                  ฿{(() => {
                    const subTotal = activeDraft.items?.reduce((acc, i) => acc + ((i.qty || 0) * (i.price || 0)), 0) || 0;
                    const discount = (activeDraft.overallDiscount || 0) + (activeDraft.promoDiscount || 0);
                    const net = subTotal - discount + (activeDraft.shippingFee || 0) + (activeDraft.otherFeeAmount || 0);
                    return net.toLocaleString();
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 shrink-0">
            <button 
              onClick={() => handleResume(activeDraft.id)}
              className="w-full py-2.5 bg-[#D51C39] hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              ทำรายการต่อ <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
        className={`w-14 h-14 ${isOpen ? 'bg-slate-800' : 'bg-[#D51C39]'} text-white rounded-full shadow-xl hover:shadow-[#D51C39]/30 flex items-center justify-center transition-colors relative border-2 border-white dark:border-slate-800 ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab hover:-translate-y-0.5'}`}
        style={{ touchAction: 'none' }}
      >
        {isOpen ? <X size={24} className="pointer-events-none" /> : <ShoppingCart size={24} className="pointer-events-none" />}
        
        {!isOpen && drafts.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800 shadow-sm animate-bounce pointer-events-none">
            {drafts.length}
          </span>
        )}
      </button>
    </div>
  );
}
