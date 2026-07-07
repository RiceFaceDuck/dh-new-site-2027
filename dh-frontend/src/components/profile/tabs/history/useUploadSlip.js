import { useState } from 'react';
import { db, auth } from '../../../../firebase/config';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { driveService } from '../../../../firebase/driveService';
import { compressImage } from '../../../../utils/imageCompression';

export const useUploadSlip = (selectedOrder, closeModal) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrorMsg('ขนาดไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setErrorMsg('');
    }
  };


  const handleUploadSlip = async () => {
    if (!file) {
      setErrorMsg('กรุณาเลือกรูปภาพสลิปโอนเงิน');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');

    try {
      const compressedFile = await compressImage(file);
      const finalSlipUrl = await driveService.uploadSlipImage(compressedFile);

      const batch = writeBatch(db);
      const user = auth.currentUser;

      const orderRef = doc(db, 'orders', selectedOrder.id);
      batch.update(orderRef, {
        paymentSlipUrl: finalSlipUrl,
        status: 'pending_payment_verification',
        updatedAt: serverTimestamp()
      });

      const todoRef = doc(collection(db, 'todos'));
      batch.set(todoRef, {
        type: "verify_slip",
        status: "pending",
        title: `ตรวจสอบการชำระเงิน: ออเดอร์ #${selectedOrder.id.slice(-6).toUpperCase()}`,
        orderId: selectedOrder.id,
        userId: user.uid,
        customerName: selectedOrder.shippingAddress?.fullName || "ลูกค้าทั่วไป",
        amount: selectedOrder.totals?.netTotal || 0,
        slipUrl: finalSlipUrl,
        requestedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      const historyRef = doc(collection(db, `users/${user.uid}/historyLogs`));
      batch.set(historyRef, {
        orderId: selectedOrder.id,
        action: "UPLOAD_SLIP",
        title: "ส่งหลักฐานการโอนเงินแล้ว",
        description: `ระบบส่งสลิปของออเดอร์ #${selectedOrder.id.slice(-6).toUpperCase()} ไปให้เจ้าหน้าที่ตรวจสอบแล้ว`,
        amount: selectedOrder.totals?.netTotal || 0,
        createdAt: serverTimestamp()
      });

      await batch.commit();

      setUploadSuccess(true);
      setTimeout(() => {
        closeModal();
      }, 2500);

    } catch (error) {
      console.error("Upload Error:", error);
      setErrorMsg("เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadState = () => {
    setFile(null);
    setPreviewUrl('');
    setErrorMsg('');
    setUploadSuccess(false);
  };

  return {
    file,
    previewUrl,
    isUploading,
    uploadSuccess,
    errorMsg,
    handleFileChange,
    handleUploadSlip,
    resetUploadState
  };
};
