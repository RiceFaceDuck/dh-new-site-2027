import React from 'react';
import { AlertCircle } from 'lucide-react';
import ProductTableRow from './ProductTableRow';

export default function ProductTable({ products, onEdit, salesPeriod, globalBufferStock = 2, sortConfig, onSort }) {
  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return <span className="ml-1 opacity-20">↕</span>;
    return sortConfig.direction === 'asc' ? <span className="ml-1 text-dh-accent">↑</span> : <span className="ml-1 text-dh-accent">↓</span>;
  };

  const SortableHeader = ({ label, sortKey, align = 'left' }) => (
    <th 
      className={`px-3 py-3 whitespace-nowrap cursor-pointer hover:bg-dh-accent/10 transition-colors ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center inline-flex select-none ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {label} {getSortIcon(sortKey)}
      </div>
    </th>
  );

  return (
    <div className="bg-dh-surface rounded-2xl shadow-dh-card border border-dh-border overflow-hidden flex flex-col flex-1 h-full">
      <div className="overflow-x-auto custom-scrollbar flex-1 min-h-[300px]">
        <table className="w-full text-sm text-left border-collapse">
          {/* ✨ อัปเกรด Header ตาราง */}
          <thead className="bg-dh-surface text-dh-accent text-[12px] font-black uppercase tracking-wider border-b-2 border-dh-border sticky top-0 z-20 backdrop-blur-md bg-opacity-95 shadow-sm">
            <tr>
              <th className="px-3 py-3 whitespace-nowrap w-16 text-center">รูป</th>
              <th className="px-3 py-3 whitespace-nowrap min-w-[220px]">SKU / ชื่อสินค้า</th>
              <th className="px-3 py-3 whitespace-nowrap min-w-[100px]">หมวดหมู่</th>
              <SortableHeader label="ราคาส่ง(ฐาน)" sortKey="Price" align="right" />
              <SortableHeader label="ราคาปลีก" sortKey="retailPrice" align="right" />
              
              <SortableHeader label={`เข้า ${salesPeriod}D`} sortKey="stockIn" align="center" />
              <SortableHeader label={`ขาย ${salesPeriod}D`} sortKey="sales" align="center" />
              <SortableHeader label={`เคลม ${salesPeriod}D`} sortKey="claim" align="center" />
              <SortableHeader label="คงเหลือ" sortKey="stock" align="center" />
            </tr>
          </thead>
          <tbody className="divide-y divide-dh-border">
            {products.map((product) => (
              <ProductTableRow 
                key={product.id} 
                product={product} 
                onEdit={onEdit} 
                salesPeriod={salesPeriod} 
                globalBufferStock={globalBufferStock} 
              />
            ))}
            
            {products.length === 0 && (
              <tr>
                <td colSpan="9" className="px-6 py-24 text-center text-dh-muted bg-dh-base/30">
                  <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-4 bg-white rounded-full shadow-sm mb-4 border border-dh-border/50">
                      <AlertCircle size={36} className="text-dh-accent opacity-60" />
                    </div>
                    <p className="font-black text-xl text-dh-main tracking-tight">ไม่มีรายการสินค้าในคลัง</p>
                    <p className="font-medium text-sm mt-2 text-dh-muted">ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "เพิ่มสินค้า" เพื่อเริ่มสร้างคลังของคุณ</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}