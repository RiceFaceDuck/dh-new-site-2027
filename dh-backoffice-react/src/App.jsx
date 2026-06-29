import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Clock, Loader2 } from 'lucide-react' 

import { AuthProvider, useAuth } from './contexts/AuthContext'
import ManagerRoute from './components/routing/ManagerRoute'
import AdminLayout from './layouts/AdminLayout'
import { ErrorBoundary } from './components/ErrorBoundary.jsx' 

// 🚀 Lazy Load Components for Performance
const Overview = lazy(() => import('./pages/dashboard/Overview'))
const Search = lazy(() => import('./pages/dashboard/Search'))
const Login = lazy(() => import('./pages/auth/Login'))
const ProfileSetup = lazy(() => import('./pages/settings/ProfileSetup'))
const Inventory = lazy(() => import('./pages/inventory/InventoryMain'))
const Todo = lazy(() => import('./pages/Todo'))
const TodoArchive = lazy(() => import('./pages/todo/TodoArchive'))
const ManagersOverview = lazy(() => import('./pages/ManagersOverview/index'))
const Customers = lazy(() => import('./pages/Customers')) 
const HistoryPage = lazy(() => import('./pages/History/index.jsx')) 
const BillingMain = lazy(() => import('./pages/billing/BillingMain'))
const ClaimMain = lazy(() => import('./pages/claims/ClaimMain')) 
const GalleryMain = lazy(() => import('./pages/gallery/GalleryMain')) 
const EmailMain = lazy(() => import('./pages/emails/EmailMain'))
const CalendarPage = lazy(() => import('./pages/Calendar'))

// 🔒 Managers Lazy Components
const StockAdjustment = lazy(() => import('./pages/managers/inventory/StockAdjustment'))
const PromotionManagement = lazy(() => import('./pages/managers/PromotionManagement'))
const PricingSettings = lazy(() => import('./pages/managers/PricingSettings'))
const StaffManagement = lazy(() => import('./pages/managers/StaffManagement'))
const FreebieManagement = lazy(() => import('./pages/managers/FreebieManagement'))
const CreditDashboard = lazy(() => import('./pages/managers/CreditDashboard/index.jsx'))
const WalletManagement = lazy(() => import('./pages/managers/WalletManagement'))
const ShippingManagement = lazy(() => import('./pages/managers/settings/shipping/ShippingManagement'))
const AdManagement = lazy(() => import('./pages/managers/AdManagement'))
const PartnerSettings = lazy(() => import('./pages/managers/PartnerSettings'))
const RefundManagement = lazy(() => import('./pages/managers/RefundManagement'))

// ⚙️ Global Settings Lazy Components
const GlobalBufferSettings = lazy(() => import('./pages/managers/settings/inventory/GlobalBufferSettings'))
const GlobalCategorySettings = lazy(() => import('./pages/managers/GlobalCategorySettings'))
const GlobalRegexSettings = lazy(() => import('./pages/managers/GlobalRegexSettings'))
const GlobalWarrantySettings = lazy(() => import('./pages/managers/warranty/GlobalWarrantySettings'))
const GlobalAdsConfig = lazy(() => import('./pages/managers/settings/ads/GlobalAdsConfig'))
const GlobalThemeSettings = lazy(() => import('./pages/managers/GlobalThemeSettings'))
const GlobalKnowledgeSettings = lazy(() => import('./pages/managers/GlobalKnowledgeSettings'))
const GlobalFooterSettings = lazy(() => import('./pages/managers/GlobalFooterSettings'))
const PrivacyCookiesSettings = lazy(() => import('./pages/managers/PrivacyCookiesSettings/index.jsx'))
const RedirectURLsSettings = lazy(() => import('./pages/managers/RedirectURLsSettings/index.jsx'))
const GenerateSync = lazy(() => import('./pages/GenerateSync/index.jsx'))

const Placeholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
    <div className="p-4 bg-gray-100 rounded-full animate-pulse">
      <Loader2 size={32} className="animate-spin text-gray-400" />
    </div>
    <h2 className="text-2xl font-semibold">{title} (กำลังพัฒนา)</h2>
  </div>
)

const PageLoader = () => (
  <div className="flex items-center justify-center h-full w-full bg-slate-50/50 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      <span className="text-slate-500 font-medium">กำลังโหลด...</span>
    </div>
  </div>
)

// 🟢 แยกเนื้อหาการทำงานออกมาเป็น AppContent
function AppContent() {
  const { 
    user, 
    loading, 
    isCheckingAuth, 
    isPendingApproval, 
    isProfileSetupRequired, 
    setIsProfileSetupRequired,
    logout 
  } = useAuth();

  if (loading || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-dh-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-dh-muted font-medium">กำลังตรวจสอบข้อมูลผู้ใช้งาน...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    )
  }

  if (isProfileSetupRequired) {
    return (
      <Suspense fallback={<PageLoader />}>
        <ProfileSetup user={user} onComplete={() => setIsProfileSetupRequired(false)} />
      </Suspense>
    )
  }

  if (isPendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center space-y-6">
           <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto">
             <Clock size={40} />
           </div>
           <div>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">รอการอนุมัติ</h2>
             <p className="text-gray-600">
               บัญชีของคุณกำลังรอการตรวจสอบและอนุมัติจากผู้จัดการระบบ<br/>
               กรุณารอการติดต่อกลับ หรือแจ้งผู้จัดการเพื่อขออนุมัติ
             </p>
           </div>
           <button
             onClick={logout}
             className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
           >
             ออกจากระบบ
           </button>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="search" element={<Search />} /> 
          <Route path="todo" element={<Todo />} />
          <Route path="todo/archive" element={<TodoArchive />} />
          <Route path="claims" element={<ClaimMain />} />
          <Route path="billing" element={<BillingMain />} />
          
          {/* 🔒 พื้นที่สำหรับ Manager เท่านั้น */}
          <Route element={<ManagerRoute />}>
            <Route path="managers" element={<ManagersOverview />} />
            <Route path="managers/promotions" element={<PromotionManagement />} />
            <Route path="managers/pricing" element={<PricingSettings />} />
            <Route path="managers/staff" element={<StaffManagement />} />
            <Route path="managers/freebie" element={<FreebieManagement />} />
            <Route path="managers/credit-dashboard" element={<CreditDashboard />} />
            <Route path="managers/inventory-adjustment" element={<StockAdjustment />} />
            <Route path="managers/wallet" element={<WalletManagement />} />
            <Route path="managers/shipping" element={<ShippingManagement />} />
            <Route path="managers/ads" element={<AdManagement />} />
            <Route path="managers/partners" element={<PartnerSettings />} />
            <Route path="managers/refund" element={<RefundManagement />} />

            {/* ⚙️ Global Settings Pages */}
            <Route path="managers/buffer" element={<GlobalBufferSettings />} />
            <Route path="managers/category" element={<GlobalCategorySettings />} />
            <Route path="managers/regex" element={<GlobalRegexSettings />} />
            <Route path="managers/warranty" element={<GlobalWarrantySettings />} />
            <Route path="managers/ads-config" element={<GlobalAdsConfig />} />
            <Route path="managers/theme" element={<GlobalThemeSettings />} />
            <Route path="managers/knowledge" element={<GlobalKnowledgeSettings />} />
            <Route path="managers/footer-settings" element={<GlobalFooterSettings />} />
            <Route path="managers/privacy-cookies" element={<PrivacyCookiesSettings />} />
            <Route path="managers/redirect" element={<RedirectURLsSettings />} />
          </Route>
          
          <Route path="history" element={<HistoryPage />}/>
          <Route path="gallery" element={<GalleryMain />}/>
          <Route path="inventory" element={<Inventory/>}/>
          <Route path="generate" element={<GenerateSync />}/>
          <Route path="customers" element={<Customers />}/>
          <Route path="emails" element={<EmailMain />}/>
          <Route path="calendar" element={<CalendarPage />}/>
          <Route path="config" element={<Placeholder title="Config"/>}/>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

import { Toaster } from 'react-hot-toast';

// 🟢 App Component หลักที่ทำหน้าที่ครอบ Router ให้ครอบคลุมการทำงานทั้งระบบ
function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontWeight: 'bold' } }} />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App