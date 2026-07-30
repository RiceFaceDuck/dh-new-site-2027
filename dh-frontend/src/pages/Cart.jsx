import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ChevronLeft } from 'lucide-react';
import { useCartLogic } from '../hooks/useCartLogic';

import CartEmptyState from '../components/cart/CartEmptyState';
import CartFreebieProgress from '../components/cart/CartFreebieProgress';
import CartItemCard from '../components/cart/CartItemCard';
import CartSummaryPanel from '../components/cart/CartSummaryPanel';
import CartActivePromotions from '../components/cart/CartActivePromotions';
import CartSkeleton from '../components/cart/CartSkeleton';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';

const Cart = () => {
  const navigate = useNavigate();
  const {
    user,
    cartItems,
    totals,
    subTotal,
    promoDiscount,
    netTotal,
    earnedPoints,
    isInitialized,
    updatingId,
    freebies,
    isFetchingFreebies,
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

      {!user && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-blue-800">คุณยังไม่ได้เข้าสู่ระบบ</h3>
            <p className="text-sm text-blue-600">เข้าสู่ระบบตอนนี้เพื่อสะสมแต้มและรับสิทธิพิเศษมากมาย</p>
          </div>
          <Link to="/profile" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
            เข้าสู่ระบบ
          </Link>
        </div>
      )}

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
              freebies={freebies} 
              subTotal={subTotal} 
              isLoading={isFetchingFreebies} 
              cartItems={cartItems} 
              checkoutState={checkoutState}
              updateCheckoutConfig={updateCheckoutConfig}
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <CartSummaryPanel 
            cartData={cartData}
            currentUser={user}
            subTotal={subTotal}
            netTotal={netTotal}
            promoDiscount={promoDiscount}
            earnedPoints={earnedPoints}
            isValidCart={isValidCart}
            isValidating={isValidatingCart}
            onCheckout={handleProceedToCheckout}
            promotionsElement={
              <CartActivePromotions 
                cartItems={cartItems} 
                subTotal={subTotal} 
                user={user} 
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
    </div>
  );
};

export default Cart;