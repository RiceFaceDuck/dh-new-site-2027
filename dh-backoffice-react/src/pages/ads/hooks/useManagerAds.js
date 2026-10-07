import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, writeBatch, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { auth } from '../../../firebase/config';
import { historyService } from '../../../firebase/historyService';
import { adManagementService } from '../../../firebase/adManagementService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const appId = typeof window !== "undefined" && window.__app_id ? window.__app_id : "default-app-id";

export function useManagerAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING, APPROVED, REJECTED
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    const collections = ['partner_ads', 'user_sku_ads', 'billboard_ads'];
    const unsubscribes = [];
    let allData = { partner_ads: [], user_sku_ads: [], billboard_ads: [] };

    const updateUI = () => {
      let combined = [ ...allData.partner_ads, ...allData.user_sku_ads, ...allData.billboard_ads ];
      
      const uniqueAds = Array.from(new Map(combined.map(item => [item.id, item])).values());
      
      uniqueAds.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      
      setAds(uniqueAds);
      setLoading(false);
    };

    collections.forEach(colName => {
      const colRef = collection(db, getCollectionPath(colName));
      // Query limiting to recent 50 ads per type to prevent quota leaks
      const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
      const unsub = onSnapshot(q, (snapshot) => {
        allData[colName] = snapshot.docs.map(d => ({ id: d.id, _collection: colName, ...d.data() }));
        updateUI();
      }, (error) => {
        console.error(`❌ Error fetching ${colName}:`, error);
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const handleAction = async (ad, action) => {
    const isApprove = action === 'APPROVED';
    const isReject = action === 'REJECTED';
    const confirmPrompt = isApprove ? 'อนุมัติให้แสดงผล' : (isReject ? 'ปฏิเสธคำขอ' : 'เปลี่ยนสถานะเป็นรอตรวจสอบ');
    if (!window.confirm(`ยืนยันการ ${confirmPrompt} โฆษณานี้?`)) return;
    
    setProcessingId(ad.id);
    try {
      const taskId = `TODO-${ad.id}`;
      if (isApprove) {
        const result = await adManagementService.approveAd(ad.id, taskId);
        if (!result.success) throw new Error(result.message);
      } else if (isReject) {
        const result = await adManagementService.rejectAd(ad.id, taskId, 'ผู้จัดการปฏิเสธคำขอจากหน้าจัดการโฆษณา');
        if (!result.success) throw new Error(result.message);
      } else {
        // กรณีดึงกลับไป PENDING หรือรอตรวจสอบ
        const batch = writeBatch(db);
        const actionData = { status: 'pending', isActive: false, updatedAt: serverTimestamp() };
        batch.set(doc(db, getCollectionPath(ad._collection || 'partner_ads'), ad.id), actionData, { merge: true });
        batch.set(doc(db, getCollectionPath('todos'), taskId), { status: 'pending', resolution: null, updatedAt: serverTimestamp() }, { merge: true });
        if (ad.type === 'BUSINESS_CARD' && ad.ownerId) {
          batch.delete(doc(db, getCollectionPath('ActivePartners'), ad.ownerId));
        }
        await batch.commit();
      }

      // Log the manager action
      const title = ad.title || ad.productName || 'ไม่มีหัวข้อ';
      await historyService.addLog(
        'ManagerAds', 
        isApprove ? 'ApproveAd' : (isReject ? 'RejectAd' : 'RevertAd'), 
        ad.id, 
        `${isApprove ? 'อนุมัติ' : (isReject ? 'ปฏิเสธ' : 'เปลี่ยนสถานะเป็นรอตรวจสอบ')}โฆษณา: ${title}`, 
        auth.currentUser?.uid
      );
    } catch (error) {
      console.error("🔥 Action error:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAds = ads.filter(ad => String(ad.status).toUpperCase() === activeTab);

  return {
    ads: filteredAds,
    loading,
    activeTab,
    setActiveTab,
    processingId,
    handleAction,
    pendingCount: ads.filter(a => String(a.status).toUpperCase() === 'PENDING').length
  };
}
