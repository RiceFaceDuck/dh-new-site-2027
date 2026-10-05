import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ShoppingCart, X, ChevronRight, Store, Trash2, Clock, User, ChevronLeft } from 'lucide-react';
import { auth } from '../../firebase/config';
import { safeJsonParse } from 'dh-shared';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * 🧮 Pure Helper: คำนวณยอดเงินของดราฟต์ให้ตรงกับ POS 100% (Single Source of Truth)
 * รองรับ Item Discount, Percent Discount, VAT 7%, และ Wallet Deduction
 */
const calculateDraftTotals = (draft) => {
  if (!draft) {
    return {
      subTotal: 0,
      manualDiscount: 0,
      promoDiscount: 0,
      totalDiscount: 0,
      shippingFee: 0,
      otherFeeAmount: 0,
      vatAmount: 0,
      vatType: 'exempt',
      netTotal: 0,
      walletUsed: 0,
      remainingToPay: 0,
    };
  }

  const items = Array.isArray(draft.items) ? draft.items : [];
  let subTotal = 0;
  items.forEach((item) => {
    if (item.isFreebie) return;
    const price = Number(item.price || 0);
    const discount = Number(item.discount || 0);
    const qty = Math.max(1, Number(item.qty || 1));
    subTotal += (price - discount) * qty;
  });
  subTotal = Math.round(subTotal * 100) / 100;

  const rawOverall = Number(draft.overallDiscount || 0);
  const discountType = draft.overallDiscountType || 'BAHT';
  const manualDiscount =
    discountType === 'PERCENT'
      ? Math.round(subTotal * (rawOverall / 100))
      : rawOverall;

  const promoDiscount = Number(draft.promoDiscount || 0);
  const totalDiscount = Math.min(
    subTotal,
    Math.round((manualDiscount + promoDiscount) * 100) / 100
  );

  const shippingFee = Number(draft.shippingFee || 0);
  const otherFeeAmount = Number(draft.otherFeeAmount || 0);
  const baseTotal = Math.max(0, subTotal - totalDiscount) + otherFeeAmount;

  const vatType = draft.vatType || 'exempt';
  const isVatOnShipping = Boolean(draft.vatOnShipping);
  const taxableAmount = baseTotal + (isVatOnShipping ? shippingFee : 0);

  let vatAmount = 0;
  let netTotal = 0;

  if (vatType === 'included') {
    vatAmount = Math.round(((taxableAmount * 7) / 107) * 100) / 100;
    netTotal = Math.round((baseTotal + shippingFee) * 100) / 100;
  } else if (vatType === 'excluded') {
    vatAmount = Math.round(taxableAmount * 0.07 * 100) / 100;
    netTotal = Math.round((baseTotal + shippingFee + vatAmount) * 100) / 100;
  } else {
    vatAmount = 0;
    netTotal = Math.round((baseTotal + shippingFee) * 100) / 100;
  }
  netTotal = Math.max(0, netTotal);

  const walletUsed = draft.useWallet ? Number(draft.walletUsed || 0) : 0;
  const remainingToPay = Math.max(
    0,
    Math.round((netTotal - walletUsed) * 100) / 100
  );

  return {
    subTotal,
    manualDiscount,
    promoDiscount,
    totalDiscount,
    shippingFee,
    otherFeeAmount,
    vatAmount,
    vatType,
    netTotal,
    walletUsed,
    remainingToPay,
  };
};

/**
 * ⏱️ Helper: คำนวณระยะเวลาที่ค้างไว้ในรูปแบบที่เข้าใจง่าย
 */
const formatElapsedTime = (id, updatedAt) => {
  const ts = Number(updatedAt || id);
  if (!ts || isNaN(ts) || ts < 1600000000000) return null;
  const diffMinutes = Math.floor((Date.now() - ts) / (1000 * 60));
  if (diffMinutes < 1) return 'เมื่อสักครู่';
  if (diffMinutes < 60) return `ค้างไว้ ${diffMinutes} นาทีที่แล้ว`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `ค้างไว้ ${diffHours} ชม. ที่แล้ว`;
  return `ค้างไว้ ${Math.floor(diffHours / 24)} วันที่แล้ว`;
};

export default function FloatingMiniCart() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // --- Drag & Drop State with LocalStorage Persistence ---
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('dh_pos_floating_cart_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          const maxX = Math.max(0, window.innerWidth - 68);
          const maxY = Math.max(0, window.innerHeight - 68);
          return {
            x: Math.min(Math.max(10, parsed.x), maxX),
            y: Math.min(Math.max(10, parsed.y), maxY),
          };
        }
      }
    } catch (e) {
      /* ignore */
    }
    return {
      x: Math.max(10, window.innerWidth - 68),
      y: Math.max(100, Math.floor(window.innerHeight * 0.72)),
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });
  const isPointerDownRef = useRef(false);
  const wasDraggedRef = useRef(false);

  // Auto-clamp when browser window resizes
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = Math.max(0, window.innerWidth - 68);
        const maxY = Math.max(0, window.innerHeight - 68);
        const newX = Math.min(Math.max(10, prev.x), maxX);
        const newY = Math.min(Math.max(10, prev.y), maxY);
        if (newX !== prev.x || newY !== prev.y) {
          return { x: newX, y: newY };
        }
        return prev;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e) => {
    if (e.button && e.button !== 0) return;
    isPointerDownRef.current = true;
    wasDraggedRef.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { x: position.x, y: position.y };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current) return; // 🛑 ต้องกดเมาส์ค้างไว้เท่านั้น ห้ามขยับตอนแค่ Hover!

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    if (!wasDraggedRef.current) {
      if (Math.hypot(dx, dy) > 8) {
        wasDraggedRef.current = true;
        setIsDragging(true);
      } else {
        return;
      }
    }

    e.preventDefault();
    const maxX = Math.max(0, window.innerWidth - 68);
    const maxY = Math.max(0, window.innerHeight - 68);

    let newX = elementStartPos.current.x + dx;
    let newY = elementStartPos.current.y + dy;

    if (newX < 10) newX = 10;
    if (newY < 10) newY = 10;
    if (newX > maxX) newX = maxX;
    if (newY > maxY) newY = maxY;

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    if (wasDraggedRef.current) {
      setIsDragging(false);
      try {
        localStorage.setItem(
          'dh_pos_floating_cart_pos',
          JSON.stringify(position)
        );
      } catch (err) {
        /* ignore */
      }
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleClick = (e) => {
    if (wasDraggedRef.current) {
      wasDraggedRef.current = false;
      return; // เพิ่งลากเสร็จ ไม่ใช่การคลิกเปิด/ปิด
    }
    setIsOpen((prev) => !prev);
  };

  // --- Real-time LocalStorage Draft Loader with Deduplication ---
  const prevRawSavedRef = useRef(null);
  const loadDrafts = useCallback(() => {
    const uid = auth?.currentUser?.uid || 'guest';
    const saved =
      localStorage.getItem(`dh_pos_autosave_${uid}`) ||
      localStorage.getItem('dh_pos_autosave');

    if (saved === prevRawSavedRef.current) {
      return; // 0 re-render when storage content hasn't changed!
    }
    prevRawSavedRef.current = saved;

    if (saved) {
      const parsed = safeJsonParse(saved);
      if (Array.isArray(parsed)) {
        // Filter out completed and void tabs
        const validDrafts = parsed.filter((t) => {
          const stat = (
            t.orderStatus ||
            t.status ||
            t.paymentStatus ||
            ''
          ).toLowerCase();
          const isFinished =
            stat === 'approved' ||
            stat === 'completed' ||
            stat === 'paid' ||
            stat === 'cancelled' ||
            stat === 'void';
          return (
            !isFinished &&
            (t.items?.length > 0 ||
              t.customer ||
              t.docId ||
              (t.orderId && !t.orderId.startsWith('DH-TEMP-')))
          );
        });

        setDrafts(validDrafts);

        if (validDrafts.length > 0) {
          setActiveTabId((prevActiveId) => {
            if (!validDrafts.some((d) => d.id === prevActiveId)) {
              return validDrafts[0].id;
            }
            return prevActiveId;
          });
        }
        return;
      }
    }
    setDrafts([]);
  }, []);

  // Event-driven storage listener (0ms latency, 0 CPU loop)
  useEffect(() => {
    loadDrafts();

    const handleStorage = (e) => {
      const uid = auth?.currentUser?.uid || 'guest';
      if (
        !e.key ||
        e.key === `dh_pos_autosave_${uid}` ||
        e.key === 'dh_pos_autosave'
      ) {
        prevRawSavedRef.current = null;
        loadDrafts();
      }
    };

    const handleCustomUpdate = () => {
      prevRawSavedRef.current = null;
      loadDrafts();
    };

    const handleFocus = () => {
      loadDrafts();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('dh_cart_updated', handleCustomUpdate);
    window.addEventListener('focus', handleFocus);

    // Auth change listener for initial cold start
    const unsubAuth = auth?.onAuthStateChanged?.(() => {
      prevRawSavedRef.current = null;
      loadDrafts();
    });

    // Gentle fallback check every 10s (only when active and visible)
    const interval = setInterval(loadDrafts, 10000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('dh_cart_updated', handleCustomUpdate);
      window.removeEventListener('focus', handleFocus);
      unsubAuth?.();
      clearInterval(interval);
    };
  }, [loadDrafts]);

  // Hide the widget if on /billing and POS view is active
  if (location.pathname.includes('/billing')) {
    return null;
  }

  // Hide if no drafts
  if (drafts.length === 0) {
    return null;
  }

  // --- Resume Tab Navigation ---
  const handleResume = (draftId) => {
    setIsOpen(false);
    navigate('/billing', { state: { resumeTabId: draftId } });
  };

  // --- Delete / Cancel Draft Action ---
  const handleDeleteDraft = (draftId, e) => {
    if (e) e.stopPropagation();
    const targetDraft = drafts.find((d) => d.id === draftId);
    const orderRef = targetDraft?.orderId || `บิล #${draftId}`;
    if (!window.confirm(`⚠️ ยืนยันการยกเลิกบิลร่าง "${orderRef}" ใช่หรือไม่?\n\nข้อมูลในตะกร้านี้จะถูกนำออกอย่างถาวร`)) {
      return;
    }

    const uid = auth?.currentUser?.uid || 'guest';
    const key = `dh_pos_autosave_${uid}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = safeJsonParse(saved);
      if (Array.isArray(parsed)) {
        const remaining = parsed.filter(
          (t) => t.id !== draftId && t.orderId !== draftId
        );
        if (remaining.length === 0) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(remaining));
        }
        prevRawSavedRef.current = null;
        window.dispatchEvent(new CustomEvent('dh_cart_updated'));
        loadDrafts();
      }
    }
  };

  // Find currently active draft
  const activeDraft = drafts.find((d) => d.id === activeTabId) || drafts[0];
  const totals = calculateDraftTotals(activeDraft);

  // Customer info extraction
  const customerName =
    activeDraft?.customer?.accountName ||
    activeDraft?.customer?.displayName ||
    activeDraft?.customer?.firstName ||
    activeDraft?.walkInName ||
    'ลูกค้าทั่วไป (หน้าร้าน)';
  const customerPhone =
    activeDraft?.customer?.phone || activeDraft?.walkInPhone || '';
  const customerType =
    activeDraft?.customer?.customerType ||
    (activeDraft?.priceMode === 'wholesale' ? 'ขายส่ง' : 'ขายปลีก');
  const elapsedText = formatElapsedTime(
    activeDraft?.id,
    activeDraft?.updatedAt
  );

  // --- Smart Dynamic Card Placement (Prevents Off-Screen Clipping) ---
  const isNearTop = position.y < 460;
  const isNearLeft = position.x < 360;

  const cardPlacementClasses = `
    absolute
    ${isNearTop ? 'top-full mt-3' : 'bottom-full mb-3'}
    ${isNearLeft ? 'left-0 origin-top-left' : 'right-0 origin-bottom-right'}
    w-96 max-w-[calc(100vw-2rem)]
  `;

  // --- Docked State (Dock-to-Edge instead of disappearing) ---
  if (isDocked) {
    return (
      <aside 
        aria-label="ตะกร้าลอยที่ย่อเก็บ"
        className="fixed right-0 z-40 print:hidden top-1/2 -translate-y-1/2"
      >
        <button
          onClick={() => setIsDocked(false)}
          className="bg-slate-900/90 dark:bg-slate-950/95 hover:bg-[#D51C39] text-white py-3 px-2 rounded-l-xl shadow-2xl border-y border-l border-white/20 flex flex-col items-center gap-1.5 transition-all group cursor-pointer"
          title="คลิกเพื่อขยายตะกร้าลอย"
        >
          <ShoppingCart size={18} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black tracking-widest writing-vertical uppercase py-1">
            งานค้าง ({drafts.length})
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        </button>
      </aside>
    );
  }

  return (
    <aside 
      aria-label="ตะกร้าลอยค้างบิล"
      className="fixed z-40 print:hidden flex flex-col items-end"
      style={{ left: position.x, top: position.y }}
    >
      {/* Pop-up Card */}
      {isOpen && activeDraft && (
        <div
          className={`${cardPlacementClasses} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 fade-in duration-200 flex flex-col select-none`}
        >
          {/* Header */}
          <div className="bg-slate-900 dark:bg-slate-950 px-4 py-3 flex justify-between items-center text-white shrink-0 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#D51C39]/20 flex items-center justify-center text-[#D51C39] border border-[#D51C39]/30">
                <Store size={15} />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none flex items-center gap-2">
                  งานค้าง POS
                  <span className="text-[11px] font-extrabold bg-[#D51C39] text-white px-1.5 py-0.2 rounded-full">
                    {drafts.length}
                  </span>
                </h3>
                {activeDraft.orderId && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeDraft.orderId}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => handleDeleteDraft(activeDraft.id, e)}
                title="ยกเลิกบิลร่างนี้"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="ย่อการ์ด"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Customer & Hold Time Context Banner */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-1.5 overflow-hidden pr-2">
              <User size={13} className="text-slate-400 shrink-0" />
              <div className="overflow-hidden">
                <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                  {customerName}
                </p>
                {customerPhone && (
                  <p className="text-[10px] text-slate-500 font-mono leading-none">
                    {customerPhone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0">
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                {customerType}
              </span>
              {elapsedText && (
                <span className="text-[9px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                  <Clock size={9} /> {elapsedText}
                </span>
              )}
            </div>
          </div>

          {/* Multi-Tab Bar (แสดงเมื่อมีหลายบิล) */}
          {drafts.length > 1 && (
            <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 p-2 gap-1.5 shrink-0 bg-slate-100/60 dark:bg-slate-800/40 custom-scrollbar">
              {drafts.map((draft, idx) => {
                const cName =
                  draft.customer?.accountName ||
                  draft.customer?.displayName ||
                  draft.customer?.firstName ||
                  draft.walkInName ||
                  `บิล #${idx + 1}`;
                const isActive = activeTabId === draft.id;
                return (
                  <button
                    key={draft.id}
                    onClick={() => setActiveTabId(draft.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-[#D51C39] text-white border-[#D51C39] shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{cName}</span>
                    <span
                      onClick={(e) => handleDeleteDraft(draft.id, e)}
                      title="ลบบิลนี้"
                      className="hover:opacity-75 p-0.5 rounded-full hover:bg-black/10"
                    >
                      <X size={11} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Cart Items List */}
          <div className="p-4 flex-1 overflow-y-auto max-h-80 custom-scrollbar space-y-2">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              รายการสินค้า ({activeDraft.items?.length || 0})
            </h4>

            {!activeDraft.items || activeDraft.items.length === 0 ? (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs italic">
                ยังไม่มีรายการสินค้าในตะกร้า
              </div>
            ) : (
              activeDraft.items.map((item, i) => {
                const itemPrice = Number(item.price || 0);
                const itemDiscount = Number(item.discount || 0);
                const itemQty = Math.max(1, Number(item.qty || 1));
                const itemTotal = item.isFreebie
                  ? 0
                  : (itemPrice - itemDiscount) * itemQty;

                return (
                  <div
                    key={i}
                    className="flex justify-between items-start text-xs border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0"
                  >
                    <div className="flex-1 pr-3 overflow-hidden">
                      <p
                        className="font-bold text-slate-800 dark:text-slate-200 truncate"
                        title={item.name}
                      >
                        {item.name}
                        {item.isFreebie && (
                          <span className="ml-1 text-[10px] text-emerald-600 font-extrabold bg-emerald-50 dark:bg-emerald-950 px-1 py-0.2 rounded border border-emerald-200">
                            ของแถม
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        <span>{itemQty} x ฿{itemPrice.toLocaleString()}</span>
                        {itemDiscount > 0 && (
                          <span className="text-red-500 font-semibold">
                            (ลด ฿{itemDiscount.toLocaleString()}/ชิ้น)
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="text-right shrink-0 pt-0.5">
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        ฿{itemTotal.toLocaleString()}
                      </p>
                      {item.isFreebie && (
                        <p className="text-[9px] line-through text-slate-400">
                          ฿{(itemPrice * itemQty).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Financial Summary Breakdown (SSOT Parity with POS) */}
            <div className="mt-3 pt-3 border-t-2 border-dashed border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>ยอดรวมสินค้า:</span>
                <span>฿{totals.subTotal.toLocaleString()}</span>
              </div>

              {totals.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>ส่วนลดทั้งหมด:</span>
                  <span>-฿{totals.totalDiscount.toLocaleString()}</span>
                </div>
              )}

              {totals.shippingFee > 0 && (
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>ค่าจัดส่ง:</span>
                  <span>+฿{totals.shippingFee.toLocaleString()}</span>
                </div>
              )}

              {totals.otherFeeAmount > 0 && (
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>ค่าบริการอื่นๆ:</span>
                  <span>+฿{totals.otherFeeAmount.toLocaleString()}</span>
                </div>
              )}

              {totals.vatAmount > 0 && (
                <div className="flex justify-between text-blue-600 dark:text-blue-400 font-medium">
                  <span>ภาษีมูลค่าเพิ่ม (7%):</span>
                  <span>+฿{totals.vatAmount.toLocaleString()}</span>
                </div>
              )}

              {totals.walletUsed > 0 && (
                <div className="flex justify-between text-purple-600 dark:text-purple-400 font-bold">
                  <span>หักจาก DH ค้างยอด:</span>
                  <span>-฿{totals.walletUsed.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between font-black text-[#D51C39] pt-2 border-t border-slate-200 dark:border-slate-800 text-sm">
                <span>ยอดชำระสุทธิ:</span>
                <span className="text-base">
                  ฿{totals.remainingToPay.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0">
            <button
              onClick={() => handleResume(activeDraft.id)}
              className="flex-1 py-2.5 bg-[#D51C39] hover:bg-red-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-sm"
            >
              <span>ทำรายการต่อ</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button (Circle) */}
      <div className="relative">
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          title="งานค้างในตะกร้า (คลิกเพื่อดูรายการ / ลากเพื่อจัดตำแหน่ง)"
          className={`w-14 h-14 ${
            isOpen ? 'bg-slate-900 dark:bg-slate-950' : 'bg-[#D51C39]'
          } text-white rounded-full shadow-2xl hover:shadow-[#D51C39]/30 flex items-center justify-center transition-colors relative border-2 border-white dark:border-slate-800 select-none ${
            isDragging
              ? 'cursor-grabbing scale-105 ring-4 ring-[#D51C39]/30'
              : 'cursor-grab hover:-translate-y-0.5'
          }`}
          style={{ touchAction: 'none' }}
        >
          {isOpen ? (
            <X size={24} className="pointer-events-none" />
          ) : (
            <ShoppingCart size={24} className="pointer-events-none" />
          )}

          {/* Static Notification Badge (Calm UI Invariant - NO animate-bounce) */}
          {!isOpen && drafts.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800 shadow-md pointer-events-none">
              {drafts.length}
            </span>
          )}
        </div>

        {/* Dock-to-edge Button (แทนการปิดถาวรจนต้องรอ F5) */}
        {!isOpen && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsDocked(true);
            }}
            title="ย่อชิดขอบจอ (คลิกเรียกกลับได้ตลอดเวลา)"
            className="absolute -top-1 -left-1 w-5 h-5 bg-slate-800 hover:bg-slate-900 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-md transition-transform hover:scale-110 z-20 cursor-pointer"
          >
            <ChevronLeft size={11} strokeWidth={3} />
          </button>
        )}
      </div>
    </aside>
  );
}
