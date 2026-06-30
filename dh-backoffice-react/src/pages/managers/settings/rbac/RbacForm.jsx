import React, { useState, useEffect } from 'react';

const availableRoles = [
  { id: 'admin', label: 'Admin (ผู้ดูแลระบบ)' },
  { id: 'owner', label: 'Owner (เจ้าของ)' },
  { id: 'manager', label: 'Manager (ผู้จัดการ)' },
  { id: 'staff', label: 'Staff (พนักงานทั่วไป)' },
  { id: 'packer', label: 'Packer (พนักงานแพ็คของ)' }
];

const permissionList = [
  { key: 'canDeleteOrder', label: 'สิทธิ์ในการลบบิล (ถาวร)', description: 'อนุญาตให้ลบคำสั่งซื้อออกจากระบบและดึงสต๊อกกลับ' },
  { key: 'canEditProductPrice', label: 'สิทธิ์ในการแก้ไขราคาสินค้า', description: 'อนุญาตให้ปรับเปลี่ยนราคาในคลังสินค้าได้' },
  { key: 'canApproveRefund', label: 'สิทธิ์ในการอนุมัติการคืนเงิน', description: 'อนุญาตให้อนุมัติรายการเคลมและการคืนเงิน' },
  { key: 'canViewReports', label: 'สิทธิ์ในการดูรายงานสรุปยอดขาย', description: 'อนุญาตให้ดูข้อมูลยอดขาย สถิติ และผลกำไร' },
  { key: 'canManageUsers', label: 'สิทธิ์ในการจัดการพนักงาน', description: 'อนุญาตให้ตั้งค่าและมอบหมายสิทธิ์ให้พนักงานคนอื่น' },
  { key: 'canBypassBufferStock', label: 'สิทธิ์ในการขายสินค้าเกิน Buffer', description: 'อนุญาตให้ดึงสต๊อกฉุกเฉิน (Buffer Stock) มาขายได้' }
];

export default function RbacForm({ initialSettings, onSave }) {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setFormData(initialSettings);
    }
  }, [initialSettings]);

  const handleRoleToggle = (permissionKey, roleId) => {
    setFormData(prev => {
      const currentRoles = prev[permissionKey] || [];
      let newRoles = [];
      if (currentRoles.includes(roleId)) {
        newRoles = currentRoles.filter(r => r !== roleId);
      } else {
        newRoles = [...currentRoles, roleId];
      }
      return { ...prev, [permissionKey]: newRoles };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200">
            <tr>
              <th className="p-3 font-semibold w-1/3">รายการสิทธิ์ (Permission)</th>
              {availableRoles.map(role => (
                <th key={role.id} className="p-3 font-semibold text-center whitespace-nowrap">
                  {role.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {permissionList.map(perm => {
              const currentAllowed = formData[perm.key] || [];
              return (
                <tr key={perm.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-3">
                    <p className="font-medium text-dh-main">{perm.label}</p>
                    <p className="text-xs text-dh-muted">{perm.description}</p>
                  </td>
                  {availableRoles.map(role => (
                    <td key={role.id} className="p-3 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-dh-primary border-slate-300 rounded focus:ring-dh-primary focus:ring-2 bg-slate-50 dark:bg-slate-700 dark:border-slate-600"
                          checked={currentAllowed.includes(role.id)}
                          onChange={() => handleRoleToggle(perm.key, role.id)}
                        />
                      </label>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 bg-dh-primary text-white rounded-md font-bold hover:bg-dh-primary-hover focus:outline-none focus:ring-2 focus:ring-dh-primary focus:ring-offset-2 transition-all disabled:opacity-50 flex items-center"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              กำลังบันทึก...
            </>
          ) : (
            'บันทึกการตั้งค่าสิทธิ์'
          )}
        </button>
      </div>
    </form>
  );
}
