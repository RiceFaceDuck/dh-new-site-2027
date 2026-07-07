import { useEffect } from 'react';

export function useProductSearchKeyboard(
  filteredProducts,
  selectedIndex,
  setSelectedIndex,
  handleSelectProduct,
  modalsState
) {
  const {
    isHistoryModalOpen,
    isReportModalOpen,
    isImageModalOpen,
    isGuideModalOpen
  } = modalsState;

  // Reset keyboard selected index when products or filters change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredProducts, setSelectedIndex]);

  // ✨ Zero-Touch Keyboard Navigation
  useEffect(() => {
    const handleNavigation = (e) => {
      // Don't intercept if user is in an input other than search, or modal is open
      if (isHistoryModalOpen || isReportModalOpen || isImageModalOpen || isGuideModalOpen) return;
      
      // Allow navigation even if focus is inside the search inputs
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && activeEl.tagName === 'INPUT';
      if (isInputFocused && !activeEl.id.startsWith('search-input')) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 0, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredProducts[selectedIndex]) {
          handleSelectProduct(filteredProducts[selectedIndex]);
          if (activeEl) activeEl.blur(); // Remove focus from search to fully view details
        }
      }
    };
    document.addEventListener('keydown', handleNavigation);
    return () => document.removeEventListener('keydown', handleNavigation);
  }, [
    filteredProducts,
    selectedIndex,
    isHistoryModalOpen,
    isReportModalOpen,
    isImageModalOpen,
    isGuideModalOpen,
    setSelectedIndex,
    handleSelectProduct
  ]);
}
