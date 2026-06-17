import { useState } from 'react';
import { db, auth } from '../../../../firebase/config';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { driveService } from '../../../../firebase/driveService';

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

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); 
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUploadSlip = async () => {
    if (!file) {
      setErrorMsg('กรุณาเลือกรูปภาพสลิปโอนเงิน');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');

    try {
      let finalSlipUrl = '';

      try {
        const uploadFn = driveService.uploadImage || driveService.uploadSlip;
        if (typeof uploadFn === 'function') {
          finalSlipUrl = await uploadFn(file);
        }
      } catch (driveErr) {
        console.warn("Drive Upload Failed, using fallback...", driveErr);
      }

      if (!finalSlipUrl || typeof finalSlipUrl !== 'string' || finalSlipUrl.length < 5) {
        finalSlipUrl = await compressImage(file);
      }

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
