import { useState, useEffect, useRef } from 'react';

/**
 * Custom Hook for managing Navbar visibility on scroll with throttled requestAnimationFrame
 * Optimized for low-spec mobile devices with Bottom Boundary Guard and Jitter Prevention
 * @param {Function} [onScrollDown] - Optional callback executed when user scrolls down
 * @returns {{ isVisible: boolean }}
 */
export const useNavbarScroll = (onScrollDown) => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const isVisibleRef = useRef(true);

  // Sync ref with state
  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  useEffect(() => {
    let ticking = false;
    const SCROLL_DELTA_THRESHOLD = 8; // Ignore micro-jitters (<8px)
    const BOTTOM_OFFSET_GUARD = 70;   // Buffer zone at document bottom

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const lastScrollY = lastScrollYRef.current;
          const delta = currentScrollY - lastScrollY;

          // Always show navbar near the top of the page
          if (currentScrollY <= 50) {
            if (!isVisibleRef.current) setIsVisible(true);
            lastScrollYRef.current = currentScrollY;
            ticking = false;
            return;
          }

          // 🛡️ Bottom Boundary Guard: Stop toggling at the very bottom (prevents mobile overscroll jitter)
          const scrollHeight = document.documentElement.scrollHeight;
          const clientHeight = window.innerHeight || document.documentElement.clientHeight;
          const isNearBottom = currentScrollY + clientHeight >= scrollHeight - BOTTOM_OFFSET_GUARD;

          if (isNearBottom) {
            // Lock current visibility state near bottom to avoid bouncing loop
            lastScrollYRef.current = currentScrollY;
            ticking = false;
            return;
          }

          // Only act if scroll delta exceeds threshold
          if (Math.abs(delta) >= SCROLL_DELTA_THRESHOLD) {
            if (delta > 0 && currentScrollY > 50) {
              // Scrolling down
              if (isVisibleRef.current) {
                setIsVisible(false);
                if (onScrollDown) onScrollDown();
              }
            } else if (delta < 0) {
              // Scrolling up
              if (!isVisibleRef.current) {
                setIsVisible(true);
              }
            }
            lastScrollYRef.current = currentScrollY;
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onScrollDown]);

  return { isVisible };
};
