import React, { useState, useEffect } from 'react';
import { PackageOpen, Clock, Calendar, Check, X, ShieldAlert, BadgeCheck, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { inventoryQueryService } from '../../firebase/inventory/inventoryQueryService';
import WholesaleTable from './cards/wholesale/WholesaleTable';
import WholesaleSummary from './cards/wholesale/WholesaleSummary';
import useWholesaleCalculator from './cards/wholesale/useWholesaleCalculator';

import { safeJsonParse } from 'dh-shared';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';
const WholesaleCard = React.memo(function WholesaleCard({ todo, isProcessing, urgencyLevel, handleAction, formatDate, getStatusBadge, isManagerTab }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fetchedData, setFetchedData] = useState({});
  const [isFetching, setIsFetching] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const calculator = useWholesaleCalculator(todo, fetchedData);

  useEffect(() => {
    const fetchPrices = async () => {
      if (!isExpanded || hasFetched || !calculator.cartItems || calculator.cartItems.length === 0) return;
      setIsFetching(true);
      try {
        const skus = calculator.cartItems.map(item => item.sku);
        if (skus.length > 0) {
          const newPrices = {};
          
          let cacheMap = new Map();
          try {
            const cachedStr = sessionStorage.getItem('search_hybrid_cache');
            if (cachedStr) {
              const cachedArr = safeJsonParse(cachedStr);
              cachedArr.forEach(p => {
                if (p.sku) cacheMap.set(p.sku, p.wholesalePrice || p.cost || p.price);
              });
            }
          } catch (e) {}

          const missingSkus = [];
          skus.forEach(sku => {
            const cachedVal = cacheMap.get(sku);
            if (cachedVal !== undefined && cachedVal !== null) {
              const matchedItem = calculator.cartItems.find(item => item.sku === sku);
              if (matchedItem) {
                newPrices[matchedItem.productId] = cachedVal;
              }
            } else {
              missingSkus.push(sku);
            }
          });

          if (missingSkus.length > 0) {
            const fetchedBatchPrices = await inventoryQueryService.getProductsPricesBatch(missingSkus);
            Object.assign(newPrices, fetchedBatchPrices);
          }
          
          setFetchedData(prev => ({ ...prev, ...newPrices }));
          setHasFetched(true);
        }
      } catch (error) {
        console.error("Error fetching wholesale prices:", error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchPrices();
  }, [isExpanded, hasFetched, calculator.cartItems]);

  useEffect(() => {
    setFetchedData({});
    setHasFetched(false);
  }, [todo]);

  const customerObj = todo.customer || todo.payload?.customer || {};
  const wholesaleDocUrl = customerObj.wholesaleDocumentUrl;

  const handleApprove = () => {
    if (!window.confirm(`ยืนยันการอนุมัติราคาส่งใหม่ ยอดชำระ: ฿${calculator.calculations.newNetTotal.toLocaleString()} ใช่หรือไม่?`)) return;

    const itemsWithNewPrices = calculator.cartItems.map((item, idx) => {
      let finalPrice = item.price;
      if (calculator.editedPrices[idx] !== undefined && calculator.editedPrices[idx] !== '') {
        finalPrice = Number(calculator.editedPrices[idx]);
      } else if (fetchedData[item.productId] !== undefined && fetchedData[item.productId] !== null) {
        finalPrice = fetchedData[item.productId];
      } else if (item.wholesalePrice && item.wholesalePrice < item.price) {
        finalPrice = item.wholesalePrice;
      } else {
        finalPrice = Math.floor(item.price * 0.95);
      }
      return { ...item, wholesalePriceApproved: finalPrice };
    });

    const approvalData = {
      orderId: todo.payload?.orderId,
      itemsWithNewPrices,
      newNetTotal: calculator.calculations.newNetTotal,
      extraManualDiscount: calculator.calculations.extra,
      originalNetTotal: calculator.calculations.originalNetTotal,
      calculatorMetadata: {
        retailSubtotal: calculator.calculations.retailSubtotal,
        wholesaleSubtotal: calculator.calculations.wholesaleSubtotal,
        itemLevelDiscount: calculator.calculations.itemLevelDiscount,
        totalWebDiscount: calculator.totalWebDiscount,
        shippingCost: calculator.shippingCost,
        totalCreditDiscount: calculator.totalCreditDiscount,
        usedPoints: calculator.usedPoints,
        usedWallet: calculator.usedWallet,
        appliedPromotions: calculator.appliedPromotions
      }
    };

    handleAction(todo.id, 'approve', todo.type, approvalData);
  };

  const handleReject = () => {
    const reason = window.prompt("กรุณาระบุเหตุผลที่ไม่อนุมัติ (บังคับ):");
    if (!reason) return;
    if (reason.trim().length < 2) {
      alert("กรุณาระบุเหตุผลให้ชัดเจน");
      return;
    }
    
    handleAction(todo.id, 'reject', todo.type, { 
      orderId: todo.payload?.orderId,
      reason: reason.trim()
    });
  };

  const getUrgencyStyles = (level) => {
    switch (level) {
      case 'high': 
        return 'bg-gradient-to-br from-rose-50/70 via-white to-pink-50/40 border border-rose-200/80 shadow-sm hover:shadow-md hover:border-rose-300 hover:-translate-y-0.5';
      case 'medium': 
        return 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 border border-amber-200/80 shadow-sm hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5';
      default: 
        return 'bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 border border-blue-200/80 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5';
    }
  };

  return (
    <div 
      className={`rounded-2xl transition-all duration-200 p-4 flex flex-col relative overflow-hidden h-full ${getUrgencyStyles(urgencyLevel)}`}
    >
      
      {isManagerTab && (
        <div className="absolute top-0 right-0 bg-linear-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-xl shadow-xs z-10 uppercase tracking-wider">
          Manager
        </div>
      )}

      {isProcessing && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-20 flex flex-col items-center justify-center transition-all duration-300">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mb-2"></div>
        </div>
      )}

      {/* Header Row (Clickable to collapse/expand) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex flex-row justify-between items-center gap-3 relative z-10 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-xs flex items-center justify-center shrink-0">
            <PackageOpen size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 leading-snug mb-1">
              คำขออนุมัติราคาส่ง
              <span className="bg-blue-100 text-blue-700 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md shadow-2xs">B2B</span>
            </h3>
            <div className="flex items-center flex-wrap gap-2 pr-12">
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Order: #{todo.payload?.orderId?.slice(-6).toUpperCase() || 'N/A'}
              </span>
              {getStatusBadge(todo.status)}
            </div>
          </div>
        </div>
        <div className="text-slate-400 hover:text-slate-600 p-1">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 flex flex-col gap-3 relative z-10">
          
          {/* Customer Reason & Profile */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-sm border border-slate-100 flex flex-col gap-2">
            
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert size={16} className="text-orange-500" />
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">ข้อมูลลูกค้าที่ขอราคาส่ง</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ชื่อลูกค้า / กิจการ</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                  {getCustomerDisplayName(customerObj, 'ไม่ระบุ')} {customerObj.isVerified && <BadgeCheck size={14} className="text-blue-500" />}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">เบอร์ติดต่อ</span>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {customerObj.phone || 'ไม่ระบุ'}
                </span>
              </div>
            </div>

            {wholesaleDocUrl && (
              <div className="mt-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <a 
                  href={wholesaleDocUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
                >
                  <FileText size={14} /> ดูเอกสารทะเบียนการค้า/นามบัตร
                </a>
              </div>
            )}

            {todo.payload?.customerReason && (
              <div className="mt-2 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-xs relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg"></div>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1 block pl-2">หมายเหตุจากลูกค้า</span>
                <p className="text-sm text-slate-700 dark:text-slate-300 pl-2 font-medium italic">"{todo.payload.customerReason}"</p>
              </div>
            )}
          </div>

          {/* Date / Time */}
          <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
              <Clock size={12} /> ขอเมื่อ: {formatDate(todo.createdAt || todo.requestedAt)}
            </div>
            {todo.dueDate && (
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                <Calendar size={12} /> หมดอายุ: {formatDate(todo.dueDate)}
              </div>
            )}
          </div>

          {/* Interactive Table */}
          <WholesaleTable 
            cartItems={calculator.cartItems}
            fetchedData={fetchedData}
            editedPrices={calculator.editedPrices}
            handlePriceChange={calculator.handlePriceChange}
            isProcessing={isProcessing || isFetching}
          />

          {/* Summary Calculator */}
          <WholesaleSummary 
            calculations={calculator.calculations}
            extraManualDiscount={calculator.extraManualDiscount}
            setExtraManualDiscount={calculator.setExtraManualDiscount}
            totals={calculator.totals}
            shippingCost={calculator.shippingCost}
            appliedPromotions={calculator.appliedPromotions}
            qualifiedFreebies={calculator.qualifiedFreebies}
            totalWebDiscount={calculator.totalWebDiscount}
            usedPoints={calculator.usedPoints}
            usedWallet={calculator.usedWallet}
            isProcessing={isProcessing || isFetching}
          />

          {/* Action Buttons */}
          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3 relative z-10">
            <button 
              onClick={handleApprove}
              disabled={isProcessing || isFetching}
              className="flex-1 flex justify-center items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl text-sm font-black transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
            >
              <Check size={18} strokeWidth={3} /> อนุมัติราคาส่งใหม่ (฿{calculator.calculations.newNetTotal.toLocaleString()})
            </button>
            <button 
              onClick={handleReject}
              disabled={isProcessing || isFetching}
              className="flex justify-center items-center gap-2 bg-white dark:bg-slate-800 border-2 border-rose-100 dark:border-rose-900/50 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-600 px-6 py-3 rounded-xl font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="ไม่อนุมัติราคาส่ง"
            >
              <X size={18} strokeWidth={2.5} /> ปฏิเสธ
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default WholesaleCard;