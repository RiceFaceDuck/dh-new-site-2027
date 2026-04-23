import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth' 
import { auth } from './firebase/config'
import { userService } from './firebase/userService'
import { AlertCircle, LogOut, Clock } from 'lucide-react' 

import AdminLayout from './layouts/AdminLayout'
import Overview from './pages/Overview'
import Inventory from './pages/Inventory'
import Login from './pages/Login'
import ProfileSetup from './pages/ProfileSetup'

import Todo from './pages/Todo'
import ManagersOverview from './pages/managers/ManagersOverview'
import Customers from './pages/Customers' 
import HistoryPage from './pages/History' 
import BillingMain from './pages/billing/BillingMain'
import PricingSettings from './pages/managers/PricingSettings'
import StaffManagement from './pages/managers/StaffManagement'
import ClaimMain from './pages/claims/ClaimMain'
import Search from './pages/Search'
import GalleryMain from './pages/gallery/GalleryMain'
import PromotionManagement from './pages/managers/PromotionManagement'
import FreebieManagement from './pages/managers/FreebieManagement'
import CreditDashboard from './pages/managers/CreditDashboard'
import WalletManagement from './pages/managers/WalletManagement'

// ✨ นำหน้าระบบตั้งค่าการจัดส่งเข้ามา
import ShippingManagement from './pages/managers/ShippingManagement'

const Placeholder = ({title}) => (
  <div className="bg-white p-8 rounded-xl shadow flex items-center justify-center min-h-[400px]">
    <h2 className="text-2xl text-gray-400">อยู่ระหว่างพัฒนา: {title}</h2>
  </div>
)

const PendingApprovalScreen = ({ title, message, isError, onLogout }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center space-y-4">
      {isError ? (
         <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
      ) : (
         <Clock className="w-16 h-16 text-blue-500 mx-auto" />
      )}
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      <p className="text-gray-600">{message}</p>
      
      <div className="pt-6">
        <button 
          onClick={onLogout}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
        >
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </div>
    </div>
  </div>
);

const App = () => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          const profile = await userService.getUserProfile(currentUser.uid)
          setUserProfile(profile)
        } catch (error) {
          console.error("Error loading user profile:", error)
        }
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return <Login />
  if (!userProfile && user.email !== 'dh.notebook@gmail.com') return <ProfileSetup user={user} onComplete={(profile) => setUserProfile(profile)} />
  if (user.email !== 'dh.notebook@gmail.com' && userProfile.isApproved === false) return <PendingApprovalScreen title="รอการอนุมัติบัญชี" message="รอผู้จัดการตรวจสอบ" isError={false} onLogout={handleLogout}/>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminLayout/>}>
          <Route index element={<Overview/>}/>
          <Route path="search" element={<Search />}/>
          <Route path="billing" element={<BillingMain />} />
          <Route path="claims" element={<ClaimMain />}/>
          <Route path="todo" element={<Todo />}/>
          
          <Route path="managers" element={<ManagersOverview />}/>
          <Route path="managers/pricing" element={<PricingSettings />} />
          <Route path="managers/staff" element={<StaffManagement />} />
          <Route path="managers/promotions" element={<PromotionManagement />} />
          <Route path="managers/freebies" element={<FreebieManagement />} />
          <Route path="managers/credit" element={<CreditDashboard />} /> 
          <Route path="managers/wallet" element={<WalletManagement />} />
          
          {/* ✨ Route ตั้งค่าการจัดส่ง */}
          <Route path="managers/shipping" element={<ShippingManagement />} />
          
          <Route path="history" element={<HistoryPage />}/>
          <Route path="gallery" element={<GalleryMain />}/>
          <Route path="inventory" element={<Inventory/>}/>
          <Route path="customers" element={<Customers />}/>
          <Route path="config" element={<Placeholder title="Config"/>}/>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App