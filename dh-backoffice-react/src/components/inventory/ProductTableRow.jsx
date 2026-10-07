import React from 'react';
import { Image } from 'lucide-react';
import { getRenderableImageUrl, handleImageError } from 'dh-shared/src/utils/imageProcessingUtils.js';

const ProductTableRow = ({ product, onEdit, salesPeriod, globalBufferStock = 2 }) => {
  if (!product) return null;

  const imgCandidate = (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : (typeof product.images === 'string' && product.images.length > 5 ? product.images : null))
    || product.imageUrl 
    || product.image 
    || null;
  const displayImage = getRenderableImageUrl(imgCandidate);

  const getHistoryCount = (history, period, fallbackField) => {
    const val = history?.[period];
    if (val != null && !isNaN(Number(val))) return Number(val);
    if (fallbackField != null && !isNaN(Number(fallbackField))) return Number(fallbackField);
    return 0;
  };

  const stockIn = getHistoryCount(product.stockInHistory, salesPeriod, product[`stockIn${salesPeriod}D`]);
  const sales = getHistoryCount(product.salesHistory, salesPeriod, product[`sales${salesPeriod}D`] ?? (salesPeriod === '30' ? product.stats?.sold : null));
  const claim = getHistoryCount(product.claimHistory, salesPeriod, product[`claims${salesPeriod}D`]);
  const adjustment = getHistoryCount(product.adjustmentHistory, salesPeriod, product[`adjustment${salesPeriod}D`]);

  const priceVal = Number(product.Price ?? product.price ?? product.wholesalePrice ?? 0);
  const retailPriceVal = Number(product.retailPrice || 0);

  const normalizedTags = Array.isArray(product.tags)
    ? product.tags.filter(Boolean)
    : typeof product.tags === 'string' && product.tags.trim()
      ? product.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

  const displayCategory = typeof product.category === 'object' && product.category !== null
    ? (product.category.name || product.category.type || 'General')
    : (product.category || 'General');

  return (
    <>
      {/* 1. รูป (Image): Compact 32x32 thumbnail */}
      <td className="px-2 py-1.5 align-middle w-12 text-center">
        <div className="w-8 h-8 bg-dh-base rounded-lg flex items-center justify-center text-dh-muted border border-dh-border overflow-hidden group-hover:border-dh-accent/50 group-hover:scale-105 transition-all shadow-xs mx-auto">
          {displayImage ? (
            <img 
              src={displayImage} 
              alt={product.sku} 
              width={32} 
              height={32} 
              className="w-full h-full object-cover" 
              onError={(e) => handleImageError(e, imgCandidate)} 
              loading="lazy" 
            />
          ) : (
            <Image size={15} className="opacity-50" />
          )}
        </div>
      </td>

      {/* 2. SKU / ชื่อสินค้า */}
      <td className="px-3 py-1.5 align-middle">
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap leading-tight">
          <span className="font-bold text-[13px] md:text-[14px] text-dh-main shrink-0 group-hover:text-dh-accent transition-colors">
            {product.sku}
          </span>
          {product.name && (
            <span className="text-dh-muted text-[12px] md:text-[13px] font-medium truncate" title={product.name}>
              {product.name}
            </span>
          )}
          {product.isActive === false && (
            <span className="text-[10px] shrink-0 bg-red-500/10 border border-red-500/20 text-red-500 px-1.5 py-0.5 rounded-sm shadow-xs">
              ปิดการขาย
            </span>
          )}
        </div>
        {normalizedTags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {normalizedTags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[9px] bg-dh-base text-dh-muted px-1.5 py-0.5 rounded-full border border-dh-border group-hover:border-dh-accent/30 group-hover:text-dh-main transition-colors">
                {tag}
              </span>
            ))}
            {normalizedTags.length > 2 && (
              <span className="text-[9px] bg-dh-base text-dh-muted px-1.5 py-0.5 rounded-full border border-dh-border">
                +{normalizedTags.length - 2}
              </span>
            )}
          </div>
        )}
      </td>

      {/* 3. หมวดหมู่ */}
      <td className="px-1 py-1.5 text-center align-middle whitespace-nowrap w-[84px] shrink-0">
        <span 
          className="text-[11px] font-bold text-dh-muted bg-dh-base px-2 py-0.5 rounded-md border border-dh-border shadow-2xs group-hover:bg-dh-surface transition-colors truncate max-w-[80px] inline-block"
          title={displayCategory}
        >
          {displayCategory}
        </span>
      </td>

      {/* 4. ราคาส่ง (ฐาน) */}
      <td className="px-1 py-1.5 text-center align-middle whitespace-nowrap w-20 shrink-0">
        <div className="font-black text-[15px] text-dh-main inline-flex items-baseline justify-center gap-0.5 group-hover:text-dh-accent transition-colors">
          <span className="text-[10px] opacity-70">฿</span>
          {!isNaN(priceVal) ? priceVal.toLocaleString() : '0'}
        </div>
      </td>

      {/* 5. ราคาปกติ */}
      <td className="px-1 py-1.5 text-center align-middle whitespace-nowrap w-20 shrink-0">
        <div className="font-medium text-[12px] text-dh-muted opacity-80 group-hover:opacity-100 group-hover:text-dh-main transition-all inline-flex items-baseline justify-center">
          <span className="text-[10px] mr-0.5">฿</span>
          {!isNaN(retailPriceVal) ? retailPriceVal.toLocaleString() : '0'}
        </div>
      </td>

      {/* 6. คงเหลือ */}
      <td className="px-1 py-1.5 text-center align-middle whitespace-nowrap w-[68px] shrink-0 bg-[#FFF2CC] group-hover:bg-[#faebbd] dark:bg-amber-950/30 dark:group-hover:bg-amber-950/50 transition-colors border-l border-b border-black dark:border-slate-400">
        <div className="inline-flex items-center justify-center">
          <div className={`font-black text-[17px] tracking-tight transition-all ${Number(product.stockQuantity ?? 0) > 0 ? 'text-[#CC0000] dark:text-red-400' : 'text-[#D9D9D9] dark:text-slate-500'}`}>
            {product.stockQuantity ?? 0}
          </div>
        </div>
      </td>

      {/* 7. เข้า [N] วัน */}
      <td className="px-1 py-1.5 text-center align-middle whitespace-nowrap w-[68px] shrink-0 border-l border-b border-black dark:border-slate-400 bg-[#FFF9E6] group-hover:bg-[#faeed0] dark:bg-amber-950/20 dark:group-hover:bg-amber-950/35 transition-colors">
        <div className="group/tooltip relative inline-flex justify-center">
          <span className={`transition-all inline-flex items-center justify-center select-none ${stockIn > 0 ? 'font-medium text-[15px] text-slate-700 dark:text-slate-200 tracking-tight' : 'font-normal text-[14px] text-[#F9CB9C] dark:text-amber-600/70'}`}>
            {stockIn > 0 ? `+${stockIn}` : 0}
          </span>
          {stockIn > 0 && (
            <div className="absolute bottom-full mb-2 hidden group-hover/tooltip:block bg-dh-main text-dh-base text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50">
              มีสินค้าเข้า <span className="text-amber-400">+{stockIn}</span> รายการ ใน {salesPeriod} วัน
            </div>
          )}
        </div>
      </td>

      {/* 8. ขาย [N] วัน */}
      <td className="px-1 py-1.5 text-center align-middle whitespace-nowrap w-[68px] shrink-0 border-l border-b border-black dark:border-slate-400 bg-[#3D85C6] group-hover:bg-[#3474ad] dark:bg-blue-900/70 dark:group-hover:bg-blue-900/90 transition-colors">
        <div className="group/tooltip relative inline-flex justify-center">
          <span className={`transition-all inline-flex items-center justify-center select-none ${sales > 0 ? 'font-black text-[16px] text-white tracking-tight' : 'font-bold text-[13px] text-[#6D9EEB] dark:text-blue-300'}`}>
            {sales > 0 ? sales : 0}
          </span>
          {sales > 0 && (
            <div className="absolute bottom-full mb-2 hidden group-hover/tooltip:block bg-dh-main text-dh-base text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50">
              ขายออก <span className="text-[#38bdf8] dark:text-[#38bdf8]">{sales}</span> รายการ ใน {salesPeriod} วัน
            </div>
          )}
        </div>
      </td>

      {/* 9. ของเสีย [N] วัน */}
      <td className="px-1 py-1.5 text-center align-middle whitespace-nowrap w-[68px] shrink-0 border-l border-b border-black dark:border-slate-400">
        <div className="group/tooltip relative inline-flex justify-center">
          <span className={`transition-all inline-flex items-center justify-center select-none ${claim > 0 ? 'font-black text-[16px] text-red-500 dark:text-red-400 tracking-tight' : 'font-bold text-[13px] text-dh-muted/40'}`}>
            {claim > 0 ? `-${claim}` : 0}
          </span>
          {claim > 0 && (
            <div className="absolute bottom-full mb-2 hidden group-hover/tooltip:block bg-dh-main text-dh-base text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50">
              ของเสีย / เคลม <span className="text-red-400">-{claim}</span> รายการ ใน {salesPeriod} วัน
            </div>
          )}
        </div>
      </td>

      {/* 10. ปรับยอด [N] วัน */}
      <td className={`px-1 py-1.5 text-center align-middle whitespace-nowrap w-[68px] shrink-0 border-l border-r border-b border-black dark:border-slate-400 transition-colors ${adjustment > 0 ? 'bg-[#00FF00] group-hover:bg-[#00e600] dark:bg-green-600 dark:group-hover:bg-green-700' : adjustment < 0 ? 'bg-[#FF0000] group-hover:bg-[#e60000] dark:bg-red-600 dark:group-hover:bg-red-700' : ''}`}>
        <div className="group/tooltip relative inline-flex justify-center">
          <span className={`transition-all inline-flex items-center justify-center select-none ${adjustment === 0 ? 'font-bold text-[14px] text-dh-muted/40' : 'font-black text-[17px] text-[#c026d3] dark:text-[#f472b6] tracking-tight'}`}>
            {adjustment > 0 ? `+${adjustment}` : adjustment}
          </span>
          {adjustment !== 0 && (
            <div className="absolute bottom-full mb-2 hidden group-hover/tooltip:block bg-dh-main text-dh-base text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50">
              ปรับปรุงสต๊อก <span className="text-fuchsia-400">{adjustment > 0 ? `+${adjustment}` : adjustment}</span> รายการ ใน {salesPeriod} วัน
            </div>
          )}
        </div>
      </td>
    </>
  );
};

export default React.memo(ProductTableRow);
