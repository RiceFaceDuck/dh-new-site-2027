import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { userService } from '../../firebase/userService';

/**
 * 🧠 สมองกลคุม Data & Firebase สำหรับหน้า Managers Overview
 * รับผิดชอบ: ดึงข้อมูลสรุป, จัดการสถานะรออนุมัติ, และจัดการข้อมูล VIP (Lazy Load)
 */
export const useManagerDashboard = () => {
  // ==========================================
  // 1. States (สถานะข้อมูล)
  // ==========================================
  const [stats, setStats] = useState({
    pendingStaffCount: 0,
    pendingTasksCount: 0,
    vipCount: 0,
  });

  const [vipUsers, setVipUsers] = useState([]);
  const [isLoadingVips, setIsLoadingVips] = useState(false);
  const [pendingStaffs, setPendingStaffs] = useState([]);
  const [isLoadingStaffs, setIsLoadingStaffs] = useState(false);

  // ==========================================
  // 2. Real-time Subscriptions (ดึงข้อมูลตัวเลขสรุป)
  // ==========================================
  useEffect(() => {
    // 🔔 Subscribe จำนวนงานที่รออนุมัติ (Todo)
    const todosRef = collection(db, 'todos');
    const pendingTodosQuery = query(
      todosRef, 
      where('status', 'in', ['pending', 'pending_manager'])
    );

    const unsubscribeTodos = onSnapshot(pendingTodosQuery, (snapshot) => {
      setStats(prev => ({ ...prev, pendingTasksCount: snapshot.size }));
    }, (error) => {
      console.error("Error fetching pending tasks:", error);
    });

    // 👥 Subscribe จำนวนพนักงานรออนุมัติ
    const usersRef = collection(db, 'users');
    const pendingStaffQuery = query(
      usersRef, 
      where('role', 'in', ['pending', 'pending_approval'])
    );

    const unsubscribeStaff = onSnapshot(pendingStaffQuery, (snapshot) => {
      setStats(prev => ({ ...prev, pendingStaffCount: snapshot.size }));
      // เราดึงข้อมูลพนักงานรออนุมัติมาเก็บไว้เลย เพราะมักจะต้องใช้บ่อย
      const staffsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingStaffs(staffsData);
    }, (error) => {
      console.error("Error fetching pending staffs:", error);
    });

    // 👑 ดึงจำนวน VIP (ใช้ onSnapshot เพื่อให้ตัวเลขหน้า Dashboard ขยับตามจริง)
    const vipQuery = query(usersRef, where('rank', '==', 'VIP'));
    const unsubscribeVip = onSnapshot(vipQuery, (snapshot) => {
        setStats(prev => ({ ...prev, vipCount: snapshot.size }));
    });

    return () => {
      unsubscribeTodos();
      unsubscribeStaff();
      unsubscribeVip();
    };
  }, []);

  // ==========================================
  // 3. Lazy Fetching Functions (ดึงข้อมูลเมื่อต้องการ)
  // ==========================================
  
  // 📥 ดึงข้อมูลรายชื่อ VIP ทั้งหมด (ดึงเฉพาะตอนเปิด Modal)
  const fetchVipUsers = useCallback(async () => {
    setIsLoadingVips(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('rank', '==', 'VIP'));
      const snapshot = await getDocs(q);
      const vipsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVipUsers(vipsData);
    } catch (error) {
      console.error("Error fetching VIPs:", error);
    } finally {
      setIsLoadingVips(false);
    }
  }, []);

  // ==========================================
  // 4. Action Functions (ฟังก์ชันจัดการข้อมูล)
  // ==========================================

  // ❌ ปลดสิทธิ์ VIP
  const revokeVipStatus = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        rank: 'Customer' // หรือค่า Default ที่กำหนดไว้
      });
      
      // อัปเดต Local State เพื่อให้หน้าจอเปลี่ยนทันที (Local State Management)
      setVipUsers(prev => prev.filter(user => user.id !== userId));
      
      return { success: true };
    } catch (error) {
      console.error("Error revoking VIP status:", error);
      return { success: false, error };
    }
  };

  // ✅ อนุมัติพนักงาน (สมมติว่าต้องดึงมาจาก userService หรือ logic เดิม)
  const approveStaff = async (userId) => {
     try {
       await userService.updateUserRole(userId, "staff");
       return { success: true };
     } catch (error) {
       console.error("Error approving staff:", error);
       return { success: false, error };
     }
  };

  return {
    stats,
    vipUsers,
    isLoadingVips,
    pendingStaffs,
    isLoadingStaffs,
    fetchVipUsers,
    revokeVipStatus,
    approveStaff
  };
};