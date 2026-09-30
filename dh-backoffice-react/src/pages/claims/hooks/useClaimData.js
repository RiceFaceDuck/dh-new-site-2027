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

// 🛡️ Quota Optimization: Module-level Cache to prevent N+1 re-fetching on navigation or re-render
const globalClaimFetchedUids = new Set();
const globalClaimProfiles = {};

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
  const [pageSize, setPageSize] = useState(21);

  const [serverRequests, setServerRequests] = useState([]);

  // 🚀 Server-Side Search for old claims (Only if client-side dataset is capped at limit(300) and not found in local snapshot)
  useEffect(() => {
    const term = searchTerm.trim();
    if (term.length < 4 || requests.length < 300) {
      setServerRequests([]);
      return;
    }

    // Check if locally already found matching items
    const termLower = term.toLowerCase();
    const hasLocalMatch = requests.some(r => {
      const p = r.payload || {};
      return (
        p.claimId?.toLowerCase().includes(termLower) ||
        p.returnId?.toLowerCase().includes(termLower) ||
        p.exchangeId?.toLowerCase().includes(termLower) ||
        p.orderId?.toLowerCase().includes(termLower) ||
        p.sku?.toLowerCase().includes(termLower)
      );
    });

    if (hasLocalMatch) {
      setServerRequests([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { getDocs } = await import('firebase/firestore');
        const colRef = collection(db, getCollectionPath('claims'));

        const q1 = query(colRef, where('payload.claimId', '==', term), limit(5));
        const q2 = query(colRef, where('payload.returnId', '==', term), limit(5));
        const q3 = query(colRef, where('payload.exchangeId', '==', term), limit(5));
        const q4 = query(colRef, where('payload.orderId', '==', term), limit(5));

        const snaps = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3), getDocs(q4)]);
        
        let results = [];
        snaps.forEach(snap => {
          results = [...results, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))];
        });

        const uniqueResults = results.filter((v,i,a) => a.findIndex(t => (t.id === v.id)) === i);
        setServerRequests(uniqueResults);
      } catch (err) {
        console.error("🔥 Error searching claims on server:", err);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [searchTerm, requests]);

  useEffect(() => {
    // Load warranty config once
    warrantyService.getWarrantySettings().then(setWarrantyConfig).catch(console.error);

    const q = query(
      collection(db, getCollectionPath('claims')),
      where('type', 'in', [
        'CLAIM_APPROVAL',
        'EXCHANGE_APPROVAL',
        'RETURN_APPROVAL',
        'CANCEL_CLAIM_APPROVAL',
        'CANCEL_EXCHANGE_APPROVAL',
        'CANCEL_RETURN_APPROVAL'
      ]),
      orderBy('createdAt', 'desc'),
      limit(300)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data);
      setLoading(false);
    }, (error) => {
      console.error("🔥 Claims Snapshot Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [customerProfiles, setCustomerProfiles] = useState(() => ({ ...globalClaimProfiles }));

  useEffect(() => {
    // Collect unique customer UIDs to batch-preload profiles for smart search & display
    const uids = [...new Set(requests.map(r => r.payload?.customerUid).filter(uid => uid && uid !== 'Walk-in' && !uid.includes('WALK-IN')))];
    
    const missingUids = uids.filter(uid => !globalClaimFetchedUids.has(uid));
    if (missingUids.length === 0) return;
    
    missingUids.forEach(uid => globalClaimFetchedUids.add(uid));

    import('firebase/firestore').then(({ collection, query, where, getDocs }) => {
      import('dh-shared/src/firebase/pathUtils').then(({ getCollectionPath }) => {
        const fetchBatch = async () => {
          const newProfiles = {};
          try {
            // chunk into batches of 30 for 'in' query (Firestore limit is 30)
            for (let i = 0; i < missingUids.length; i += 30) {
              const chunk = missingUids.slice(i, i + 30);
              const q = query(collection(db, getCollectionPath('users')), where('uid', 'in', chunk));
              const snap = await getDocs(q);
              snap.docs.forEach(doc => {
                 const data = doc.data();
                 newProfiles[doc.id] = data;
                 if (data.uid) newProfiles[data.uid] = data;
                 globalClaimProfiles[doc.id] = data;
                 if (data.uid) globalClaimProfiles[data.uid] = data;
              });
            }
            if (Object.keys(newProfiles).length > 0) {
              setCustomerProfiles(prev => ({ ...prev, ...newProfiles }));
            }
          } catch (error) {
            console.error("Error batch fetching users:", error);
          }
        };
        fetchBatch();
      });
    });
  }, [requests]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, startDate, endDate]);

  const filteredRequests = useMemo(() => {
    // ผสานข้อมูลจาก Server (ถ้ามี)
    const localIds = new Set(requests.map(r => r.id));
    const newFromServer = serverRequests.filter(r => !localIds.has(r.id));
    const combinedRequests = [...requests, ...newFromServer];

    const list = combinedRequests.filter(r => {
      const searchLower = searchTerm.trim().toLowerCase();
      let matchesSearch = true;
      
      if (searchLower) {
        const p = r.payload || {};
        const profile = customerProfiles[p.customerUid] || {};

        const searchTargets = [
          r.title,
          r.description,
          p.claimId,
          p.returnId,
          p.orderId,
          p.sku,
          p.productName,
          p.customerName,
          p.customerPhone,
          p.customerEmail,
          p.customerUid,
          p.symptomCode,
          p.symptomDetails,
          p.returnReason,
          p.returnDetails,
          p.trackingNo,
          p.requestedByName,
          profile.storeName,
          profile.accountName,
          profile.displayName,
          profile.firstName,
          profile.lastName,
          profile.name,
          profile.email,
          profile.phone,
          profile.tel,
          profile.mobile,
          profile.customerCode,
          profile.accountId
        ];

        matchesSearch = searchTargets.some(target => 
          target && String(target).toLowerCase().includes(searchLower)
        );
      }
        
      const matchesTab = 
        activeTab === 'all' ? true :
        activeTab === 'pending' ? r.status === 'pending_manager' :
        activeTab === 'waiting' ? r.status === 'waiting_item' :
        activeTab === 'processing' ? r.status === 'processing' :
        activeTab === 'completed' ? (r.status === 'completed' || r.status === 'approved') :
        activeTab === 'rejected' ? r.status === 'rejected' : 
        activeTab === 'cancelled' ? r.status === 'cancelled' : true;

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
      const priorityA = STATUS_PRIORITY[a.status] ?? 99;
      const priorityB = STATUS_PRIORITY[b.status] ?? 99;

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
  }, [requests, serverRequests, searchTerm, activeTab, startDate, endDate, customerProfiles]);

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
      pending: requests.filter(r => r.status === 'pending_manager').length,
      waiting: requests.filter(r => r.status === 'waiting_item').length,
      processing: requests.filter(r => r.status === 'processing').length,
      completed: requests.filter(r => r.status === 'completed' || r.status === 'approved').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length,
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
    pageSize, setPageSize,
    stats,
    warrantyConfig,
    customerProfiles
  };
}
