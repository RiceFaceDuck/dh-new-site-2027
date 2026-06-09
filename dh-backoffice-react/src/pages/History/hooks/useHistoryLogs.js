import { useState, useEffect, useCallback } from 'react';
import { historyService } from '../../../firebase/historyService';

export const useHistoryLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all'); 
  
  // Pagination
  const [lastVisibleDoc, setLastVisibleDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_LIMIT = 50;

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { logs: data, lastDoc } = await historyService.getRecentLogs(PAGE_LIMIT, null, moduleFilter, actionFilter);
      setLogs(data);
      setFilteredLogs(data); // Will be filtered locally by search term next
      setLastVisibleDoc(lastDoc);
      setHasMore(data.length === PAGE_LIMIT);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  }, [moduleFilter, actionFilter]);

  // Refetch when server-side filters change
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const { logs: newData, lastDoc } = await historyService.getRecentLogs(PAGE_LIMIT, lastVisibleDoc, moduleFilter, actionFilter);
      const combinedLogs = [...logs, ...newData];
      setLogs(combinedLogs);
      // We don't call applyFilters here immediately because useEffect will catch the logs change and apply search filter
      setLastVisibleDoc(lastDoc);
      setHasMore(newData.length === PAGE_LIMIT);
    } catch (error) {
      console.error("Error loading more history:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Only apply local text search since module/action are handled server-side
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLogs(logs);
      return;
    }
    
    const lowerSearch = searchTerm.toLowerCase();
    const result = logs.filter(log => {
      const actorName = (log.actorName || log.performedBy || '').toLowerCase();
      const actorMail = (log.actorEmail || '').toLowerCase();
      
      return (
        (log.details && log.details.toLowerCase().includes(lowerSearch)) ||
        (log.targetId && log.targetId.toLowerCase().includes(lowerSearch)) ||
        actorName.includes(lowerSearch) ||
        actorMail.includes(lowerSearch)
      );
    });
    
    setFilteredLogs(result);
  }, [searchTerm, logs]);

  return {
    logs,
    filteredLogs,
    loading,
    loadingMore,
    searchTerm,
    setSearchTerm,
    moduleFilter,
    setModuleFilter,
    actionFilter,
    setActionFilter,
    hasMore,
    loadMore
  };
};
