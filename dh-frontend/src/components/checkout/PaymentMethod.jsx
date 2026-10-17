import { useState, useEffect } from 'react';
import { CreditCard, Upload, CheckCircle2, Copy, Image as ImageIcon, AlertCircle, X, Check, QrCode } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { formatCredit } from '../../firebase/creditService';
import { storefrontSettingsService, DEFAULT_PAYMENT_CONFIG } from '../../firebase/storefrontSettingsService';
import bayAccountCardImg from '../../assets/bay_account_card.png';

export default function PaymentMethod({ orderMode = 'retail', onSlipChange, slipUrl, calculatedNetTotal }) {
  const { totals } = useCart();
  
  const [copied, setCopied] = useState(false);
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [paymentConfig, setPaymentConfig] = useState(DEFAULT_PAYMENT_CONFIG);

  // 🔄 โหลดการตั้งค่าบัญชีธนาคารจาก Backoffice (มีแคช 15 นาที)
  useEffect(() => {
    let isMounted = true;
    const loadPaymentConfig = async () => {
      try {
        const config = await storefrontSettingsService.getPaymentConfig();
        if (isMounted && config) {
          setPaymentConfig(config);
        }
      } catch (e) {
        console.warn("Failed to load payment config, fallback to default:", e);
      }
    };
    loadPaymentConfig();
    return () => { isMounted = false; };
  }, []);

  // ♻️ ซิงค์ URL หากมีการอัปโหลดสลิปค้างไว้ (กรณีพับ Accordion แล้วเปิดใหม่)
  useEffect(() => {
    if (slipUrl) {
      if (typeof slipUrl === 'object' && slipUrl instanceof File) {
        const url = URL.createObjectURL(slipUrl);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } else if (typeof slipUrl === 'string') {
        setPreviewUrl(slipUrl);
      }
    } else {
      setPreviewUrl(null);
    }
  }, [slipUrl]);

  // 🪄 UX: ฟังก์ชันคัดลอกเลขบัญชีแบบ One-Click
  const handleCopy = (customText) => {
    const textToCopy = customText || paymentConfig.accountNumber?.replace(/-/g, '') || paymentConfig.accountNumber || '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyPromptPay = () => {
    const textToCopy = paymentConfig.promptPayNumber?.replace(/-/g, '') || paymentConfig.promptPayNumber || '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedPromptPay(true);
      setTimeout(() => setCopiedPromptPay(false), 2000);
    }
  };

  // 🚀 [NEW] ฟังก์ชันบีบอัดรูปภาพอัตโนมัติ
  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // ลดขนาดถ้าภาพใหญ่กว่า maxWidth
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // แปลงเป็น Blob แบบ JPEG เพื่อลดขนาดไฟล์ให้เล็กที่สุด
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file); // หากผิดพลาดให้คืนไฟล์เดิม
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  // 🖼 UX: จัดการการอัปโหลดและสร้าง Preview รูปภาพ
  const handleFileChange = async (e) => {
    setError('');
    let file = e.target.files[0];
    
    if (!file) return;

    // ตรวจสอบประเภทไฟล์เบื้องต้น
    if (!file.type.startsWith('image/')) {
      setError('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (JPG, PNG)');
      return;
    }

    // 🚀 ทำการลดขนาดภาพอัตโนมัติทันที
    const compressedFile = await compressImage(file, 800, 0.7);
    
    // ส่งไฟล์ขึ้นไปให้ Checkout.jsx เตรียมบันทึก (Preview จะจัดการโดย useEffect)
    if (onSlipChange) {
      onSlipChange(compressedFile);
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
      <div className="bg-orange-50 rounded-md p-6 border border-orange-100 animate-in fade-in duration-300">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-md shadow-xs text-orange-500">
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
    <div className="bg-white rounded-md p-6 shadow-xs border border-slate-200 transition-all duration-300 hover:shadow-md font-sarabun">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-600" />
          วิธีการชำระเงิน
        </h2>
      </div>

      <div className="space-y-6">
        {/* เลือกวิธีการชำระเงิน (ตอนนี้ล็อคไว้ที่โอนเงิน แต่ทำ UI เผื่ออนาคต) */}
        <label className="relative flex items-center justify-between p-4 border-2 border-blue-600 bg-blue-50/30 rounded-md cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
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

        {/* บัตรแสดงข้อมูลบัญชีธนาคาร (Solid Dark Theme - High Trust - Sarabun New) */}
        <div className="bg-slate-900 rounded-xl p-5 sm:p-6 text-white shadow-md border border-slate-800 font-sarabun">
          <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-6">
            {/* ภาพกราฟิกบัญชีธนาคาร (รองรับภาพไดนามิก หรือภาพกรุงศรีเริ่มต้น) */}
            <div className="shrink-0 flex items-center justify-center">
              <div className="relative overflow-hidden rounded-xl bg-slate-800/90 p-2 border border-slate-700/60 shadow-md flex items-center justify-center">
                <img 
                  src={paymentConfig.cardImageUrl || bayAccountCardImg} 
                  alt={paymentConfig.bankName || "บัญชีธนาคาร"} 
                  className="w-36 sm:w-40 md:w-44 h-auto object-contain rounded-lg shadow-sm"
                  loading="lazy"
                />
              </div>
            </div>

            {/* รายละเอียดบัญชีและการคัดลอก */}
            <div className="flex-1 flex flex-col justify-between min-w-0 w-full space-y-3.5">
              {/* ส่วนหัวธนาคารและชื่อบัญชี */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 text-shadow-sm">
                      {paymentConfig.bankShort || 'กรุงศรี'} ({paymentConfig.bankCode || 'BAY'})
                    </span>
                    <span className="text-xs text-slate-400 font-medium text-shadow-sm">บัญชีทางการ</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mt-1.5 tracking-wide text-shadow-sm">
                    {paymentConfig.accountName || 'นายเหว่ย ไห'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium text-shadow-sm">
                    {paymentConfig.bankName || 'ธนาคารกรุงศรีอยุธยา (Krungsri)'}
                  </p>
                </div>
              </div>

              {/* กล่องแสดงเลขที่บัญชี + ปุ่มคัดลอก (ไม่มีการตัดคำเด็ดขาด) */}
              <div className="bg-slate-950/95 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider text-shadow-sm">
                    เลขที่บัญชี
                  </span>
                  <button 
                    type="button"
                    onClick={() => handleCopy(paymentConfig.accountNumber)}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 shadow-sm ${
                      copied 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow active:scale-95'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'คัดลอกแล้ว' : 'คัดลอกเลขบัญชี'}
                  </button>
                </div>
                <div className="pt-0.5">
                  <p className="font-mono text-2xl sm:text-3xl font-black text-amber-400 tracking-wider whitespace-nowrap text-shadow-sm select-all">
                    {paymentConfig.accountNumber || '692-1-14458-6'}
                  </p>
                </div>
              </div>

              {/* แสดงพร้อมเพย์ถ้าเปิดใช้งาน */}
              {paymentConfig.enablePromptPay && paymentConfig.promptPayNumber && (
                <div className="bg-slate-950/95 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 text-shadow-sm">
                      <QrCode className="w-3.5 h-3.5 text-amber-400" /> พร้อมเพย์ (PromptPay) {paymentConfig.promptPayName ? `• ${paymentConfig.promptPayName}` : ''}
                    </span>
                    <button 
                      type="button"
                      onClick={handleCopyPromptPay}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all duration-200 ${
                        copiedPromptPay 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {copiedPromptPay ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedPromptPay ? 'คัดลอกแล้ว' : 'คัดลอก'}
                    </button>
                  </div>
                  <div>
                    <p className="font-mono text-xl font-black text-amber-300 tracking-wider whitespace-nowrap text-shadow-sm select-all">
                      {paymentConfig.promptPayNumber}
                    </p>
                  </div>
                </div>
              )}

              {paymentConfig.note && (
                <p className="text-xs text-slate-400 font-medium text-shadow-sm">
                  ℹ️ {paymentConfig.note}
                </p>
              )}
              
              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-sm text-slate-300 font-medium text-shadow-sm">ยอดที่ต้องชำระสุทธิ</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight text-shadow-sm">
                  ฿{formatCredit(calculatedNetTotal !== undefined ? calculatedNetTotal : (totals?.grandTotal || 0))}
                </span>
              </div>
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
              <div className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all rounded-md p-8 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-blue-600">คลิกเพื่ออัปโหลด</span>
                <span className="text-xs text-gray-500">หรือลากไฟล์สลิปมาวางที่นี่ (JPG, PNG)</span>
              </div>
            </div>
          ) : (
            <div className="relative rounded-md overflow-hidden border-2 border-emerald-500 shadow-xs bg-gray-50 flex items-center justify-center p-2 group">
              <img 
                src={previewUrl} 
                alt="Slip Preview" 
                className="max-h-64 object-contain rounded-md"
               loading="lazy" />
              {/* แถบแจ้งเตือนอัปโหลดสำเร็จ */}
              <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md">
                <CheckCircle2 className="w-4 h-4" />
                เตรียมไฟล์สำเร็จ
              </div>
              {/* ปุ่มลบรูป (แสดงชัดเจน) */}
              <button
                type="button"
                onClick={handleRemoveSlip}
                className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/50 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg backdrop-blur-xs transition-colors shadow-md"
                title="อัปโหลดสลิปใบใหม่"
              >
                <X className="w-4 h-4" />
                <span className="text-xs font-bold">ลบและอัปใหม่</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}