import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { auth } from '../../../firebase/config';
import { historyService } from '../../../firebase/historyService';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export function usePartnerSettings() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const partnersRef = collection(db, 'artifacts', appId, 'public', 'data', 'partners');
      const snapshot = await getDocs(partnersRef);
      
      const fetchedPartners = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPartners(fetchedPartners);
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const filteredPartners = partners.filter(p => {
    const matchesSearch = 
      (p.storeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.contactName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.contactEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = 
      statusFilter === 'all' ? true : 
      statusFilter === 'active' ? p.isActive === true : 
      p.isActive === false;
      
    return matchesSearch && matchesStatus;
  });

  const togglePartnerStatus = async (partnerId, currentStatus) => {
    if (!window.confirm(`คุณต้องการ ${currentStatus ? 'ระงับ' : 'เปิดใช้งาน'} พาร์ทเนอร์รายนี้ใช่หรือไม่?`)) return;
    
    setActionLoading(partnerId);
    try {
      const newStatus = !currentStatus;
      const partnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'partners', partnerId);
      
      await updateDoc(partnerRef, {
        isActive: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      const partnerName = partners.find(p => p.id === partnerId)?.storeName || partnerId;
      await historyService.addLog('PartnerSettings', currentStatus ? 'Suspend' : 'Activate', partnerId, `${currentStatus ? 'ระงับ' : 'เปิดใช้งาน'} พาร์ทเนอร์ ${partnerName}`, auth.currentUser?.uid);

      setPartners(prev => prev.map(p => p.id === partnerId ? { ...p, isActive: newStatus } : p));
      
    } catch (error) {
      console.error("Error updating partner status:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    } finally {
      setActionLoading(null);
    }
  };

  const togglePartnerVerification = async (partnerId, currentStatus) => {
    if (!window.confirm(`คุณต้องการ ${currentStatus ? 'ยกเลิก' : 'อนุมัติ'} การยืนยันตัวตน (Verification Badge) ของพาร์ทเนอร์รายนี้ใช่หรือไม่?`)) return;
    
    setActionLoading(`verify_${partnerId}`);
    try {
      const newStatus = !currentStatus;
      const partnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'partners', partnerId);
      
      await updateDoc(partnerRef, {
        isVerified: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      const partnerName = partners.find(p => p.id === partnerId)?.storeName || partnerId;
      await historyService.addLog('PartnerSettings', currentStatus ? 'RevokeVerify' : 'GrantVerify', partnerId, `${currentStatus ? 'ยกเลิก' : 'อนุมัติ'} Verification Badge พาร์ทเนอร์ ${partnerName}`, auth.currentUser?.uid);

      setPartners(prev => prev.map(p => p.id === partnerId ? { ...p, isVerified: newStatus } : p));
      
    } catch (error) {
      console.error("Error updating verification status:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดต Verification Badge");
    } finally {
      setActionLoading(null);
    }
  };

  return {
    partners,
    filteredPartners,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    actionLoading,
    togglePartnerStatus,
    togglePartnerVerification
  };
}
