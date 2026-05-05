import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, Image as ImageIcon } from 'lucide-react';

export default function PaymentUploader({ onUpload }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      if (onUpload) onUpload(selected);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <UploadCloud className="w-5 h-5 text-blue-500" />
        แนบหลักฐานการโอนเงิน
      </h3>
      
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-6 cursor-pointer hover:bg-gray-50 transition-colors">
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Slip preview" className="h-40 object-contain rounded-lg shadow-sm" />
            <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-1 shadow-md">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-gray-500">
            <ImageIcon className="w-10 h-10 mb-3 text-gray-400" />
            <span className="font-semibold text-gray-700">คลิกที่นี่เพื่ออัปโหลดสลิป</span>
            <span className="text-xs mt-1">รองรับ JPG, PNG (ขนาดไม่เกิน 5MB)</span>
          </div>
        )}
        <input 
          type="file" 
          className="hidden" 
          accept="image/jpeg, image/png, image/jpg" 
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}