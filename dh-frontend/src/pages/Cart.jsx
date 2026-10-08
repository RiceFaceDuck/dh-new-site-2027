import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronLeft } from 'lucide-react';
import { useCartLogic } from '../hooks/useCartLogic';
import { useAuth } from '../context/AuthContext';

import CartEmptyState from '../components/cart/CartEmptyState';
import CartFreebieProgress from '../components/cart/CartFreebieProgress';
import CartItemCard from '../components/cart/CartItemCard';
import CartSummaryPanel from '../components/cart/CartSummaryPanel';
import CartActivePromotions from '../components/cart/CartActivePromotions';
import CartSkeleton from '../components/cart/CartSkeleton';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import LoginRequiredModal from '../components/cart/LoginRequiredModal';

const Cart = () => {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const {
    user: logicUser,
    cartItems,
    totals,
    subTotal,
    promoDiscount,
    netTotal,
    earnedPoints,
    isInitialized,
    updatingId,
    itemErrors,
    isValidCart,
    isValidatingCart,
    itemToDelete,
    setItemToDelete,
    productCache,
    checkoutState,
    updateCheckoutConfig,
    handleUpdateQty,
    handleRemoveItem,
    handlePromotionsEvaluated,
    handleProceedToCheckout
  } = useCartLogic();

  const effectiveUser = currentUser || logicUser;

  // 🔔 ซิงค์สถานะ Popup กับการล็อกอินอัตโนมัติ:
  useEffect(() => {
    // 1. กำลังเช็ค Auth จาก Firebase -> รอ ห้ามเพิ่งเด้ง
    if (authLoading) return;

    // 2. ถ้าล็อกอินแล้ว -> ปิด Popup ทันที 100%
    if (effectiveUser) {
      setIsLoginModalOpen(false);
      return;
    }

    // 3. ถ้าโหลดข้อมูลเสร็จแล้ว และยังไม่ได้ล็อกอิน -> เด้ง Popup แจ้งเตือน
    if (isInitialized && !effectiveUser) {
      setIsLoginModalOpen(true);
    }
  }, [isInitialized, effectiveUser, authLoading]);

  const handleCheckoutClick = () => {
    if (!effectiveUser) {
      setIsLoginModalOpen(true);
      return;
    }
    handleProceedToCheckout();
  };

  const handleGoToLogin = () => {
    setIsLoginModalOpen(false);
    navigate('/profile?tab=login&returnUrl=/cart', { state: { returnUrl: '/cart' } });
  };

  if (!isInitialized) {
    return <CartSkeleton />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-4 relative">
        <CartEmptyState />
      </div>
    );
  }

  const cartData = {
    items: cartItems,
    total: totals.subtotal,
    totalQty: totals.count
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-8 min-h-[80vh] animate-in fade-in duration-500 relative">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-3 font-tech uppercase tracking-tight">
          <ShoppingBag className="text-emerald-600" size={28} strokeWidth={2.5} /> 
          Purchase Order <span className="text-lg text-gray-400 font-medium">({totals.count || 0} Units)</span>
        </h1>
        <button onClick={() => navigate(-1)} className="flex items-center text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> เลือกซื้อสินค้าต่อ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item, index) => {
            const id = (item.id && item.id !== '-') ? item.id : item.sku;
            const fresh = productCache[id];
            const maxQty = fresh ? fresh.stockQuantity : null;

            return (
              <CartItemCard 
                key={item.id || index}
                item={item}
                index={index}
                updatingId={updatingId}
                itemError={itemErrors[id]}
                maxQty={maxQty}
                onUpdateQty={handleUpdateQty}
                onRemoveItem={handleRemoveItem}
              />
            );
          })}

          <div className="mt-4 mb-4">
            <CartFreebieProgress 
              subTotal={subTotal} 
              cartItems={cartItems} 
              checkoutState={checkoutState}
              updateCheckoutConfig={updateCheckoutConfig}
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <CartSummaryPanel 
            cartData={cartData}
            currentUser={effectiveUser}
            subTotal={subTotal}
            netTotal={netTotal}
            promoDiscount={promoDiscount}
            earnedPoints={earnedPoints}
            isValidCart={isValidCart}
            isValidating={isValidatingCart}
            onCheckout={handleCheckoutClick}
            promotionsElement={
              <CartActivePromotions 
                cartItems={cartItems} 
                subTotal={subTotal} 
                user={effectiveUser} 
                onPromotionsEvaluated={handlePromotionsEvaluated} 
              />
            }
          />
        </div>
      </div>

      <ConfirmDeleteModal 
        isOpen={!!itemToDelete}
        itemName={itemToDelete?.name}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => handleRemoveItem(itemToDelete?.id)}
      />

      <LoginRequiredModal 
        isOpen={isLoginModalOpen && !effectiveUser}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleGoToLogin}
      />
    </div>
  );
};

export default Cart;