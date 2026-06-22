import React, { useState, useEffect } from 'react';
import { warrantyClientService } from '../../../../firebase/warrantyClientService';
import { ShieldCheck } from 'lucide-react';

export default function WarrantyStatusBadge({ purchaseDateStr, sku, category }) {
  const [warrantyConfig, setWarrantyConfig] = useState(null);

  useEffect(() => {
    warrantyClientService.getWarrantySettings().then(setWarrantyConfig).catch(console.error);
  }, []);

  if (!warrantyConfig || !purchaseDateStr) return null;

  // 1. Calculate Warranty Period (Days)
  let warrantyPeriodDays = 365; // Default fallback
  if (warrantyConfig.skus?.[sku]) {
    warrantyPeriodDays = warrantyConfig.skus[sku].claimDays || 365;
  } else if (warrantyConfig.categories) {
    let foundCat = 'General';
    const skuUpper = sku?.toUpperCase() || '';
    const categoryFromPayload = category?.toLowerCase() || '';

    for (const cat of Object.keys(warrantyConfig.categories)) {
      const catLower = cat.toLowerCase();
      if (categoryFromPayload === catLower) { foundCat = cat; break; }
      if (catLower === 'adapter' && skuUpper.startsWith('AD')) { foundCat = cat; break; }
      if (catLower === 'keyboard' && skuUpper.startsWith('KB')) { foundCat = cat; break; }
      if (catLower === 'panel' && skuUpper.startsWith('PN')) { foundCat = cat; break; }
      if (catLower === 'battery' && skuUpper.startsWith('BT')) { foundCat = cat; break; }
      if (sku && sku.toLowerCase().includes(catLower)) { foundCat = cat; break; }
    }
    
    if (warrantyConfig.categories[foundCat]) {
      warrantyPeriodDays = warrantyConfig.categories[foundCat].claimDays || 30;
    }
  }

  // 2. Calculate Used Days (Calendar days)
  const pDate = new Date(purchaseDateStr);
  if (isNaN(pDate)) return null;

  const cDate = new Date();
  const pDateOnly = new Date(pDate.getFullYear(), pDate.getMonth(), pDate.getDate());
  const cDateOnly = new Date(cDate.getFullYear(), cDate.getMonth(), cDate.getDate());
  const diffTime = cDateOnly - pDateOnly;
  const usedDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  
  const remainingDays = warrantyPeriodDays - usedDays;
  const percentUsed = Math.min((usedDays / warrantyPeriodDays) * 100, 100);
  const percentRemaining = 100 - percentUsed;

  // 3. Determine Mood & Tone
  let label = '';
  let color = '';
  let textColor = '';

  if (remainingDays < 0) {
    label = `หมดประกัน`;
    color = 'bg-slate-300';
    textColor = 'text-slate-400';
  } else if (remainingDays === 0) {
    label = `🚨 วันสุดท้าย!`;
    color = 'bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.6)]';
    textColor = 'text-red-600 animate-pulse';
  } else if (remainingDays <= 3) {
    label = `⚠️ โค้งสุดท้าย (${remainingDays} วัน)`;
    color = 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]';
    textColor = 'text-red-500';
  } else if (remainingDays <= 7 || percentRemaining <= 15) {
    label = `ใกล้หมด (${remainingDays} วัน)`;
    color = 'bg-orange-500';
    textColor = 'text-orange-500';
  } else if (percentRemaining >= 70) {
    label = `🟢 เหลืออีกเยอะ (${remainingDays} วัน)`;
    color = 'bg-emerald-500';
    textColor = 'text-emerald-500';
  } else {
    label = `เหลือ ${remainingDays} วัน`;
    color = 'bg-amber-400';
    textColor = 'text-amber-500';
  }

  return (
    <div className="flex flex-col gap-1.5 w-full mt-2" title={`สถานะประกันอัปเดตล่าสุดวันนี้\nหมดอายุในอีก: ${remainingDays} วัน (รวม ${warrantyPeriodDays} วัน)`}>
      <div className="flex justify-between items-center">
        <div className={`flex items-center gap-1 text-[10px] font-bold ${textColor}`}>
          <ShieldCheck size={12} />
          <span>{label}</span>
        </div>
        <span className="text-[9px] font-medium text-gray-400 border border-gray-200 px-1 rounded-sm bg-white">
          ประกัน {warrantyPeriodDays} วัน
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${percentUsed}%` }}></div>
      </div>
    </div>
  );
}
