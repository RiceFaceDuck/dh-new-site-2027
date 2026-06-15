import React from 'react';

const PackingTaskCard = ({ 
  task, 
  processingId, 
  onStartPacking, 
  onSelectTask 
}) => {
  const isInProgress = task.status === 'in_progress';

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors ${isInProgress ? 'border-orange-300 ring-1 ring-orange-100' : 'border-gray-200'}`}>
      
      {/* Header ของแต่ละการ์ดงาน */}
      <div className={`px-4 py-3 flex justify-between items-center ${isInProgress ? 'bg-orange-50/50' : 'bg-gray-50'}`}>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">เลขที่บิล</span>
          <span className="font-black text-gray-900 text-lg leading-none mt-0.5">{task.invoiceId || 'ไม่มีเลขบิล'}</span>
        </div>
        <div>
           {isInProgress ? (
             <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-1 rounded-md uppercase flex items-center gap-1 shadow-sm">
               <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> กำลังแพ็ค
             </span>
           ) : (
             <span className="bg-gray-200 text-gray-600 text-[10px] font-black px-2 py-1 rounded-md uppercase">
               รอจัดของ
             </span>
           )}
        </div>
      </div>

      {/* ข้อมูลการจัดส่ง (สำคัญสำหรับคนแพ็ค) */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start gap-3">
           <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
           </div>
           <div>
             <p className="font-bold text-gray-900 text-sm">{task.customerName}</p>
             <p className="text-xs text-gray-600 mt-1 leading-relaxed">
               {task.shippingAddress?.address} {task.shippingAddress?.subdistrict} {task.shippingAddress?.district} {task.shippingAddress?.province} {task.shippingAddress?.zipcode}
             </p>
             <p className="text-xs font-semibold text-gray-700 mt-1">โทร: {task.shippingAddress?.phone}</p>
           </div>
        </div>
      </div>

      {/* รายการสินค้าที่ต้องหยิบ (Checklist) */}
      <div className="p-4 bg-gray-50/30">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
          รายการสินค้า ({task.items?.length || 0} รายการ)
        </h4>
        
        <div className="space-y-3">
          {task.items?.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
              {/* กล่องติ๊กถูก (ทำหลอกๆ ให้พนักงานกดเล่นเวลาหยิบของ) */}
              <div className="w-6 h-6 rounded border-2 border-gray-300 flex-shrink-0 active:bg-indigo-100 active:border-indigo-400 transition-colors cursor-pointer hover:bg-gray-50"></div>
              
              <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : null}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight">{item.name}</p>
                <p className="text-xs text-gray-500 mt-1">SKU: {item.sku || 'N/A'}</p>
              </div>
              
              <div className="shrink-0 bg-indigo-50 text-indigo-700 font-black text-lg w-10 h-10 flex items-center justify-center rounded-lg border border-indigo-100 shadow-inner">
                x{item.quantity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ปุ่ม Action (ใหญ่ๆ กดง่ายๆ) */}
      <div className="p-4 border-t border-gray-100 bg-white">
        {isInProgress ? (
          <button 
            onClick={() => onSelectTask(task)}
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-black text-lg rounded-xl shadow-[0_4px_0_rgb(22,163,74)] active:shadow-[0_0px_0_rgb(22,163,74)] active:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            แพ็คเสร็จแล้ว (ระบุเลขพัสดุ)
          </button>
        ) : (
          <button 
            onClick={() => onStartPacking(task.id)}
            disabled={processingId === task.id}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg rounded-xl shadow-[0_4px_0_rgb(234,88,12)] active:shadow-[0_0px_0_rgb(234,88,12)] active:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            {processingId === task.id ? 'กำลังเริ่ม...' : 'หยิบงานนี้ (เริ่มแพ็ค)'}
          </button>
        )}
      </div>

    </div>
  );
};

export default PackingTaskCard;
