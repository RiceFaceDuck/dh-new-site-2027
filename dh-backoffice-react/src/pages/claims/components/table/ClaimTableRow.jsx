import React, { useState, useEffect } from 'react';
import { Wrench, ArrowLeftRight, Check, Copy, Undo2 } from 'lucide-react';
import { getWarrantyInfo, getSLAIndicator, getStatusDisplay } from '../../utils/claimFormatters';
import { userService } from '../../../../firebase/userService';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';

const customerCache = {};

const CustomerDisplay = ({ uid, payloadName, customerProfile }) => {
  const [customer, setCustomer] = useState(customerProfile || customerCache[uid] || null);
  
  useEffect(() => {
    if (customerProfile) {
      customerCache[uid] = customerProfile;
      setCustomer(customerProfile);
      return;
    }
    if (!uid || uid === 'Walk-in' || uid.includes('WALK-IN')) return;
    if (customerCache[uid]) return;
    
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const profile = await userService.getUserProfile(uid);
        if (profile && isMounted) {
          customerCache[uid] = profile;
          setCustomer(profile);
        } else if (isMounted) {
          customerCache[uid] = { notFound: true };
          setCustomer({ notFound: true });
        }
      } catch (err) {
        console.error("Error fetching customer:", err);
      }
    };
    fetchUser();
    
    return () => { isMounted = false; };
  }, [uid, customerProfile]);
  
  let displayName = payloadName && !payloadName.includes('ทั่วไป') ? payloadName : 'ไม่พบข้อมูลในระบบ';
  if (customer && !customer.notFound) {
    displayName = getCustomerDisplayName(customer, displayName);
  }
  
  return (
    <span className={`text-[13px] font-bold truncate block w-full ${displayName === 'ไม่พบข้อมูลในระบบ' ? 'text-dh-muted italic text-[11px] font-normal' : 'text-dh-main'}`} title={displayName}>
      {displayName}
    </span>
  );
};

const truncateText = (text, maxLength = 80) => {
  if (!text) return '';
  const str = String(text).trim();
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
};

const ClaimTableRow = React.memo(function ClaimTableRow({ 
  req, 
  index = 0,
  setSelectedRequest, 
  copiedText, 
  handleQuickCopy, 
  warrantyConfig, 
  customerProfile 
}) {
  const payload = req.payload || {};
  const dateObj = req.createdAt?.toDate ? new Date(req.createdAt.toDate()) : null;

  const rawRef = String(payload.claimId || payload.returnId || payload.exchangeId || '').toUpperCase();
  const isClaim = rawRef.startsWith('CLM') || req.type === 'CLAIM_APPROVAL' || req.originalType === 'CLAIM_APPROVAL';
  const isExchange = !isClaim && (rawRef.startsWith('EXC') || req.type === 'EXCHANGE_APPROVAL' || req.originalType === 'EXCHANGE_APPROVAL' || req.type === 'SWAP_SKU' || !!payload.isSwapSku);
  const isSwap = !isClaim && (!!payload.isSwapSku || (isExchange && !!payload.swapSku));
  const isReturn = !isClaim && !isExchange && (rawRef.startsWith('RTN') || req.type === 'RETURN_APPROVAL' || req.originalType === 'RETURN_APPROVAL' || payload.actionType?.includes('คืน'));

  let badgeLabel = 'เคลมสินค้า';
  let badgeStyle = 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800';
  let TypeIcon = Wrench;
  let indicatorColor = 'bg-[#FF9B51]';

  if (isExchange) {
    badgeLabel = 'เปลี่ยนสินค้า';
    badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
    TypeIcon = ArrowLeftRight;
    indicatorColor = 'bg-[#38BDF8]';
  } else if (isReturn) {
    badgeLabel = 'คืนเงิน / คืนสินค้า';
    badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
    TypeIcon = Undo2;
    indicatorColor = 'bg-[#A78BFA]';
  }

  let warrantyDays = 365;
  if (warrantyConfig) {
    if (warrantyConfig.skus?.[payload.sku]) {
      warrantyDays = isClaim ? warrantyConfig.skus[payload.sku].claimDays : warrantyConfig.skus[payload.sku].returnDays;
    } else if (warrantyConfig.categories) {
      let foundCat = 'General';
      const skuUpper = payload.sku?.toUpperCase() || '';
      const categoryFromPayload = payload.category?.toLowerCase() || '';

      for (const cat of Object.keys(warrantyConfig.categories)) {
        const catLower = cat.toLowerCase();
        if (categoryFromPayload === catLower) {
          foundCat = cat; break;
        }
        if (catLower === 'adapter' && skuUpper.startsWith('AD')) { foundCat = cat; break; }
        if (catLower === 'keyboard' && skuUpper.startsWith('KB')) { foundCat = cat; break; }
        if (catLower === 'panel' && skuUpper.startsWith('PN')) { foundCat = cat; break; }
        if (catLower === 'battery' && skuUpper.startsWith('BT')) { foundCat = cat; break; }
        if (payload.sku && payload.sku.toLowerCase().includes(catLower)) {
          foundCat = cat; break;
        }
      }
      const catConfig = warrantyConfig.categories[foundCat] || warrantyConfig.categories['General'];
      if (catConfig) {
        warrantyDays = isClaim ? catConfig.claimDays : catConfig.returnDays;
      }
    }
  }

  const warranty = getWarrantyInfo(payload.purchaseDate, req.createdAt, warrantyDays);
  const isEven = index % 2 === 0;
  const stripeBg = isEven 
    ? 'bg-white dark:bg-slate-900' 
    : 'bg-[#F4F6F9] dark:bg-slate-800/50';

  return (
    <tr 
      onClick={() => setSelectedRequest(req)} 
      className={`group transition-all cursor-pointer relative duration-150 
        ${stripeBg}
        hover:bg-blue-50/70 dark:hover:bg-slate-700/60 z-0 hover:z-10`}
    >
      <td className="px-3 py-2.5 align-middle relative border-b border-dh-border group-last:border-none w-[10%] overflow-hidden">
        <div className={`absolute left-0 top-0 bottom-0 w-[4px] opacity-0 group-hover:opacity-100 transition-opacity ${indicatorColor} rounded-r-full`}></div>
        {dateObj ? (
          <div className="flex flex-col truncate">
            <span className="text-[12px] font-bold text-slate-900 dark:text-white truncate">{dateObj.toLocaleDateString('th-TH')}</span>
            <span className="text-[10px] text-dh-muted font-mono truncate">{dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ) : '-'}
      </td>

      <td className="px-3 py-2.5 align-middle border-b border-dh-border group-last:border-none w-[12%] overflow-hidden">
        <div className="flex flex-col gap-1 items-start overflow-hidden w-full">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border truncate ${badgeStyle}`}>
            <TypeIcon className="w-3 h-3 shrink-0" />
            <span className="truncate">{badgeLabel}</span>
          </span>
          <div className="group/copy flex items-center gap-1 font-mono text-[11px] font-bold text-dh-muted relative w-full overflow-hidden">
            <span className="truncate">{payload.claimId || payload.returnId || payload.exchangeId}</span>
            <button 
              onClick={(e) => handleQuickCopy(e, payload.claimId || payload.returnId || payload.exchangeId)} 
              className="opacity-0 group-hover/copy:opacity-100 hover:text-dh-accent transition-all p-0.5 rounded-sm bg-dh-base active:scale-95 shrink-0 cursor-pointer"
            >
              {copiedText === (payload.claimId || payload.returnId || payload.exchangeId) ? <Check className="w-3 h-3 text-emerald-500"/> : <Copy className="w-3 h-3"/>}
            </button>
            {copiedText === (payload.claimId || payload.returnId || payload.exchangeId) && (
               <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[9px] py-0.5 px-1.5 rounded-sm animate-bounce">Copied!</span>
            )}
          </div>
        </div>
      </td>

      <td className="px-3 py-2.5 align-middle border-b border-dh-border group-last:border-none w-[22%] overflow-hidden">
        <div className="flex flex-col gap-0.5 overflow-hidden w-full">
          <CustomerDisplay uid={payload.customerUid} payloadName={payload.customerName} customerProfile={customerProfile} />
          <div className="group/copy flex items-center gap-1 text-[11px] text-dh-muted relative w-full overflow-hidden">
            <span className="font-mono group-hover/copy:text-dh-accent transition-colors truncate">{payload.orderId}</span>
            <button 
              onClick={(e) => handleQuickCopy(e, payload.orderId)} 
              className="opacity-0 group-hover/copy:opacity-100 hover:text-dh-accent transition-all p-0.5 rounded-sm bg-dh-base active:scale-95 shrink-0 cursor-pointer"
            >
              {copiedText === payload.orderId ? <Check className="w-3 h-3 text-emerald-500"/> : <Copy className="w-3 h-3"/>}
            </button>
          </div>
        </div>
      </td>

      <td className="px-3 py-2.5 align-middle border-b border-dh-border group-last:border-none w-[10%] overflow-hidden">
        {payload.purchaseDate && !isNaN(new Date(payload.purchaseDate)) ? (
          <div className="flex flex-col gap-0.5 truncate">
            <span className="text-[12px] font-bold text-slate-900 dark:text-white truncate">
              {new Date(payload.purchaseDate).toLocaleDateString('th-TH')}
            </span>
            {warranty && (
              <span className="text-[10px] text-dh-muted font-medium truncate">
                (ซื้อมา {warranty.usedDays} วัน)
              </span>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-dh-muted italic bg-dh-base px-2 py-0.5 rounded-sm inline-block truncate">ไม่ระบุวันที่</span>
        )}
      </td>

      <td className="px-3 py-2.5 align-middle border-b border-dh-border group-last:border-none w-[12%] overflow-hidden">
        {warranty ? (
          <div className="flex flex-col gap-1 w-full overflow-hidden" title={`การคำนวณแบบ Real-time ณ ปัจจุบัน\nซื้อเมื่อ: ${payload.purchaseDate && !isNaN(new Date(payload.purchaseDate)) ? new Date(payload.purchaseDate).toLocaleDateString('th-TH') : 'ไม่ระบุวันที่ซื้อ'}\nผ่านไปแล้ว: ${warranty.usedDays} วัน\n(รวมระยะเวลาประกัน ${warranty.warrantyPeriod} วัน)`}>
            <div className="flex justify-between items-end overflow-hidden">
              <span className={`text-[11px] font-bold ${warranty.textColor} truncate block`}>{warranty.label}</span>
            </div>
            <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full h-2 overflow-hidden border border-slate-300/80 dark:border-slate-600 shadow-inner">
              <div className={`h-full ${warranty.color} transition-all duration-1000 ease-out`} style={{ width: `${warranty.percentUsed}%` }}></div>
            </div>
          </div>
        ) : (
          <span className="text-[10px] text-dh-muted italic bg-dh-base px-2 py-0.5 rounded-sm inline-block">ไม่ระบุวันที่</span>
        )}
      </td>

      <td className="px-3 py-2.5 align-middle border-b border-dh-border group-last:border-none w-[24%] overflow-hidden">
        <div className="flex flex-col gap-0.5 overflow-hidden w-full">
          {/* ชื่อสินค้า หรือ สลับรุ่น (จำกัดไม่เกิน 80 ตัวอักษร) */}
          <div className="overflow-hidden w-full">
            {isSwap ? (
              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-900 dark:text-white truncate max-w-full" title={`${payload.productName || payload.sku} ➔ ${payload.swapProductName || payload.swapSku}`}>
                <span className="truncate">{truncateText(payload.productName || payload.sku, 40)}</span>
                <span className="text-sky-600 font-black shrink-0">➔</span>
                <span className="text-sky-600 font-bold truncate">{truncateText(payload.swapProductName || payload.swapSku, 40)}</span>
              </span>
            ) : (
              <span className="text-[12px] font-bold text-slate-900 dark:text-white truncate block w-full group-hover:text-dh-accent transition-colors" title={payload.productName || payload.sku}>
                {truncateText(payload.productName || payload.sku, 80)}
              </span>
            )}
          </div>

          {/* แถวล่าง: SKU Tag, จำนวนชิ้น, และ เหตุผล/อาการ */}
          <div className="flex items-center gap-1.5 overflow-hidden w-full text-[11px]">
            <span className="font-mono font-bold text-dh-accent bg-dh-accent/10 px-1.5 py-0.2 rounded-sm shrink-0">
              {payload.sku}
            </span>
            <span className="text-[10px] bg-dh-base border border-dh-border px-1.5 py-0.2 rounded-md font-black shrink-0">
              x{payload.qty || 1}
            </span>
            <span className="text-dh-muted truncate block" title={isClaim ? (payload.symptomCode || payload.symptomDetails) : (payload.returnReason || payload.returnDetails)}>
              • {isClaim ? (payload.symptomCode || payload.symptomDetails || 'ไม่ระบุอาการ') : (payload.returnReason || payload.returnDetails || 'ไม่ระบุเหตุผล')}
            </span>
          </div>
        </div>
      </td>

      <td className="px-3 py-2.5 align-middle text-center border-b border-dh-border group-last:border-none w-[10%] overflow-hidden">
        <div className="flex flex-col items-center justify-center text-center w-full">
          {getStatusDisplay(req)}
          {getSLAIndicator(req.createdAt, req.status)}
        </div>
      </td>
    </tr>
  );
});

export default ClaimTableRow;
