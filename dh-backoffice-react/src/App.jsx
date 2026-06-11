import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Clock } from 'lucide-react' 

import { AuthProvider, useAuth } from './contexts/AuthContext'
import ManagerRoute from './components/routing/ManagerRoute'

import AdminLayout from './layouts/AdminLayout'
import Overview from './pages/Overview'
import Inventory from './pages/Inventory'
import Login from './pages/Login'
import ProfileSetup from './pages/ProfileSetup'

import Todo from './pages/Todo'
import TodoArchive from './pages/todo/TodoArchive'
import ManagersOverview from './pages/ManagersOverview/index'
import Customers from './pages/Customers' 
import HistoryPage from './pages/History/index.jsx' 
import BillingMain from './pages/billing/BillingMain'
import ClaimMain from './pages/claims/ClaimMain' 
import Search from './pages/Search' 
import GalleryMain from './pages/gallery/GalleryMain' 
import EmailMain from './pages/emails/EmailMain'

// นำเข้า Components สำหรับ Managers
import PromotionManagement from './pages/managers/PromotionManagement'
import PricingSettings from './pages/managers/PricingSettings'
import StaffManagement from './pages/managers/StaffManagement'
import FreebieManagement from './pages/managers/FreebieManagement'
import CreditDashboard from './pages/managers/CreditDashboard/index.jsx' 
import WalletManagement from './pages/managers/WalletManagement'
import ShippingManagement from './pages/managers/ShippingManagement'
import AdManagement from './pages/managers/AdManagement'
import PartnerSettings from './pages/managers/PartnerSettings'

const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center h-full">
    <h2 className="text-2xl text-gray-500 font-semibold">{title} (กำลังพัฒนา)</h2>
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
    return <Login />
  }

  if (isProfileSetupRequired) {
    return <ProfileSetup user={user} onComplete={() => setIsProfileSetupRequired(false)} />
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
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Overview />} />
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
          <Route path="managers/freebies" element={<FreebieManagement />} />
          <Route path="managers/credit" element={<CreditDashboard />} /> 
          <Route path="managers/wallet" element={<WalletManagement />} />
          <Route path="managers/shipping" element={<ShippingManagement />} />
          <Route path="managers/ads" element={<AdManagement />} />
          <Route path="managers/partners" element={<PartnerSettings />} />
        </Route>
        
        <Route path="history" element={<HistoryPage />}/>
        <Route path="gallery" element={<GalleryMain />}/>
        <Route path="inventory" element={<Inventory/>}/>
        <Route path="generate" element={<div className="flex items-center justify-center h-full"><h2 className="text-2xl text-gray-500 font-semibold">การ Generate เพื่อซิงค์ข้อมูลสต๊อก อยู่ในระหว่างการพัฒนา</h2></div>}/>
        <Route path="customers" element={<Customers />}/>
        <Route path="emails" element={<EmailMain />}/>
        <Route path="calendar" element={<Placeholder title="Calendar"/>}/>
        <Route path="config" element={<Placeholder title="Config"/>}/>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// 🟢 App Component หลักที่ทำหน้าที่ครอบ Router ให้ครอบคลุมการทำงานทั้งระบบ
function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App