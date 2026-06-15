import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, AlertCircle } from 'lucide-react';
import { categoryService } from '../firebase/categoryService';

// 🚀 รับ Props selectedType และ onSelectType มาจากหน้า Home
const CategoryList = ({ selectedType, onSelectType }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await categoryService.getActiveCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError('ไม่สามารถโหลดหมวดหมู่ได้');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (error) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center p-4 bg-red-50 rounded-xl border border-red-100 text-red-500 text-sm">
          <AlertCircle size={18} className="mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        className="flex flex-row overflow-x-auto md:flex-wrap gap-4 px-4 py-2 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="flex flex-col items-center justify-center min-w-[72px] sm:min-w-[80px] flex-shrink-0 animate-pulse">
              <div className="w-14 h-14 bg-slate-200 rounded-full shadow-sm mb-2"></div>
              <div className="w-12 h-3 bg-slate-200 rounded-md"></div>
            </div>
          ))
        ) : categories.length === 0 ? (
          <div className="w-full text-center text-sm text-slate-500 py-4">
            ยังไม่มีหมวดหมู่เปิดใช้งาน
          </div>
        ) : (
          categories.map((cat) => {
            // เช็คว่าการ์ดนี้กำลังถูกเลือก (อิงจาก URL)
            const isSelected = selectedType === cat.type;
            
            // 🚀 แปลง shape เป็น CSS Class
            let shapeClass = "rounded-full"; // default circle
            if (cat.buttonShape === "square") shapeClass = "rounded-none";
            else if (cat.buttonShape === "rounded") shapeClass = "rounded-2xl";

            return (
              <Link 
                key={cat.id} 
                to={`/category/${cat.type}`}
                className={`flex flex-col items-center justify-start min-w-[72px] sm:min-w-[80px] flex-shrink-0 cursor-pointer group active:scale-95 transition-all duration-200 ${
                  selectedType && !isSelected ? 'opacity-50 hover:opacity-100' : 'opacity-100'
                }`}
              >
                {/* 🚀 เปลี่ยนสีขอบและพื้นหลังให้ชัดเจนว่าถูกคลิกอยู่ พร้อมประยุกต์ใช้ buttonShape */}
                <div className={`w-14 h-14 ${shapeClass} flex items-center justify-center mb-2 shadow-sm border transition-all duration-200 overflow-hidden ${
                  isSelected 
                    ? 'border-blue-500 shadow-md bg-blue-50 ring-2 ring-blue-500/20' 
                    : 'bg-white border-slate-100 group-hover:shadow-md group-hover:border-blue-400'
                }`}>
                  {cat.imageUrl ? (
                    <img 
                      src={cat.imageUrl} 
                      alt={cat.name} 
                      className={`w-8 h-8 object-contain transition-transform duration-200 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <Package 
                    size={24} 
                    strokeWidth={1.5} 
                    className={`transition-colors duration-200 ${cat.imageUrl ? 'hidden' : 'block'} ${isSelected ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`} 
                  />
                </div>
                
                <span className={`text-xs font-medium text-center line-clamp-2 leading-tight transition-colors duration-200 ${
                  isSelected ? 'text-blue-600' : 'text-slate-700 group-hover:text-blue-600'
                }`}>
                  {cat.name}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CategoryList;