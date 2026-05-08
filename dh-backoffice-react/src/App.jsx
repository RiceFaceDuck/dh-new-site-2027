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
// ✅ อัปเดต: นำเข้าจากโฟลเดอร์ ManagersOverview ที่เราเพิ่งแยกส่วนประกอบ
import ManagersOverview from './pages/managers/ManagersOverview/index'
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

// Component จำลองสำหรับหน้าเว็บที่ยังไม่เสร็จ
const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center h-full min-h-[60vh]">
    <div className="text-center opacity-50">
      <Clock size={48} className="mx-auto mb-4 text-[var(--dh-text-muted)]" />
      <h2 className="text-2xl font-bold text-[var(--dh-text-main)]">{title}</h2>
      <p className="text-[var(--dh-text-muted)]">กำลังอยู่ในระหว่างการพัฒนา</p>
    </div>
  </div>
)

// Guard Layer 4: หน้าจอรอการอนุมัติ
const PendingApprovalScreen = ({ onLogout }) => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--dh-bg-base)] p-4">
    <div className="bg-[var(--dh-bg-surface)] p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-[var(--dh-border)]">
      <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Clock size={40} />
      </div>
      <h1 className="text-2xl font-black text-[var(--dh-text-main)] mb-2">รอการอนุมัติเข้าใช้งาน</h1>
      <p className="text-[var(--dh-text-muted)] font-medium mb-8">
        บัญชีของคุณกำลังรอการตรวจสอบจากผู้ดูแลระบบ กรุณาติดต่อผู้จัดการเพื่อขออนุมัติการเข้าถึง
      </p>
      <button
        onClick={onLogout}
        className="w-full bg-[var(--dh-bg-base)] hover:bg-[var(--dh-border)] text-[var(--dh-text-main)] font-bold py-3 px-4 rounded-xl transition-colors"
      >
        ออกจากระบบ
      </button>
    </div>
  </div>
)

const App = () => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        try {
          // ตรวจสอบโปรไฟล์
          const userProfile = await userService.getUserProfile(currentUser.uid)
          setProfile(userProfile)
        } catch (error) {
          console.error("Error fetching profile:", error)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--dh-bg-base)]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--dh-accent)] border-t-transparent"></div>
      </div>
    )
  }

  // Guard Layer 1: ยังไม่ได้ Login
  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    )
  }

  // Guard Layer 2: Login แล้ว แต่ไม่มี Profile ใน Firestore
  if (!profile) {
    return (
      <Router>
        <Routes>
          <Route path="/setup-profile" element={<ProfileSetup onComplete={(p) => setProfile(p)} />} />
          <Route path="*" element={<Navigate to="/setup-profile" replace />} />
        </Routes>
      </Router>
    )
  }

  // Guard Layer 3: เป็น Customer (ไม่ใช่ Staff) ให้ดีดออก
  if (profile.userType !== 'staff') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--dh-bg-base)] p-4">
        <div className="bg-[var(--dh-bg-surface)] p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-200">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-2xl font-black text-[var(--dh-text-main)] mb-2">ไม่ได้รับอนุญาต</h1>
          <p className="text-[var(--dh-text-muted)] font-medium mb-8">
            คุณเข้าสู่ระบบด้วยบัญชีลูกค้า ระบบนี้สงวนไว้สำหรับพนักงานเท่านั้น
          </p>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-colors"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    )
  }

  // Guard Layer 4: เป็น Staff แต่ยังไม่ได้รับอนุมัติ (ยกเว้น Owner email)
  const isOwnerEmail = user.email === 'dh1notebook@gmail.com'
  if (!profile.isApproved && !isOwnerEmail) {
    return <PendingApprovalScreen onLogout={handleLogout} />
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/setup-profile" element={<Navigate to="/" replace />} />

        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="search" element={<Search />} /> 
          <Route path="todo" element={<Todo />} />
          <Route path="claims" element={<ClaimMain />} />
          <Route path="billing" element={<BillingMain />} />
          
          {/* อัปเดต Path การเรียกหน้า ManagersOverview */}
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
    </Router>
  )
}

export default App