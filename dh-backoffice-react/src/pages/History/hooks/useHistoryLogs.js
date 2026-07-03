import { useState, useEffect, useCallback } from 'react';
import { gasHistoryService } from '../../../firebase/gasHistoryService';
import { userService } from '../../../firebase/userService';

// Utility to get today's date in YYYY-MM-DD
const getTodayString = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

export const useHistoryLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL'); 
  
  // Staff Filter
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [staffList, setStaffList] = useState([]);
  
  // Pagination (GAS currently returns a bulk list up to 1000 items, so we disable loadMore)
  const [hasMore, setHasMore] = useState(false);

  // Load staff list once on mount
  useEffect(() => {
    userService.getAllStaff()
      .then(list => {
        setStaffList(list || []);
      })
      .catch(err => console.error("❌ [HistoryLogsHook] Fetch staff list error:", err));
  }, []);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gasHistoryService.getLogs({
        dateStr: dateFilter,
        module: moduleFilter,
        level: actionFilter,
        limit: 1000
      });
      setLogs(data || []);
      setFilteredLogs(data || []); // Will be filtered locally next
      setHasMore(false); // Disable infinite scroll since we get the whole day
    } catch (error) {
      console.error("Error loading history from GAS:", error);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, moduleFilter, actionFilter]);

  // Refetch when server-side filters change
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const loadMore = async () => {
    // No-op for now as GAS returns the full daily limit.
  };

  // Apply local text search and staff filter
  useEffect(() => {
    let result = logs;
    
    // Apply Staff Filter
    if (staffFilter !== 'ALL') {
      result = result.filter(log => log?.actor?.uid === staffFilter || log?.actor?.email === staffFilter);
    }
    
    // Apply Search Term Filter (grep)
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(log => {
        const actorName = log?.actor?.name?.toLowerCase() || '';
        const actorMail = log?.actor?.email?.toLowerCase() || '';
        const action = log?.action?.toLowerCase() || '';
        const detailsStr = JSON.stringify(log?.details || {}).toLowerCase();
        const targetId = log?.target?.id?.toLowerCase() || '';
        
        return (
          action.includes(lowerSearch) ||
          actorName.includes(lowerSearch) ||
          actorMail.includes(lowerSearch) ||
          detailsStr.includes(lowerSearch) ||
          targetId.includes(lowerSearch)
        );
      });
    }
    
    setFilteredLogs(result);
  }, [searchTerm, staffFilter, logs]);

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
    dateFilter,
    setDateFilter,
    staffFilter,
    setStaffFilter,
    staffList,
    hasMore,
    loadMore
  };
};
