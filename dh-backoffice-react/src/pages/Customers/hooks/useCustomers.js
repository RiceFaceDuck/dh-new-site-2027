import { useEffect } from 'react';
import { useCustomerData } from './useCustomerData';
import { useCustomerFilters } from './useCustomerFilters';
import { useCustomerActions } from './useCustomerActions';
import { useCustomerHistory } from './useCustomerHistory';
import { fetchOrderStatsForPage } from '../services/customerOrderStatsService';

/**
 * Main Hook (Facade) สำหรับระบบ Customers
 * ทำหน้าที่รวบรวม Hook ย่อยเข้าด้วยกัน 
 * และเป็นจุดเดียว (Single Point of Entry) ที่ UI จะเรียกใช้งาน
 */
export const useCustomers = () => {
  // 1. ดึงข้อมูลหลักและระบบ Cache
  const {
    customers,
    setCustomers,
    loading,
    isRefreshing,
    fetchCustomers,
    enrichCustomersWithOrderStats,
    CACHE_KEY
  } = useCustomerData();

  // 2. จัดการตัวกรองและการค้นหา (ส่ง customers เข้าไปให้กรอง)
  const filterHook = useCustomerFilters(customers);

  // 3. จัดการ Action เพิ่ม/ลด/แก้ไข/เปลี่ยนสิทธิ์ (ส่งตัวอัปเดตข้อมูลเข้าไป)
  const actionHook = useCustomerActions(
    customers,
    setCustomers,
    fetchCustomers,
    CACHE_KEY
  );

  // 4. จัดการประวัติการสั่งซื้อ/เคลม
  const historyHook = useCustomerHistory();

  // ==========================================
  // Orchestration: โหลดสถิติบิลและ 30D เฉพาะ 21 รายชื่อในหน้าปัจจุบัน
  // ==========================================
  useEffect(() => {
    const paginated = filterHook.state.paginatedCustomers;
    if (!paginated || paginated.length === 0 || loading) return;

    let isSubscribed = true;

    fetchOrderStatsForPage(paginated).then(statsMap => {
      if (isSubscribed && statsMap && Object.keys(statsMap).length > 0) {
        enrichCustomersWithOrderStats(statsMap);
      }
    }).catch(err => console.error("Failed to enrich page order stats:", err));

    return () => { isSubscribed = false; };
  }, [filterHook.state.currentPage, filterHook.state.paginatedCustomers.map(c => c.uid || c.id).join(','), loading, enrichCustomersWithOrderStats]);

  // จัดการเมื่อคลิกเลือกบรรทัดลูกค้า
  const handleSelectCustomer = (customer) => {
    const targetId = customer?.uid || customer?.id;
    const currentSelectedId = actionHook.state.selectedCustomer?.uid || actionHook.state.selectedCustomer?.id;

    // ถ้ากดซ้ำคนเดิม ให้ทำการยกเลิกการเลือก (Deselect) และล้างประวัติ
    if (currentSelectedId === targetId) {
      actionHook.actions.setSelectedCustomer(null);
      historyHook.actions.clearCustomerHistory();
      return;
    }

    // ถ้ากดเลือกคนใหม่
    actionHook.actions.setSelectedCustomer(customer); // 1. จำว่าเลือกใคร
    actionHook.actions.setIsEditMode(false);          // 2. ปิดโหมดแก้ไข (เผื่อเปิดค้างไว้)
    historyHook.actions.fetchCustomerHistory(customer); // 3. วิ่งไปโหลดประวัติแบบครอบคลุมทุก ID
  };

  // ==========================================
  // รวม State และ Actions ทั้งหมดส่งให้ Component นำไปใช้
  // ==========================================
  return {
    state: {
      customers,
      loading,
      isRefreshing,
      ...filterHook.state,
      ...actionHook.state,
      ...historyHook.state
    },
    actions: {
      fetchCustomers,
      handleSelectCustomer,
      ...filterHook.actions,
      ...actionHook.actions,
      ...historyHook.actions
    },
    utils: {
      ...filterHook.utils
    }
  };
};