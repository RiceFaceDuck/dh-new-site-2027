import React from 'react';
import { Users, Mail, ShieldAlert, ShieldCheck, Eye, Edit, UserX, UserCheck, Trash2 } from 'lucide-react';
import { SUPER_ADMINS } from '../../../../firebase/userService';

const ROLES = ['Admin', 'Manager', 'Staff', 'Packer', 'Developer'];

export default function StaffTable({ 
  loading, 
  filteredStaff, 
  setViewingStaff, 
  setEditingStaff, 
  handleRoleChange, 
  handleToggleStatus, 
  handleDeleteStaff 
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <th className="px-6 py-5">ข้อมูลพนักงาน</th>
              <th className="px-6 py-5 text-center">ตำแหน่งปัจจุบัน (Role)</th>
              <th className="px-6 py-5 text-center">สถานะสิทธิ์เข้าถึง</th>
              <th className="px-6 py-5 text-right pr-8">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-5 flex gap-4 items-center">
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0"></div>
                      <div className="space-y-2">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-32"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-48"></div>
                      </div>
                  </td>
                  <td className="px-6 py-5"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-32 mx-auto"></div></td>
                  <td className="px-6 py-5"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-24 mx-auto"></div></td>
                  <td className="px-6 py-5"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-32 ml-auto"></div></td>
                </tr>
              ))
            ) : filteredStaff.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-20 text-center text-slate-500 dark:text-slate-400">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
                      <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="font-bold text-lg text-slate-700 dark:text-slate-300">ไม่พบรายชื่อพนักงาน</p>
                  <p className="text-sm mt-1">ลองเปลี่ยนคำค้นหา หรือเพิ่มพนักงานใหม่เข้าสู่ระบบ</p>
                </td>
              </tr>
            ) : (
              filteredStaff.map((staff) => {
                const isSuperAdmin = SUPER_ADMINS.includes(staff.email);
                const displayRole = staff.role || (staff.roles && staff.roles[0]) || staff.computedRole || 'Staff';
                const staffName = staff.displayName || staff.firstName || 'ไม่ระบุชื่อ';
                
                return (
                  <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 cursor-pointer" onClick={() => setViewingStaff(staff)} title="คลิกเพื่อดูรายละเอียดและประวัติย้อนหลัง">
                      <div className="flex items-center gap-4">
                        {staff.photoURL ? (
                          <img src={staff.photoURL} alt="Profile" className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-white dark:border-slate-800 shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 border border-indigo-100 dark:border-indigo-800 shadow-sm text-lg">
                            {staffName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-[15px]">
                            {staffName}
                            {isSuperAdmin && <ShieldAlert size={14} className="text-amber-500" title="Super Admin / Owner" strokeWidth={3} />}
                          </div>
                          <div className="text-[13px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                              <Mail size={12}/> {staff.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {isSuperAdmin ? (
                         <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 shadow-sm">
                            <ShieldCheck size={14} strokeWidth={2.5}/> Owner
                         </span>
                      ) : (
                        <div className="relative inline-block w-40">
                          <select
                              value={displayRole.toLowerCase()}
                              onChange={(e) => handleRoleChange(staff.id, e.target.value, staff.email)}
                              className={`w-full appearance-none pl-4 pr-8 py-2 bg-white dark:bg-slate-800 border rounded-xl text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm transition-all text-center ${
                              displayRole.toLowerCase() === 'admin' ? 'text-purple-700 border-purple-200 dark:text-purple-400 dark:border-purple-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20' :
                              displayRole.toLowerCase() === 'manager' ? 'text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20' :
                              'text-slate-700 border-slate-200 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                          >
                              {ROLES.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm border min-w-[100px] ${
                        staff.isActive 
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800/50' 
                          : staff.role === 'pending_approval'
                          ? 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800/50'
                          : 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800/50'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${staff.isActive ? 'bg-emerald-500' : staff.role === 'pending_approval' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                        {staff.role === 'pending_approval' ? 'รออนุมัติ' : staff.isActive ? 'ปกติ (Active)' : 'ระงับการใช้งาน'}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        
                        <button
                          onClick={() => setViewingStaff(staff)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800"
                          title="ดูรายละเอียด/KPI"
                        >
                          <Eye size={18} strokeWidth={2.5}/>
                        </button>

                        {isSuperAdmin ? (
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-3 py-1.5 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 rounded-xl">
                            Protected
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingStaff(staff)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-xl transition-all shadow-sm border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                              title="แก้ไขข้อมูลส่วนตัว"
                            >
                              <Edit size={18} strokeWidth={2.5}/>
                            </button>
                            <button
                              onClick={() => handleToggleStatus(staff.id, staff.isActive, staff.email)}
                              className={`p-2 rounded-xl transition-all shadow-sm border border-transparent ${
                                staff.isActive 
                                  ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-amber-500/20 dark:hover:border-amber-800' 
                                  : 'text-emerald-500 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-500/20 dark:hover:border-emerald-800'
                              }`}
                              title={staff.isActive ? "ระงับบัญชี" : "ปลดแบนคืนสิทธิ์"}
                            >
                              {staff.isActive ? <UserX size={18} strokeWidth={2.5}/> : <UserCheck size={18} strokeWidth={2.5}/>}
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(staff.id, staff.email)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-200 dark:hover:border-red-800"
                              title="ลบพนักงาน"
                            >
                              <Trash2 size={18} strokeWidth={2.5}/>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
