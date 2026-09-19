import React from 'react';
import { AlertCircle } from 'lucide-react';
import { TableVirtuoso } from 'react-virtuoso';
import ProductTableRow from './ProductTableRow';

export default function ProductTable({ products, onEdit, salesPeriod, globalBufferStock = 2, sortConfig, onSort }) {
  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return <span className="ml-1 opacity-20">↕</span>;
    return sortConfig.direction === 'asc' ? <span className="ml-1 text-dh-accent">↑</span> : <span className="ml-1 text-dh-accent">↓</span>;
  };

  const SortableHeader = ({ label, subLabel, sortKey, align = 'left', className = '', labelClassName = '', subLabelClassName = '' }) => (
    <th 
      className={`px-1 py-2 cursor-pointer hover:bg-dh-accent/10 transition-colors align-middle group/th ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${className}`}
      onClick={() => onSort?.(sortKey)}
    >
      <div className={`inline-flex flex-col select-none justify-center ${align === 'right' ? 'items-end' : align === 'center' ? 'items-center' : 'items-start'}`}>
        <div className="inline-flex items-center gap-1">
          <span className={`text-[13px] md:text-[14px] font-bold ${labelClassName || 'text-dh-main'} group-hover/th:text-dh-accent transition-colors whitespace-nowrap`}>
            {label}
          </span>
          <span className="text-[12px]">{getSortIcon(sortKey)}</span>
        </div>
        {subLabel && (
          <span className={`text-[11px] font-semibold leading-tight mt-0.5 whitespace-nowrap ${subLabelClassName || 'text-dh-muted'}`}>
            {subLabel}
          </span>
        )}
      </div>
    </th>
  );

  // 🚀 Performance Optimization: Memoize Table Components
  const virtuosoComponents = React.useMemo(() => ({
    Table: ({ style, ...props }) => (
      <table {...props} style={style} className="w-full text-sm text-left border-collapse table-fixed" />
    ),
    TableHead: React.forwardRef((props, ref) => (
      <thead {...props} ref={ref} className="bg-dh-surface text-dh-main border-b-2 border-slate-300 dark:border-slate-600 sticky top-0 z-20 backdrop-blur-md bg-opacity-95 shadow-lg shadow-slate-900/25 dark:shadow-black/70" />
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
          onClick={() => onEdit?.(product)}
          className={`group cursor-pointer transition-all duration-200 border-b border-dh-border last:border-none even:bg-black/5 dark:even:bg-white/5 hover:bg-dh-accent-light/30 hover:shadow-[inset_4px_0_0_var(--dh-accent)] ${props.className || ''}`}
        />
      );
    },
    EmptyPlaceholder: () => (
      <tbody>
        <tr>
          <td colSpan="10" className="px-6 py-24 text-center text-dh-muted bg-dh-base/30">
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
          <tr className="h-11">
            <th className="px-2 py-2 whitespace-nowrap w-12 text-center align-middle text-[13px] md:text-[14px] font-bold text-slate-800 dark:text-slate-100 bg-slate-200 dark:bg-slate-700 border-b-2 border-slate-300 dark:border-slate-600">
              รูป
            </th>
            <th className="px-3 py-2 whitespace-nowrap align-middle text-[13px] md:text-[14px] font-bold text-slate-800 dark:text-slate-100 bg-slate-200 dark:bg-slate-700 border-b-2 border-slate-300 dark:border-slate-600">
              SKU / ชื่อสินค้า
            </th>
            <SortableHeader
              label="หมวดหมู่"
              sortKey="category"
              align="center"
              className="w-[84px] shrink-0 bg-slate-200 dark:bg-slate-700 border-b-2 border-slate-300 dark:border-slate-600"
              labelClassName="text-slate-800 dark:text-slate-100"
            />
            <SortableHeader
              label="ราคาส่ง"
              subLabel="(ฐาน)"
              sortKey="Price"
              align="center"
              className="w-20 shrink-0 bg-sky-200 dark:bg-sky-900/60 border-l border-sky-300 dark:border-sky-800 border-b-2 border-slate-300 dark:border-slate-600"
              labelClassName="text-sky-950 dark:text-sky-100"
              subLabelClassName="text-sky-800 dark:text-sky-300"
            />
            <SortableHeader
              label="ราคาปกติ"
              sortKey="retailPrice"
              align="center"
              className="w-20 shrink-0 bg-sky-200 dark:bg-sky-900/60 border-b-2 border-slate-300 dark:border-slate-600"
              labelClassName="text-sky-950 dark:text-sky-100"
            />
            <SortableHeader
              label="คงเหลือ"
              sortKey="stock"
              align="center"
              className="w-[68px] shrink-0 bg-[#FEE499] dark:bg-amber-800/60 border-l border-b border-black dark:border-slate-400"
              labelClassName="text-red-700 dark:text-red-300 font-black"
            />
            <SortableHeader
              label="เข้า"
              subLabel={`${salesPeriod} วัน`}
              sortKey="stockIn"
              align="center"
              className="w-[68px] shrink-0 bg-amber-100 dark:bg-amber-950/60 border-l border-b border-black dark:border-slate-400"
              labelClassName="text-amber-900 dark:text-amber-200"
              subLabelClassName="text-amber-800/80 dark:text-amber-300/80"
            />
            <SortableHeader
              label="ขาย"
              subLabel={`${salesPeriod} วัน`}
              sortKey="sales"
              align="center"
              className="w-[68px] shrink-0 bg-blue-100 dark:bg-blue-950/60 border-l border-b border-black dark:border-slate-400"
              labelClassName="text-blue-950 dark:text-blue-200"
              subLabelClassName="text-blue-800/80 dark:text-blue-300/80"
            />
            <SortableHeader
              label="ของเสีย"
              subLabel={`${salesPeriod} วัน`}
              sortKey="claim"
              align="center"
              className="w-[68px] shrink-0 bg-rose-100 dark:bg-rose-950/60 border-l border-b border-black dark:border-slate-400"
              labelClassName="text-rose-950 dark:text-rose-200"
              subLabelClassName="text-rose-800/80 dark:text-rose-300/80"
            />
            <SortableHeader
              label="ปรับยอด"
              subLabel={`${salesPeriod} วัน`}
              sortKey="adjustment"
              align="center"
              className="w-[68px] shrink-0 bg-fuchsia-100 dark:bg-fuchsia-950/60 border-l border-r border-b border-black dark:border-slate-400"
              labelClassName="text-fuchsia-950 dark:text-fuchsia-200"
              subLabelClassName="text-fuchsia-800/80 dark:text-fuchsia-300/80"
            />
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