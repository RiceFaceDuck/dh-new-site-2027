import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, ShieldCheck, Clock, CheckCircle2, 
  X, Edit2, Save, UserCircle, Activity, ChevronLeft, Award
} from 'lucide-react';
import { userService } from '../../firebase/userService';
import { auth } from '../../firebase/config';

export default function StaffManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // State จัดการข้อมูล
  const [pendingStaff, setPendingStaff] = useState([]);
  const [activeStaff, setActiveStaff] = useState([]);
  
  // State การแก้ไขตำแหน่ง
  const [editingUid, setEditingUid] = useState(null);
  const [editRole, setEditRole] = useState('');
  
  // ตำแหน่งที่มีในบริษัท (อิงจาก ProfileSetup)
  const roleOptions = ['Admin ฝ่ายขาย', 'จัดแพ็ค', 'การบัญชี', 'ผู้จัดการ', 'เจ้าของ', 'อื่นๆ'];

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      // ดึงเฉพาะพนักงานทั้งหมด (ลูกค้าจะไม่ติดมาด้วย เพราะ Logic ใน userService กรอง userType แล้ว)
      const allStaff = await userService.getAllStaff();
      
      // แยกกลุ่ม รออนุมัติ และ พนักงานปัจจุบัน
      const pending = allStaff.filter(staff => staff.isApproved === false);
      const active = allStaff.filter(staff => staff.isApproved !== false); // ถือว่าคนที่ไม่มี field นี้หรือ true คือผ่านแล้ว
      
      setPendingStaff(pending);
      setActiveStaff(active);
    } catch (error) {
      console.error("Error fetching staff data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- ฟังก์ชันอนุมัติพนักงานใหม่ ---
  const handleApproveStaff = async (uid) => {
    try {
      const profile = await userService.getUserProfile(auth.currentUser.uid);
      const approverName = profile ? `${profile.firstName} (${profile.nickname})` : auth.currentUser.email;
      
      await userService.approveStaff(uid, approverName);
      
      // ย้ายจาก Pending ไป Active ใน UI ทันที (ประหยัด Reads)
      const approvedUser = pendingStaff.find(s => s.uid === uid);
      if (approvedUser) {
        setPendingStaff(prev => prev.filter(s => s.uid !== uid));
        setActiveStaff(prev => [{...approvedUser, isApproved: true}, ...prev]);
      }
    } catch (error) {
      console.error("🔥 Error approving staff:", error);
      alert("เกิดข้อผิดพลาดในการอนุมัติ");
    }
  };

  // --- ฟังก์ชันแก้ไขตำแหน่ง ---
  const startEditRole = (staff) => {
    if (staff.role === 'เจ้าของ' || staff.role === 'Owner') {
      alert("ไม่อนุญาตให้แก้ไขสิทธิ์ของเจ้าของระบบ");
      return;
    }
    setEditingUid(staff.uid);
    setEditRole(staff.role || 'Admin ฝ่ายขาย');
  };

  const saveRole = async (uid) => {
    if (!editRole) return;
    try {
      await userService.updateUserRole(uid, editRole);
      
      // อัปเดต UI ทันที
      setActiveStaff(prev => prev.map(s => s.uid === uid ? { ...s, role: editRole } : s));
      setEditingUid(null);
    } catch (error) {
      console.error("Error updating role:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกตำแหน่ง");
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="animate-spin text-blue-500"><Activity size={32} /></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 relative animate-in fade-in">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <button 
            onClick={() => navigate('/managers')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-2 font-medium"
          >
            <ChevronLeft size={16} /> กลับไปหน้าผู้จัดการ
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
            <Users size={14} /> Human Resources
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">การจัดการสิทธิ์พนักงาน (Staff)</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">อนุมัติการเข้าใช้งาน กำหนดตำแหน่ง และรองรับการวัดผล KPI</p>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Section 1: รออนุมัติ (Pending Approval) */}
        {pendingStaff.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-orange-200 bg-orange-100/50 flex items-center gap-3">
              <div className="p-2 bg-orange-500 text-white rounded-lg"><Clock size={20} /></div>
              <div>
                <h2 className="font-bold text-orange-900 text-lg">พนักงานรออนุมัติสิทธิ์ ({pendingStaff.length})</h2>
                <p className="text-xs text-orange-700">พนักงานที่ลงทะเบียนใหม่และรอการตรวจสอบเพื่อเข้าใช้งานระบบ</p>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingStaff.map(staff => (
                  <div key={staff.uid} className="bg-white rounded-xl border border-orange-200 p-4 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {staff.photoURL ? <img src={staff.photoURL} alt="profile" className="w-full h-full object-cover"/> : <UserCircle size={32} className="text-gray-400" />}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{staff.firstName} {staff.lastName}</div>
                        <div className="text-xs text-gray-500">{staff.email}</div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded">สมัครตำแหน่ง: {staff.role}</span>
                    </div>
                    <div className="mt-auto">
                      <button 
                        onClick={() => handleApproveStaff(staff.uid)}
                        className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                      >
                        <ShieldCheck size={18} /> อนุมัติการเข้าใช้งาน
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 2: ทีมงานปัจจุบัน (Active Staff) */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><ShieldCheck size={20} /></div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg">ทีมงานระบบปัจจุบัน ({activeStaff.length})</h2>
              <p className="text-xs text-gray-500">รายชื่อพนักงานที่มีสิทธิ์เข้าใช้งานระบบหลังบ้าน</p>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStaff.map((staff) => (
                <div key={staff.uid} className="border border-gray-200 rounded-xl p-4 flex flex-col hover:border-indigo-300 transition-colors group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center overflow-hidden font-bold">
                        {staff.photoURL ? <img src={staff.photoURL} alt="profile" className="w-full h-full object-cover"/> : (staff.nickname?.charAt(0) || 'U')}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 text-sm leading-tight">{staff.firstName} ({staff.nickname || 'ไม่มีชื่อเล่น'})</div>
                        <div className="text-[10px] text-gray-500">{staff.email}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-auto border-t border-gray-100 pt-3">
                    {/* จัดการตำแหน่ง */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">ตำแหน่ง:</span>
                      {editingUid === staff.uid ? (
                        <div className="flex items-center gap-1">
                          <select 
                            value={editRole} 
                            onChange={(e) => setEditRole(e.target.value)} 
                            className="text-xs p-1 border rounded outline-none border-indigo-300 bg-indigo-50 font-medium"
                          >
                            {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <button onClick={() => saveRole(staff.uid)} className="p-1 text-green-600 bg-green-50 rounded hover:bg-green-100"><Save size={14}/></button>
                          <button onClick={() => setEditingUid(null)} className="p-1 text-red-500 bg-red-50 rounded hover:bg-red-100"><X size={14}/></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded ${staff.role === 'เจ้าของ' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                            {staff.role || 'ไม่มีตำแหน่ง'}
                          </span>
                          {staff.role !== 'เจ้าของ' && staff.role !== 'Owner' && (
                            <button onClick={() => startEditRole(staff)} className="p-1 text-gray-400 hover:text-indigo-600 bg-gray-50 rounded transition opacity-0 group-hover:opacity-100"><Edit2 size={12} /></button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ปุ่ม KPI (เตรียมไว้สำหรับอนาคต) */}
                    <button className="w-full py-2 bg-gray-50 border border-gray-200 text-gray-400 font-bold text-xs rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors cursor-not-allowed" title="ระบบ KPI อยู่ระหว่างการพัฒนา">
                      <Award size={14} /> ดูผลประเมิน KPI (เร็วๆ นี้)
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {activeStaff.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500">ยังไม่มีพนักงานในระบบ</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}