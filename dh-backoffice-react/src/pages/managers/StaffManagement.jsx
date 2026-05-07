import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { 
    getAllStaff, 
    updateUserRole, 
    suspendUser, 
    restoreUser, 
    updateUserProfile,
    deleteUser,
    getUserById 
} from '../../firebase/userService';

import { 
    Search, Edit, UserCheck, UserX, Shield, ShieldAlert,
    Briefcase, Mail, Phone, RefreshCw, AlertCircle, Check, Trash2, Eye, EyeOff, UserPlus
} from 'lucide-react';

export default function StaffManagement() {
    // 🛡️ Security States
    const [isAuthorized, setIsAuthorized] = useState(null);

    // Normal States
    const [staffs, setStaffs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [notification, setNotification] = useState(null);
    const [showSuspended, setShowSuspended] = useState(false);

    // Modal States
    const [editingStaff, setEditingStaff] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addSearchKeyword, setAddSearchKeyword] = useState('');
    const [searchResult, setSearchResult] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // 🛡️ Security Check
    useEffect(() => {
        const checkAccess = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // 🚨 ปลดล็อก: อนุญาตให้ผู้ที่ Login เข้าถึงหน้านี้ได้เลย 
                // เพื่อให้แอดมินเข้าไปตั้งค่า Role ให้ตัวเองและผู้อื่นได้ก่อน
                setIsAuthorized(true);
                fetchStaffData();
            } else {
                setIsAuthorized(false); // ยังไม่ได้ล็อกอินให้เตะออก
            }
        });

        return () => checkAccess();
    }, []);

    const fetchStaffData = async () => {
        setLoading(true);
        try {
            const data = await getAllStaff();
            setStaffs(data);
        } catch (error) {
            console.error("Error fetching staff:", error);
            showNotification("เกิดข้อผิดพลาดในการดึงข้อมูล", "error");
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // --- Action Handlers ---
    const handleApprove = async (id) => {
        if (!window.confirm('ยืนยันการอนุมัติสิทธิ์ให้เป็นพนักงาน (Staff)?')) return;
        try {
            await updateUserRole(id, 'staff');
            showNotification('อนุมัติสิทธิ์พนักงานสำเร็จ!');
            fetchStaffData();
        } catch (err) {
            showNotification('เกิดข้อผิดพลาด', 'error');
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('ปฏิเสธคำขอนี้? (ผู้ใช้จะถูกปรับเป็นลูกค้าทั่วไป)')) return;
        try {
            await updateUserRole(id, 'customer');
            showNotification('ปฏิเสธคำขอสำเร็จ ผู้ใช้งานจะถูกย้ายไปส่วนของลูกค้า');
            fetchStaffData();
        } catch (err) {
            showNotification('เกิดข้อผิดพลาด', 'error');
        }
    };

    const handleSuspend = async (id) => {
        if (!window.confirm('ต้องการระงับสิทธิ์การใช้งานของพนักงานคนนี้หรือไม่? (ระยะเวลา 1 ปี)')) return;
        try {
            await suspendUser(id);
            showNotification('ระงับสิทธิ์สำเร็จ (ถูกย้ายไปซ่อนไว้)');
            fetchStaffData();
        } catch (err) {
            showNotification('เกิดข้อผิดพลาด', 'error');
        }
    };

    const handleRestore = async (id) => {
        if (!window.confirm('ต้องการกู้คืนสิทธิ์ให้พนักงานคนนี้หรือไม่?')) return;
        try {
            await restoreUser(id);
            showNotification('กู้คืนสิทธิ์สำเร็จ');
            fetchStaffData();
        } catch (err) {
            showNotification('เกิดข้อผิดพลาด', 'error');
        }
    };

    const handlePermanentDelete = async (id) => {
        const msg = "⚠️ ลบถาวร!\n\nคุณกำลังจะลบผู้ใช้นี้ออกจากระบบของบริษัทอย่างสมบูรณ์แบบ (Firebase)\nหากลบแล้วจะไม่สามารถกู้คืนได้ และหากจะกลับมาทำงาน ต้องสมัครใหม่หน้าเว็บเท่านั้น\n\nยืนยันการลบ?";
        if (!window.confirm(msg)) return;
        try {
            await deleteUser(id);
            showNotification('ลบพนักงานออกจากระบบถาวรแล้ว');
            fetchStaffData();
        } catch (err) {
            showNotification('เกิดข้อผิดพลาดในการลบ', 'error');
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            const id = editingStaff.id;
            const updatedProfile = { 
                name: editingStaff.name || editingStaff.displayName || '', 
                phone: editingStaff.phone || editingStaff.phoneNumber || '' 
            };
            const newRole = editingStaff.role;

            await updateUserProfile(id, updatedProfile);
            await updateUserRole(id, newRole);
            
            showNotification('อัปเดตข้อมูลสำเร็จ!');
            setEditingStaff(null);
            fetchStaffData();
        } catch (error) {
            showNotification('เกิดข้อผิดพลาดในการบันทึก', 'error');
        }
    };

    const handleSearchAddStaff = async () => {
        if (!addSearchKeyword.trim()) return;
        setIsSearching(true);
        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);
            
            const keyword = addSearchKeyword.toLowerCase().trim();
            const staffRoles = ['admin', 'manager', 'staff', 'packer', 'pending', 'pending-staff'];

            const results = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(u => {
                    const role = String(u.role || u.userType || '').toLowerCase().trim();
                    if (staffRoles.includes(role)) return false;

                    const name = String(u.name || u.displayName || u.fullName || '').toLowerCase();
                    const email = String(u.email || '').toLowerCase();
                    const phone = String(u.phone || u.phoneNumber || '');

                    return name.includes(keyword) || email.includes(keyword) || phone.includes(keyword);
                });

            setSearchResult(results);
            if (results.length === 0) showNotification('ไม่พบผู้ใช้งานที่ตรงกับข้อมูล', 'error');
        } catch (error) {
            console.error(error);
            showNotification('เกิดข้อผิดพลาดในการค้นหาฐานข้อมูล', 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const handlePromoteToStaff = async (id, newRole) => {
        try {
            await updateUserRole(id, newRole);
            showNotification('แต่งตั้งเป็นพนักงานเรียบร้อย!');
            setSearchResult(searchResult.filter(u => u.id !== id));
            fetchStaffData(); 
        } catch (err) {
            showNotification('เกิดข้อผิดพลาด', 'error');
        }
    };

    // --- Helpers ---
    const getDisplayName = (user) => user.name || user.displayName || user.fullName || 'ไม่ระบุชื่อ';
    const getDisplayEmail = (user) => user.email || user.emailAddress || 'ไม่มีอีเมล';
    const getDisplayPhone = (user) => user.phone || user.phoneNumber || user.tel || '-';
    const getDisplayRole = (user) => String(user.computedRole || user.role || user.userType || 'unknown').toLowerCase().trim();

    const pendingStaffs = useMemo(() => 
        staffs.filter(s => getDisplayRole(s) === 'pending' || getDisplayRole(s) === 'pending-staff'),
    [staffs]);

    const activeStaffs = useMemo(() => {
        let filtered = staffs.filter(s => getDisplayRole(s) !== 'pending' && getDisplayRole(s) !== 'pending-staff');
        
        if (showSuspended) {
            filtered = filtered.filter(s => s.isActive === false);
        } else {
            filtered = filtered.filter(s => s.isActive !== false);
        }
        
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(s => 
                getDisplayName(s).toLowerCase().includes(lowerSearch) ||
                getDisplayEmail(s).toLowerCase().includes(lowerSearch) ||
                getDisplayPhone(s).includes(searchTerm)
            );
        }

        if (filterRole !== 'all') {
            filtered = filtered.filter(s => getDisplayRole(s) === filterRole);
        }

        return filtered;
    }, [staffs, searchTerm, filterRole, showSuspended]);

    const getRoleBadge = (role) => {
        const badges = {
            admin: "bg-purple-100 text-purple-700 border-purple-200",
            manager: "bg-blue-100 text-blue-700 border-blue-200",
            staff: "bg-emerald-100 text-emerald-700 border-emerald-200",
            packer: "bg-orange-100 text-orange-700 border-orange-200"
        };
        return badges[role] || "bg-gray-100 text-gray-700 border-gray-200";
    };

    // 🛡️ เช็คสถานะ Loading
    if (isAuthorized === null) {
        return (
            <div className="min-h-[60vh] flex flex-col justify-center items-center">
                <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium tracking-wide">กำลังตรวจสอบความปลอดภัยและสิทธิ์การเข้าถึง...</p>
            </div>
        );
    }

    // 🛑 สิทธิ์ไม่ผ่าน (ยังไม่ได้ Login)
    if (isAuthorized === false) {
        return (
            <div className="max-w-2xl mx-auto mt-20 p-10 bg-red-50/50 border border-red-100 rounded-[2rem] text-center shadow-lg shadow-red-100/50">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-50">
                    <ShieldAlert className="w-12 h-12 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">กรุณาเข้าสู่ระบบก่อน</h1>
                <p className="text-gray-600 text-lg leading-relaxed">
                    พื้นที่นี้ต้องเข้าสู่ระบบก่อนใช้งาน
                </p>
                <button 
                    onClick={() => window.history.back()}
                    className="mt-8 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-medium transition-colors"
                >
                    กลับสู่หน้าหลัก
                </button>
            </div>
        );
    }

    // ✅ ผ่านการตรวจสอบ: โชว์เนื้อหาปกติ
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <Shield className="w-7 h-7 text-blue-600" />
                        ระบบจัดการสิทธิ์และพนักงาน
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">พื้นที่ควบคุมสิทธิ์: แต่งตั้ง ปรับตำแหน่ง และจัดการข้อมูลพนักงาน</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-blue-500/20 active:scale-95"
                    >
                        <UserPlus className="w-4 h-4" /> ค้นหาและแต่งตั้งพนักงาน
                    </button>

                    <button 
                        onClick={() => setShowSuspended(!showSuspended)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${showSuspended ? 'bg-white text-gray-700 border-gray-300 shadow-sm' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
                    >
                        {showSuspended ? <><Briefcase className="w-4 h-4" /> ดูที่ใช้งานอยู่</> : <><UserX className="w-4 h-4" /> ถูกระงับสิทธิ์</>}
                    </button>

                    {notification && (
                        <div className={`px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 animate-pulse ${notification.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} border`}>
                            {notification.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            <span className="text-sm font-medium">{notification.msg}</span>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : (
                <>
                    {/* Pending Section */}
                    {!showSuspended && pendingStaffs.length > 0 && (
                        <div className="bg-amber-50/50 border border-amber-200/60 rounded-3xl p-5 md:p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                คำขอสมัครเป็นพนักงานใหม่ ({pendingStaffs.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingStaffs.map(staff => (
                                    <div key={staff.id} className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100/50 flex flex-col justify-between hover:shadow-md transition-shadow">
                                        <div>
                                            <p className="font-bold text-gray-800 text-lg">{getDisplayName(staff)}</p>
                                            <div className="text-sm text-gray-500 mt-3 space-y-2">
                                                <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> {getDisplayEmail(staff)}</p>
                                                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> {getDisplayPhone(staff)}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100">
                                            <button 
                                                onClick={() => handleApprove(staff.id)}
                                                className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-sm"
                                            >
                                                <UserCheck className="w-4 h-4" /> อนุมัติ
                                            </button>
                                            <button 
                                                onClick={() => handleReject(staff.id)}
                                                className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-sm"
                                            >
                                                <UserX className="w-4 h-4" /> ปฏิเสธ
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Main Table Section */}
                    <div className={`bg-white rounded-3xl shadow-sm border overflow-hidden ${showSuspended ? 'border-red-200/60' : 'border-gray-200/60'}`}>
                        <div className={`p-5 border-b flex flex-col sm:flex-row gap-4 justify-between items-center ${showSuspended ? 'bg-red-50/30 border-red-100' : 'bg-gray-50/50 border-gray-100'}`}>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <h3 className={`font-bold text-lg ${showSuspended ? 'text-red-700' : 'text-gray-800'}`}>
                                    {showSuspended ? `รายชื่อที่ถูกระงับสิทธิ์ (${activeStaffs.length})` : `พนักงานปัจจุบัน (${activeStaffs.length})`}
                                </h3>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-72">
                                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="ค้นหาชื่อ, อีเมล, เบอร์..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                                    />
                                </div>
                                <select 
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="px-4 py-2.5 border border-gray-300 rounded-xl outline-none text-sm bg-white cursor-pointer font-medium text-gray-700"
                                >
                                    <option value="all">ทุกตำแหน่ง</option>
                                    <option value="admin">Admin</option>
                                    <option value="manager">Manager</option>
                                    <option value="staff">Staff</option>
                                    <option value="packer">Packer</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 text-gray-500 text-sm border-b border-gray-100">
                                        <th className="p-5 font-semibold">ชื่อพนักงาน</th>
                                        <th className="p-5 font-semibold hidden md:table-cell">ข้อมูลติดต่อ</th>
                                        <th className="p-5 font-semibold">ตำแหน่ง</th>
                                        <th className="p-5 font-semibold">สถานะ</th>
                                        <th className="p-5 font-semibold text-center">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/80">
                                    {activeStaffs.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-10 text-center text-gray-500">
                                                {showSuspended ? 'ไม่มีพนักงานที่ถูกระงับสิทธิ์ในขณะนี้' : 'ไม่พบข้อมูลพนักงานในระบบ'}
                                            </td>
                                        </tr>
                                    ) : (
                                        activeStaffs.map(staff => (
                                            <tr key={staff.id} className={`hover:bg-gray-50/80 transition-colors ${!staff.isActive ? 'bg-red-50/10' : ''}`}>
                                                <td className="p-5">
                                                    <div className={`font-semibold text-[15px] ${!staff.isActive ? 'text-gray-500' : 'text-gray-800'}`}>
                                                        {getDisplayName(staff)}
                                                    </div>
                                                    <div className="text-xs text-gray-400 md:hidden mt-1">{getDisplayPhone(staff)}</div>
                                                </td>
                                                <td className="p-5 hidden md:table-cell text-sm text-gray-600">
                                                    <div className="flex items-center gap-2 mb-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {getDisplayEmail(staff)}</div>
                                                    <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> {getDisplayPhone(staff)}</div>
                                                </td>
                                                <td className="p-5">
                                                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${getRoleBadge(getDisplayRole(staff))}`}>
                                                        {getDisplayRole(staff)}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    {staff.isActive ? (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> ใช้งานปกติ
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-lg">
                                                            <UserX className="w-3.5 h-3.5" /> ระงับสิทธิ์
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex justify-center items-center gap-2">
                                                        {staff.isActive ? (
                                                            <>
                                                                <button 
                                                                    onClick={() => setEditingStaff({...staff, role: getDisplayRole(staff)})}
                                                                    className="p-2 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition-colors"
                                                                    title="แก้ไขข้อมูล / เปลี่ยนเป็นลูกค้า"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleSuspend(staff.id)}
                                                                    className="p-2 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-colors"
                                                                    title="ระงับสิทธิ์ชั่วคราว (ซ่อน)"
                                                                >
                                                                    <EyeOff className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleRestore(staff.id)}
                                                                    className="px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
                                                                    title="กู้คืนสิทธิ์ให้กลับมาทำงาน"
                                                                >
                                                                    <RefreshCw className="w-3.5 h-3.5" /> คืนสิทธิ์
                                                                </button>
                                                                <button 
                                                                    onClick={() => handlePermanentDelete(staff.id)}
                                                                    className="p-1.5 text-red-500 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-xl transition-colors"
                                                                    title="ลบทิ้งออกจากระบบถาวร"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Modals */}
            {editingStaff && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <Edit className="w-5 h-5 text-blue-600" /> แก้ไขข้อมูล & สิทธิ์
                            </h3>
                        </div>
                        <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ-นามสกุล</label>
                                <input 
                                    type="text" required
                                    value={editingStaff.name || editingStaff.displayName || ''}
                                    onChange={(e) => setEditingStaff({...editingStaff, name: e.target.value, displayName: e.target.value})}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์โทรติดต่อ</label>
                                <input 
                                    type="text"
                                    value={editingStaff.phone || editingStaff.phoneNumber || ''}
                                    onChange={(e) => setEditingStaff({...editingStaff, phone: e.target.value, phoneNumber: e.target.value})}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">ตำแหน่ง (Role)</label>
                                <select 
                                    value={editingStaff.role}
                                    onChange={(e) => setEditingStaff({...editingStaff, role: e.target.value})}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white font-medium transition-all"
                                >
                                    <option value="staff">พนักงานทั่วไป (Staff)</option>
                                    <option value="packer">พนักงานจัดแพ็ค (Packer)</option>
                                    <option value="manager">ผู้จัดการ (Manager)</option>
                                    <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                                    <option value="customer" className="text-red-600 font-bold">🚫 เปลี่ยนเป็นลูกค้า (ถอดสิทธิ์)</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" onClick={() => setEditingStaff(null)}
                                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 rounded-xl transition-colors border border-gray-200"
                                >ยกเลิก</button>
                                <button 
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-md shadow-blue-500/20 flex justify-center items-center gap-2 active:scale-[0.98]"
                                ><Check className="w-4 h-4" /> บันทึกข้อมูล</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-blue-600" /> ค้นหาและแต่งตั้งพนักงาน
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">ค้นหาบัญชีผู้ใช้ในระบบ แล้วแต่งตั้งสิทธิ์ให้เข้ามาในหน้าจัดการพนักงาน</p>
                            </div>
                            <button onClick={() => { setShowAddModal(false); setSearchResult([]); setAddSearchKeyword(''); }} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                <UserX className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 border-b border-gray-100 bg-white shadow-sm z-10">
                            <div className="flex gap-3">
                                <input 
                                    type="text"
                                    placeholder="พิมพ์ค้นหา ชื่อ, อีเมล หรือ เบอร์โทร..."
                                    value={addSearchKeyword}
                                    onChange={(e) => setAddSearchKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchAddStaff()}
                                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                                <button 
                                    onClick={handleSearchAddStaff}
                                    disabled={isSearching || !addSearchKeyword.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
                                >
                                    {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />} ค้นหา
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                            {searchResult.length === 0 ? (
                                <div className="text-center text-gray-500 py-10">
                                    <Search className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                                    <p>ใส่คำค้นหาเพื่อดึงข้อมูลจากระบบ</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {searchResult.map(user => (
                                        <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-blue-200 transition-colors">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-gray-800">{getDisplayName(user)}</p>
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200">
                                                        {user.role || user.userType || 'customer'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                                    <Mail className="w-3 h-3"/>{getDisplayEmail(user)} <span className="text-gray-300">|</span> <Phone className="w-3 h-3"/>{getDisplayPhone(user)}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                <select 
                                                    id={`role-select-${user.id}`}
                                                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none bg-gray-50 font-medium"
                                                    defaultValue="staff"
                                                >
                                                    <option value="staff">Staff</option>
                                                    <option value="packer">Packer</option>
                                                    <option value="manager">Manager</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                <button 
                                                    onClick={() => {
                                                        const selectedRole = document.getElementById(`role-select-${user.id}`).value;
                                                        handlePromoteToStaff(user.id, selectedRole);
                                                    }}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                                                >
                                                    แต่งตั้ง
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}