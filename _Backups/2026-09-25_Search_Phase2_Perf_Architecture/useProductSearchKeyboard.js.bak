import { useEffect } from 'react';

export function useProductSearchKeyboard(
  filteredProducts,
  selectedIndex,
  setSelectedIndex,
  handleSelectProduct,
  modalsState,
  loadMore,
  hasMore
) {
  const {
    isHistoryModalOpen,
    isReportModalOpen,
    isImageModalOpen,
    isGuideModalOpen
  } = modalsState;

  // Reset keyboard selected index when products change (only when initial array replaces)
  useEffect(() => {
    if (!filteredProducts || filteredProducts.length === 0) return;
    // Keep selected index valid
    if (selectedIndex >= filteredProducts.length) {
      setSelectedIndex(0);
      handleSelectProduct(filteredProducts[0], 0);
    }
  }, [filteredProducts]);

  // ✨ Zero-Touch Keyboard Navigation
  useEffect(() => {
    const handleNavigation = (e) => {
      // Don't intercept if user is in an input other than search, or modal is open
      if (isHistoryModalOpen || isReportModalOpen || isImageModalOpen || isGuideModalOpen) return;
      
      // Allow navigation even if focus is inside the search inputs
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && activeEl.tagName === 'INPUT';
      if (isInputFocused && !activeEl.id?.startsWith('search-input')) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const nextIndex = Math.min(prev + 1, filteredProducts.length - 1);
          if (filteredProducts[nextIndex]) {
            handleSelectProduct(filteredProducts[nextIndex], nextIndex);
          }
          if (nextIndex >= filteredProducts.length - 3 && hasMore && loadMore) {
            loadMore();
          }
          return nextIndex;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const nextIndex = Math.max(prev - 1, 0);
          if (filteredProducts[nextIndex]) {
            handleSelectProduct(filteredProducts[nextIndex], nextIndex);
          }
          return nextIndex;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredProducts[selectedIndex]) {
          handleSelectProduct(filteredProducts[selectedIndex], selectedIndex);
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
    handleSelectProduct,
    loadMore,
    hasMore
  ]);
}
