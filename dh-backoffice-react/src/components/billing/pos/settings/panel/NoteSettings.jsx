import { FileText } from 'lucide-react';

export default function NoteSettings({
    activeTab, updateActiveTab, isProcessing,
    localBillNote, setLocalBillNote,
    sectionClass, labelClass, inputClass
}) {
    return (
        <div className={sectionClass}>
            <label className={labelClass}><FileText size={13}/> หมายเหตุพิมพ์ในบิล (PRINT NOTE)</label>
            <textarea 
                disabled={isProcessing} 
                placeholder="อ้างอิง PO, จุดสังเกตการจัดส่ง..." 
                value={localBillNote} 
                onChange={(e) => setLocalBillNote(e.target.value)} 
                onBlur={() => updateActiveTab({ billNote: localBillNote })} 
                className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder-slate-400 shadow-2xs resize-none h-20 custom-scrollbar" 
            />
        </div>
    );
}
