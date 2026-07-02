import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import th from 'date-fns/locale/th'; // ใช้ภาษาไทย
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar as CalendarIcon, Plus, Info } from 'lucide-react';

import GuideModal from '../../components/common/GuideModal';
import { useCalendar, EVENT_TYPES } from './useCalendar';
import CalendarEventModal from './CalendarEventModal';

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

export default function CalendarPage() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const {
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
  } = useCalendar();

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

      {/* Create Event Modal Component */}
      <CalendarEventModal 
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        staffList={staffList}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

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
