import PartnerReviews from './PartnerReviews';

const StoreProfileInfo = ({ partner, currentUser }) => {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 md:p-8">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            รายละเอียดบริการ
          </h3>
          <div className="prose prose-slate max-w-none">
            {partner.richDescription || partner.description ? (
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{partner.richDescription || partner.description}</p>
            ) : (
              <p className="text-slate-500 italic">ร้านค้านี้ยังไม่ได้เพิ่มรายละเอียดเพิ่มเติม แต่พร้อมให้บริการตามหมวดหมู่ความเชี่ยวชาญครับ</p>
            )}
          </div>
          
          {partner.galleryImages && partner.galleryImages.length > 0 && (
            <div className="mt-8">
              <h4 className="text-lg font-bold text-slate-700 mb-4">ผลงาน / แกลลอรี่ภาพ</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {partner.galleryImages.map((img, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden aspect-square shadow-xs border border-slate-100">
                    <img loading="lazy" src={img} alt={`Gallery ${idx}`} className="w-full h-full object-contain hover:scale-110 transition-transform duration-500 cursor-pointer" onClick={() => window.open(img, '_blank')} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Reviews & Ratings Section */}
        <PartnerReviews partnerId={partner.id} ownerId={partner.ownerId} currentUser={currentUser} />
      </div>

      <div className="space-y-6">
        <div className="bg-linear-to-br from-slate-50 to-white rounded-2xl shadow-xs border border-slate-100 p-6 md:p-8">
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

        {/* Location Section */}
        {(partner.address || partner.landmarks) && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              ตำแหน่งที่ตั้งร้าน
            </h3>
            {partner.address && (
              <div className="mb-3">
                <p className="text-xs font-bold text-slate-500 uppercase">ที่อยู่ร้าน</p>
                <p className="text-sm text-slate-700">{partner.address}</p>
              </div>
            )}
            {partner.landmarks && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">จุดสังเกต</p>
                <p className="text-sm text-slate-700">{partner.landmarks}</p>
              </div>
            )}
          </div>
        )}

        {/* Social Links Section */}
        {(partner.lineUrl || partner.messengerUrl || partner.websiteUrl || partner.youtubeUrl || partner.tiktokUrl || partner.shopeeUrl || partner.lazadaUrl) && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              ช่องทางการติดต่อ
            </h3>
            <div className="flex flex-col gap-3">
              {partner.lineUrl && (
                <a href={partner.lineUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-green-50 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3 group-hover:bg-green-500 group-hover:text-white transition-colors">LINE</div>
                  <span className="text-sm text-slate-600 font-medium group-hover:text-green-700">LINE Official</span>
                </a>
              )}
              {partner.messengerUrl && (
                <a href={partner.messengerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-blue-50 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 group-hover:bg-blue-500 group-hover:text-white transition-colors">FB</div>
                  <span className="text-sm text-slate-600 font-medium group-hover:text-blue-700">Messenger</span>
                </a>
              )}
              {partner.websiteUrl && (
                <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-slate-50 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mr-3 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                  </div>
                  <span className="text-sm text-slate-600 font-medium group-hover:text-slate-800">เว็บไซต์ร้าน</span>
                </a>
              )}
              {partner.youtubeUrl && (
                <a href={partner.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-3 group-hover:bg-red-600 group-hover:text-white transition-colors">YT</div>
                  <span className="text-sm text-slate-600 font-medium group-hover:text-red-700">YouTube</span>
                </a>
              )}
              {partner.tiktokUrl && (
                <a href={partner.tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-slate-100 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center mr-3 group-hover:bg-black group-hover:text-white transition-colors">TT</div>
                  <span className="text-sm text-slate-600 font-medium group-hover:text-black">TikTok</span>
                </a>
              )}
              {partner.shopeeUrl && (
                <a href={partner.shopeeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-orange-50 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mr-3 group-hover:bg-orange-500 group-hover:text-white transition-colors">SH</div>
                  <span className="text-sm text-slate-600 font-medium group-hover:text-orange-700">Shopee</span>
                </a>
              )}
              {partner.lazadaUrl && (
                <a href={partner.lazadaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-indigo-50 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 group-hover:bg-indigo-800 group-hover:text-white transition-colors">LZ</div>
                  <span className="text-sm text-slate-600 font-medium group-hover:text-indigo-800">Lazada</span>
                </a>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StoreProfileInfo;
