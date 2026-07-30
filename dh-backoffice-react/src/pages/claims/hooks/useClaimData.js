import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { warrantyService } from '../../../firebase/warrantyService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const STATUS_PRIORITY = {
  'pending_manager': 1,
  'waiting_item': 2,
  'processing': 3,
  'approved': 4,
  'completed': 4,
  'rejected': 5,
  'cancelled': 6,
};

export function useClaimData() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warrantyConfig, setWarrantyConfig] = useState(null);
  
  const initialSearch = new URLSearchParams(window.location.search).get('search') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [activeTab, setActiveTab] = useState('all'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 21;

  useEffect(() => {
    // Load warranty config once
    warrantyService.getWarrantySettings().then(setWarrantyConfig).catch(console.error);

    const q = query(
      collection(db, getCollectionPath('todos')),
      where('type', 'in', ['CLAIM_APPROVAL', 'RETURN_APPROVAL', 'CANCEL_CLAIM_APPROVAL', 'CANCEL_RETURN_APPROVAL']),
      orderBy('createdAt', 'desc'),
      limit(300)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, startDate, endDate]);

  const filteredRequests = useMemo(() => {
    const list = requests.filter(r => {
      const matchesSearch = 
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.payload?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.payload?.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.payload?.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const isCancelRequest = r.type.startsWith('CANCEL_');
      const matchesTab = 
        activeTab === 'all' ? true :
        activeTab === 'pending' ? (r.status === 'pending_manager' && !isCancelRequest) :
        activeTab === 'waiting' ? r.status === 'waiting_item' :
        activeTab === 'processing' ? r.status === 'processing' :
        activeTab === 'completed' ? (r.status === 'completed' || r.status === 'approved') :
        activeTab === 'rejected' ? r.status === 'rejected' : 
        activeTab === 'cancelled' ? (r.status === 'cancelled' || isCancelRequest) : true;

      let matchesDate = true;
      if (startDate && endDate) {
        const itemDate = r.createdAt?.toDate ? r.createdAt.toDate() : new Date();
        const start = new Date(startDate); start.setHours(0,0,0,0);
        const end = new Date(endDate); end.setHours(23,59,59,999);
        matchesDate = itemDate >= start && itemDate <= end;
      }

      return matchesSearch && matchesTab && matchesDate;
    });

    // Default Sort: Status Priority > Creation Time
    list.sort((a, b) => {
      const isCancelA = a.type?.startsWith('CANCEL_');
      const statusA = isCancelA ? 'cancelled' : a.status;
      const priorityA = STATUS_PRIORITY[statusA] ?? 99;

      const isCancelB = b.type?.startsWith('CANCEL_');
      const statusB = isCancelB ? 'cancelled' : b.status;
      const priorityB = STATUS_PRIORITY[statusB] ?? 99;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const getTime = (item) => {
        if (!item.createdAt) return 0;
        if (typeof item.createdAt.toMillis === 'function') return item.createdAt.toMillis();
        if (typeof item.createdAt.toDate === 'function') return item.createdAt.toDate().getTime();
        if (item.createdAt instanceof Date) return item.createdAt.getTime();
        return new Date(item.createdAt).getTime() || 0;
      };

      return getTime(b) - getTime(a);
    });

    return list;
  }, [requests, searchTerm, activeTab, startDate, endDate]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  }, [filteredRequests.length, pageSize]);

  const paginatedRequests = useMemo(() => {
    const validPage = Math.min(currentPage, totalPages);
    const start = (validPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, totalPages, pageSize]);

  const stats = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending_manager' && !r.type.startsWith('CANCEL_')).length,
      waiting: requests.filter(r => r.status === 'waiting_item').length,
      processing: requests.filter(r => r.status === 'processing').length,
      completed: requests.filter(r => r.status === 'completed' || r.status === 'approved').length,
      cancelled: requests.filter(r => r.status === 'cancelled' || r.type.startsWith('CANCEL_')).length,
      rejected: requests.filter(r => r.status === 'rejected').length
    };
  }, [requests]);

  return {
    requests,
    loading,
    searchTerm, setSearchTerm,
    activeTab, setActiveTab,
    startDate, setStartDate,
    endDate, setEndDate,
    selectedRequest, setSelectedRequest,
    isProcessing, setIsProcessing,
    filteredRequests,
    paginatedRequests,
    currentPage, setCurrentPage,
    totalPages,
    pageSize,
    stats,
    warrantyConfig
  };
}
