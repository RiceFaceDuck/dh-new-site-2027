import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  checkGmailConfigured,
  getUnreadCount, 
  fetchEmailsList,
  markAllAsRead as markAllAsReadService,
  toggleStar as toggleStarService,
  toggleImportant as toggleImportantService
} from '../../../firebase/gmailService';

export const useGmail = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [emails, setEmails] = useState([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [nextStart, setNextStart] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Helper to build Gmail search query string
  const buildQuery = useCallback(() => {
    let query = '';
    switch (activeTab) {
      case 'inbox': query = 'in:inbox'; break;
      case 'sent': query = 'in:sent'; break;
      case 'starred': query = 'is:starred'; break;
      case 'important': query = 'is:important'; break;
      default: query = 'in:inbox';
    }
    if (searchQuery.trim()) {
      query += ` ${searchQuery.trim()}`;
    }
    return query;
  }, [activeTab, searchQuery]);

  const init = useCallback(async () => {
    try {
      setIsInitializing(true);
      const configured = await checkGmailConfigured();
      setIsConfigured(configured);
      if (configured) {
        const count = await getUnreadCount();
        setUnreadCount(count);
      }
    } catch (err) {
      console.error("Gmail Init Error:", err);
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const fetchEmails = useCallback(async (isLoadMore = false) => {
    if (!isConfigured) return;

    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoadingEmails(true);
        setNextStart(0);
      }
      setError(null);
      
      const query = buildQuery();
      const currentStart = isLoadMore ? nextStart : 0;
      
      const result = await fetchEmailsList(currentStart, 20, query);
      
      if (isLoadMore) {
        setEmails(prev => [...prev, ...result.emails]);
      } else {
        setEmails(result.emails);
      }
      
      setNextStart(result.nextStart);
      setHasMore(result.hasMore);
      
    } catch (err) {
      console.error("Error fetching gmail data:", err);
      setError(err.message || 'ไม่สามารถโหลดอีเมลได้');
    } finally {
      setIsLoadingEmails(false);
      setIsLoadingMore(false);
    }
  }, [isConfigured, buildQuery, nextStart]);

  // Refetch when tab or search changes
  useEffect(() => {
    if (isConfigured && !isInitializing) {
      fetchEmails(false);
    }
  }, [activeTab, searchQuery, isConfigured, isInitializing]);

  const loadMore = () => {
    if (hasMore && !isLoadingMore) {
      fetchEmails(true);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllAsReadService();
      setUnreadCount(0);
      setEmails(prev => prev.map(e => ({ ...e, isUnread: false })));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStar = async (id, currentStatus) => {
    // Optimistic update
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isStarred: !currentStatus } : e));
    try {
      await toggleStarService(id, !currentStatus);
    } catch (err) {
      console.error(err);
      // Revert on fail
      setEmails(prev => prev.map(e => e.id === id ? { ...e, isStarred: currentStatus } : e));
    }
  };

  const toggleImportant = async (id, currentStatus) => {
    // Optimistic update
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isImportant: !currentStatus } : e));
    try {
      await toggleImportantService(id, !currentStatus);
    } catch (err) {
      console.error(err);
      // Revert on fail
      setEmails(prev => prev.map(e => e.id === id ? { ...e, isImportant: currentStatus } : e));
    }
  };

  const refreshEmails = () => {
    // Also refresh unread count
    getUnreadCount().then(setUnreadCount).catch(console.error);
    fetchEmails(false);
  };

  return {
    isConfigured,
    isInitializing,
    unreadCount,
    emails,
    isLoadingEmails,
    isLoadingMore,
    hasMore,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    refreshEmails,
    loadMore,
    markAllAsRead,
    toggleStar,
    toggleImportant,
    error,
    setUnreadCount,
    setEmails // Exposing setEmails to allow optimistic UI updates
  };
};
