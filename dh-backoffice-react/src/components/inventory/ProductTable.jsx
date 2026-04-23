import React from 'react';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function ProductTable({ products, onEdit, salesPeriod, globalBufferStock = 2 }) {
  
  const getStatusBadge = (stock, buffer) => {
    const stockNum = Number(stock || 0);
    const effectiveBuffer = (buffer !== undefined && buffer !== null && buffer !== '') 
                              ? Number(buffer) 
                              : Number(globalBufferStock);

    if (stockNum <= 0) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/20 dark:text-red-400"><AlertCircle size={10} className="mr-1"/> หมดสต๊อก</span>;
    }
    if (stockNum <= effectiveBuffer) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20 dark:text-orange-400"><AlertCircle size={10} className="mr-1"/> ระวังของหมด</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20 dark:text-green-400">พร้อมขาย</span>;
  };

  return (
    <div className="bg-dh-surface rounded-2xl shadow-dh-card border border-dh-border overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar max-h-[calc(100vh-18rem)]">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-dh-base text-dh-muted text-[10px] font-extrabold uppercase tracking-wider border-b border-dh-border sticky top-0 z-20 backdrop-blur-md bg-opacity-90">
            <tr>
              <th className="px-3 py-2.5 whitespace-nowrap w-12 text-center">รูป</th>
              <th className="px-3 py-2.5 whitespace-nowrap min-w-[200px]">SKU / ชื่อสินค้า</th>
              <th className="px-3 py-2.5 whitespace-nowrap">หมวดหมู่</th>
              <th className="px-3 py-2.5 whitespace-nowrap text-right">ราคาส่ง(ฐาน)</th>
              <th className="px-3 py-2.5 whitespace-nowrap text-right">ราคาปลีก</th>
              <th className="px-3 py-2.5 whitespace-nowrap text-center">คงเหลือ</th>
              <th className="px-3 py-2.5 whitespace-nowrap text-center">ขายแล้ว ({salesPeriod} วัน)</th>
              <th className="px-3 py-2.5 whitespace-nowrap text-center">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dh-border">
            {products.map((product) => {
              const effectiveBuffer = (product.bufferStock !== undefined && product.bufferStock !== null && product.bufferStock !== '') 
                                        ? Number(product.bufferStock) 
                                        : Number(globalBufferStock);

              return (
                // ✨ ลูกเล่น: ม้าลาย + แถบสีนำสายตาเมื่อ Hover
                <tr 
                  key={product.id} 
                  onClick={() => onEdit(product)}
                  className="group cursor-pointer transition-all duration-200 border-b border-dh-border last:border-none even:bg-dh-base/30 hover:bg-dh-accent-light/30 hover:shadow-[inset_4px_0_0_var(--dh-accent)]"
                >
                  <td className="px-3 py-2 align-middle">
                    <div className="w-9 h-9 bg-dh-base rounded-lg flex items-center justify-center text-dh-muted border border-dh-border overflow-hidden group-hover:border-dh-accent/50 transition-colors shadow-sm mx-auto">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.sku} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = ''; }} />
                      ) : (
                        <ImageIcon size={16} className="opacity-50" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <div className="font-bold text-[13px] text-dh-main flex items-center gap-2 group-hover:text-dh-accent transition-colors leading-tight">
                      {product.sku}
                      {!product.isActive && <span className="text-[9px] bg-dh-base border border-dh-border text-dh-muted px-1.5 py-0.5 rounded shadow-sm">ปิดการขาย</span>}
                    </div>
                    <div className="text-dh-muted line-clamp-1 text-[11px] mt-0.5 font-medium">{product.name}</div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {product.tags?.slice(0, 2).map(t => <span key={t} className="text-[9px] bg-dh-base text-dh-muted px-1.5 py-0.5 rounded border border-dh-border group-hover:border-dh-accent/30 group-hover:text-dh-main transition-colors">{t}</span>)}
                      {product.tags?.length > 2 && <span className="text-[9px] bg-dh-base text-dh-muted px-1.5 py-0.5 rounded border border-dh-border">+{product.tags.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-middle whitespace-nowrap">
                    <span className="text-[11px] font-bold text-dh-muted bg-dh-base px-2 py-1 rounded-md border border-dh-border shadow-sm group-hover:bg-dh-surface transition-colors">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right align-middle whitespace-nowrap">
                    <div className="font-bold text-[13px] text-dh-main group-hover:text-dh-accent transition-colors">
                      ฿{Number(product.Price || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right align-middle whitespace-nowrap">
                    <div className="font-black text-[13px] text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md inline-block border border-green-500/20 group-hover:bg-green-500/20 transition-colors">
                      ฿{Number(product.retailPrice || 0).toLocaleString()}
                    </div>
                  </td>
                  
                  <td className="px-3 py-2 text-center align-middle whitespace-nowrap">
                    <div className={`font-black text-[14px] ${Number(product.stockQuantity) <= effectiveBuffer ? 'text-red-500' : 'text-dh-main group-hover:text-dh-accent'} transition-colors`}>
                      {product.stockQuantity || 0}
                    </div>
                    <div className="text-[9px] text-dh-muted font-bold uppercase tracking-wider">{product.unit || 'ชิ้น'}</div>
                  </td>

                  <td className="px-3 py-2 text-center align-middle whitespace-nowrap">
                    <span className="font-bold text-[12px] text-dh-main bg-dh-base group-hover:bg-dh-surface px-2.5 py-1 rounded-lg border border-dh-border shadow-sm transition-colors inline-block min-w-[32px]">
                      {product.salesHistory?.[salesPeriod] || 0}
                    </span>
                  </td>

                  <td className="px-3 py-2 text-center align-middle whitespace-nowrap">
                    {getStatusBadge(product.stockQuantity, product.bufferStock)}
                  </td>
                </tr>
              );
            })}
            
            {products.length === 0 && (
              <tr>
                <td colSpan="8" className="px-6 py-16 text-center text-dh-muted bg-dh-base/50">
                  <AlertCircle size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="font-bold text-sm">ไม่มีรายการสินค้าในคลัง</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}