import { db } from '../config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export const todoStaffService = {
  // ============================================================================
  // 🧑‍💼 ✨ [NEW] STAFF ONBOARDING TASKS (ระบบพนักงานใหม่)
  // ============================================================================
  createStaffApprovalTask: async (staffData) => {
      try {
          // จัดรูปแบบข้อมูลเพื่อให้แสดงผลบนแผง To-do ได้อย่างหรูหราและอ่านง่าย
          const fullName = `${staffData.firstName} ${staffData.lastName}`.trim();
          const todoPayload = {
              type: 'STAFF_APPROVAL',
              taskType: 'STAFF_APPROVAL',
              status: 'pending',
              title: `🌟 คำร้องขออนุมัติพนักงานใหม่: ${fullName}`,
              description: `พนักงานขอเข้าทำงานในตำแหน่ง "${staffData.position}" | วันเริ่มงาน: ${staffData.startDate || 'ยังไม่ระบุ'} | อายุ: ${staffData.age || 'ไม่ระบุ'} ปี`,
              priority: 'High', // ตั้งเป็น High เพื่อให้ผู้จัดการสังเกตเห็นทันที
              targetUid: staffData.uid,
              targetEmail: staffData.email,
              createdByUid: staffData.uid,
              userId: staffData.uid,
              metadata: {
                  name: fullName,
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

          const docRef = await addDoc(collection(db, getCollectionPath('todos')), todoPayload);
          console.log(`✅ [TodoService] Staff Approval Task Created ID: ${docRef.id}`);
          return { success: true, taskId: docRef.id };
      } catch (error) {
          console.error("❌ [TodoService] Create Staff Task Error:", error);
          throw error;
      }
  },

  // ============================================================================
  // 🗑️ CUSTOMER DELETION APPROVAL TASK (คำขอลบลูกค้าจากพนักงานส่งถึงผู้จัดการ)
  // ============================================================================
  requestCustomerDeletion: async (customerData, requestedBy) => {
      try {
          const customerId = customerData?.uid || customerData?.id || 'Unknown';
          const customerName = customerData?.accountName || customerData?.storeName || customerData?.displayName || customerData?.name || 'ลูกค้า';
          const accountId = customerData?.accountId || customerData?.customerCode || '';

          const todoPayload = {
              type: 'CUSTOMER_DELETE_APPROVAL',
              taskType: 'CUSTOMER_DELETE_APPROVAL',
              status: 'pending',
              title: `ขออนุมัติลบลูกค้า: ${customerName} (${accountId || customerId})`,
              description: `พนักงานขอลบลูกค้า "${customerName}" (ID: ${accountId || customerId}) ออกจากฐานข้อมูลระบบ`,
              priority: 'High',
              targetUid: customerId,
              requestedBy: requestedBy || 'Unknown User',
              payload: {
                  customerId,
                  accountId,
                  name: customerName,
                  phone: customerData?.phone || customerData?.phoneNumber || '-'
              },
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
          };

          const docRef = await addDoc(collection(db, getCollectionPath('todos')), todoPayload);
          console.log(`✅ [TodoService] Customer Deletion Task Created ID: ${docRef.id}`);
          return { success: true, taskId: docRef.id };
      } catch (error) {
          console.error("❌ [TodoService] Request Customer Deletion Error:", error);
          throw error;
      }
  }
};
