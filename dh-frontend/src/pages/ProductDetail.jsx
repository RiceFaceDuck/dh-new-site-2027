import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAuth } from 'firebase/auth'; 
import { cartService } from '../firebase/cartService'; 
import { ChevronLeft, ShoppingCart, ShieldCheck, Truck, Package, Heart, CheckCircle2, Cpu, FileText, ShieldAlert, Youtube, Loader2 } from 'lucide-react';
import PartnerSupportBox from '../components/partner/PartnerSupportBox';

// 🚀 ULTRA SMART FIELD MAPPER (V2): ค้นหาและแปลงข้อมูลครอบจักรวาล
const normalizeKey = (k) => String(k).replace(/[_\-\s]/g, '').toLowerCase();

const getVal = (obj, possibleKeys) => {
  if (!obj || typeof obj !== 'object') return null;
  const normalizedObj = Object.keys(obj).reduce((acc, key) => {
    acc[normalizeKey(key)] = obj[key];
    return acc;
  }, {});
  
  for (let key of possibleKeys) {
    const val = normalizedObj[normalizeKey(key)];
    if (val !== undefined && val !== null && val !== '') {
      return val;
    }
  }
  return null;
};

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🧠 SMART FETCH
  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!product); 
  const [error, setError] = useState(null);

  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null); 

  useEffect(() => {
    if (!product) {
      const fetchProduct = async () => {
        try {
          setError(null);
          // 🛑 คืนค่าพาทเดิมของคุณ เพื่อให้ดึงข้อมูลได้อย่างถูกต้อง
          const docRef = doc(db, "products", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProduct({ id: docSnap.id, ...docSnap.data() });
          } else {
            setError("ไม่พบข้อมูลสินค้านี้");
          }
        } catch (err) {
          console.error("Error fetching product:", err);
          setError("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า");
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    } else {
      setLoading(false);
    }
  }, [id, product]);

  const handleAddToCart = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setAlertMessage({ type: 'error', text: 'กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า' });
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    setIsAdding(true);
    try {
      await cartService.addToCart(user.uid, product, 1);
      setAddSuccess(true);
      setAlertMessage({ type: 'success', text: 'เพิ่มสินค้าลงตะกร้าเรียบร้อยแล้ว!' });
      
      setTimeout(() => {
        setAddSuccess(false);
        setAlertMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Add to cart failed:', err);
      setAlertMessage({ type: 'error', text: 'ไม่สามารถเพิ่มสินค้าได้ กรุณาลองใหม่' });
      setTimeout(() => setAlertMessage(null), 3000);
    } finally {
      setIsAdding(false);
    }
  };

  // 🎬 ฟังก์ชันอัจฉริยะ: ดึง YouTube ID จากฟิลด์ข้อมูลสินค้า
  const youtubeUrl = getVal(product, ['youtubeUrl', 'videoUrl', 'youtube', 'video']);
  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = String(url).match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const videoId = extractYouTubeId(youtubeUrl);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={48} className="animate-spin mb-4 text-cyber-blue" />
        <p className="font-tech tracking-wider uppercase">Loading Product Data...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <ShieldAlert size={48} className="mb-4 text-red-400" />
        <p className="font-tech tracking-wider">{error || "PRODUCT NOT FOUND"}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors">
          GO BACK
        </button>
      </div>
    );
  }

  const brand = getVal(product, ['brand', 'manufacturer', 'maker']) || 'DH Standard';
  const model = getVal(product, ['model', 'modelnumber']) || product.id;
  const name = getVal(product, ['name', 'title', 'productname']) || 'Unnamed Product';
  const price = getVal(product, ['price', 'regularPrice', 'cost']) || 0;
  const salePrice = getVal(product, ['salePrice', 'discountPrice', 'specialPrice']);
  const description = getVal(product, ['description', 'desc', 'details', 'detail']);
  const specs = getVal(product, ['specifications', 'specs', 'features']) || {};
  const qty = getVal(product, ['stock', 'quantity', 'qty']) || 0;
  const isOutOfStock = qty <= 0;

  // 🛠️ คืนค่าระบบจัดการรูปภาพเดิม และรองรับกรณีบันทึกมาเป็น Array
  let rawImg = getVal(product, ['imageurl', 'image', 'picture', 'photo', 'img', 'images', 'cover']);
  const imageUrl = Array.isArray(rawImg) ? rawImg[0] : rawImg;

  return (
    <div className="max-w-7xl mx-auto w-full animate-fade-in pb-10">
      
      {/* 🌟 Toast Notification */}
      {alertMessage && (
        <div className={`fixed top-20 right-4 md:right-8 z-[100] px-6 py-3 rounded-md shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8 duration-300 border ${
          alertMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {alertMessage.type === 'success' ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
          <span className="font-medium text-sm">{alertMessage.text}</span>
        </div>
      )}

      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group"
      >
        <ChevronLeft size={18} className="mr-1 group-hover:-translate-x-1 transition-transform" /> BACK TO PRODUCTS
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          
          {/* ซ้าย: รูปภาพสินค้า */}
          <div className="p-6 md:p-10 bg-slate-50 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
            <div className="relative w-full max-w-md aspect-square bg-white rounded-xl shadow-sm overflow-hidden group">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={name} 
                  className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                  <Package size={64} strokeWidth={1} />
                  <span className="mt-2 text-sm font-tech">NO IMAGE</span>
                </div>
              )}
            </div>
          </div>

          {/* ขวา: ข้อมูลและปุ่มสั่งซื้อ */}
          <div className="p-6 md:p-10 flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-md">
                {brand}
              </span>
              <span className="text-xs font-tech text-slate-400 flex items-center gap-1">
                <Cpu size={14} /> MODEL: {model}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight mb-4">
              {name}
            </h1>

            {/* ราคา */}
            <div className="mb-6 flex items-end gap-3">
              {salePrice ? (
                <>
                  <span className="text-3xl md:text-4xl font-bold text-cyber-emerald">฿{salePrice.toLocaleString()}</span>
                  <span className="text-lg text-slate-400 line-through mb-1">฿{price.toLocaleString()}</span>
                </>
              ) : (
                <span className="text-3xl md:text-4xl font-bold text-slate-800">฿{price.toLocaleString()}</span>
              )}
            </div>

            {/* สถานะสินค้า */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                <Package className={isOutOfStock ? "text-red-400" : "text-cyber-emerald"} size={20} />
                <div>
                  <div className="text-xs text-slate-500">Status</div>
                  <div className={`font-bold text-sm ${isOutOfStock ? "text-red-500" : "text-slate-800"}`}>
                    {isOutOfStock ? 'OUT OF STOCK' : 'IN STOCK'}
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                <Truck className="text-cyber-blue" size={20} />
                <div>
                  <div className="text-xs text-slate-500">Shipping</div>
                  <div className="font-bold text-sm text-slate-800">Ready to Ship</div>
                </div>
              </div>
            </div>

            {description && (
              <p className="text-sm text-slate-600 leading-relaxed mb-8 line-clamp-4">
                {description}
              </p>
            )}

            {/* ปุ่มกดสั่งซื้อ (คืนค่าดีไซน์เดิม 100%) */}
            <div className="mt-auto pt-4 flex items-center gap-3">
              <button 
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding || addSuccess}
                className={`flex-1 h-12 md:h-14 rounded-sm font-bold text-sm md:text-base tracking-wide flex items-center justify-center gap-2 transition-all duration-300 shadow-sm ${
                  isOutOfStock 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : addSuccess
                      ? 'bg-emerald-50 text-cyber-emerald border border-cyber-emerald'
                      : 'bg-slate-800 text-white hover:bg-slate-900 hover:shadow-md'
                }`}
              >
                {isAdding ? (
                  <><div className="w-4 h-4 border-2 border-cyber-emerald border-t-transparent rounded-full animate-spin"></div> PROCESSING</>
                ) : addSuccess ? (
                  <><CheckCircle2 size={18} strokeWidth={2.5} /> ADDED TO CART</>
                ) : isOutOfStock ? (
                  <>OUT OF STOCK</>
                ) : (
                  <><ShoppingCart size={18} /> ADD TO CART</>
                )}
              </button>
              <button className="w-12 h-12 md:w-14 md:h-14 bg-white border border-slate-200 hover:border-red-300 hover:text-red-500 hover:bg-red-50 text-slate-400 rounded-sm flex items-center justify-center transition-colors shadow-sm">
                <Heart size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* 🌟 INTEGRATION ZONE: Partner & Youtube */}
        <div className="px-6 md:px-10 py-6 md:py-8 bg-white w-full border-t border-slate-100">
          <PartnerSupportBox />

          {videoId && (
            <div className="mt-6 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md group">
              <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <Youtube className="text-red-500 w-5 h-5 animate-pulse" />
                  <span className="text-white text-sm font-bold tracking-wide">Product Video Review</span>
                </div>
              </div>
              <div className="relative w-full aspect-video bg-black">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
        </div>

        {/* Technical Specifications (คืนค่าดีไซน์เดิม 100%) */}
        {specs && Object.keys(specs).length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 p-6 md:p-10">
            <h3 className="text-xs font-tech font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest border-b border-slate-200 pb-3">
              <FileText size={16} className="text-cyber-blue" />
              Technical Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {Object.entries(specs).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="text-slate-800 text-sm font-medium text-right">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDetail;