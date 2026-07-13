import { useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { Search, Wrench, CheckCircle2, AlertCircle, Loader2, Database, Users, Package, ShoppingCart } from 'lucide-react';
import { dataRepairService } from '../../../../firebase/dataRepairService';
import { gasHistoryService } from '../../../../firebase/gasHistoryService';

const DataRepairForm = ({ hookData }) => {
    const { user } = useAuth();
    const { loading, anomalies, logs, scanForCorruptedOrders, scanForCreditAnomalies, fixOrder } = hookData;
    
    // Schema Migration States
    const [migLogs, setMigLogs] = useState([]);
    const [status, setStatus] = useState({
      users: { loading: false, count: 0, done: false },
      products: { loading: false, count: 0, done: false },
      orders: { loading: false, count: 0, done: false },
    });

    const addMigLog = (msg, type = 'info') => {
      setMigLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
    };

    const handleMigration = async (type) => {
      if (!window.confirm(`คุณต้องการซ่อมแซมและปรับปรุงโครงสร้างข้อมูล ${type.toUpperCase()} ใช่หรือไม่?`)) return;

      setStatus(prev => ({ ...prev, [type]: { ...prev[type], loading: true, done: false } }));
      addMigLog(`เริ่มดำเนินการซ่อมแซมข้อมูล ${type.toUpperCase()}...`);

      const updateProgress = (msg) => {
        addMigLog(msg);
      };

      try {
        let result = { count: 0 };
        const adminUid = user?.uid;

        switch(type) {
          case 'users':
            result = await dataRepairService.repairUsersWallet(updateProgress);
            break;
          case 'products':
            result = await dataRepairService.repairProductsSchema(updateProgress);
            break;
          case 'orders':
            result = await dataRepairService.repairOrdersSchema(updateProgress);
            break;
          default:
            break;
        }

        setStatus(prev => ({ ...prev, [type]: { loading: false, count: result.count, done: true } }));
        addMigLog(`✅ ซ่อมแซมข้อมูล ${type.toUpperCase()} สำเร็จแล้ว (อัปเดต ${result.count} รายการ)`, 'success');

        gasHistoryService.log({
          level: 'INFO',
          module: 'System',
          action: 'DataRepair',
          target: { id: type, type: 'Module' },
          details: { legacy_details: `รัน Schema Migration สำหรับ ${type} สำเร็จ (อัปเดต ${result.count} รายการ)` },
          actorOverride: { uid: adminUid, name: user?.displayName || 'System Admin' }
        });

      } catch (err) {
        console.error(err);
        setStatus(prev => ({ ...prev, [type]: { ...prev[type], loading: false } }));
        addMigLog(`❌ เกิดข้อผิดพลาดในการซ่อมแซม ${type.toUpperCase()}: ${err.message}`, 'error');
      }
    };

    const modules = [
      { id: 'users', title: 'ปรับปรุงกระเป๋าเงิน (Wallet)', icon: Users, desc: 'เพิ่มฟิลด์ walletBalance ให้กับลูกค้าเก่า' },
      { id: 'products', title: 'ปรับปรุงโครงสร้างสินค้า', icon: Package, desc: 'เพิ่มฟิลด์ defectQuantity และ stats' },
      { id: 'orders', title: 'ปรับปรุงบิลคำสั่งซื้อเก่า', icon: ShoppingCart, desc: 'เพิ่มฟิลด์ refundsAndClaims, totalDiscount' },
    ];

    return (
        <div className="space-y-8">
            {/* 1. Schema Migration Section */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Database className="text-blue-600" size={24} />
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">อัปเดตโครงสร้างฐานข้อมูล (Schema Migration)</h3>
                            <p className="text-sm text-slate-500 font-medium">รันสคริปต์เพื่อปรับปรุงข้อมูลเก่าให้มีฟิลด์ครบถ้วนสำหรับระบบใหม่</p>
                        </div>
                    </div>
                </div>
                
                <div className="p-5 bg-white grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        {modules.map((mod) => {
                            const st = status[mod.id];
                            return (
                                <div key={mod.id} className="border border-slate-100 rounded-xl p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><mod.icon size={20} /></div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{mod.title}</h4>
                                            <p className="text-xs text-slate-500">{mod.desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {st.done && <span className="text-xs font-bold text-emerald-600">({st.count})</span>}
                                        <button 
                                            onClick={() => handleMigration(mod.id)}
                                            disabled={st.loading}
                                            className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg disabled:bg-slate-300 flex items-center gap-2 hover:bg-slate-800"
                                        >
                                            {st.loading ? <Loader2 size={14} className="animate-spin" /> : "Run"}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="bg-slate-900 rounded-xl flex flex-col overflow-hidden h-[250px]">
                        <div className="px-3 py-2 bg-slate-950 flex justify-between items-center border-b border-slate-800">
                            <span className="text-xs font-mono text-slate-400">Migration Logs</span>
                            <button onClick={() => setMigLogs([])} className="text-[10px] text-slate-500 hover:text-white">Clear</button>
                        </div>
                        <div className="p-3 overflow-y-auto flex-1 font-mono text-[11px] space-y-1">
                            {migLogs.length === 0 ? (
                                <div className="text-slate-600 text-center mt-8">Waiting...</div>
                            ) : (
                                migLogs.map((log, i) => (
                                    <div key={i} className={`flex gap-2 ${log.type==='error'?'text-red-400':log.type==='success'?'text-emerald-400':'text-slate-300'}`}>
                                        <span className="text-slate-500">[{log.time}]</span>
                                        <span>{log.msg}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Anomaly Detection Section */}
            <div className="border border-amber-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-amber-50 px-5 py-4 border-b border-amber-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                            <Search size={20}/> ตรวจสอบความผิดปกติระดับเอกสาร (Anomaly Detection)
                        </h3>
                        <p className="text-sm text-amber-700/70 font-medium">สแกนหาบิลที่มีปัญหาหรือเงินคืนตกหล่น และแต้มไม่ตรง</p>
                    </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={scanForCreditAnomalies}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors disabled:bg-amber-300 font-medium shadow-xs"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                        {loading ? "กำลังสแกน..." : "ตรวจสอบความถูกต้องของแต้ม (Points)"}
                    </button>
                    <button
                        onClick={scanForCorruptedOrders}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:bg-blue-300 font-medium shadow-xs"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                        {loading ? "กำลังสแกน..." : "สแกนบิลที่ผิดปกติ (Orders)"}
                    </button>
                </div>
            </div>

            {/* Terminal / Logs Output */}
            <div className="bg-gray-900 rounded-xl p-4 min-h-[150px] max-h-[300px] overflow-y-auto font-mono text-sm text-gray-300 shadow-inner">
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-2 py-4">
                        <AlertCircle size={24} />
                        <span>Ready to scan database</span>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {logs.map((log, i) => (
                            <div key={i} className={
                                log.includes('✅') ? 'text-emerald-400' :
                                log.includes('❌') ? 'text-red-400' :
                                log.includes('Error') ? 'text-amber-400' : 'text-gray-300'
                            }>{log}</div>
                        ))}
                    </div>
                )}
            </div>

            {/* Results Table */}
            {anomalies.length > 0 && (
                <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
                    <div className="p-4 border-b bg-red-50 text-red-700 font-medium flex items-center gap-2">
                        <AlertCircle size={18} /> พบออเดอร์ที่มีปัญหา ({anomalies.length} รายการ)
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 uppercase">
                                <tr>
                                    <th className="px-4 py-3">Order ID</th>
                                    <th className="px-4 py-3">ปัญหาที่พบ</th>
                                    <th className="px-4 py-3">มูลค่าที่ต้องคืน</th>
                                    <th className="px-4 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-gray-800">
                                {anomalies.map(anomaly => (
                                    <tr key={anomaly.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-blue-600">{anomaly.orderId || anomaly.id}</td>
                                        <td className="px-4 py-3 text-red-600">{anomaly.issue}</td>
                                        <td className="px-4 py-3 font-mono font-bold text-amber-600">฿{anomaly.amount.toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => fixOrder(anomaly, user?.uid)}
                                                disabled={loading}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg font-medium transition-colors"
                                            >
                                                <Wrench size={16} /> ซ่อมแซม (Fix)
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {logs.length > 0 && anomalies.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center p-8 bg-emerald-50 border-t border-emerald-100 text-emerald-700">
                    <CheckCircle2 size={48} className="mb-3 opacity-80" />
                    <span className="font-bold text-lg">ฐานข้อมูลสมบูรณ์!</span>
                    <span className="text-sm opacity-80">ไม่พบเอกสารที่มีปัญหาผิดปกติ</span>
                </div>
            )}
            </div>
        </div>
    );
};

export default DataRepairForm;
