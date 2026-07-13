import { PackageSearch, Clock, TrendingUp, Check } from 'lucide-react';
import GuidePanel from '../../components/common/GuidePanel';
import { useSourcingRequests } from './hooks/useSourcingRequests';

export default function NonExistingProducts() {
  const { requests, loading, updateStatus } = useSourcingRequests();

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toMillis) return '-';
    return new Date(timestamp.toMillis()).toLocaleDateString('th-TH', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
  };

  if (loading) return <div className="py-20 text-center text-dh-muted animate-pulse text-sm">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="space-y-6">
      
      <GuidePanel 
        title="ระบบ Sourcing Demand (ความต้องการสินค้า)"
        description="รวบรวมคำค้นหา (Keywords) ที่พนักงานสาขาค้นหาแล้วไม่พบสินค้าในระบบ ช่วยให้ฝ่ายจัดซื้อทราบว่าลูกค้ากำลังตามหาสินค้าอะไรอยู่"
        howTo={[
          "ตรวจสอบรายชื่อสินค้าที่มีการค้นหาบ่อยที่สุดจากรายการด้านล่าง",
          "หากต้องการนำเข้าสินค้านี้ ให้ประสานงานฝ่ายจัดซื้อเพื่อหา Supplier",
          "เมื่อนำเข้าสินค้าเข้าสต๊อกแล้ว ให้กดปุ่ม 'นำเข้าแล้ว'",
          "หากสินค้านั้นไม่สามารถจัดหาได้ หรือไม่เกี่ยวข้อง ให้กดปุ่ม 'ปฏิเสธ' เพื่อปิดรายการ"
        ]}
        tips={[
          "ตัวเลข 'ค้นหา x ครั้ง' ยิ่งสูง ยิ่งหมายถึงความต้องการของลูกค้าที่หน้าร้านมีมาก",
          "พนักงานหน้าร้านจะเห็นปุ่ม 'แจ้งฝ่ายจัดซื้อ' เมื่อค้นหาสินค้าไม่พบ"
        ]}
        expectedResult="รายการที่ถูกกด นำเข้าแล้ว หรือ ปฏิเสธ จะถูกบันทึกประวัติการตัดสินใจไว้"
      />

      <div className="bg-dh-surface border border-dh-border rounded-xl shadow-xs overflow-hidden animate-in fade-in duration-300">
        
        {/* Header Info */}
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 border-b border-emerald-100 dark:border-emerald-900/30 flex items-start sm:items-center gap-3">
          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg shadow-xs">
          <TrendingUp size={20} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">
            สินค้ายังไม่มีจำหน่าย (Sourcing Demand)
          </h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
            สถิติ Keyword ที่พนักงานค้นหาหน้า Search แล้วไม่พบสินค้า เรียงตามจำนวนความต้องการ
          </p>
        </div>
      </div>

      {/* List Content */}
      <div className="divide-y divide-dh-border">
        {requests.length === 0 ? (
          <div className="p-16 text-center">
            <PackageSearch size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-dh-main font-bold">ยังไม่มีข้อมูลความต้องการสินค้าใหม่</p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className={`p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
              req.status === 'ignored' ? 'opacity-50' : ''
            }`}>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-sm text-dh-main truncate">{req.keyword}</h4>
                  {req.status === 'sourced' && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-sm font-bold">จัดซื้อแล้ว</span>
                  )}
                  {req.status === 'ignored' && (
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-sm font-bold">ปิดรายการ</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-dh-muted">
                  <span className="font-bold text-emerald-600">ค้นหา {req.demandCount} ครั้ง</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> ล่าสุด: {formatDate(req.lastRequestedAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0">
                {req.status === 'pending' ? (
                  <>
                    <button 
                      onClick={() => updateStatus(req.id, 'sourced')} 
                      className="flex-1 sm:flex-none bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Check size={14} /> นำเข้าแล้ว
                    </button>
                    <button 
                      onClick={() => updateStatus(req.id, 'ignored')} 
                      className="bg-white dark:bg-slate-800 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-dh-border text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                    >
                      ปฎิเสธ
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => updateStatus(req.id, 'pending')} 
                    className="text-xs text-dh-muted hover:text-dh-main underline px-2 py-1"
                  >
                    คืนค่าสถานะ
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  );
}