import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../hooks/useCart';
import { submitOrder, createWholesaleRequest } from '../../../firebase/checkoutService';
import { auth } from '../../../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useWalletBalance } from '../../../firebase/walletService';

export function useCheckoutLogic() {
  const navigate = useNavigate();
  const { cartItems, totals, clearCart } = useCart();
  const [user, setUser] = useState(null);

  const { balance: creditBalance, loading: creditLoading } = useWalletBalance(user?.uid);
  const [useCreditToggle, setUseCreditToggle] = useState(false);

  const [checkoutState, setCheckoutState] = useState({
    customerData: null,
    taxData: null,
    paymentMethod: 'transfer',
    shippingCost: 0,
    appliedPromotions: [],
    discountAmount: 0,
    usePoints: 0,
    useWallet: 0,
    wholesaleReason: '',
  });

  const [slipUrl, setSlipUrl] = useState(null);
  const [saveProfile, setSaveProfile] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderResult, setOrderResult] = useState(null);
  const [isWholesaleModalOpen, setIsWholesaleModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/profile?tab=login', { state: { returnUrl: '/checkout' } });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!orderResult && (!cartItems || cartItems.length === 0)) {
      navigate('/cart');
    }
  }, [cartItems, orderResult, navigate]);

  const handleUpdateCheckoutState = (key, value) => {
    setCheckoutState((prev) => ({ ...prev, [key]: value }));
    if (errorMessage) setErrorMessage('');
  };

  useEffect(() => {
    if (useCreditToggle && creditBalance > 0) {
      const currentNetBeforeCredit = 
        (totals?.subtotal || 0) + 
        (checkoutState.shippingCost || 0) - 
        (checkoutState.discountAmount || 0);

      const maxApplicablePoints = Math.min(creditBalance, Math.max(0, currentNetBeforeCredit));
      
      setCheckoutState(prev => ({ ...prev, usePoints: maxApplicablePoints }));
    } else {
      setCheckoutState(prev => ({ ...prev, usePoints: 0 }));
    }
  }, [useCreditToggle, creditBalance, totals, checkoutState.shippingCost, checkoutState.discountAmount]);

  const validateOrder = () => {
    if (!checkoutState.customerData) {
      setErrorMessage('กรุณาระบุที่อยู่สำหรับจัดส่งสินค้า');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateOrder()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await submitOrder(
        user,
        cartItems,
        checkoutState,
        totals,
        slipUrl,
        saveProfile
      );

      if (result.success) {
        clearCart();
        setOrderResult(result);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error("Order Error:", error);
      setErrorMessage(error.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitWholesale = async (reasonText) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setIsWholesaleModalOpen(false);

    try {
      const updatedState = { ...checkoutState, wholesaleReason: reasonText };
      
      const result = await createWholesaleRequest(
        user,
        cartItems,
        updatedState,
        totals
      );

      if (result.success) {
        clearCart();
        setOrderResult({ ...result, isWholesale: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error("Wholesale Request Error:", error);
      setErrorMessage(error.message || 'เกิดข้อผิดพลาดในการส่งคำขอราคาส่ง');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    user,
    cartItems,
    totals,
    creditBalance,
    creditLoading,
    useCreditToggle,
    setUseCreditToggle,
    checkoutState,
    handleUpdateCheckoutState,
    slipUrl,
    setSlipUrl,
    saveProfile,
    setSaveProfile,
    isSubmitting,
    errorMessage,
    orderResult,
    isWholesaleModalOpen,
    setIsWholesaleModalOpen,
    handlePlaceOrder,
    handleSubmitWholesale
  };
}
