import React, { useState, useEffect, useMemo } from 'react';
import { Search, Upload, Layers, AlertCircle, Image as ImageIcon, RefreshCw, Eye } from 'lucide-react';
import { collection, getDocs, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase/config';

import ImageCard from '../../components/gallery/ImageCard';
import InspectionBay from '../../components/gallery/InspectionBay';
import UploadModal from '../../components/gallery/UploadModal';

export default function GalleryMain() {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); 
  const [compareList, setCompareList] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showInspection, setShowInspection] = useState(false); // ✨ State ซ่อน/แสดงแท่นเปรียบเทียบ

  const fetchImagesFromFirebase = async () => {
    setIsLoading(true);
    try {
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      
      let allImages = [];
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        if (data.images && Array.isArray(data.images)) {
          // ดึงข้อมูล Metadata จาก imageMetadata ถ้ามี (อิงตามแผนพัฒนา Schema)
          const metaList = data.imageMetadata || [];
          
          data.images.forEach((imgUrl, idx) => {
            const meta = metaList.find(m => m.url === imgUrl) || {};
            allImages.push({
              id: `${docSnap.id}-${idx}`,
              productId: docSnap.id,
              url: imgUrl,
              sku: data.sku || '',
              title: data.name || 'ไม่มีชื่อสินค้า',
              description: meta.description || '', // นำคำอธิบายมาแสดง
              tags: [data.category, ...(data.tags || [])].filter(Boolean),
            });
          });
        }
      });
      
      setImages(allImages);
    } catch (error) {
      console.error("Error fetching images from Firebase:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImagesFromFirebase();
  }, []);

  const filteredImages = useMemo(() => {
    return images.filter(img => {
      if (filterType === 'ORPHAN' && img.sku !== '') return false;
      if (filterType === 'HAS_SKU' && img.sku === '') return false;
      
      if (!searchQuery) return true;
      const queryText = searchQuery.toLowerCase();
      return (
        img.title.toLowerCase().includes(queryText) ||
        img.sku.toLowerCase().includes(queryText) ||
        (img.description && img.description.toLowerCase().includes(queryText)) ||
        img.tags.some(t => t.toLowerCase().includes(queryText))
      );
    });
  }, [images, searchQuery, filterType]);

  const addToCompare = (img) => {
    if (compareList.find(c => c.id === img.id)) {
      setCompareList(compareList.filter(c => c.id !== img.id)); // กดซ้ำคือเอาออก
      return;
    }
    if (compareList.length >= 3) {
      alert('เปรียบเทียบสูงสุดได้ 3 ภาพพร้อมกันครับ');
      return;
    }
    setCompareList([...compareList, img]);
    setShowInspection(true); // เด้งหน้าต่างเปรียบเทียบขึ้นมาทันทีเมื่อเลือกภาพแรก
  };

  const removeFromCompare = (id) => {
    const newList = compareList.filter(c => c.id !== id);
    setCompareList(newList);
    if (newList.length === 0) setShowInspection(false); // ปิดอัตโนมัติถ้าไม่มีรูปเหลือ
  };
  
  const clearCompare = () => {
    setCompareList([]);
    setShowInspection(false);
  };

  const handleNewUpload = async (newImageData) => {
    const tempImage = {
      id: `temp-${Date.now()}`,
      url: newImageData.url,
      sku: newImageData.sku,
      title: newImageData.title,
      description: newImageData.description,
      tags: newImageData.tags
    };
    setImages([tempImage, ...images]);

    if (newImageData.sku) {
      try {
        const q = query(collection(db, 'products'), where('sku', '==', newImageData.sku));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const productDoc = querySnapshot.docs[0];
          // อัปเดตทั้งลิงก์ปกติ และ Metadata ตามหลักการ Schema
          await updateDoc(doc(db, 'products', productDoc.id), {
            images: arrayUnion(newImageData.url),
            imageMetadata: arrayUnion({
              url: newImageData.url,
              description: newImageData.description,
              size: newImageData.size,
              uploadedAt: new Date().toISOString()
            })
          });
        }
      } catch (error) {
        console.error("Error updating product image in Firebase:", error);
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-full animate-in fade-in duration-500 bg-dh-base gap-1 p-1 md:gap-1.5 md:p-1.5 text-dh-main overflow-hidden">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 dh-header-gradient px-3 md:px-4 py-2 shrink-0 z-20 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.3)] border-b border-dh-border relative transition-colors duration-300">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center text-white border border-white/20 shrink-0 shadow-sm">
            <Layers size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none text-white">Visual Analytics Hub</h1>
            <p className="text-slate-300 text-[10px] mt-0.5 font-bold">ศูนย์บัญชาการสินทรัพย์ดิจิทัล</p>
          </div>
        </div>

        <div className="flex-1 w-full flex flex-wrap items-center gap-3 relative z-10">
          <div className="relative group flex-1 md:flex-none md:min-w-[300px]">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-cyan-500 transition-colors z-10">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="ค้นหาจักรวาลภาพ... (SKU, ชื่อ, Tags, คำอธิบาย)" 
              className="pl-9 pr-4 py-2 h-[36px] bg-white border border-slate-200 rounded-md w-full outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium text-xs text-slate-900 placeholder:text-slate-400 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex bg-white/10 border border-white/20 p-0.5 rounded-md backdrop-blur-sm h-[36px]">
            <button onClick={() => setFilterType('ALL')} className={`px-3 py-1 text-xs font-semibold rounded transition-all ${filterType === 'ALL' ? 'bg-white shadow text-slate-900' : 'text-slate-300 hover:text-white'}`}>ทั้งหมด</button>
            <button onClick={() => setFilterType('ORPHAN')} className={`px-3 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1 ${filterType === 'ORPHAN' ? 'bg-red-500 shadow text-white' : 'text-slate-300 hover:text-white'}`}>
              <AlertCircle size={12}/> ภาพกำพร้า
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          
          {/* ✨ ปุ่มเรียก Inspection Bay */}
          {compareList.length > 0 && (
            <button 
              onClick={() => setShowInspection(true)}
              className="relative px-3 py-2 bg-white/10 border border-cyan-400/50 text-cyan-300 rounded-md font-bold text-xs flex items-center gap-2 hover:bg-white/20 transition-colors animate-pulse backdrop-blur-sm h-[36px]"
            >
              <Eye size={14} />
              <span className="hidden sm:inline">แท่นเปรียบเทียบ</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-md">
                {compareList.length}
              </span>
            </button>
          )}

          <button onClick={fetchImagesFromFirebase} className="w-[36px] h-[36px] flex items-center justify-center bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-md transition-colors backdrop-blur-sm shadow-sm" title="รีเฟรชข้อมูล">
            <RefreshCw size={14} className={isLoading ? "animate-spin text-cyan-300" : ""} />
          </button>
          
          <button 
            onClick={() => setShowUpload(true)}
            className="bg-cyan-600 text-white h-[36px] px-4 rounded-md hover:bg-cyan-500 transition-all font-bold shadow-lg active:scale-95 text-xs ring-1 ring-cyan-400/50 flex items-center gap-2 shrink-0"
          >
            <Upload size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">อัพโหลดภาพ</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0 relative bg-white border border-dh-border">
        
        {/* Grid Images */}
        <div className="flex-1 overflow-y-auto p-6 transition-all duration-300 custom-scrollbar">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--dh-text-muted)]">
              <RefreshCw size={40} className="mb-4 animate-spin text-[var(--dh-accent)]" />
              <p className="text-sm font-medium">กำลังโหลดและจัดเรียงสินทรัพย์ดิจิทัล...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--dh-text-muted)]">
              <ImageIcon size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">ไม่พบสินทรัพย์ดิจิทัลในระบบ</p>
            </div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
              {filteredImages.map(img => (
                <ImageCard 
                  key={img.id} 
                  image={img} 
                  onCompare={addToCompare} 
                  isComparing={compareList.some(c => c.id === img.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ✨ Full-Screen Inspection Bay Overlay */}
        {showInspection && (
          <div className="absolute inset-0 z-40 bg-[var(--dh-bg-base)] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
            <InspectionBay 
              images={compareList} 
              onRemove={removeFromCompare} 
              onClear={clearCompare} 
              onClose={() => setShowInspection(false)}
            />
          </div>
        )}
      </main>

      <UploadModal 
        isOpen={showUpload} 
        onClose={() => setShowUpload(false)} 
        onUpload={handleNewUpload} 
      />

    </div>
  );
}