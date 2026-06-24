import React from 'react';

export default function HeroLivePreview({ config }) {
    const activeConfig = config;

    return (
        <div className="mt-8 border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white p-6">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center justify-between">
                <span>หน้าจอจำลอง (Live Storefront Preview)</span>
                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">100% Exact Match</span>
            </h3>
            
            <div 
                className="relative w-full rounded-xl overflow-hidden flex flex-col items-center min-h-[280px] md:min-h-[360px] lg:min-h-[400px] border border-slate-800 shadow-lg"
                style={{ backgroundColor: activeConfig.overlay?.color || '#1f2937' }}
            >
                {/* Background Image / Graphic on the right */}
                <div className="absolute inset-0 z-0 flex justify-end">
                    <div className="w-full md:w-[70%] h-full relative">
                        {activeConfig.imageUrl ? (
                            <img 
                                src={activeConfig.imageUrl} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
                                ยังไม่มีรูปภาพ
                            </div>
                        )}
                        {/* Dynamic Gradient overlay */}
                        <div 
                            className="absolute inset-0"
                            style={{
                                background: `linear-gradient(to right, ${activeConfig.overlay?.color || '#1f2937'} 0%, ${activeConfig.overlay?.color || '#1f2937'} 40%, transparent 100%)`,
                                opacity: (activeConfig.overlay?.opacity ?? 90) / 100
                            }}
                        ></div>
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10 p-6 md:p-12 lg:p-16 w-full h-full flex flex-col justify-center">
                    <h1 
                        className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-8 leading-[1.3] tracking-wide uppercase text-white max-w-2xl"
                        dangerouslySetInnerHTML={{ __html: activeConfig.title || '<span class="text-slate-500">ตัวอย่างข้อความ...</span>' }}
                    />
                    
                    <div className="flex flex-row space-x-3 md:space-x-4">
                        {activeConfig.primaryButton?.isActive && (
                            <button className="px-6 py-2.5 md:px-8 md:py-3 bg-yellow-400 text-slate-900 font-bold rounded-lg cursor-default text-xs md:text-sm uppercase tracking-wider shadow-sm">
                                {activeConfig.primaryButton.label || 'PRIMARY BUTTON'}
                            </button>
                        )}
                        {activeConfig.secondaryButton?.isActive && (
                            <button className="px-6 py-2.5 md:px-8 md:py-3 bg-white text-slate-800 font-bold rounded-lg cursor-default text-xs md:text-sm uppercase tracking-wider shadow-sm">
                                {activeConfig.secondaryButton.label || 'SECONDARY BUTTON'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <p className="text-xs text-slate-500 mt-4 text-center">
                นี่คือตัวอย่างหน้าจอจริงที่จะแสดงบนหน้าเว็บไซต์ของคุณ ทั้งรูปภาพ การไล่เฉดสี ข้อความ และปุ่มกด
            </p>
        </div>
    );
}
