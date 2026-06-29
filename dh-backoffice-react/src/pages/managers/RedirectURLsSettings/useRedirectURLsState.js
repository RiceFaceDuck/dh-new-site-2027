import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { redirectURLsService } from '../../../firebase/redirectURLsService';

export const useRedirectURLsState = () => {
  const [redirects, setRedirects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRedirects = async () => {
    setIsLoading(true);
    try {
      const data = await redirectURLsService.getRedirects();
      setRedirects(data);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูล Redirect ได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRedirects();
  }, []);

  const handleAdd = async (data) => {
    setIsSubmitting(true);
    try {
      const newDoc = await redirectURLsService.addRedirect(data);
      setRedirects([newDoc, ...redirects]);
      toast.success('เพิ่ม Redirect เรียบร้อยแล้ว');
      return true;
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id, data) => {
    setIsSubmitting(true);
    try {
      await redirectURLsService.updateRedirect(id, data);
      setRedirects(redirects.map(r => r.id === id ? { ...r, ...data } : r));
      toast.success('บันทึกการแก้ไขเรียบร้อย');
      return true;
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, oldUrl) => {
    if (!window.confirm('คุณต้องการลบ Redirect นี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;
    
    try {
      await redirectURLsService.deleteRedirect(id, oldUrl);
      setRedirects(redirects.filter(r => r.id !== id));
      toast.success('ลบ Redirect เรียบร้อย');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const handleToggleStatus = async (id, currentStatus, oldUrl) => {
    try {
      const newStatus = !currentStatus;
      // Optimistic update
      setRedirects(redirects.map(r => r.id === id ? { ...r, isActive: newStatus } : r));
      await redirectURLsService.toggleStatus(id, newStatus, oldUrl);
      toast.success(newStatus ? 'เปิดใช้งาน Redirect แล้ว' : 'ปิดใช้งาน Redirect แล้ว');
    } catch (error) {
      // Revert if failed
      setRedirects(redirects.map(r => r.id === id ? { ...r, isActive: currentStatus } : r));
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  return {
    redirects,
    isLoading,
    isSubmitting,
    handleAdd,
    handleUpdate,
    handleDelete,
    handleToggleStatus,
    refreshData: fetchRedirects
  };
};
