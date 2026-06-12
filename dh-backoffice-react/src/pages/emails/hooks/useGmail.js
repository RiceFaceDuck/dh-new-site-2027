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
  const [inboxPhase, setInboxPhase] = useState('unread'); // 'unread' or 'read'
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);

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
        setInboxPhase('unread');
      }
      setError(null);
      
      const currentStart = isLoadMore ? nextStart : 0;
      const currentPhase = isLoadMore ? inboxPhase : 'unread';
      
      const getQuery = (tab, phase) => {
        let q = '';
        switch (tab) {
          case 'inbox': q = phase === 'unread' ? 'in:inbox is:unread' : 'in:inbox is:read'; break;
          case 'read': q = 'in:inbox is:read'; break;
          case 'sent': q = 'in:sent'; break;
          case 'starred': q = 'is:starred'; break;
          case 'important': q = 'is:important'; break;
          default: q = 'in:inbox';
        }
        if (searchQuery.trim()) {
          q += ` ${searchQuery.trim()}`;
        }
        return q;
      };

      const result = await fetchEmailsList(currentStart, 20, getQuery(activeTab, currentPhase));
      let newEmails = result.emails;
      let newNextStart = result.nextStart;
      let newHasMore = result.hasMore;
      let newPhase = currentPhase;

      if (activeTab === 'inbox' && currentPhase === 'unread' && !result.hasMore) {
         newPhase = 'read';
         newNextStart = 0;
         newHasMore = true;
         
         if (newEmails.length < 10) {
            const readResult = await fetchEmailsList(0, 20 - newEmails.length, getQuery('inbox', 'read'));
            newEmails = [...newEmails, ...readResult.emails];
            newNextStart = readResult.nextStart;
            newHasMore = readResult.hasMore;
         }
      }

      if (isLoadMore) {
        setEmails(prev => [...prev, ...newEmails]);
      } else {
        setEmails(newEmails);
      }
      
      setNextStart(newNextStart);
      setHasMore(newHasMore);
      setInboxPhase(newPhase);
      
    } catch (err) {
      console.error("Error fetching gmail data:", err);
      setError(err.message || 'ไม่สามารถโหลดอีเมลได้');
    } finally {
      setIsLoadingEmails(false);
      setIsLoadingMore(false);
    }
  }, [isConfigured, activeTab, searchQuery, nextStart, inboxPhase]);

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
      setIsMarkingAllAsRead(true);
      await markAllAsReadService();
      setUnreadCount(0);
      setEmails(prev => prev.map(e => ({ ...e, isUnread: false })));
    } catch (err) {
      console.error(err);
    } finally {
      setIsMarkingAllAsRead(false);
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
    isMarkingAllAsRead,
    toggleStar,
    toggleImportant,
    error,
    setUnreadCount,
    setEmails // Exposing setEmails to allow optimistic UI updates
  };
};
