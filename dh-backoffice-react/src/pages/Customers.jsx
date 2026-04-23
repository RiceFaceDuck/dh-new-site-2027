import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { userService } from '../firebase/userService';
import { todoService } from '../firebase/todoService';
import { 
  Search, Eye, CreditCard, X, FileText, AlertTriangle, 
  UserPlus, MapPin, Phone, Building2, Calendar, Filter, 
  Loader2, Edit2, Save, Upload, RefreshCw, Truck, Trash2,
  TrendingUp, TrendingDown, Crown, Shield, Award, Copy
} from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('Staff');
  
  // Lazy Loading & Pagination
  const [visibleCount, setVisibleCount] = useState(21);
  
  // Global Filters
  const [dateFilter, setDateFilter] = useState('all'); 

  // Split View & History
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState({ orders: [], claims: [], loading: false });

  // Modal: Create New Customer
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customerCode: '', accountName: '', contactName: '', phone: '', email: '', address: '',
    logisticProvider: '', logisticNote: '', rank: 'Customer', accountRank: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Mode & Quick Edit
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isQuickSaving, setIsQuickSaving] = useState(false); // ✨ สถานะสำหรับ Quick-Rank

  const staffRoles = ['พนักงานทั่วไป', 'ช่าง', 'พนักงานแพ็ค', 'บัญชี', 'แอดมิน', 'ผู้จัดการ', 'เจ้าของ', 'Admin', 'Manager', 'Owner'];
  const managerRoles = ['Admin', 'Manager', 'Owner', 'แอดมิน', 'ผู้จัดการ', 'เจ้าของ'];
  const CACHE_KEY = 'dh_customers_data_cache';

  // โหลด Role ของพนักงานปัจจุบัน เพื่อเช็คสิทธิ์การลบ
  useEffect(() => {
    if (auth.currentUser) {
      userService.getUserProfile(auth.currentUser.uid).then(profile => {
        if (profile && profile.role) setCurrentUserRole(profile.role);
      });
    }
  }, []);

  const processCustomerData = (usersData) => {
    const customersOnly = usersData.filter(user => !user.role || !staffRoles.includes(user.role));
    customersOnly.sort((a, b) => {
      const salesA = a.stats?.totalSales || 0;
      const salesB = b.stats?.totalSales || 0;
      return salesB - salesA; 
    });

    setCustomers(customersOnly);
    setFilteredCustomers(customersOnly);
  };

  const fetchCustomers = async (useCache = true) => {
    if (!useCache) setIsRefreshing(true);
    try {
      if (useCache) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          processCustomerData(parsed);
          setLoading(false);
        }
      }

      if (!useCache || !localStorage.getItem(CACHE_KEY)) {
        const q = query(collection(db, 'users'));
        const snapshot = await getDocs(q);
        const usersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt,
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : data.updatedAt,
          };
        });

        localStorage.setItem(CACHE_KEY, JSON.stringify(usersData));
        processCustomerData(usersData);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers(true);
  }, []);

  useEffect(() => {
    setVisibleCount(21);
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = customers.filter(c => 
      (c.customerCode && c.customerCode.toLowerCase().includes(lowercasedSearch)) ||
      (c.accountName && c.accountName.toLowerCase().includes(lowercasedSearch)) ||
      (c.contactName && c.contactName.toLowerCase().includes(lowercasedSearch)) ||
      (c.phone && c.phone.includes(lowercasedSearch)) ||
      (c.id.toLowerCase().includes(lowercasedSearch))
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (visibleCount < filteredCustomers.length) {
        setVisibleCount(prev => prev + 21);
      }
    }
  };

  const handleSelectCustomer = async (customer) => {
    const targetId = customer.uid || customer.id;
    const currentSelectedId = selectedCustomer?.uid || selectedCustomer?.id;

    if (currentSelectedId === targetId) {
      setSelectedCustomer(null);
      return;
    }

    setSelectedCustomer(customer);
    setIsEditMode(false);
    setCustomerHistory({ orders: [], claims: [], loading: true });

    try {
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(ordersRef, where('userId', '==', targetId));
      const ordersSnapshot = await getDocs(ordersQuery);
      
      const claimsRef = collection(db, 'claims');
      const claimsQuery = query(claimsRef, where('uid', '==', targetId));
      const claimsSnapshot = await getDocs(claimsQuery);

      const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const claimsData = claimsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setCustomerHistory({ orders: ordersData, claims: claimsData, loading: false });
    } catch (error) {
      console.error("Error fetching history:", error);
      setCustomerHistory({ orders: [], claims: [], loading: false });
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.accountName.trim()) {
      alert("กรุณากรอกชื่อร้าน/ชื่อบริษัท");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...newCustomer,
        customerCode: newCustomer.customerCode.trim() || `CUST-${Math.floor(Math.random() * 10000)}`
      };
      
      await userService.createManualCustomer(payload);
      setIsAddModalOpen(false);
      setNewCustomer({ 
        customerCode: '', accountName: '', contactName: '', phone: '', email: '', address: '', 
        logisticProvider: '', logisticNote: '', rank: 'Customer', accountRank: '' 
      });
      fetchCustomers(false); 
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditCustomer = () => {
    setEditFormData({
      customerCode: selectedCustomer.customerCode || '',
      accountName: selectedCustomer.accountName || selectedCustomer.displayName || '',
      contactName: selectedCustomer.contactName || selectedCustomer.firstName || '',
      phone: selectedCustomer.phone || selectedCustomer.phoneNumber || '',
      address: selectedCustomer.address || '',
      logisticProvider: selectedCustomer.logisticProvider || '',
      logisticNote: selectedCustomer.logisticNote || '',
      rank: selectedCustomer.rank || selectedCustomer.role || 'Customer',
      accountRank: selectedCustomer.accountRank || '' 
    });
    setIsEditMode(true);
  };

  const saveCustomerEdit = async () => {
    if (!editFormData.accountName.trim()) {
      alert("กรุณากรอกชื่อร้าน/ชื่อบริษัท");
      return;
    }
    
    setIsSavingEdit(true);
    try {
      const targetId = selectedCustomer.uid || selectedCustomer.id;
      
      const payloadToUpdate = { ...editFormData };
      if (payloadToUpdate.rank) {
        payloadToUpdate.role = payloadToUpdate.rank; 
      }

      await userService.updateCustomerProfile(targetId, payloadToUpdate);
      
      const updatedCustomer = { ...selectedCustomer, ...payloadToUpdate };
      setSelectedCustomer(updatedCustomer);
      
      const updateList = (list) => list.map(c => c.id === targetId ? updatedCustomer : c);
      setCustomers(updateList(customers));
      setFilteredCustomers(updateList(filteredCustomers));
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(updateList(customers)));
      
      setIsEditMode(false);
    } catch (error) {
      alert("บันทึกข้อมูลล้มเหลว กรุณาลองใหม่");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ✨ ลูกเล่นเสริม: เปลี่ยนสิทธิ์ลูกค้ารวดเร็ว (ผสานจาก Members.jsx)
  const handleQuickRankChange = async (newRank) => {
    if (!selectedCustomer) return;
    setIsQuickSaving(true);
    try {
      const targetId = selectedCustomer.uid || selectedCustomer.id;
      
      await userService.updateCustomerProfile(targetId, { rank: newRank, role: newRank });
      
      const updatedCustomer = { ...selectedCustomer, rank: newRank, role: newRank };
      setSelectedCustomer(updatedCustomer);
      
      const updateList = (list) => list.map(c => c.id === targetId ? updatedCustomer : c);
      setCustomers(updateList(customers));
      setFilteredCustomers(updateList(filteredCustomers));
      localStorage.setItem(CACHE_KEY, JSON.stringify(updateList(customers)));

    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเปลี่ยนระดับบัญชี");
    } finally {
      setIsQuickSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    const targetId = selectedCustomer.uid || selectedCustomer.id;
    const customerName = selectedCustomer.accountName || selectedCustomer.displayName || selectedCustomer.id;
    const isManager = managerRoles.includes(currentUserRole);

    if (isManager) {
      if (window.confirm(`⚠️ ยืนยันการลบลูกค้า: ${customerName} หรือไม่?\nการกระทำนี้จะลบข้อมูลออกจากระบบ และไม่สามารถกู้คืนได้`)) {
        try {
          await userService.deleteCustomer(targetId, customerName);
          
          setSelectedCustomer(null);
          const updateList = customers.filter(c => c.id !== targetId);
          setCustomers(updateList);
          setFilteredCustomers(updateList);
          localStorage.setItem(CACHE_KEY, JSON.stringify(updateList));
          
          alert('ลบข้อมูลลูกค้าเรียบร้อยแล้ว');
        } catch (error) {
          alert('เกิดข้อผิดพลาดในการลบข้อมูล');
        }
      }
    } else {
      if (window.confirm(`คุณไม่มีสิทธิ์ลบข้อมูลโดยตรง\n\nต้องการส่ง "คำขออนุมัติลบลูกค้า" (${customerName}) ไปยังผู้จัดการหรือไม่?`)) {
        try {
          await todoService.requestCustomerDeletion(selectedCustomer, auth.currentUser.uid);
          alert('✅ ส่งคำขออนุมัติลบลูกค้า ไปยังคิวงาน (To-do) ของผู้จัดการเรียบร้อยแล้ว');
        } catch (error) {
          alert('เกิดข้อผิดพลาดในการส่งคำขอ');
        }
      }
    }
  };

  const filterDataByDate = (dataArray, dateFilterType) => {
    if (dateFilterType === 'all') return dataArray;
    const now = new Date();
    return dataArray.filter(item => {
      if (!item.createdAt) return false;
      const itemDate = typeof item.createdAt === 'number' ? new Date(item.createdAt) : (item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt));
      
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

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = typeof timestamp === 'number' ? new Date(timestamp) : (timestamp.toDate ? timestamp.toDate() : new Date(timestamp));
    return date.toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  const displayOrders = filterDataByDate(customerHistory.orders, dateFilter)
    .sort((a, b) => {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.toMillis() || 0);
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.toMillis() || 0);
      return timeB - timeA;
    });
  const displayClaims = filterDataByDate(customerHistory.claims, dateFilter)
    .sort((a, b) => {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.toMillis() || 0);
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.toMillis() || 0);
      return timeB - timeA;
    });
  
  const dynamicTotalSales = displayOrders.reduce((sum, order) => sum + (order.totalAmount || order.netTotal || 0), 0);

  if (loading && customers.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-dh-accent mb-4" />
        <p className="text-dh-muted font-medium">กำลังโหลดข้อมูลลูกค้าจากศูนย์บัญชาการ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10 sm:p-2 min-h-[calc(100vh-80px)] text-dh-main">
      
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-dh-surface p-5 rounded-2xl shadow-dh-card border border-dh-border relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-dh-accent-light rounded-xl flex items-center justify-center text-dh-accent border border-dh-accent/20 shrink-0">
            <Building2 size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none text-dh-main">Customer Intelligence</h1>
            <p className="text-dh-muted text-xs mt-1 flex items-center gap-2 font-medium">
              ศูนย์รวมรายชื่อลูกค้า B2B / Partner ทั้งหมด
              <button onClick={() => fetchCustomers(false)} className={`text-dh-accent hover:text-dh-accent-hover bg-dh-accent-light/50 hover:bg-dh-accent-light p-1 rounded-md transition-colors ${isRefreshing ? 'animate-spin' : ''}`} title="ดึงข้อมูลล่าสุด">
                <RefreshCw size={12} />
              </button>
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="flex items-center bg-dh-base border border-dh-border rounded-xl px-3 py-1.5 h-[40px] focus-within:border-dh-accent transition-colors">
            <Filter size={16} className="text-dh-muted mr-2 shrink-0" />
            <select 
              className="text-sm bg-transparent outline-none text-dh-main font-bold cursor-pointer w-full"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              title="กรองประวัติการสั่งซื้อ"
            >
              <option value="all">ดูประวัติ: ตลอดกาล</option>
              <option value="30days">ดูประวัติ: 30 วันย้อนหลัง</option>
              <option value="thisMonth">ดูประวัติ: เฉพาะเดือนนี้</option>
            </select>
          </div>

          <div className="relative group flex-1 md:flex-none">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dh-muted group-focus-within:text-dh-accent transition-colors">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="pl-10 pr-4 py-2 h-[40px] bg-dh-base border border-dh-border rounded-xl w-full md:w-64 outline-none focus:ring-1 focus:ring-dh-accent focus:border-dh-accent transition-all font-medium text-sm text-dh-main placeholder:text-dh-muted"
              placeholder="ค้นหารหัส, ชื่อร้าน, เบอร์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => alert('ฟังก์ชันนำเข้าไฟล์ .xlsx แบบชุดกำลังอยู่ระหว่างการพัฒนา จะเปิดใช้งานในการอัปเดตครั้งหน้า')}
            className="flex items-center justify-center gap-2 bg-dh-base text-dh-main border border-dh-border h-[40px] px-4 rounded-xl hover:bg-dh-border transition-all font-bold text-sm"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">นำเข้า</span>
          </button>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-dh-accent text-white h-[40px] px-4 rounded-xl hover:bg-dh-accent-hover transition-all font-bold shadow-sm active:scale-95 text-sm"
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">เพิ่มลูกค้าใหม่</span>
          </button>
        </div>
      </div>

      <div className="flex gap-4 lg:gap-5 items-start relative">
        
        {/* 🎨 Main Customer Table (Left Panel) */}
        <div className={`bg-dh-surface rounded-2xl shadow-dh-card border border-dh-border overflow-hidden transition-all duration-300 ${selectedCustomer ? 'w-full lg:w-7/12 xl:w-8/12 hidden lg:block' : 'w-full'}`}>
          <div className="overflow-x-auto max-h-[calc(100vh-16rem)] custom-scrollbar" onScroll={handleScroll}>
            <table className="w-full text-left border-collapse">
              <thead className="bg-dh-base text-dh-muted text-[10px] font-extrabold uppercase tracking-wider border-b border-dh-border sticky top-0 z-20 backdrop-blur-md bg-opacity-90">
                <tr>
                  <th className="px-3 py-2.5 whitespace-nowrap w-28 min-w-[120px]">ID ลูกค้า</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">ชื่อร้าน / ผู้ติดต่อ</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">ยอดขาย (฿)</th>
                  <th className="px-3 py-2.5 text-center whitespace-nowrap">บิล (ใบ)</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">ยอดคืน (฿)</th>
                  <th className="px-3 py-2.5 text-center whitespace-nowrap">คืน (ชิ้น)</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Rank & Status</th>
                  <th className="px-3 py-2.5 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-16 text-center text-dh-muted bg-dh-base/50">
                      <div className="w-16 h-16 bg-dh-surface rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dh-border shadow-sm">
                        <Search size={28} className="text-dh-muted/50" />
                      </div>
                      <p className="font-bold text-base text-dh-main">ไม่พบข้อมูลลูกค้า</p>
                      <p className="text-xs mt-1">ลองเปลี่ยนคำค้นหา หรือเพิ่มลูกค้าใหม่</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.slice(0, visibleCount).map((customer) => (
                    <tr
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className={`group cursor-pointer transition-all duration-300 border-b border-dh-border last:border-none even:bg-dh-base/30 hover:bg-dh-accent-light/30 hover:shadow-[inset_4px_0_0_var(--dh-accent)] ${
                        selectedCustomer?.id === customer.id 
                          ? 'bg-dh-accent-light/50 relative z-10 shadow-[inset_4px_0_0_var(--dh-accent)]' 
                          : ''
                      }`}
                    >
                      <td className="px-3 py-2 align-middle">
                        <span className="text-[11px] font-mono font-bold text-dh-muted group-hover:text-dh-accent transition-colors bg-dh-base group-hover:bg-dh-surface border border-dh-border px-2 py-1 rounded-md shadow-sm inline-block whitespace-nowrap">
                          {customer.customerCode || customer.id.substring(0, 8).toUpperCase()}
                        </span>
                      </td>
                      
                      <td className="px-3 py-2 align-middle">
                        <div className="min-w-0 py-0.5">
                          <div className="font-bold text-[13px] truncate group-hover:text-dh-accent transition-colors" title={customer.accountName || customer.displayName}>
                            {customer.accountName || customer.displayName || 'ไม่มีชื่อร้าน'}
                          </div>
                          <div className="text-dh-muted text-[10px] mt-0.5 flex items-center gap-2 truncate font-medium group-hover:text-dh-main/80 transition-colors">
                            {customer.contactName && <span className="flex items-center gap-1 truncate"><UserPlus size={10} className="opacity-70 group-hover:text-dh-accent transition-colors"/> {customer.contactName}</span>}
                            {(customer.phone || customer.phoneNumber) && (
                              <span className="flex items-center gap-1 shrink-0"><Phone size={10} className="opacity-70 group-hover:text-dh-accent transition-colors"/> {customer.phone || customer.phoneNumber}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-3 py-2 text-right align-middle">
                        <div className={`font-black text-[13px] transition-colors ${customer.stats?.last30DaysSales > 0 ? 'text-green-600 dark:text-green-400 group-hover:text-green-500' : 'text-dh-muted group-hover:text-dh-main'}`}>
                          {(customer.stats?.last30DaysSales || 0) > 0 ? `฿${customer.stats.last30DaysSales.toLocaleString()}` : '-'}
                        </div>
                      </td>

                      <td className="px-3 py-2 text-center align-middle">
                        <div className={`text-[11px] font-bold transition-all duration-300 inline-block px-2 py-0.5 rounded-md ${customer.stats?.last30DaysBills > 0 ? 'bg-dh-base group-hover:bg-dh-accent-light border border-dh-border group-hover:border-dh-accent/30 text-dh-main group-hover:text-dh-accent shadow-sm' : 'text-dh-muted'}`}>
                          {customer.stats?.last30DaysBills || '-'}
                        </div>
                      </td>
                      
                      <td className="px-3 py-2 text-right align-middle">
                        <div className={`font-black text-[13px] transition-colors ${customer.stats?.last30DaysReturnAmount > 0 ? 'text-red-500 group-hover:text-red-400' : 'text-dh-muted group-hover:text-dh-main'}`}>
                          {(customer.stats?.last30DaysReturnAmount || 0) > 0 ? `฿${customer.stats.last30DaysReturnAmount.toLocaleString()}` : '-'}
                        </div>
                      </td>

                      <td className="px-3 py-2 text-center align-middle">
                        {customer.stats?.last30DaysReturns > 0 ? (
                          <div className="text-[10px] font-bold text-red-600 dark:text-red-400 inline-block bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-1.5 py-0.5 rounded shadow-sm group-hover:bg-red-100 dark:group-hover:bg-red-500/20 transition-colors">
                            {customer.stats.last30DaysReturns}
                          </div>
                        ) : (
                          <div className="text-[11px] font-bold text-dh-muted group-hover:text-dh-main transition-colors">-</div>
                        )}
                      </td>

                      <td className="px-3 py-2 align-middle">
                        <div className="flex flex-wrap gap-1.5 max-w-[160px]">
                          <span className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] rounded uppercase font-bold tracking-wide border transition-colors ${
                            customer.rank === 'VIP' || customer.role === 'VIP' ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/50 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50' :
                            customer.rank === 'Partner' || customer.role === 'Partner' ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700/50 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50' :
                            'bg-dh-base text-dh-muted border-dh-border group-hover:bg-dh-surface'
                          }`}>
                            {customer.rank || customer.role || 'CUST'}
                          </span>
                          
                          {customer.partnerCredit > 0 && (
                            <span className="text-[9px] font-bold text-dh-accent bg-dh-accent-light px-1.5 py-0.5 rounded border border-dh-accent/20 flex items-center gap-1 group-hover:bg-dh-accent group-hover:text-white transition-colors">
                              {customer.partnerCredit} CR
                            </span>
                          )}
                          {customer.logisticProvider && (
                            <span className="text-[9px] font-bold text-dh-muted bg-dh-base px-1.5 py-0.5 rounded border border-dh-border flex items-center gap-1 group-hover:bg-dh-surface transition-colors">
                              <Truck size={8} className="opacity-70 group-hover:text-dh-accent"/> {customer.logisticProvider}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center align-middle">
                        <div className={`p-1.5 inline-flex rounded-lg transition-all duration-300 ${selectedCustomer?.id === customer.id ? 'text-dh-accent bg-dh-accent-light' : 'text-dh-muted group-hover:text-dh-accent group-hover:bg-dh-surface shadow-sm border border-transparent group-hover:border-dh-accent/20'}`}>
                          <Eye size={14} className="group-hover:scale-110 transition-transform" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {visibleCount < filteredCustomers.length && (
                  <tr>
                    <td colSpan="8" className="p-0">
                      <button onClick={() => setVisibleCount(prev => prev + 21)} className="w-full py-2.5 text-center text-xs text-dh-accent bg-dh-base hover:bg-dh-surface hover:text-dh-accent-hover font-bold transition-colors border-t border-dh-border shadow-inner">
                        โหลดรายชื่อเพิ่มเติม... ({visibleCount} / {filteredCustomers.length})
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🎨 Split View: Right Panel */}
        {selectedCustomer && (
          <div className="w-full lg:w-5/12 xl:w-4/12 bg-dh-surface rounded-2xl shadow-dh-elevated border border-dh-border flex flex-col max-h-[calc(100vh-8rem)] sticky top-6 z-30 animate-in slide-in-from-right-8 lg:slide-in-from-none overflow-hidden">
            
            {/* Header นามบัตร */}
            <div className="p-4 border-b border-dh-border bg-dh-surface relative shrink-0 z-10">
              <div className="absolute top-0 left-0 w-full h-1 bg-dh-accent"></div>

              <div className="absolute top-3 right-3 flex gap-1">
                {!isEditMode && (
                  <>
                    <button 
                      onClick={handleDeleteCustomer}
                      className="p-1.5 text-dh-muted hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"
                      title={managerRoles.includes(currentUserRole) ? "ลบข้อมูลลูกค้า" : "ขออนุมัติลบลูกค้า"}
                    >
                      <Trash2 size={14} />
                    </button>
                    <button 
                      onClick={startEditCustomer}
                      className="p-1.5 text-dh-muted hover:bg-dh-base hover:text-dh-main rounded-lg transition-all"
                      title="แก้ไขข้อมูล"
                    >
                      <Edit2 size={14} />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setSelectedCustomer(null)} 
                  className="p-1.5 text-dh-muted hover:text-dh-main hover:bg-dh-base rounded-lg transition-all border border-transparent"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="pr-14 mt-1">
                {isEditMode ? (
                  <div className="space-y-2.5 pr-1 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">รหัสลูกค้า</label>
                        <input 
                          type="text" className="w-full text-sm p-1.5 bg-dh-base border border-dh-border rounded-lg outline-none focus:ring-1 focus:ring-dh-accent font-mono font-bold text-dh-main transition-all" 
                          value={editFormData.customerCode} onChange={(e) => setEditFormData({...editFormData, customerCode: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">ขนส่งประจำ</label>
                        <input 
                          type="text" className="w-full text-sm p-1.5 bg-dh-base border border-dh-border rounded-lg outline-none focus:ring-1 focus:ring-dh-accent transition-all text-dh-main" 
                          value={editFormData.logisticProvider} onChange={(e) => setEditFormData({...editFormData, logisticProvider: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">ชื่อร้าน / บริษัท</label>
                      <input 
                        type="text" className="w-full text-sm p-1.5 bg-dh-base border border-dh-border rounded-lg outline-none focus:ring-1 focus:ring-dh-accent transition-all font-bold text-dh-main" 
                        value={editFormData.accountName} onChange={(e) => setEditFormData({...editFormData, accountName: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 bg-dh-base p-2 rounded-xl border border-dh-border">
                      <div>
                        <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">ระดับบัญชี</label>
                        <select 
                          className="w-full text-sm p-1.5 bg-dh-surface border border-dh-border rounded-lg outline-none focus:ring-1 focus:ring-dh-accent cursor-pointer font-bold text-dh-main"
                          value={editFormData.rank}
                          onChange={(e) => setEditFormData({...editFormData, rank: e.target.value})}
                        >
                          <option value="Customer">Customer</option>
                          <option value="Partner">Partner</option>
                          <option value="VIP">VIP</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">ฉายา</label>
                        <input 
                          type="text" className="w-full text-sm p-1.5 bg-dh-surface border border-dh-border rounded-lg outline-none focus:ring-1 focus:ring-dh-accent font-bold text-dh-main" 
                          value={editFormData.accountRank} onChange={(e) => setEditFormData({...editFormData, accountRank: e.target.value})}
                          placeholder="เช่น แนะนำดี"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">ชื่อผู้ติดต่อ</label>
                        <input 
                          type="text" className="w-full text-sm p-1.5 bg-dh-base border border-dh-border rounded-lg outline-none focus:ring-1 focus:ring-dh-accent transition-all text-dh-main" 
                          value={editFormData.contactName} onChange={(e) => setEditFormData({...editFormData, contactName: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">เบอร์โทรศัพท์</label>
                        <input 
                          type="text" className="w-full text-sm p-1.5 bg-dh-base border border-dh-border rounded-lg outline-none focus:ring-1 focus:ring-dh-accent transition-all text-dh-main" 
                          value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">ที่อยู่จัดส่ง</label>
                      <textarea 
                        className="w-full text-sm p-1.5 bg-dh-base border border-dh-border rounded-lg outline-none focus:ring-1 focus:ring-dh-accent transition-all resize-none h-14 text-dh-main" 
                        value={editFormData.address} onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                      ></textarea>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setIsEditMode(false)} disabled={isSavingEdit} className="flex-1 bg-dh-base border border-dh-border text-dh-main py-1.5 rounded-lg text-sm font-bold hover:bg-dh-border transition-colors">
                        ยกเลิก
                      </button>
                      <button onClick={saveCustomerEdit} disabled={isSavingEdit} className="flex-[2] bg-dh-accent text-white py-1.5 rounded-lg text-sm font-bold hover:bg-dh-accent-hover flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70">
                        {isSavingEdit ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} บันทึก
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-[10px] font-mono font-bold text-dh-muted bg-dh-base border border-dh-border px-1.5 py-0.5 rounded-md">
                        {selectedCustomer.customerCode || selectedCustomer.id.substring(0,8)}
                      </div>
                      {selectedCustomer.accountRank && (
                        <span className="text-[10px] text-dh-muted font-bold flex items-center gap-1">
                          <Award size={10} className="text-dh-accent"/> {selectedCustomer.accountRank}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-black text-dh-main line-clamp-2 leading-tight tracking-tight mb-2">
                      {selectedCustomer.accountName || selectedCustomer.displayName || 'ลูกค้า'}
                    </h2>

                    {/* ✨ อัปเกรด: Smart Quick-Rank (แทนที่การแสดง Badge แบบธรรมดา) */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="relative group/rank inline-block">
                        {isQuickSaving ? (
                          <span className="px-2 py-0.5 text-[10px] rounded-md uppercase font-bold tracking-wide border bg-dh-base text-dh-muted flex items-center gap-1 shadow-sm">
                            <Loader2 size={10} className="animate-spin text-dh-accent"/> กำลังอัปเดต...
                          </span>
                        ) : (
                          <select
                            value={selectedCustomer.rank || selectedCustomer.role || 'Customer'}
                            onChange={(e) => handleQuickRankChange(e.target.value)}
                            className={`appearance-none cursor-pointer pr-6 px-2 py-0.5 text-[10px] rounded-md uppercase font-bold tracking-wide shadow-sm border outline-none hover:brightness-95 transition-all ${
                              (selectedCustomer.rank || selectedCustomer.role) === 'Partner' ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700/50' :
                              (selectedCustomer.rank || selectedCustomer.role) === 'VIP' ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/50' :
                              'bg-dh-base text-dh-muted border-dh-border'
                            }`}
                            title="คลิกเพื่อเปลี่ยนระดับบัญชี"
                          >
                            <option value="Customer">CUSTOMER</option>
                            <option value="Partner">PARTNER</option>
                            <option value="VIP">VIP</option>
                          </select>
                        )}
                        {!isQuickSaving && (
                          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover/rank:opacity-100 transition-opacity">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 mt-3">
                      <div className="flex flex-wrap items-center gap-1.5 text-sm text-dh-main">
                        <div className="flex items-center justify-between gap-1.5 font-medium bg-dh-base hover:bg-dh-border/50 px-2 py-1.5 rounded-lg border border-dh-border transition-colors flex-1">
                          <div className="flex items-center gap-1.5"><UserPlus size={14} className="text-dh-muted" /> <span className="truncate">{selectedCustomer.contactName || selectedCustomer.firstName || '-'}</span></div>
                        </div>
                        <div className="flex items-center justify-between gap-1.5 font-medium bg-dh-base hover:bg-dh-border/50 px-2 py-1.5 rounded-lg border border-dh-border transition-colors flex-1">
                          <div className="flex items-center gap-1.5"><Phone size={14} className="text-dh-muted" /> <span className="truncate">{selectedCustomer.phone || selectedCustomer.phoneNumber || '-'}</span></div>
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-2 text-sm text-dh-main bg-dh-base hover:bg-dh-border/50 border border-dh-border p-2 rounded-xl transition-colors">
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-dh-muted shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-snug text-xs">{selectedCustomer.address || 'ไม่มีข้อมูลที่อยู่จัดส่ง'}</span>
                        </div>
                      </div>
                      
                      {(selectedCustomer.logisticProvider || selectedCustomer.logisticNote) && (
                        <div className="flex items-center gap-2 text-xs mt-1">
                          {selectedCustomer.logisticProvider && <span className="font-bold text-dh-main bg-dh-surface px-2 py-0.5 rounded border border-dh-border shadow-sm flex items-center gap-1"><Truck size={10} className="text-dh-accent"/> {selectedCustomer.logisticProvider}</span>}
                          {selectedCustomer.logisticNote && <span className="text-dh-muted font-medium truncate">{selectedCustomer.logisticNote}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Body Detail */}
            <div className="p-3 overflow-y-auto flex-1 custom-scrollbar bg-dh-base/50">
              
              {customerHistory.loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-dh-muted">
                  <div className="w-10 h-10 bg-dh-surface rounded-xl flex items-center justify-center border border-dh-border mb-3">
                    <Loader2 className="w-5 h-5 animate-spin text-dh-accent" />
                  </div>
                  <span className="text-xs font-bold tracking-wide">กำลังประมวลผล...</span>
                </div>
              ) : (
                <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-4">
                  
                  {/* การ์ดสถิติ */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-dh-surface rounded-xl border border-dh-border relative overflow-hidden group hover:border-dh-accent transition-colors">
                      <div className="absolute top-0 right-0 p-1.5 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={32} className="text-dh-main"/></div>
                      <p className="text-[9px] text-dh-muted font-bold uppercase tracking-wider mb-0.5 relative z-10">ยอดซื้อ ({dateFilter === 'all' ? 'รวม' : 'ที่กรอง'})</p>
                      <p className="text-lg font-black text-dh-main relative z-10 leading-tight">฿{dynamicTotalSales.toLocaleString()}</p>
                      <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 bg-dh-base text-dh-muted text-[9px] font-bold rounded border border-dh-border relative z-10">
                        <FileText size={8}/> {displayOrders.length} บิล
                      </div>
                    </div>
                    <div className="p-3 bg-dh-surface rounded-xl border border-dh-border relative overflow-hidden group hover:border-dh-accent transition-colors">
                      <div className="absolute top-0 right-0 p-1.5 opacity-5 group-hover:opacity-10 transition-opacity"><CreditCard size={32} className="text-dh-main"/></div>
                      <p className="text-[9px] text-dh-muted font-bold uppercase tracking-wider mb-0.5 relative z-10">Partner Credit</p>
                      <p className="text-lg font-black text-dh-accent relative z-10 leading-tight">{selectedCustomer.partnerCredit || selectedCustomer.accountCreditBalance || 0}</p>
                      <p className="text-[9px] text-dh-muted mt-1 font-medium relative z-10 truncate">ใช้ลดหย่อน/แลกสิทธิพิเศษ</p>
                    </div>
                  </div>

                  {/* กล่องประวัติการสั่งซื้อ */}
                  <div className="bg-dh-surface p-3 rounded-xl border border-dh-border">
                    <div className="flex items-center justify-between mb-2 border-b border-dh-border pb-2">
                      <h3 className="text-xs font-bold text-dh-main flex items-center gap-1.5">
                        <FileText size={12} className="text-dh-muted"/> ประวัติสั่งซื้อล่าสุด
                      </h3>
                      {dateFilter !== 'all' && <span className="text-[8px] font-bold bg-dh-base text-dh-muted px-1.5 py-0.5 rounded uppercase border border-dh-border">กรองอยู่</span>}
                    </div>
                    
                    <div className="space-y-1.5">
                      {displayOrders.length > 0 ? (
                        displayOrders.slice(0, 5).map(order => (
                          <div key={order.id} className="flex justify-between items-center p-2 bg-dh-base border border-dh-border rounded-lg hover:border-dh-accent/50 transition-colors">
                            <div>
                              <p className="font-bold text-dh-main text-[11px]">{order.orderId || order.id}</p>
                              <p className="text-[9px] text-dh-muted flex items-center gap-1 mt-0.5 font-medium">
                                <Calendar size={8} className="opacity-70"/> {formatDate(order.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-dh-main text-xs">฿{(order.totalAmount || order.netTotal || 0).toLocaleString()}</p>
                              <p className={`text-[8px] font-bold px-1 py-0.5 rounded mt-0.5 inline-block uppercase tracking-wider border ${
                                order.status === 'Completed' || order.orderStatus === 'Completed' ? 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400' : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400'
                              }`}>
                                {order.status || order.orderStatus || 'Pending'}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-4 bg-dh-base rounded-lg text-xs text-dh-muted border border-dashed border-dh-border">
                          ไม่มีประวัติบิลในช่วงเวลานี้
                        </div>
                      )}
                    </div>
                  </div>

                  {/* กล่องประวัติการเคลม */}
                  <div className="bg-dh-surface p-3 rounded-xl border border-dh-border">
                    <h3 className="text-xs font-bold text-dh-main flex items-center gap-1.5 mb-2 border-b border-dh-border pb-2">
                      <AlertTriangle size={12} className="text-dh-muted"/> ประวัติเคลม/คืนล่าสุด
                    </h3>
                    <div className="space-y-1.5">
                      {displayClaims.length > 0 ? (
                        displayClaims.slice(0, 3).map(claim => (
                          <div key={claim.id} className="flex justify-between items-center p-2 bg-red-500/5 border border-red-500/20 rounded-lg hover:border-red-500/30 transition-colors">
                            <div className="flex-1 pr-2">
                              <p className="font-bold text-dh-main text-[11px]">{claim.claimId || claim.id}</p>
                              <p className="text-[9px] text-dh-muted mt-0.5 font-medium truncate">{claim.issueDescription || 'ไม่มีระบุปัญหา'}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[8px] font-bold px-1 py-0.5 bg-dh-surface text-red-500 border border-red-500/20 rounded uppercase">
                                {claim.claimStatus || 'Pending'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-4 bg-dh-base rounded-lg text-xs text-dh-muted border border-dashed border-dh-border">
                          ไม่พบประวัติการส่งเคลม/คืน
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: เพิ่มลูกค้าใหม่ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-dh-surface rounded-3xl shadow-dh-elevated w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-dh-border">
            <div className="p-4 border-b border-dh-border flex justify-between items-center bg-dh-surface">
              <div>
                <h2 className="text-lg font-black text-dh-main">สร้างบัญชีลูกค้าใหม่</h2>
                <p className="text-[11px] text-dh-muted mt-0.5 font-medium">เพิ่มข้อมูลลูกค้า (B2B / Partner)</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-dh-muted hover:bg-dh-base hover:text-dh-main p-1.5 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCustomer} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar bg-dh-base">
              
              <div className="space-y-2.5 bg-dh-surface p-3 rounded-xl border border-dh-border shadow-sm">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1">รหัสลูกค้า</label>
                    <input 
                      type="text" placeholder="เช่น CUST-01"
                      className="w-full p-1.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-none text-sm bg-dh-base focus:bg-dh-surface transition-all font-mono text-dh-main placeholder:text-dh-muted/50"
                      value={newCustomer.customerCode} onChange={e => setNewCustomer({...newCustomer, customerCode: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1">ชื่อร้าน / ชื่อบริษัท <span className="text-red-500">*</span></label>
                    <input 
                      type="text" required placeholder="เช่น ซ่อมคอม เซียร์รังสิต"
                      className="w-full p-1.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-none text-sm bg-dh-base focus:bg-dh-surface transition-all font-bold text-dh-main placeholder:text-dh-muted/50"
                      value={newCustomer.accountName} onChange={e => setNewCustomer({...newCustomer, accountName: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1">ชื่อผู้ติดต่อ</label>
                    <input 
                      type="text" placeholder="เช่น ช่างเอก"
                      className="w-full p-1.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-none text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main placeholder:text-dh-muted/50"
                      value={newCustomer.contactName} onChange={e => setNewCustomer({...newCustomer, contactName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1">เบอร์โทรศัพท์</label>
                    <input 
                      type="text" placeholder="08X-XXX-XXXX"
                      className="w-full p-1.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-none text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main placeholder:text-dh-muted/50"
                      value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 bg-dh-surface p-3 rounded-xl border border-dh-border shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full bg-dh-accent"></div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1">ที่อยู่ (สำหรับการจัดส่ง)</label>
                    <textarea 
                      rows="2"
                      className="w-full p-1.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-none resize-none text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main placeholder:text-dh-muted/50"
                      value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 flex items-center gap-1"><Truck size={10} className="opacity-70"/> ขนส่งที่สะดวก</label>
                    <input 
                      type="text" placeholder="เช่น Kerry, Flash"
                      className="w-full p-1.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-none text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main placeholder:text-dh-muted/50"
                      value={newCustomer.logisticProvider} onChange={e => setNewCustomer({...newCustomer, logisticProvider: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1">หมายเหตุขนส่ง</label>
                    <input 
                      type="text" placeholder="เช่น ส่งด่วน, โทรแจ้ง"
                      className="w-full p-1.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-none text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main placeholder:text-dh-muted/50"
                      value={newCustomer.logisticNote} onChange={e => setNewCustomer({...newCustomer, logisticNote: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-2 flex gap-2.5 sticky bottom-0 bg-dh-base/90 backdrop-blur-sm p-1 rounded-lg">
                <button 
                  type="button" onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 bg-dh-surface border border-dh-border text-dh-main rounded-lg hover:bg-dh-border font-bold text-sm transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" disabled={isSubmitting}
                  className="flex-[2] py-2 bg-dh-accent text-white rounded-lg hover:bg-dh-accent-hover font-bold text-sm transition-all flex justify-center items-center gap-2 shadow-sm active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin"/> : <UserPlus size={14} strokeWidth={2.5}/>}
                  บันทึกลูกค้าระบบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}