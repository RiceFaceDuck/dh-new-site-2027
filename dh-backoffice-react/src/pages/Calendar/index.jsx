import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import th from 'date-fns/locale/th'; // ใช้ภาษาไทย
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar as CalendarIcon, Plus, Info, X, Users, AlignLeft, Clock } from 'lucide-react';

import GuideModal from '../../components/common/GuideModal';
import { calendarService } from '../../firebase/calendarService';
import { userService } from '../../firebase/userService'; // เพื่อดึงรายชื่อพนักงาน

// ตั้งค่า Localizer ให้กับ react-big-calendar (รองรับภาษาไทย)
const locales = {
  'th': th,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // เริ่มวันจันทร์
  getDay,
  locales,
});

// ประเภทของ Event (Color Coding)
const EVENT_TYPES = [
  { id: 'meeting', label: 'นัดหมายลูกค้า', color: '#3b82f6', bg: 'bg-blue-500' },
  { id: 'delivery', label: 'จัดส่งสินค้า', color: '#10b981', bg: 'bg-emerald-500' },
  { id: 'holiday', label: 'วันหยุด/ลา', color: '#ef4444', bg: 'bg-red-500' },
  { id: 'other', label: 'อื่นๆ', color: '#8b5cf6', bg: 'bg-purple-500' },
];

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
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
  
  // Staff List
  const [staffList, setStaffList] = useState([]);
  const [guestInput, setGuestInput] = useState('');

  // โหลดรายชื่อพนักงาน (เพื่อใช้ส่ง Invite)
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const users = await userService.getAllUsers();
        // กรองเอาเฉพาะ staff/manager
        const staffOnly = users.filter(u => u.isStaff || ['admin', 'manager', 'staff'].includes(String(u.role).toLowerCase()));
        setStaffList(staffOnly);
      } catch (err) {
        console.error("Error loading staff:", err);
      }
    };
    fetchStaff();
  }, []);

  // Custom Event Component เพื่อให้สีสันสวยงามตาม Type
  const EventComponent = ({ event }) => {
    return (
      <div className="flex items-center text-xs truncate px-1">
        <strong>{event.title}</strong>
      </div>
    );
  };

  const eventPropGetter = (event) => {
    const typeInfo = EVENT_TYPES.find(t => t.id === event.type) || EVENT_TYPES[3];
    return {
      style: {
        backgroundColor: typeInfo.color,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block'
      }
    };
  };

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

  const handleAddGuest = (e) => {
    if (e.key === 'Enter' && guestInput.trim()) {
      e.preventDefault();
      if (!formData.guests.includes(guestInput.trim())) {
        setFormData({ ...formData, guests: [...formData.guests, guestInput.trim()] });
      }
      setGuestInput('');
    }
  };

  const handleRemoveGuest = (email) => {
    setFormData({ ...formData, guests: formData.guests.filter(g => g !== email) });
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

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="px-8 py-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <CalendarIcon size={24} />
            </div>
            ปฏิทินปฏิบัติงานส่วนกลาง
          </h1>
          <p className="text-slate-500 mt-1">จัดการตารางงาน จัดส่ง และวันหยุดของพนักงาน</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
          >
            <Info size={18} />
            คู่มือการใช้งาน
          </button>
          <button 
            onClick={() => setIsEventModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95"
          >
            <Plus size={18} />
            สร้างกิจกรรมใหม่
          </button>
        </div>
      </div>

      {/* Tags Legend */}
      <div className="px-8 py-4 flex gap-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
        <span className="text-sm font-semibold text-slate-600 mr-2">ประเภทงาน:</span>
        {EVENT_TYPES.map(type => (
          <div key={type.id} className="flex items-center gap-2 text-sm text-slate-600">
            <span className={`w-3 h-3 rounded-full ${type.bg}`}></span>
            {type.label}
          </div>
        ))}
      </div>

      {/* Calendar Area */}
      <div className="flex-1 p-8 overflow-hidden bg-white dark:bg-slate-900 rounded-tl-3xl shadow-inner">
        <div className="h-full border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white shadow-sm">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            culture="th"
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            components={{
              event: EventComponent
            }}
            eventPropGetter={eventPropGetter}
            views={['month', 'week', 'day', 'agenda']}
            messages={{
              next: "ถัดไป",
              previous: "ก่อนหน้า",
              today: "วันนี้",
              month: "เดือน",
              week: "สัปดาห์",
              day: "วัน",
              agenda: "กำหนดการ",
            }}
          />
        </div>
      </div>

      {/* Create Event Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CalendarIcon className="text-blue-500" /> สร้างกิจกรรมใหม่
              </h2>
              <button onClick={() => setIsEventModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="event-form" onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">หัวข้อกิจกรรม *</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="เช่น ส่งของสาขาสีลม, นัดคุยงาน" />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">ประเภทงาน</label>
                  <div className="flex gap-3">
                    {EVENT_TYPES.map(type => (
                      <button type="button" key={type.id} onClick={() => setFormData({...formData, type: type.id})} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${formData.type === type.id ? `${type.bg} text-white border-transparent shadow-md` : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1"><Clock size={14}/> เริ่มต้น</label>
                    <div className="flex gap-2">
                      <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none" />
                      <input type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-24 px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1"><Clock size={14}/> สิ้นสุด</label>
                    <div className="flex gap-2">
                      <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none" />
                      <input type="time" required value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-24 px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none" />
                    </div>
                  </div>
                </div>

                {/* Guests / Invitees */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1"><Users size={14}/> ผู้เข้าร่วม (ส่งอีเมลเชิญลงปฏิทิน)</label>
                  <div className="flex gap-2 mb-2">
                    <input 
                      type="email" 
                      value={guestInput} 
                      onChange={e => setGuestInput(e.target.value)} 
                      onKeyDown={handleAddGuest}
                      placeholder="พิมพ์อีเมลแล้วกด Enter..." 
                      className="flex-1 px-4 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                    />
                    <select 
                      onChange={(e) => {
                        if(e.target.value && !formData.guests.includes(e.target.value)) {
                          setFormData({...formData, guests: [...formData.guests, e.target.value]});
                        }
                        e.target.value = '';
                      }}
                      className="w-10 px-1 py-2 rounded-xl border border-slate-300 outline-none cursor-pointer bg-slate-50 text-transparent"
                      title="เลือกจากรายชื่อพนักงาน"
                    >
                      <option value="">+</option>
                      {staffList.map(staff => (
                        <option key={staff.uid} value={staff.email} className="text-black">{staff.firstName} ({staff.email})</option>
                      ))}
                    </select>
                  </div>
                  
                  {formData.guests.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      {formData.guests.map((g, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          {g}
                          <button type="button" onClick={() => handleRemoveGuest(g)} className="hover:text-blue-900"><X size={12}/></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1"><AlignLeft size={14}/> รายละเอียด</label>
                  <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="ใส่รายละเอียดเพิ่มเติม เช่น สถานที่จัดส่ง, เบอร์โทรติดต่อ..."></textarea>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 flex justify-end gap-3">
              <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors">ยกเลิก</button>
              <button type="submit" form="event-form" disabled={isSubmitting} className="px-8 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? <span className="animate-pulse">กำลังบันทึกและส่งอีเมล...</span> : 'บันทึกเหตุการณ์'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      <GuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)}
        title="คู่มือการใช้งานระบบปฏิทินกลาง"
        config={{
          description: "ระบบปฏิทินกลาง ออกแบบมาเพื่อจัดการตารางการทำงานขององค์กร เช่น นัดหมายลูกค้า, ตารางจัดส่งสินค้า, หรือวันหยุดพนักงาน โดยระบบจะเชื่อมต่อตรงเข้ากับ <b>Google Calendar</b> ของส่วนกลาง และสามารถส่งคำเชิญเข้าอีเมลพนักงานได้ทันที",
          howTo: [
            "1. <b>การสร้างเหตุการณ์:</b> สามารถคลิกปุ่ม 'สร้างกิจกรรมใหม่' ด้านบน หรือ ลากเมาส์คลุมช่วงเวลาบนปฏิทิน",
            "2. <b>การแยกประเภท (Color Coding):</b> เลือกประเภทของงานเพื่อกำหนดสีให้ตารางดูง่าย (สีฟ้า=นัดหมาย, สีเขียว=จัดส่ง, สีแดง=วันหยุด)",
            "3. <b>การเชิญพนักงาน (Invite):</b> ในช่องผู้เข้าร่วม ให้พิมพ์อีเมลของพนักงานแล้วกด Enter (หรือเลือกจากปุ่ม drop-down) ระบบจะส่งการแจ้งเตือนลงปฏิทินส่วนตัวของพนักงานคนนั้นทันที"
          ],
          tips: [
            "สามารถเปลี่ยนมุมมอง ปฏิทินแบบ รายเดือน, รายสัปดาห์, หรือตารางงานแบบลิสต์ (กำหนดการ) ได้จากเมนูด้านบนขวา",
            "อีเมลที่เชิญควรเป็นบัญชี Gmail หรือ Google Workspace เพื่อให้ปฏิทินเด้งเตือนในโทรศัพท์ของพนักงานอัตโนมัติ"
          ],
          expectedResults: "เมื่อกดยืนยันสร้างกิจกรรม ข้อมูลจะถูกบันทึกลงใน Google Calendar ของส่วนกลาง หากมีการเพิ่มชื่อผู้เข้าร่วม พนักงานจะได้รับอีเมลคำเชิญ (Invite) ภายในไม่กี่วินาที"
        }}
      />
    </div>
  );
}
