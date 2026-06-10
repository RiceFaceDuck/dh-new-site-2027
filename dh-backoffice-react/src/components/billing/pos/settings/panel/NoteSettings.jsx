import React from 'react';
import { FileText } from 'lucide-react';

export default function NoteSettings({
    activeTab, updateActiveTab, isProcessing,
    localBillNote, setLocalBillNote,
    sectionClass, labelClass, inputClass
}) {
    return (
        <div className={sectionClass}>
            <label className={labelClass}><FileText size={14}/> หมายเหตุพิมพ์ในบิล (PRINT NOTE)</label>
            <textarea disabled={isProcessing} placeholder="อ้างอิง PO, จุดสังเกตการจัดส่ง..." value={localBillNote} onChange={(e) => setLocalBillNote(e.target.value)} onBlur={() => updateActiveTab({ billNote: localBillNote })} className={`${inputClass} resize-none h-20 custom-scrollbar`} />
        </div>
    );
}
