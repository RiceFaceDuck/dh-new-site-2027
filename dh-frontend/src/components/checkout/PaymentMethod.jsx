import React, { useState } from 'react';
import { CreditCard, Upload, CheckCircle2, Copy, Image as ImageIcon, AlertCircle, X, Check } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

export default function PaymentMethod({ orderMode = 'retail', onSlipChange }) {
  const { totals } = useCart();
  
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');

  // 🪄 UX: ฟังก์ชันคัดลอกเลขบัญชีแบบ One-Click
  const handleCopy = () => {
    navigator.clipboard.writeText('1234567890'); // เปลี่ยนเป็นเลขบัญชีจริงของ DH Notebook
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 🖼 UX: จัดการการอัปโหลดและสร้าง Preview รูปภาพ
  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files[0];
    
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      setError('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (JPG, PNG)');
      return;
    }

    // ตรวจสอบขนาดไฟล์ (จำกัดที่ 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('ขนาดไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
      return;
    }

    // สร้าง URL สำหรับ Preview รูป
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
    
    // ส่งไฟล์ขึ้นไปให้ Checkout.jsx เตรียมบันทึก
    if (onSlipChange) {
      onSlipChange(file);
    }
  };

  const handleRemoveSlip = () => {
    setPreviewUrl(null);
    setError('');
    if (onSlipChange) {
      onSlipChange(null);
    }
    // Reset file input
    const fileInput = document.getElementById('slip-upload');
    if (fileInput) fileInput.value = '';
  };

  // 📦 โหมดขอราคาส่ง: ไม่ต้องแสดงฟอร์มชำระเงิน
  if (orderMode === 'wholesale') {
    return (
      <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100 animate-in fade-in duration-300">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm text-orange-500">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">ยังไม่ต้องชำระเงินในขั้นตอนนี้</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              สำหรับลูกค้าที่ขอราคาส่ง ระบบจะส่งข้อมูลไปให้เจ้าหน้าที่ประเมินราคาสุทธิก่อน 
              เมื่อแอดมินยืนยันแล้ว ท่านสามารถเข้ามาตรวจสอบราคาและชำระเงินได้ที่เมนู "ประวัติการสั่งซื้อ"
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 🛒 โหมดสั่งซื้อปกติ
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-600" />
          วิธีการชำระเงิน
        </h2>
      </div>

      <div className="space-y-6">
        {/* เลือกวิธีการชำระเงิน (ตอนนี้ล็อคไว้ที่โอนเงิน แต่ทำ UI เผื่ออนาคต) */}
        <label className="relative flex items-center justify-between p-4 border-2 border-blue-600 bg-blue-50/30 rounded-2xl cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-bold text-gray-900">โอนเงินผ่านธนาคาร</span>
              <span className="block text-xs text-gray-500 mt-0.5">อัปโหลดสลิปหลักฐานการโอนเงิน</span>
            </div>
          </div>
          <div className="w-5 h-5 rounded-full border-2 border-blue-600 bg-blue-600 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
        </label>

        {/* บัตรแสดงข้อมูลบัญชีธนาคาร (Bank Account Card) */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-gray-400 text-xs font-medium mb-1">ธนาคารกสิกรไทย (KBANK)</p>
                <p className="font-bold text-lg">บริษัท ดีดี ดาต้า ไอที จำกัด</p>
              </div>
              {/* โลโก้ธนาคาร (จำลองด้วยสีเขียว) */}
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="font-black text-white text-lg">K</span>
              </div>
            </div>

            <div className="flex items-end justify-between bg-black/20 p-3 rounded-xl backdrop-blur-sm border border-white/10">
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">เลขที่บัญชี</p>
                <p className="font-mono text-xl tracking-widest font-medium">123-4-56789-0</p>
              </div>
              <button 
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-sm text-gray-300">ยอดที่ต้องชำระสุทธิ</span>
              <span className="text-2xl font-black text-emerald-400">
                ฿{(totals?.grandTotal || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ส่วนอัปโหลดสลิป (Upload Zone) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            แนบหลักฐานการโอนเงิน (สลิป) <span className="text-red-500">*</span>
          </label>
          
          {error && (
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {!previewUrl ? (
            <div className="relative">
              <input 
                type="file" 
                id="slip-upload"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-blue-600">คลิกเพื่ออัปโหลด</span>
                <span className="text-xs text-gray-500">หรือลากไฟล์สลิปมาวางที่นี่ (JPG, PNG)</span>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-sm bg-gray-50 flex items-center justify-center p-2 group">
              <img 
                src={previewUrl} 
                alt="Slip Preview" 
                className="max-h-64 object-contain rounded-xl"
              />
              {/* แถบแจ้งเตือนอัปโหลดสำเร็จ */}
              <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md">
                <CheckCircle2 className="w-4 h-4" />
                เตรียมไฟล์สำเร็จ
              </div>
              {/* ปุ่มลบรูปลอยขึ้นมาเมื่อ Hover */}
              <button
                type="button"
                onClick={handleRemoveSlip}
                className="absolute top-4 right-4 bg-black/50 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur-sm transition-colors shadow-md opacity-0 group-hover:opacity-100"
                title="ลบรูปภาพ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}