import React from 'react';
import { AlertCircle } from 'lucide-react';
import { TableVirtuoso } from 'react-virtuoso';
import ProductTableRow from './ProductTableRow';

export default function ProductTable({ products, onEdit, salesPeriod, globalBufferStock = 2, sortConfig, onSort }) {
  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return <span className="ml-1 opacity-20">↕</span>;
    return sortConfig.direction === 'asc' ? <span className="ml-1 text-dh-accent">↑</span> : <span className="ml-1 text-dh-accent">↓</span>;
  };

  const SortableHeader = ({ label, sortKey, align = 'left', className = '' }) => (
    <th 
      className={`px-3 py-3 whitespace-nowrap cursor-pointer hover:bg-dh-accent/10 transition-colors ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center inline-flex select-none ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {label} {getSortIcon(sortKey)}
      </div>
    </th>
  );

  // 🚀 Performance Optimization: Memoize Table Components
  const virtuosoComponents = React.useMemo(() => ({
    Table: ({ style, ...props }) => (
      <table {...props} style={style} className="w-full text-sm text-left border-collapse" />
    ),
    TableHead: React.forwardRef((props, ref) => (
      <thead {...props} ref={ref} className="bg-dh-surface text-dh-accent text-[12px] font-black uppercase tracking-wider border-b-2 border-dh-border sticky top-0 z-20 backdrop-blur-md bg-opacity-95 shadow-xs" />
    )),
    TableBody: React.forwardRef((props, ref) => (
      <tbody {...props} ref={ref} className="divide-y divide-dh-border" />
    )),
    TableRow: (props) => {
      const product = props.item;
      if (!product) return <tr {...props} />;
      return (
        <tr 
          {...props}
          onClick={() => onEdit(product)}
          className={`group cursor-pointer transition-all duration-200 border-b border-dh-border last:border-none even:bg-black/5 dark:even:bg-white/5 hover:bg-dh-accent-light/30 hover:shadow-[inset_4px_0_0_var(--dh-accent)] ${props.className || ''}`}
        />
      );
    },
    EmptyPlaceholder: () => (
      <tbody>
        <tr>
          <td colSpan="9" className="px-6 py-24 text-center text-dh-muted bg-dh-base/30">
            <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 bg-white rounded-full shadow-xs mb-4 border border-dh-border/50">
                <AlertCircle size={36} className="text-dh-accent opacity-60" />
              </div>
              <p className="font-black text-xl text-dh-main tracking-tight">ไม่มีรายการสินค้าในคลัง</p>
              <p className="font-medium text-sm mt-2 text-dh-muted">ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "เพิ่มสินค้า" เพื่อเริ่มสร้างคลังของคุณ</p>
            </div>
          </td>
        </tr>
      </tbody>
    )
  }), [onEdit]);

  return (
    <div className="bg-dh-surface rounded-2xl shadow-dh-card border border-dh-border overflow-hidden flex flex-col flex-1 h-full min-h-[300px]">
      <TableVirtuoso
        data={products}
        className="custom-scrollbar w-full h-full"
        components={virtuosoComponents}
        fixedHeaderContent={() => (
          <tr>
            <th className="px-3 py-3 whitespace-nowrap w-14 text-center">รูป</th>
            <th className="px-3 py-3 whitespace-nowrap">SKU / ชื่อสินค้า</th>
            <SortableHeader label="หมวดหมู่" sortKey="category" align="right" className="w-28 shrink-0" />
            <SortableHeader label="ราคาส่ง(ฐาน)" sortKey="Price" align="right" className="w-32 shrink-0" />
            <SortableHeader label="ราคาปกติ" sortKey="retailPrice" align="right" className="w-28 shrink-0" />
            <SortableHeader label={`เข้า ${salesPeriod}D`} sortKey="stockIn" align="center" className="w-24 shrink-0" />
            <SortableHeader label={`ขาย ${salesPeriod}D`} sortKey="sales" align="center" className="w-24 shrink-0" />
            <SortableHeader label={`เคลม ${salesPeriod}D`} sortKey="claim" align="center" className="w-24 shrink-0" />
            <SortableHeader label="คงเหลือ" sortKey="stock" align="right" className="w-28 shrink-0" />
          </tr>
        )}
        itemContent={(index, product) => (
          <ProductTableRow 
            product={product} 
            onEdit={onEdit} 
            salesPeriod={salesPeriod} 
            globalBufferStock={globalBufferStock} 
          />
        )}
      />
    </div>
  );
}