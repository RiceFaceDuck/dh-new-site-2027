import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ShoppingCart, X, ChevronRight, Store, Trash2, Clock, User, ChevronLeft } from 'lucide-react';
import { auth } from '../../firebase/config';
import { safeJsonParse } from 'dh-shared';
import { useNavigate, useLocation } from 'react-router-dom';
import { staffPosDraftService, filterValidDraftTabs } from '../../firebase/staffPosDraftService';

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

export default function FloatingMiniCart({
  isPosOpen: isPosOpenProp,
  isVisible: isVisibleProp,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // --- Real-time Visibility State (Sidebar Toggle Button) ---
  const [isVisibleState, setIsVisibleState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dh_floating_cart_visible');
      return saved !== 'false';
    }
    return true;
  });

  useEffect(() => {
    const handleVisibilityChange = (e) => {
      if (e.detail && typeof e.detail.isVisible === 'boolean') {
        setIsVisibleState(e.detail.isVisible);
      }
    };
    window.addEventListener(
      'dh_floating_cart_visibility_change',
      handleVisibilityChange
    );
    return () => {
      window.removeEventListener(
        'dh_floating_cart_visibility_change',
        handleVisibilityChange
      );
    };
  }, []);

  const isVisible =
    typeof isVisibleProp === 'boolean' ? isVisibleProp : isVisibleState;

  // --- Multi-Tab Navigation & Scroll Handlers ---
  const tabsContainerRef = useRef(null);

  // Auto-scroll active tab into view whenever activeTabId changes
  const scrollToActiveTab = useCallback((targetTabId) => {
    if (!tabsContainerRef.current) return;
    const tabEl = tabsContainerRef.current.querySelector(
      `[data-tab-id="${targetTabId}"]`
    );
    if (tabEl) {
      tabEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, []);

  const handleNavigateTab = (direction) => {
    if (!drafts || drafts.length <= 1) return;
    const currentIdx = drafts.findIndex(
      (d) => d.id === (activeTabId || drafts[0]?.id)
    );
    const safeIdx = currentIdx >= 0 ? currentIdx : 0;

    if (direction === 'left') {
      if (safeIdx > 0) {
        const prevTab = drafts[safeIdx - 1];
        setActiveTabId(prevTab.id);
        scrollToActiveTab(prevTab.id);
      }
    } else if (direction === 'right') {
      if (safeIdx < drafts.length - 1) {
        const nextTab = drafts[safeIdx + 1];
        setActiveTabId(nextTab.id);
        scrollToActiveTab(nextTab.id);
      }
    }
  };

  const handleTabsWheel = (e) => {
    if (tabsContainerRef.current && e.deltaY !== 0) {
      e.preventDefault();
      tabsContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  // Auto-scroll to newly activated tab
  useEffect(() => {
    if (activeTabId) {
      scrollToActiveTab(activeTabId);
    }
  }, [activeTabId, scrollToActiveTab]);

  // --- Real-time POS Open State Synchronization ---
  const [isPosOpenState, setIsPosOpenState] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!window.__DH_IS_POS_OPEN__;
    }
    return false;
  });

  useEffect(() => {
    const handlePosViewChange = (e) => {
      if (e.detail && typeof e.detail.isPosOpen === 'boolean') {
        setIsPosOpenState(e.detail.isPosOpen);
      }
    };
    window.addEventListener('dh_pos_view_change', handlePosViewChange);
    return () => {
      window.removeEventListener('dh_pos_view_change', handlePosViewChange);
    };
  }, []);

  const isPosActive =
    typeof isPosOpenProp === 'boolean' ? isPosOpenProp : isPosOpenState;

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

  // --- Real-time LocalStorage Draft Loader with Deduplication & Cloud Hydration ---
  const prevRawSavedRef = useRef(null);
  const loadDrafts = useCallback(async () => {
    const uid = auth?.currentUser?.uid || 'guest';
    let saved = localStorage.getItem(`dh_pos_autosave_${uid}`);

    // If local has nothing and staff is logged in, pull from cloud (Cross-Device Sync)
    if (!saved && uid !== 'guest') {
      try {
        const cloudTabs = await staffPosDraftService.getStaffCloudDrafts(uid);
        if (cloudTabs && cloudTabs.length > 0) {
          saved = JSON.stringify(cloudTabs);
          localStorage.setItem(`dh_pos_autosave_${uid}`, saved);
        }
      } catch (err) {
        console.warn('Failed to hydrate cloud drafts:', err);
      }
    }

    if (saved === prevRawSavedRef.current) {
      return; // 0 re-render when storage content hasn't changed!
    }
    prevRawSavedRef.current = saved;

    if (saved) {
      const parsed = safeJsonParse(saved);
      if (Array.isArray(parsed)) {
        const validDrafts = filterValidDraftTabs(parsed);
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
      if (!e.key || e.key === `dh_pos_autosave_${uid}`) {
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

    // Auth change listener for staff account switching & cold start
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

  // 🛑 Hide widget if toggled off by user from Sidebar button
  if (!isVisible) {
    return null;
  }

  // 🛑 Hide widget ONLY if on /billing AND POS is active (creates new bill / cashier mode)
  if (location.pathname.includes('/billing') && isPosActive) {
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
        if (uid !== 'guest') {
          staffPosDraftService.saveStaffCloudDraftsDebounced(uid, remaining, 0);
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

  // Clamped dynamic max-height to strictly prevent overflowing off the top/bottom of screen
  const availableHeight = isNearTop
    ? Math.max(300, (typeof window !== 'undefined' ? window.innerHeight : 800) - position.y - 75)
    : Math.max(300, position.y - 15);
  const cardMaxHeight = Math.min(620, availableHeight);

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
          className={`${cardPlacementClasses} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 fade-in duration-200 flex flex-col`}
          style={{ maxHeight: `${cardMaxHeight}px` }}
        >
          {/* 1. Header */}
          <div className="bg-slate-900 dark:bg-slate-950 px-4 py-2.5 flex justify-between items-center text-white shrink-0 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#D51C39]/20 flex items-center justify-center text-[#D51C39] border border-[#D51C39]/40 shrink-0 shadow-inner">
                <Store size={16} />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100 tracking-tight leading-none whitespace-nowrap">
                  งานค้าง POS
                </h3>
                {/* 🏷️ ตัวเลขแจ้งเตือนจำนวนงานค้าง ขนาดสมดุลกลมกลืนกับหัวข้อ */}
                <span className="text-xs font-bold text-white bg-[#D51C39] px-2 py-0.5 rounded-full leading-none font-mono shadow-xs border border-white/20 select-none tracking-tight">
                  {drafts.length}
                </span>
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

          {/* 2. Multi-Tab Bar (Smart Compact Presentation + Ergonomic Nav Buttons) */}
          {drafts.length > 1 && (() => {
            const currentTabIdx = drafts.findIndex(
              (d) => d.id === (activeTabId || drafts[0]?.id)
            );
            const safeIdx = currentTabIdx >= 0 ? currentTabIdx : 0;
            const hasPrev = safeIdx > 0;
            const hasNext = safeIdx < drafts.length - 1;
            const getDraftName = (d) =>
              d?.customer?.accountName ||
              d?.customer?.displayName ||
              d?.customer?.firstName ||
              d?.walkInName ||
              'ลูกค้าทั่วไป';
            const prevDraftName = hasPrev ? getDraftName(drafts[safeIdx - 1]) : '';
            const nextDraftName = hasNext ? getDraftName(drafts[safeIdx + 1]) : '';
            const prevTabTitle = hasPrev
              ? `สลับไปบิลก่อนหน้า: ${prevDraftName}`
              : 'บิลแรกสุดแล้ว';
            const nextTabTitle = hasNext
              ? `สลับไปบิลถัดไป: ${nextDraftName}`
              : 'บิลสุดท้ายแล้ว';

            return (
              <div className="relative border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-800/80 shrink-0 px-2.5 py-1.5 flex items-center gap-2 shadow-inner">
                {/* ปุ่มเลื่อนซ้าย / บิลก่อนหน้า (ปุ่มใหญ่ กดง่าย ชัดเจน ไม่ต้องเล็ง) */}
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={() => handleNavigateTab('left')}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all select-none ${
                    hasPrev
                      ? 'bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-600 cursor-pointer active:scale-90 hover:shadow'
                      : 'opacity-30 cursor-not-allowed bg-slate-200/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 border border-transparent'
                  }`}
                  title={prevTabTitle}
                  aria-label={prevTabTitle}
                >
                  <ChevronLeft size={18} strokeWidth={2.5} />
                </button>

                {/* แถบแท็บแนวนอน */}
                <div
                  ref={tabsContainerRef}
                  onWheel={handleTabsWheel}
                  className="flex overflow-x-auto gap-1.5 py-0.5 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth flex-1 items-center"
                >
                  {drafts.map((draft, idx) => {
                    const isActive = activeTabId === draft.id;
                    const cName =
                      draft.customer?.accountName ||
                      draft.customer?.displayName ||
                      draft.customer?.firstName ||
                      draft.walkInName ||
                      '';
                    const tabLabel = cName
                      ? (cName.length > 12 ? cName.slice(0, 11) + '..' : cName)
                      : 'ลูกค้าทั่วไป';

                    return (
                      <button
                        key={draft.id}
                        data-tab-id={draft.id}
                        type="button"
                        onClick={() => setActiveTabId(draft.id)}
                        className={`h-7 px-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs ${
                          isActive
                            ? 'bg-[#D51C39] text-white border-[#D51C39] shadow-xs ring-1 ring-[#D51C39]/30'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                        title={cName ? `บิล: ${cName}` : 'บิลลูกค้าทั่วไป'}
                      >
                        <span>{tabLabel}</span>
                        <span
                          onClick={(e) => handleDeleteDraft(draft.id, e)}
                          title="ลบบิลนี้"
                          className="hover:opacity-80 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors ml-0.5"
                        >
                          <X size={10} strokeWidth={3} />
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* ปุ่มเลื่อนขวา / บิลถัดไป (ปุ่มใหญ่ กดง่าย ชัดเจน ไม่ต้องเล็ง) */}
                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() => handleNavigateTab('right')}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all select-none ${
                    hasNext
                      ? 'bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-600 cursor-pointer active:scale-90 hover:shadow'
                      : 'opacity-30 cursor-not-allowed bg-slate-200/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 border border-transparent'
                  }`}
                  title={nextTabTitle}
                  aria-label={nextTabTitle}
                >
                  <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            );
          })()}

          {/* 3. Customer Info & Context Card (ข้อมูลลูกค้าของบิลที่เลือก ชัดเจน ไม่ทับซ้อน) */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 flex flex-col gap-1.5 shrink-0">
            {/* Row 1: Order Ref & Status Meta */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-700/70 px-1.5 py-0.5 rounded text-[10px]">
                {activeDraft.orderId || `บิลร่าง #${activeDraft.id}`}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  {customerType}
                </span>
                {elapsedText && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                    <Clock size={10} /> {elapsedText}
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: Customer Name & Phone */}
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                <User size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate leading-tight" title={customerName}>
                  {customerName}
                </p>
                {customerPhone && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-none mt-0.5">
                    {customerPhone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 4. Cart Items List (Single-Row High-Density, Clear & Space-Saving) */}
          <div className="px-3.5 py-2 flex-1 overflow-y-auto min-h-0 custom-scrollbar space-y-1">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                รายการสินค้า ({activeDraft.items?.length || 0})
              </h4>
            </div>

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
                    className="flex items-center justify-between gap-2 py-1 px-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs border-b border-slate-50 dark:border-slate-800/40 last:border-0"
                  >
                    {/* จำนวนชิ้นเด่นชัด (x1) */}
                    <span className="shrink-0 font-mono font-black text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-700 min-w-[28px] text-center select-none shadow-2xs">
                      {itemQty}x
                    </span>

                    {/* ชื่อสินค้าตรงกลาง (ตัดคำสวยงาม ไม่ล้น) */}
                    <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
                      <p
                        className="font-bold text-slate-800 dark:text-slate-200 truncate leading-tight text-xs"
                        title={item.name}
                      >
                        {item.name}
                      </p>
                      {item.isFreebie && (
                        <span className="shrink-0 text-[9px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-1 rounded border border-emerald-200">
                          แถม
                        </span>
                      )}
                      {itemDiscount > 0 && (
                        <span className="shrink-0 text-[9px] text-red-500 font-semibold font-mono bg-red-50 dark:bg-red-950 px-1 rounded">
                          -฿{itemDiscount}
                        </span>
                      )}
                    </div>

                    {/* ยอดเงินสุทธิต่อรายการ */}
                    <div className="text-right shrink-0">
                      <span className="font-bold font-mono text-xs text-slate-900 dark:text-slate-100">
                        ฿{itemTotal.toLocaleString()}
                      </span>
                      {item.isFreebie && (
                        <span className="block text-[9px] line-through text-slate-400 font-mono leading-none">
                          ฿{(itemPrice * itemQty).toLocaleString()}
                        </span>
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
