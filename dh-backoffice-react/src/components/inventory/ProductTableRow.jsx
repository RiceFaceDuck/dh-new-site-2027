import React from 'react';
import { Image as ImageIcon, AlertCircle, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';

export default function ProductTableRow({ product, onEdit, salesPeriod, globalBufferStock }) {
  const effectiveBuffer = (product.bufferStock !== undefined && product.bufferStock !== null && product.bufferStock !== '') 
                            ? Number(product.bufferStock) 
                            : Number(globalBufferStock);

  return (
    <tr 
      onClick={() => onEdit(product)}
      className="group cursor-pointer transition-all duration-200 border-b border-dh-border last:border-none even:bg-black/5 dark:even:bg-white/5 hover:bg-dh-accent-light/30 hover:shadow-[inset_4px_0_0_var(--dh-accent)]"
    >
      <td className="px-3 py-3 align-middle">
        <div className="w-10 h-10 bg-dh-base rounded-xl flex items-center justify-center text-dh-muted border border-dh-border overflow-hidden group-hover:border-dh-accent/50 group-hover:scale-105 transition-all shadow-sm mx-auto">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.sku} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = ''; }} />
          ) : (
            <ImageIcon size={18} className="opacity-50" />
          )}
        </div>
      </td>
      <td className="px-3 py-3 align-middle">
        <div className="font-bold text-[14px] text-dh-main flex items-center gap-2 group-hover:text-dh-accent transition-colors leading-tight">
          {product.sku}
          {!product.isActive && <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-500 px-1.5 py-0.5 rounded shadow-sm">ปิดการขาย</span>}
        </div>
        <div className="text-dh-muted line-clamp-1 text-[12px] mt-0.5 font-medium">{product.name}</div>
        <div className="flex gap-1.5 mt-1.5 flex-wrap">
          {product.tags?.slice(0, 2).map(t => <span key={t} className="text-[10px] bg-dh-base text-dh-muted px-2 py-0.5 rounded-full border border-dh-border group-hover:border-dh-accent/30 group-hover:text-dh-main transition-colors">{t}</span>)}
          {product.tags?.length > 2 && <span className="text-[10px] bg-dh-base text-dh-muted px-2 py-0.5 rounded-full border border-dh-border">+{product.tags.length - 2}</span>}
        </div>
      </td>
      <td className="px-3 py-3 align-middle whitespace-nowrap">
        <span className="text-[12px] font-bold text-dh-muted bg-dh-base px-2.5 py-1 rounded-lg border border-dh-border shadow-sm group-hover:bg-dh-surface transition-colors">
          {product.category}
        </span>
      </td>

      <td className="px-3 py-3 text-right align-middle whitespace-nowrap">
        <div className="font-black text-[18px] text-dh-main inline-flex items-baseline gap-0.5 group-hover:text-dh-accent transition-colors">
          <span className="text-[12px] opacity-70">฿</span>
          {Number(product.Price || 0).toLocaleString()}
        </div>
      </td>

      <td className="px-3 py-3 text-right align-middle whitespace-nowrap">
        <div className="font-medium text-[13px] text-dh-muted opacity-80 group-hover:opacity-100 group-hover:text-dh-main transition-all">
          <span className="text-[11px] mr-0.5">฿</span>
          {Number(product.retailPrice || 0).toLocaleString()}
        </div>
      </td>

      <td className="px-2 py-3 text-center align-middle whitespace-nowrap border-l border-dh-border/50">
        <div className="group/tooltip relative inline-flex justify-center">
          <span className={`font-bold text-[12px] px-2 py-1 rounded-lg border shadow-sm transition-colors inline-flex items-center justify-center min-w-[36px] gap-0.5 ${
            (product.stockInHistory?.[salesPeriod] || 0) > 0 
            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
            : 'bg-dh-base text-dh-muted border-dh-border group-hover:bg-dh-surface'
          }`}>
            {(product.stockInHistory?.[salesPeriod] || 0) > 0 && <TrendingUp size={10} className="opacity-70" />}
            {product.stockInHistory?.[salesPeriod] || 0}
          </span>
          {(product.stockInHistory?.[salesPeriod] || 0) > 0 && (
            <div className="absolute bottom-full mb-2 hidden group-hover/tooltip:block bg-dh-main text-dh-base text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50">
              มีสินค้าเข้า <span className="text-blue-400">{product.stockInHistory?.[salesPeriod]}</span> รายการ ใน {salesPeriod} วัน
            </div>
          )}
        </div>
      </td>

      <td className="px-2 py-3 text-center align-middle whitespace-nowrap">
        <div className="group/tooltip relative inline-flex justify-center">
          <span className={`font-bold text-[12px] px-2 py-1 rounded-lg border shadow-sm transition-colors inline-flex items-center justify-center min-w-[36px] gap-0.5 ${
            (product.salesHistory?.[salesPeriod] || 0) > 0 
            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
            : 'bg-dh-base text-dh-muted border-dh-border group-hover:bg-dh-surface'
          }`}>
            {(product.salesHistory?.[salesPeriod] || 0) > 0 && <TrendingDown size={10} className="opacity-70" />}
            {product.salesHistory?.[salesPeriod] || 0}
          </span>
          {(product.salesHistory?.[salesPeriod] || 0) > 0 && (
            <div className="absolute bottom-full mb-2 hidden group-hover/tooltip:block bg-dh-main text-dh-base text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50">
              ขายออก <span className="text-green-400">{product.salesHistory?.[salesPeriod]}</span> รายการ ใน {salesPeriod} วัน
            </div>
          )}
        </div>
      </td>

      <td className="px-2 py-3 text-center align-middle whitespace-nowrap">
        <div className="group/tooltip relative inline-flex justify-center">
          <span className={`font-bold text-[12px] px-2 py-1 rounded-lg border shadow-sm transition-colors inline-flex items-center justify-center min-w-[36px] gap-0.5 ${
            (product.claimHistory?.[salesPeriod] || 0) > 0 
            ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
            : 'bg-dh-base text-dh-muted border-dh-border group-hover:bg-dh-surface'
          }`}>
            {(product.claimHistory?.[salesPeriod] || 0) > 0 && <RefreshCcw size={10} className="opacity-70" />}
            {product.claimHistory?.[salesPeriod] || 0}
          </span>
          {(product.claimHistory?.[salesPeriod] || 0) > 0 && (
            <div className="absolute bottom-full mb-2 hidden group-hover/tooltip:block bg-dh-main text-dh-base text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50">
              มีการเคลม <span className="text-orange-400">{product.claimHistory?.[salesPeriod]}</span> รายการ ใน {salesPeriod} วัน
            </div>
          )}
        </div>
      </td>

      <td className="px-3 py-3 text-center align-middle whitespace-nowrap">
        <div className="inline-flex items-baseline gap-1">
          <div className={`font-black text-[22px] tracking-tight ${Number(product.stockQuantity) <= effectiveBuffer ? 'text-red-500' : 'text-dh-main group-hover:text-dh-accent transform group-hover:scale-110'} transition-all`}>
            {product.stockQuantity || 0}
          </div>
          <span className="text-[10px] font-bold text-dh-muted uppercase">{product.unit || 'ชิ้น'}</span>
        </div>
      </td>
    </tr>
  );
}
