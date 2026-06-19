import React from 'react';
import { Store, Filter, Loader2 } from 'lucide-react';
import { usePartnerSettings } from './hooks/usePartnerSettings';
import PartnerControls from './components/partners/PartnerControls';
import PartnerCard from './components/partners/PartnerCard';
import GuideModal from '../../components/common/GuideModal';

export default function PartnerSettings() {
  const {
    partners,
    filteredPartners,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    actionLoading,
    togglePartnerStatus,
    togglePartnerVerification
  } = usePartnerSettings();

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Store className="text-[#0870B8]" />
            จัดการตัวแทนพาร์ทเนอร์ (Partner Directory)
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-slate-500">ดูรายชื่อและบริหารจัดการร้านค้าพาร์ทเนอร์ที่เปิดรับการสนับสนุน</p>
            <button onClick={() => setIsGuideOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 shadow-sm dh-active-press">
              <Store size={14} /> คู่มือการใช้งาน
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-center px-3 border-r border-slate-100">
             <div className="text-lg font-black text-[#0870B8]">{partners.length}</div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ทั้งหมด</div>
           </div>
           <div className="text-center px-3">
             <div className="text-lg font-black text-emerald-500">{partners.filter(p => p.isActive).length}</div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">เปิดใช้งาน</div>
           </div>
        </div>
      </div>

      <PartnerControls 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        statusFilter={statusFilter} 
        setStatusFilter={setStatusFilter} 
      />

      {/* รายการพาร์ทเนอร์ */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-[#0870B8] w-8 h-8 mb-4" />
          <span className="text-slate-500 font-bold tracking-widest uppercase font-tech">Loading Directory...</span>
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <Filter className="text-slate-300 w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">ไม่พบข้อมูลพาร์ทเนอร์</h3>
          <p className="text-slate-500 mt-1 text-sm">ไม่มีพาร์ทเนอร์ที่ตรงกับเงื่อนไขการค้นหาของคุณ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => (
            <PartnerCard 
              key={partner.id} 
              partner={partner} 
              togglePartnerStatus={togglePartnerStatus} 
              togglePartnerVerification={togglePartnerVerification} 
              actionLoading={actionLoading} 
            />
          ))}
        </div>
      )}

      <GuideModal 
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="คู่มือ: จัดการตัวแทนพาร์ทเนอร์ (Partner Directory)"
        config={{
          description: "ระบบสำหรับบริหารจัดการร้านค้าตัวแทนพาร์ทเนอร์ เพื่อดูรายละเอียดการติดต่อและตัดสินใจระงับ/เปิดใช้งานบัญชีพาร์ทเนอร์",
          howTo: [
            "<strong>การค้นหา:</strong> พิมพ์ชื่อร้าน ชื่อผู้ติดต่อ หรืออีเมลในช่องค้นหา ระบบจะกรองแบบเรียลไทม์",
            "<strong>การระงับพาร์ทเนอร์:</strong> หากพาร์ทเนอร์ทำผิดเงื่อนไข คุณสามารถกดปุ่ม <code>ระงับพาร์ทเนอร์</code> เพื่อตัดสิทธิ์ชั่วคราว การ์ดจะเปลี่ยนเป็นสีแดง",
            "<strong>การให้ Verification Badge:</strong> กดยกเลิกหรือมอบ Badge ให้พาร์ทเนอร์เพื่อใช้ยืนยันความน่าเชื่อถือในระบบตัวแทน"
          ],
          tips: [
            "คุณสามารถตรวจสอบพิกัดหน้าร้านของพาร์ทเนอร์ได้โดยคลิกปุ่ม <code>ตรวจสอบพิกัดแผนที่</code> เพื่อเปิด Google Maps",
            "การให้ <strong>Verification Badge</strong> (ติ๊กถูกสีฟ้า) จะช่วยสร้างความมั่นใจให้ลูกค้าที่มาซื้อของผ่านพาร์ทเนอร์"
          ],
          expectedResults: "การระงับพาร์ทเนอร์จะทำให้พาร์ทเนอร์ไม่สามารถเข้าถึงสิทธิพิเศษบางอย่างหรือได้รับบิลในนามพาร์ทเนอร์ได้ จนกว่าจะได้รับการ <code>เปิดใช้งานอีกครั้ง</code>"
        }}
      />
    </div>
  );
}