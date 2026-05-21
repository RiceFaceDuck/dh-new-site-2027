import React from 'react';
import { Lock, Database, Fingerprint, Server } from 'lucide-react';

export default function SecurityFrameworkInfo() {
  // จัดการข้อมูลฟีเจอร์ความปลอดภัยให้อยู่ในรูปแบบ Array เพื่อให้ง่ายต่อการแก้ไขและดูแลรักษา
  const securityFeatures = [
    {
      id: 'atomic',
      icon: Database,
      title: 'Atomic Operations',
      description: 'ทุกคำสั่ง เติม/ลด จะถูกประมวลผลแบบรวบยอด (Transaction) ป้องกันยอดเบิ้ล หรือยอดติดลบเวลาเน็ตกระตุก',
      iconBg: 'bg-emerald-50 group-hover:bg-emerald-100 transition-colors',
      iconColor: 'text-emerald-500',
    },
    {
      id: 'sync',
      icon: Fingerprint,
      title: 'Multi-Layer Sync',
      description: 'ระบบตรวจสอบสถานะยอดเงินข้ามอุปกรณ์แบบ Real-time ข้อมูลตรงกันเสมอ ป้องกันการเข้าถึงซ้ำซ้อน',
      iconBg: 'bg-blue-50 group-hover:bg-blue-100 transition-colors',
      iconColor: 'text-blue-500',
    },
    {
      id: 'audit',
      icon: Server,
      title: 'Immutable Audit Trail',
      description: 'บันทึกประวัติทุกการทำรายการอย่างถาวร (Append-only) ไม่สามารถแก้ไขหรือลบได้ เพื่อการตรวจสอบย้อนหลังที่โปร่งใส',
      iconBg: 'bg-indigo-50 group-hover:bg-indigo-100 transition-colors',
      iconColor: 'text-indigo-500',
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
      {/* Header Section พร้อม Live Status */}
      <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 bg-amber-50 rounded-lg">
            <Lock size={18} className="text-amber-500" />
          </div>
          Security Framework
        </h3>
        
        {/* Badge แจ้งสถานะการป้องกันแบบมี Animation */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-semibold border border-emerald-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Active Protection
        </div>
      </div>

      {/* Security Features List */}
      <div className="space-y-2">
        {securityFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <div 
              key={feature.id} 
              className="group flex items-start gap-3.5 p-3 -mx-3 rounded-xl hover:bg-slate-50 transition-colors duration-200 cursor-default"
            >
              {/* Icon Container */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${feature.iconBg} ${feature.iconColor}`}>
                <Icon size={16} strokeWidth={2.5} />
              </div>
              
              {/* Text Container */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
                  {feature.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}