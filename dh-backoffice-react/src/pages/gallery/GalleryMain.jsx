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
    <div className="h-full w-full bg-[var(--dh-bg-surface)] flex flex-col font-sans overflow-hidden text-[var(--dh-text-main)] rounded-xl border border-[var(--dh-border)] shadow-sm relative">
      
      <header className="bg-[var(--dh-bg-base)] border-b border-[var(--dh-border)] px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 z-10 shadow-sm rounded-t-xl relative">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[var(--dh-accent)] to-orange-400 p-2.5 rounded-xl text-white shadow-lg shadow-[var(--dh-accent-light)]">
            <Layers size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-[var(--dh-text-main)]">Visual Analytics Hub</h1>
            <p className="text-xs text-[var(--dh-text-muted)] font-medium">ศูนย์บัญชาการสินทรัพย์ดิจิทัล</p>
          </div>
        </div>

        <div className="flex-1 max-w-2xl w-full flex items-center gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--dh-text-muted)] group-focus-within:text-[var(--dh-accent)] transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="ค้นหาจักรวาลภาพ... (SKU, ชื่อ, Tags, คำอธิบาย)" 
              className="w-full bg-[var(--dh-bg-surface)] border border-[var(--dh-border)] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dh-accent)]/50 focus:border-[var(--dh-accent)] transition-all shadow-inner text-[var(--dh-text-main)] placeholder-[var(--dh-text-muted)]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex bg-[var(--dh-bg-surface)] p-1 rounded-xl">
            <button onClick={() => setFilterType('ALL')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterType === 'ALL' ? 'bg-[var(--dh-bg-base)] shadow border border-[var(--dh-border)] text-[var(--dh-text-main)]' : 'text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)]'}`}>ทั้งหมด</button>
            <button onClick={() => setFilterType('ORPHAN')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${filterType === 'ORPHAN' ? 'bg-red-50 shadow border border-red-100 text-red-600' : 'text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)]'}`}>
              <AlertCircle size={12}/> ภาพกำพร้า
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          
          {/* ✨ ปุ่มเรียก Inspection Bay */}
          {compareList.length > 0 && (
            <button 
              onClick={() => setShowInspection(true)}
              className="relative px-4 py-2.5 bg-[var(--dh-bg-base)] border border-[var(--dh-accent)] text-[var(--dh-accent)] rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[var(--dh-accent-light)] transition-colors animate-pulse"
            >
              <Eye size={18} />
              <span>เปิดแท่นเปรียบเทียบ</span>
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md">
                {compareList.length}
              </span>
            </button>
          )}

          <button onClick={fetchImagesFromFirebase} className="p-2.5 bg-[var(--dh-bg-surface)] hover:bg-[var(--dh-border)] text-[var(--dh-text-main)] rounded-xl transition-colors" title="รีเฟรชข้อมูล">
            <RefreshCw size={18} className={isLoading ? "animate-spin text-[var(--dh-accent)]" : ""} />
          </button>
          
          <button 
            onClick={() => setShowUpload(true)}
            className="bg-[var(--dh-text-main)] hover:brightness-75 text-[var(--dh-bg-base)] px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Upload size={18} />
            <span>อัพโหลดภาพ</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden relative bg-[var(--dh-bg-surface)]">
        
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