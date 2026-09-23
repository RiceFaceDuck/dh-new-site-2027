import { useState, useEffect } from 'react';

const availableRoles = [
  { id: 'admin', label: 'Admin', sublabel: 'ผู้ดูแลระบบ', badgeColor: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'owner', label: 'Owner', sublabel: 'เจ้าของ', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'manager', label: 'Manager', sublabel: 'ผู้จัดการ', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'staff', label: 'Staff', sublabel: 'พนักงานทั่วไป', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'packer', label: 'Packer', sublabel: 'พนักงานแพ็คของ', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'developer', label: 'Developer', sublabel: 'นักพัฒนา/ไอที', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'finance', label: 'Finance', sublabel: 'ฝ่ายบัญชี/การเงิน', badgeColor: 'bg-teal-50 text-teal-700 border-teal-200' }
];

const permissionList = [
  { key: 'canEditProduct', label: 'สิทธิ์ในการแก้ไขข้อมูลสินค้า', description: 'อนุญาตให้แก้ไขชื่อ รูปภาพ หมวดหมู่ รายละเอียด และข้อมูลทั่วไปของสินค้า' },
  { key: 'canEditProductPrice', label: 'สิทธิ์ในการแก้ไขราคาสินค้า', description: 'อนุญาตให้ปรับเปลี่ยนราคาขายและราคาต้นทุนสินค้าในคลังได้' },
  { key: 'canDeleteOrder', label: 'สิทธิ์ในการลบบิล (ถาวร)', description: 'อนุญาตให้ลบรายการคำสั่งซื้อออกจากระบบและดึงจำนวนสต๊อกกลับคืน' },
  { key: 'canApproveRefund', label: 'สิทธิ์ในการอนุมัติการคืนเงิน', description: 'อนุญาตให้อนุมัติรายการเคลมและทำเรื่องคืนเงินให้ลูกค้า' },
  { key: 'canViewReports', label: 'สิทธิ์ในการดูรายงานสรุปยอดขาย', description: 'อนุญาตให้เข้าดูรายงานสรุปยอดขาย สถิติการขาย และผลกำไรธุรกิจ' },
  { key: 'canManageUsers', label: 'สิทธิ์ในการจัดการพนักงาน', description: 'อนุญาตให้ตั้งค่า เพิ่ม/ลดตำแหน่ง และมอบหมายสิทธิ์การใช้งานให้พนักงาน' },
  { key: 'canBypassBufferStock', label: 'สิทธิ์ในการขายสินค้าเกิน Buffer', description: 'อนุญาตให้ดึงจำนวนสต๊อกสำรองฉุกเฉิน (Buffer Stock) ออกมาขายได้' }
];

export default function RbacForm({ initialSettings, onSave }) {
  const [formData, setFormData] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSavedTime, setLastSavedTime] = useState(null);

  useEffect(() => {
    if (initialSettings) {
      setFormData(initialSettings);
    }
  }, [initialSettings]);

  const handleRoleToggle = async (permKey, roleId) => {
    const currentRoles = formData[permKey] || [];
    let updatedRoles;
    if (currentRoles.includes(roleId)) {
      updatedRoles = currentRoles.filter(r => r !== roleId);
    } else {
      updatedRoles = [...currentRoles, roleId];
    }
    const updated = { ...formData, [permKey]: updatedRoles };
    setFormData(updated);
    setSaveStatus('saving');
    const ok = await onSave(updated);
    if (ok) {
      setLastSavedTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setSaveStatus('saved');
    } else {
      setSaveStatus('error');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>ระบบบันทึกอัตโนมัติ (คลิกที่ช่องเพื่อสลับสิทธิ์)</span>
        </div>
        <div>
          {saveStatus === 'saving' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md animate-pulse shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              กำลังบันทึกข้อมูล...
            </span>
          ) : saveStatus === 'error' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-md shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง
            </span>
          ) : lastSavedTime ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              บันทึกสำเร็จล่าสุด {lastSavedTime} น.
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              พร้อมใช้งาน
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100 w-[38%] min-w-[280px]">
                รายการสิทธิ์ (Permission)
              </th>
              {availableRoles.map(role => (
                <th key={role.id} className="py-3 px-2 font-semibold text-center whitespace-nowrap">
                  <div className="inline-flex flex-col items-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${role.badgeColor}`}>
                      {role.label}
                    </span>
                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                      {role.sublabel}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {permissionList.map((perm, idx) => {
              const currentAllowed = formData[perm.key] || [];
              return (
                <tr 
                  key={perm.key} 
                  className={`transition-colors hover:bg-amber-50/40 dark:hover:bg-slate-800/50 ${idx % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-900/50' : ''}`}
                >
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">{perm.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">{perm.description}</p>
                  </td>
                  {availableRoles.map(role => {
                    const isChecked = currentAllowed.includes(role.id);
                    return (
                      <td key={role.id} className="py-3 px-2 text-center align-middle">
                        <label className="inline-flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all active:scale-95 group">
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-orange-600 border-slate-300 rounded-md focus:ring-orange-500 focus:ring-2 cursor-pointer transition-all accent-orange-600"
                            checked={isChecked}
                            onChange={() => handleRoleToggle(perm.key, role.id)}
                          />
                        </label>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
