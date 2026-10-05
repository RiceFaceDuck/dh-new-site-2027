import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { getCollectionPath, formatDate } from 'dh-shared';
import { normalizePhone } from '../../services/customerCacheService';
import { fetchOrderStatsForPage } from '../../services/customerOrderStatsService';
import { 
  AlertTriangle, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Coins, 
  Wallet, 
  CheckCircle2, 
  Edit3, 
  PlusCircle, 
  RotateCcw,
  Check
} from 'lucide-react';

/**
 * 🕵️‍♂️ Check for potential duplicate customers in Firestore before creating
 */
export const checkPotentialDuplicates = async (newCustomerData, currentEditingUid = null) => {
  if (!newCustomerData) return [];

  const usersRef = collection(db, getCollectionPath('users'));
  const candidateMap = new Map();

  const normPhone = normalizePhone(newCustomerData.phone || newCustomerData.phoneNumber);
  const accountName = (newCustomerData.accountName || newCustomerData.displayName || newCustomerData.storeName || newCustomerData.name || '').trim().toLowerCase();
  const lineId = (newCustomerData.lineId || '').trim().toLowerCase();

  try {
    // 1. Phone match
    if (normPhone && normPhone.length >= 9) {
      const qPhone = [
        query(usersRef, where('phone', '==', normPhone), limit(5)),
        query(usersRef, where('phoneNumber', '==', normPhone), limit(5))
      ];

      const results = await Promise.all(qPhone.map(q => getDocs(q)));
      results.forEach(snap => {
        snap.forEach(docSnap => {
          if (currentEditingUid && docSnap.id === currentEditingUid) return;
          const data = docSnap.data();
          const uid = docSnap.id;

          if (!candidateMap.has(uid)) {
            candidateMap.set(uid, {
              customer: { id: uid, uid, ...data },
              reasons: new Set(),
              score: 0
            });
          }
          const item = candidateMap.get(uid);
          item.reasons.add('📞 เบอร์โทรศัพท์ตรงกัน 100%');
          item.score += 80;
        });
      });
    }

    // 2. Store / Account Name match
    if (accountName && accountName.length >= 2) {
      const rawName = newCustomerData.accountName?.trim() || '';
      if (rawName) {
        const qName = [
          query(usersRef, where('accountName', '==', rawName), limit(5)),
          query(usersRef, where('displayName', '==', rawName), limit(5)),
          query(usersRef, where('storeName', '==', rawName), limit(5))
        ];

        const results = await Promise.all(qName.map(q => getDocs(q)));
        results.forEach(snap => {
          snap.forEach(docSnap => {
            if (currentEditingUid && docSnap.id === currentEditingUid) return;
            const data = docSnap.data();
            const uid = docSnap.id;

            if (!candidateMap.has(uid)) {
              candidateMap.set(uid, {
                customer: { id: uid, uid, ...data },
                reasons: new Set(),
                score: 0
              });
            }
            const item = candidateMap.get(uid);
            item.reasons.add('🏪 ชื่อร้าน / ชื่อบริษัท ตรงกัน');
            item.score += 60;
          });
        });
      }
    }

    // 3. Line ID match
    if (lineId && lineId.length >= 3) {
      const qLine = query(usersRef, where('lineId', '==', lineId), limit(5));
      const snap = await getDocs(qLine);
      snap.forEach(docSnap => {
        if (currentEditingUid && docSnap.id === currentEditingUid) return;
        const data = docSnap.data();
        const uid = docSnap.id;

        if (!candidateMap.has(uid)) {
          candidateMap.set(uid, {
            customer: { id: uid, uid, ...data },
            reasons: new Set(),
            score: 0
          });
        }
        const item = candidateMap.get(uid);
        item.reasons.add('💬 Line ID ตรงกัน');
        item.score += 40;
      });
    }

    // 4. Email match
    const email = (newCustomerData.email || '').trim().toLowerCase();
    if (email && email.includes('@')) {
      const qEmail = query(usersRef, where('email', '==', email), limit(5));
      const snap = await getDocs(qEmail);
      snap.forEach(docSnap => {
        if (currentEditingUid && docSnap.id === currentEditingUid) return;
        const data = docSnap.data();
        const uid = docSnap.id;

        if (!candidateMap.has(uid)) {
          candidateMap.set(uid, {
            customer: { id: uid, uid, ...data },
            reasons: new Set(),
            score: 0
          });
        }
        const item = candidateMap.get(uid);
        item.reasons.add('✉️ อีเมลตรงกัน');
        item.score += 70;
      });
    }

    const candidateList = Array.from(candidateMap.values())
      .map(entry => ({
        customer: entry.customer,
        score: Math.min(entry.score, 100),
        reasons: Array.from(entry.reasons)
      }))
      .sort((a, b) => b.score - a.score);

    if (candidateList.length === 0) return [];

    // Enrich candidates with latest order stats
    const statsMap = await fetchOrderStatsForPage(candidateList.map(c => c.customer));
    return candidateList.map(item => {
      const cust = item.customer;
      const uid = cust.uid || cust.id;
      const stats = statsMap[uid] || {};
      const lastOrder = stats.lastOrderDate || cust.stats?.lastOrderDate || cust.lastOrderDate || null;
      return {
        ...item,
        customer: {
          ...cust,
          lastOrderDate: lastOrder
        }
      };
    });
  } catch (err) {
    console.error("🔥 Error checking potential duplicate customers:", err);
    return [];
  }
};

/**
 * ⚠️ Customer Duplicate Comparison Modal
 */
export default function CustomerDuplicateComparisonModal({
  isOpen,
  onClose,
  newCustomerData,
  duplicateCandidates = [],
  onSelectExisting,
  onOverwriteExisting,
  onForceCreateNew
}) {
  if (!isOpen || !newCustomerData || duplicateCandidates.length === 0) return null;

  const formatAddress = (addr) => {
    if (!addr) return '-';
    if (typeof addr === 'string') return addr;
    const parts = [addr.addressLine, addr.subDistrict, addr.district, addr.province, addr.zipCode || addr.postalCode].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '-';
  };

  const formatLastOrder = (dateVal) => {
    if (!dateVal) return 'ยังไม่มีประวัติสั่งซื้อ';
    try {
      const epoch = typeof dateVal === 'object' && dateVal.toMillis ? dateVal.toMillis() : dateVal;
      return formatDate(epoch);
    } catch {
      return 'มีประวัติสั่งซื้อแล้ว';
    }
  };

  const newName = newCustomerData.accountName || newCustomerData.displayName || newCustomerData.contactName || 'ลูกค้าใหม่';
  const newPhone = newCustomerData.phone || newCustomerData.phoneNumber || '-';
  const newAddress = formatAddress(newCustomerData.address || newCustomerData.legacyAddress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 text-white rounded-xl font-bold shadow-inner">
              <AlertTriangle size={22} className="animate-bounce" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                ⚠️ ตรวจพบข้อมูลลูกค้าที่อาจซ้ำซ้อนกันในระบบ ({duplicateCandidates.length} รายการ)
              </h2>
              <p className="text-xs text-amber-100">
                พบข้อมูลที่มีเบอร์โทรศัพท์ หรือ ชื่อร้านค้า คล้ายคลึงกับลูกค้าเดิมที่มีอยู่แล้ว กรุณาเลือกรายการที่ต้องการใช้งาน
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            
            {/* Left: New Data Preview */}
            <div className="lg:col-span-4 bg-white p-4 rounded-2xl border-2 border-amber-400 shadow-sm relative space-y-3">
              <span className="absolute -top-3 left-4 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                ✨ ข้อมูลใหม่ที่จะบันทึก
              </span>
              <div className="pt-1">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <User size={16} className="text-amber-500 shrink-0" />
                  <span>{newName}</span>
                </h3>
              </div>
              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-2">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">{newPhone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed text-slate-700">{newAddress}</span>
                </div>
              </div>
            </div>

            {/* Right: Existing Candidates */}
            <div className="lg:col-span-8 space-y-4">
              <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <span>🟢 ข้อมูลเดิมในระบบที่พบ (เลือก &quot;ใช้งานข้อมูลนี้&quot; บนการ์ดที่ต้องการ):</span>
              </p>

              {duplicateCandidates.map((cand, idx) => {
                const c = cand.customer;
                const reasons = cand.reasons || [];
                const existName = c.accountName || c.displayName || c.storeName || c.name || 'ลูกค้าเดิม';
                const existPhone = c.phone || c.phoneNumber || '-';
                const accountId = c.accountId || c.customerCode || c.id?.substring(0, 8)?.toUpperCase() || 'DB';
                const points = c.creditPoints || c.totalAccumulatedPoints || c.points || 0;
                const wallet = Number(c.walletBalance || c.wallet || 0);

                return (
                  <div 
                    key={c.id || idx}
                    className="bg-white p-4 rounded-2xl border-2 border-emerald-500 shadow-sm relative flex flex-col justify-between gap-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b border-emerald-100 pb-2">
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                        🟢 ข้อมูลเดิมในระบบ (ID: {accountId})
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {reasons.map((r, rIdx) => (
                          <span key={rIdx} className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <User size={16} className="text-emerald-600 shrink-0" />
                        <span>{existName}</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone size={14} className="text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-800">{existPhone}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                          <span className="truncate" title={formatAddress(c.address)}>{formatAddress(c.address)}</span>
                        </div>
                      </div>

                      {/* 3 Metric Boxes */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs mt-2">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-indigo-600 shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-400 font-semibold">บิลล่าสุด</p>
                            <p className="font-bold text-slate-800 text-[11px]">{formatLastOrder(c.lastOrderDate)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
                          <Coins size={13} className="text-amber-500 shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-400 font-semibold">Points สะสม</p>
                            <p className="font-bold text-amber-700 text-[11px]">{points.toLocaleString()} แต้ม</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
                          <Wallet size={13} className="text-emerald-600 shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-400 font-semibold">Wallet เงินค้าง</p>
                            <p className="font-bold text-emerald-700 text-[11px]">฿{wallet.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons on card */}
                    <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                      {onOverwriteExisting && (
                        <button
                          type="button"
                          onClick={() => onOverwriteExisting(c, newCustomerData)}
                          className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-indigo-200 transition-all active:scale-95 cursor-pointer"
                          title="นำข้อมูลใหม่ไปเขียนทับลงในรายชื่อนี้ (แต้มและประวัติเดิมไม่หาย)"
                        >
                          <Edit3 size={14} /> เขียนทับลงการ์ดนี้
                        </button>
                      )}
                      {onSelectExisting && (
                        <button
                          type="button"
                          onClick={() => onSelectExisting(c)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 size={16} /> ใช้งานข้อมูลนี้
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-200 border border-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={16} /> ย้อนกลับไปแก้ไข
          </button>
          <button
            type="button"
            onClick={onForceCreateNew}
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 text-white hover:bg-amber-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <PlusCircle size={16} /> ยืนยันสร้างเป็นรายชื่อใหม่
          </button>
        </div>

      </div>
    </div>
  );
}
