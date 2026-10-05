import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { auth } from '../../../firebase/config';
import { userService } from '../../../firebase/userService';
import { inventoryService } from '../../../firebase/inventoryService';
import { warrantyService } from '../../../firebase/warrantyService';

export function useClaimDetailData(selectedRequest, initialCustomerProfile = null, initialWarrantyConfig = null) {
  const { profile: authProfile, isManagerOrOwner, canApproveRefund } = useAuth();
  const [userProfile, setUserProfile] = useState(authProfile || null);
  const [customerProfile, setCustomerProfile] = useState(initialCustomerProfile || null);
  const [warrantyConfig, setWarrantyConfig] = useState(initialWarrantyConfig || null);
  const [itemProduct, setItemProduct] = useState(null);
  const [swapProduct, setSwapProduct] = useState(null);

  useEffect(() => {
    if (!selectedRequest) return;
    const payload = selectedRequest.payload || {};
    const customerUid = payload.customerUid;

    // 1. Customer Profile (use preloaded if available)
    if (initialCustomerProfile) {
      setCustomerProfile(initialCustomerProfile);
    } else if (customerUid && customerUid !== 'Walk-in' && !customerUid.includes('WALK-IN')) {
      userService.getUserProfile(customerUid)
        .then(setCustomerProfile)
        .catch(console.error);
    } else {
      setCustomerProfile(null);
    }

    // 2. Original Item Product (for realtime stock math)
    const sku = payload.sku;
    if (sku) {
      inventoryService.getProductBySku(sku)
        .then(setItemProduct)
        .catch(console.error);
    } else {
      setItemProduct(null);
    }

    // 3. Swap Item Product (for swap claim realtime stock math)
    const swapSku = payload.swapSku;
    if (swapSku) {
      inventoryService.getProductBySku(swapSku)
        .then(setSwapProduct)
        .catch(console.error);
    } else {
      setSwapProduct(null);
    }

    // 4. Warranty Settings
    if (initialWarrantyConfig) {
      setWarrantyConfig(initialWarrantyConfig);
    } else {
      warrantyService.getWarrantySettings()
        .then(setWarrantyConfig)
        .catch(console.error);
    }
  }, [selectedRequest, initialCustomerProfile, initialWarrantyConfig]);

  useEffect(() => {
    if (authProfile) {
      setUserProfile(authProfile);
    } else if (auth.currentUser) {
      userService.getUserProfile(auth.currentUser.uid)
        .then(setUserProfile)
        .catch(console.error);
    }
  }, [authProfile]);

  // RBAC Manager Gatekeeper
  const isManager = !!(
    canApproveRefund ||
    (isManagerOrOwner && isManagerOrOwner()) ||
    ['admin', 'แอดมิน', 'manager', 'owner', 'ผู้จัดการ', 'เจ้าของ'].includes((userProfile?.role || '').toLowerCase()) ||
    (userProfile?.roles && userProfile.roles.some(r => ['admin', 'manager', 'owner'].includes(String(r).toLowerCase())))
  );

  return {
    customerProfile,
    itemProduct,
    swapProduct,
    warrantyConfig,
    userProfile,
    isManager,
    canApproveRefund
  };
}
