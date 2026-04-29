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
import ManagersOverview from './pages/managers/ManagersOverview'
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

// Component สำหรับหน้าชั่วคราว
const Placeholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500">
    <div className="text-4xl mb-4">🚧</div>
    <h2 className="text-2xl font-bold mb-2">{title}</h2>
    <p>หน้านี้กำลังอยู่ระหว่างการพัฒนา</p>
  </div>
)

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0)
  const SESSION_TIMEOUT = 30 * 60 // 30 นาที

  // ==========================================
  // 🛑 1. ระบบ Auth (แยกออกมาให้ทำงานแค่ครั้งเดียว ป้องกัน Infinite Loop)
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // ยิงคำสั่ง Write แค่ "1 ครั้ง" ตอนที่เปิดเว็บเข้ามาใหม่เท่านั้น!
          await userService.updateUserLoginStatus(currentUser.uid)
        } catch (err) {
          console.error("Auth status update failed (อาจจะติด Quota):", err)
        }
        
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL
        })
        
        setIsSessionExpired(false)
        setSessionTimeLeft(SESSION_TIMEOUT)
      } else {
        setUser(null)
        setSessionTimeLeft(0)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, []) // 👈 Empty Array: คือกุญแจสำคัญที่ทำให้ทำงานแค่รอบเดียวตอนรีเฟรชหน้า!

  // ==========================================
  // ⏱️ 2. ระบบ Session Timeout (จัดการเวลาแยกต่างหาก)
  // ==========================================
  useEffect(() => {
    if (!user || isSessionExpired) return;

    let sessionTimer;
    let countdownInterval;

    const resetTimer = () => {
      clearTimeout(sessionTimer)
      clearInterval(countdownInterval)
      
      setSessionTimeLeft(SESSION_TIMEOUT)
      
      countdownInterval = setInterval(() => {
        setSessionTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      sessionTimer = setTimeout(async () => {
        await signOut(auth)
        setIsSessionExpired(true)
      }, SESSION_TIMEOUT * 1000)
    }

    // เริ่มจับเวลา
    resetTimer()

    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keydown', resetTimer)

    return () => {
      clearTimeout(sessionTimer)
      clearInterval(countdownInterval)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('keydown', resetTimer)
    }
  }, [user, isSessionExpired]) // โยงแค่เฉพาะตอนที่ user เปลี่ยนแปลงจริง

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-[#0870B8] border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-slate-500 font-medium">กำลังโหลดระบบ...</div>
      </div>
    )
  }

  return (
    <Router>
      {/* Session Alert */}
      {isSessionExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 text-center transform animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">เซสชันหมดอายุ</h3>
            <p className="text-slate-600 mb-6 text-sm">
              เพื่อความปลอดภัย ระบบได้ทำการล็อกเอาท์อัตโนมัติเนื่องจากไม่มีการใช้งานเกิน 30 นาที
            </p>
            <button
              onClick={() => {
                setIsSessionExpired(false)
                window.location.href = '/login'
              }}
              className="w-full bg-[#0870B8] text-white rounded-lg py-2.5 font-medium hover:bg-[#065A96] transition-colors shadow-md"
            >
              เข้าสู่ระบบใหม่
            </button>
          </div>
        </div>
      )}

      {/* Session Timer */}
      {user && !isSessionExpired && (
        <div className="fixed bottom-4 right-4 z-40 bg-white/90 backdrop-blur shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border border-slate-100 text-xs font-medium text-slate-600 transition-opacity hover:opacity-100 opacity-50">
          <Clock className={`w-3 h-3 ${sessionTimeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-[#0870B8]'}`} />
          <span className={sessionTimeLeft < 300 ? 'text-rose-600 font-bold' : ''}>
            {formatTime(sessionTimeLeft)}
          </span>
        </div>
      )}

      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route 
          path="/profile-setup" 
          element={!user ? <Navigate to="/login" replace /> : <ProfileSetup />} 
        />
        <Route
          path="/"
          element={
            user ? (
              <AdminLayout user={user} onLogout={() => signOut(auth)}>
                <Overview />
              </AdminLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
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
    </Router>
  )
}

export default App