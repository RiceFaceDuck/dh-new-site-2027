import React from 'react';
import { Truck, X, FileText, CheckCircle2, BookOpen, ExternalLink } from 'lucide-react';

/**
 * ShippingInfoModal - แสดงหลักการคิดค่าจัดส่งสินค้าและมาตรฐานทางบัญชีและภาษี
 * Reconstructed with 100% parity from Production DH Notebook.
 */
export const ShippingInfoModal = ({ isOpen, onClose }) => {
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
                        <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
                            <Truck size={18} />
                        </div>
                        หลักการคิดค่าจัดส่งสินค้า & มาตรฐานทางบัญชีและภาษี
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
                    {/* Section 1: 3 Main Approaches in POS */}
                    <section className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2 text-base border-b pb-2 border-slate-100 dark:border-slate-700">
                            <FileText size={18} className="text-emerald-600" />
                            1. 3 แนวทางหลักการคิดค่าจัดส่งในระบบ (DH Notebook POS)
                        </h3>
                        <div className="space-y-3 pl-1">
                            <div className="bg-emerald-50/60 dark:bg-emerald-900/20 p-3.5 rounded-lg border border-emerald-100 dark:border-emerald-800/40">
                                <h4 className="font-bold text-emerald-950 dark:text-emerald-300 mb-1">
                                    ⭐ แบบที่ 1: จ่ายแทนตามจริง (Reimbursement - ไม่คิด VAT)
                                </h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    เหมาะสำหรับกรณีบริษัทออกเงินจ่ายค่าขนส่งเอกชน (เช่น KEX 100฿) แทนลูกค้าไปก่อน และเก็บเงินคืนจากลูกค้าเท่าทุนโดยไม่มีกำไร<br />
                                    👉 <strong>วิธีตั้งค่าในระบบ:</strong> <u>ไม่ต้องติ๊ก</u> ช่อง <em>"คิด VAT รวมกับค่าส่ง"</em> (ยอดค่าส่งจะไม่ถูกนำไปคิดภาษี VAT 7% เพิ่มเติม)
                                </p>
                            </div>

                            <div className="bg-blue-50/60 dark:bg-blue-900/20 p-3.5 rounded-lg border border-blue-100 dark:border-blue-800/40">
                                <h4 className="font-bold text-blue-950 dark:text-blue-300 mb-1">
                                    🔷 แบบที่ 2: บริการขนส่งรวมภาษี (Shipping Service - เคลมภาษีซื้อได้)
                                </h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    บริษัทออกใบกำกับภาษีค่าจัดส่งรวมในบิลขายให้ลูกค้า (100฿ + VAT 7% = 107฿) แม้จะไม่มีกำไรแต่บริษัทสามารถนำใบกำกับภาษีจากขนส่งมาเคลมภาษีซื้อได้ (ภาษีซื้อ 7฿ หักลบภาษีขาย 7฿ สุทธิเป็น 0฿)<br />
                                    👉 <strong>วิธีตั้งค่าในระบบ:</strong> <u>ติ๊กเลือก</u> ช่อง <em>"คิด VAT รวมกับค่าส่ง"</em>
                                </p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                <h4 className="font-bold text-slate-900 dark:text-slate-200 mb-1">
                                    ⚪ แบบที่ 3: รวมค่าส่งในราคาสินค้า / โปรส่งฟรี (Selling Expense)
                                </h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    ถัวเฉลี่ยค่าจัดส่งรวมในราคาสินค้า หรือจัดโปรโมชันส่งฟรีเมื่อซื้อครบยอด โดยบริษัทนำบิลค่าขนส่งจากเอกชนไปบันทึกเป็น <strong>"ค่าใช้จ่ายในการขาย"</strong> เพื่อนำไปลดหย่อนภาษีเงินได้นิติบุคคลตอนสิ้นปี
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Accounting Facts for Private Couriers */}
                    <section className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2 text-base border-b pb-2 border-slate-100 dark:border-slate-700">
                            <CheckCircle2 size={18} className="text-emerald-600" />
                            2. ข้อเท็จจริงทางบัญชีสำหรับค่าขนส่งเอกชน
                        </h3>
                        <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                            <li className="flex gap-2 items-start">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>
                                    <strong>ไม่มีกำไร ไม่จำเป็นต้องคิด VAT เพิ่ม:</strong> หากเป็นการรับชำระเงินแทนค่าบริการขนส่งตามจริง สามารถเลือกแบบที่ 1 (เงินจ่ายแทน) เพื่อไม่ต้องเรียกเก็บ VAT เพิ่มจากลูกค้าได้
                                </span>
                            </li>
                            <li className="flex gap-2 items-start">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>
                                    <strong>การรับรู้ค่าใช้จ่าย:</strong> ใบเสร็จรับเงิน/ใบกำกับภาษีจากขนส่งเอกชน (เช่น KEX, Flash, Kerry) ในนามบริษัท สามารถใช้เป็นหลักฐานทางบัญชีได้ 100%
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
                                    📜 คำสั่งกรมสรรพากร ที่ ป. 120/2545:
                                </span>
                                <p className="text-slate-600 dark:text-slate-400">
                                    กำหนดหลักเกณฑ์การรับชำระเงินแทนและการออกใบเสร็จรับเงินกรณีเงินจ่ายแทน (Out-of-pocket Expenses) ซึ่งไม่อยู่ในบังคับต้องนำมารวมคำนวณภาษีมูลค่าเพิ่ม
                                </p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-amber-200/80 dark:border-slate-700">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                                    📜 ประมวลรัษฎากร มาตรา 77/2 & 82/3:
                                </span>
                                <p className="text-slate-600 dark:text-slate-400">
                                    การคำนวณภาษีมูลค่าเพิ่มกรณีการให้บริการจัดส่ง และการนำภาษีซื้อจากผู้ให้บริการขนส่งมาหักออกจากภาษีขายในเดือนภาษีเดียวกัน
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

export default ShippingInfoModal;
