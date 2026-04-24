import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { cartService } from '../firebase/cartService';
import { collection, query, where, getDocs } from 'firebase/firestore'; 
import { db } from '../firebase/config'; 
import { ShoppingBag, Trash2, Plus, Minus, ChevronLeft, ArrowRight, ShieldCheck, Loader2, Gift, Terminal } from 'lucide-react'; 

// 🚀 ULTRA SMART FIELD MAPPER (V2): ค้นหาและแปลงข้อมูลครอบจักรวาล (กันกระสุน)
const normalizeKey = (k) => String(k).replace(/[_-\s]/g, '').toLowerCase();

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

const Cart = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cartData, setCartData] = useState({ items: [], total: 0, totalQty: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // 🎁 State สำหรับระบบของแถม (Gamification)
  const [freebies, setFreebies] = useState([]);

  // 1. ตรวจสอบ Auth และดึงข้อมูล
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await Promise.all([
          fetchCart(currentUser.uid),
          fetchFreebies()
        ]);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchCart = async (uid) => {
    try {
      const data = await cartService.getCart(uid);
      setCartData(data || { items: [], total: 0, totalQty: 0 });
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFreebies = async () => {
    try {
      const q = query(collection(db, "freebies"), where("isActive", "==", true));
      const querySnapshot = await getDocs(q);
      const freebiesData = [];
      querySnapshot.forEach((doc) => {
        freebiesData.push({ id: doc.id, ...doc.data() });
      });
      freebiesData.sort((a, b) => a.conditionTotal - b.conditionTotal);
      setFreebies(freebiesData);
    } catch (error) {
      console.error("Error fetching freebies:", error);
    }
  };

  const handleUpdateQty = async (productId, currentQty, change) => {
    if (!user) return;
    const newQty = currentQty + change;
    
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setUpdatingId(productId);
    try {
      await cartService.updateQuantity(user.uid, productId, newQty);
      await fetchCart(user.uid); 
    } catch (error) {
      console.error("Error updating qty:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตจำนวน");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!user) return;
    
    if (!window.confirm('คุณต้องการลบสินค้านี้ออกจากรายการสั่งซื้อใช่หรือไม่?')) return;

    setUpdatingId(productId);
    try {
      await cartService.removeItem(user.uid, productId);
      await fetchCart(user.uid);
    } catch (error) {
      console.error("Error removing item:", error);
      alert("เกิดข้อผิดพลาดในการลบสินค้า");
    } finally {
      setUpdatingId(null);
    }
  };

  // --- UI Renders ---

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] flex-col">
         <Loader2 className="animate-spin text-cyber-emerald mb-4" size={32} />
         <p className="text-xs font-tech tracking-widest text-slate-500 uppercase animate-pulse">Loading System Protocol...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-4 animate-fade-in-up">
        <div className="w-20 h-20 bg-slate-100 rounded-sm flex items-center justify-center mb-6 shadow-sm border border-slate-200">
          <Terminal size={32} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2 font-tech uppercase tracking-wider">Authentication Required</h2>
        <p className="text-slate-500 mb-8 text-center max-w-sm text-sm">
          กรุณาเข้าสู่ระบบพาร์ทเนอร์ก่อนเข้าใช้งานระบบจัดเตรียมคำสั่งซื้อ (Purchase Order)
        </p>
        <button 
          onClick={() => navigate('/profile')}
          className="bg-cyber-emerald hover:bg-emerald-500 text-white font-bold py-3 px-10 rounded-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] font-tech tracking-wider uppercase text-xs"
        >
          Login to System
        </button>
      </div>
    );
  }

  // 🚀 ดักจับความปลอดภัยกัน Render พังเมื่อไม่มี items
  if (!cartData || !cartData.items || cartData.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-4 animate-fade-in-up">
        <div className="w-24 h-24 bg-slate-50 rounded-sm flex items-center justify-center mb-6 border border-slate-200 border-dashed shadow-sm">
          <ShoppingBag size={40} className="text-slate-300" strokeWidth={1} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2 font-tech uppercase tracking-wider">Empty Protocol</h2>
        <p className="text-slate-500 mb-8 text-center max-w-sm text-sm">
          ยังไม่มีข้อมูลอะไหล่ในระบบจัดเตรียมคำสั่งซื้อของคุณ
        </p>
        <button 
          onClick={() => navigate('/')}
          className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-10 rounded-sm transition-all shadow-sm font-tech tracking-wider uppercase text-xs"
        >
          Browse Database
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-2 md:py-8 animate-fade-in-up">
      
      {/* Header */}
      <div className="flex items-center mb-6 px-2 md:px-0">
        <button onClick={() => navigate(-1)} className="mr-3 text-slate-400 hover:text-cyber-emerald transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center tracking-tight">
            <span className="w-1.5 h-6 bg-cyber-emerald rounded-sm mr-3 inline-block shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            Purchase Order <span className="font-tech font-light text-slate-400 ml-2 text-lg">/ Draft</span>
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-tech tracking-widest">
            {cartData.totalQty || 0} Units In Preparation
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
        
        {/* 📋 รายการสินค้า (Left Col) */}
        <div className="w-full lg:w-[65%] space-y-3 md:space-y-4 px-2 md:px-0">
          {cartData.items.map((item, index) => {
            if (!item) return null; // Safe guard
            
            // 🚀 SMART EXTRACTION: แกะข้อมูลจากข้อมูลดิบใน Cart ให้ถูกต้องเสมอ
            const rawImage = getVal(item, ['imageurl', 'image', 'images', 'img', 'picture', 'photo', 'url', 'รูปภาพ']);
            const imageUrl = Array.isArray(rawImage) && rawImage.length > 0 ? rawImage[0] : (typeof rawImage === 'string' ? rawImage : '/logo.png');
            
            const rawPrice = getVal(item, ['retailprice', 'regularprice', 'ราคาปลีก', 'price', 'saleprice', 'ราคา', 'sellprice']);
            const price = (rawPrice !== null && rawPrice !== undefined) ? Number(String(rawPrice).replace(/[^0-9.-]+/g,"")) : (item.price || 0);

            const name = getVal(item, ['name', 'title', 'productname', 'ชื่อสินค้า']) || 'Unknown Product Data';
            const sku = getVal(item, ['sku', 'code', 'productcode', 'รหัสสินค้า', 'barcode']) || item.id?.substring(0, 8) || `ITM-${index}`;
            const itemId = item.id || index;

            return (
              <div 
                key={itemId} 
                className="bg-white rounded-sm border border-slate-200 p-3 md:p-4 flex gap-4 shadow-tech-card hover:border-slate-300 transition-colors group relative"
              >
                {/* Product Image */}
                <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 rounded-sm border border-slate-100 flex items-center justify-center shrink-0 p-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-tech-grid opacity-30"></div>
                  {/* 🚀 แก้บัคภาพหายบนมือถือโดยการเอา mix-blend-multiply ออก */}
                  <img 
                    src={imageUrl} 
                    alt={name} 
                    className="w-full h-full object-contain relative z-10"
                    onError={(e) => { e.target.src = '/logo.png' }}
                  />
                </div>

                {/* Product Details & Controls */}
                <div className="flex flex-col flex-grow justify-between py-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[9px] md:text-[10px] text-slate-400 font-tech mb-1 uppercase tracking-wider">
                        SKU: {sku}
                      </div>
                      <Link to={`/product/${itemId}`} className="text-xs md:text-sm font-semibold text-slate-800 line-clamp-2 hover:text-cyber-blue transition-colors leading-relaxed">
                        {name}
                      </Link>
                    </div>
                    <button 
                      onClick={() => handleRemoveItem(itemId)}
                      disabled={updatingId === itemId}
                      className="text-slate-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-sm transition-all ml-2"
                    >
                      {updatingId === itemId ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>

                  <div className="flex justify-between items-end mt-3">
                    <span className="text-sm md:text-base font-bold text-cyber-blue font-tech tracking-tight">
                      ฿{price ? price.toLocaleString() : '0'}
                    </span>

                    {/* Tech Qty Controls */}
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-sm h-8 md:h-9">
                      <button 
                        onClick={() => handleUpdateQty(itemId, item.qty, -1)}
                        disabled={updatingId === itemId}
                        className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors disabled:opacity-50"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </button>
                      <div className="w-10 h-full flex items-center justify-center bg-white border-x border-slate-200 text-xs font-bold font-tech text-slate-800">
                        {updatingId === itemId ? <Loader2 size={12} className="animate-spin" /> : (item.qty || 1)}
                      </div>
                      <button 
                        onClick={() => handleUpdateQty(itemId, item.qty, 1)}
                        disabled={updatingId === itemId}
                        className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors disabled:opacity-50"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 📊 สรุปยอดและโปรโมชั่น (Right Col) */}
        <div className="w-full lg:w-[35%] px-2 md:px-0 pb-10 md:pb-0">
          <div className="bg-white rounded-sm border border-slate-200 shadow-tech-card sticky top-24 overflow-hidden">
            
            {/* Top accent line */}
            <div className="h-1 w-full bg-gradient-to-r from-cyber-blue to-cyber-emerald"></div>

            <div className="p-5 md:p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest font-tech flex items-center gap-2">
                <Terminal size={16} className="text-cyber-blue" />
                Order Summary
              </h2>
            </div>

            <div className="p-5 md:p-6 space-y-4">
              <div className="flex justify-between text-sm text-slate-500 font-medium border-b border-slate-100 pb-4">
                <span>Subtotal ({cartData.totalQty || 0} Units)</span>
                <span className="font-tech font-bold text-slate-700">฿{(cartData.total || 0).toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-end pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grand Total</span>
                <span className="text-2xl md:text-3xl font-black text-cyber-emerald font-tech leading-none">
                  ฿{(cartData.total || 0).toLocaleString()}
                </span>
              </div>
              <p className="text-[9px] text-slate-400 text-right mt-1 font-tech tracking-widest">
                *EXCLUDES SHIPPING & TAX
              </p>
            </div>

            {/* 🎁 ระบบของแถม (Tech Gamification) */}
            {freebies.length > 0 && (
              <div className="mx-5 mb-6">
                <div className="text-[10px] font-bold text-amber-500 flex items-center gap-1.5 mb-2 uppercase tracking-widest font-tech">
                  <Gift size={14} className="animate-pulse" />
                  Partner Rewards Status
                </div>
                <div className="space-y-3">
                  {freebies.map((freebie, index) => {
                    const currentTotal = cartData.total || 0;
                    const targetTotal = freebie.conditionTotal;
                    const isUnlocked = currentTotal >= targetTotal;
                    const percent = isUnlocked ? 100 : Math.min(100, Math.round((currentTotal / targetTotal) * 100));
                    const diff = targetTotal - currentTotal;

                    return (
                      <div key={index} className={`relative p-3 rounded-sm border ${isUnlocked ? 'bg-amber-50/80 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : 'bg-slate-50 border-slate-200'} transition-all`}>
                         <div className="flex justify-between text-xs mb-1">
                           <span className={`font-semibold ${isUnlocked ? 'text-amber-700' : 'text-slate-600'}`}>{freebie.name}</span>
                           <span className="font-tech font-bold text-slate-400">{percent}%</span>
                         </div>
                         
                         {/* Tech Progress Bar */}
                         <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2 mb-1.5">
                           <div 
                             className={`h-full transition-all duration-1000 ease-out ${isUnlocked ? 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]' : 'bg-slate-400'}`}
                             style={{ width: `${percent}%` }}
                           ></div>
                         </div>
                         
                         {isUnlocked ? (
                           <p className="text-[10px] text-amber-600 font-bold tracking-wide flex items-center gap-1">
                              <CheckCircle2 size={12} /> REWARD UNLOCKED
                           </p>
                         ) : (
                           <p className="text-[10px] text-slate-500 font-tech">
                             ขาดอีก <strong className="text-cyber-blue">฿{diff.toLocaleString()}</strong>
                           </p>
                         )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Corporate Trust Badge */}
            <div className="bg-slate-800 p-4 flex items-start gap-3 mt-2">
              <ShieldCheck size={18} className="text-cyber-emerald shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                <strong className="text-white uppercase tracking-widest font-tech">Secure Protocol</strong><br/>
                ดำเนินการสั่งซื้อ (Checkout) เพื่อกำหนดวิธีชำระเงิน, ใช้เครดิต หรือขอใบกำกับภาษีในขั้นตอนถัดไป
              </p>
            </div>

            {/* Proceed to Checkout Button */}
            <div className="p-4 bg-slate-900 border-t border-slate-800">
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-cyber-emerald hover:bg-emerald-400 text-white font-bold py-3.5 rounded-sm text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] active:scale-95 flex items-center justify-center gap-2 group uppercase tracking-widest font-tech"
              >
                Proceed Checkout
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;