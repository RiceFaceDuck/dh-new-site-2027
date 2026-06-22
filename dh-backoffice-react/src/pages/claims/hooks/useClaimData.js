import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { warrantyService } from '../../../firebase/warrantyService';

export function useClaimData() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warrantyConfig, setWarrantyConfig] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Load warranty config once
    warrantyService.getWarrantySettings().then(setWarrantyConfig).catch(console.error);

    const q = query(
      collection(db, 'todos'),
      where('type', 'in', ['CLAIM_APPROVAL', 'RETURN_APPROVAL', 'CANCEL_CLAIM_APPROVAL', 'CANCEL_RETURN_APPROVAL']),
      limit(300)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setRequests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
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
  }, [requests, searchTerm, activeTab, startDate, endDate]);

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
    stats,
    warrantyConfig
  };
}
