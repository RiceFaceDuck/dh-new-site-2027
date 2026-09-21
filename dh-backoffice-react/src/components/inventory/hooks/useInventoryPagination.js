import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to handle inventory table pagination, page clamping, and slicing
 */
export default function useInventoryPagination(totalItems, resetTriggers = []) {
  const [itemsPerPage, setItemsPerPage] = useState(21);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever search, filter, sort, or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, ...resetTriggers]);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage) || 1);

  // Clamped effective page to protect rendering slices and prevent inverted ranges
  const safeCurrentPage = totalItems === 0 ? 1 : Math.min(Math.max(1, currentPage), totalPages);

  // Adjust currentPage if it exceeds totalPages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const handleSetCurrentPage = useCallback((pageOrFn) => {
    setCurrentPage(prev => {
      const target = typeof pageOrFn === 'function' ? pageOrFn(prev) : pageOrFn;
      const num = Number(target);
      if (isNaN(num) || num < 1) return 1;
      if (num > totalPages) return totalPages;
      return num;
    });
  }, [totalPages]);

  const slicePage = useCallback((items) => {
    if (!Array.isArray(items)) return [];
    return items.slice(startIndex, endIndex);
  }, [startIndex, endIndex]);

  return {
    itemsPerPage,
    setItemsPerPage,
    currentPage: safeCurrentPage,
    setCurrentPage: handleSetCurrentPage,
    totalPages,
    startIndex,
    endIndex,
    slicePage
  };
}
