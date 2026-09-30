import { useState, useEffect, useMemo } from 'react';

export const useCustomerFilters = (customers) => {
  // 1. States (ลำดับ Hooks ต้องคงที่ ห้ามสลับ เพื่อป้องกันบั๊ก React)
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); 
  const [quickFilter, setQuickFilter] = useState('all'); // 💎 ตัวกรองอัจฉริยะ (Smart Filter)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 21;
  const [visibleCount, setVisibleCount] = useState(21);

  // 2. Logic การกรองและจัดเรียงข้อมูลตาม [บิลล่าสุด] ใหม่สุดขึ้นบนสุด
  const filteredCustomers = useMemo(() => {
    let result = Array.isArray(customers) ? [...customers] : [];

    // 💎 กรองด้วยปุ่มลัด (Smart Filter)
    if (quickFilter === 'has_wallet') result = result.filter(c => (c.walletBalance || 0) > 0);
    else if (quickFilter === 'is_partner') result = result.filter(c => (c.role || '').toLowerCase().includes('partner') || (c.rank || '').toLowerCase().includes('partner'));
    else if (quickFilter === 'has_tax') result = result.filter(c => c.hasTaxInfo === true);
    else if (quickFilter === 'has_points') result = result.filter(c => (c.creditPoints || 0) > 0 || (c.totalAccumulatedPoints || 0) > 0);

    // 📅 กรองด้วยช่วงเวลา (Date Filter)
    if (dateFilter && dateFilter !== 'all') {
      const now = Date.now();
      const cutoff30d = now - 30 * 24 * 60 * 60 * 1000;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      result = result.filter(item => {
        const orderDate = item.lastOrderDate || item.createdAt;
        if (!orderDate) return false;
        const itemTimestamp = typeof orderDate === 'number' 
          ? orderDate 
          : (orderDate.toDate ? orderDate.toDate().getTime() : new Date(orderDate).getTime());
        if (isNaN(itemTimestamp)) return false;

        if (dateFilter === '30days') return itemTimestamp >= cutoff30d;
        if (dateFilter === 'thisMonth') {
          const d = new Date(itemTimestamp);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }
        return true;
      });
    }

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

    // 🏆 จัดเรียง: ดันผู้ที่มีบิลล่าสุดใหม่สุดขึ้นข้างบนเสมอ
    result.sort((a, b) => {
      const lastOrderA = Number(a.lastOrderDate || a.stats?.lastOrderDate || a.stats?.lastPurchaseDate || 0);
      const lastOrderB = Number(b.lastOrderDate || b.stats?.lastOrderDate || b.stats?.lastPurchaseDate || 0);
      if (lastOrderB !== lastOrderA) return lastOrderB - lastOrderA;

      const salesA = Number(a.sales30Days || a.stats?.sales30Days || a.stats?.monthlySales || a.stats?.totalSales || 0);
      const salesB = Number(b.sales30Days || b.stats?.sales30Days || b.stats?.monthlySales || b.stats?.totalSales || 0);
      if (salesB !== salesA) return salesB - salesA;

      return (b.walletBalance || 0) - (a.walletBalance || 0);
    });

    return result;
  }, [searchTerm, quickFilter, dateFilter, customers]);

  // คำนวณจำนวนหน้าทั้งหมด (Total Pages)
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  }, [filteredCustomers.length, pageSize]);

  // ตัดข้อมูล 21 รายชื่อที่จะแสดงผลในหน้าปัจจุบัน
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(startIndex, startIndex + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // Reset หน้าปัจจุบันเป็น 1 เมื่อเปลี่ยนคำค้นหาหรือตัวกรอง
  useEffect(() => {
    setCurrentPage(1);
    setVisibleCount(21);
  }, [searchTerm, quickFilter, dateFilter]);

  const goToPage = (page) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(targetPage);
  };

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 100 && visibleCount < filteredCustomers.length) {
      setVisibleCount(prev => prev + 21);
    }
  };

  const filterDataByDate = (dataArray, dateFilterType) => {
    if (!dataArray || dateFilterType === 'all') return dataArray || [];
    const now = Date.now();
    const cutoff30d = now - 30 * 24 * 60 * 60 * 1000;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return dataArray.filter(item => {
      const orderDate = item.lastOrderDate || item.createdAt;
      if (!orderDate) return false;
      const itemTimestamp = typeof orderDate === 'number' 
        ? orderDate 
        : (orderDate.toDate ? orderDate.toDate().getTime() : new Date(orderDate).getTime());
      if (isNaN(itemTimestamp)) return false;

      if (dateFilterType === '30days') return itemTimestamp >= cutoff30d;
      if (dateFilterType === 'thisMonth') {
        const d = new Date(itemTimestamp);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }
      return true;
    });
  };

  return {
    state: { 
      searchTerm, 
      dateFilter, 
      quickFilter, 
      visibleCount, 
      filteredCustomers,
      currentPage,
      pageSize,
      totalPages,
      paginatedCustomers
    },
    actions: { 
      setSearchTerm, 
      setDateFilter, 
      setQuickFilter, 
      setVisibleCount, 
      handleScroll,
      setCurrentPage,
      goToPage,
      nextPage,
      prevPage
    },
    utils: { filterDataByDate }
  };
};