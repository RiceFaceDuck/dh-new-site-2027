import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Megaphone } from 'lucide-react';
import { usePromotions } from './hooks/usePromotions';
import PromotionTable from './components/promotion/PromotionTable';
import PromotionModal from './components/promotion/PromotionModal';
import GuideModal from '../../components/common/GuideModal';

export default function PromotionManagement() {
  const navigate = useNavigate();
  const {
    promotions,
    loading,
    isModalOpen,
    setIsModalOpen,
    isProcessing,
    formData,
    setFormData,
    handleOpenModal,
    handleSave,
    handleToggleActive,
    handleDelete
  } = usePromotions();

  const [isGuideOpen, setIsGuideOpen] = React.useState(false);

  return (
    <div className="max-w-6xl mx-auto pb-12 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <button onClick={() => navigate('/managers')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 mb-4 transition-colors">
            <ArrowLeft size={16} /> กลับไปหน้าผู้จัดการ (Managers Office)
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-100 text-fuchsia-700 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
            <Megaphone size={14} /> Promotion Center
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">จัดการโปรโมชั่น & ส่วนลด</h1>
            <button onClick={() => setIsGuideOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-fuchsia-600 bg-fuchsia-50 hover:bg-fuchsia-100 rounded-lg transition-colors border border-fuchsia-200 shadow-sm dh-active-press">
              <Megaphone size={16} /> คู่มือการใช้งาน
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1 font-medium">สร้างแคมเปญกระตุ้นยอดขาย และกำหนดเงื่อนไขส่วนลดในบิลอัตโนมัติ</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-xl shadow-lg shadow-fuchsia-600/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
          <Plus size={20} strokeWidth={3} /> สร้างโปรโมชันใหม่
        </button>
      </div>

      {/* Content */}
      <PromotionTable 
        promotions={promotions}
        loading={loading}
        handleToggleActive={handleToggleActive}
        handleOpenModal={handleOpenModal}
        handleDelete={handleDelete}
      />

      {/* Modal */}
      <PromotionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        handleSave={handleSave}
        isProcessing={isProcessing}
      />

      <GuideModal 
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="คู่มือ: จัดการโปรโมชั่น & ส่วนลด"
        icon={Megaphone}
        config={{
          description: "ระบบสำหรับสร้างและจัดการแคมเปญส่งเสริมการขาย ซึ่งจะไปแสดงผลบนหน้าต่าง POS อัตโนมัติเมื่อพนักงานเปิดบิลและยอดซื้อตรงตามเงื่อนไข",
          howTo: [
            "<strong>การสร้างโปรโมชั่น:</strong> คลิกปุ่ม <code>สร้างโปรโมชันใหม่</code> และระบุชื่อแคมเปญ ยอดซื้อขั้นต่ำ ส่วนลดที่ได้รับ และวันที่เริ่มต้น-สิ้นสุด",
            "<strong>การเปิด/ปิดใช้งาน:</strong> ใช้สวิตช์ (Toggle) สีเขียว เพื่อสั่งให้โปรโมชั่น <code>ออนไลน์</code> หรือ <code>ออฟไลน์</code> ทันที",
            "<strong>การแก้ไข/ลบ:</strong> กดปุ่มไอคอนดินสอ เพื่อแก้ไขรายละเอียดโปรโมชั่น หรือกดรูปถังขยะ เพื่อลบออกจากระบบอย่างถาวร"
          ],
          tips: [
            "หากคุณต้องการจัดโปรโมชั่นแบบ <strong>ลดตามขั้นบันได (Tiered Discount)</strong> สามารถสร้างหลายโปรโมชั่นพร้อมกัน โดยกำหนด <code>ยอดซื้อขั้นต่ำ</code> และ <code>ส่วนลดที่ได้รับ</code> ให้สัมพันธ์กัน",
            "การปิดใช้งานชั่วคราวด้วยสวิตช์ จะดีกว่าการลบโปรโมชั่นทิ้ง เพราะคุณสามารถเปิดกลับมาใช้ใหม่ได้ในเทศกาลหน้า"
          ],
          expectedResults: "เมื่อโปรโมชั่นอยู่ในสถานะออนไลน์ พนักงานขายจะเห็นแคมเปญนี้ขึ้นมาแนะนำในระบบ POS และลูกค้าจะได้รับส่วนลดอัตโนมัติตามยอดที่กำหนด"
        }}
      />
    </div>
  );
}