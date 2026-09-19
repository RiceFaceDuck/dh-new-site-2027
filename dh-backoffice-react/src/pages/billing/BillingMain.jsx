import { useState, useEffect } from 'react';
import BillingDashboard from '../../components/billing/BillingDashboard';
import PosSystem from '../../components/billing/PosSystem';
import { useCustomerData } from '../Customers/hooks/useCustomerData';
import { useLocation } from 'react-router-dom';

// Scoped subcomponent to prevent customer directory reads on Order List Dashboard
const PosViewWrapper = ({ onSwitchView, initialDraft, resumeTabId, products, isProductsLoading }) => {
  const { customers, loading: isCustomersLoading } = useCustomerData();

  return (
    <div className="h-full overflow-hidden relative">
      {(isProductsLoading || isCustomersLoading) && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D51C39]"></div>
        </div>
      )}
      <PosSystem 
        products={products} 
        customers={customers}
        onSwitchView={onSwitchView} 
        initialDraft={initialDraft} 
        resumeTabId={resumeTabId}
      />
    </div>
  );
};

const BillingMain = ({ isSelectorMode = false, onCancelSelector }) => {
  const [viewMode, setViewMode] = useState('dashboard');
  const [draftOrder, setDraftOrder] = useState(null);
  const [products] = useState([]);
  const [isProductsLoading] = useState(false);
  
  const location = useLocation();
  const resumeTabId = location.state?.resumeTabId;

  useEffect(() => {
    if (resumeTabId) {
      setViewMode('pos');
    }
  }, [resumeTabId]);

  if (viewMode === 'pos') {
    return (
      <PosViewWrapper 
        products={products}
        isProductsLoading={isProductsLoading}
        onSwitchView={() => { setDraftOrder(null); setViewMode('dashboard'); }}
        initialDraft={draftOrder}
        resumeTabId={resumeTabId}
      />
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
