import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { billingQueryService } from '../../../firebase/billingQueryService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { ShoppingCart, RotateCcw, Wrench, DollarSign, FileText } from 'lucide-react';
import useGenerateSync from './useGenerateSync';

import { auth } from '../../../firebase/config';

// Helper: Ensure date is converted to a valid Date object for accurate sorting
function getValidDate(rawDate) {
  if (!rawDate) return new Date();
  if (typeof rawDate.toDate === 'function') return rawDate.toDate();
  if (rawDate instanceof Date) return rawDate;
  if (typeof rawDate === 'number') return new Date(rawDate);
  if (typeof rawDate === 'string') {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export default function useTransactionDetailsData() {
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') || 'all';

  const { changes, latestSnapshot, isCalculating, fetchChanges } = useGenerateSync();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(defaultType);
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  
  // Stably persist timeFilter & viewMode in localStorage per staffUid
  const [timeFilter, setTimeFilter] = useState(() => {
    const uid = auth.currentUser?.uid;
    const key = uid ? `tx_details_time_filter_${uid}` : 'tx_details_time_filter';
    return localStorage.getItem(key) || localStorage.getItem('tx_details_time_filter') || 'since_reset';
  });
  const [viewMode, setViewMode] = useState(() => {
    const uid = auth.currentUser?.uid;
    const key = uid ? `tx_details_view_mode_${uid}` : 'tx_details_view_mode';
    return localStorage.getItem(key) || localStorage.getItem('tx_details_view_mode') || 'grouped';
  });

  const [expandedBills, setExpandedBills] = useState({});

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    const key = uid ? `tx_details_time_filter_${uid}` : 'tx_details_time_filter';
    localStorage.setItem(key, timeFilter);
  }, [timeFilter]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    const key = uid ? `tx_details_view_mode_${uid}` : 'tx_details_view_mode';
    localStorage.setItem(key, viewMode);
  }, [viewMode]);

  const [realOrders, setRealOrders] = useState([]);
  const [realClaims, setRealClaims] = useState([]);

  // Sync selectedType from URL search param
  useEffect(() => {
    const typeFromUrl = searchParams.get('type');
    if (typeFromUrl) {
      setSelectedType(typeFromUrl);
    }
  }, [searchParams]);

  // Real-time listener for Orders & Claims from Firestore
  useEffect(() => {
    let isMounted = true;

    // Subscribe to recent orders for real order matching
    const unsubscribeOrders = billingQueryService.subscribeRecentOrders(100, null, (orders) => {
      if (isMounted) {
        setRealOrders(orders || []);
      }
    });

    // Fetch claims
    async function loadClaims() {
      try {
        const claimsRef = collection(db, getCollectionPath('claims'));
        const claimsSnap = await getDocs(query(claimsRef, limit(100)));
        const claimsList = claimsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (isMounted) {
          setRealClaims(claimsList);
        }
      } catch (err) {
        // Safe fallback
      }
    }
    loadClaims();

    return () => {
      isMounted = false;
      if (typeof unsubscribeOrders === 'function') unsubscribeOrders();
    };
  }, []);

  // Stabilize displayData from changes / latestSnapshot
  const displayData = useMemo(() => {
    return changes || latestSnapshot?.changes || {};
  }, [changes, latestSnapshot]);

  // 🚀 Snapshot-Driven Document Matching Engine
  // Binds real Firestore POS Orders / Claims directly onto the Snapshot changes
  const allTransactions = useMemo(() => {
    const records = [];
    const { increased = [], decreased = [], priceChanged = [], otherChanged = [], lastResetDate } = displayData;
    const baseTimeStr = lastResetDate ? new Date(lastResetDate).toLocaleString('th-TH') : new Date().toLocaleString('th-TH');
    const baseDate = lastResetDate ? getValidDate(lastResetDate) : new Date();

    // 1. Process Stock Decreased Items (Direct 1-to-1 Mapping from Snapshot)
    decreased.forEach((item, idx) => {
      const diff = (Number(item.newStock) || 0) - (Number(item.oldStock) || 0);

      // Search realOrders for a POS order created for this SKU
      const matchingOrder = realOrders.find(ord => {
        // 🚀 ป้องกันการจับคู่ออเดอร์เก่า (Old Order False Positive): ต้องเป็นออเดอร์ที่เกิดหลังจากการซิงค์รอบล่าสุดเท่านั้น
        const orderDateObj = getValidDate(ord.createdAt || ord.updatedAt || ord.date);
        if (orderDateObj < baseDate) return false;

        const statusLower = (ord.orderStatus || ord.status || '').toLowerCase();
        if (statusLower === 'cancelled' || statusLower === 'draft') return false;

        const itemsList = ord.items || ord.cart || ord.verifiedItems || ord.products || [];
        return Array.isArray(itemsList) && itemsList.some(i => 
          String(i.sku || i.id || i.productSku || i.code || '').trim().toLowerCase() === String(item.sku).trim().toLowerCase()
        );
      });

      // Search realClaims for an Exchange order sending out a replacement for this SKU
      const matchingExchangeClaim = !matchingOrder && realClaims.find(clm => {
        const claimDateObj = getValidDate(clm.createdAt || clm.updatedAt || clm.date);
        if (claimDateObj < baseDate) return false;

        const payload = clm.payload || {};
        const claimTypeRaw = String(clm.type || clm.claimType || payload.claimType || '').toUpperCase();
        const isExchange = claimTypeRaw.includes('EXCHANGE') || claimTypeRaw.includes('SWAP') || Boolean(payload.exchangeId);
        if (!isExchange) return false;

        const targetSku = String(payload.exchangeSku || payload.replacementSku || clm.exchangeSku || clm.sku || '').trim().toLowerCase();
        return targetSku === String(item.sku).trim().toLowerCase();
      });

      if (matchingOrder) {
        const realTxId = matchingOrder.orderId || matchingOrder.invoiceNo || matchingOrder.receiptNo || matchingOrder.id || `ORD-${idx+1}`;
        const customerName = matchingOrder.customerName || 
                            matchingOrder.customerInfo?.fullName || 
                            matchingOrder.customerInfo?.name || 
                            matchingOrder.customer?.name || 
                            matchingOrder.customer?.accountName || 
                            matchingOrder.customer?.displayName || 
                            matchingOrder.walkInName || 
                            (matchingOrder.walkInPhone ? `Walk-in (${matchingOrder.walkInPhone})` : null) || 
                            'ลูกค้าหน้าร้าน';

        const orderDateObj = getValidDate(matchingOrder.createdAt || matchingOrder.updatedAt || matchingOrder.date);

        records.push({
          id: `DEC-ORD-${matchingOrder.id}-${item.sku}-${idx}`,
          hasRealDocument: true,
          txId: realTxId,
          timestamp: orderDateObj.toLocaleString('th-TH'),
          dateObj: orderDateObj,
          sku: item.sku,
          name: item.name || 'ไม่ระบุชื่อสินค้า',
          type: 'decreased',
          eventCategory: 'sale',
          eventLabel: '🛒 ขายสินค้า (Order/Bill)',
          eventBadgeClass: 'bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          eventIcon: ShoppingCart,
          oldValue: item.oldStock,
          newValue: item.newStock,
          quantityDiff: Math.abs(diff),
          quantityDiffText: `${diff} ชิ้น`,
          customerName: customerName,
          platform: matchingOrder.channel || matchingOrder.platform || 'POS / ระบบขาย',
          details: matchingOrder.note || `บิลสั่งซื้อ ${realTxId}`
        });
      } else if (matchingExchangeClaim) {
        const payload = matchingExchangeClaim.payload || {};
        const realTxId = payload.exchangeId || payload.claimId || matchingExchangeClaim.claimId || matchingExchangeClaim.ticketNo || matchingExchangeClaim.id;
        const customerName = matchingExchangeClaim.customerName || matchingExchangeClaim.customerInfo?.fullName || 'ลูกค้าเปลี่ยนสินค้า';
        const claimDateObj = getValidDate(matchingExchangeClaim.createdAt || matchingExchangeClaim.updatedAt || matchingExchangeClaim.date);

        records.push({
          id: `DEC-EXC-${matchingExchangeClaim.id}-${item.sku}-${idx}`,
          hasRealDocument: true,
          txId: realTxId,
          timestamp: claimDateObj.toLocaleString('th-TH'),
          dateObj: claimDateObj,
          sku: item.sku,
          name: item.name || 'ไม่ระบุชื่อสินค้า',
          type: 'decreased',
          eventCategory: 'claim',
          eventLabel: '🔄 เปลี่ยนสินค้า (ตัดตัวใหม่)',
          eventBadgeClass: 'bg-purple-50 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          eventIcon: RotateCcw,
          oldValue: item.oldStock,
          newValue: item.newStock,
          quantityDiff: Math.abs(diff),
          quantityDiffText: `${diff} ชิ้น`,
          customerName: customerName,
          platform: 'Claim System',
          details: matchingExchangeClaim.reason || `เปลี่ยนสินค้า ${realTxId}`
        });
      } else {
        const docTxId = item.txId || item.transactionId || 'ไม่มีเอกสารอ้างอิง';
        records.push({
          id: `DEC-DIFF-${item.sku}-${idx}`,
          hasRealDocument: false,
          txId: docTxId,
          timestamp: item.timestamp || baseTimeStr,
          dateObj: item.timestamp ? getValidDate(item.timestamp) : baseDate,
          sku: item.sku,
          name: item.name || 'ไม่ระบุชื่อสินค้า',
          type: 'decreased',
          eventCategory: 'adjust',
          eventLabel: '📦 ตรวจพบลดลงระหว่างรอบ',
          eventBadgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          eventIcon: Wrench,
          oldValue: item.oldStock,
          newValue: item.newStock,
          quantityDiff: Math.abs(diff),
          quantityDiffText: `${diff} ชิ้น`,
          customerName: 'คลังสินค้า (ส่วนต่างตรวจนับ)',
          platform: 'Inventory Delta',
          details: item.details || 'ส่วนต่างสต็อกจากการตรวจนับ (ไม่มีบิลขายหรือเคลมผูก)'
        });
      }
    });

    // 2. Process Stock Increased Items (Direct 1-to-1 Mapping from Snapshot)
    increased.forEach((item, idx) => {
      const diff = (Number(item.newStock) || 0) - (Number(item.oldStock) || 0);

      const matchingClaim = realClaims.find(clm => {
        // 🚀 ป้องกันการจับคู่เคลมเก่า (Old Claim False Positive)
        const claimDateObj = getValidDate(clm.createdAt || clm.updatedAt || clm.date);
        if (claimDateObj < baseDate) return false;

        const payload = clm.payload || {};
        const claimSku = String(clm.sku || clm.productSku || clm.itemSku || payload.sku || '').trim().toLowerCase();
        return claimSku === String(item.sku).trim().toLowerCase();
      });

      if (matchingClaim) {
        const payload = matchingClaim.payload || {};
        const claimTypeRaw = String(matchingClaim.type || matchingClaim.claimType || payload.claimType || '').toUpperCase();
        const isReturn = claimTypeRaw.includes('RETURN') || Boolean(payload.returnId);
        const isExchange = claimTypeRaw.includes('EXCHANGE') || claimTypeRaw.includes('SWAP') || Boolean(payload.exchangeId);

        const realTxId = payload.returnId || payload.exchangeId || payload.claimId || matchingClaim.claimId || matchingClaim.ticketNo || matchingClaim.id || `CLM-${idx+1}`;
        const customerName = matchingClaim.customerName || matchingClaim.customerInfo?.fullName || matchingClaim.customerInfo?.name || 'ลูกค้าแจ้งเคลมสินค้า';
        const claimDateObj = getValidDate(matchingClaim.createdAt || matchingClaim.updatedAt || matchingClaim.date);

        let eventLabel = '🔄 เคลมสินค้า (รับคืนเข้าคลัง)';
        if (isReturn) {
          eventLabel = '🔄 รับคืนสินค้า (เข้าคลัง)';
        } else if (isExchange) {
          eventLabel = '🔄 เปลี่ยนสินค้า (รับของเดิมเข้า)';
        }

        records.push({
          id: `INC-CLM-${matchingClaim.id}-${item.sku}-${idx}`,
          hasRealDocument: true,
          txId: realTxId,
          timestamp: claimDateObj.toLocaleString('th-TH'),
          dateObj: claimDateObj,
          sku: item.sku,
          name: item.name || 'ไม่ระบุชื่อสินค้า',
          type: 'increased',
          eventCategory: 'claim',
          eventLabel: eventLabel,
          eventBadgeClass: 'bg-purple-50 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          eventIcon: RotateCcw,
          oldValue: item.oldStock,
          newValue: item.newStock,
          quantityDiff: diff,
          quantityDiffText: `+${diff} ชิ้น`,
          customerName: customerName,
          platform: isReturn ? 'Return System' : 'Claim System',
          details: matchingClaim.reason || payload.returnReason || `รายการ ${eventLabel} ${realTxId}`
        });
      } else {
        const docTxId = item.txId || item.transactionId || 'ไม่มีเอกสารอ้างอิง';
        records.push({
          id: `INC-DIFF-${item.sku}-${idx}`,
          hasRealDocument: false,
          txId: docTxId,
          timestamp: item.timestamp || baseTimeStr,
          dateObj: item.timestamp ? getValidDate(item.timestamp) : baseDate,
          sku: item.sku,
          name: item.name || 'ไม่ระบุชื่อสินค้า',
          type: 'increased',
          eventCategory: 'adjust',
          eventLabel: '🛠️ ตรวจพบสต็อกเพิ่มขึ้น',
          eventBadgeClass: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          eventIcon: Wrench,
          oldValue: item.oldStock,
          newValue: item.newStock,
          quantityDiff: diff,
          quantityDiffText: `+${diff} ชิ้น`,
          customerName: 'คลังสินค้า (ส่วนต่างตรวจนับ)',
          platform: 'Inventory Delta',
          details: item.details || 'ตรวจพบสต็อกเพิ่มระหว่างรอบ (ไม่มีเอกสารอ้างอิง)'
        });
      }
    });

    // 3. Process Price Changes
    priceChanged.forEach((item, idx) => {
      const docTxId = item.txId || item.transactionId || 'ปรับโครงสร้างราคา';
      records.push({
        id: `PRC-${item.sku}-${idx}`,
        hasRealDocument: Boolean(item.txId || item.transactionId),
        txId: docTxId,
        timestamp: item.timestamp || baseTimeStr,
        dateObj: item.timestamp ? getValidDate(item.timestamp) : baseDate,
        sku: item.sku,
        name: item.name || 'ไม่ระบุชื่อสินค้า',
        type: 'priceChanged',
        eventCategory: 'price',
        eventLabel: '🟡 เปลี่ยนราคาขาย',
        eventBadgeClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        eventIcon: DollarSign,
        oldValue: item.oldPrice ? `฿${item.oldPrice}` : '-',
        newValue: item.newPrice ? `฿${item.newPrice}` : '-',
        quantityDiff: 0,
        quantityDiffText: '-',
        customerName: item.customerName || 'ผู้จัดการระบบ (ปรับโครงสร้างราคา)',
        platform: item.platform || 'Price Master',
        details: item.details || ''
      });
    });

    // 4. Process Other Changes
    otherChanged.forEach((item, idx) => {
      const docTxId = item.txId || item.transactionId || 'อัปเดตข้อมูลสินค้า';
      records.push({
        id: `OTH-${item.sku}-${idx}`,
        hasRealDocument: Boolean(item.txId || item.transactionId),
        txId: docTxId,
        timestamp: item.timestamp || baseTimeStr,
        dateObj: item.timestamp ? getValidDate(item.timestamp) : baseDate,
        sku: item.sku,
        name: item.name || 'ไม่ระบุชื่อสินค้า',
        type: 'otherChanged',
        eventCategory: 'adjust',
        eventLabel: '📝 อัปเดตข้อมูลทั่วไป',
        eventBadgeClass: 'bg-slate-50 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border-slate-200',
        eventIcon: FileText,
        oldValue: '-',
        newValue: '-',
        quantityDiff: 0,
        quantityDiffText: '-',
        customerName: item.customerName || 'ระบบซิงค์อัตโนมัติ',
        platform: 'System',
        details: item.details || ''
      });
    });

    // Sort chronologically (newest transaction at top)
    records.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

    return records;
  }, [realOrders, realClaims, displayData]);

  // Unique Customers list
  const uniqueCustomers = useMemo(() => {
    const set = new Set();
    allTransactions.forEach(t => {
      if (t.customerName) set.add(t.customerName);
    });
    return Array.from(set);
  }, [allTransactions]);

  // Filtered transactions (Exact 1-to-1 match with selected type)
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(item => {
      if (selectedType !== 'all' && item.type !== selectedType) return false;
      if (selectedEventType !== 'all' && item.eventCategory !== selectedEventType) return false;
      if (selectedCustomer !== 'all' && item.customerName !== selectedCustomer) return false;

      if (timeFilter === 'today') {
        const todayStr = new Date().toDateString();
        if (new Date(item.dateObj).toDateString() !== todayStr) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchName = item.name.toLowerCase().includes(q);
        const matchTx = item.txId.toLowerCase().includes(q);
        const matchCust = item.customerName.toLowerCase().includes(q);
        if (!matchSku && !matchName && !matchTx && !matchCust) return false;
      }

      return true;
    });
  }, [allTransactions, selectedType, selectedEventType, selectedCustomer, timeFilter, searchQuery]);

  // Grouped transactions by Transaction ID (Single Row View)
  const groupedByBill = useMemo(() => {
    const groups = new Map();

    filteredTransactions.forEach(item => {
      const key = item.txId;
      if (!groups.has(key)) {
        groups.set(key, {
          txId: key,
          timestamp: item.timestamp,
          customerName: item.customerName,
          platform: item.platform,
          eventLabel: item.eventLabel,
          eventBadgeClass: item.eventBadgeClass,
          eventIcon: item.eventIcon,
          eventCategory: item.eventCategory,
          items: [],
          totalQuantity: 0
        });
      }

      const group = groups.get(key);
      group.items.push(item);
      const qtyNum = typeof item.quantityDiff === 'number' ? item.quantityDiff : 1;
      group.totalQuantity += qtyNum;
    });

    return Array.from(groups.values());
  }, [filteredTransactions]);

  // Metrics calculation matching filtered scope
  const metrics = useMemo(() => {
    const total = filteredTransactions.length;
    const sales = filteredTransactions.filter(t => t.eventCategory === 'sale').length;
    const claims = filteredTransactions.filter(t => t.eventCategory === 'claim').length;
    const adjusts = filteredTransactions.filter(t => t.eventCategory === 'adjust').length;
    return { total, sales, claims, adjusts };
  }, [filteredTransactions]);

  const toggleExpandBill = (txId) => {
    setExpandedBills(prev => ({
      ...prev,
      [txId]: !prev[txId]
    }));
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['วันที่/เวลา', 'เลขที่ธุรกรรม', 'ประเภทเหตุการณ์', 'ลูกค้า/ช่องทาง', 'SKU', 'ชื่อสินค้า', 'สต็อกเดิม', 'สต็อกใหม่', 'ส่วนต่าง'];
    const rows = filteredTransactions.map(t => [
      `"${t.timestamp}"`,
      `"${t.txId}"`,
      `"${t.eventLabel}"`,
      `"${t.customerName}"`,
      `"${t.sku}"`,
      `"${t.name.replace(/"/g, '""')}"`,
      `"${t.oldValue}"`,
      `"${t.newValue}"`,
      `"${t.quantityDiffText}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Transaction_Details_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    selectedEventType,
    setSelectedEventType,
    selectedCustomer,
    setSelectedCustomer,
    timeFilter,
    setTimeFilter,
    viewMode,
    setViewMode,
    expandedBills,
    toggleExpandBill,
    filteredTransactions,
    groupedByBill,
    metrics,
    uniqueCustomers,
    isCalculating,
    isInitialReady: true,
    fetchChanges,
    handleExportCSV
  };
}
