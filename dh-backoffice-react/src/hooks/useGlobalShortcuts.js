import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook สำหรับจัดการ Global Keyboard Shortcuts ของระบบ
 * ให้ประสบการณ์ใช้งานแบบ Enterprise Software
 */
export const useGlobalShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // ตรวจสอบว่ากำลังพิมพ์ใน Input หรือ Textarea อยู่หรือไม่
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable;
      
      // Ctrl + K : ค้นหา
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('/search');
      }

      // ป้องกันการ Trigger Shortcut อื่นๆ หากกำลังพิมพ์ข้อความอยู่
      if (isInputFocused) return;

      // Alt + B : ไปที่หน้าออกบิล (Billing)
      if (e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        navigate('/billing');
      }

      // Alt + I : ไปที่หน้าคลังสินค้า (Inventory)
      if (e.altKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        navigate('/inventory');
      }

      // Alt + C : ไปที่หน้าลูกค้า (Customers)
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        navigate('/customers');
      }

      // Alt + H : ไปที่หน้าประวัติ (History)
      if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        navigate('/history');
      }
      
      // Alt + T : ไปที่หน้าจดงาน (Todo)
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        navigate('/todo');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
};

export default useGlobalShortcuts;
