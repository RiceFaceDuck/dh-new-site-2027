import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Gift } from 'lucide-react';
import { useFreebies } from './hooks/useFreebies';
import FreebieTable from './components/freebie/FreebieTable';
import FreebieModal from './components/freebie/FreebieModal';
import GuideModal from '../../components/common/GuideModal';

export default function FreebieManagement() {
  const navigate = useNavigate();
  const {
    freebies,
    categories,
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
  } = useFreebies();

  const [isGuideOpen, setIsGuideOpen] = React.useState(false);

  return (
    <div className="max-w-6xl mx-auto pb-12 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <button onClick={() => navigate('/managers')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 mb-4 transition-colors">
            <ArrowLeft size={16} /> กลับไปหน้าผู้จัดการ (Managers Office)
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
            <Gift size={14} /> Freebie Rules
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">ตั้งค่ากฎของแถม</h1>
            <button onClick={() => setIsGuideOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors border border-pink-200 shadow-sm dh-active-press">
              <Gift size={16} /> คู่มือการใช้งาน
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1 font-medium">กำหนดเงื่อนไขยอดซื้อ กลุ่มเป้าหมาย หรือช่วงเวลา เพื่อแจกสินค้าฟรีในบิลอัตโนมัติ</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
          <Plus size={20} strokeWidth={3} /> สร้างกฎของแถมใหม่
        </button>
      </div>

      {/* Content */}
      <FreebieTable 
        freebies={freebies}
        loading={loading}
        handleToggleActive={handleToggleActive}
        handleOpenModal={handleOpenModal}
        handleDelete={handleDelete}
      />

      {/* Modal */}
      <FreebieModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        handleSave={handleSave}
        isProcessing={isProcessing}
      />

      <GuideModal 
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="คู่มือ: จัดการกฎของแถม"
        icon={Gift}
        config={{
          description: "ระบบสำหรับสร้างกฎเพื่อแจกของแถมอัตโนมัติ โดยระบบจะคำนวณและเพิ่มของแถมลงในบิล (POS และหน้าร้าน) ให้ทันทีเมื่อลูกค้าซื้อสินค้าตรงตามเงื่อนไขที่คุณกำหนดไว้",
          howTo: [
            "<strong>การสร้างกฎ:</strong> คลิก <code>สร้างกฎของแถมใหม่</code> ระบุชื่อของแถม จำนวนชิ้น และเงื่อนไขต่างๆ",
            "<strong>จำกัดเฉพาะสินค้า:</strong> สามารถระบุ SKU หรือหมวดหมู่ (TYPE) ที่ร่วมรายการ หากลูกค้าซื้อสินค้าตามที่ระบุจึงจะได้ของแถม (เว้นว่างไว้หากใช้ได้กับทั้งร้าน)",
            "<strong>เงื่อนไขละเอียด:</strong> คุณสามารถจำกัด <code>กลุ่มลูกค้า</code> (เช่น ให้เฉพาะ VIP), ตั้ง <code>วันที่เริ่มต้น-สิ้นสุด</code>, และกำหนด <code>โควต้าทั้งหมด</code> (เช่น แจกแค่ 100 ชิ้นแรก) ได้",
            "<strong>การเปิด/ปิด:</strong> ใช้สวิตช์ Toggle เพื่อสั่งระงับชั่วคราว หรือถ้าต้องการลบถาวรให้คลิกที่ไอคอนถังขยะ"
          ],
          tips: [
            "หากต้องการแจกของให้ลูกค้าทุกคนในบิลแรกของวัน โดยไม่สนยอดซื้อ ให้กำหนด <code>ยอดซื้อขั้นต่ำ = 0</code>",
            "ถ้าต้องการแจก '1 ชิ้น ต่อ 1 บิลเท่านั้น' ให้ตั้งค่า <code>สูงสุดต่อบิล = 1</code>",
            "ใช้โควต้าร่วมกับระยะเวลา เพื่อจัดแคมเปญแบบ Flash Sale (เช่น แจก 50 ชิ้น เฉพาะวันที่ 1-3)"
          ],
          expectedResults: "เมื่อลูกค้ามียอดซื้อและคุณสมบัติตรงตามที่ตั้งไว้ ระบบจะบันทึกของแถมลงในบิลนั้นอัตโนมัติ และจะตัดโควต้าลงทีละ 1 (ถ้ามีการตั้งโควต้าไว้)"
        }}
      />
    </div>
  );
}