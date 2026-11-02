
export default function HeroStatusToggle({ isActive, onChange }) {
    return (
        <div className="flex items-center justify-between bg-white p-5 rounded-[2px] shadow-sm border border-slate-300 hover:border-slate-400 transition-all">
            <div>
                <h3 className="font-black text-slate-800 text-base uppercase tracking-wider">เปิดใช้งานป้าย (Active)</h3>
                <p className="text-xs text-slate-600 mt-0.5">หากปิด ลูกค้าจะเห็นป้ายรูปแบบดั้งเดิม</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={isActive}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="w-14 h-7 bg-slate-300 peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>
    );
}
