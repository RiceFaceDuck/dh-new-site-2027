import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { driveService } from '../../../../firebase/driveService';
import { marketingService, toggleAdStatus } from '../../../../firebase/marketingService';
import { useUserCredit } from '../../../../firebase/creditService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';
import { useToast } from '../../../../context/ToastContext';
import { useStoreProfileData } from './useStoreProfileData';

const sanitizeData = (obj) => {
  const cleaned = {};
  for (let key in obj) {
    if (obj[key] === undefined) cleaned[key] = null;
    else cleaned[key] = obj[key];
  }
  return cleaned;
};

export const useAdManager = (user) => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState('store');
  const [loading, setLoading] = useState(true);

  // Use the global realtime credit hook
  const { balance: userCredit } = useUserCredit(user?.uid);

  const [ads, setAds] = useState([]);
  const [businessCardAd, setBusinessCardAd] = useState(null); 
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submittingAd, setSubmittingAd] = useState(false);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAdId, setEditingAdId] = useState(null);

  const [formData, setFormData] = useState({
    type: 'PRODUCT_LINK', title: '', description: '', imageUrl: '', targetUrl: '', platform: 'other', 
    billboardRatio: '16:9', price: ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [creditLimit, setCreditLimit] = useState(100); 
  const [isUnlimited, setIsUnlimited] = useState(false);
  const COST_PER_IMPRESSION = 1; 

  const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

  // Store Profile Data (SRP Extracted)
  const { storeData, setStoreData } = useStoreProfileData(user);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // ⚡ Real-Time Listener & Quota Shield: ใช้ onSnapshot คอลเลกชันเดียวเป็น SSOT ลดโควต้าอ่านซ้ำซ้อน 50%
    const partnerAdsQuery = query(
      collection(db, getCollectionPath('partner_ads')),
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(partnerAdsQuery, (snapshot) => {
      const liveAds = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      liveAds.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt).getTime() || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt).getTime() || 0);
        return timeB - timeA;
      });
      setAds(liveAds);
      const cardAd = liveAds.find(a => a.type === 'BUSINESS_CARD');
      setBusinessCardAd(cardAd || null);
      setLoading(false);
    }, (err) => {
      console.warn("Realtime ad listener warning:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const fetchMyAds = async (forceRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const myAds = await marketingService.getUserPartnerAds(user.uid, forceRefresh);
      setAds(myAds);
      const cardAd = myAds.find(ad => ad.type === 'BUSINESS_CARD');
      setBusinessCardAd(cardAd || null);
    } catch (error) { 
      console.error("Error fetching my ads:", error); 
    } finally {
      setLoading(false);
    }
  };

  const sanitizeUrl = (url) => {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const handleLinkChange = (e) => {
    const rawUrl = e.target.value;
    setFormData({ ...formData, targetUrl: rawUrl, platform: marketingService.detectPlatform(rawUrl) });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 🛡️ MIME Type Security Guard: รับเฉพาะไฟล์ภาพที่ถูกต้อง
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validImageTypes.includes(file.type)) {
      return showToast("กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (JPG, PNG, WebP)", 'error');
    }

    if (file.size > 10 * 1024 * 1024) return showToast("กรุณาเลือกรูปภาพที่มีขนาดไม่เกิน 10MB", 'error');

    setUploadingImage(true);
    try {
      const url = await driveService.uploadAdImage(file, formData.type);
      setFormData({ ...formData, imageUrl: url });
      showToast("อัปโหลดรูปภาพโฆษณาเรียบร้อย", 'success');
    } catch (error) {
      console.error("🔥 Error:", error);
      showToast(error?.message || "เกิดข้อผิดพลาดในการอัปโหลดรูป", 'error');
    } finally { 
      setUploadingImage(false); 
    }
  };

  const handleEditAd = (ad) => {
    if (ad.type === 'BUSINESS_CARD') {
       showToast("นามบัตรถูกจัดการผ่าน 'ข้อมูลร้านซ่อม' กรุณาไปแก้ไขที่แท็บข้อมูลร้านซ่อมครับ", 'info');
       setActiveSubTab('store');
       return;
    }
    setFormData({
      type: ad.type || 'PRODUCT_LINK',
      title: ad.title || ad.productName || '',
      description: ad.description || '',
      imageUrl: ad.imageUrl || '',
      targetUrl: ad.targetUrl || '',
      platform: ad.platform || 'other',
      billboardRatio: ad.billboardRatio || '16:9',
      price: ad.price || '',
      richDescription: ad.richDescription || ''
    });
    setCreditLimit(ad.creditLimit === -1 ? 100 : ad.creditLimit);
    setIsUnlimited(ad.creditLimit === -1);
    setIsEditMode(true);
    setEditingAdId(ad.id);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setIsEditMode(false);
    setEditingAdId(null);
    setFormData({ type: 'PRODUCT_LINK', title: '', description: '', richDescription: '', imageUrl: '', targetUrl: '', platform: 'other', billboardRatio: '16:9', price: '' });
  };

  const handleSubmitAd = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.targetUrl || !formData.imageUrl) {
      return showToast("กรุณากรอกข้อมูลและอัปโหลดรูปภาพให้ครบถ้วน", 'info');
    }

    const cleanTargetUrl = sanitizeUrl(formData.targetUrl);
    try {
      const parsed = new URL(cleanTargetUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return showToast("ลิงก์ปลายทางต้องขึ้นต้นด้วย http:// หรือ https://", 'error');
      }
    } catch {
      return showToast("รูปแบบลิงก์ปลายทางไม่ถูกต้อง", 'error');
    }

    if (formData.type === 'PRODUCT_LINK' && formData.price !== '' && Number(formData.price) < 0) {
      return showToast("ราคาสินค้าต้องไม่ติดลบ", 'error');
    }
    
    const finalCreditLimit = isUnlimited ? -1 : (Number(creditLimit) || 0);
    if (!isUnlimited && finalCreditLimit < 10) return showToast("กรุณาตั้งค่างบโฆษณาขั้นต่ำ 10 แต้ม", 'error');

    setSubmittingAd(true);
    try {
      const adPayload = sanitizeData({
        title: formData.title,
        description: formData.description || '',
        imageUrl: formData.imageUrl,
        targetUrl: cleanTargetUrl, 
        platform: formData.platform || marketingService.detectPlatform(cleanTargetUrl) || 'other',
        billboardRatio: formData.type === 'BILLBOARD' ? formData.billboardRatio : null,
        price: formData.type === 'PRODUCT_LINK' ? (formData.price ? Math.max(0, Number(formData.price)) : null) : null,
        richDescription: formData.type === 'PRODUCT_LINK' ? (formData.richDescription || '') : null,
        partnerName: getCustomerDisplayName(storeData, 'พาร์ทเนอร์'),
        costPerImpression: COST_PER_IMPRESSION
      });
      
      if (isEditMode && editingAdId) {
        await marketingService.updatePartnerAd(user.uid, editingAdId, formData.type, adPayload, finalCreditLimit);
        showToast("ส่งคำขอแก้ไขโฆษณาสำเร็จ! ระบบได้ส่งเรื่องให้ผู้จัดการตรวจสอบอีกครั้ง", 'success');
      } else {
        await marketingService.submitPartnerAd(user.uid, formData.type, adPayload, finalCreditLimit);
        showToast("สร้างคำขอโฆษณาสำเร็จ! ระบบได้ส่งเรื่องให้ผู้จัดการตรวจสอบแล้ว", 'success');
      }

      handleCloseForm();
      fetchMyAds(true);
    } catch (error) {
      console.error("🔥 Error submitting ad:", error);
      showToast(error?.message || "เกิดข้อผิดพลาดในการบันทึกโฆษณา", 'error');
    } finally { 
      setSubmittingAd(false); 
    }
  };

  const handleDeleteAd = async (adId) => {
    if (!adId) return;
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบแคมเปญโฆษณานี้?')) return;
    try {
      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      batch.delete(doc(db, getCollectionPath('partner_ads'), adId));
      batch.delete(doc(db, getCollectionPath('billboard_ads'), adId));
      batch.delete(doc(db, getCollectionPath('user_sku_ads'), adId));
      batch.delete(doc(db, getCollectionPath('todos'), `TODO-${adId}`));
      batch.delete(doc(db, getCollectionPath('todos'), `TODO-RESUBMIT-${adId}`));

      if (user?.uid && (adId === `AD-CARD-${user.uid}` || (businessCardAd && businessCardAd.id === adId))) {
        batch.delete(doc(db, getCollectionPath('ActivePartners'), user.uid));
      }
      
      await batch.commit();
      showToast("ลบแคมเปญโฆษณาเรียบร้อยแล้ว", 'info');
      fetchMyAds(true);
    } catch (error) {
      console.error("🔥 Delete error:", error);
      showToast("เกิดข้อผิดพลาดในการลบโฆษณา", 'error');
    }
  };

  const handleToggleAdStatus = async (ad) => {
    if (!ad || !ad.id) return;
    const isCurrentlyActive = ['APPROVED', 'ACTIVE'].includes(String(ad.status).toUpperCase());
    const actionText = isCurrentlyActive ? 'พักแคมเปญชั่วคราว' : 'เปิดใช้งานโฆษณาต่อ';
    const nextStatus = isCurrentlyActive ? 'paused' : 'active';

    if (!isCurrentlyActive && userCredit <= 0) {
      return showToast("ไม่สามารถเปิดใช้งานโฆษณาได้ เนื่องจาก Credit Point ของคุณหมด กรุณาเติม Credit ก่อน", 'error');
    }

    // 🚀 Instant Toggle (0ms Optimistic UI update across both tabs)
    setAds(prevAds => prevAds.map(item => item.id === ad.id ? { ...item, status: nextStatus, isActive: !isCurrentlyActive } : item));
    if (businessCardAd && businessCardAd.id === ad.id) {
      setBusinessCardAd(prev => ({ ...prev, status: nextStatus, isActive: !isCurrentlyActive }));
    }

    try {
      await toggleAdStatus(ad.id, ad.status, ad.type);
      showToast(`${actionText} เรียบร้อยแล้ว`, 'info');
      fetchMyAds(true);
    } catch (err) {
      console.error("🔥 Error toggling status:", err);
      // Rollback state on error
      setAds(prevAds => prevAds.map(item => item.id === ad.id ? { ...item, status: ad.status } : item));
      if (businessCardAd && businessCardAd.id === ad.id) {
        setBusinessCardAd(prev => ({ ...prev, status: ad.status, isActive: ad.isActive }));
      }
      showToast("เกิดข้อผิดพลาดในการเปลี่ยนสถานะโฆษณา", 'error');
    }
  };

  const handleResubmitAd = async (ad) => {
    if (!ad || !ad.id) return;
    try {
      const { resubmitPartnerAd } = await import('../../../../firebase/marketingService');
      await resubmitPartnerAd(user.uid, ad.id, ad.type);
      showToast("ส่งคำร้องขออนุมัติโฆษณาอีกครั้งสำเร็จ! ระบบส่งเรื่องขึ้นด้านบนสุดของหลังบ้านแล้ว", 'success');
      fetchMyAds(true);
    } catch (err) {
      console.error("🔥 Error resubmitting ad:", err);
      showToast("เกิดข้อผิดพลาดในการส่งคำร้องอีกครั้ง", 'error');
    }
  };

  return {
    loading,
    activeSubTab,
    setActiveSubTab,
    storeData,
    setStoreData,
    ads,
    businessCardAd,
    isFormOpen,
    setIsFormOpen,
    submittingAd,
    isEditMode,
    setIsEditMode,
    formData,
    setFormData,
    uploadingImage,
    creditLimit,
    setCreditLimit,
    isUnlimited,
    setIsUnlimited,
    userCredit,
    appId,
    COST_PER_IMPRESSION,
    fetchMyAds,
    handleLinkChange,
    handleImageUpload,
    handleEditAd,
    handleCloseForm,
    handleSubmitAd,
    handleDeleteAd,
    handleToggleAdStatus,
    handleResubmitAd
  };
};
