import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart'; // 🔧 แก้ไขเส้นทาง Import ให้ถูกต้อง
import { auth } from '../firebase/config';
import { processCheckout, createWholesaleRequest } from '../firebase/checkoutService';
import { Receipt, Info, Package, ArrowRight, AlertCircle, Building2, User, FileText, CheckCircle2 } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  
  // State สำหรับการสั่งซื้อ
  const [orderMode, setOrderMode] = useState('retail'); // 'retail' | 'wholesale'
  const [shippingAddress, setShippingAddress] = useState('');
  
  // State สำหรับใบกำกับภาษี
  const [needTaxInvoice, setNeedTaxInvoice] = useState(false);
  const [taxDetails, setTaxDetails] = useState({
    type: 'company', // 'company' | 'personal'
    name: '',
    taxId: '',
    address: '',
    isHeadOffice: true,
    branchCode: ''
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ย้ายผู้ใช้กลับถ้าไม่มีตะกร้า
  useEffect(() => {
    // ป้องกันการเด้งกลับตอนที่กำลังโหลดข้อมูล
    if (cartItems && cartItems.length === 0 && !loading) {
      navigate('/cart');
    }
  }, [cartItems, navigate, loading]);

  const handleTaxChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTaxDetails(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const isFormValid = () => {
    if (!shippingAddress.trim()) return false;
    if (needTaxInvoice) {
      if (!taxDetails.name.trim() || !taxDetails.address.trim()) return false;
      if (taxDetails.taxId.length !== 13) return false;
      if (!taxDetails.isHeadOffice && !taxDetails.branchCode.trim()) return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      setError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนและถูกต้อง');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("กรุณาเข้าสู่ระบบก่อนทำรายการ");
      }

      // เตรียม Data Payload เพื่อส่งให้ Service
      const orderPayload = {
        items: cartItems,
        totalAmount: cartTotal,
        shippingAddress: shippingAddress,
        taxInvoice: needTaxInvoice ? taxDetails : null,
        createdAt: new Date()
      };

      if (orderMode === 'wholesale') {
        // ดำเนินการส่งคำร้องขอราคาส่ง ไปยัง Todo Task หลังบ้าน
        await createWholesaleRequest(user.uid, orderPayload);
        clearCart();
        navigate('/profile?tab=history', { 
          state: { message: 'ส่งคำร้องขอราคาส่งสำเร็จ กรุณารอเจ้าหน้าที่ประเมินราคา' } 
        });
      } else {
        // ดำเนินการสั่งซื้อปกติ (Retail)
        await processCheckout(user.uid, orderPayload);
        clearCart();
        navigate('/checkout-success');
      }
    } catch (err) {
      console.error("Checkout Error:", err);
      setError(err.message || 'เกิดข้อผิดพลาดในการทำรายการ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CheckCircle2 className="w-8 h-8 text-blue-600" />
          </div>
          ยืนยันการสั่งซื้อ
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ส่วนข้อมูลด้านซ้าย */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. เลือกรูปแบบการสั่งซื้อ (Gimmick) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 overflow-hidden relative group">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-50/50 to-transparent w-32 h-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />
              
              <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                รูปแบบการสั่งซื้อ
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`
                  relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col gap-2 shadow-sm
                  ${orderMode === 'retail' ? 'border-blue-600 bg-blue-50/40 ring-4 ring-blue-600/10' : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50/50'}
                `}>
                  <input 
                    type="radio" 
                    name="orderMode" 
                    value="retail" 
                    className="sr-only"
                    checked={orderMode === 'retail'}
                    onChange={() => setOrderMode('retail')}
                  />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900 text-lg">สั่งซื้อปกติ</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${orderMode === 'retail' ? 'border-blue-600' : 'border-gray-300'}`}>
                      {orderMode === 'retail' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">ชำระเงินทันที พร้อมรับของแถมและโปรโมชั่น</p>
                </label>

                <label className={`
                  relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col gap-2 shadow-sm
                  ${orderMode === 'wholesale' ? 'border-orange-500 bg-orange-50/40 ring-4 ring-orange-500/10' : 'border-gray-200 hover:border-orange-300 bg-white hover:bg-gray-50/50'}
                `}>
                  <input 
                    type="radio" 
                    name="orderMode" 
                    value="wholesale" 
                    className="sr-only"
                    checked={orderMode === 'wholesale'}
                    onChange={() => setOrderMode('wholesale')}
                  />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900 text-lg">ขอราคาส่ง</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${orderMode === 'wholesale' ? 'border-orange-500' : 'border-gray-300'}`}>
                      {orderMode === 'wholesale' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">สำหรับยอดสั่งซื้อจำนวนมาก รอประเมินราคาพิเศษ</p>
                  
                  {/* Gimmick Badge */}
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg animate-bounce">
                    คุ้มกว่าเมื่อสั่งเยอะ!
                  </div>
                </label>
              </div>

              {/* คำแนะนำสำหรับราคาส่ง */}
              {orderMode === 'wholesale' && (
                <div className="mt-5 flex items-start gap-3 bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100 animate-in slide-in-from-top-2 fade-in duration-300">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-orange-600" />
                  <p className="text-orange-800 text-sm leading-relaxed">
                    ระบบจะส่งรายการสินค้านี้ไปให้เจ้าหน้าที่พิจารณาส่วนลดพิเศษ 
                    คุณจะได้รับบิลแจ้งราคาในภายหลังผ่านเมนู <strong>"ประวัติการสั่งซื้อ"</strong> และสามารถชำระเงินได้หลังจากยืนยันราคาแล้ว
                  </p>
                </div>
              )}
            </div>

            {/* 2. ข้อมูลจัดส่ง */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-600" />
                ที่อยู่จัดส่ง
              </h2>
              <textarea
                required
                rows="3"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="บ้านเลขที่, ซอย, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none shadow-inner"
              />
            </div>

            {/* 3. ขอใบกำกับภาษี */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 overflow-hidden transition-all duration-500">
              <label className="flex items-center gap-3 cursor-pointer group w-fit">
                <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all shadow-sm
                  ${needTaxInvoice ? 'bg-blue-600 border-blue-600 scale-105' : 'border-gray-300 group-hover:border-blue-400'}
                `}>
                  {needTaxInvoice && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="sr-only"
                  checked={needTaxInvoice}
                  onChange={(e) => setNeedTaxInvoice(e.target.checked)}
                />
                <span className="text-xl font-bold text-gray-800 flex items-center gap-2 select-none">
                  <Receipt className="w-5 h-5 text-gray-600" />
                  ขอใบกำกับภาษี
                </span>
              </label>

              {/* Form ใบกำกับภาษี (Expandable) */}
              <div className={`grid transition-all duration-500 ease-in-out ${needTaxInvoice ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                <div className="overflow-hidden">
                  <div className="space-y-5 p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
                    
                    <div className="flex gap-6 mb-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="type" value="company" checked={taxDetails.type === 'company'} onChange={handleTaxChange} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors"><Building2 className="w-4 h-4"/> นิติบุคคล</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="type" value="personal" checked={taxDetails.type === 'personal'} onChange={handleTaxChange} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors"><User className="w-4 h-4"/> บุคคลธรรมดา</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">
                          ชื่อ{taxDetails.type === 'company' ? 'บริษัท' : ' - นามสกุล'}
                        </label>
                        <input type="text" name="name" value={taxDetails.name} onChange={handleTaxChange}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" required={needTaxInvoice} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">เลขประจำตัวผู้เสียภาษี (13 หลัก)</label>
                        <input type="text" name="taxId" value={taxDetails.taxId} onChange={handleTaxChange} maxLength="13"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow font-mono" 
                          placeholder="xxxxxxxxxxxxx" required={needTaxInvoice} />
                        {taxDetails.taxId && taxDetails.taxId.length !== 13 && (
                          <p className="text-xs text-red-500 mt-1.5 font-medium animate-pulse">กรุณากรอกให้ครบ 13 หลัก</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">ที่อยู่จดทะเบียน</label>
                      <input type="text" name="address" value={taxDetails.address} onChange={handleTaxChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" required={needTaxInvoice} />
                    </div>

                    {taxDetails.type === 'company' && (
                      <div className="flex flex-wrap items-end gap-6 bg-white p-4 rounded-lg border border-gray-200">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input type="checkbox" name="isHeadOffice" checked={taxDetails.isHeadOffice} onChange={handleTaxChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm font-bold text-gray-700">สำนักงานใหญ่</span>
                        </label>
                        
                        {!taxDetails.isHeadOffice && (
                          <div className="flex-1 min-w-[200px] animate-in slide-in-from-left-2 fade-in duration-300">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">รหัสสาขา</label>
                            <input type="text" name="branchCode" value={taxDetails.branchCode} onChange={handleTaxChange} placeholder="เช่น 00001"
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow font-mono" required={!taxDetails.isHeadOffice} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ส่วนสรุปยอดสั่งซื้อ (ด้านขวา) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 sticky top-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                สรุปคำสั่งซื้อ
              </h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>จำนวนสินค้าทั้งหมด</span>
                  <span className="font-bold text-gray-900">{cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0} ชิ้น</span>
                </div>
                
                {/* ยอดรวมเบื้องต้น */}
                <div className="flex justify-between items-end pt-5 border-t-2 border-gray-100 border-dashed">
                  <span className="font-bold text-gray-800 text-lg">ยอดรวมทั้งสิ้น</span>
                  <div className="text-right">
                    <span className={`text-3xl font-black ${orderMode === 'wholesale' ? 'text-gray-400 line-through' : 'text-blue-600'}`}>
                      ฿{(cartTotal || 0).toLocaleString()}
                    </span>
                    {orderMode === 'wholesale' && (
                      <p className="text-sm text-orange-500 mt-1 font-bold animate-pulse">รอพิจารณาส่วนลด</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button (เปลี่ยนหน้าตาตามประเภทงาน) */}
              <button
                type="submit"
                disabled={loading || !isFormValid() || cartItems?.length === 0}
                className={`
                  w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none hover:-translate-y-0.5
                  ${orderMode === 'wholesale' 
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'}
                `}
              >
                {loading ? (
                  <span className="animate-pulse flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังดำเนินการ...
                  </span>
                ) : (
                  <>
                    {orderMode === 'wholesale' ? 'ส่งคำร้องขอราคาส่ง' : 'ชำระเงิน'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center gap-6 text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1.5"><ShieldCheckIcon className="w-4 h-4 text-emerald-500"/> ปลอดภัย 100%</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-blue-500"/> การันตีของแท้</span>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

// Icon เพิ่มเติม
function ShieldCheckIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}