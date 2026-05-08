import { useState, useEffect, useMemo } from 'react';

/**
 * Hook สำหรับจัดการการค้นหา (Search), การกรอง (Filter) และการทำ Infinite Scroll
 * แยกออกมาจาก Master Hook เพื่อจัดการเรื่อง UI Logic โดยเฉพาะ
 */
export const useCustomerFilters = (customers) => {
  // ==========================================
  // 1. States สำหรับการควบคุม UI
  // ==========================================
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); 
  const [visibleCount, setVisibleCount] = useState(21); // Lazy Loading (หน้าละ 21 รายการ)

  // ==========================================
  // 2. Logic การกรองข้อมูล (Search Filtering)
  // ==========================================
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;

    const lowercasedSearch = searchTerm.toLowerCase();
    return customers.filter(c => 
      (c.customerCode && c.customerCode.toLowerCase().includes(lowercasedSearch)) ||
      (c.accountName && c.accountName.toLowerCase().includes(lowercasedSearch)) ||
      (c.contactName && c.contactName.toLowerCase().includes(lowercasedSearch)) ||
      (c.phone && c.phone.includes(lowercasedSearch)) ||
      (c.id && c.id.toLowerCase().includes(lowercasedSearch))
    );
  }, [searchTerm, customers]);

  // Reset pagination เมื่อมีการค้นหาใหม่
  useEffect(() => {
    setVisibleCount(21);
  }, [searchTerm]);

  // ==========================================
  // 3. Handlers สำหรับ UI Events
  // ==========================================
  
  // จัดการการเลื่อน Scroll เพื่อโหลดข้อมูลเพิ่ม (Infinite Scroll)
  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    // เมื่อเลื่อนถึงเกือบขอบล่าง (เหลือ 100px)
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (visibleCount < filteredCustomers.length) {
        setVisibleCount(prev => prev + 21);
      }
    }
  };

  // ==========================================
  // 4. Utility สำหรับการกรองประวัติ (ใช้ใน Detail Panel)
  // ==========================================
  const filterDataByDate = (dataArray, dateFilterType) => {
    if (!dataArray || dateFilterType === 'all') return dataArray || [];
    
    const now = new Date();
    return dataArray.filter(item => {
      if (!item.createdAt) return false;
      
      // แปลง Timestamp (Firestore/Number) เป็น Date Object
      const itemDate = typeof item.createdAt === 'number' 
        ? new Date(item.createdAt) 
        : (item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt));
      
      if (dateFilterType === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return itemDate >= thirtyDaysAgo;
      }
      if (dateFilterType === 'thisMonth') {
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  return {
    state: {
      searchTerm,
      dateFilter,
      visibleCount,
      filteredCustomers
    },
    actions: {
      setSearchTerm,
      setDateFilter,
      setVisibleCount,
      handleScroll
    },
    utils: {
      filterDataByDate
    }
  };
};