import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { UserCircle, Coffee, CheckCircle, Clock, FileText, Send, X, ScanLine, Loader2, AlertCircle } from 'lucide-react';
import { staffService } from '../firebase/staffService';
import { auth } from '../firebase/config';

export default function ProfileMain() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [workStatus, setWorkStatus] = useState('offline');
  
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [leaveForm, setLeaveForm] = useState({
    type: 'sick',
    startDate: '',
    endDate: '',
    reason: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MOCK_UID = 'staff_test_123';
  const MOCK_NAME = 'พนักงาน ทดสอบ (สมมติ)';

  useEffect(() => {
    const currentUser = auth.currentUser;
    const currentUid = currentUser?.uid || MOCK_UID;
    const currentName = currentUser?.displayName || MOCK_NAME;
    
    setUser({ uid: currentUid, displayName: currentName });

    staffService.getStaffProfile(currentUid).then(data => {
      if (data) {
        setProfile(data);
        if (data.workStatus) setWorkStatus(data.workStatus);
      }
    });
  }, []);

  // Initialize Scanner when showScanner changes
  useEffect(() => {
    let scanner = null;
    
    if (showScanner) {
      scanner = new Html5QrcodeScanner(
        "staff-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(onScanSuccess, onScanFailure);
    }

    async function onScanSuccess(decodedText) {
      if (scanner) scanner.pause();
      setIsProcessing(true);
      
      try {
        const data = JSON.parse(decodedText);
        if (data.type === 'ATTENDANCE_SCAN') {
          // You could optionally verify the stationId and timestamp here
          // For now, if they scanned it, we update their attendance
          
          await staffService.logAttendance(user.uid, user.displayName, data.stationId || 'MAIN_COUNTER');
          await staffService.updateWorkStatus(user.uid, 'active');
          setWorkStatus('active');
          
          setScanResult({ success: true, message: 'ลงเวลาเข้างานสำเร็จ' });
        } else {
          throw new Error('QR Code ไม่ถูกต้อง');
        }
      } catch (error) {
        console.error('Scan error:', error);
        setScanResult({ success: false, message: 'การสแกนล้มเหลว หรือ QR Code ไม่รองรับ' });
      } finally {
        setIsProcessing(false);
        setTimeout(() => {
          setScanResult(null);
          setShowScanner(false);
          if (scanner) scanner.clear();
        }, 3000);
      }
    }

    function onScanFailure() {}

    return () => {
      if (scanner) scanner.clear().catch(e => console.error(e));
    };
  }, [showScanner, user]);

  const handleStatusChange = async (newStatus) => {
    if (!user) return;
    setWorkStatus(newStatus);
    await staffService.updateWorkStatus(user.uid, newStatus);
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await staffService.requestLeave({
        staffUid: user.uid,
        staffName: user.displayName,
        leaveType: leaveForm.type,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason
      });
      alert('ส่งคำขอลางานสำเร็จ ระบบได้ส่งเรื่องให้ผู้จัดการแล้ว');
      setShowLeaveModal(false);
      setLeaveForm({ type: 'sick', startDate: '', endDate: '', reason: '' });
    } catch (error) {
      console.error('Leave Error:', error);
      alert('เกิดข้อผิดพลาดในการส่งคำขอ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <div className="p-5 text-center text-gray-500">Loading Profile...</div>;

  return (
    <div className="p-5 space-y-6">
      {/* Header Profile */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex justify-center items-center text-blue-600">
          <UserCircle size={40} />
        </div>
        <div>
          <h2 className="font-bold text-lg text-gray-800">{user.displayName}</h2>
          <p className="text-sm text-gray-500">ID: {user.uid.substring(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Action Scanner Area */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
        {!showScanner ? (
          <>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex justify-center items-center text-emerald-600 mb-4 animate-pulse">
              <ScanLine size={40} />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">ถึงเวลาเข้างานแล้วหรือยัง?</h3>
            <p className="text-xs text-gray-500 text-center mb-5">
              เปิดสแกนเนอร์แล้วนำไปส่องที่หน้าจอ <br/>ของเครื่องส่วนกลาง (จุดลงเวลา)
            </p>
            <button 
              onClick={() => setShowScanner(true)}
              className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex justify-center items-center gap-2"
            >
              <ScanLine size={20} /> เปิดกล้องสแกน QR
            </button>
          </>
        ) : (
          <div className="w-full relative">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800">กำลังสแกน...</h3>
              <button onClick={() => setShowScanner(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20}/>
              </button>
            </div>
            
            <div id="staff-reader" className="w-full bg-black rounded-xl overflow-hidden border border-slate-200 relative"></div>
            
            {/* Overlay Processing */}
            {isProcessing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 top-[40px] rounded-xl">
                <Loader2 size={40} className="animate-spin text-blue-500 mb-2" />
                <p className="font-bold text-blue-600">กำลังตรวจสอบข้อมูล...</p>
              </div>
            )}
            
            {/* Overlay Result */}
            {scanResult && !isProcessing && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-10 top-[40px] rounded-xl animate-in zoom-in text-center p-4">
                {scanResult.success ? (
                  <CheckCircle size={60} className="text-emerald-500 mb-3 animate-bounce" />
                ) : (
                  <AlertCircle size={60} className="text-rose-500 mb-3 animate-pulse" />
                )}
                <h3 className={`text-lg font-black mb-1 ${scanResult.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {scanResult.success ? 'สำเร็จ!' : 'ผิดพลาด'}
                </h3>
                <p className="font-bold text-slate-600 text-sm">{scanResult.message}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Toggle */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-3">สถานะการทำงานปัจจุบัน</h3>
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={() => handleStatusChange('active')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border ${workStatus === 'active' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
          >
            <CheckCircle size={24} className="mb-1" />
            <span className="text-xs font-bold">ปฏิบัติงาน</span>
          </button>
          
          <button 
            onClick={() => handleStatusChange('break')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border ${workStatus === 'break' ? 'bg-yellow-50 border-yellow-500 text-yellow-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
          >
            <Coffee size={24} className="mb-1" />
            <span className="text-xs font-bold">พักเบรก</span>
          </button>
          
          <button 
            onClick={() => handleStatusChange('offline')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border ${workStatus === 'offline' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
          >
            <Clock size={24} className="mb-1" />
            <span className="text-xs font-bold">เลิกงาน</span>
          </button>
        </div>
      </div>

      {/* Leave Request Button */}
      <button 
        onClick={() => setShowLeaveModal(true)}
        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 flex justify-center items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all"
      >
        <FileText size={20} />
        ยื่นขอลางาน (Leave Request)
      </button>

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-end sm:items-center">
          <div className="bg-white w-full sm:w-96 rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg text-gray-800">แบบฟอร์มขอลางาน</h3>
              <button onClick={() => setShowLeaveModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ประเภทการลา</label>
                <select 
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="sick">ลาป่วย</option>
                  <option value="personal">ลากิจ</option>
                  <option value="vacation">ลาพักร้อน</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">ตั้งแต่วันที่</label>
                  <input 
                    type="date" 
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">ถึงวันที่</label>
                  <input 
                    type="date" 
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    required 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">เหตุผลการลา</label>
                <textarea 
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  rows="3"
                  placeholder="ระบุเหตุผล..."
                  required
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 mt-4 disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังส่งข้อมูล...' : <><Send size={18} /> ส่งคำขอให้ผู้จัดการ</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
