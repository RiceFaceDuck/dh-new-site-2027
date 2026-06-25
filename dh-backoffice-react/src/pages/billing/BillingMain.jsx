import React, { useState, useEffect } from 'react';
import BillingDashboard from '../../components/billing/BillingDashboard';
import PosSystem from '../../components/billing/PosSystem';
import { inventoryService } from '../../firebase/inventoryService';
import { useCustomerData } from '../Customers/hooks/useCustomerData';

const BillingMain = ({ isSelectorMode = false, onCancelSelector }) => {
  const [viewMode, setViewMode] = useState('dashboard');
  const [draftOrder, setDraftOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  
  // Use customer hook for fetching customers
  const { customers, loading: isCustomersLoading } = useCustomerData();

  // Products array is no longer pre-fetched to save Firebase reads
  // PosSystem will fetch dynamically via server-side search
  useEffect(() => {
    // Kept empty to maintain component structure if needed
  }, [viewMode]);

  if (viewMode === 'pos') {
    return (
      <div className="h-full overflow-hidden relative">
         {(isProductsLoading || isCustomersLoading) && (
           <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D51C39]"></div>
           </div>
         )}
         <PosSystem 
           products={products} 
           customers={customers}
           onSwitchView={() => setViewMode('dashboard')} 
           initialDraft={draftOrder} 
         />
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden w-full max-w-full mx-auto">
      <BillingDashboard 
        onSwitchView={() => { setDraftOrder(null); setViewMode('pos'); }} 
        onResumeDraft={(draft) => { setDraftOrder(draft); setViewMode('pos'); }}
        isSelectorMode={isSelectorMode}
        onCancelSelector={onCancelSelector}
      />
    </div>
  );
};

export default BillingMain;
