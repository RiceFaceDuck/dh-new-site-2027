import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Briefcase, Receipt, ArrowRight } from 'lucide-react';

/**
 * Component แสดงหน้าจอเมื่อทำรายการสำเร็จ
 * แยกประเภทระหว่างการสั่งซื้อปกติ และ การขอราคาส่ง B2B
 */
const CheckoutSuccess = ({ isB2B }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-md shadow-premium border border-gray-100 p-8 md:p-12 max-w-md w-full text-center animate-in zoom-in-95 duration-500 relative overflow-hidden">
        {/* แถบสีด้านบนแยกประเภท */}
        <div className={`absolute top-0 left-0 w-full h-1.5 ${isB2B ? 'bg-indigo-600' : 'bg-[#0870B8]'}`}></div>

        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${isB2B ? 'bg-indigo-50' : 'bg-[#E6F0F9]'}`}>
          {isB2B ? <Briefcase size={40} className="text-indigo-600" /> : <CheckCircle2 size={40} className="text-[#0870B8]" />}
        </div>

        <h2 className="text-2xl font-black text-gray-800 mb-3 uppercase tracking-tight">
          {isB2B ? 'Request Sent!' : 'Success!'}
        </h2>

        <div className={`${isB2B ? 'bg-indigo-50/50' : 'bg-[#E6F0F9]/50'} rounded-md p-5 mb-8 border border-gray-100 text-left`}>
          <p className="text-gray-700 text-sm leading-relaxed">
            {isB2B 
              ? 'คำขอราคาส่งของคุณถูกส่งเข้าระบบแล้ว พนักงานจะรีบดำเนินการตรวจสอบและประเมินราคาให้ท่านโดยเร็วที่สุด ท่านสามารถติดตามสถานะบิลได้ที่หน้าโปรไฟล์'
              : 'เราได้รับรายการสั่งซื้อของคุณแล้ว แอดมินกำลังตรวจสอบความถูกต้องของหลักฐานการชำระเงินของท่าน หากเรียบร้อยแล้วสถานะจะเปลี่ยนเป็นเตรียมจัดส่ง'}
          </p>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => navigate('/profile')} 
            className={`w-full text-white font-bold py-4 rounded-md shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isB2B ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#0870B8] hover:bg-[#054D80]'}`}
          >
            <Receipt size={18} /> ติดตามสถานะ (Profile)
          </button>
          
          <button 
            onClick={() => navigate('/')} 
            className="w-full text-gray-500 font-bold py-2 text-sm hover:text-gray-800 transition-colors flex items-center justify-center gap-1"
          >
            กลับหน้าหลัก <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;