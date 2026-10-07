import { useEffect } from 'react';
import { Truck, Zap, Store, Info, CheckCircle2, PackageSearch } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

// ข้อมูลจำลองสำหรับตัวเลือกการจัดส่ง (อนาคตสามารถดึงจาก Firebase ได้)


export default function ShippingMethod({ orderMode = 'retail', availableRules = [], selectedMethod, onUpdate }) {
  // Mapping ไอคอน
  const getIcon = (type) => {
    switch (type) {
      case 'express': return Zap;
      case 'pickup': return Store;
      default: return Truck;
    }
  };

  const defaultOptions = [
    { id: 'standard', name: 'จัดส่งพัสดุธรรมดา', cost: 50, est: '2-3 วันทำการ', icon: Truck, description: 'จัดส่งโดยบริษัทขนส่งเอกชนชั้นนำ' },
    { id: 'pickup', name: 'รับสินค้าที่สาขา', cost: 0, est: 'พร้อมรับภายใน 2 ชม.', icon: Store, description: 'สาขาเซียร์รังสิต ชั้น 3' }
  ];

  // ถ้ามีกฎจากหลังบ้านใช้หลังบ้านควบคู่กับรับสินค้าหน้าร้าน
  const calculatedOptions = availableRules.map(r => ({
    id: r.company,
    name: `จัดส่งโดย ${r.company}`,
    cost: r.cost || 0,
    est: '2-3 วันทำการ',
    icon: Truck,
    description: `จัดส่งด่วนโดย ${r.company} อ้างอิงตามเงื่อนไขสินค้าที่ตรงเกณฑ์`
  }));

  const shippingOptions = availableRules.length > 0 
    ? [...calculatedOptions, { id: 'pickup', name: 'รับสินค้าที่สาขา', cost: 0, est: 'พร้อมรับภายใน 2 ชม.', icon: Store, description: 'สาขาเซียร์รังสิต ชั้น 3' }]
    : defaultOptions;

  const { checkoutState, updateCheckoutConfig } = useCart();
  
  const currentMethod = checkoutState?.shippingMethod || selectedMethod;

  // ⚡️ Smart Default: ถ้ายังไม่ได้เลือกวิธีจัดส่ง ให้ตั้งค่าเริ่มต้นเป็นตัวเลือกแรกที่มี
  useEffect(() => {
    if (orderMode === 'retail' && !currentMethod && shippingOptions.length > 0) {
      updateCheckoutConfig({ 
        shippingMethod: shippingOptions[0].id, 
        shippingCost: shippingOptions[0].cost 
      });
      if (onUpdate) {
        onUpdate(shippingOptions[0]);
      }
    }
  }, [orderMode, currentMethod, updateCheckoutConfig, shippingOptions, onUpdate]);

  // เมื่อโหมดเปลี่ยนเป็น wholesale ให้บังคับค่าขนส่งเป็น 0 ในระบบ เพื่อรอแอดมินประเมิน
  useEffect(() => {
    if (orderMode === 'wholesale') {
      updateCheckoutConfig({ shippingMethod: 'wholesale_pending', shippingCost: 0 });
      if (onUpdate) {
        onUpdate({ id: 'wholesale_pending', cost: 0 });
      }
    }
  }, [orderMode, updateCheckoutConfig, onUpdate]);

  const handleSelect = (option) => {
    updateCheckoutConfig({ 
      shippingMethod: option.id, 
      shippingCost: option.cost 
    });
    if (onUpdate) {
      onUpdate(option);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 relative overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Decorative Background */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50/50 rounded-full blur-3xl -z-10"></div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Truck className={`w-6 h-6 ${orderMode === 'wholesale' ? 'text-orange-500' : 'text-indigo-600'}`} />
          วิธีการจัดส่งสินค้า
        </h2>
      </div>

      {orderMode === 'wholesale' ? (
        // 📦 UI สำหรับโหมดราคาส่ง
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-xs text-orange-500 shrink-0">
              <PackageSearch className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">รอประเมินค่าจัดส่งโดยเจ้าหน้าที่</h3>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                เนื่องจากคำสั่งซื้อแบบราคาส่ง อาจมีปริมาณและน้ำหนักที่แตกต่างกัน ทางเราจะทำการคำนวณค่าจัดส่งที่คุ้มค่าที่สุด และแจ้งให้ท่านทราบในใบเสนอราคา
              </p>
            </div>
          </div>
        </div>
      ) : (
        // 🛒 UI สำหรับการสั่งซื้อปกติ
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          {shippingOptions.map((option) => {
            const isSelected = currentMethod === option.id;
            const Icon = option.icon;
            
            return (
              <label 
                key={option.id}
                onClick={() => handleSelect(option)}
                className={`
                  relative flex flex-col p-4 rounded-2xl cursor-pointer transition-all duration-200 border-2
                  ${isSelected 
                    ? 'border-indigo-600 bg-indigo-50/30 shadow-xs transform -translate-y-0.5' 
                    : 'border-gray-100 bg-white hover:border-indigo-200 hover:bg-gray-50'
                  }
                `}
              >
                {/* ขวาบนสุด: Check icon */}
                <div className="absolute top-3 right-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>
                </div>

                <div className={`p-2.5 w-fit rounded-xl mb-3 ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <h3 className="font-bold text-gray-900 text-sm mb-1">{option.name}</h3>
                <div className="text-xs text-gray-500 mb-3 flex-1">{option.description}</div>
                
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="font-black text-indigo-600">
                    {option.cost === 0 ? 'ฟรี' : `฿${option.cost}`}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                    {option.est}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {/* Trust Note */}
      {orderMode === 'retail' && (
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
          <p>ระยะเวลาการจัดส่งอาจเปลี่ยนแปลงได้ขึ้นอยู่กับพื้นที่ปลายทาง (ไม่รวมวันอาทิตย์และวันหยุดนักขัตฤกษ์)</p>
        </div>
      )}
    </div>
  );
}