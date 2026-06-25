import React, { useState } from 'react';
import { Truck, AlertCircle } from 'lucide-react';
import { useShippingManagement } from './hooks/useShippingManagement';
import ShippingRuleForm from './components/ShippingRuleForm';
import ShippingRuleList from './components/ShippingRuleList';
import GuideModal from '../../../../components/common/GuideModal';

export default function ShippingManagement() {
  const {
    rules,
    loading,
    form,
    setForm,
    isProcessing,
    handleSaveRule,
    toggleActive,
    deleteRule
  } = useShippingManagement();

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
               <Truck size={20} />
            </div>
            จัดการเงื่อนไขค่าจัดส่ง (Shipping Rules)
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            ตั้งค่าเรทราคาจัดส่งอัตโนมัติ เพื่อให้หน้าจอพนักงานขายประเมินราคาได้ทันที
          </p>
        </div>
        
        <button 
            onClick={() => setIsGuideOpen(true)} 
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-200 shadow-sm dh-active-press shrink-0"
        >
            <AlertCircle size={16} /> คู่มือการใช้งาน
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-1">
          <ShippingRuleForm 
            form={form} 
            setForm={setForm} 
            handleSaveRule={handleSaveRule} 
            isProcessing={isProcessing} 
          />
        </div>

        <div className="lg:col-span-2">
          <ShippingRuleList 
            rules={rules} 
            loading={loading} 
            toggleActive={toggleActive} 
            deleteRule={deleteRule} 
          />
        </div>

      </div>

      <GuideModal 
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="คู่มือ: จัดการเงื่อนไขค่าจัดส่ง"
        icon={Truck}
        config={{
            description: "หน้าจอนี้ใช้สำหรับกำหนดกฎเกณฑ์ค่าจัดส่งสินค้า โดยระบบจะนำไปคำนวณในหน้าตะกร้าสินค้า (Checkout) ให้อัตโนมัติ",
            howTo: [
                "<strong>เพิ่มเงื่อนไข:</strong> เลือกบริษัทขนส่ง, ประเภทสินค้า, จำนวนชิ้นขั้นต่ำ-สูงสุด, และระบุค่าส่ง จากนั้นกดบันทึก",
                "<strong>เปิด/ปิด:</strong> สามารถใช้ปุ่ม ปิด/เปิดใช้ เพื่อระงับการใช้งานเงื่อนไขนั้นชั่วคราวได้โดยไม่ต้องลบ",
                "<strong>การลบ:</strong> กดรูปถังขยะเพื่อลบเงื่อนไขทิ้งอย่างถาวร (จะถูกบันทึกลงใน History Log เพื่อตรวจสอบด้วย)"
            ],
            tips: [
                "กฎจะถูกเรียงลำดับความสำคัญโดยอิงจาก จำนวนชิ้นที่น้อยกว่า จะถูกนำมาพิจารณาก่อน",
                "หากต้องการตั้งค่าให้สินค้าชิ้นที่ 6 ขึ้นไปคิดราคาเหมา ให้ตั้งค่า จำนวนสูงสุด เป็นตัวเลขเยอะๆ (เช่น 9999)"
            ],
            expectedResults: "เมื่อลูกค้ากดสั่งซื้อหรือพนักงานสร้างบิล ระบบจะค้นหาบริษัทจัดส่งและจำนวนชิ้นที่ตรงตามเงื่อนไขนี้ และบวกค่าจัดส่งเข้าไปในบิลอัตโนมัติ"
        }}
      />
    </div>
  );
}
