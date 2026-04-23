import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '../firebase/config';
import { cartService } from '../firebase/cartService';
import { driveService } from '../firebase/driveService';
import { marketingService } from '../firebase/marketingService';
import { checkoutService } from '../firebase/checkoutService'; 
import { 
  ShieldCheck, Upload, CreditCard, Loader2, ArrowRight, CheckCircle2, 
  ShoppingBag, Truck, Receipt, Briefcase, Gift, AlertCircle, Coins, 
  Tag, Sparkles, Star, ChevronRight, Zap 
} from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  const [cartData, setCartData] = useState(null);
  const [freebies, setFreebies] = useState([]); 
  const [promotions, setPromotions] = useState([]); 
  const [shippingConfig, setShippingConfig] = useState({ fee: 50, freeAt: 1000 });
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // 📦 ข้อมูลจัดส่ง
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '', phone: '', address: '', logisticProvider: 'Kerry Express'
  });
  const [saveAddress, setSaveAddress] = useState(false); 

  // 🧾 ใบกำกับภาษี
  const [taxInfo, setTaxInfo] = useState({
    isRequesting: false, name: '', taxId: '', address: ''
  });

  // 🤝 B2B ขอราคาส่ง
  const [b2bInfo, setB2bInfo] = useState({
    isRequesting: false, note: '' 
  });

  // 💰 ข้อมูลทางการเงิน (Wallet & Points)
  const [walletInfo, setWalletInfo] = useState({
    isUsing: false, balance: 0, rewardPoints: 0
  });

  // 📸 สลิป
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState('');

  // ----------------------------------------------------
  // 🔄 Initialize Data
  // ----------------------------------------------------
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadData(currentUser.uid);
      } else {
        navigate('/cart');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const loadData = async (uid) => {
    try {
      const cart = await cartService.getCart(uid);
      if (!cart || cart.items?.length === 0) {
        navigate('/cart');
        return;
      }
      setCartData(cart);

      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const profile = userSnap.data();
        setUserProfile(profile);
        
        setShippingInfo({
          fullName: profile.contactName || profile.accountName || '',
          phone: profile.phone || '',
          address: profile.address || '',
          logisticProvider: profile.logisticProvider || 'Kerry Express'
        });
        setTaxInfo(prev => ({
          ...prev,
          name: profile.shopInfo?.tax?.name || '',
          taxId: profile.shopInfo?.tax?.taxId || '',
          address: profile.shopInfo?.tax?.address || ''
        }));
        
        setWalletInfo({ 
          isUsing: false, 
          balance: profile.stats?.creditBalance || profile.partnerCredit || 0,
          rewardPoints: profile.stats?.rewardPoints || 0
        });
      }

      const [fetchedFreebies, fetchedPromos, shippingSnap] = await Promise.all([
        marketingService.getActiveFreebies(),
        marketingService.getActivePromotions(),
        getDoc(doc(db, 'settings', 'shipping')) 
      ]);

      setFreebies(fetchedFreebies || []);
      setPromotions(fetchedPromos || []);
      
      if (shippingSnap.exists()) {
        setShippingConfig({
          fee: shippingSnap.data().defaultFee ?? 50,
          freeAt: shippingSnap.data().freeShippingThreshold ?? 1000
        });
      }

    } catch (error) {
      console.error("🔥 Error loading checkout data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // 🧮 Smart Calculation
  // ----------------------------------------------------
  const subTotal = cartData?.total || 0;

  // 1. คำนวณส่วนลดโปรโมชั่น
  let promoDiscount = 0;
  const appliedPromos = []; 
  
  promotions.forEach(promo => {
    // 🚀 [Bug Fix]: ใช้ Optional Chaining ป้องกัน Error กรณีโครงสร้างข้อมูลใน Firestore ไม่ครบถ้วน
    const minSpend = promo?.condition?.minSpend || promo?.minSpend || promo?.conditionValue || 0;
    
    if (subTotal >= minSpend) {
      let discountAmount = 0;
      const discountVal = Number(promo.discountValue || promo.discount || promo.value || 0);
      const discountType = promo.discountType || promo.type || 'fixed';

      if (discountType === 'percent') {
        discountAmount = subTotal * (discountVal / 100);
      } else {
        discountAmount = discountVal;
      }
      
      promoDiscount += discountAmount;
      appliedPromos.push(promo.id);
    }
  });
  
  if (promoDiscount > subTotal) promoDiscount = subTotal; 
  
  // 2. คำนวณค่าขนส่ง
  let shippingFee = subTotal >= shippingConfig.freeAt ? 0 : shippingConfig.fee;
  if (b2bInfo.isRequesting) shippingFee = 0; 
  
  // 3. ยอดรวมหลังหักโปร + ค่าส่ง
  const amountAfterPromoAndShipping = Math.max(0, subTotal - promoDiscount + shippingFee);

  // 4. คำนวณส่วนลดจากกระเป๋าเงิน (Wallet)
  const walletUsed = walletInfo.isUsing && !b2bInfo.isRequesting 
    ? Math.min(walletInfo.balance, amountAfterPromoAndShipping) 
    : 0;
  
  // 5. ยอดชำระสุทธิ
  const finalPayable = Math.max(0, amountAfterPromoAndShipping - walletUsed);

  // 6. หาของแถม
  const matchedFreebie = freebies.find(f => subTotal >= (f?.minSpend || 0));

  // ----------------------------------------------------
  // 📸 จัดการไฟล์สลิป
  // ----------------------------------------------------
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert("ขนาดไฟล์ใหญ่เกินไป (สูงสุด 5MB)");
      setSlipFile(file);
      setSlipPreview(URL.createObjectURL(file));
    }
  };

  // ----------------------------------------------------
  // 🚀 ยืนยันคำสั่งซื้อ (ผ่าน Service กลาง)
  // ----------------------------------------------------
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
      return alert("กรุณากรอกข้อมูลจัดส่งให้ครบถ้วน");
    }
    if (taxInfo.isRequesting && (!taxInfo.name || !taxInfo.taxId)) {
      return alert("กรุณากรอกชื่อและเลขผู้เสียภาษีให้ครบถ้วน");
    }
    if (!b2bInfo.isRequesting && finalPayable > 0 && !slipFile) {
      return alert("กรุณาแนบสลิปการโอนเงินเพื่อยืนยันคำสั่งซื้อ");
    }

    setIsSubmitting(true);
    try {
      let slipUrl = '';
      if (slipFile && !b2bInfo.isRequesting && finalPayable > 0) {
        slipUrl = await driveService.uploadSlipImage(slipFile);
      }

      const b2bNoteFinal = b2bInfo.note.trim() || 'ฉันเป็นร้านช่าง'; 

      const payload = {
        user,
        cartData,
        shippingInfo,
        taxInfo,
        b2bInfo: { ...b2bInfo, note: b2bNoteFinal },
        walletUsed,
        finalPayable,
        slipUrl,
        matchedFreebie,
        promoDiscount,
        shippingFee,
        appliedPromos,
        saveAddress
      };

      await checkoutService.processCheckout(payload);

      setSuccess(true);
    } catch (error) {
      console.error("🔥 Checkout Error:", error);
      alert("เกิดข้อผิดพลาดในการสั่งซื้อ: " + error.message);
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------------
  // UI: สถานะ
  // ------------------------------------------------------------------
  if (success) {
    const isB2B = b2bInfo.isRequesting;
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-12 max-w-md w-full text-center animate-in zoom-in-95 duration-500 relative overflow-hidden">
          {/* 🚀 [อัปเกรด]: UI หน้าต่าง Success แยกประเภทชัดเจน (Retail vs B2B) */}
          <div className={`absolute top-0 left-0 w-full h-2 ${isB2B ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>

          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${isB2B ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
            {isB2B ? (
              <Briefcase size={48} className="text-indigo-500" />
            ) : (
              <CheckCircle2 size={48} className="text-emerald-500" />
            )}
          </div>

          <h2 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">
            {isB2B ? 'ส่งคำขอสำเร็จ!' : 'สั่งซื้อสำเร็จ!'}
          </h2>

          {isB2B ? (
            <div className="bg-indigo-50/50 rounded-xl p-5 mb-8 border border-indigo-100">
              <p className="text-indigo-800 text-sm font-bold mb-2">บิลของคุณอยู่ในสถานะ 🚀 (Draft)</p>
              <p className="text-indigo-600 text-xs leading-relaxed">
                พนักงานกำลังตรวจสอบและประเมินราคาส่งให้คุณ <br/>
                กรุณารอตรวจสอบราคาสุทธิ และ <strong>ยืนยันการชำระเงิน</strong><br/> ที่หน้าประวัติการสั่งซื้อของคุณ
              </p>
            </div>
          ) : (
            <div className="bg-emerald-50/50 rounded-xl p-5 mb-8 border border-emerald-100">
              <p className="text-emerald-800 text-sm font-bold mb-2">เราได้รับรายการสั่งซื้อของคุณแล้ว</p>
              <p className="text-emerald-600 text-xs leading-relaxed">
                แอดมินกำลังตรวจสอบความถูกต้องของสลิป หากเรียบร้อยแล้ว<br/>สถานะในประวัติจะเปลี่ยนเป็น "ชำระเงินแล้ว กำลังจัดเตรียม"
              </p>
            </div>
          )}

          <button
            onClick={() => navigate('/profile')}
            className={`w-full text-white font-bold py-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${isB2B ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}
          >
            <Receipt size={18} /> ติดตามสถานะคำสั่งซื้อ (Profile)
          </button>
        </div>
      </div>
    );
  }

  if (loading || !cartData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
        <p className="text-sm text-gray-500 font-medium">กำลังเตรียมข้อมูลการสั่งซื้อ...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 min-h-[80vh] animate-in fade-in duration-500">
      <h1 className="text-2xl md:text-3xl font-black text-gray-800 mb-8 flex items-center gap-3">
        <ShieldCheck className="text-emerald-600" size={32} /> ยืนยันคำสั่งซื้อ (Checkout)
      </h1>

      <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* คอลัมน์ซ้าย: ข้อมูลลูกค้า */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Truck size={20} className="text-gray-400" /> การจัดส่ง
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 mb-1">ผู้ให้บริการขนส่ง (เอกชน) <span className="text-red-500">*</span></label>
                <select 
                  value={shippingInfo.logisticProvider} 
                  onChange={e => setShippingInfo({...shippingInfo, logisticProvider: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer font-medium"
                >
                  <option value="Kerry Express">Kerry Express</option>
                  <option value="Flash Express">Flash Express</option>
                  <option value="J&T Express">J&T Express</option>
                  <option value="ไปรษณีย์ไทย (EMS)">ไปรษณีย์ไทย (EMS)</option>
                  <option value="Lalamove / Grab (ในพื้นที่)">Lalamove / Grab (ในพื้นที่)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">ชื่อ-นามสกุล ผู้รับ <span className="text-red-500">*</span></label>
                <input 
                  required type="text" 
                  value={shippingInfo.fullName} 
                  onChange={e => setShippingInfo({...shippingInfo, fullName: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                <input 
                  required type="tel" 
                  value={shippingInfo.phone} 
                  onChange={e => setShippingInfo({...shippingInfo, phone: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 mb-1">ที่อยู่จัดส่งแบบละเอียด <span className="text-red-500">*</span></label>
                <textarea 
                  required rows="2" 
                  value={shippingInfo.address} 
                  onChange={e => setShippingInfo({...shippingInfo, address: e.target.value})} 
                  placeholder="บ้านเลขที่ ตำบล อำเภอ จังหวัด รหัสไปรษณีย์" 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                ></textarea>
              </div>
            </div>
            <div className="mt-4 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-start gap-3">
              <input 
                type="checkbox" 
                id="saveAddr" 
                checked={saveAddress} 
                onChange={e => setSaveAddress(e.target.checked)} 
                className="accent-emerald-600 w-4 h-4 mt-0.5 cursor-pointer" 
              />
              <label htmlFor="saveAddr" className="text-xs text-emerald-800 cursor-pointer leading-tight">
                <strong>บันทึกที่อยู่จัดส่งนี้</strong> <br/>
                เพื่อให้ระบบจดจำและดึงมาใช้อัตโนมัติในครั้งต่อไป (อัปเดตลง Profile)
              </label>
            </div>
          </div>

          {/* ขอใบกำกับภาษี */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Receipt size={18} className="text-gray-400" /> ใบกำกับภาษีเต็มรูปแบบ
              </h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={taxInfo.isRequesting} 
                  onChange={e => setTaxInfo({...taxInfo, isRequesting: e.target.checked})} 
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            {taxInfo.isRequesting && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-50 animate-in slide-in-from-top-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">ชื่อนิติบุคคล / บุคคลธรรมดา *</label>
                  <input 
                    required type="text" 
                    value={taxInfo.name} 
                    onChange={e => setTaxInfo({...taxInfo, name: e.target.value})} 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">เลขประจำตัวผู้เสียภาษี (13 หลัก) *</label>
                  <input 
                    required type="text" 
                    value={taxInfo.taxId} 
                    onChange={e => setTaxInfo({...taxInfo, taxId: e.target.value})} 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">ที่อยู่จดทะเบียน *</label>
                  <textarea 
                    required rows="1" 
                    value={taxInfo.address} 
                    onChange={e => setTaxInfo({...taxInfo, address: e.target.value})} 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs resize-none"
                  ></textarea>
                </div>
              </div>
            )}
          </div>

          {/* โหมดขอราคาส่ง (B2B) */}
          <div className={`rounded-2xl shadow-sm border p-6 transition-all ${b2bInfo.isRequesting ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-base font-bold flex items-center gap-2 ${b2bInfo.isRequesting ? 'text-indigo-800' : 'text-gray-800'}`}>
                  <Briefcase size={18} className={b2bInfo.isRequesting ? "text-indigo-500" : "text-gray-400"} /> 
                  ขออนุมัติราคาส่ง (B2B / Partner)
                </h2>
                <p className="text-[10px] text-gray-500 mt-1">ซื้อจำนวนมาก หรือรับงานซ่อมให้ลูกค้า สามารถขอปรับลดราคาพิเศษได้</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={b2bInfo.isRequesting} 
                  onChange={e => {
                    setB2bInfo({...b2bInfo, isRequesting: e.target.checked});
                    if (e.target.checked) setWalletInfo({...walletInfo, isUsing: false}); 
                  }} 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
            {b2bInfo.isRequesting && (
              <div className="mt-4 pt-4 border-t border-indigo-100/50 animate-in fade-in">
                <label className="block text-xs font-bold text-indigo-800 mb-1">หมายเหตุ / เหตุผลเพิ่มเติม (ไม่บังคับ)</label>
                <textarea 
                  rows="2" 
                  value={b2bInfo.note} 
                  onChange={e => setB2bInfo({...b2bInfo, note: e.target.value})} 
                  placeholder="หากไม่ได้ระบุ ระบบจะใช้คำว่า 'ฉันเป็นร้านช่าง'" 
                  className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none shadow-sm"
                ></textarea>
                <div className="mt-3 p-3 bg-white rounded-lg border border-indigo-100 flex items-start gap-2">
                  <AlertCircle size={16} className="text-indigo-500 shrink-0 mt-0.5"/>
                  <p className="text-[10px] md:text-xs text-indigo-700 leading-relaxed">
                    <strong>ไม่ต้องชำระเงินในขั้นตอนนี้!</strong> ระบบจะส่งคำขอของคุณไปให้พนักงานประเมิน เมื่ออนุมัติแล้ว บิลในหน้าระบบของคุณจะถูก <strong className="text-indigo-900">เปลี่ยนเป็นราคาขายส่งทันที</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ข้อมูลการชำระเงิน (ซ่อนเมื่อเปิด B2B) */}
          {!b2bInfo.isRequesting && finalPayable > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-in fade-in">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-gray-400" /> ชำระเงิน (โอนผ่านธนาคาร)
              </h2>
              
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 text-center shadow-sm">
                <p className="text-sm font-bold text-emerald-800 mb-1">ธนาคารกสิกรไทย (KBank)</p>
                <p className="text-2xl font-black text-emerald-600 tracking-wider mb-1">123-4-56789-0</p>
                <p className="text-xs text-emerald-700 font-medium">บริษัท ดีเอช โน๊ตบุ๊ค จำกัด</p>
              </div>

              <label className="block text-xs font-bold text-gray-600 mb-2 flex items-center gap-1">
                แนบหลักฐานการโอนเงิน ยอด <span className="text-red-500 text-sm mx-1">฿{finalPayable.toLocaleString()}</span> บาท <span className="text-red-500">*</span>
              </label>
              
              {slipPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
                  <img src={slipPreview} alt="Slip Preview" className="w-full max-h-64 object-contain" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition-transform">
                      คลิกเพื่อเปลี่ยนสลิป <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-emerald-200 rounded-xl bg-emerald-50/30 hover:bg-emerald-50 cursor-pointer transition-all hover:border-emerald-400 group">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                    <Upload size={18} className="text-emerald-500" />
                  </div>
                  <span className="text-sm font-bold text-emerald-700">อัปโหลดสลิปโอนเงิน</span>
                  <span className="text-[10px] text-emerald-600/70 mt-1">รองรับ JPG, PNG ไม่เกิน 5MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          )}
        </div>

        {/* คอลัมน์ขวา: สรุปออเดอร์ & โปรโมชั่น */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-1 relative overflow-hidden">
            <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-50">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-gray-800">
                <Sparkles className="text-emerald-500" size={18} /> สิทธิพิเศษสำหรับบิลนี้
              </h3>

              {promotions.length === 0 && freebies.length === 0 ? (
                 <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                   <p className="text-sm font-bold text-gray-600">วันนี้ไม่มีโปรโมชันพิเศษ 😢</p>
                   <p className="text-xs text-gray-400 mt-1">แวะมาดูใหม่ในแคมเปญถัดไปนะครับ</p>
                 </div>
              ) : (
                 <div className="space-y-3">
                   {promotions.map(promo => {
                     const isApplied = appliedPromos.includes(promo.id);
                     const minSpend = promo.minSpend || promo.conditionValue || 0;
                     const lackAmount = minSpend - subTotal;
                     
                     return (
                       <div key={promo.id} className={`relative p-3.5 rounded-xl border transition-all overflow-hidden ${isApplied ? 'bg-white border-emerald-200 shadow-sm' : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 shadow-md animate-[pulse_3s_ease-in-out_infinite]'}`}>
                         {!isApplied && <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 animate-[shimmer_2.5s_infinite]"></div>}
                         
                         <div className="flex justify-between items-start relative z-10">
                           <div className="flex-1 pr-2">
                             <p className={`text-xs font-bold flex items-center gap-1.5 ${isApplied ? 'text-gray-800' : 'text-orange-900'}`}>
                               <Tag size={14} className={isApplied ? "text-emerald-500" : "text-orange-500"} /> {promo.title}
                             </p>
                             {promo.description && <p className={`text-[10px] mt-1 ${isApplied ? 'text-gray-500' : 'text-orange-700/80'}`}>{promo.description}</p>}
                           </div>
                           
                           {isApplied ? (
                             <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-1 rounded-md flex items-center gap-1 shrink-0 border border-emerald-200">
                               <CheckCircle2 size={12} /> กำลังใช้งาน
                             </span>
                           ) : (
                             <div className="text-right shrink-0">
                               <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-sm border border-orange-400 block whitespace-nowrap">
                                 ซื้อเพิ่ม ฿{lackAmount.toLocaleString()}
                               </span>
                               <span className="text-[8px] text-orange-600 font-bold block mt-1">เพื่อรับส่วนลด</span>
                             </div>
                           )}
                         </div>
                       </div>
                     );
                   })}

                   {freebies.map(freebie => {
                     const isApplied = subTotal >= (freebie.minSpend || 0);
                     const lackAmount = (freebie.minSpend || 0) - subTotal;
                     return (
                       <div key={freebie.id} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${isApplied ? 'bg-white border-emerald-200 shadow-sm' : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 shadow-md'}`}>
                         <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${isApplied ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-orange-100'}`}>
                            {freebie.image ? <img src={freebie.image} alt={freebie.title} className="w-full h-full object-contain p-1" /> : <Gift size={20} className={isApplied ? "text-emerald-500" : "text-orange-400"} />}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold truncate ${isApplied ? 'text-gray-800' : 'text-orange-900'}`}>{freebie.title}</p>
                            <p className={`text-[10px] mt-0.5 font-medium ${isApplied ? "text-emerald-600" : "text-orange-700/80"}`}>ของแถมฟรี มูลค่า ฿{freebie.value || 0}</p>
                         </div>
                         {isApplied ? (
                           <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-1 rounded-md flex items-center gap-1 shrink-0 border border-emerald-200">
                             <CheckCircle2 size={12} /> ได้รับสิทธิ์
                           </span>
                         ) : (
                           <div className="text-right shrink-0">
                             <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-sm border border-orange-400 block whitespace-nowrap">
                               ซื้อเพิ่ม ฿{lackAmount.toLocaleString()}
                             </span>
                             <span className="text-[8px] text-orange-600 font-bold block mt-1">เพื่อรับของแถม</span>
                           </div>
                         )}
                       </div>
                     );
                   })}
                 </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-4 border-b border-gray-100 flex items-center gap-2">
              <ShoppingBag size={20} className="text-gray-400" /> สรุปคำสั่งซื้อ
            </h2>
            
            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {cartData.items.map((item) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-100 p-1 flex-shrink-0">
                    <img src={item.image || 'https://via.placeholder.com/100'} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight">{item.name}</p>
                    <p className="text-[10px] text-gray-500 mt-1">จำนวน: {item.qty} ชิ้น</p>
                  </div>
                  <div className="text-sm font-black text-gray-800 whitespace-nowrap pt-1">
                    ฿{(item.price * item.qty).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {!b2bInfo.isRequesting && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Star className="text-amber-500" size={16} />
                    <div>
                      <p className="text-xs font-bold text-gray-700">แต้มสะสม (Credit Points)</p>
                      <p className="text-[9px] text-gray-500 mt-0.5">ใช้สำหรับแลกสิทธิพิเศษหน้าร้านค้า</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-amber-600">{walletInfo.rewardPoints.toLocaleString()}</span>
                    <span className="text-[10px] text-amber-600 font-bold ml-1">Pts</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Coins className="text-emerald-600" size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">ยอดค้างในระบบ (Wallet)</p>
                      <p className="text-[10px] text-emerald-600 font-bold">คงเหลือ: ฿{walletInfo.balance.toLocaleString()}</p>
                    </div>
                  </div>
                  {walletInfo.balance > 0 ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={walletInfo.isUsing} 
                        onChange={e => setWalletInfo({...walletInfo, isUsing: e.target.checked})} 
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  ) : (
                    <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-1 rounded font-medium">ไม่มียอด</span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-gray-600">
                <span>ยอดรวมสินค้า</span>
                <span className="font-bold text-gray-800">฿{subTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-emerald-600 flex items-center gap-1"><Tag size={14}/> ส่วนลดโปรโมชัน</span>
                <span className={`font-bold ${promoDiscount > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {promoDiscount > 0 ? `-฿${promoDiscount.toLocaleString()}` : '฿0'}
                </span>
              </div>

              {!b2bInfo.isRequesting && (
                <div className="flex justify-between text-sm">
                  <span className="text-amber-600 flex items-center gap-1"><Coins size={14}/> ตัดยอด Wallet</span>
                  <span className={`font-bold ${walletUsed > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {walletUsed > 0 ? `-฿${walletUsed.toLocaleString()}` : '฿0'}
                  </span>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span className="flex items-center gap-1"><Truck size={14}/> ค่าจัดส่ง</span>
                  <span className="font-bold text-gray-800">
                    {b2bInfo.isRequesting ? (
                       <span className="text-indigo-500 text-[11px] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">รอประเมิน</span>
                    ) : shippingFee === 0 ? (
                       <span className="text-emerald-600 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded text-[10px] uppercase font-black">ส่งฟรี!</span>
                    ) : (
                       `฿${shippingFee.toLocaleString()}`
                    )}
                  </span>
                </div>
                {shippingConfig.fee > 0 && shippingFee > 0 && !b2bInfo.isRequesting && (
                  <div className="text-[10px] text-orange-600 text-right mt-1.5 font-bold bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-md inline-block float-right shadow-sm">
                    <Zap size={10} className="inline mr-1 text-orange-500" />
                    ซื้อเพิ่มอีก <span className="text-orange-700">฿{(shippingConfig.freeAt - (subTotal - promoDiscount)).toLocaleString()}</span> ได้รับสิทธิ์ส่งฟรี!
                  </div>
                )}
                <div className="clear-both"></div>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-gray-800">ยอดชำระสุทธิ</span>
                <div className="text-right">
                   <span className={`text-3xl font-black block leading-none ${b2bInfo.isRequesting ? 'text-indigo-600 text-2xl' : 'text-red-600'}`}>
                     {b2bInfo.isRequesting ? 'รอพนักงานสรุป' : `฿${finalPayable.toLocaleString()}`}
                   </span>
                   {promoDiscount > 0 && !b2bInfo.isRequesting && (
                     <span className="text-[10px] text-emerald-600 font-bold mt-1 block">ประหยัดไป ฿{promoDiscount.toLocaleString()}</span>
                   )}
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || (!b2bInfo.isRequesting && finalPayable > 0 && !slipFile)}
              className={`w-full text-white font-bold py-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed ${b2bInfo.isRequesting ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> กำลังประมวลผล...</>
              ) : b2bInfo.isRequesting ? (
                <><Briefcase size={18} /> ส่งคำขอราคาส่ง B2B <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              ) : (
                <><CheckCircle2 size={18} /> ยืนยันคำสั่งซื้อ ฿{finalPayable.toLocaleString()}</>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default Checkout;