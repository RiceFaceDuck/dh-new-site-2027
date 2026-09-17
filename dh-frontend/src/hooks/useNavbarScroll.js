import { useState, useEffect } from 'react';

/**
 * Custom Hook for managing Navbar visibility on scroll with throttled requestAnimationFrame
 * @param {Function} [onScrollDown] - Optional callback executed when user scrolls down
 * @returns {{ isVisible: boolean }}
 */
export const useNavbarScroll = (onScrollDown) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > lastScrollY && currentScrollY > 50) {
            setIsVisible(false);
            if (onScrollDown) onScrollDown();
          } else {
            setIsVisible(true);
          }
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, onScrollDown]);

  return { isVisible };
};
