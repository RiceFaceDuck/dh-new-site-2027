import { db } from '../config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const todoStaffService = {
  // ============================================================================
  // 🧑‍💼 ✨ [NEW] STAFF ONBOARDING TASKS (ระบบพนักงานใหม่)
  // ============================================================================
  createStaffApprovalTask: async (staffData) => {
      try {
          // จัดรูปแบบข้อมูลเพื่อให้แสดงผลบนแผง To-do ได้อย่างหรูหราและอ่านง่าย
          const todoPayload = {
              type: 'STAFF_APPROVAL',
              status: 'pending',
              title: `🌟 คำร้องขออนุมัติพนักงานใหม่: ${staffData.firstName} ${staffData.lastName}`,
              description: `พนักงานขอเข้าทำงานในตำแหน่ง "${staffData.position}" | วันเริ่มงาน: ${staffData.startDate || 'ยังไม่ระบุ'} | อายุ: ${staffData.age || 'ไม่ระบุ'} ปี`,
              priority: 'High', // ตั้งเป็น High เพื่อให้ผู้จัดการสังเกตเห็นทันที
              targetUid: staffData.uid,
              targetEmail: staffData.email,
              metadata: {
                  firstName: staffData.firstName,
                  lastName: staffData.lastName,
                  nickname: staffData.nickname,
                  age: Number(staffData.age) || null,
                  gender: staffData.gender,
                  requestedRole: staffData.position,
                  startDate: staffData.startDate,
                  source: 'staff_onboarding_portal'
              },
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
          };

          const docRef = await addDoc(collection(db, 'todos'), todoPayload);
          console.log(`✅ [TodoService] Staff Approval Task Created ID: ${docRef.id}`);
          return { success: true, taskId: docRef.id };
      } catch (error) {
          console.error("❌ [TodoService] Create Staff Task Error:", error);
          throw error;
      }
  }
};
