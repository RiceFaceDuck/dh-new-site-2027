import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAuth } from 'firebase/auth'; 
import { cartService } from '../firebase/cartService'; 
import { ChevronLeft, ShoppingCart, ShieldCheck, Truck, Package, Heart, CheckCircle2, Cpu, FileText } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🧠 SMART FETCH: 
  // ถ้ารับข้อมูลมาจากหน้า Home (location.state) จะใช้ข้อมูลนั้นทันที = ประหยัด Read 100%
  // แต่ถ้ากด Refresh หรือเข้าลิงก์ตรงๆ ถึงจะวิ่งไปดึง Database ใหม่
  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!product); 

  // ✨ State สำหรับการทำงานของปุ่มตะกร้า & การแจ้งเตือน
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null); // ใช้แทน window.alert()

  useEffect(() => {
    // ถ้าไม่มีข้อมูลถูกส่งมาจากหน้าก่อนหน้า ให้ดึงใหม่จาก Firebase
    if (!product) {
      const fetchProduct = async () => {
        try {
          const docRef = doc(db, "products", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProduct({ id: docSnap.id, ...docSnap.data() });
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching document:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, product]);

  const handleAddToCart = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setAlertMessage("ACCESS DENIED: กรุณาเข้าสู่ระบบพันธมิตรก่อนทำรายการ");
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    setIsAdding(true);
    
    try {
      await cartService.addToCart(user.uid, product, 1);
      
      setIsAdding(false);
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2000);
    } catch (error) {
      console.error("🔥 Error add to cart:", error);
      setAlertMessage("ERROR: " + error.message);
      setIsAdding(false);
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 w-full">
        <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 border-t-2 border-cyber-emerald rounded-full animate-spin"></div>
            <Cpu className="text-slate-400" size={24} />
        </div>
        <p className="mt-4 text-xs font-tech tracking-widest text-slate-500 uppercase animate-pulse">Loading Tech Data...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-red-500 mb-4 border border-red-500/20 bg-red-500/10 p-4 rounded-sm">
           <span className="font-tech text-xl font-bold tracking-widest">404 - DATA NOT FOUND</span>
        </div>
        <button onClick={() => navigate('/')} className="text-cyber-emerald hover:text-emerald-400 font-bold underline font-tech tracking-wider text-sm">
          RETURN TO HOME
        </button>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="max-w-6xl mx-auto py-2 md:py-6 animate-fade-in-up">
      
      {/* Alert Notification UI (Custom) */}
      {alertMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 border border-red-500 text-red-400 px-6 py-3 rounded-sm shadow-glow-blue flex items-center space-x-3 w-[90%] md:w-auto">
          <ShieldCheck size={18} className="text-red-500" />
          <span className="font-tech text-xs tracking-wider font-bold">{alertMessage}</span>
        </div>
      )}

      {/* Tech Breadcrumb / Header */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-slate-400 hover:text-cyber-emerald mb-6 transition-colors group px-2"
      >
        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-bold font-tech uppercase tracking-widest ml-1">Back</span>
      </button>

      {/* Main Tech Sheet Card */}
      <div className="bg-white rounded-sm border border-slate-200 shadow-tech-card overflow-hidden relative">
        {/* Subtle top border glow */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyber-emerald via-cyber-blue to-transparent"></div>

        <div className="flex flex-col md:flex-row">
          
          {/* ส่วนรูปภาพ (Left Panel) */}
          <div className="w-full md:w-2/5 lg:w-1/2 p-6 md:p-10 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50 flex items-center justify-center relative min-h-[300px]">
             {/* Tech grid background for image area */}
             <div className="absolute inset-0 bg-tech-grid opacity-50 pointer-events-none"></div>
            
             <img 
              src={product.imageUrl || '/logo.png'} 
              alt={product.name} 
              className="max-w-full max-h-80 object-contain relative z-10 filter drop-shadow-md hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.target.src = '/logo.png' }}
            />
            
            {/* Status indicator on Image */}
            <div className="absolute top-4 left-4 flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-sm border border-slate-200 shadow-sm z-20">
               <span className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-cyber-emerald animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`}></span>
               <span className="text-[10px] font-bold text-slate-700 font-tech uppercase tracking-wider">
                 {isOutOfStock ? 'OUT OF STOCK' : 'IN STOCK'}
               </span>
            </div>
          </div>

          {/* ส่วนข้อมูล (Right Panel - Tech Data) */}
          <div className="w-full md:w-3/5 lg:w-1/2 flex flex-col p-6 md:p-10 relative">
            
            <div className="mb-6 pb-6 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                 <span className="bg-slate-100 text-slate-500 text-[10px] px-2.5 py-1 rounded-sm font-tech font-bold tracking-widest border border-slate-200 uppercase">
                    ID: {product.id}
                 </span>
                 <span className="text-cyber-blue text-xs font-bold uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded-sm border border-sky-100">
                    {product.brand || 'GENERIC BRAND'}
                 </span>
              </div>
              
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 leading-tight mb-4">
                {product.name}
              </h1>

              <div className="flex flex-col mb-2">
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-tech mb-1">PARTNER PRICE</span>
                 <div className="flex items-end">
                    <span className="text-4xl font-bold text-cyber-emerald font-tech tracking-tight mr-2 leading-none">
                      ฿{product.price ? product.price.toLocaleString() : 'N/A'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium mb-1">/ {product.unit || 'ชิ้น'}</span>
                 </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-sm flex items-start space-x-3">
                <div className="p-1.5 bg-white shadow-sm rounded-sm border border-slate-200">
                  <Package size={16} className="text-cyber-emerald" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stock Available</p>
                  <p className={`text-sm font-tech font-bold ${isOutOfStock ? 'text-red-500' : 'text-slate-700'}`}>
                    {product.stock || 0} Units
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-sm flex items-start space-x-3">
                <div className="p-1.5 bg-white shadow-sm rounded-sm border border-slate-200">
                  <Truck size={16} className="text-cyber-blue" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Shipping</p>
                  <p className="text-sm font-medium text-slate-700">จัดส่งฟรี (VIP)</p>
                </div>
              </div>
              <div className="col-span-2 bg-slate-50 border border-slate-100 p-3 rounded-sm flex items-start space-x-3">
                <div className="p-1.5 bg-white shadow-sm rounded-sm border border-slate-200">
                  <ShieldCheck size={16} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Warranty</p>
                  <p className="text-sm font-medium text-slate-700">{product.warranty || 'รับประกันตามเงื่อนไขบริษัท'}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons (Tech Style) */}
            <div className="mt-auto flex items-center gap-3">
              <button 
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding || addSuccess}
                className={`flex-1 h-12 md:h-14 rounded-sm flex items-center justify-center gap-2 text-sm font-bold tracking-wider uppercase transition-all duration-300 shadow-sm border ${
                  isAdding || addSuccess 
                    ? 'bg-emerald-50 text-cyber-emerald border-emerald-200' 
                    : isOutOfStock 
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                      : 'bg-slate-800 hover:bg-slate-900 text-white border-slate-900 hover:shadow-glow-emerald'
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

        {/* รายละเอียดสินค้าเต็มรูปแบบ (Full Tech Specs) */}
        <div className="border-t border-slate-200 bg-slate-50 p-6 md:p-10">
          <h3 className="text-xs font-tech font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest border-b border-slate-200 pb-3">
            <FileText size={16} className="text-cyber-blue" />
            Technical Specifications
          </h3>
          <div className="text-sm text-slate-600 leading-relaxed font-medium bg-white p-6 rounded-sm border border-slate-200 shadow-sm">
             {product.description || "ไม่มีข้อมูลรายละเอียดสินค้าระบุไว้ในระบบ"}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;