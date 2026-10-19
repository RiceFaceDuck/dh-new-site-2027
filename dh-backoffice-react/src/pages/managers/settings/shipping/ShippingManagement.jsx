import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, AlertCircle, ArrowLeft, Save, Sparkles } from 'lucide-react';
import { useShippingManagement } from './hooks/useShippingManagement';
import ShippingRuleForm from './components/ShippingRuleForm';
import ShippingRuleList from './components/ShippingRuleList';
import GuideModal from '../../../../components/common/GuideModal';

export default function ShippingManagement() {
  const navigate = useNavigate();
  const {
    rules,
    categories,
    loading,
    form,
    setForm,
    isProcessing,
    editingRuleId,
    handleSaveRule,
    handleEditRule,
    handleCancelEdit,
    toggleActive,
    deleteRule,
    handleAddCondition,
    handleRemoveCondition,
    handleConditionChange,
    defaultShippingFee,
    setDefaultShippingFee,
    isSavingDefaultFee,
    handleSaveDefaultFee
  } = useShippingManagement();

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [localDefaultFee, setLocalDefaultFee] = useState(defaultShippingFee);

  // Sync local default fee when loaded from db
  useEffect(() => {
    setLocalDefaultFee(defaultShippingFee);
  }, [defaultShippingFee]);

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
        
        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
          <button 
              onClick={() => navigate('/managers')} 
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shadow-xs dh-active-press shrink-0"
          >
              <ArrowLeft size={16} /> กลับไปแผงควบคุม
          </button>
          <button 
              onClick={() => setIsGuideOpen(true)} 
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-200 shadow-xs dh-active-press shrink-0"
          >
              <AlertCircle size={16} /> คู่มือการใช้งาน
          </button>
        </div>
      </div>

      {/* 📦 การตั้งค่าค่าจัดส่งเริ่มต้น (Default Fallback Fee) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              ค่าจัดส่งเริ่มต้น (Default Shipping Fee)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              หากสินค้าในบิลไม่ตรงกับเงื่อนไขจัดส่งใดๆ เลย ระบบ POS และหน้าเว็บจะคิดค่าส่งเริ่มต้นนี้ให้อัตโนมัติ (ค่าเริ่มต้นแนะนำ: 60 บาท)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex items-center">
            <input 
              type="number"
              min="0"
              value={localDefaultFee}
              onChange={(e) => setLocalDefaultFee(e.target.value)}
              className="w-28 px-3 py-2 text-sm font-black text-right border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              placeholder="60"
            />
            <span className="ml-2 text-sm font-bold text-slate-600">บาท</span>
          </div>
          <button
            onClick={() => handleSaveDefaultFee(localDefaultFee)}
            disabled={isSavingDefaultFee || Number(localDefaultFee) === defaultShippingFee}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Save size={16} /> {isSavingDefaultFee ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-1">
          <ShippingRuleForm 
            form={form} 
            setForm={setForm} 
            categories={categories}
            editingRuleId={editingRuleId}
            handleCancelEdit={handleCancelEdit}
            handleSaveRule={handleSaveRule} 
            isProcessing={isProcessing} 
            handleAddCondition={handleAddCondition}
            handleRemoveCondition={handleRemoveCondition}
            handleConditionChange={handleConditionChange}
          />
        </div>

        <div className="lg:col-span-2">
          <ShippingRuleList 
            rules={rules} 
            loading={loading} 
            editingRuleId={editingRuleId}
            handleEditRule={handleEditRule}
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
