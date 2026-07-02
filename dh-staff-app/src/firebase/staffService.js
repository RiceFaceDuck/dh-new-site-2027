import { doc, getDoc, updateDoc, setDoc, collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from './config';

export const staffService = {
  // Fetch current profile and status
  getStaffProfile: async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching staff profile:', error);
      throw error;
    }
  },

  // Log Attendance from Scanner
  logAttendance: async (uid, name, stationId) => {
    try {
      const logsRef = collection(db, 'attendance_logs');
      await addDoc(logsRef, {
        staffUid: uid,
        staffName: name || 'Staff',
        type: 'SCAN_IN',
        stationId: stationId,
        timestamp: serverTimestamp(),
        scannedByManager: false
      });
      return true;
    } catch (error) {
      console.error('Error logging attendance:', error);
      throw error;
    }
  },

  // Update work status (active, break, offline)
  updateWorkStatus: async (uid, status) => {
    try {
      const userRef = doc(db, 'users', uid);
      // Ensure the doc exists first, if not create a stub
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
            role: 'staff',
            workStatus: status,
            lastStatusUpdate: serverTimestamp()
        }, { merge: true });
      } else {
        await updateDoc(userRef, {
            workStatus: status,
            lastStatusUpdate: serverTimestamp()
        });
      }
      return true;
    } catch (error) {
      console.error('Error updating work status:', error);
      throw error;
    }
  },

  // Submit leave request to Central Todo
  requestLeave: async (payload) => {
    try {
      const todosRef = collection(db, 'todos');
      const docRef = await addDoc(todosRef, {
        type: 'LEAVE_APPROVAL',
        status: 'pending_manager',
        payload: {
          staffUid: payload.staffUid,
          staffName: payload.staffName || 'Staff',
          leaveType: payload.leaveType,
          startDate: payload.startDate,
          endDate: payload.endDate,
          reason: payload.reason,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error requesting leave:', error);
      throw error;
    }
  }
};
