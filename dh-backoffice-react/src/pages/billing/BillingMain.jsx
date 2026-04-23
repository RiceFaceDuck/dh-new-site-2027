import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../firebase/inventoryService';
import { userService } from '../../firebase/userService';
import PosSystem from '../../components/billing/PosSystem';
import BillingDashboard from '../../components/billing/BillingDashboard';
import { Loader2 } from 'lucide-react';

export default function BillingMain() {
  const [view, setView] = useState('dashboard'); 
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🛒 ระบบพักบิล (Hold Cart State)
  const [cartTabs, setCartTabs] = useState([
    { 
      id: Date.now().toString(), 
      title: 'บิล 1', 
      items: [], 
      customer: null, 
      fulfillmentType: 'StorePickup',
      isVat: false,
      priceMode: 'wholesale',
      overallDiscount: 0,
      otherFeeAmount: 0,
      shippingFee: 0,
      vatType: 'exempt',
      receiptFormat: 'short',
      appliedPromoId: null,
      appliedPromoDetails: null,
      
      // ฟิลด์สำหรับ PaymentPanel
      paymentMethod: 'Cash',
      cashReceived: '',      
      bankAccount: 'KBANK',  
      slipImage: null,       
      transactionRef: '',    
      transferDateTime: '',  
      transferNote: '',      
      status: 'new'          
    }
  ]);
  const [activeTabId, setActiveTabId] = useState(cartTabs[0].id);

  // ✨ อัปเกรด: ระบบโหลดข้อมูลพร้อม Smart Session Caching (ประหยัด Reads สูงสุด)
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const CACHE_KEY_PROD = 'dh_cache_products';
        const CACHE_KEY_CUST = 'dh_cache_customers';
        const CACHE_EXPIRY = 1000 * 60 * 60; // อายุ Cache 1 ชั่วโมง
        const now = Date.now();

        // 🛡️ Helper สำหรับตรวจสอบ Cache
        const getValidCache = (key) => {
            try {
                const cachedStr = sessionStorage.getItem(key);
                if (cachedStr) {
                    const parsed = JSON.parse(cachedStr);
                    // ถ้ายังไม่หมดอายุ ให้ใช้ของเดิม
                    if (now - parsed.timestamp < CACHE_EXPIRY) return parsed.data;
                }
            } catch (e) {
                console.warn("⚠️ Cache parse error, refetching...", e);
            }
            return null;
        };

        const cachedProducts = getValidCache(CACHE_KEY_PROD);
        const cachedCustomers = getValidCache(CACHE_KEY_CUST);

        // 🧠 ส่ง Request เฉพาะข้อมูลที่ยังไม่มีใน Cache
        const fetchTasks = [
            cachedProducts ? Promise.resolve(cachedProducts) : inventoryService.getAllActiveProductsForSearch(),
            cachedCustomers ? Promise.resolve(cachedCustomers) : userService.getAllCustomers()
        ];

        const [productsData, customersData] = await Promise.all(fetchTasks);

        // 💾 บันทึกข้อมูลใหม่ลง Cache หากเพิ่งดึงมาจาก Firebase
        if (!cachedProducts && productsData) {
            sessionStorage.setItem(CACHE_KEY_PROD, JSON.stringify({ timestamp: now, data: productsData }));
        }
        if (!cachedCustomers && customersData) {
            sessionStorage.setItem(CACHE_KEY_CUST, JSON.stringify({ timestamp: now, data: customersData }));
        }

        setProducts(productsData || []);
        setCustomers(customersData || []);

      } catch (error) {
        console.error('🔥 Failed to load master data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMasterData();
  }, []);

  const handleResumeDraft = (draftBillData) => {
    const isAlreadyOpen = cartTabs.some(tab => tab.id === draftBillData.id);

    if (!isAlreadyOpen) {
      setCartTabs(prev => [...prev, {
        ...draftBillData,
        paymentMethod: draftBillData.paymentMethod || 'Cash',
        cashReceived: draftBillData.cashReceived || '',
        bankAccount: draftBillData.bankAccount || 'KBANK',
        slipImage: draftBillData.slipImage || null,
        transactionRef: draftBillData.transactionRef || '',
        transferDateTime: draftBillData.transferDateTime || '',
        transferNote: draftBillData.transferNote || '',
        status: draftBillData.status || 'draft'
      }]);
    }
    
    setActiveTabId(draftBillData.id);
    setView('pos');
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-dh-bg-base transition-colors duration-300">
        <div className="flex flex-col items-center gap-4 text-dh-text-muted">
          <Loader2 className="animate-spin text-dh-accent" size={48} />
          <p className="font-bold animate-pulse">กำลังเตรียมระบบ Billing & Vat%...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full overflow-hidden bg-dh-bg-base text-dh-text-main flex flex-col transition-colors duration-300">
      {view === 'dashboard' ? (
        <BillingDashboard
          onSwitchView={() => setView('pos')}
          onResumeDraft={handleResumeDraft} 
        />
      ) : (
        <PosSystem
          products={products}
          customers={customers}
          cartTabs={cartTabs}           
          setCartTabs={setCartTabs}
          activeTabId={activeTabId}
          setActiveTabId={setActiveTabId}
          onSwitchView={() => setView('dashboard')}
        />
      )}
    </div>
  );
}