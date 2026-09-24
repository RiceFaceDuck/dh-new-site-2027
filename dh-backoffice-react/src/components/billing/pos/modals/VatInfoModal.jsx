import React from 'react';
import { Scale, X, FileText, CheckCircle2, BookOpen, ExternalLink } from 'lucide-react';

/**
 * VatInfoModal - แสดงหลักการคิดภาษีมูลค่าเพิ่ม (VAT) และการอ้างอิงข้อกฎหมายตามประมวลรัษฎากร
 * Reconstructed with 100% parity from Production DH Notebook.
 */
export const VatInfoModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-100 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[85vh] border border-slate-200 dark:border-slate-700"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-900 text-white">
                    <h2 className="text-base font-black flex items-center gap-2.5">
                        <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                            <Scale size={18} />
                        </div>
                        หลักการคิดภาษีมูลค่าเพิ่ม (VAT) & อ้างอิงข้อกฎหมายไทย
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-all cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 text-sm text-slate-700 dark:text-slate-300 bg-slate-50/40 dark:bg-slate-900/40">
                    {/* Section 1: POS Calculation Principles */}
                    <section className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2 text-base border-b pb-2 border-slate-100 dark:border-slate-700">
                            <FileText size={18} className="text-blue-600" />
                            1. หลักการคำนวณภาษีที่ใช้งานอยู่ในระบบ (DH Notebook POS)
                        </h3>
                        <div className="space-y-3 pl-1">
                            <div className="bg-blue-50/60 dark:bg-blue-900/20 p-3.5 rounded-lg border border-blue-100 dark:border-blue-800/40">
                                <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-1">
                                    🟢 กรณีตั้งค่าบิลแบบ "รวม VAT" (Included VAT):
                                </h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                                    ราคาสินค้าและส่วนลดทั้งหมดที่คีย์ในระบบ ถือเป็นราคารวมภาษีมูลค่าเพิ่ม 7% แล้ว ระบบจะคำนวณถอด VAT ก่อนแสดงในตารางใบกำกับภาษีเต็มรูปแบบ ดังนี้:
                                </p>
                                <ul className="list-disc pl-5 text-xs space-y-1 text-slate-700 dark:text-slate-300 font-mono">
                                    <li>ราคาสินค้าก่อน VAT = ราคาสินค้ารวม VAT ÷ 1.07</li>
                                    <li>ส่วนลดก่อน VAT = ส่วนลดรวม VAT ÷ 1.07</li>
                                    <li>ภาษี VAT 7% รวม = (รวมราคาสินค้าก่อน VAT - รวมส่วนลดก่อน VAT) × 7%</li>
                                </ul>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                                        🔵 กรณีตั้งค่าบิลแบบ "แยก VAT" (Excluded VAT):
                                    </span>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        คำนวณส่วนลดจากราคาสินค้าก่อน แล้วนำยอดสุทธิมาบวก VAT 7% เพิ่มเข้าไป
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                                        ⚪ กรณีตั้งค่าบิลแบบ "ไม่มี VAT" (Exempt):
                                    </span>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        คำนวณยอดขายตามปกติ โดยไม่มีการถอดหรือบวกภาษีมูลค่าเพิ่ม
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Accounting Facts & International Commercial Standards */}
                    <section className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2 text-base border-b pb-2 border-slate-100 dark:border-slate-700">
                            <CheckCircle2 size={18} className="text-emerald-600" />
                            2. ข้อเท็จจริงทางบัญชีและมาตรฐานการค้าสากล
                        </h3>
                        <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                            <li className="flex gap-2 items-start">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>
                                    <strong>มาตรฐานใบกำกับภาษีเต็มรูปแบบ:</strong> ระบบ ERP ชั้นนำทุกแห่ง (เช่น SAP, Zoho Books, Express, FlowAccount, Central, Lotus's) จะถอด VAT 7% ออกจากรายการสินค้าและส่วนลด เพื่อให้ตารางบิลแสดงมูลค่าสุทธิก่อนภาษีที่แท้จริง
                                </span>
                            </li>
                            <li className="flex gap-2 items-start">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>
                                    <strong>การถอด VAT ที่ส่วนลด:</strong> ส่วนลดที่ผู้ขายลดให้ลูกค้ารวมภาษีมูลค่าเพิ่มด้วย ดังนั้นในตัวส่วนลด 20 บาท จึงประกอบด้วยส่วนลดค่าสินค้าจริง 18.69 บาท และส่วนลดภาษี VAT 1.31 บาท
                                </span>
                            </li>
                            <li className="flex gap-2 items-start">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>
                                    <strong>ป้องกันภาษีคำนวณซ้ำซ้อน:</strong> หากไม่ถอด VAT ที่ส่วนลด ยอดรวมภาษี 7% ท้ายบิลจะสูงกว่าความเป็นจริง ซึ่งไม่ตรงกับฐานภาษีจริงตามกฎหมายสรรพากร
                                </span>
                            </li>
                        </ul>
                    </section>

                    {/* Section 3: Legal Revenue Code References */}
                    <section className="bg-amber-50/60 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-200 dark:border-amber-800/40">
                        <h3 className="font-bold text-amber-950 dark:text-amber-400 mb-3 flex items-center gap-2 text-base border-b pb-2 border-amber-200/60 dark:border-amber-700/60">
                            <BookOpen size={18} className="text-amber-600" />
                            3. แหล่งอ้างอิงตามกฎหมายประมวลรัษฎากร (กรมสรรพากร)
                        </h3>
                        <div className="space-y-3 text-xs">
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-amber-200/80 dark:border-slate-700">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                                    📜 ประมวลรัษฎากร มาตรา 86/4 (4):
                                </span>
                                <p className="text-slate-600 dark:text-slate-400">
                                    กำหนดว่ารายการในใบกำกับภาษีเต็มรูปแบบ ต้องแสดง <em>"จำนวนภาษีมูลค่าเพิ่มที่คำนวณจากมูลค่าของสินค้าหรือบริการ โดยให้แยกออกจากมูลค่าของสินค้าหรือบริการให้ชัดแจ้ง"</em>
                                </p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-amber-200/80 dark:border-slate-700">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                                    📜 ประมวลรัษฎากร มาตรา 79 (1):
                                </span>
                                <p className="text-slate-600 dark:text-slate-400">
                                    กำหนดฐานภาษีสำหรับการขายสินค้า ได้แก่ <em>"มูลค่าทั้งหมดที่ผู้ขายได้รับจากการขายสินค้า... หลังหักส่วนลดหรือค่าลดหย่อนที่ผู้ขายสินค้าได้ลดให้ในขณะขายสินค้าและได้แสดงไว้ชัดแจ้งในใบกำกับภาษี"</em>
                                </p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-amber-200/80 dark:border-slate-700">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                                    📜 คำสั่งกรมสรรพากร ที่ ป. 86/2542:
                                </span>
                                <p className="text-slate-600 dark:text-slate-400">
                                    กำหนดหลักเกณฑ์การคำนวณมูลค่าก่อนภาษีมูลค่าเพิ่ม กรณีผู้ประกอบการจดทะเบียนระบุราคาสินค้าหรือบริการเป็นราคารวมภาษีมูลค่าเพิ่ม (Included VAT)
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center">
                    <a 
                        href="https://www.rd.go.th" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="คลิกเพื่อไปยังหน้าแรกเว็บไซต์กรมสรรพากร (rd.go.th)"
                    >
                        <span>อัปเดตตามมาตรฐานกรมสรรพากรประเทศไทย</span>
                        <ExternalLink size={13} />
                    </a>
                    <button 
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                    >
                        เข้าใจแล้ว
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VatInfoModal;
