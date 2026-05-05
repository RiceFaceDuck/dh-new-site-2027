import React, { useState } from 'react';
import { Camera, Store, User, FileText, CheckCircle2, X, Loader2 } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { driveService } from '../../firebase/driveService';

export default function WholesaleRequestModal({ isOpen, onClose }) {
  const { checkoutState, updateCheckoutConfig } = useCart();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: checkoutState?.addressInfo?.companyName || '',
    fullName: checkoutState?.addressInfo?.fullName || '',
    phone: checkoutState?.addressInfo?.phone || '',
    note: checkoutState?.addressInfo?.note || '',
    storeImage: null
  });

  const [storeImageFile, setStoreImageFile] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'storeImage' && files.length > 0) {
      setStoreImageFile(files[0]);
      setFormData(prev => ({ ...prev, storeImage: URL.createObjectURL(files[0]) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = formData.storeImage;
      if (storeImageFile) {
        imageUrl = await driveService.uploadSlipImage(storeImageFile);
      }
      updateCheckoutConfig({ addressInfo: { ...checkoutState.addressInfo, ...formData, storeImage: imageUrl } });
      onClose();
    } catch (error) {
      console.error("Error uploading store image", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="bg-orange-500 p-4 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Store className="w-6 h-6" /> ขอราคาส่ง (B2B)
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อร้านค้า / ช่าง</label>
              <div className="relative">
                <Store className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text" name="companyName" value={formData.companyName} onChange={handleChange} required
                  className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="เช่น ร้านคอมพิวเตอร์เซอร์วิส"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อผู้ติดต่อ</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                  className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">รูปร้านค้า / นามบัตร (เพื่อประกอบการพิจารณา)</label>
              <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                {formData.storeImage ? (
                  <img src={formData.storeImage} alt="Preview" className="h-32 object-contain rounded" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">คลิกเพื่ออัปโหลดรูปภาพ</span>
                  </>
                )}
                <input type="file" name="storeImage" onChange={handleChange} className="hidden" accept="image/*" />
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">รายละเอียดเพิ่มเติม</label>
              <textarea
                name="note" value={formData.note} onChange={handleChange} rows="3"
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="ระบุความต้องการเพิ่มเติม เช่น ต้องการซื้อไปประกอบขาย..."
              ></textarea>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl disabled:opacity-50">ยกเลิก</button>
            <button type="submit" disabled={loading} className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}