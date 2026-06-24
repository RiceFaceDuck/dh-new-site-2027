import { useState, useEffect, useMemo } from 'react';

export const useCustomerFilters = (customers) => {
  // 1. States (ลำดับ Hooks ต้องคงที่ ห้ามสลับ เพื่อป้องกันบั๊ก React)
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); 
  const [quickFilter, setQuickFilter] = useState('all'); // 💎 ตัวกรองอัจฉริยะ (Smart Filter)
  const [visibleCount, setVisibleCount] = useState(21);

  // 2. Logic การกรองข้อมูล
  const filteredCustomers = useMemo(() => {
    let result = customers;

    // 💎 กรองด้วยปุ่มลัด (Smart Filter)
    if (quickFilter === 'has_wallet') result = result.filter(c => (c.walletBalance || 0) > 0);
    else if (quickFilter === 'is_partner') result = result.filter(c => (c.role || '').toLowerCase().includes('partner') || (c.rank || '').toLowerCase().includes('partner'));
    else if (quickFilter === 'has_tax') result = result.filter(c => c.hasTaxInfo === true);
    else if (quickFilter === 'has_points') result = result.filter(c => (c.creditPoints || 0) > 0);

    // 🔍 กรองด้วย Text Search
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(c => 
        (c.accountId && c.accountId.toLowerCase().includes(lower)) ||
        (c.customerCode && c.customerCode.toLowerCase().includes(lower)) ||
        (c.accountName && c.accountName.toLowerCase().includes(lower)) ||
        (c.displayName && c.displayName.toLowerCase().includes(lower)) ||
        (c.contactName && c.contactName.toLowerCase().includes(lower)) ||
        (c.phone && c.phone.includes(lower)) ||
        (c.id && c.id.toLowerCase().includes(lower))
      );
    }
    return result;
  }, [searchTerm, quickFilter, customers]);

  // Reset pagination อัตโนมัติเมื่อเปลี่ยนตัวกรอง
  useEffect(() => setVisibleCount(21), [searchTerm, quickFilter]);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 100 && visibleCount < filteredCustomers.length) {
      setVisibleCount(prev => prev + 21);
    }
  };

  const filterDataByDate = (dataArray, dateFilterType) => {
    if (!dataArray || dateFilterType === 'all') return dataArray || [];
    const now = new Date();
    return dataArray.filter(item => {
      if (!item.createdAt) return false;
      const itemDate = typeof item.createdAt === 'number' ? new Date(item.createdAt) : (item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt));
      if (dateFilterType === '30days') return itemDate >= new Date(now.setDate(now.getDate() - 30));
      if (dateFilterType === 'thisMonth') return itemDate.getMonth() === new Date().getMonth() && itemDate.getFullYear() === new Date().getFullYear();
      return true;
    });
  };

  return {
    state: { searchTerm, dateFilter, quickFilter, visibleCount, filteredCustomers },
    actions: { setSearchTerm, setDateFilter, setQuickFilter, setVisibleCount, handleScroll },
    utils: { filterDataByDate }
  };
};