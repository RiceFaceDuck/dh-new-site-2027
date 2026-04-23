import React, { useState, useRef } from 'react';
import { Upload, X, Tag, FileImage, FileText, Image as ImageIcon, Maximize } from 'lucide-react';
import { driveService } from '../../firebase/driveService'; // ✨ เรียกใช้ Service ของบริษัทโดยตรง

const UploadModal = ({ isOpen, onClose, onUpload }) => {
  const [formData, setFormData] = useState({ 
    sku: '', 
    title: '', 
    tags: '', 
    description: '', 
    size: 'thumbnail' // thumbnail | original
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // 🖱️ ระบบจัดการไฟล์ (Drag & Drop)
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  };

  const processFile = (file) => {
    if (!file.type.match('image.*')) return alert('กรุณาเลือกไฟล์รูปภาพเท่านั้นครับ');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 🚀 ระบบประมวลผลการส่งไฟล์ไปยัง Google Drive Service ของบริษัท
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert('กรุณาเลือกไฟล์ หรือลากไฟล์มาวางก่อนครับ');

    setIsUploading(true);

    try {
      // 1. โยนไฟล์ให้ driveService จัดการ Upload และคืนค่าลิงก์กลับมา
      let uploadedUrl = await driveService.uploadImage(selectedFile);

      // 2. ถ้าลูกค้าเลือก "ขนาดจริง" ให้ดัดแปลงลิงก์ Google Drive Thumbnail (sz=w1000 -> sz=s0)
      if (formData.size === 'original') {
        uploadedUrl = uploadedUrl.replace('&sz=w1000', '&sz=s0'); 
      }

      // 3. ส่งข้อมูลภาพที่สมบูรณ์กลับไปให้ GalleryMain จัดการ
      onUpload({
        url: uploadedUrl,
        sku: formData.sku.toUpperCase(),
        title: formData.title || selectedFile.name,
        description: formData.description,
        size: formData.size,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      
      setFormData({ sku: '', title: '', tags: '', description: '', size: 'thumbnail' });
      clearFile();
      onClose();

    } catch (error) {
      console.error("Upload Error:", error);
      alert('เกิดข้อผิดพลาดในการอัปโหลด กรุณาตรวจสอบ Console Log ครับ');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-[var(--dh-bg-base)] rounded-2xl shadow-[0_0_40px_rgba(255,155,81,0.15)] w-full max-w-2xl overflow-hidden flex flex-col border border-[var(--dh-border)] relative">
        
        {/* Fantasy Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--dh-accent)] to-transparent opacity-50"></div>

        <div className="p-4 border-b border-[var(--dh-border)] flex justify-between items-center bg-[var(--dh-bg-surface)]">
          <h2 className="text-xl font-black text-[var(--dh-text-main)] flex items-center gap-2 tracking-tight">
            <Upload size={22} className="text-[var(--dh-accent)]" />
            อัพโหลดภาพ
          </h2>
          <button onClick={onClose} disabled={isUploading} className="p-2 rounded-full text-[var(--dh-text-muted)] hover:bg-[var(--dh-border)] hover:text-[var(--dh-text-main)] transition-colors">
            <X size={20}/>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col md:flex-row gap-6">
          
          {/* ซ้าย: พื้นที่ลากไฟล์วาง (Drag & Drop Zone with Cyber Scan Effect) */}
          <div className="flex-1 flex flex-col gap-4">
            <div 
              className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer h-full min-h-[260px] overflow-hidden group
                ${dragActive ? 'border-[var(--dh-accent)] bg-[var(--dh-accent-light)] scale-[1.02]' : 'border-[var(--dh-border)] bg-[var(--dh-bg-surface)] hover:border-[var(--dh-accent)]/50'}
                ${previewUrl ? 'border-[var(--dh-accent)]/50 p-2 bg-black/5' : 'p-6'}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !previewUrl && fileInputRef.current.click()}
            >
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
              
              {previewUrl ? (
                <div className="relative w-full h-full flex items-center justify-center rounded-lg overflow-hidden">
                  <img src={previewUrl} alt="Preview" className="max-h-[250px] object-contain relative z-10" />
                  
                  {/* ✨ Fantasy Scanner Effect */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--dh-accent)] shadow-[0_0_15px_var(--dh-accent)] z-20 animate-[pulse_1.5s_ease-in-out_infinite] opacity-70"></div>
                  
                  <button type="button" onClick={(e) => { e.stopPropagation(); clearFile(); }} className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full z-30 transition-transform hover:scale-110 shadow-lg">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center pointer-events-none text-center">
                  <div className="p-4 rounded-full bg-[var(--dh-bg-base)] shadow-sm mb-4 group-hover:shadow-[0_0_20px_rgba(255,155,81,0.2)] transition-shadow">
                    <FileImage size={40} className={`transition-colors ${dragActive ? 'text-[var(--dh-accent)]' : 'text-[var(--dh-text-muted)]'}`} />
                  </div>
                  <p className="font-bold text-[var(--dh-text-main)] text-lg mb-1">
                    {dragActive ? 'ปล่อยไฟล์เข้าสู่ระบบ' : 'ลากไฟล์มาวางที่นี่'}
                  </p>
                  <p className="text-xs text-[var(--dh-text-muted)]">หรือคลิกเพื่อเรียกดูไฟล์ (JPG, PNG, WEBP)</p>
                </div>
              )}
            </div>

            {/* Resolution Selector (Thumbnail vs Original) */}
            <div className="bg-[var(--dh-bg-surface)] p-1 rounded-xl flex gap-1 border border-[var(--dh-border)] relative">
              <button 
                type="button" onClick={() => setFormData({...formData, size: 'thumbnail'})}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${formData.size === 'thumbnail' ? 'bg-[var(--dh-bg-base)] shadow text-[var(--dh-accent)]' : 'text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)]'}`}
              >
                <ImageIcon size={14}/> ขนาดเล็ก (โหลดไว)
              </button>
              <button 
                type="button" onClick={() => setFormData({...formData, size: 'original'})}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${formData.size === 'original' ? 'bg-[var(--dh-bg-base)] shadow text-[var(--dh-accent)]' : 'text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)]'}`}
              >
                <Maximize size={14}/> ขนาดจริง (เต็มตา)
              </button>
            </div>
          </div>

          {/* ขวา: ฟอร์มกรอกข้อมูล */}
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--dh-text-muted)] mb-1.5 uppercase tracking-wide">SKU ผูกสินค้าออโต้</label>
              <input 
                type="text" placeholder="เช่น MB-ASUS-123" 
                className="w-full bg-[var(--dh-bg-surface)] border border-[var(--dh-border)] text-[var(--dh-text-main)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--dh-accent)] focus:border-transparent outline-none uppercase transition-all shadow-inner"
                value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[var(--dh-text-muted)] mb-1.5 uppercase tracking-wide">ชื่อภาพ</label>
              <input 
                type="text" placeholder="ตั้งชื่อเพื่อให้ค้นหาง่าย" 
                className="w-full bg-[var(--dh-bg-surface)] border border-[var(--dh-border)] text-[var(--dh-text-main)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--dh-accent)] focus:border-transparent outline-none transition-all shadow-inner"
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--dh-text-muted)] mb-1.5 uppercase tracking-wide flex items-center gap-1">
                <FileText size={12}/> คำอธิบายภาพ (Detail)
              </label>
              <textarea 
                placeholder="ระบุตำหนิ, อาการเสีย, หรือรายละเอียดเพิ่มเติม..." rows="3"
                className="w-full bg-[var(--dh-bg-surface)] border border-[var(--dh-border)] text-[var(--dh-text-main)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--dh-accent)] focus:border-transparent outline-none transition-all shadow-inner resize-none"
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--dh-text-muted)] mb-1.5 uppercase tracking-wide flex items-center gap-1">
                <Tag size={12}/> Tags (คั่นด้วยลูกน้ำ)
              </label>
              <input 
                type="text" placeholder="เช่น มือสอง, เคลม, รอยไหม้" 
                className="w-full bg-[var(--dh-bg-surface)] border border-[var(--dh-border)] text-[var(--dh-text-main)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--dh-accent)] focus:border-transparent outline-none transition-all shadow-inner"
                value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})}
              />
            </div>

            <div className="mt-auto pt-4 flex gap-3">
              <button type="button" onClick={onClose} disabled={isUploading} className="px-6 py-3 border-2 border-[var(--dh-border)] text-[var(--dh-text-muted)] font-bold rounded-xl hover:bg-[var(--dh-bg-surface)] hover:text-[var(--dh-text-main)] transition-colors">
                ยกเลิก
              </button>
              <button type="submit" disabled={isUploading || !selectedFile} className={`flex-1 px-6 py-3 text-white font-bold rounded-xl flex justify-center items-center gap-2 shadow-lg transition-all ${isUploading || !selectedFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-[var(--dh-accent)] hover:brightness-110 hover:-translate-y-0.5 shadow-[var(--dh-accent-light)]'}`}>
                {isUploading ? (
                  <>
                    <Upload size={18} className="animate-bounce" />
                    <span className="animate-pulse">กำลังสแกนและส่งขึ้น Cloud...</span>
                  </>
                ) : 'บันทึกภาพลงฐานข้อมูล'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;