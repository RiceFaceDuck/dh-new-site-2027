import React from 'react';
import { X, Edit2, Trash2, MapPin, Phone, Building2, Mail, User, ShoppingBag, ShieldAlert, Loader2, TrendingUp } from 'lucide-react';

export default function DetailPanel({
  customer,
  history,
  onClose,
  onEdit,
  onDelete
}) {
  if (!customer) return null;

  // Utility functions สำหรับฟอร์แมตข้อมูล
  const formatCurrency = (num) => Number(num || 0).toLocaleString('th-TH');
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = typeof timestamp === 'number' ? new Date(timestamp) : (timestamp.toDate ? timestamp.toDate() : new Date(timestamp));
    return date.toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-dh-base border-l border-dh-border shadow-xl">
      {/* 1. ส่วนหัว (Header & Actions) */}
      <div className="p-4 border-b border-dh-border flex justify-between items-start bg-dh-surface">
        <div className="min-w-0 pr-4">
          <h2 className="text-lg font-bold text-dh-main truncate">
            {customer.accountName || customer.displayName || 'ไม่มีชื่อร้าน/บริษัท'}
          </h2>
          <p className="text-sm text-dh-muted mt-0.5">
            รหัส: <span className="font-medium text-dh-main">{customer.customerCode || 'ไม่ระบุ'}</span>
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={() => onEdit(customer)} 
            className="p-2 hover:bg-dh-border rounded-lg text-dh-muted hover:text-dh-accent transition-colors" 
            title="แก้ไขข้อมูล"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={onDelete} 
            className="p-2 hover:bg-red-50 rounded-lg text-dh-muted hover:text-red-600 transition-colors" 
            title="ลบลูกค้ารายนี้"
          >
            <Trash2 size={16} />
          </button>
          <div className="w-px h-5 bg-dh-border mx-1"></div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-dh-border rounded-lg text-dh-muted hover:text-dh-main transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* 2. ส่วนเนื้อหาที่สามารถเลื่อนได้ (Scrollable Content) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        
        {/* สถิติสรุปแบบด่วน (Quick Stats) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50/80 border border-emerald-100 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-emerald-600 text-xs font-bold mb-1 flex items-center gap-1">
              <TrendingUp size={12} /> ยอดซื้อสะสม
            </span>
            <span className="text-emerald-700 text-lg font-black">฿{formatCurrency(customer.stats?.totalSales)}</span>
          </div>
          <div className="bg-blue-50/80 border border-blue-100 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-blue-600 text-xs font-bold mb-1">จำนวนบิลทั้งหมด</span>
            <span className="text-blue-700 text-lg font-black">{customer.stats?.totalOrders || 0} บิล</span>
          </div>
        </div>

        {/* ข้อมูลการติดต่อ (Contact Info) */}
        <div className="space-y-3 bg-white p-4 rounded-xl border border-dh-border shadow-sm">
          <h3 className="text-sm font-bold text-dh-main border-b border-dh-border pb-2 mb-3">ข้อมูลการติดต่อ</h3>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-start gap-2.5 text-dh-muted">
              <User size={16} className="mt-0.5 shrink-0" />
              <span className="text-dh-main font-medium">{customer.contactName || '-'}</span>
            </div>
            <div className="flex items-start gap-2.5 text-dh-muted">
              <Phone size={16} className="mt-0.5 shrink-0" />
              <span className="text-dh-main">{customer.phone || '-'}</span>
            </div>
            <div className="flex items-start gap-2.5 text-dh-muted">
              <Mail size={16} className="mt-0.5 shrink-0" />
              <span className="text-dh-main">{customer.email || '-'}</span>
            </div>
            <div className="flex items-start gap-2.5 text-dh-muted">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <span className="text-dh-main leading-relaxed">{customer.address || '-'}</span>
            </div>
          </div>
        </div>

        {/* ข้อมูลการจัดส่ง (Logistics) */}
        <div className="space-y-3 bg-white p-4 rounded-xl border border-dh-border shadow-sm">
          <h3 className="text-sm font-bold text-dh-main border-b border-dh-border pb-2 mb-3">ข้อมูลการจัดส่ง</h3>
          <div className="flex items-start gap-2.5 text-sm text-dh-muted">
            <Building2 size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-xs mb-0.5">บริษัทขนส่งที่ระบุ:</p>
              <p className="text-dh-main font-semibold text-base">{customer.logisticProvider || '-'}</p>
            </div>
          </div>
          {customer.logisticNote && (
            <div className="mt-3 p-2.5 bg-amber-50 rounded-lg text-amber-800 text-xs border border-amber-100 leading-relaxed shadow-sm">
              <span className="font-bold block mb-0.5">⚠️ หมายเหตุการจัดส่ง:</span> 
              {customer.logisticNote}
            </div>
          )}
        </div>

        {/* ส่วนประวัติ Order และ Claim (เรียก History state จาก Hook) */}
        <div className="space-y-3 bg-white p-4 rounded-xl border border-dh-border shadow-sm">
          <h3 className="text-sm font-bold text-dh-main flex items-center gap-2 border-b border-dh-border pb-2 mb-3">
            <ShoppingBag size={16} className="text-dh-accent"/> ประวัติการทำรายการล่าสุด
          </h3>
          
          {/* ป้องกัน history เป็น undefined ด้วยการใช้ optional chaining */}
          {history?.loading ? (
            <div className="flex flex-col items-center justify-center py-6 text-dh-muted gap-2">
              <Loader2 size={24} className="animate-spin text-dh-accent" />
              <span className="text-xs font-medium">กำลังโหลดประวัติ...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* รายการบิล (Orders) */}
              {history?.orders?.length > 0 ? (
                <div className="space-y-2">
                  {history.orders.slice(0, 3).map(order => (
                    <div key={order.id} className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex justify-between items-center text-sm transition-colors hover:bg-gray-100">
                      <div>
                        <p className="font-semibold text-dh-main">{order.orderId || order.id}</p>
                        <p className="text-xs text-dh-muted mt-0.5">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-dh-accent">฿{formatCurrency(order.totalAmount)}</p>
                        <p className="text-[10px] font-medium text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                          {order.status || 'สำเร็จ'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {history.orders.length > 3 && (
                    <button className="w-full text-center text-xs text-dh-accent hover:text-dh-accent-hover font-bold py-1">
                      ดูประวัติทั้งหมด ({history.orders.length})
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-5 text-sm text-dh-muted bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  ยังไม่มีประวัติการสั่งซื้อ
                </div>
              )}

              {/* รายการเคลม (Claims) */}
              {history?.claims?.length > 0 && (
                <div className="pt-2 border-t border-gray-100 mt-3">
                  <h4 className="text-xs font-bold text-red-600 flex items-center gap-1 mb-2">
                    <ShieldAlert size={14} /> ประวัติการเคลมสินค้า
                  </h4>
                  {history.claims.slice(0, 2).map(claim => (
                    <div key={claim.id} className="p-2.5 bg-red-50 border border-red-100 rounded-lg flex justify-between items-center text-xs text-red-800 mb-2">
                      <span className="font-semibold">เคลม #{claim.claimId || claim.id.substring(0,8)}</span>
                      <span className="font-bold bg-white px-2 py-0.5 rounded shadow-sm">{claim.status || 'รอดำเนินการ'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}