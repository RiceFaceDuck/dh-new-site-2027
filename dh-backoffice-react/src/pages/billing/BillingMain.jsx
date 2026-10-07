import { useState, useEffect } from 'react';
import BillingDashboard from '../../components/billing/BillingDashboard';
import PosSystem from '../../components/billing/PosSystem';
import { useCustomerData } from '../Customers/hooks/useCustomerData';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';

// Scoped subcomponent to prevent customer directory reads on Order List Dashboard
const PosViewWrapper = ({ onSwitchView, initialDraft, resumeTabId, isNewBillRequest, onNewBillHandled }) => {
  const { customers, loading: isCustomersLoading } = useCustomerData();

  return (
    <div className="h-full overflow-hidden relative">
      {isCustomersLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D51C39]"></div>
        </div>
      )}
      <PosSystem 
        customers={customers}
        onSwitchView={onSwitchView} 
        initialDraft={initialDraft} 
        resumeTabId={resumeTabId}
        isNewBillRequest={isNewBillRequest}
        onNewBillHandled={onNewBillHandled}
      />
    </div>
  );
};

const BillingMain = ({ isSelectorMode = false, onCancelSelector }) => {
  const [viewMode, setViewMode] = useState('dashboard');
  const [draftOrder, setDraftOrder] = useState(null);
  const [isNewBillRequest, setIsNewBillRequest] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const resumeTabId = location.state?.resumeTabId;
  const initialDraft = location.state?.initialDraft;
  const newBill = location.state?.newBill;

  // Sync POS view state to AdminLayout & FloatingMiniCart
  useEffect(() => {
    const isPos = viewMode === 'pos';
    if (typeof window !== 'undefined') {
      window.__DH_IS_POS_OPEN__ = isPos;
      window.dispatchEvent(new CustomEvent('dh_pos_view_change', { detail: { isPosOpen: isPos } }));
    }
    if (outletContext?.setIsPosOpen) {
      outletContext.setIsPosOpen(isPos);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.__DH_IS_POS_OPEN__ = false;
        window.dispatchEvent(new CustomEvent('dh_pos_view_change', { detail: { isPosOpen: false } }));
      }
      if (outletContext?.setIsPosOpen) {
        outletContext.setIsPosOpen(false);
      }
    };
  }, [viewMode, outletContext]);

  // React to react-router location state
  useEffect(() => {
    if (newBill) {
      setDraftOrder(null);
      setIsNewBillRequest(true);
      setViewMode('pos');
    } else if (initialDraft) {
      setDraftOrder(initialDraft);
      setIsNewBillRequest(false);
      setViewMode('pos');
    } else if (resumeTabId) {
      setViewMode('pos');
    }
  }, [resumeTabId, initialDraft, newBill, location.state]);

  // React to global window CustomEvents ('dh_open_new_bill', 'dh_resume_draft')
  useEffect(() => {
    const handleOpenNewBill = () => {
      setDraftOrder(null);
      setIsNewBillRequest(true);
      setViewMode('pos');
    };
    const handleResumeDraft = (e) => {
      if (e.detail) {
        setDraftOrder(e.detail);
        setIsNewBillRequest(false);
        setViewMode('pos');
      }
    };

    window.addEventListener('dh_open_new_bill', handleOpenNewBill);
    window.addEventListener('dh_resume_draft', handleResumeDraft);
    return () => {
      window.removeEventListener('dh_open_new_bill', handleOpenNewBill);
      window.removeEventListener('dh_resume_draft', handleResumeDraft);
    };
  }, []);

  if (viewMode === 'pos') {
    return (
      <PosViewWrapper 
        onSwitchView={() => { 
          setDraftOrder(null); 
          setIsNewBillRequest(false); 
          setViewMode('dashboard'); 
          navigate(location.pathname, { replace: true, state: {} });
        }}
        initialDraft={draftOrder}
        resumeTabId={resumeTabId}
        isNewBillRequest={isNewBillRequest}
        onNewBillHandled={() => setIsNewBillRequest(false)}
      />
    );
  }

  return (
    <div className="h-full overflow-hidden w-full max-w-full mx-auto">
      <BillingDashboard 
        onSwitchView={() => { setDraftOrder(null); setIsNewBillRequest(true); setViewMode('pos'); }} 
        onResumeDraft={(draft) => { setDraftOrder(draft); setIsNewBillRequest(false); setViewMode('pos'); }}
        isSelectorMode={isSelectorMode}
        onCancelSelector={onCancelSelector}
      />
    </div>
  );
};

export default BillingMain;
