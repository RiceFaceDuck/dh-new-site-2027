import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../hooks/useCart';
import { submitOrder, createWholesaleRequest } from '../../../firebase/checkoutService';
import { auth } from '../../../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useWalletBalance } from '../../../firebase/walletService';
import { driveService } from '../../../firebase/driveService';

export function useCheckoutLogic() {
  const navigate = useNavigate();
  const { cartItems, totals, clearCart, checkoutState: contextCheckoutState } = useCart();
  const [user, setUser] = useState(null);

  const { walletBalance: creditBalance, loading: creditLoading } = useWalletBalance(user?.uid);
  const [useCreditToggle, setUseCreditToggle] = useState(false);

  const [checkoutState, setCheckoutState] = useState({
    customerData: null,
    taxData: null,
    paymentMethod: 'transfer',
    shippingCost: 0,
    appliedPromotions: contextCheckoutState?.appliedPromotions || [],
    discountAmount: contextCheckoutState?.discountAmount || 0,
    qualifiedFreebies: contextCheckoutState?.qualifiedFreebies || [],
    useWallet: 0,
    wholesaleReason: '',
  });

  // Sync external changes (like async freebie evaluation) into the local checkout state
  useEffect(() => {
    setCheckoutState(prev => {
      const newFreebies = contextCheckoutState?.qualifiedFreebies || [];
      const newPromos = contextCheckoutState?.appliedPromotions || [];
      const newDiscount = contextCheckoutState?.discountAmount || 0;
      
      if (
        JSON.stringify(prev.qualifiedFreebies) === JSON.stringify(newFreebies) &&
        JSON.stringify(prev.appliedPromotions) === JSON.stringify(newPromos) &&
        prev.discountAmount === newDiscount
      ) {
        return prev;
      }
      
      return {
        ...prev,
        qualifiedFreebies: newFreebies,
        appliedPromotions: newPromos,
        discountAmount: newDiscount
      };
    });
  }, [contextCheckoutState?.qualifiedFreebies, contextCheckoutState?.appliedPromotions, contextCheckoutState?.discountAmount]);

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
      const totalPromoDiscount = checkoutState.appliedPromotions?.reduce((sum, p) => sum + (p.discountValue || 0), 0) || 0;
      
      const currentNetBeforeCredit = 
        (totals?.subtotal || 0) + 
        (checkoutState.shippingCost || 0) - 
        (checkoutState.discountAmount || 0) -
        totalPromoDiscount;

      const maxApplicableWallet = Math.min(creditBalance, Math.max(0, currentNetBeforeCredit));
      
      setCheckoutState(prev => ({ ...prev, useWallet: maxApplicableWallet }));
    } else {
      setCheckoutState(prev => ({ ...prev, useWallet: 0 }));
    }
  }, [useCreditToggle, creditBalance, totals, checkoutState.shippingCost, checkoutState.discountAmount]);

  const validateOrder = () => {
    const data = checkoutState.customerData;
    if (!data || !data.fullName || data.fullName.length < 2 || !data.phone || data.phone.length < 10 || !data.address || data.address.length < 10) {
      setErrorMessage('กรุณาระบุข้อมูลผู้รับและที่อยู่จัดส่งให้ครบถ้วน');
      return false;
    }
    
    if (checkoutState.paymentMethod === 'transfer' && !slipUrl) {
      setErrorMessage('กรุณาแนบสลิปหลักฐานการโอนเงิน');
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
      let uploadedSlipUrl = null;
      if (slipUrl && typeof slipUrl === 'object' && slipUrl instanceof File) {
        uploadedSlipUrl = await driveService.uploadSlipImage(slipUrl);
      } else if (slipUrl) {
        uploadedSlipUrl = slipUrl; // Fallback in case it's already a string URL
      }

      const result = await submitOrder(
        user,
        cartItems,
        checkoutState,
        totals,
        uploadedSlipUrl,
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
