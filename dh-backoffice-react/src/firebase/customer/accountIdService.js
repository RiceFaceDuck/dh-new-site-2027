import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config';

const getCollectionPath = (colName) => {
    if (typeof window !== 'undefined' && window.__app_id && window.location.hostname.includes('canvas')) {
        return `artifacts/${window.__app_id}/public/data/${colName}`;
    }
    return colName; 
};

/**
 * สุ่มสร้าง Account ID มาตรฐาน 8 หลัก
 * @returns {string} 8-character uppercase alphanumeric string
 */
export const generateAccountId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * ตรวจสอบว่า Account ID หรือ customerCode นี้มีอยู่ในระบบแล้วหรือยัง
 * เพื่อป้องกันการชนกัน (Duplicate Check) ลด Firebase Read Quota
 * 
 * @param {string} accountId 
 * @param {string} excludeUid (Optional) ยกเว้น UID ตัวเองตอนแก้ไข
 * @returns {Promise<boolean>} true = มีคนใช้แล้ว (ซ้ำ), false = ว่าง
 */
export const checkAccountIdExists = async (accountId, excludeUid = null) => {
    if (!accountId) return false;
    
    const usersRef = collection(db, getCollectionPath('users'));
    const uppercaseId = accountId.toUpperCase();
    
    // เช็คในช่อง accountId
    const q1 = query(usersRef, where('accountId', '==', uppercaseId));
    const snap1 = await getDocs(q1);
    
    // เช็คในช่อง customerCode เผื่อระบบเก่า
    const q2 = query(usersRef, where('customerCode', '==', uppercaseId));
    const snap2 = await getDocs(q2);
    
    let isExist = false;

    // ตรวจสอบจาก snap1
    snap1.forEach(doc => {
        if (doc.id !== excludeUid) isExist = true;
    });

    // ตรวจสอบจาก snap2
    snap2.forEach(doc => {
        if (doc.id !== excludeUid) isExist = true;
    });

    return isExist;
};
