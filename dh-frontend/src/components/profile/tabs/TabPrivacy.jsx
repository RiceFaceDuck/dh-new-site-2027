import { useState } from 'react';
import { 
  ShieldCheck, Download, Trash2, FileJson, AlertTriangle, Loader2 
} from 'lucide-react';
import { userService } from '../../../firebase/userService';
import { useWalletBalance } from '../../../firebase/walletService';
import { useToast } from '../../../context/ToastContext';


export default function TabPrivacy({ user }) {
  const { showToast } = useToast();
  const { walletBalance } = useWalletBalance(user?.uid);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    if (!user?.uid) return;
    setIsExporting(true);
    try {
      // ดึงข้อมูลผู้ใช้จาก Firestore
      const profileData = await userService.getUserProfile(user.uid, true);
      
      // รวบรวมข้อมูลส่วนบุคคล
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '1.0'
        },
        accountInfo: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          phoneNumber: profileData?.phoneNumber || user.phoneNumber,
          creationTime: user.metadata?.creationTime,
          lastSignInTime: user.metadata?.lastSignInTime,
        },
        profile: profileData
      };

      // สร้างไฟล์ JSON และให้ผู้ใช้ดาวน์โหลด
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `dh-user-data-${user.uid}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
      showToast("เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง", 'info');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('คำเตือน: คุณต้องการลบบัญชีและข้อมูลทั้งหมดออกจากระบบอย่างถาวรใช่หรือไม่?\n\nการกระทำนี้ไม่สามารถยกเลิกหรือกู้คืนข้อมูลได้!')) {
      try {
        await userService.deleteAccount(user, walletBalance);
        window.location.href = '/'; // Redirect to home
      } catch (error) {
        console.error("🔥 Error:", error);
        showToast(error?.message || "เกิดข้อผิดพลาด", 'error');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 border-b-4 border-b-indigo-500">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">ความเป็นส่วนตัวและความปลอดภัย</h2>
            <p className="text-sm text-slate-500 mt-1">จัดการข้อมูลส่วนบุคคล สิทธิการเข้าถึง และความปลอดภัยของบัญชี (Privacy & Security)</p>
          </div>
        </div>
      </div>

      {/* Section 1: Data Export */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileJson className="w-5 h-5 text-indigo-600" />
            ดาวน์โหลดข้อมูลส่วนบุคคล (Data Export)
          </h3>
        </div>
        <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="max-w-2xl">
            <p className="text-sm text-slate-600 leading-relaxed mb-2">
              ตามสิทธิพ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) คุณสามารถขอรับสำเนาข้อมูลส่วนบุคคลของคุณที่เราจัดเก็บไว้ได้ทุกเมื่อ โดยข้อมูลจะถูกส่งออกในรูปแบบไฟล์ JSON เพื่อให้นำไปใช้งานต่อได้โดยง่าย
            </p>
            <ul className="text-xs text-slate-500 list-disc list-inside space-y-1 ml-1">
              <li>ข้อมูลบัญชีพื้นฐาน (อีเมล, เบอร์โทรศัพท์, วันที่สมัคร)</li>
              <li>ข้อมูลโปรไฟล์ ที่อยู่ และการตั้งค่าร้านค้า</li>
              <li>ประวัติการตั้งค่าและสิทธิการเข้าถึง</li>
            </ul>
          </div>
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="shrink-0 px-5 py-3 bg-white border-2 border-indigo-100 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 min-w-[200px]"
          >
            {isExporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            {isExporting ? 'กำลังเตรียมไฟล์...' : 'ดาวน์โหลดข้อมูล (JSON)'}
          </button>
        </div>
      </div>

      {/* Section 2: Danger Zone */}
      <div className="bg-white rounded-2xl shadow-xs border border-rose-200/80 overflow-hidden relative group">
        <div className="absolute inset-0 bg-linear-to-br from-white to-rose-50/30 pointer-events-none"></div>
        <div className="p-6 border-b border-rose-100 bg-rose-50/50 relative z-10">
          <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            การจัดการบัญชี (Danger Zone)
          </h3>
        </div>
        <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between relative z-10">
          <div className="max-w-2xl">
            <p className="text-sm text-slate-700 font-bold mb-1">ลบข้อมูลส่วนบุคคลและประวัติทั้งหมดออกจากระบบอย่างถาวร</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              การกระทำนี้จะลบบัญชี ข้อมูลส่วนบุคคล ประวัติการสั่งซื้อ และเครดิตทั้งหมดออกจากระบบโดยสมบูรณ์ และไม่สามารถกู้คืนได้ตามนโยบายการลบข้อมูล (Right to be Forgotten)
            </p>
          </div>
          <button 
            onClick={handleDeleteAccount}
            className="shrink-0 px-5 py-3 border border-rose-300 bg-white text-rose-600 hover:bg-rose-600 hover:text-white font-bold rounded-xl transition-all shadow-xs hover:shadow-md hover:shadow-rose-500/20 flex items-center justify-center gap-2 min-w-[200px]"
          >
            <Trash2 size={18} />
            ลบบัญชีถาวร
          </button>
        </div>
      </div>

    </div>
  );
}
