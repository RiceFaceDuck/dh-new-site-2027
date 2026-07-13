import { useToast } from '../../../context/ToastContext';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';

const StoreProfileHero = ({ partner }) => {
  const { showToast } = useToast();

  const avatar = partner.storeImage || partner.storeProfile?.logoUrl || partner.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop';
  const name = getCustomerDisplayName(partner, 'ช่างซ่อมอิสระ');
  const role = partner.services || partner.role || 'บริการซ่อมคอมพิวเตอร์และอุปกรณ์ไอที';
  const phone = partner.phone || partner.storeProfile?.phone || '';
  const mapsUrl = partner.mapsUrl || partner.storeProfile?.mapsUrl || '';

  return (
    <>
      {/* Premium Header/Cover */}
      <div className="h-64 md:h-80 w-full bg-linear-to-r from-brand-dark via-brand to-brand-accent relative overflow-hidden">
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
          <div className="relative group shrink-0">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden ring-4 ring-white shadow-lg bg-white transform transition-transform group-hover:scale-105 duration-300">
              <img src={avatar} alt={name} className="w-full h-full object-cover"  loading="lazy" />
            </div>
            {partner.isActive && (
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white shadow-xs flex items-center">
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
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-brand/20 text-sm font-medium rounded-xl text-brand bg-brand/5 hover:bg-brand hover:text-white transition-all shadow-xs hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  นำทางด้วย Google Maps
                </a>
              )}
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: name, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    showToast('คัดลอกลิงก์ร้านค้าแล้ว', 'success');
                  }
                }}
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-slate-200 text-sm font-medium rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-xs hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                แชร์ร้านค้านี้
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StoreProfileHero;
