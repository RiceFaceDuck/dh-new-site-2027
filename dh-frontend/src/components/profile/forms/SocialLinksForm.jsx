import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { MessageCircle, Facebook, MessageSquare, Youtube, Globe, Save, CheckCircle2, AlertCircle, Loader2, Link2 } from 'lucide-react';

export default function SocialLinksForm({ user, initialData, onRefresh }) {
  const [formData, setFormData] = useState({
    lineId: '',
    facebookUrl: '',
    messengerUrl: '',
    youtubeUrl: '',
    storeWebsite: '',
    otherSocial: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    if (initialData) {
      setFormData({
        lineId: initialData.lineId || '',
        facebookUrl: initialData.facebookUrl || '',
        messengerUrl: initialData.messengerUrl || '',
        youtubeUrl: initialData.youtubeUrl || '',
        storeWebsite: initialData.storeWebsite || '',
        otherSocial: initialData.otherSocial || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);
      
      // บันทึกเฉพาะข้อมูล Social Links (merge: true สำคัญมาก เพื่อไม่ให้ข้อมูลส่วนอื่นพัง)
      await setDoc(userRef, {
        lineId: formData.lineId,
        facebookUrl: formData.facebookUrl,
        messengerUrl: formData.messengerUrl,
        youtubeUrl: formData.youtubeUrl,
        storeWebsite: formData.storeWebsite,
        otherSocial: formData.otherSocial,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      setStatus({ type: 'success', message: 'บันทึกช่องทางการติดต่อเรียบร้อยแล้ว' });
      
      if (onRefresh) onRefresh();

      setTimeout(() => setStatus({ type: '', message: '' }), 3000);

    } catch (error) {
      console.error("Error saving social links:", error);
      setStatus({ type: 'error', message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง' });
    } finally {
      setIsSaving(false);
    }
  };

  // ตรวจสอบว่ามีการเปลี่ยนแปลงข้อมูลหรือไม่ เพื่อเปิด/ปิดปุ่ม Save
  const hasChanges = () => {
    if (!initialData) return true;
    return (
      formData.lineId !== (initialData.lineId || '') ||
      formData.facebookUrl !== (initialData.facebookUrl || '') ||
      formData.messengerUrl !== (initialData.messengerUrl || '') ||
      formData.youtubeUrl !== (initialData.youtubeUrl || '') ||
      formData.storeWebsite !== (initialData.storeWebsite || '') ||
      formData.otherSocial !== (initialData.otherSocial || '')
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg text-green-600">
            <Link2 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">ช่องทางการติดต่อและโซเชียลมีเดีย</h3>
        </div>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Line ID */}
          <div className="space-y-2">
            <label htmlFor="lineId" className="block text-sm font-medium text-gray-700">
              Line ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MessageCircle className="h-5 w-5 text-green-500" />
              </div>
              <input
                type="text"
                id="lineId"
                name="lineId"
                value={formData.lineId}
                onChange={handleChange}
                placeholder="ระบุ Line ID สำหรับติดต่อ"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-colors text-sm text-gray-800"
              />
            </div>
          </div>

          {/* Facebook */}
          <div className="space-y-2">
            <label htmlFor="facebookUrl" className="block text-sm font-medium text-gray-700">
              Facebook (ลิงก์โปรไฟล์ หรือ เพจ)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Facebook className="h-5 w-5 text-blue-600" />
              </div>
              <input
                type="url"
                id="facebookUrl"
                name="facebookUrl"
                value={formData.facebookUrl}
                onChange={handleChange}
                placeholder="https://facebook.com/..."
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors text-sm text-gray-800"
              />
            </div>
          </div>

          {/* Messenger */}
          <div className="space-y-2">
            <label htmlFor="messengerUrl" className="block text-sm font-medium text-gray-700">
              ลิงก์ Messenger (m.me/...)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <input
                type="url"
                id="messengerUrl"
                name="messengerUrl"
                value={formData.messengerUrl}
                onChange={handleChange}
                placeholder="https://m.me/..."
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors text-sm text-gray-800"
              />
            </div>
          </div>

          {/* YouTube */}
          <div className="space-y-2">
            <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700">
              ช่อง YouTube
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Youtube className="h-5 w-5 text-red-600" />
              </div>
              <input
                type="url"
                id="youtubeUrl"
                name="youtubeUrl"
                value={formData.youtubeUrl}
                onChange={handleChange}
                placeholder="https://youtube.com/@..."
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-colors text-sm text-gray-800"
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <label htmlFor="storeWebsite" className="block text-sm font-medium text-gray-700">
              เว็บไซต์ร้านค้า
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="url"
                id="storeWebsite"
                name="storeWebsite"
                value={formData.storeWebsite}
                onChange={handleChange}
                placeholder="https://www.yourstore.com"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-100 focus:border-gray-500 transition-colors text-sm text-gray-800"
              />
            </div>
          </div>

          {/* Other Social */}
          <div className="space-y-2">
            <label htmlFor="otherSocial" className="block text-sm font-medium text-gray-700">
              ช่องทางอื่นๆ (เช่น Instagram, Tiktok, Shopee)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 pointer-events-none">
                <Link2 className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="otherSocial"
                name="otherSocial"
                value={formData.otherSocial}
                onChange={handleChange}
                rows={2}
                placeholder="ระบุลิงก์หรือข้อมูลช่องทางอื่นๆ ที่ต้องการให้ลูกค้าทราบ..."
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-[#0870B8] transition-colors text-sm text-gray-800 resize-none"
              />
            </div>
          </div>
          
        </div>

        {/* Status Messages */}
        {status.message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm animate-fade-in ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="font-medium">{status.message}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="pt-4 border-t border-gray-50 flex justify-end">
          <button
            type="submit"
            disabled={isSaving || !hasChanges()}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0870B8] hover:bg-[#065a96] text-white font-medium rounded-xl transition-all duration-300 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                บันทึกช่องทางติดต่อ
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}