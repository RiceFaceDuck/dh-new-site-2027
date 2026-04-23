import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAuth } from 'firebase/auth'; // 🚀 นำเข้า Auth เพื่อดึง UID ลูกค้า
import { cartService } from '../firebase/cartService'; // 🚀 นำเข้า cartService
import { ChevronLeft, ShoppingCart, ShieldCheck, Truck, Package, Heart, CheckCircle2 } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🧠 SMART FETCH: 
  // ถ้ารับข้อมูลมาจากหน้า Home (location.state) จะใช้ข้อมูลนั้นทันที = ประหยัด Read 100%
  // แต่ถ้ากด Refresh หรือเข้าลิงก์ตรงๆ ถึงจะวิ่งไปดึง Database ใหม่
  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!product); // โหลดเฉพาะตอนไม่มีข้อมูล

  // ✨ State สำหรับการทำงานของปุ่มตะกร้า
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

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
            console.log("No such product!");
          }
        } catch (error) {
          console.error("Error fetching product:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, product]);

  // 🚀 ฟังก์ชันหยิบสินค้าใส่ตะกร้า
  const handleAddToCart = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    // เช็ค Login ก่อนทำรายการ
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนหยิบสินค้าใส่ตะกร้า");
      return;
    }

    setIsAdding(true);
    try {
      // เรียกใช้ Service ส่งข้อมูลเข้า Collection: carts
      await cartService.addToCart(user.uid, product, 1);
      
      // แสดงสถานะสำเร็จให้ผู้ใช้ทราบ
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2500); // กลับเป็นปุ่มปกติหลัง 2.5 วิ

    } catch (error) {
      console.error("🔥 Error add to cart:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-20 text-gray-500 font-medium">ไม่พบสินค้านี้ในระบบ</div>;
  }

  const imageUrl = product.images?.[0] || product.image || 'https://via.placeholder.com/600x600?text=DH+Notebook';

  return (
    <div className="w-full max-w-5xl mx-auto bg-white md:bg-transparent min-h-[70vh]">
      
      {/* Breadcrumb & Back Button */}
      <div className="flex items-center mb-4 md:mb-6 text-[10px] md:text-xs font-medium text-gray-500 px-4 md:px-0">
        <button onClick={() => navigate(-1)} className="flex items-center hover:text-emerald-600 mr-4 text-gray-700">
          <ChevronLeft size={16} className="mr-1" /> ย้อนกลับ
        </button>
        <span className="hidden md:inline cursor-pointer hover:text-emerald-600">หน้าแรก</span>
        <span className="hidden md:inline mx-2">/</span>
        <span className="hidden md:inline cursor-pointer hover:text-emerald-600">หมวดหมู่</span>
        <span className="hidden md:inline mx-2">/</span>
        <span className="text-emerald-600 truncate max-w-[200px]">{product.name}</span>
      </div>

      <div className="bg-white md:rounded-2xl md:shadow-[0_2px_15px_rgba(0,0,0,0.03)] border-gray-100 md:border overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 lg:gap-12 p-4 md:p-8">
          
          {/* ส่วนรูปภาพ */}
          <div className="flex flex-col gap-3">
            <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center p-4 relative">
              {product.isPartnerOnly && (
                <span className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                  เฉพาะ Partner
                </span>
              )}
              <img src={imageUrl} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
            </div>
            {/* Gallery Thumbnail (ถ้ามีภาพมากกว่า 1) */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                {product.images.map((img, idx) => (
                  <div key={idx} className="w-16 h-16 rounded-md border border-gray-200 cursor-pointer hover:border-emerald-500 flex-shrink-0 p-1 bg-white">
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ส่วนข้อมูล */}
          <div className="flex flex-col pt-4 md:pt-0">
            <div className="mb-2">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded tracking-wide">มีสินค้าพร้อมส่ง</span>
              <span className="text-[10px] text-gray-400 ml-3 font-medium">SKU: {product.sku || 'N/A'}</span>
            </div>
            
            <h1 className="text-lg md:text-xl font-bold text-gray-800 leading-snug mb-4">
              {product.name}
            </h1>

            <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
              {product.regularPrice && (
                <p className="text-xs text-gray-500 line-through mb-1">
                  ราคาปกติ ฿{product.regularPrice.toLocaleString()}
                </p>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-extrabold text-red-600">
                  ฿{product.retailPrice?.toLocaleString() || '0'}
                </span>
                <span className="text-xs text-gray-500 font-medium">/ ชิ้น</span>
              </div>
            </div>

            {/* ความน่าเชื่อถือของร้านค้า */}
            <div className="grid grid-cols-2 gap-3 mb-8 text-[11px] font-medium text-gray-600">
              <div className="flex items-center gap-2 bg-white border border-gray-100 p-2 rounded-lg">
                <ShieldCheck size={16} className="text-emerald-500" />
                รับประกันศูนย์ DH {product.warranty || '6 เดือน'}
              </div>
              <div className="flex items-center gap-2 bg-white border border-gray-100 p-2 rounded-lg">
                <Truck size={16} className="text-emerald-500" />
                จัดส่งด่วนทั่วประเทศ
              </div>
            </div>

            {/* ปุ่ม Actions */}
            <div className="flex gap-3 mt-auto">
              <button 
                onClick={handleAddToCart}
                disabled={isAdding || addSuccess}
                className={`flex-1 font-bold py-3 rounded-xl transition-all shadow-sm text-sm flex items-center justify-center gap-2 ${
                  addSuccess 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isAdding ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                ) : addSuccess ? (
                  <><CheckCircle2 size={16} strokeWidth={2.5} /> ใส่ตะกร้าแล้ว</>
                ) : (
                  <><ShoppingCart size={16} strokeWidth={2.5} /> หยิบใส่ตะกร้า</>
                )}
              </button>
              <button className="w-12 h-12 bg-white border border-gray-200 hover:border-red-200 hover:text-red-500 hover:bg-red-50 text-gray-400 rounded-xl flex items-center justify-center transition-colors">
                <Heart size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* รายละเอียดเพิ่มเติม */}
        <div className="border-t border-gray-100 p-4 md:p-8">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package size={16} className="text-emerald-600" /> รายละเอียดสินค้า
          </h3>
          <div className="text-xs md:text-sm text-gray-600 leading-relaxed space-y-3 whitespace-pre-wrap">
            {product.description || "ไม่ระบุรายละเอียดสินค้าเพิ่มเติม โปรดตรวจสอบรูปภาพหรือติดต่อแอดมิน"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;