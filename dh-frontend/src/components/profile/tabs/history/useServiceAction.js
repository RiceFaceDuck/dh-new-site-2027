import { useState } from 'react';
import { db, auth } from '../../../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { driveService } from '../../../../firebase/driveService';

export const useServiceAction = (serviceModal, setServiceModal) => {
  const [serviceForm, setServiceForm] = useState(null);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const initForm = (actionType, item, order) => {
    const defaultAction = actionType === 'claim' ? 'เคลมสินค้า' : 'คืนสินค้า (เสีย) คืนเงิน ค้างยอด';
    setServiceForm({
      transactionId: `DH-${Math.random().toString(16).substr(2, 8)}`,
      timestamp: new Date().toLocaleString('th-TH'),
      customerInfo: `${order.shippingAddress?.fullName || 'ลูกค้า'} / ${order.shippingAddress?.phone || '-'}`,
      productInfo: `${item.name} (SKU: ${item.sku})`,
      actionType: defaultAction,
      warrantyDate: order.createdAt?.toDate ? order.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      reasonCode: '', details: '', inspectorName: 'ลูกค้า (หน้าเว็บ)', currentStatus: 'รอรับสินค้าคืน / รอตรวจสอบ',
      tracking: '', images: [], qty: 1
    });
  };

  const handleServiceImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const uploadFn = driveService.uploadImage || driveService.uploadSlip;
      if (typeof uploadFn === 'function') {
         const uploadedUrls = await Promise.all(files.map(file => uploadFn(file)));
         setServiceForm(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      } else {
         throw new Error("upload function not available");
      }
    } catch (error) { 
      alert('อัปโหลดภาพล้มเหลว: ' + error.message); 
    } finally { 
      setIsUploading(false); 
    }
  };

  const handleSubmitService = async (e) => {
    e.preventDefault();
    if (!serviceForm || !serviceModal) return;
    if (serviceForm.qty < 1 || serviceForm.qty > serviceModal.item.quantity) return alert('ระบุจำนวนไม่ถูกต้อง');
    if (!serviceForm.reasonCode) return alert('กรุณาระบุ สาเหตุ / อาการ');

    setIsSubmittingService(true);
    try {
      const payload = {
        claimId: serviceModal.type === 'claim' ? serviceForm.transactionId : '',
        returnId: serviceModal.type === 'return' ? serviceForm.transactionId : '',
        orderId: serviceModal.order.id || '',
        orderDocId: serviceModal.order.id || '',
        customerUid: auth.currentUser.uid || '',
        customerName: serviceModal.order.shippingAddress?.fullName || 'ลูกค้าทั่วไป',
        sku: serviceModal.item.sku || '',
        productName: serviceModal.item.name || '',
        purchaseDate: serviceForm.warrantyDate || null,
        purchasePrice: serviceModal.item.price || 0,
        symptomCode: serviceModal.type === 'claim' ? serviceForm.reasonCode : '',
        symptomDetails: serviceModal.type === 'claim' ? serviceForm.details : '',
        returnReason: serviceModal.type === 'return' ? serviceForm.reasonCode : '',
        returnDetails: serviceModal.type === 'return' ? serviceForm.details : '',
        trackingNo: serviceForm.tracking || '',
        qty: serviceForm.qty || 1,
        status: serviceForm.currentStatus || 'pending_manager',
        actionType: serviceForm.actionType || '',
        inspectorName: serviceForm.inspectorName || '',
        images: serviceForm.images || [],
        requestedBy: auth.currentUser.uid || '',
        requestedByName: auth.currentUser.displayName || auth.currentUser.email || 'ลูกค้า'
      };

      await addDoc(collection(db, 'todos'), {
        type: serviceModal.type === 'claim' ? "CLAIM_APPROVAL" : "RETURN_APPROVAL",
        title: `แจ้ง${serviceModal.type === 'claim' ? 'เคลม' : 'คืน'}สินค้า: ${serviceModal.item.name} (${serviceForm.transactionId})`,
        description: `บิลอ้างอิง: ${serviceModal.order.id}\nอาการ/เหตุผล: ${serviceForm.reasonCode}\nรายละเอียด: ${serviceForm.details || '-'}\nการกระทำ: ${serviceForm.actionType}\nจำนวน: ${payload.qty} ชิ้น`,
        priority: "High", 
        status: "pending_manager",
        referenceType: "Order", 
        referenceId: serviceModal.order.id,
        payload: payload, 
        createdByUid: auth.currentUser.uid, 
        handledBy: null,
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp()
      });

      alert(`ส่งเรื่องแจ้ง${serviceModal.type === 'claim' ? 'เคลม' : 'คืน'}สินค้าเรียบร้อย รอเจ้าหน้าที่ติดต่อกลับ!`);
      setServiceModal(null);
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSubmittingService(false);
    }
  };

  return {
    serviceForm,
    setServiceForm,
    initForm,
    isSubmittingService,
    isUploading,
    handleServiceImageUpload,
    handleSubmitService
  };
};
