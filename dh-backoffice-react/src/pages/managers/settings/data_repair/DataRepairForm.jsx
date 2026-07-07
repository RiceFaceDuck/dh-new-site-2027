import React from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { Search, Wrench, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const DataRepairForm = ({ hookData }) => {
    const { user } = useAuth();
    const { loading, anomalies, logs, scanForCorruptedOrders, scanForCreditAnomalies, fixOrder } = hookData;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">ตัวช่วยค้นหาและซ่อมแซมข้อมูล</h3>
                    <p className="text-sm text-gray-500">สแกนหาออเดอร์เก่าที่มีปัญหาและกู้คืนข้อมูล</p>
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
                <div className="flex flex-col items-center justify-center p-8 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700">
                    <CheckCircle2 size={48} className="mb-3 opacity-80" />
                    <span className="font-bold text-lg">ฐานข้อมูลสมบูรณ์!</span>
                    <span className="text-sm opacity-80">ไม่พบออเดอร์ที่ข้อมูลผิดปกติ</span>
                </div>
            )}
        </div>
    );
};

export default DataRepairForm;
