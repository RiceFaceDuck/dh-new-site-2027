import { useState, useRef } from 'react';
import { Building2, CreditCard, Save, Loader2, Sparkles, AlertCircle, Upload, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { driveService } from '../../../../firebase/driveService';
import { toast } from 'react-hot-toast';
import bayAccountCardImg from '../../../../assets/bay_account_card.png';

export default function PaymentForm({ settings, updateSettings, saveSettings, isSaving }) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const uploadedUrl = await driveService.uploadImage(file);
      updateSettings('cardImageUrl', uploadedUrl);
      toast.success("อัปโหลดรูปภาพบัตรบัญชีเรียบร้อยแล้ว");
    } catch (error) {
      console.error("🔥 Error uploading payment card image:", error);
      toast.error("อัปโหลดรูปภาพล้มเหลว กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResetImage = () => {
    updateSettings('cardImageUrl', '');
    toast.success("คืนค่าเป็นรูปภาพบัตรเริ่มต้นเรียบร้อยแล้ว");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveSettings();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Hidden file input for card image */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* 💳 Live Preview of the Bank Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            ตัวอย่างการแสดงผลบนหน้าเว็บลูกค้า (Live Preview)
          </h2>
          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
            {settings.bankShort || 'ธนาคาร'}
          </span>
        </div>

        {/* Card Mockup matching storefront style (Solid Dark Theme - High Trust) */}
        <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-4">
            {/* Cropped / Custom Image */}
            <div className="shrink-0 flex items-center justify-center">
              <div 
                onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                className="relative group cursor-pointer rounded-lg bg-slate-800/80 p-1.5 border border-slate-700/60 shadow-inner overflow-hidden"
                title="คลิกเพื่อเปลี่ยนหรืออัปโหลดรูปภาพใหม่"
              >
                <img 
                  src={settings.cardImageUrl || bayAccountCardImg} 
                  alt={settings.bankName || "บัญชีธนาคาร"} 
                  className="w-36 h-auto object-contain rounded-md transition-opacity group-hover:opacity-60"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-center p-2">
                  <Upload size={22} className="mb-1 text-amber-400" />
                  <span className="text-[11px] font-bold text-amber-200">คลิกเปลี่ยนภาพ</span>
                </div>
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-slate-900/85 flex flex-col items-center justify-center text-amber-400">
                    <Loader2 size={24} className="animate-spin mb-1 text-amber-400" />
                    <span className="text-[10px] font-bold text-white">กำลังอัปโหลด...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-between space-y-2 min-w-0 w-full">
              <div className="border-b border-slate-800 pb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {settings.bankShort || 'กรุงศรี'} ({settings.bankCode || 'BAY'})
                </span>
                <p className="text-base font-bold text-white mt-1 truncate">{settings.accountName || 'ชื่อบัญชี'}</p>
                <p className="text-xs text-slate-400 truncate">{settings.bankName || 'ธนาคาร'}</p>
              </div>

              <div className="bg-slate-950/90 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">เลขที่บัญชี</span>
                  <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md">
                    คัดลอกเลขบัญชี
                  </span>
                </div>
                <div>
                  <p className="font-mono text-xl font-black text-amber-400 tracking-wider whitespace-nowrap select-all">
                    {settings.accountNumber || 'XXX-X-XXXXX-X'}
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-slate-400">
                ℹ️ {settings.note || 'กรุณาตรวจสอบยอดเงินและชื่อบัญชีให้ถูกต้อง'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ⚙️ Configuration Fields */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700 space-y-5">
        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          ข้อมูลบัญชีธนาคารหลัก (Default Account)
        </h2>

        {/* 🖼️ Card Image Management */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                รูปภาพการ์ดบัญชีธนาคาร (Card Graphic Image)
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                อัปโหลดรูปภาพใหม่เพื่อเปลี่ยนภาพที่แสดงใน Live Preview และหน้าชำระเงินของลูกค้า
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isUploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                <span>{isUploadingImage ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพใหม่'}</span>
              </button>

              {settings.cardImageUrl && (
                <button
                  type="button"
                  onClick={handleResetImage}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg transition-all active:scale-95 cursor-pointer"
                  title="คืนค่าเป็นรูปการ์ดกรุงศรีเริ่มต้น"
                >
                  <RotateCcw size={14} />
                  <span>ใช้รูปเริ่มต้น</span>
                </button>
              )}
            </div>
          </div>

          <div>
            <input 
              type="text" 
              value={settings.cardImageUrl || ''} 
              onChange={(e) => updateSettings('cardImageUrl', e.target.value)}
              placeholder="หรือวาง URL รูปภาพที่นี่ (เช่น https://... หรือปล่อยว่างเพื่อใช้ภาพเริ่มต้น)"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ชื่อธนาคารทางการ *
            </label>
            <input 
              type="text" 
              value={settings.bankName || ''} 
              onChange={(e) => updateSettings('bankName', e.target.value)}
              placeholder="เช่น ธนาคารกรุงศรีอยุธยา (Krungsri)"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ชื่อย่อธนาคาร / รหัส
            </label>
            <input 
              type="text" 
              value={settings.bankShort || ''} 
              onChange={(e) => updateSettings('bankShort', e.target.value)}
              placeholder="เช่น กรุงศรี หรือ BAY"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              เลขที่บัญชีธนาคาร *
            </label>
            <input 
              type="text" 
              value={settings.accountNumber || ''} 
              onChange={(e) => updateSettings('accountNumber', e.target.value)}
              placeholder="เช่น 692-1-14458-6"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ชื่อบัญชี (ผู้รับโอน) *
            </label>
            <input 
              type="text" 
              value={settings.accountName || ''} 
              onChange={(e) => updateSettings('accountName', e.target.value)}
              placeholder="เช่น นายเหว่ย ไห"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            คำแนะนำสำหรับลูกค้า
          </label>
          <input 
            type="text" 
            value={settings.note || ''} 
            onChange={(e) => updateSettings('note', e.target.value)}
            placeholder="เช่น กรุณาตรวจสอบยอดเงินและชื่อบัญชีก่อนโอนเงิน"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
          />
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button 
            type="submit" 
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าบัญชี'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
