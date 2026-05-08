import React, { useEffect } from 'react';
import { X, Crown, ShieldAlert, Search } from 'lucide-react';

/**
 * 👑 หน้าต่างจัดการสิทธิ์ VIP (VIP Management Modal)
 * รับ Props ข้อมูล `vipUsers` และฟังก์ชันต่างๆ มาจาก useManagerDashboard
 */
const VipManagementModal = ({ isOpen, onClose, vipUsers, isLoading, onFetchVips, onRevokeVip }) => {
  // เมื่อเปิด Modal ให้ทำการดึงข้อมูล VIP ทันที
  useEffect(() => {
    if (isOpen) {
      onFetchVips();
    }
  }, [isOpen, onFetchVips]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[var(--dh-bg-surface)] w-full max-w-4xl rounded-2xl shadow-2xl border border-[var(--dh-border)] flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-[var(--dh-border)] flex justify-between items-center bg-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Crown size={20} />
            </div>
            <div>
              <h2 className="text-[16px] font-black text-[var(--dh-text-main)]">การจัดการระดับ VIP</h2>
              <p className="text-[12px] font-medium text-[var(--dh-text-muted)]">ดูรายชื่อและปลดสิทธิ์ลูกค้า VIP ในระบบทั้งหมด</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--dh-text-muted)] hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[var(--dh-bg-base)]">
          
          {/* แจ้งเตือนเรื่องนโยบาย */}
          <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex gap-3 items-start">
            <ShieldAlert size={20} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[13px] font-bold text-blue-900 mb-1">นโยบายการอัปเกรด VIP</h4>
              <p className="text-[12px] text-blue-800/80">ระบบจะทำการอัปเกรดลูกค้าที่มียอดซื้อครบ 300,000 บาท ขึ้นเป็น VIP โดยอัตโนมัติ ผู้จัดการสามารถปลดสิทธิ์ VIP ได้ในหน้านี้ (หากปลดแล้วระบบจะปรับแรงค์กลับไปเป็น Customer ทั่วไป)</p>
            </div>
          </div>

          {/* ตารางแสดงรายชื่อ VIP */}
          <div className="bg-[var(--dh-bg-surface)] border border-[var(--dh-border)] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--dh-bg-base)] border-b border-[var(--dh-border)]">
                    <th className="px-4 py-3 text-[11px] font-bold text-[var(--dh-text-muted)] uppercase tracking-wider">ข้อมูลลูกค้า VIP</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-[var(--dh-text-muted)] uppercase tracking-wider text-right w-32">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--dh-border)]">
                  {isLoading ? (
                    <tr>
                      <td colSpan="2" className="px-4 py-12 text-center">
                        <Search size={32} className="animate-spin mx-auto mb-4 text-[var(--dh-text-muted)]"/>
                        <p className="font-bold text-[var(--dh-text-muted)] text-[12px]">กำลังดึงข้อมูลระดับ VIP...</p>
                      </td>
                    </tr>
                  ) : vipUsers.length > 0 ? (
                    vipUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-[var(--dh-bg-base)]/50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                                <Crown size={18} />
                            </div>
                            <div>
                                <h4 className="text-[14px] font-bold text-[var(--dh-text-main)]">
                                  {user.accountName || user.firstName || 'ลูกค้า VIP'}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] text-[var(--dh-text-muted)]">{user.email || 'ไม่มีอีเมล'}</span>
                                  {user.phone && <span className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--dh-bg-surface)] border border-[var(--dh-border)] text-[var(--dh-text-muted)]">📞 {user.phone}</span>}
                                </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => {
                              if(window.confirm(`ยืนยันการปลดสิทธิ์ VIP ของ ${user.accountName || user.firstName}?`)){
                                onRevokeVip(user.id);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-red-600 bg-red-50 hover:bg-red-500 hover:text-white transition-colors border border-red-200 opacity-0 group-hover:opacity-100"
                          >
                            ปลดสิทธิ์
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="px-4 py-8 text-center text-[var(--dh-text-muted)] font-bold text-[12px]">
                        ยังไม่มีลูกค้าระดับ VIP ในระบบ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VipManagementModal;