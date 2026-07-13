import { BookOpen, AlertTriangle, Wallet, Coins, Clock, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import GuidePanel from '../../components/common/GuidePanel';
import { useAuditLedger } from './hooks/useAuditLedger';

export default function AuditLedger() {
    const { transactions, isLoading, error } = useAuditLedger();

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen">
            {/* Header & Guide */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-0 lg:mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-xs shrink-0">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Audit Ledger</h1>
                        <p className="text-slate-500 font-medium mt-1">สมุดบัญชีแยกประเภท: ตรวจสอบการไหลของแต้มและเงิน (System-wide)</p>
                    </div>
                </div>

                {/* In-App Documentation */}
                <div className="lg:max-w-xl w-full lg:-mb-6">
                    <GuidePanel 
                        title="บัญชีแยกประเภท (Audit Ledger)"
                        description="หน้านี้ใช้สำหรับตรวจสอบประวัติการทำธุรกรรมทั้งหมดในระบบ ทั้งการเข้า-ออกของกระเป๋าเงินสด (Wallet) และแต้มสะสม (Credit Points) โดยเรียงลำดับตามเวลาจริง เพื่อใช้สืบหาความผิดปกติหรือการทุจริต"
                        howTo={[
                            "ดูประเภทธุรกรรมจากไอคอน: ไอคอนสีม่วงคือแต้มสะสม สีฟ้าคือเงินสด Wallet",
                            "ดูทิศทางการไหลของเงิน: ลูกศรสีเขียวชี้ขึ้นหมายถึงเงิน/แต้มไหลเข้า (Earn/Deposit) ส่วนลูกศรสีแดงชี้ลงหมายถึงเงิน/แต้มไหลออก (Spend/Withdraw)",
                            "อ้างอิงจาก Reference ID ไปค้นหาต่อในหน้า Todo หรือ Orders หากพบความผิดปกติ"
                        ]}
                        tips={[
                            "การ Refund เมื่อยกเลิกบิล จะถูกบันทึกเป็น 'เงินเข้า' เพื่อดึงยอดกลับสู่กระเป๋าลูกค้า",
                            "หากพบ 'System' เป็นผู้บันทึกรายการ หมายถึงระบบทำการประมวลผลให้แบบอัตโนมัติ"
                        ]}
                        expectedResult="ระบบจะแสดงประวัติล่าสุดรวมกัน 200 รายการ (100 จากกระเป๋าเงิน, 100 จากแต้ม) หากข้อมูลไม่ขึ้นหรือแสดง Error อาจเกิดจากการที่ฐานข้อมูล Firestore กำลังสร้าง Index กรุณารอประมาณ 5 นาที"
                    />
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 mb-6">
                    <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold">เกิดข้อผิดพลาดในการดึงข้อมูล</h4>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 flex flex-col h-[600px]">
                {/* Header Row */}
                <div className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600 flex pr-4">
                    <div className="p-4 w-40 shrink-0">วันเวลา</div>
                    <div className="p-4 flex-1 min-w-[200px]">ลูกค้า / ผู้รับ</div>
                    <div className="p-4 w-40 shrink-0">ประเภท / บัญชี</div>
                    <div className="p-4 w-32 shrink-0 text-right">จำนวน</div>
                    <div className="p-4 w-32 shrink-0 text-right">ยอดคงเหลือ</div>
                    <div className="p-4 w-40 shrink-0">เลขอ้างอิง</div>
                    <div className="p-4 w-48 shrink-0">หมายเหตุ / ผู้บันทึก</div>
                </div>
                
                {/* Body */}
                <div className="flex-1 min-h-0 bg-white">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            กำลังโหลดสมุดบัญชี...
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            ไม่พบประวัติการทำธุรกรรมในระบบ
                        </div>
                    ) : (
                        <AutoSizer>
                            {({ height, width }) => (
                                <List
                                    height={height}
                                    itemCount={transactions.length}
                                    itemSize={72}
                                    width={width}
                                    itemData={transactions}
                                >
                                    {({ index, style, data }) => {
                                        const tx = data[index];
                                        return (
                                            <div 
                                                style={style} 
                                                className="flex items-center text-sm border-b border-slate-100 hover:bg-slate-50/80 transition-colors group"
                                            >
                                                <div className="p-4 w-40 shrink-0 text-slate-500 whitespace-nowrap flex items-center gap-1.5">
                                                    <Clock size={14} className="text-slate-400" />
                                                    <div className="flex flex-col">
                                                        <span>{tx.timestamp.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                                                        <span className="text-xs text-slate-400">{tx.timestamp.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                                <div className="p-4 flex-1 min-w-[200px] overflow-hidden">
                                                    <div className="font-medium text-slate-800 truncate">{tx.customerName}</div>
                                                    <div className="text-xs text-slate-400 font-mono mt-0.5 truncate" title={tx.customerUid}>UID: {tx.customerUid?.substring(0, 8)}...</div>
                                                </div>
                                                <div className="p-4 w-40 shrink-0">
                                                    <div className="flex items-center gap-2">
                                                        {tx.source === 'credit' ? (
                                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-medium text-xs border border-purple-100">
                                                                <Coins size={12} /> Credit Points
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium text-xs border border-blue-100">
                                                                <Wallet size={12} /> Cash Wallet
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-4 w-32 shrink-0 text-right font-medium">
                                                    <div className={`flex items-center justify-end gap-1 ${tx.type === 'earn' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {tx.type === 'earn' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                        {tx.type === 'earn' ? '+' : '-'}{tx.amount?.toLocaleString()} {tx.source === 'credit' ? 'Pts' : '฿'}
                                                    </div>
                                                </div>
                                                <div className="p-4 w-32 shrink-0 text-right font-mono text-slate-600">
                                                    {tx.balanceAfter !== null && tx.balanceAfter !== undefined ? tx.balanceAfter.toLocaleString() : '-'}
                                                </div>
                                                <div className="p-4 w-40 shrink-0">
                                                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-sm text-slate-600 border border-slate-200 truncate block">
                                                        {tx.referenceId || '-'}
                                                    </span>
                                                </div>
                                                <div className="p-4 w-48 shrink-0">
                                                    <div className="text-slate-700 truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all" title={tx.note}>{tx.note || '-'}</div>
                                                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                        By: <span className="font-medium text-slate-500 truncate">{tx.actor}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }}
                                </List>
                            )}
                        </AutoSizer>
                    )}
                </div>
            </div>
        </div>
    );
}
