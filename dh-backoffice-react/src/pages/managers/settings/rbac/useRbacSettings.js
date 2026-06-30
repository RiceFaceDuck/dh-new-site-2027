import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import toast from 'react-hot-toast';
import { historyService } from '../../../../firebase/historyService';

export const useRbacSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'settings', 'rbac_permissions');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setSettings(snap.data());
      } else {
        // Default Settings
        const defaultSettings = {
          canDeleteOrder: ['owner', 'admin'],
          canEditProductPrice: ['owner', 'admin', 'manager'],
          canApproveRefund: ['owner', 'admin', 'manager'],
          canViewReports: ['owner', 'admin', 'manager'],
          canManageUsers: ['owner', 'admin'],
          canBypassBufferStock: ['owner', 'admin', 'manager']
        };
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error fetching RBAC settings:", error);
      toast.error('ไม่สามารถโหลดการตั้งค่าสิทธิ์ได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (newSettings) => {
    try {
      const docRef = doc(db, 'settings', 'rbac_permissions');
      await setDoc(docRef, { ...newSettings, updatedAt: serverTimestamp() }, { merge: true });
      setSettings(newSettings);
      
      // Log to Google Drive Audit
      historyService.addLog({
        module: 'SECURITY',
        action: 'UPDATE_RBAC',
        target: { id: 'rbac_permissions' },
        details: { legacy_details: 'อัปเดตการจัดการสิทธิ์พนักงาน (RBAC Settings)' }
      });
      
      toast.success('บันทึกการตั้งค่าสิทธิ์สำเร็จ');
      return true;
    } catch (error) {
      console.error("Error saving RBAC settings:", error);
      toast.error('บันทึกการตั้งค่าสิทธิ์ไม่สำเร็จ');
      return false;
    }
  };

  return { settings, loading, saveSettings };
};
