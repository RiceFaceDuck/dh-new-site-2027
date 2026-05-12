import React, { useState } from 'react';
import BillingDashboard from '../../components/billing/BillingDashboard';
import PosSystem from '../../components/billing/PosSystem';

const BillingMain = () => {
  const [viewMode, setViewMode] = useState('dashboard');
  const [draftOrder, setDraftOrder] = useState(null);

  if (viewMode === 'pos') {
    return (
      <div className="h-[calc(100vh-64px)] overflow-hidden">
         <PosSystem onSwitchView={() => setViewMode('dashboard')} initialDraft={draftOrder} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden w-full max-w-full mx-auto">
      <BillingDashboard 
        onSwitchView={() => { setDraftOrder(null); setViewMode('pos'); }} 
        onResumeDraft={(draft) => { setDraftOrder(draft); setViewMode('pos'); }}
      />
    </div>
  );
};

export default BillingMain;
