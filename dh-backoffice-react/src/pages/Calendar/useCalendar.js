import { useState, useEffect } from 'react';
import format from 'date-fns/format';
import { calendarService } from '../../firebase/calendarService';
import { userService } from '../../firebase/userService';

// ประเภทของ Event (Color Coding)
export const EVENT_TYPES = [
  { id: 'meeting', label: 'นัดหมายลูกค้า', color: '#3b82f6', bg: 'bg-blue-500' },
  { id: 'delivery', label: 'จัดส่งสินค้า', color: '#10b981', bg: 'bg-emerald-500' },
  { id: 'holiday', label: 'วันหยุด/ลา', color: '#ef4444', bg: 'bg-red-500' },
  { id: 'other', label: 'อื่นๆ', color: '#8b5cf6', bg: 'bg-purple-500' },
];

export function useCalendar() {
  const [events, setEvents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  
  // Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endDate: format(new Date(), 'yyyy-MM-dd'),
    endTime: '10:00',
    description: '',
    type: 'other',
    guests: [] // array of emails
  });

  // โหลดรายชื่อพนักงาน (เพื่อใช้ส่ง Invite)
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const staffOnly = await userService.getAllStaff();
        setStaffList(staffOnly);
      } catch (err) {
        console.error("Error loading staff:", err);
      }
    };
    fetchStaff();
  }, []);

  const handleSelectSlot = ({ start, end }) => {
    setFormData({
      ...formData,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
    });
    setIsEventModalOpen(true);
  };

  const handleSelectEvent = (event) => {
    // ในอนาคตสามารถทำหน้าดูรายละเอียด/แก้ไขได้
    alert(`กิจกรรม: ${event.title}\nรายละเอียด: ${event.description}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return;

    setIsSubmitting(true);
    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`).toISOString();
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}:00`).toISOString();

      const newEvent = {
        title: `[${EVENT_TYPES.find(t => t.id === formData.type)?.label}] ${formData.title}`,
        startTime: startDateTime,
        endTime: endDateTime,
        description: formData.description,
        guests: formData.guests
      };

      // ยิง API ไปที่ GAS
      await calendarService.createEvent(newEvent);

      // สร้าง Event จำลองแสดงหน้าจอไปก่อน (ไม่ต้องรอ refresh page)
      setEvents([...events, {
        id: Math.random().toString(),
        title: formData.title,
        start: new Date(`${formData.startDate}T${formData.startTime}:00`),
        end: new Date(`${formData.endDate}T${formData.endTime}:00`),
        type: formData.type,
        description: formData.description
      }]);

      setIsEventModalOpen(false);
      setFormData({
        title: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endDate: format(new Date(), 'yyyy-MM-dd'),
        endTime: '10:00',
        description: '',
        type: 'other',
        guests: []
      });
      alert('บันทึกและส่ง Invite เรียบร้อยแล้ว');
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    events,
    staffList,
    isEventModalOpen,
    setIsEventModalOpen,
    isSubmitting,
    formData,
    setFormData,
    handleSelectSlot,
    handleSelectEvent,
    handleSubmit
  };
}
