import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, serverTimestamp, addDoc, query, where } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';
import { todoService } from './todoService';

const COLLECTION_NAME = 'users';

export const userService = {
  // ✨ ฟังก์ชันอัปเดตเวลาเข้าสู่ระบบล่าสุด (เพิ่มใหม่เพื่อแก้ Error)
  updateUserLoginStatus: async (uid) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      // ใช้ setDoc + merge: true เพื่ออัปเดตหรือสร้างใหม่ถ้ายังไม่มีเอกสาร
      await setDoc(docRef, {
        lastLoginAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("🔥 Error updating login status:", error);
    }
  },

  getUserProfile: async (uid) => {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { uid, ...docSnap.data() };
    }
    return null; 
  },

  createUserProfile: async (uid, profileData) => {
    const docRef = doc(db, COLLECTION_NAME, uid);
    
    const newProfile = {
      ...profileData,
      userType: 'staff', 
      isApproved: false, 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(docRef, newProfile);
    await historyService.addLog('Staff/Member', 'Create', uid, `พนักงานลงทะเบียนใหม่ (รออนุมัติ): ${profileData.email || uid}`);
    await todoService.requestStaffApproval(profileData, uid);
  },

  createManualCustomer: async (customerData) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...customerData,
        userType: 'customer', 
        isApproved: true, 
        isManualAccount: true, 
        // 🌟 Stats Snapshot Init
        stats: {
          totalSales: 0,
          last30DaysSales: 0,
          creditBalance: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await historyService.addLog('Customer', 'Create', docRef.id, `สร้างบัญชีลูกค้า Manual: ${customerData.accountName || 'ไม่ระบุชื่อ'}`);
      return docRef.id;
    } catch (error) {
      console.error("🔥 Error creating manual customer:", error);
      throw error;
    }
  },

  // ✨ อัปเดตข้อมูลลูกค้า (Dirty Check ควรทำที่ฝั่ง UI ก่อนส่งมาที่นี่เพื่อลด Write)
  updateCustomerProfile: async (uid, updateData) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      await historyService.addLog('Customer', 'Update', uid, `อัปเดตข้อมูลลูกค้า: ${updateData.accountName || uid}`);
      return true;
    } catch (error) {
      console.error("🔥 Error updating customer:", error);
      throw error;
    }
  },

  // ✨ ลบข้อมูลลูกค้า
  deleteCustomer: async (uid, customerName) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      await deleteDoc(docRef);
      await historyService.addLog('Customer', 'Delete', uid, `ลบข้อมูลลูกค้า: ${customerName}`);
      return true;
    } catch (error) {
      console.error("🔥 Error deleting customer:", error);
      throw error;
    }
  },

  // ✨ Smart Tiering: อัปเดต Rank อัตโนมัติ (สามารถเรียกใช้ตอนจบบิล)
  updateCustomerStatsAndRank: async (uid, newSalesAmount) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;

      const currentData = docSnap.data();
      const currentTotalSales = currentData.stats?.totalSales || 0;
      const newTotalSales = currentTotalSales + newSalesAmount;

      // Logic คำนวณ Rank
      let newRank = currentData.rank || 'Customer';
      if (newTotalSales >= 100000 && newRank !== 'VIP') newRank = 'Partner';

      await updateDoc(docRef, {
        'stats.totalSales': newTotalSales,
        'stats.last30DaysSales': (currentData.stats?.last30DaysSales || 0) + newSalesAmount,
        rank: newRank,
        role: newRank, // Sync
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("🔥 Error updating stats:", error);
    }
  },

  approveStaff: async (uid, approverName) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      await updateDoc(docRef, { isApproved: true, updatedAt: serverTimestamp() });
      await historyService.addLog('Staff/Member', 'Approve', uid, `อนุมัติพนักงานโดย: ${approverName}`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  getPendingStaff: async () => {
    try {
      const q = query(collection(db, COLLECTION_NAME), where("userType", "==", "staff"), where("isApproved", "==", false));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (error) {
      return [];
    }
  },

  getAllStaff: async () => {
    try {
      const staffRoles = ['พนักงานทั่วไป', 'ช่าง', 'พนักงานแพ็ค', 'บัญชี', 'แอดมิน', 'ผู้จัดการ', 'เจ้าของ', 'Admin', 'Manager', 'Owner'];
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter(user => user.userType === 'staff' || (user.role && staffRoles.includes(user.role)));
    } catch (error) {
      return [];
    }
  },

  getAllCustomers: async () => {
    try {
      const staffRoles = ['พนักงานทั่วไป', 'ช่าง', 'พนักงานแพ็ค', 'บัญชี', 'แอดมิน', 'ผู้จัดการ', 'เจ้าของ', 'Admin', 'Manager', 'Owner'];
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter(user => user.userType === 'customer' || (!user.role || !staffRoles.includes(user.role)));
    } catch (error) {
      return [];
    }
  },

  getAllUsers: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (error) {
      return [];
    }
  },

  updateUserRole: async (uid, newRole) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      await updateDoc(docRef, { role: newRole, updatedAt: serverTimestamp() });
      await historyService.addLog('Staff/Member', 'UpdateRole', uid, `เปลี่ยนตำแหน่งเป็น: ${newRole}`);
    } catch (error) {
      throw error;
    }
  },
  
  deleteUser: async (uid) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      await deleteDoc(docRef);
      await historyService.addLog('Staff/Member', 'Delete', uid, `ลบผู้ใช้ออกจากระบบ`);
    } catch (error) {
      throw error;
    }
  }
};