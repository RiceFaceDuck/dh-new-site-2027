import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { extractCoordsFromUrl } from '../../firebase/partnerService';

// Ensure appId is defined
const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

const StoreProfilePage = () => {
  const { id } = useParams();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartnerProfile = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Try getting from ActivePartners collection
        const partnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'ActivePartners', id);
        const partnerSnap = await getDoc(partnerRef);
        
        if (partnerSnap.exists()) {
          setPartner({ id: partnerSnap.id, ...partnerSnap.data() });
        } else {
          // Fallback to old partners or user doc if needed
          console.warn("Partner not found in ActivePartners collection");
        }
      } catch (error) {
        console.error("Error fetching partner profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50 p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">ไม่พบข้อมูลร้านค้า</h2>
        <p className="text-slate-600 mb-6">ขออภัย ไม่พบโปรไฟล์ร้านค้าที่คุณกำลังค้นหา อาจถูกลบหรือปิดรับงานชั่วคราว</p>
        <Link to="/" className="px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark transition-colors shadow-md">
          กลับสู่หน้าหลัก
        </Link>
      </div>
    );
  }

  const avatar = partner.storeImage || partner.storeProfile?.logoUrl || partner.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop';
  const name = partner.storeName || partner.name || 'ช่างซ่อมอิสระ';
  const role = partner.services || partner.role || 'บริการซ่อมคอมพิวเตอร์และอุปกรณ์ไอที';
  const phone = partner.phone || partner.storeProfile?.phone || '';
  const mapsUrl = partner.mapsUrl || partner.storeProfile?.mapsUrl || '';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Premium Header/Cover */}
      <div className="h-64 md:h-80 w-full bg-gradient-to-r from-brand-dark via-brand to-brand-accent relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-0 right-10 w-64 h-64 rounded-full bg-blue-300 blur-3xl"></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-32 relative z-10">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          
          {/* Avatar Area */}
          <div className="relative group">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden ring-4 ring-white shadow-lg bg-white transform transition-transform group-hover:scale-105 duration-300">
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            </div>
            {partner.isActive && (
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white shadow-sm flex items-center">
                <span className="w-2 h-2 rounded-full bg-white mr-1.5 animate-pulse"></span>
                กำลังเปิดรับงาน
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left pt-2">
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
              {name}
            </h1>
            <p className="text-brand font-medium text-sm md:text-lg mb-4">{role}</p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              {phone && (
                <a 
                  href={`tel:${phone}`}
                  onClick={() => console.log('Track click contact')} // Should deduct partner credit in full system
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-brand hover:bg-brand-dark transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  โทรติดต่อร้าน ({phone})
                </a>
              )}
              {mapsUrl && (
                <a 
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-brand/20 text-sm font-medium rounded-xl text-brand bg-brand/5 hover:bg-brand hover:text-white transition-all shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  นำทางด้วย Google Maps
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                รายละเอียดบริการ
              </h3>
              <div className="prose prose-slate max-w-none">
                {partner.description ? (
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{partner.description}</p>
                ) : (
                  <p className="text-slate-500 italic">ร้านค้านี้ยังไม่ได้เพิ่มรายละเอียดเพิ่มเติม แต่พร้อมให้บริการตามหมวดหมู่ความเชี่ยวชาญครับ</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                การรับรองระบบ
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-slate-600">ยืนยันตัวตนกับระบบแล้ว</span>
                </li>
                {partner.points > 0 && (
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-600">ช่างเครดิตดีเยี่ยม ({partner.points} Points)</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfilePage;
