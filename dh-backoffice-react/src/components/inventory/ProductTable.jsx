import React from 'react';
import { AlertCircle } from 'lucide-react';
import ProductTableRow from './ProductTableRow';

export default function ProductTable({ products, onEdit, salesPeriod, globalBufferStock = 2 }) {
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
              <th className="px-3 py-3 whitespace-nowrap text-right min-w-[120px]">ราคาส่ง(ฐาน)</th>
              <th className="px-3 py-3 whitespace-nowrap text-right min-w-[100px] text-dh-muted opacity-80">ราคาปลีก</th>
              
              <th className="px-2 py-3 whitespace-nowrap text-center w-[80px] border-l border-dh-border/50">เข้า {salesPeriod}D</th>
              <th className="px-2 py-3 whitespace-nowrap text-center w-[80px]">ขาย {salesPeriod}D</th>
              <th className="px-2 py-3 whitespace-nowrap text-center w-[80px]">เคลม {salesPeriod}D</th>
              <th className="px-3 py-3 whitespace-nowrap text-center min-w-[90px]">คงเหลือ</th>
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
                <td colSpan="9" className="px-6 py-20 text-center text-dh-muted bg-dh-base/50">
                  <AlertCircle size={40} className="mx-auto mb-4 opacity-20 text-dh-accent" />
                  <p className="font-black text-lg text-dh-main">ไม่มีรายการสินค้าในคลัง</p>
                  <p className="font-medium text-sm mt-1">ลองเปลี่ยนคำค้นหา หรือเพิ่มสินค้าใหม่</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}