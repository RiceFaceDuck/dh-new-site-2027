import { useState, useMemo } from 'react';
import { 
    BookOpen, AlertTriangle, Wallet, Coins, Clock, ArrowDownRight, 
    ArrowUpRight, RefreshCw, Search, Download, ShieldCheck, 
    CheckCircle2, FileSpreadsheet, Filter
} from 'lucide-react';
import { FixedSizeList as List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import * as XLSX from 'xlsx';
import GuidePanel from '../../components/common/GuidePanel';
import { useAuditLedger } from './hooks/useAuditLedger';

export default function AuditLedger() {
    const { transactions, stats, isLoading, error, refreshLedger } = useAuditLedger();

    // Filter & Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'wallet' | 'credit'
    const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'earn' | 'spend'

    // Filtered data calculation
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            if (sourceFilter !== 'all' && tx.source !== sourceFilter) return false;
            if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const name = (tx.customerName || '').toLowerCase();
                const uid = (tx.customerUid || '').toLowerCase();
                const refId = (tx.referenceId || '').toLowerCase();
                const note = (tx.note || '').toLowerCase();
                const actor = (tx.actor || '').toLowerCase();
                return name.includes(term) || uid.includes(term) || refId.includes(term) || note.includes(term) || actor.includes(term);
            }
            return true;
        });
    }, [transactions, sourceFilter, typeFilter, searchTerm]);

    // Export to Excel (.xlsx)
    const handleExportExcel = () => {
        if (filteredTransactions.length === 0) return;
        const dataToExport = filteredTransactions.map((tx, idx) => ({
            'ลำดับ': idx + 1,
            'วันเวลา': tx.timestamp ? tx.timestamp.toLocaleString('th-TH') : '-',
            'ประเภทบัญชี': tx.source === 'credit' ? 'Credit Points' : 'Cash Wallet',
            'ทิศทาง': tx.type === 'earn' ? 'เงิน/แต้มเข้า (+)' : 'เงิน/แต้มออก (-)',
            'จำนวน': tx.amount,
            'หน่วย': tx.source === 'credit' ? 'Pts' : '฿',
            'ยอดคงเหลือหลังทำรายการ': tx.balanceAfter !== null && tx.balanceAfter !== undefined ? tx.balanceAfter : '-',
            'เลขอ้างอิง': tx.referenceId || '-',
            'ชื่อลูกค้า/ผู้รับ': tx.customerName || '-',
            'Customer UID': tx.customerUid || '-',
            'ผู้บันทึก': tx.actor || '-',
            'หมายเหตุ': tx.note || '-',
            'สถานะ Checksum': tx.checksumMismatch ? '⚠️ ยอดไม่ดุล (Mismatch)' : '🟢 ปกติ'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Ledger');
        const dateStr = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `DH_Audit_Ledger_${dateStr}.xlsx`);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen space-y-5">
            {/* Header & Guide */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-xs shrink-0">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Audit Ledger</h1>
                            <button
                                onClick={refreshLedger}
                                disabled={isLoading}
                                title="รีเฟรชข้อมูลล่าสุด"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={isLoading ? "animate-spin text-indigo-600" : ""} />
                            </button>
                        </div>
                        <p className="text-slate-500 font-medium mt-1">สมุดบัญชีแยกประเภท: ตรวจสอบการไหลของแต้มและเงิน (System-wide)</p>
                    </div>
                </div>

                {/* In-App Documentation */}
                <div className="lg:max-w-xl w-full">
                    <GuidePanel 
                        title="บัญชีแยกประเภท (Audit Ledger)"
                        description="หน้านี้ใช้สำหรับตรวจสอบประวัติการทำธุรกรรมทั้งหมดในระบบ ทั้งการเข้า-ออกของกระเป๋าเงินสด (Wallet) และแต้มสะสม (Credit Points) โดยเรียงลำดับตามเวลาจริง เพื่อใช้สืบหาความผิดปกติหรือการทุจริต"
                        howTo={[
                            "ดูประเภทธุรกรรมจากไอคอน: ไอคอนสีม่วงคือแต้มสะสม สีฟ้าคือเงินสด Wallet",
                            "ดูทิศทางการไหลของเงิน: ลูกศรสีเขียวชี้ขึ้นหมายถึงเงิน/แต้มไหลเข้า (Earn/Deposit) ส่วนลูกศรสีแดงชี้ลงหมายถึงเงิน/แต้มไหลออก (Spend/Withdraw)",
                            "อ้างอิงจาก Reference ID ไปค้นหาต่อในหน้า Todo หรือ Orders หากพบความผิดปกติ",
                            "ใช้ตัวกรองและช่องค้นหาด้านล่าง เพื่อเจาะจงเฉพาะรายการ หรือกดส่งออก Excel สำหรับฝ่ายตรวจสอบบัญชี"
                        ]}
                        tips={[
                            "การ Refund เมื่อยกเลิกบิล จะถูกบันทึกเป็น 'เงินเข้า' เพื่อดึงยอดกลับสู่กระเป๋าลูกค้า",
                            "หากพบ 'System' เป็นผู้บันทึกรายการ หมายถึงระบบทำการประมวลผลให้แบบอัตโนมัติ"
                        ]}
                        expectedResult="ระบบจะแสดงประวัติล่าสุดรวมกันสูงสุด 200 รายการแบบ Real-time พร้อมการตรวจดุล Checksum ความถูกต้องในทุกรายการ"
                    />
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold">เกิดข้อผิดพลาดในการดึงข้อมูล</h4>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* 🛡️ Checksum & Metric Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Cash Wallet Movement */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
                            <Wallet size={15} /> กระเป๋าเงินสด (Wallet)
                        </span>
                        <span className="text-xs font-medium text-slate-400">รายการสด</span>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-baseline text-xs">
                            <span className="text-slate-500">เงินเข้า (+):</span>
                            <span className="font-semibold text-emerald-600">+฿{stats.walletInflow?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between items-baseline text-xs">
                            <span className="text-slate-500">เงินออก (-):</span>
                            <span className="font-semibold text-rose-600">-฿{stats.walletOutflow?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 flex justify-between items-baseline">
                            <span className="text-xs font-bold text-slate-700">การเคลื่อนไหวสุทธิ:</span>
                            <span className={`text-sm font-bold font-mono ${stats.netWallet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {stats.netWallet >= 0 ? '+' : ''}฿{stats.netWallet?.toLocaleString() || '0'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Credit Points Movement */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-purple-600">
                            <Coins size={15} /> แต้มสะสม (Credit Points)
                        </span>
                        <span className="text-xs font-medium text-slate-400">รายการสด</span>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-baseline text-xs">
                            <span className="text-slate-500">แต้มเพิ่ม (+):</span>
                            <span className="font-semibold text-emerald-600">+{stats.creditInflow?.toLocaleString() || '0'} Pts</span>
                        </div>
                        <div className="flex justify-between items-baseline text-xs">
                            <span className="text-slate-500">แต้มลด (-):</span>
                            <span className="font-semibold text-rose-600">-{stats.creditOutflow?.toLocaleString() || '0'} Pts</span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 flex justify-between items-baseline">
                            <span className="text-xs font-bold text-slate-700">การเคลื่อนไหวสุทธิ:</span>
                            <span className={`text-sm font-bold font-mono ${stats.netCredit >= 0 ? 'text-purple-700' : 'text-rose-700'}`}>
                                {stats.netCredit >= 0 ? '+' : ''}{stats.netCredit?.toLocaleString() || '0'} Pts
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Checksum & Health Status */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-700">
                            <ShieldCheck size={15} className="text-emerald-600" /> สถานะสมุดบัญชี (Checksum)
                        </span>
                        <span className="text-xs font-mono text-slate-400">{stats.totalTransactions} รายการ</span>
                    </div>
                    <div className="flex flex-col justify-center h-full">
                        {stats.anomalyCount === 0 ? (
                            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-100">
                                <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                                <div>
                                    <div className="text-xs font-bold">100% Balanced (สมบูรณ์)</div>
                                    <div className="text-[11px] text-emerald-600">ไม่พบยอดกระโดดหรือข้อผิดพลาดทางบัญชี</div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                                <AlertTriangle size={18} className="shrink-0 text-amber-600" />
                                <div>
                                    <div className="text-xs font-bold">พบข้อสังเกต {stats.anomalyCount} รายการ</div>
                                    <div className="text-[11px] text-amber-700">มีรายการที่ยอดเงินไม่ดุล หรือยอดคงเหลือติดลบ</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 🔍 Search & Filter Toolbar */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาชื่อลูกค้า, UID, เลขอ้างอิง, หมายเหตุ..."
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder-slate-400"
                        />
                    </div>

                    {/* Source Filter */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                        <button
                            onClick={() => setSourceFilter('all')}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${sourceFilter === 'all' ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            ทั้งหมด
                        </button>
                        <button
                            onClick={() => setSourceFilter('wallet')}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${sourceFilter === 'wallet' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <Wallet size={12} /> เงินสด (฿)
                        </button>
                        <button
                            onClick={() => setSourceFilter('credit')}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${sourceFilter === 'credit' ? 'bg-white text-purple-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <Coins size={12} /> แต้ม (Pts)
                        </button>
                    </div>

                    {/* Direction Filter */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                        <button
                            onClick={() => setTypeFilter('all')}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${typeFilter === 'all' ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            ทิศทางทั้งหมด
                        </button>
                        <button
                            onClick={() => setTypeFilter('earn')}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-emerald-600 ${typeFilter === 'earn' ? 'bg-white shadow-xs font-bold' : 'text-slate-500 hover:text-emerald-600'}`}
                        >
                            เข้า (+)
                        </button>
                        <button
                            onClick={() => setTypeFilter('spend')}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-rose-600 ${typeFilter === 'spend' ? 'bg-white shadow-xs font-bold' : 'text-slate-500 hover:text-rose-600'}`}
                        >
                            ออก (-)
                        </button>
                    </div>
                </div>

                {/* Right Actions: Result Count & Export */}
                <div className="flex items-center gap-2.5">
                    <span className="text-xs text-slate-400 font-medium">
                        พบ <strong className="text-slate-700">{filteredTransactions.length}</strong> รายการ
                    </span>
                    <button
                        onClick={handleExportExcel}
                        disabled={filteredTransactions.length === 0}
                        title="ดาวน์โหลดเป็นไฟล์ Excel"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <FileSpreadsheet size={14} />
                        <span>Export Excel</span>
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 flex flex-col h-[calc(100vh-320px)] min-h-[460px]">
                {/* Header Row */}
                <div className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 flex pr-4 shrink-0 uppercase tracking-wider">
                    <div className="p-3.5 w-40 shrink-0">วันเวลา</div>
                    <div className="p-3.5 flex-1 min-w-[200px]">ลูกค้า / ผู้รับ</div>
                    <div className="p-3.5 w-40 shrink-0">ประเภท / บัญชี</div>
                    <div className="p-3.5 w-32 shrink-0 text-right">จำนวน</div>
                    <div className="p-3.5 w-32 shrink-0 text-right">ยอดคงเหลือ</div>
                    <div className="p-3.5 w-40 shrink-0">เลขอ้างอิง</div>
                    <div className="p-3.5 w-48 shrink-0">หมายเหตุ / ผู้บันทึก</div>
                </div>
                
                {/* Body */}
                <div className="flex-1 min-h-0 bg-white relative w-full h-full">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs font-medium">กำลังโหลดสมุดบัญชีและตรวจ Checksum...</span>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-1.5">
                            <Filter size={24} className="text-slate-300" />
                            <span className="text-xs font-medium">ไม่พบประวัติการทำธุรกรรมที่ตรงกับเงื่อนไข</span>
                        </div>
                    ) : (
                        <AutoSizer
                            renderProp={({ height, width }) => {
                                const finalHeight = height || 440;
                                const finalWidth = width || 900;
                                return (
                                    <List
                                        height={finalHeight}
                                        itemCount={filteredTransactions.length}
                                        itemSize={72}
                                        width={finalWidth}
                                        itemData={filteredTransactions}
                                    >
                                        {({ index, style, data }) => {
                                            const tx = data[index];
                                            const isNegative = tx.balanceAfter !== null && tx.balanceAfter !== undefined && tx.balanceAfter < 0;
                                            return (
                                                <div 
                                                    style={style} 
                                                    className={`flex items-center text-xs border-b border-slate-100 hover:bg-slate-50/80 transition-colors group ${tx.checksumMismatch ? 'bg-amber-50/40' : ''}`}
                                                >
                                                    {/* 1. Date & Time */}
                                                    <div className="p-3.5 w-40 shrink-0 text-slate-500 whitespace-nowrap flex items-center gap-1.5">
                                                        <Clock size={13} className="text-slate-400 shrink-0" />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-700">
                                                                {tx.timestamp.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 font-mono">
                                                                {tx.timestamp.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* 2. Customer */}
                                                    <div className="p-3.5 flex-1 min-w-[200px] overflow-hidden">
                                                        <div className="font-semibold text-slate-800 truncate" title={tx.customerName}>
                                                            {tx.customerName}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate" title={tx.customerUid}>
                                                            UID: {tx.customerUid?.substring(0, 8)}...
                                                        </div>
                                                    </div>

                                                    {/* 3. Source & Account */}
                                                    <div className="p-3.5 w-40 shrink-0">
                                                        <div className="flex items-center gap-2">
                                                            {tx.source === 'credit' ? (
                                                                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold text-[11px] border border-purple-100">
                                                                    <Coins size={11} /> Credit Points
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-100">
                                                                    <Wallet size={11} /> Cash Wallet
                                                                </span>
                                                            )}
                                                            {tx.checksumMismatch && (
                                                                <span title="ตรวจพบผลรวมยอดไม่ดุล (Checksum Mismatch)" className="text-amber-500 cursor-help">
                                                                    <AlertTriangle size={14} />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* 4. Amount */}
                                                    <div className="p-3.5 w-32 shrink-0 text-right font-bold font-mono">
                                                        <div className={`flex items-center justify-end gap-0.5 ${tx.type === 'earn' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {tx.type === 'earn' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                                                            {tx.type === 'earn' ? '+' : '-'}{tx.amount?.toLocaleString()} {tx.source === 'credit' ? 'Pts' : '฿'}
                                                        </div>
                                                    </div>

                                                    {/* 5. Balance After */}
                                                    <div className="p-3.5 w-32 shrink-0 text-right font-mono">
                                                        <span className={isNegative ? "text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded-sm" : "text-slate-600"}>
                                                            {tx.balanceAfter !== null && tx.balanceAfter !== undefined ? tx.balanceAfter.toLocaleString() : '-'}
                                                        </span>
                                                    </div>

                                                    {/* 6. Reference ID */}
                                                    <div className="p-3.5 w-40 shrink-0">
                                                        <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-sm text-slate-600 border border-slate-200 truncate block font-medium" title={tx.referenceId}>
                                                            {tx.referenceId || '-'}
                                                        </span>
                                                    </div>

                                                    {/* 7. Note & Operator */}
                                                    <div className="p-3.5 w-48 shrink-0">
                                                        <div className="text-slate-700 truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all font-medium" title={tx.note}>
                                                            {tx.note || '-'}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                            By: <span className="font-medium text-slate-500 truncate">{tx.actor}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    </List>
                                );
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
