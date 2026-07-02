import React, { useState, useEffect } from 'react';
import { PackageOpen, Clock, Calendar, Check, X, ShieldAlert, BadgeCheck, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { db } from '../../../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import FormalManagerBadge from './FormalManagerBadge';
import WholesaleTable from '../../cards/wholesale/WholesaleTable';
import WholesaleSummary from '../../cards/wholesale/WholesaleSummary';
import useWholesaleCalculator from '../../cards/wholesale/useWholesaleCalculator';

export default function FormalWholesaleCard({ todo, isProcessing, urgencyClass, handleAction, formatDate, getStatusBadge, isManagerTab }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fetchedData, setFetchedData] = useState({});
  const [isFetching, setIsFetching] = useState(false);
  const [hasFetched, setHasFetched] = useState(false); // To ensure lazy loading happens only once

  const calculator = useWholesaleCalculator(todo, fetchedData);

  // Lazy loading prices ONLY when expanded to save Firebase Reads
  useEffect(() => {
    const fetchPrices = async () => {
      if (!isExpanded || hasFetched || !calculator.cartItems || calculator.cartItems.length === 0) return;
      setIsFetching(true);
      try {
        const skus = calculator.cartItems.map(item => item.sku);
        if (skus.length > 0) {
          const newPrices = {};
          // 🚀 [Optimization] Chunk array by 30 to maximize Firebase 'in' query limit and prevent error
          for (let i = 0; i < skus.length; i += 30) {
            const batchSkus = skus.slice(i, i + 30);
            const q = query(collection(db, 'products'), where('sku', 'in', batchSkus));
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
              const data = doc.data();
              newPrices[doc.id] = data.wholesalePrice || null;
            });
          }
          setFetchedData(newPrices);
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

  const customerObj = todo.payload?.customer || {};
  const wholesaleDocUrl = customerObj.wholesaleDocumentUrl;

  const handleApprove = () => {
    if (!window.confirm(`ยืนยันการอนุมัติราคาส่งใหม่ ยอดชำระ: ฿${calculator.calculations.newNetTotal.toLocaleString()} ใช่หรือไม่?`)) return;

    const itemsWithNewPrices = calculator.cartItems.map((item, idx) => {
      let finalPrice = item.price;
      if (calculator.editedPrices[idx] !== undefined && calculator.editedPrices[idx] !== '') {
        finalPrice = Number(calculator.editedPrices[idx]);
      } else if (fetchedData[item.productId] !== undefined) {
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

  return (
    <div className={`bg-white rounded-md shadow-sm border border-slate-200 flex flex-col relative transition-all hover:border-slate-400 mb-4 ${urgencyClass} ${isExpanded ? 'shadow-md ring-1 ring-slate-200' : ''}`}>
      
      {isManagerTab && <FormalManagerBadge text="B2B WHOLESALE" />}

      {/* Loading Overlay */}
      {(isProcessing || (isFetching && isExpanded)) && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center transition-all duration-300">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <span className="text-xs font-bold text-blue-600 animate-pulse">
            {isFetching ? 'FETCHING PRICES...' : 'PROCESSING...'}
          </span>
        </div>
      )}

      {/* Header / Summary */}
      <div 
        className={`p-4 cursor-pointer flex items-center justify-between gap-4 transition-colors ${isExpanded ? 'bg-slate-50 border-b border-slate-200' : 'hover:bg-slate-50'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 shrink-0">
            <PackageOpen size={18} />
          </div>
          
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider border border-slate-200 shadow-sm">
                Order: #{todo.payload?.orderId?.slice(-6).toUpperCase() || 'N/A'}
              </span>
              {getStatusBadge(todo.status)}
            </div>
            
            <h3 className="font-bold text-slate-800 text-sm truncate uppercase tracking-wide">
              คำขออนุมัติราคาส่ง
            </h3>
            
            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1"><Clock size={12}/> {formatDate(todo.createdAt || todo.requestedAt)}</span>
              {customerObj.name && <span className="text-slate-700 font-bold truncate">Acct: {customerObj.name}</span>}
            </div>
          </div>
        </div>
        
        <div className="shrink-0 text-slate-400">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 bg-white animate-in slide-in-from-top-2 duration-200">
          
          <div className="flex flex-col gap-4 mb-5">
            {/* Customer Reason & Profile */}
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <ShieldAlert size={16} className="text-slate-500" />
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Customer Profile</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name / Business</span>
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    {customerObj.name || 'ไม่ระบุ'} {customerObj.isVerified && <BadgeCheck size={14} className="text-blue-500" />}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact</span>
                  <span className="text-sm font-medium text-slate-600">
                    {customerObj.phone || 'ไม่ระบุ'}
                  </span>
                </div>
              </div>

              {wholesaleDocUrl && (
                <div className="mt-2 pt-3 border-t border-slate-200">
                  <a 
                    href={wholesaleDocUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors border border-blue-200"
                  >
                    <FileText size={14} /> ดูเอกสารทะเบียนการค้า/นามบัตร
                  </a>
                </div>
              )}

              {todo.payload?.customerReason && (
                <div className="mt-2 bg-white p-3 rounded-md border border-slate-200 shadow-inner">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 block">Customer Note</span>
                  <p className="text-sm text-slate-700 font-medium italic">"{todo.payload.customerReason}"</p>
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
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-3">
            <button 
              onClick={handleApprove}
              disabled={isProcessing || isFetching}
              className="flex-1 min-w-[200px] flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 rounded-md text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              <Check size={18} strokeWidth={3} /> อนุมัติราคาส่ง (฿{calculator.calculations.newNetTotal.toLocaleString()})
            </button>
            <button 
              onClick={handleReject}
              disabled={isProcessing || isFetching}
              className="flex justify-center items-center gap-2 bg-white border border-slate-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 px-6 py-3 rounded-md text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
              title="ไม่อนุมัติราคาส่ง"
            >
              <X size={18} strokeWidth={2.5} /> ปฏิเสธ (REJECT)
            </button>
          </div>
          
        </div>
      )}
    </div>
  );
}
