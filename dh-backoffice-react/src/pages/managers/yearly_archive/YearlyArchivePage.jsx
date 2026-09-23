import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Archive, Calendar, Calculator, Lock, CheckCircle2, 
  AlertTriangle, Download, FileSpreadsheet, FileJson, Clock, User, 
  HelpCircle, RefreshCw, ShoppingBag, Box, Users, Wrench, ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { 
  collection, doc, getDocs, setDoc, query, where, orderBy, limit, startAfter, Timestamp, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { inventorySyncMetaService } from '../../../firebase/inventory/inventorySyncMetaService';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

const COLLECTION_NAME = getCollectionPath('yearly_archives');

/**
 * 🔒 คำนวณ SHA-256 Checksum จากสตริงที่เป็นมาตรฐาน
 */
async function computeSha256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 📝 สร้าง Canonical String เพื่อใช้ทำ Checksum
 */
function buildCanonicalString(record) {
  return `YEAR:${Number(record.year || 0)}|ORDERS:${Number(record.metrics?.sales?.totalOrders || 0)}|REV:${Number(record.metrics?.sales?.totalRevenue || 0).toFixed(2)}|ITEMS:${Number(record.metrics?.sales?.totalItemsSold || 0)}|SKUS:${Number(record.metrics?.inventory?.totalSkus || 0)}|STK:${Number(record.metrics?.inventory?.totalStockQty || 0)}|CUST:${Number(record.metrics?.customers?.totalCustomers || 0)}|CLM:${Number(record.metrics?.afterSales?.totalClaims || 0)}|RET:${Number(record.metrics?.afterSales?.totalReturns || 0)}|CLOSED_BY:${String(record.closedBy?.uid || 'SYSTEM')}`;
}

export const yearlyArchiveService = {
  /**
   * คำนวณตัวเลขสรุปประจำปีจากข้อมูลจริงใน Firestore
   */
  computeYearMetrics: async (targetYear) => {
    const year = parseInt(targetYear, 10);
    const startSec = Math.floor(new Date(year, 0, 1, 0, 0, 0).getTime() / 1000);
    const endSec = Math.floor(new Date(year, 11, 31, 23, 59, 59, 999).getTime() / 1000);

    let totalOrders = 0;
    let successfulOrders = 0;
    let cancelledOrders = 0;
    let totalRevenue = 0;
    let totalItemsSold = 0;
    const customerSet = new Set();

    // 1. ดึงข้อมูล Orders ทั้งปี
    try {
      const ordersRef = collection(db, getCollectionPath('orders'));
      let lastVisible = null;
      let hasMore = true;
      let loopCount = 0;

      while (hasMore && loopCount < 60) {
        loopCount++;
        const constraints = [
          where('createdAt', '>=', Timestamp.fromMillis(startSec * 1000)),
          where('createdAt', '<=', Timestamp.fromMillis(endSec * 1000)),
          orderBy('createdAt', 'asc'),
          limit(500)
        ];
        if (lastVisible) constraints.push(startAfter(lastVisible));
        
        const q = query(ordersRef, ...constraints);
        const snap = await getDocs(q);
        if (snap.empty) break;

        snap.forEach(d => {
          const o = d.data();
          const t = o.createdAt?.seconds || Math.floor(new Date(o.date || 0).getTime() / 1000);
          if (t >= startSec && t <= endSec) {
            totalOrders++;
            const status = (o.status || '').toLowerCase();
            if (status === 'cancelled' || status === 'void') {
              cancelledOrders++;
            } else {
              successfulOrders++;
              totalRevenue += Number(o.totalAmount || o.grandTotal || o.total || 0);
              (o.items || []).forEach(it => {
                totalItemsSold += Number(it.qty || it.quantity || 1);
              });
              const cid = o.customerId || o.customerInfo?.id || o.customerInfo?.name || o.customer?.name;
              if (cid) customerSet.add(cid);
            }
          }
        });

        lastVisible = snap.docs[snap.docs.length - 1];
        if (snap.docs.length < 500) hasMore = false;
      }
    } catch (e) {
      console.warn("Compute orders metrics error:", e);
    }

    // 2. ดึงข้อมูล Inventory Snapshot
    let totalSkus = 0;
    let totalStockQty = 0;
    let totalStockValue = 0;
    let skusAddedInYear = 0;
    try {
      let catalog = await inventorySyncMetaService.getOrFetchCatalog({ forceRefresh: false });
      let products = catalog?.products || [];
      if (!products || products.length === 0) {
        catalog = await inventorySyncMetaService.getOrFetchCatalog({ forceRefresh: true });
        products = catalog?.products || [];
      }

      if (products.length > 0) {
        products.forEach(p => {
          totalSkus++;
          const stock = Number(p.stockQuantity || 0);
          totalStockQty += stock;
          const cost = Number(p.costPrice || p.purchasePrice || p.price || 0);
          totalStockValue += stock * cost;

          const createdSec = p.createdAt?.seconds || Math.floor(new Date(p.createdAt || 0).getTime() / 1000);
          if (createdSec >= startSec && createdSec <= endSec) {
            skusAddedInYear++;
          }
        });
      }
    } catch (e) {
      console.warn("Compute products metrics error:", e);
    }

    // 3. ดึงข้อมูล Claims / Returns
    let totalClaims = 0;
    let totalReturns = 0;
    try {
      const claimsRef = collection(db, getCollectionPath('claims'));
      let lastVisible = null;
      let hasMore = true;
      let loopCount = 0;

      while (hasMore && loopCount < 30) {
        loopCount++;
        const constraints = [
          where('createdAt', '>=', Timestamp.fromMillis(startSec * 1000)),
          where('createdAt', '<=', Timestamp.fromMillis(endSec * 1000)),
          orderBy('createdAt', 'asc'),
          limit(500)
        ];
        if (lastVisible) constraints.push(startAfter(lastVisible));

        const snap = await getDocs(query(claimsRef, ...constraints));
        if (snap.empty) break;

        snap.forEach(d => {
          const c = d.data();
          const t = c.createdAt?.seconds || 0;
          if (t >= startSec && t <= endSec) {
            const isReturn = c.type === 'RETURN_APPROVAL' || 
                             c.originalType === 'RETURN_APPROVAL' || 
                             c.payload?.actionType === 'คืนสินค้า' || 
                             c.actionType === 'คืนสินค้า' || 
                             String(c.claimTxId || '').startsWith('RTN-');
            if (isReturn) {
              totalReturns++;
            } else {
              totalClaims++;
            }
          }
        });

        lastVisible = snap.docs[snap.docs.length - 1];
        if (snap.docs.length < 500) hasMore = false;
      }
    } catch (e) {
      console.warn("Compute claims/returns metrics error:", e);
    }

    return {
      year,
      dateRange: {
        start: new Date(year, 0, 1).toLocaleDateString('th-TH'),
        end: new Date(year, 11, 31).toLocaleDateString('th-TH')
      },
      metrics: {
        sales: {
          totalOrders,
          successfulOrders,
          cancelledOrders,
          totalRevenue,
          totalItemsSold
        },
        inventory: {
          totalSkus,
          skusAddedInYear,
          totalStockQty,
          totalStockValue
        },
        customers: {
          totalCustomers: customerSet.size
        },
        afterSales: {
          totalClaims,
          totalReturns
        }
      }
    };
  },

  /**
   * ประทับตรา Checksum และบันทึก Snapshot ปิดรอบปีลง Firestore
   */
  sealYearlyArchive: async (targetYear, user) => {
    const computed = await yearlyArchiveService.computeYearMetrics(targetYear);
    const payload = {
      ...computed,
      status: 'SEALED_LOCKED',
      closedAt: new Date().toISOString(),
      closedBy: {
        uid: user?.uid || 'SYSTEM',
        name: user?.displayName || user?.name || user?.email || 'Manager'
      }
    };

    const canonicalString = buildCanonicalString(payload);
    const checksum = await computeSha256(canonicalString);

    const fullRecord = {
      ...payload,
      canonicalString,
      checksum,
      createdAt: serverTimestamp()
    };

    const docRef = doc(db, COLLECTION_NAME, String(targetYear));
    await setDoc(docRef, fullRecord);
    return fullRecord;
  },

  /**
   * โหลดรายการปีที่ปิดรอบทั้งหมด
   */
  getAllArchives: async () => {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => Number(b.year) - Number(a.year));
      return list;
    } catch (e) {
      console.warn("Get all yearly archives warning:", e);
      return [];
    }
  },

  /**
   * ตรวจสอบความสมบูรณ์ของ Checksum
   */
  verifyArchiveIntegrity: async (archive) => {
    if (!archive || !archive.checksum) {
      return { isValid: false, reason: "ไม่มี Checksum ประทับตรา" };
    }
    const computed = await computeSha256(buildCanonicalString(archive));
    const isValid = computed.toLowerCase() === String(archive.checksum).toLowerCase();
    return {
      isValid,
      storedChecksum: archive.checksum,
      calculatedChecksum: computed,
      reason: isValid ? "สมบูรณ์ 100% ไม่มีการดัดแปลง" : "พบข้อผิดพลาด: Checksum ไม่ตรงกับข้อมูล"
    };
  }
};

/**
 * 📦 กล่องแสดงผล Snapshot ปิดรอบปี (Archive Card)
 */
function ArchiveCard({ archive, onDownloadJson, onDownloadCsv }) {
  const [integrity, setIntegrity] = useState({ isChecking: true, isValid: true });
  const metrics = archive?.metrics || {};

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!archive) return;
      const res = await yearlyArchiveService.verifyArchiveIntegrity(archive);
      if (isMounted) {
        setIntegrity({
          isChecking: false,
          isValid: res.isValid,
          reason: res.reason,
          hash: res.storedChecksum
        });
      }
    })();
    return () => { isMounted = false; };
  }, [archive]);

  if (!archive) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden flex flex-col transition-all hover:border-slate-300 dark:hover:border-slate-700">
      {/* Header Bar */}
      <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Yearly Snapshot
            </span>
            <span className="text-slate-400 text-xs font-mono">
              {archive.dateRange?.start} - {archive.dateRange?.end}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            สรุปปิดรอบประจำปี {archive.year}
          </h2>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onDownloadJson(archive)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 border border-slate-700 shadow-xs"
            title="ดาวน์โหลดโครงสร้าง Snapshot JSON พร้อม Checksum"
          >
            <FileJson size={14} />
            JSON Ledger
          </button>
          <button
            onClick={() => onDownloadCsv(archive)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs"
            title="ดาวน์โหลดรายงานสรุป CSV / Excel"
          >
            <FileSpreadsheet size={14} />
            Excel / CSV
          </button>
        </div>
      </div>

      {/* Checksum Bar */}
      <div className={`px-5 py-2.5 flex items-center justify-between text-xs font-bold border-b ${
        integrity.isChecking 
          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          : integrity.isValid
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
            : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50'
      }`}>
        <div className="flex items-center gap-2">
          {integrity.isValid ? (
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle size={16} className="text-red-600" />
          )}
          <span>
            {integrity.isChecking 
              ? 'กำลังตรวจสอบความถูกต้องของ Checksum...' 
              : integrity.isValid 
                ? '🔒 SEAL VERIFIED (ไม่พบการดัดแปลงข้อมูล)' 
                : '⚠️ CHECKSUM INVALID (ข้อมูลไม่ตรงกับตราประทับ)'}
          </span>
        </div>
        <span className="font-mono text-[10px] hidden md:inline text-slate-500 dark:text-slate-400">
          SHA256: {archive.checksum ? `${archive.checksum.substring(0, 16)}...` : '-'}
        </span>
      </div>

      {/* 4 Metrics Grid Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50/50 dark:bg-slate-900/50">
        {/* Card 1: Sales */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
              <ShoppingBag size={18} />
            </div>
            <span>1. ยอดขาย & บิล</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
              <span>บิลสำเร็จ:</span>
              <b className="text-slate-900 dark:text-white font-mono">{Number(metrics.sales?.successfulOrders || 0).toLocaleString()} บิล</b>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
              <span>บิลยกเลิก:</span>
              <b className="text-red-600 dark:text-red-400 font-mono">{Number(metrics.sales?.cancelledOrders || 0).toLocaleString()} บิล</b>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
              <span>ยอดขายรวมทั้งปี:</span>
              <b className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                ฿{Number(metrics.sales?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </b>
            </div>
            <div className="flex justify-between py-1">
              <span>จำนวนชิ้นที่ขาย:</span>
              <b className="text-slate-900 dark:text-white font-mono">{Number(metrics.sales?.totalItemsSold || 0).toLocaleString()} ชิ้น</b>
            </div>
          </div>
        </div>

        {/* Card 2: Inventory */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-sm">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50">
              <Box size={18} />
            </div>
            <span>2. คลังสินค้า & SKU</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
              <span>SKU ในระบบ:</span>
              <b className="text-slate-900 dark:text-white font-mono">{Number(metrics.inventory?.totalSkus || 0).toLocaleString()} SKU</b>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
              <span>SKU เพิ่มใหม่ในปีนี้:</span>
              <b className="text-blue-600 dark:text-blue-400 font-mono">+{Number(metrics.inventory?.skusAddedInYear || 0).toLocaleString()} SKU</b>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
              <span>สต๊อกคงเหลือยกยอด:</span>
              <b className="text-slate-900 dark:text-white font-mono">{Number(metrics.inventory?.totalStockQty || 0).toLocaleString()} ชิ้น</b>
            </div>
            <div className="flex justify-between py-1">
              <span>มูลค่าทุนสต๊อก:</span>
              <b className="text-slate-900 dark:text-white font-mono">
                ฿{Number(metrics.inventory?.totalStockValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </b>
            </div>
          </div>
        </div>

        {/* Card 3: Customers */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-sm">
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50">
              <Users size={18} />
            </div>
            <span>3. ลูกค้า & สมาชิก</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
              <span>ลูกค้าที่ทำธุรกรรม:</span>
              <b className="text-purple-600 dark:text-purple-400 font-mono font-bold">{Number(metrics.customers?.totalCustomers || 0).toLocaleString()} ราย</b>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
              <span>สถานะ Snapshot:</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={11} /> สมบูรณ์
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>การบันทึก:</span>
              <b className="text-slate-700 dark:text-slate-300">Immutable Ledger</b>
            </div>
          </div>
        </div>

        {/* Card 4: Claims & Returns */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-sm">
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50">
              <Wrench size={18} />
            </div>
            <span>4. เคลม & รับคืน</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
              <span>รับเคลมส่งซ่อม:</span>
              <b className="text-amber-600 dark:text-amber-400 font-mono">{Number(metrics.afterSales?.totalClaims || 0).toLocaleString()} รายการ</b>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
              <span>รับคืนสินค้า/คืนเงิน:</span>
              <b className="text-teal-600 dark:text-teal-400 font-mono">{Number(metrics.afterSales?.totalReturns || 0).toLocaleString()} รายการ</b>
            </div>
            <div className="flex justify-between py-1">
              <span>สถานะรอบปี:</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <ShieldCheck size={12} className="text-blue-500" /> ปิดรอบเรียบร้อย
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info Bar */}
      <div className="px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 dark:text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <User size={13} className="text-blue-500" />
          <span>ผู้ปิดรอบ: <b className="text-slate-800 dark:text-slate-200">{archive.closedBy?.name || 'Manager'}</b></span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-slate-400" />
          <span>ปิดรอบเมื่อ: {archive.closedAt ? new Date(archive.closedAt).toLocaleString('th-TH') : '-'}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 📖 คู่มือการใช้งานระบบตัดยอดปิดรอบปี
 */
function YearlyArchiveGuide() {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-black text-sm">
        <HelpCircle size={18} className="text-blue-500" />
        <span>คู่มือการใช้งาน: ระบบตัดยอดปิดรอบปี (Yearly Archive & Checksum Seal)</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
            <Archive size={15} className="text-purple-500" />
            <span>1. วัตถุประสงค์ของการปิดรอบ</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            การตัดยอดปิดรอบปีจะรวบรวมตัวเลขสรุปทางบัญชีและสต๊อกของทั้งปี เพื่อสร้างเป็น Snapshot ถาวร ทำให้ดูย้อนหลังได้ทันทีระดับ 0.1 วินาที โดยไม่ต้องรันประมวลผลบิล 12 เดือนใหม่
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span>2. ระบบ Checksum SHA-256 เข้มงวด</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            ทุกครั้งที่ปิดรอบ ระบบจะนำตัวเลขหลักมารวมเป็นรหัสลับแล้วเข้ารหัสเป็น <b>SHA-256 Checksum Seal</b> เพื่อป้องกันและตรวจจับหากมีการแอบแก้ไขตัวเลขย้อนหลังในฐานข้อมูล
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
            <Download size={15} className="text-blue-500" />
            <span>3. การดาวน์โหลดและจัดเก็บ</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            สามารถกดปุ่ม <b>JSON Ledger</b> เพื่อเก็บเป็นหลักฐานดิจิทัล หรือดาวน์โหลด <b>Excel / CSV</b> เพื่อนำไปจัดทำรายงานเสนอผู้บริหารหรือตรวจสอบทางบัญชีได้ทันที
          </p>
        </div>
      </div>
      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
        <Info size={15} className="shrink-0 mt-0.5 text-amber-600" />
        <span>
          <b>ข้อแนะนำ:</b> ควรกด "คำนวณและปิดรอบปี" หลังจากสิ้นสุดวันที่ 31 ธันวาคมของปีนั้นๆ หรือเมื่อทำรายการธุรกรรมของปีครบถ้วนแล้วเท่านั้น
        </span>
      </div>
    </div>
  );
}

/**
 * 👑 Component หลักของหน้าตัดยอดปิดรอบปี
 */
export default function YearlyArchivePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [archives, setArchives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComputing, setIsComputing] = useState(false);
  const [isSealing, setIsSealing] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const availableYears = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const loadArchives = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await yearlyArchiveService.getAllArchives();
      setArchives(list);
    } catch (e) {
      console.error("Load archives error:", e);
      toast.error("ไม่สามารถโหลดรายการปิดรอบปีได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArchives();
  }, [loadArchives]);

  const handleComputePreview = async (year = selectedYear) => {
    setIsComputing(true);
    setPreviewData(null);
    try {
      const data = await yearlyArchiveService.computeYearMetrics(year);
      setPreviewData(data);
      toast.success(`คำนวณสรุปยอดปี ${year} เรียบร้อยแล้ว`);
    } catch (e) {
      console.error("Compute error:", e);
      toast.error("เกิดข้อผิดพลาดในการคำนวณยอด");
    } finally {
      setIsComputing(false);
    }
  };

  const handleSealArchive = async (year = selectedYear) => {
    if (window.confirm(`ยืนยันการตัดยอดและประทับตรา Checksum ปิดรอบปี ${year} ใช่หรือไม่?\nข้อมูลจะถูกล็อคเป็นหลักฐานทางระบบ`)) {
      setIsSealing(true);
      try {
        await yearlyArchiveService.sealYearlyArchive(year, user);
        toast.success(`ตัดยอดและประทับตรา Checksum ปิดรอบปี ${year} สำเร็จ! 🔒`);
        setPreviewData(null);
        await loadArchives();
      } catch (e) {
        console.error("Seal archive error:", e);
        toast.error("เกิดข้อผิดพลาดในการบันทึกปิดรอบปี");
      } finally {
        setIsSealing(false);
      }
    }
  };

  const handleDownloadJson = (record) => {
    if (!record) return;
    const jsonStr = JSON.stringify(record, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DH_Yearly_Archive_${record.year}_Checksum_${record.checksum?.substring(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("ดาวน์โหลด JSON Ledger เรียบร้อยแล้ว");
  };

  const handleDownloadCsv = (record) => {
    if (!record) return;
    const m = record.metrics || {};
    const rows = [
      ['หัวข้อ', 'รายการ', 'จำนวน/มูลค่า', 'หน่วย'],
      ['ข้อมูลทั่วไป', 'ปีที่ปิดรอบ', record.year, 'ปี'],
      ['ข้อมูลทั่วไป', 'ช่วงวันที่', `${record.dateRange?.start || ''} - ${record.dateRange?.end || ''}`, 'ช่วงเวลา'],
      ['ข้อมูลทั่วไป', 'สถานะ', record.status || 'SEALED', '-'],
      ['ข้อมูลทั่วไป', 'ผู้ปิดรอบ', record.closedBy?.name || 'Manager', '-'],
      ['ข้อมูลทั่วไป', 'วันที่ปิดรอบ', record.closedAt || '', 'เวลา'],
      ['ข้อมูลทั่วไป', 'SHA-256 Checksum', record.checksum || '', 'Hash'],
      [''],
      ['ยอดขายและบิล', 'บิลสำเร็จทั้งหมด', m.sales?.successfulOrders || 0, 'บิล'],
      ['ยอดขายและบิล', 'บิลที่ยกเลิก', m.sales?.cancelledOrders || 0, 'บิล'],
      ['ยอดขายและบิล', 'ยอดขายรวมทั้งปี', m.sales?.totalRevenue || 0, 'บาท'],
      ['ยอดขายและบิล', 'จำนวนชิ้นที่ขายออก', m.sales?.totalItemsSold || 0, 'ชิ้น'],
      [''],
      ['คลังสินค้าและ SKU', 'จำนวน SKU ทั้งหมด', m.inventory?.totalSkus || 0, 'SKU'],
      ['คลังสินค้าและ SKU', 'SKU เพิ่มใหม่ในปีนี้', m.inventory?.skusAddedInYear || 0, 'SKU'],
      ['คลังสินค้าและ SKU', 'สต๊อกคงเหลือยกยอด', m.inventory?.totalStockQty || 0, 'ชิ้น'],
      ['คลังสินค้าและ SKU', 'มูลค่าสต๊อกคงเหลือ', m.inventory?.totalStockValue || 0, 'บาท'],
      [''],
      ['ลูกค้าและสมาชิก', 'ลูกค้าที่ทำธุรกรรม', m.customers?.totalCustomers || 0, 'ราย'],
      [''],
      ['บริการหลังการขาย', 'รับเคลมส่งซ่อม', m.afterSales?.totalClaims || 0, 'รายการ'],
      ['บริการหลังการขาย', 'รับคืนสินค้า', m.afterSales?.totalReturns || 0, 'รายการ']
    ];

    const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DH_Yearly_Summary_${record.year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("ดาวน์โหลด CSV รายงานเรียบร้อยแล้ว");
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/managers')}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors active:scale-95"
            title="กลับสู่หน้าแผงควบคุมผู้จัดการ"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-lg">
                <Archive size={18} strokeWidth={2.5} />
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                ตัดยอดปิดรอบปี (Yearly Archive & Checksum Seal)
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              สร้าง Snapshot สรุปผลรายปี ประทับตรา SHA-256 Checksum ตรวจสอบความถูกต้องและดาวน์โหลดรายงาน
            </p>
          </div>
        </div>

        {/* Year Select & Compute Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <Calendar size={15} className="text-slate-500" />
            <span>เลือกปี:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={y} className="dark:bg-slate-800">
                  ปี {y} (พ.ศ. {y + 543})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handleComputePreview(selectedYear)}
            disabled={isComputing}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isComputing ? <RefreshCw size={14} className="animate-spin" /> : <Calculator size={14} />}
            <span>คำนวณยอด</span>
          </button>
        </div>
      </div>

      {/* Preview Section */}
      {previewData && (
        <div className="space-y-3 animate-in zoom-in-95 duration-150">
          <div className="flex justify-between items-center bg-amber-500/10 border border-amber-300 dark:border-amber-900/50 p-4 rounded-xl text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2 text-xs font-bold">
              <AlertTriangle size={18} />
              <span>โหมดพรีวิว: ตัวเลขสรุปปี {previewData.year} (ยังไม่ได้ประทับตรา Checksum Seal)</span>
            </div>
            <button
              onClick={() => handleSealArchive(previewData.year)}
              disabled={isSealing}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isSealing ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
              <span>🔒 ตัดยอดและประทับตรา Checksum Seal</span>
            </button>
          </div>
          <ArchiveCard
            archive={{
              ...previewData,
              status: 'PREVIEW',
              closedBy: { name: 'Preview Mode' },
              closedAt: new Date().toISOString()
            }}
            onDownloadJson={handleDownloadJson}
            onDownloadCsv={handleDownloadCsv}
          />
        </div>
      )}

      {/* Sealed Archives History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <h2 className="text-base font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <span>รายการปีที่ปิดรอบและประทับตราแล้ว ({archives.length} รายการ)</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-bold flex flex-col items-center gap-2">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
            <span>กำลังโหลดรายการปิดรอบปี...</span>
          </div>
        ) : archives.length > 0 ? (
          <div className="space-y-6">
            {archives.map(rec => (
              <ArchiveCard
                key={rec.year}
                archive={rec}
                onDownloadJson={handleDownloadJson}
                onDownloadCsv={handleDownloadCsv}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <Archive size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">ยังไม่มีการตัดยอดปิดรอบปี</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              เลือกปีที่ต้องการจากกล่องด้านบน แล้วกดปุ่ม <b>"คำนวณยอด"</b> เพื่อเริ่มสร้าง Snapshot สรุปผลประจำปี
            </p>
          </div>
        )}
      </div>

      {/* Guide Panel */}
      <YearlyArchiveGuide />
    </div>
  );
}
