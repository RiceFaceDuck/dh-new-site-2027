import React, { useState, useEffect } from 'react';
import { Wrench, ArrowLeftRight, Check, Copy, Eye } from 'lucide-react';
import { getWarrantyInfo, getSLAIndicator, getStatusDisplay } from '../../utils/claimFormatters';
import { userService } from '../../../../firebase/userService';

const customerCache = {};

const CustomerDisplay = ({ uid, payloadName }) => {
  const [customer, setCustomer] = useState(customerCache[uid] || null);
  
  useEffect(() => {
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
  }, [uid]);
  
  let displayName = payloadName && !payloadName.includes('ทั่วไป') ? payloadName : 'ไม่พบข้อมูลในระบบ';
  if (customer && !customer.notFound) {
    displayName = customer.accountName || customer.displayName || customer.firstName || customer.email || displayName;
  }
  
  return (
    <span className={`text-[13px] font-bold truncate max-w-[150px] block ${displayName === 'ไม่พบข้อมูลในระบบ' ? 'text-dh-muted italic text-[11px] font-normal' : 'text-dh-main'}`}>
      {displayName}
    </span>
  );
};

export default function ClaimTableRow({ req, setSelectedRequest, copiedText, handleQuickCopy, warrantyConfig }) {
  const isClaim = req.originalType === 'CLAIM_APPROVAL' || req.type === 'CLAIM_APPROVAL';
  const payload = req.payload || {};
  const dateObj = req.createdAt?.toDate ? new Date(req.createdAt.toDate()) : null;
  const indicatorColor = isClaim ? 'bg-[#FF9B51]' : 'bg-[#A78BFA]';
  
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
        // 1. Check exact match from payload.category
        if (categoryFromPayload === catLower) {
          foundCat = cat; break;
        }
        // 2. Check substring match in SKU
        if (catLower === 'adapter' && skuUpper.startsWith('AD')) { foundCat = cat; break; }
        if (catLower === 'keyboard' && skuUpper.startsWith('KB')) { foundCat = cat; break; }
        if (catLower === 'panel' && skuUpper.startsWith('PN')) { foundCat = cat; break; }
        if (catLower === 'battery' && skuUpper.startsWith('BT')) { foundCat = cat; break; }
        
        // 3. Fallback: string includes
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
  const hoursDiff = dateObj ? (new Date() - dateObj) / (1000 * 60 * 60) : 0;
  const isUrgent = req.status === 'pending_manager' && hoursDiff > 48;

  return (
    <tr 
      onClick={() => setSelectedRequest(req)} 
      className={`group transition-all cursor-pointer relative duration-200 
        ${isUrgent ? 'bg-rose-50/50 hover:bg-rose-100/50 dark:bg-rose-900/10 dark:hover:bg-rose-900/20' : 'hover:bg-dh-base/60'}
        hover:shadow-[0_0_10px_rgba(0,0,0,0.02)] z-0 hover:z-10 transform hover:scale-[1.002] bg-dh-surface`}
    >
      <td className="px-4 py-3 align-middle relative border-b border-dh-border group-last:border-none">
        <div className={`absolute left-0 top-0 bottom-0 w-[4px] opacity-0 group-hover:opacity-100 transition-opacity ${indicatorColor} rounded-r-full`}></div>
        {dateObj ? (
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-dh-main">{dateObj.toLocaleDateString('th-TH')}</span>
            <span className="text-[10px] text-dh-muted">{dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ) : '-'}
      </td>

      <td className="px-4 py-3 align-middle border-b border-dh-border group-last:border-none">
        <div className="flex flex-col gap-1 items-start">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${isClaim ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' : 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'}`}>
            {isClaim ? <Wrench className="w-2.5 h-2.5"/> : <ArrowLeftRight className="w-2.5 h-2.5"/>}
            {payload.actionType || (isClaim ? 'เคลม/ซ่อม' : 'คืนสินค้า')}
          </span>
          <div className="group/copy flex items-center gap-1 font-mono text-[11px] font-bold text-dh-muted relative">
            {payload.claimId || payload.returnId}
            <button onClick={(e) => handleQuickCopy(e, payload.claimId || payload.returnId)} className="opacity-0 group-hover/copy:opacity-100 hover:text-dh-accent transition-all p-0.5 rounded bg-dh-base active:scale-95">
              {copiedText === (payload.claimId || payload.returnId) ? <Check className="w-3 h-3 text-emerald-500"/> : <Copy className="w-3 h-3"/>}
            </button>
            {copiedText === (payload.claimId || payload.returnId) && (
               <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[9px] py-0.5 px-1.5 rounded animate-bounce">Copied!</span>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-3 align-middle border-b border-dh-border group-last:border-none">
        <div className="flex flex-col gap-0.5">
          <CustomerDisplay uid={payload.customerUid} payloadName={payload.customerName} />
          <div className="group/copy flex items-center gap-1 text-[11px] text-dh-muted relative">
            <span className="font-mono group-hover/copy:text-dh-accent transition-colors">{payload.orderId}</span>
            <button onClick={(e) => handleQuickCopy(e, payload.orderId)} className="opacity-0 group-hover/copy:opacity-100 hover:text-dh-accent transition-all p-0.5 rounded bg-dh-base active:scale-95">
              {copiedText === payload.orderId ? <Check className="w-3 h-3 text-emerald-500"/> : <Copy className="w-3 h-3"/>}
            </button>
          </div>
        </div>
      </td>

      <td className="px-4 py-3 align-middle border-b border-dh-border group-last:border-none">
        {payload.purchaseDate && !isNaN(new Date(payload.purchaseDate)) ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-bold text-dh-main">
              {new Date(payload.purchaseDate).toLocaleDateString('th-TH')}
            </span>
            {warranty && (
              <span className="text-[10px] text-dh-muted font-medium">
                (ซื้อมา {warranty.usedDays} วัน)
              </span>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-dh-muted italic bg-dh-base px-2 py-0.5 rounded">ไม่ระบุวันที่ซื้อ</span>
        )}
      </td>

      <td className="px-4 py-3 align-middle border-b border-dh-border group-last:border-none">
        {warranty ? (
          <div className="flex flex-col gap-1 min-w-32 max-w-40 group-hover:scale-105 transition-transform" title={`การคำนวณแบบ Real-time ณ ปัจจุบัน\nซื้อเมื่อ: ${payload.purchaseDate && !isNaN(new Date(payload.purchaseDate)) ? new Date(payload.purchaseDate).toLocaleDateString('th-TH') : 'ไม่ระบุวันที่ซื้อ'}\nผ่านไปแล้ว: ${warranty.usedDays} วัน\n(รวมระยะเวลาประกัน ${warranty.warrantyPeriod} วัน)`}>
            <div className="flex justify-between items-end">
              <span className={`text-[10px] font-bold ${warranty.textColor}`}>{warranty.label}</span>
            </div>
            <div className="w-full bg-dh-base rounded-full h-1.5 overflow-hidden border border-dh-border shadow-inner">
              <div className={`h-full ${warranty.color} transition-all duration-1000 ease-out`} style={{ width: `${warranty.percentUsed}%` }}></div>
            </div>
          </div>
        ) : (
          <span className="text-[10px] text-dh-muted italic bg-dh-base px-2 py-0.5 rounded">ไม่ระบุวันที่</span>
        )}
      </td>

      <td className="px-4 py-3 align-middle whitespace-normal w-[35%] min-w-[350px] border-b border-dh-border group-last:border-none">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-start gap-1.5">
            <span className="text-[12px] font-black text-dh-main line-clamp-1 flex-1 group-hover:text-dh-accent transition-colors">{payload.sku}</span>
            <span className="text-[10px] bg-dh-base border border-dh-border px-1 rounded font-bold shrink-0 mt-0.5">x{payload.qty || 1}</span>
          </div>
          <span className="text-[11px] text-dh-muted line-clamp-2 leading-snug" title={isClaim ? payload.symptomCode : payload.returnReason}>
            {isClaim ? payload.symptomCode : payload.returnReason}
          </span>
        </div>
      </td>

      <td className="px-4 py-3 align-middle text-center border-b border-dh-border group-last:border-none">
        <div className="flex flex-col items-center">
          {getStatusDisplay(req)}
          {getSLAIndicator(req.createdAt, req.status)}
        </div>
      </td>

      <td className="px-4 py-3 align-middle text-right border-b border-dh-border group-last:border-none">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-dh-muted group-hover:bg-dh-accent/10 group-hover:text-dh-accent transition-colors ml-auto border border-transparent group-hover:border-dh-accent/30 shadow-sm group-hover:shadow-none">
          <Eye className="w-4 h-4" />
        </div>
      </td>

    </tr>
  );
}
