import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ShoppingBag, ArrowLeft, ExternalLink, ShieldCheck, Tag, Loader2 } from 'lucide-react';

const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

const AdProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Try getting from user_sku_ads
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_sku_ads', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          // Fallback to partner_ads
          const fallbackRef = doc(db, 'artifacts', appId, 'public', 'data', 'partner_ads', id);
          const fallbackSnap = await getDoc(fallbackRef);
          if (fallbackSnap.exists()) {
            setProduct({ id: fallbackSnap.id, ...fallbackSnap.data() });
          }
        }
      } catch (error) {
        console.error("Error fetching product detail:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-500 w-10 h-10" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">ไม่พบสินค้านี้</h2>
        <p className="text-slate-600 mb-6">โฆษณาสินค้านี้อาจหมดอายุ หรือถูกนำออกไปแล้ว</p>
        <Link to="/" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md">
          กลับสู่หน้าหลัก
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium">
          <ArrowLeft size={18} className="mr-1.5" /> กลับหน้าหลัก
        </Link>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
          
          {/* Image Section */}
          <div className="w-full md:w-1/2 bg-slate-100 relative p-6 sm:p-10 flex items-center justify-center">
            {product.isSponsoredAd && (
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-xl border border-white/20 font-black tracking-widest uppercase z-10">
                Sponsored
              </div>
            )}
            <img 
              src={product.imageUrl} 
              alt={product.title} 
              className="w-full max-w-md h-auto object-contain drop-shadow-xl rounded-2xl transition-transform hover:scale-105 duration-500"
            />
          </div>

          {/* Details Section */}
          <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-center">
            
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              <ShoppingBag size={14}/>
              <span>{product.partnerName || 'DH Partner'}</span>
              <ShieldCheck size={14} className="text-emerald-500 ml-2" />
              <span className="text-emerald-600">Verified</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black text-slate-800 leading-tight mb-4">
              {product.title}
            </h1>

            {product.price && (
              <div className="flex items-end gap-2 mb-6 bg-emerald-50 w-max px-4 py-2 rounded-2xl border border-emerald-100">
                <Tag size={20} className="text-emerald-600 mb-1" />
                <span className="text-3xl font-black text-emerald-700 tracking-tight">฿{Number(product.price).toLocaleString()}</span>
              </div>
            )}

            <div className="prose prose-slate max-w-none mb-8">
              <p className="text-slate-600 text-lg leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {product.richDescription || product.description || 'ไม่ได้ระบุรายละเอียดสินค้าเพิ่มเติม'}
              </p>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100">
              <button 
                onClick={() => window.open(product.targetUrl, '_blank')}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 active:scale-95 text-lg"
              >
                <ExternalLink size={20} />
                เข้าชมสินค้าบนหน้าร้านหลัก
              </button>
              <p className="text-center text-xs text-slate-400 mt-4 font-medium">
                *ระบบจะพาท่านไปยังเว็บไซต์ภายนอก (เช่น Shopee, Lazada หรือเว็บร้านค้า)
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdProductDetail;
