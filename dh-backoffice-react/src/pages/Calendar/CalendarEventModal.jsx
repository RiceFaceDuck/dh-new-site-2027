import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Users, AlignLeft, X } from 'lucide-react';
import { EVENT_TYPES } from './useCalendar';

export default function CalendarEventModal({ 
  isOpen, 
  onClose, 
  formData, 
  setFormData, 
  staffList, 
  onSubmit, 
  isSubmitting 
}) {
  const [guestInput, setGuestInput] = useState('');

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarIcon className="text-blue-500" /> สร้างกิจกรรมใหม่
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="event-form" onSubmit={onSubmit} className="space-y-5">
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
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors">ยกเลิก</button>
          <button type="submit" form="event-form" disabled={isSubmitting} className="px-8 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all disabled:opacity-50 flex items-center gap-2">
            {isSubmitting ? <span className="animate-pulse">กำลังบันทึกและส่งอีเมล...</span> : 'บันทึกเหตุการณ์'}
          </button>
        </div>
      </div>
    </div>
  );
}
