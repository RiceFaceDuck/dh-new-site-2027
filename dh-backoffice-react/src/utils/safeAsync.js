import { toast } from 'react-hot-toast';
import { parseFirebaseError } from 'dh-shared';

/**
 * Wrapper สำหรับครอบ Async Function เพื่อดักจับ Error และแจ้งเตือนผ่าน Toast อัตโนมัติ (Backoffice)
 * @param {Promise} promise - Async function หรืองานที่กำลังทำ
 * @param {string} customErrorMessage - (Optional) ข้อความแจ้งเตือนที่ต้องการระบุเฉพาะเจาะจง
 * @returns {Promise<any>} - ผลลัพธ์จากการทำงาน หรือ null หากเกิด Error
 */
export const withToastError = async (promise, customErrorMessage) => {
    try {
        const result = await promise;
        return result;
    } catch (error) {
        console.error("🔥 Error caught by withToastError:", error);
        const friendlyMessage = parseFirebaseError(error, customErrorMessage);
        toast.error(friendlyMessage);
        throw error;
    }
};

/**
 * Wrapper แบบไม่ Throw Error ต่อ (Silent Fail + Toast) 
 */
export const withToastErrorSilent = async (promise, customErrorMessage) => {
    try {
        const result = await promise;
        return [result, null];
    } catch (error) {
        console.error("🔥 Silent Error caught:", error);
        const friendlyMessage = parseFirebaseError(error, customErrorMessage);
        toast.error(friendlyMessage);
        return [null, error];
    }
};
