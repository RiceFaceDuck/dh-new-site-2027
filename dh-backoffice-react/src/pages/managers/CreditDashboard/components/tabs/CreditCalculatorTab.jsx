import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight, Info, ShieldAlert, TrendingUp, TrendingDown, Target, Zap, Bell } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../firebase/config';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export default function CreditCalculatorTab() {
  const [showGuide, setShowGuide] = useState(false);
  const [config, setConfig] = useState({
    pointsEarningRate: 100,
    adImpressionCost: 5,
    partnerRankingCost: 50
  });

  const [simulation, setSimulation] = useState({
    monthlySalesVolume: 500000,
    activeAdPartners: 20,
    dailyAdImpressions: 50000
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'credit_config');
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().config) {
          const fetchedConfig = snap.data().config;
          setConfig({
            pointsEarningRate: fetchedConfig.pointsEarningRate || 100,
            adImpressionCost: fetchedConfig.adImpressionCost || 5,
            partnerRankingCost: fetchedConfig.partnerRankingCost || 50
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchConfig();
  }, []);

  const handleSimChange = (e, key) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setSimulation(prev => ({ ...prev, [key]: parseInt(val || '0', 10) }));
  };

  // Calculations
  const monthlyPointsMinted = Math.floor(simulation.monthlySalesVolume / config.pointsEarningRate);
  const dailyPointsFromAds = Math.floor((simulation.dailyAdImpressions / 100) * config.adImpressionCost);
  const dailyPointsFromRanking = simulation.activeAdPartners * config.partnerRankingCost;
  const monthlyPointsBurned = (dailyPointsFromAds + dailyPointsFromRanking) * 30;

  const netPoints = monthlyPointsMinted - monthlyPointsBurned;
  const isDeflationary = netPoints < 0;

  return (
    <div className="flex flex-col bg-white border border-slate-300 rounded-sm min-h-[500px]">
      
      <div className="p-3 border-b border-slate-300 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded text-blue-600">
            <Calculator size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Smart Calculator</h3>
            <p className="text-[10px] text-slate-500">Simulate Inflation & Deflation of Credit Points</p>
          </div>
        </div>
        <button 
          onClick={() => setShowGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-200 text-xs font-bold hover:bg-indigo-100 transition-colors"
        >
          <Bell size={14} /> คู่มือการคำนวณ (Guide)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          {/* Inputs */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                <Target className="text-blue-500" size={18} /> Market Assumptions
              </h4>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Sales Volume (THB)</label>
                <p className="text-[10px] text-slate-500 mb-2">ยอดขายรวมของระบบต่อเดือน</p>
                <input 
                  type="text" 
                  value={simulation.monthlySalesVolume.toLocaleString('th-TH')}
                  onChange={(e) => handleSimChange(e, 'monthlySalesVolume')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-right focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Active Partners Paying for Ranking</label>
                <p className="text-[10px] text-slate-500 mb-2">จำนวนพาร์ทเนอร์ที่ซื้อพื้นที่โปรโมทต่อวัน</p>
                <input 
                  type="text" 
                  value={simulation.activeAdPartners.toLocaleString('th-TH')}
                  onChange={(e) => handleSimChange(e, 'activeAdPartners')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-right focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Daily Total Ad Impressions</label>
                <p className="text-[10px] text-slate-500 mb-2">ยอดการมองเห็นโฆษณาทั้งแพลตฟอร์มต่อวัน</p>
                <input 
                  type="text" 
                  value={simulation.dailyAdImpressions.toLocaleString('th-TH')}
                  onChange={(e) => handleSimChange(e, 'dailyAdImpressions')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-right focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 text-white space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-2 border-b border-slate-600 pb-2">
                <ShieldAlert className="text-amber-400" size={18} /> Current Config Rules
              </h4>
              <div className="flex justify-between text-xs items-center">
                <span className="text-slate-400">Points Earning Rate:</span>
                <span className="font-mono font-bold">{config.pointsEarningRate} THB / 1 PT</span>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-slate-400">Ad Impression Cost:</span>
                <span className="font-mono font-bold">{config.adImpressionCost} PT / 100 Views</span>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-slate-400">Partner Ranking Cost:</span>
                <span className="font-mono font-bold">{config.partnerRankingCost} PT / Day</span>
              </div>
              <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-600 text-center">
                * You can change these rates in the 'Rules & Configs' tab.
              </p>
            </div>
          </div>

          {/* Outputs */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5 h-full">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                <Zap className="text-amber-500" size={18} /> Monthly Simulation Result
              </h4>

              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex justify-between items-center">
                <div>
                  <h5 className="text-xs font-bold text-emerald-800 uppercase">Points Minted (Inflow)</h5>
                  <p className="text-[10px] text-emerald-600">พอยต์ที่เกิดใหม่จากการซื้อสินค้า</p>
                </div>
                <div className="text-xl font-black font-mono text-emerald-600">
                  +{monthlyPointsMinted.toLocaleString('th-TH')}
                </div>
              </div>

              <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex justify-between items-center">
                <div>
                  <h5 className="text-xs font-bold text-rose-800 uppercase">Points Burned (Outflow)</h5>
                  <p className="text-[10px] text-rose-600">พอยต์ที่ถูกทำลายจากการใช้งาน</p>
                </div>
                <div className="text-xl font-black font-mono text-rose-600">
                  -{monthlyPointsBurned.toLocaleString('th-TH')}
                </div>
              </div>

              <div className={`p-5 rounded-xl border-2 flex items-center justify-between mt-4 ${isDeflationary ? 'bg-indigo-50 border-indigo-200' : 'bg-orange-50 border-orange-200'}`}>
                <div>
                  <h5 className={`text-sm font-black uppercase ${isDeflationary ? 'text-indigo-800' : 'text-orange-800'}`}>
                    {isDeflationary ? 'DEFLATIONARY SYSTEM' : 'INFLATIONARY SYSTEM'}
                  </h5>
                  <p className={`text-xs mt-1 font-medium ${isDeflationary ? 'text-indigo-600' : 'text-orange-600'}`}>
                    {isDeflationary ? 'มีการเบิร์นพอยต์มากกว่าพอยต์เกิดใหม่ (พอยต์หายากขึ้น)' : 'มีพอยต์เกิดใหม่มากกว่าการเบิร์น (พอยต์เฟ้อ)'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isDeflationary ? <TrendingDown size={32} className="text-indigo-500" /> : <TrendingUp size={32} className="text-orange-500" />}
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600 uppercase">Net Monthly Balance</span>
                <span className={`text-2xl font-black font-mono ${isDeflationary ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {netPoints > 0 ? '+' : ''}{netPoints.toLocaleString('th-TH')} PT
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* IN-APP DOCUMENTATION MODAL */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="text-indigo-600" /> คู่มือการใช้งาน Smart Calculator
              </h2>
              <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 bg-indigo-50 p-2 rounded border border-indigo-100">📖 ตำรา / คำอธิบาย (Overview)</h3>
                <p className="text-sm text-slate-600 leading-relaxed pl-2">
                  Smart Calculator เป็นเครื่องมือจำลอง <b>"สภาพคล่องของพอยต์ในระบบ (Tokenomics)"</b> เพื่อให้แอดมินใช้ประเมินว่า กติกาที่ตั้งไว้ในหน้า <i>Rules & Configs</i> ทำให้เกิดภาวะเงินฝืด (Deflation) หรือเงินเฟ้อ (Inflation) ในระบบเครดิตของเรา
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 bg-emerald-50 p-2 rounded border border-emerald-100">⚙️ วิธีการใช้งาน (How-to)</h3>
                <ul className="text-sm text-slate-600 space-y-2 list-decimal pl-6">
                  <li>กรอก <b>ยอดขายคาดการณ์ (Monthly Sales)</b> เพื่อดูว่าระบบจะสร้าง (Mint) พอยต์ใหม่เท่าไหร่</li>
                  <li>กรอก <b>จำนวนพาร์ทเนอร์ และ ยอดวิวโฆษณา</b> เพื่อประเมินว่าพอยต์จะถูกนำมาใช้จ่าย (Burn) มากแค่ไหน</li>
                  <li>ระบบจะดึง Config ปัจจุบันมาคำนวณอัตโนมัติ และแสดงผล <b>Net Monthly Balance</b></li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 bg-amber-50 p-2 rounded border border-amber-100">💡 เทคนิคการใช้งาน (Tips & Tricks)</h3>
                <ul className="text-sm text-slate-600 space-y-2 list-disc pl-6">
                  <li>ระบบนิเวศที่ดีควรจะ <b>Deflationary (เงินฝืดเล็กน้อย)</b> หรือ Balance เพื่อกระตุ้นให้ Partner อยากเติมเงินซื้อพอยต์เพิ่ม มากกว่าแค่รอรับฟรีจากยอดขาย</li>
                  <li>หากพบว่าพอยต์เฟ้อหนัก ให้กลับไปหน้า Rules & Configs แล้ว <b>เพิ่ม Ad Impression Cost</b> หรือ <b>ลด Points Earning Rate</b></li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 bg-purple-50 p-2 rounded border border-purple-100">🎯 ตัวอย่างผลลัพธ์ (Expected Results)</h3>
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-sm text-slate-600 space-y-2">
                  <p>ระบบจะโชว์ป้ายกำกับชัดเจน:</p>
                  <p>🟣 <b>DEFLATIONARY SYSTEM:</b> พอยต์ในตลาดจะหายากขึ้นเรื่อยๆ มูลค่าพอยต์สูง</p>
                  <p>🟠 <b>INFLATIONARY SYSTEM:</b> พอยต์ในตลาดจะล้น มูลค่าตก พาร์ทเนอร์จะไม่อยากจ่ายเงินสดเติมพอยต์</p>
                </div>
              </section>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
              <button onClick={() => setShowGuide(false)} className="px-6 py-2 bg-slate-800 text-white font-bold text-sm rounded hover:bg-slate-900 transition-colors">
                เข้าใจและพร้อมจำลอง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
