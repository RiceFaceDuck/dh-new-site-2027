import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth' 
import { auth } from './firebase/config'
import { userService } from './firebase/userService'
import { AlertCircle, Clock } from 'lucide-react' 

import AdminLayout from './layouts/AdminLayout'
import Overview from './pages/Overview'
import Inventory from './pages/Inventory'
import Login from './pages/Login'
import ProfileSetup from './pages/ProfileSetup'

import Todo from './pages/Todo'
import ManagersOverview from './pages/ManagersOverview/index'
import Customers from './pages/Customers' 
import HistoryPage from './pages/History' 
import BillingMain from './pages/billing/BillingMain'
import ClaimMain from './pages/claims/ClaimMain' 
import Search from './pages/Search' 
import GalleryMain from './pages/gallery/GalleryMain' 

// นำเข้า Components สำหรับ Managers
import PromotionManagement from './pages/managers/PromotionManagement'
import PricingSettings from './pages/managers/PricingSettings'
import StaffManagement from './pages/managers/StaffManagement'
import FreebieManagement from './pages/managers/FreebieManagement'
import CreditDashboard from './pages/managers/CreditDashboard'
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
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPendingApproval, setIsPendingApproval] = useState(false)
  const [isProfileSetupRequired, setIsProfileSetupRequired] = useState(false)
  const [isAuthChecking, setIsAuthChecking] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsAuthChecking(true)
      if (currentUser) {
        try {
          const userProfile = await userService.getUserProfile(currentUser.uid)
          if (userProfile) {
            if (userProfile.status === 'pending') {
              setIsPendingApproval(true)
              setUser(currentUser)
              setIsProfileSetupRequired(false)
            } else if (!userProfile.role || !userProfile.firstName) {
               setIsProfileSetupRequired(true)
               setUser(currentUser)
               setIsPendingApproval(false)
            } else {
              setUser(currentUser)
              setIsPendingApproval(false)
              setIsProfileSetupRequired(false)
            }
          } else {
            setIsProfileSetupRequired(true)
            setUser(currentUser)
            setIsPendingApproval(false)
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
          setUser(currentUser)
        }
      } else {
        setUser(null)
        setIsPendingApproval(false)
        setIsProfileSetupRequired(false)
      }
      setLoading(false)
      setIsAuthChecking(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading || isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-dh-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-dh-muted font-medium">กำลังตรวจสอบข้อมูลผู้ใช้งาน...</p>
        </div>
      </div>
    )
  }

  // ✅ ตอนนี้ <Login /> จะถูกเรียกใช้โดยมี <Router> ครอบอยู่ด้านนอกสุดแล้ว
  if (!user) {
    return <Login />
  }

  if (isProfileSetupRequired) {
    return <ProfileSetup onComplete={() => setIsProfileSetupRequired(false)} />
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
             onClick={() => signOut(auth)}
             className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
           >
             ออกจากระบบ
           </button>
        </div>
      </div>
    )
  }

  // ✅ ถอด <Router> ตรงนี้ออก เพราะเราเอาไปครอบที่ Component หลักด้านล่างแทนแล้ว
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Overview />} />
        <Route path="search" element={<Search />} /> 
        <Route path="todo" element={<Todo />} />
        <Route path="claims" element={<ClaimMain />} />
        <Route path="billing" element={<BillingMain />} />
        
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
        
        <Route path="history" element={<HistoryPage />}/>
        <Route path="gallery" element={<GalleryMain />}/>
        <Route path="inventory" element={<Inventory/>}/>
        <Route path="customers" element={<Customers />}/>
        <Route path="config" element={<Placeholder title="Config"/>}/>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// 🟢 App Component หลักที่ทำหน้าที่ครอบ Router ให้ครอบคลุมการทำงานทั้งระบบ
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App