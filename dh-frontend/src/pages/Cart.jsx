import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { cartService } from '../firebase/cartService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ShoppingBag, Trash2, Plus, Minus, ChevronLeft, ArrowRight, ShieldCheck, Loader2, Gift } from 'lucide-react';

// 🚀 1. ฟังก์ชันตัวช่วย: ดึงค่า Key แบบไม่สนใจตัวพิมพ์เล็กใหญ่ หรืออักษรพิเศษ
const normalizeKey = (k) => String(k).replace(/[_-\s]/g, '').toLowerCase();

const getVal = (obj, possibleKeys) => {
  if (!obj || typeof obj !== 'object') return null;
  const normalizedObj = Object.keys(obj).reduce((acc, key) => {
    acc[normalizeKey(key)] = obj[key];
    return acc;
  }, {});
  for (let key of possibleKeys) {
    const val = normalizedObj[normalizeKey(key)];
    if (val !== undefined && val !== null && val !== '') return val;
  }
  return null;
};

// 🚀 2. ฟังก์ชันตัวช่วย: แปลงข้อมูลทุกรูปแบบให้เป็นตัวเลข ป้องกัน NaN ยอดพัง
const parseSafeNumber = (val) => {
  if (val === null || val === undefined) return 0;
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g, "")) : Number(val);
  return isNaN(num) ? 0 : num;
};

const Cart = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cartData, setCartData] = useState({ items: [], total: 0, totalQty: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [freebies, setFreebies] = useState([]);

  useEffect(() => {
    // ดึงโปรโมชั่นเพียงครั้งเดียวต่อการเข้าหน้าตะกร้า (ช่วยลด Reads)
    fetchFreebies();
    
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchCart(currentUser.uid);
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
      if (data && Array.isArray(data.items)) {
          setCartData(data);
      } else {
          setCartData({ items: [], total: 0, totalQty: 0 });
      }
    } catch (error) {
      console.error("🔥 Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFreebies = async () => {
    try {
      const q = query(collection(db, 'freebies'), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => a.minSpend - b.minSpend);
      setFreebies(items);
    } catch (error) {
      console.error("🔥 Error fetching freebies:", error);
    }
  };

  const handleUpdateQty = async (productId, currentQty, change) => {
    if (!user) return;
    
    const newQty = currentQty + change;
    if (newQty < 0) return; 

    if (newQty === 0) {
      if (!window.confirm("ต้องการลบสินค้านี้ออกจากตะกร้าใช่หรือไม่?")) return;
    }

    setUpdatingId(productId);
    try {
      if (newQty === 0) {
        await cartService.removeItem(user.uid, productId);
      } else {
        await cartService.updateCartItemQty(user.uid, productId, newQty);
      }
      await fetchCart(user.uid); 
    } catch (error) {
      console.error("🔥 Error updating quantity:", error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!user) return;
    
    if (!productId) {
      alert("ไม่พบรหัสอ้างอิงสินค้า (Data Error)");
      return;
    }

    if (!window.confirm("ต้องการลบสินค้านี้ออกจากตะกร้าใช่หรือไม่?")) return;

    setUpdatingId(productId);
    try {
      await cartService.removeItem(user.uid, productId);
      await fetchCart(user.uid);
    } catch (error) {
      console.error("🔥 Error removing item:", error);
      alert("เกิดข้อผิดพลาดในการลบ: " + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const subTotal = parseSafeNumber(cartData.total);
  const nextFreebie = freebies.find(f => f.minSpend > subTotal); 
  const currentFreebie = [...freebies].reverse().find(f => f.minSpend <= subTotal); 

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-sm text-gray-500 font-medium font-tech">Synchronizing Cart Protocol...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">ตะกร้าสินค้าของคุณ</h2>
        <p className="text-gray-500 mb-8 max-w-sm">กรุณาเข้าสู่ระบบเพื่อดูสินค้าในตะกร้า หรือดำเนินการสั่งซื้อต่อ</p>
        <Link to="/profile" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-sm">
          เข้าสู่ระบบ / สมัครสมาชิก
        </Link>
      </div>
    );
  }

  const items = cartData?.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 text-center animate-in fade-in duration-500">
        <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={48} className="text-emerald-500 opacity-80" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-3">ตะกร้าสินค้าว่างเปล่า</h2>
        <p className="text-sm text-gray-500 mb-8">คุณยังไม่มีสินค้าในตะกร้า ลองดูสินค้าที่น่าสนใจในร้านของเราสิ!</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-sm">
          <ChevronLeft size={18} /> เลือกซื้อสินค้าต่อ
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-8 min-h-[80vh] animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-3 font-tech uppercase tracking-tight">
          <ShoppingBag className="text-emerald-600" size={28} strokeWidth={2.5} /> 
          Purchase Order <span className="text-lg text-gray-400 font-medium">({cartData.totalQty || 0} Units)</span>
        </h1>
        <button onClick={() => navigate(-1)} className="hidden md:flex items-center text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> เลือกซื้อสินค้าต่อ
        </button>
      </div>

      {freebies.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 md:p-5 mb-8 shadow-sm relative overflow-hidden transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200 opacity-20 rounded-full -translate-y-1/2 translate-x-1/4"></div>
          
          {nextFreebie ? (
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Gift className="text-emerald-500" size={20} />
                  <span className="text-xs md:text-sm font-bold text-emerald-800">
                    ซื้อเพิ่มอีก <span className="text-emerald-600">฿{(nextFreebie.minSpend - subTotal).toLocaleString()}</span>
                  </span>
                </div>
                <span className="text-[10px] md:text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1.5 rounded-lg shadow-sm border border-emerald-200">
                  รับฟรี: {nextFreebie.title}
                </span>
              </div>
              <div className="w-full bg-emerald-200/60 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-700 ease-out relative" 
                  style={{ width: `${Math.min((subTotal / nextFreebie.minSpend) * 100, 100)}%` }}
                >
                   <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]"></div>
                </div>
              </div>
            </div>
          ) : currentFreebie ? (
            <div className="relative z-10 flex items-center gap-3">
               <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                 <Gift className="text-white animate-bounce" size={20} />
               </div>
               <div>
                 <p className="text-sm font-bold text-emerald-800">ยินดีด้วย! ยอดสั่งซื้อถึงเกณฑ์รับของแถมแล้ว</p>
                 <p className="text-xs text-emerald-600 font-medium mt-0.5">คุณได้รับ: {currentFreebie.title}</p>
               </div>
            </div>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, index) => {
            const realId = item.id;
            const name = getVal(item, ['name', 'title', 'productname', 'ชื่อสินค้า']) || "Unknown Product / Corrupt Data";
            const price = parseSafeNumber(getVal(item, ['retailprice', 'regularprice', 'price', 'saleprice', 'ราคา']));
            
            const rawImg = getVal(item, ['imageurl', 'image', 'images', 'img', 'รูปภาพ']);
            const imageUrl = Array.isArray(rawImg) ? rawImg[0] : (rawImg || '/logo.png');
            
            const sku = getVal(item, ['sku', 'code', 'รหัสสินค้า']) || `SKU-ERR-${index}`;

            return (
              <div key={realId || index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-4 relative overflow-hidden transition-all hover:shadow-md">
                
                <div className="w-full sm:w-28 h-28 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-2 border border-gray-100">
                  <img 
                    src={imageUrl} 
                    alt={name} 
                    className="w-full h-full object-contain"
                    onError={(e) => e.target.src='/logo.png'}
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-sm md:text-base font-bold text-gray-800 line-clamp-2 leading-snug">
                        {name}
                      </h3>
                      <button 
                        onClick={() => handleRemoveItem(realId)}
                        disabled={updatingId === realId}
                        className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                        title="ลบสินค้า"
                      >
                        {updatingId === realId ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-1 font-medium font-tech uppercase">SKU: {sku}</p>
                  </div>

                  <div className="flex items-end justify-between mt-4">
                    <div className="font-black text-lg text-emerald-600 font-tech">
                      ฿{price.toLocaleString()}
                    </div>

                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <button 
                        onClick={() => handleUpdateQty(realId, item.qty, -1)}
                        disabled={updatingId === realId}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                      >
                        <Minus size={14} strokeWidth={2.5} />
                      </button>
                      <div className="w-10 text-center text-sm font-bold text-gray-800 relative font-tech">
                        {updatingId === realId ? (
                          <Loader2 size={14} className="animate-spin mx-auto text-emerald-600" />
                        ) : (
                          item.qty || 1
                        )}
                      </div>
                      <button 
                        onClick={() => handleUpdateQty(realId, item.qty, 1)}
                        disabled={updatingId === realId}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">สรุปคำสั่งซื้อ</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm text-gray-600">
                <span>ยอดรวมสินค้า ({cartData.totalQty || 0} ชิ้น)</span>
                <span className="font-bold text-gray-800 font-tech">฿{parseSafeNumber(cartData.total).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>ค่าจัดส่ง</span>
                <span className="font-bold text-emerald-600">คำนวณในขั้นตอนถัดไป</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-gray-800">ยอดสุทธิ</span>
                <span className="text-2xl font-black text-red-600 font-tech">฿{parseSafeNumber(cartData.total).toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-gray-400 text-right mt-1">ราคานี้ยังไม่รวมค่าจัดส่งและส่วนลด (ถ้ามี)</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-6 flex items-start gap-2">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-emerald-800 leading-tight">
                <strong>รับประกันความปลอดภัย</strong><br/>
                คุณสามารถชำระเงิน ตัดยอด Wallet ขอราคาส่ง หรือขอใบกำกับภาษีได้ในขั้นตอนต่อไป
              </p>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 group"
            >
              ดำเนินการสั่งซื้อ <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Cart;