import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { hardwareService } from '../../firebase/hardwareService';
import AuthForm from '../../components/profile/AuthForm';
import { Monitor, Battery, HardDrive, Cpu, Download, Copy, CheckCircle, Info, ShieldCheck, ArrowRight, LayoutGrid } from 'lucide-react';
import { useCookieConsent } from '../../hooks/useCookieConsent';
import { parseConsentText } from '../../utils/textParser';

const HardwareScanner = () => {
  const location = useLocation();
  const auth = getAuth();
  
  // States
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [hardwareData, setHardwareData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { config } = useCookieConsent();

  const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';
  const downloadLink = "https://drive.google.com/file/d/1E1qr-8aSwPu0ew4AT7ojdLm9SYnMdHdZ/view?usp=sharing";

  // 1. Check Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUser({ ...currentUser, ...userSnap.data() });
          } else {
            setUser(currentUser);
          }
        } catch (error) {
          console.error("🔥 Error fetching user data:", error);
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [auth, appId]);

  // 2. Parse URL Params (Extract Hardware Data)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const monitor = params.get('monitor');
    
    // ถ้ามีพารามิเตอร์แปลว่ามาจากโปรแกรม Scanner
    if (monitor !== null) {
      const data = {
        monitor: monitor || 'ไม่พบข้อมูล',
        battery: params.get('battery') || 'ไม่พบข้อมูล',
        board: params.get('board') || 'ไม่พบข้อมูล',
        disk: params.get('disk') || 'ไม่พบข้อมูล',
        ram: params.get('ram') || 'ไม่พบข้อมูล',
      };
      setHardwareData(data);
    } else {
      setHardwareData(null);
    }
  }, [location.search]);

  // 3. Save to Firebase Auto (if logged in and has data)
  useEffect(() => {
    const saveData = async () => {
      if (user && hardwareData && !isSaved) {
        try {
          await hardwareService.saveScan(appId, user.uid, hardwareData);
          setIsSaved(true);
        } catch (error) {
          console.error("Failed to save scan");
        }
      }
    };
    saveData();
  }, [user, hardwareData, isSaved, appId]);

  // Actions
  const handleCopy = () => {
    if (!hardwareData) return;
    const text = `สเปคเครื่อง (ตรวจสอบโดย DH Scanner)\n- หน้าจอ: ${hardwareData.monitor}\n- แบตเตอรี่: ${hardwareData.battery}\n- เมนบอร์ด: ${hardwareData.board}\n- ฮาร์ดดิสก์: ${hardwareData.disk}\n- แรม: ${hardwareData.ram}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ==========================================
  // 🎨 UI: หน้าจอยืนยันตัวตน (บังคับ Login เพื่อดูผล)
  // ==========================================
  if (hardwareData && !loadingAuth && !user) {
    return (
      <div className="max-w-md mx-auto mt-10 p-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800 text-sm">กรุณาเข้าสู่ระบบก่อน</h3>
            <p className="text-xs text-amber-700 mt-1">
              ระบบสแกนข้อมูลเครื่องเสร็จสิ้นแล้ว แต่เพื่อความปลอดภัยและการผูกประวัติข้อมูล กรุณาเข้าสู่ระบบเพื่อดูผลลัพธ์
            </p>
          </div>
        </div>
        <AuthForm />
      </div>
    );
  }

  // ==========================================
  // 🎨 UI: หน้าจอแสดงผลลัพธ์ (Report View)
  // ==========================================
  if (hardwareData && user) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">ตรวจสอบสเปคสำเร็จ</h1>
            <p className="text-emerald-50 text-sm">ข้อมูลฮาร์ดแวร์ถูกบันทึกลงในบัญชีของคุณแล้ว</p>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">ข้อมูลอุปกรณ์ของคุณ</h2>
              <button 
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${copied ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'คัดลอกแล้ว!' : 'คัดลอกส่งแอดมิน'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DataCard icon={<Monitor className="w-5 h-5" />} label="รุ่นหน้าจอ (Monitor Panel)" value={hardwareData.monitor} />
              <DataCard icon={<Battery className="w-5 h-5" />} label="แบตเตอรี่ (Battery)" value={hardwareData.battery} />
              <DataCard icon={<Cpu className="w-5 h-5" />} label="เมนบอร์ด (Motherboard)" value={hardwareData.board} />
              <DataCard icon={<HardDrive className="w-5 h-5" />} label="ฮาร์ดดิสก์ (Storage)" value={hardwareData.disk} />
              <DataCard icon={<LayoutGrid className="w-5 h-5" />} label="หน่วยความจำ (RAM)" value={hardwareData.ram} />
            </div>

            {/* Guide */}
            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-full shrink-0">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-sm mb-1">ทำอย่างไรต่อ?</h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  คุณสามารถกดปุ่ม "คัดลอกส่งแอดมิน" เพื่อคัดลอกข้อมูลเหล่านี้ส่งให้ทีมงาน DH Notebook ในแชท เพื่อประเมินราคาอะไหล่หรือจองคิวซ่อมได้อย่างรวดเร็วและแม่นยำครับ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 🎨 UI: หน้าแรก Landing Page (Download View)
  // ==========================================
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
          เช็คสเปคอะไหล่ <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-500">ง่ายนิดเดียว</span>
        </h1>
        <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto">
          ไม่ต้องแกะเครื่อง ไม่ต้องกลัวผิดรุ่น เพียงโหลดโปรแกรมขนาดจิ๋วของเรา เพื่อตรวจสอบรหัสฮาร์ดแวร์ที่แท้จริง
        </p>
      </div>

      {/* Main Download Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-12 relative group">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
        <div className="p-8 md:p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Monitor className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">โปรแกรม DH Hardware Scanner</h2>
          <p className="text-slate-500 mb-8 max-w-md">
            รองรับเฉพาะ Windows ปลอดภัย 100% ไม่มีไวรัส ช่วยให้ทีมงานประเมินราคาอะไหล่ได้แม่นยำทันที
          </p>
          <a 
            href={downloadLink}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1"
          >
            <Download className="w-6 h-6" />
            ดาวน์โหลดโปรแกรม (คลิก)
          </a>
        </div>
      </div>

      {/* In-App Documentation (คู่มือการใช้งาน) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StepCard 
          step="1" 
          title="ดาวน์โหลดและเปิดไฟล์" 
          desc="ไฟล์จะมีชื่อว่า DH Hardware Scanner.exe ไม่จำเป็นต้องติดตั้ง กดเปิดใช้งานได้เลย"
        />
        <StepCard 
          step="2" 
          title="กดปุ่มเริ่มตรวจสอบ" 
          desc="โปรแกรมจะทำการอ่านรหัสหน้าจอ แบตเตอรี่ และชิ้นส่วนอื่นๆ ใช้เวลาเพียง 1 วินาที"
        />
        <StepCard 
          step="3" 
          title="รับผลลัพธ์บนเว็บ" 
          desc="โปรแกรมจะเด้งหน้าเว็บนี้ขึ้นมาอัตโนมัติ เพื่อให้คุณคัดลอกข้อมูลส่งให้เราประเมินราคาได้ทันที"
        />
      </div>

      {/* Privacy & Security Notice */}
      <div className="mt-8 bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="text-emerald-600 w-6 h-6" />
          <h3 className="font-bold text-slate-800 text-lg">ความปลอดภัยและนโยบายข้อมูลส่วนบุคคล (PDPA)</h3>
        </div>
        <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
          {config?.consentTexts?.scanner 
            ? parseConsentText(config.consentTexts.scanner, config?.policyLinks?.termsOfServiceUrl, config?.policyLinks?.privacyPolicyUrl, "text-[#0870B8] hover:underline font-medium")
            : parseConsentText("รูปแบบการทำงาน: โปรแกรมนี้ทำงานโดยการอ่านค่ารหัสประจำตัวอุปกรณ์ (Hardware IDs) จากระบบปฏิบัติการ ซึ่งเป็นข้อมูลทางเทคนิคของชิ้นส่วนต่างๆ ในระดับฮาร์ดแวร์ (เช่น รหัสจอกระจก, รุ่นเมนบอร์ด) โดยไม่มีการเข้าถึงไฟล์ส่วนตัว เอกสาร หรือรหัสผ่านใดๆ ทั้งสิ้น\n\nการจัดเก็บข้อมูล: เมื่อโปรแกรมทำงานเสร็จสิ้น ผลลัพธ์สเปคเครื่องจะแสดงบนหน้าเว็บไซต์นี้ และหากคุณเข้าสู่ระบบอยู่ ข้อมูลสเปคเครื่องนี้จะถูกบันทึกลงในโปรไฟล์บัญชีของคุณโดยอัตโนมัติ เพื่อใช้ประโยชน์ในการเทียบอะไหล่ให้ตรงรุ่นแบบ 100% และใช้เป็นข้อมูลอ้างอิงในการรับประกันสินค้าของ DH Notebook")}
        </div>
      </div>

    </div>
  );
};

// ==========================================
// 🧩 Sub-components (SRP: แยกระบบย่อยในไฟล์เพื่อให้อ่านง่าย)
// ==========================================

const DataCard = ({ icon, label, value }) => (
  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all">
    <div className="bg-white p-2.5 rounded-lg shadow-sm border border-slate-100 text-slate-600 shrink-0">
      {icon}
    </div>
    <div className="flex flex-col overflow-hidden">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</span>
      <span className="text-sm font-medium text-slate-800 truncate" title={value}>{value}</span>
    </div>
  </div>
);

const StepCard = ({ step, title, desc }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
    <div className="absolute -right-4 -top-4 w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center font-black text-3xl text-slate-200">
      {step}
    </div>
    <h3 className="font-bold text-slate-800 text-lg mb-2 relative z-10">{title}</h3>
    <p className="text-slate-500 text-sm relative z-10 leading-relaxed">{desc}</p>
  </div>
);

export default HardwareScanner;
