/**
 * แปลงรหัสข้อผิดพลาดของ Firebase ให้เป็นข้อความภาษาไทยที่เข้าใจง่ายสำหรับผู้ใช้งาน
 * @param {Error} error - ข้อผิดพลาดที่ได้รับจาก Firebase หรือระบบ
 * @param {string} fallbackMessage - ข้อความเริ่มต้นหากไม่พบรหัสข้อผิดพลาดที่ตรงกัน
 * @returns {string} - ข้อความแสดงข้อผิดพลาดภาษาไทย
 */
export const parseFirebaseError = (error, fallbackMessage = "เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่อีกครั้ง") => {
    if (!error) return fallbackMessage;

    // ถ้า Error ถูกส่งมาเป็นสตริงโดยตรง
    if (typeof error === 'string') return error;

    const code = error.code || error.message || '';

    // Mapping Firebase Error Codes -> Thai Messages
    const errorMap = {
        'permission-denied': "คุณไม่มีสิทธิ์ในการดำเนินการนี้",
        'auth/user-not-found': "ไม่พบบัญชีผู้ใช้งานนี้ในระบบ",
        'auth/wrong-password': "รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่",
        'auth/email-already-in-use': "อีเมลนี้ถูกใช้งานแล้ว",
        'auth/weak-password': "รหัสผ่านอ่อนเกินไป กรุณาตั้งให้ยากขึ้น",
        'auth/network-request-failed': "การเชื่อมต่ออินเทอร์เน็ตมีปัญหา กรุณาตรวจสอบการเชื่อมต่อ",
        'auth/invalid-credential': "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง",
        'unavailable': "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ในขณะนี้ กรุณาลองใหม่ภายหลัง",
        'resource-exhausted': "ระบบทำงานหนักเกินโควต้า กรุณารอสักครู่แล้วลองใหม่",
        'unauthenticated': "กรุณาเข้าสู่ระบบก่อนทำรายการ",
        'not-found': "ไม่พบข้อมูลที่ต้องการในระบบ",
        'aborted': "การทำงานถูกยกเลิก (Transaction Aborted)",
        'already-exists': "ข้อมูลนี้มีอยู่ในระบบแล้ว",
        'deadline-exceeded': "การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง",
        'failed-precondition': "การดำเนินการถูกปฏิเสธ (Failed Precondition)",
    };

    // ค้นหาใน Mapping
    for (const [key, msg] of Object.entries(errorMap)) {
        if (code.includes(key)) {
            return msg;
        }
    }

    // ถ้ามี Message แปลกๆ ที่เราโยนมาเอง (throw new Error("...")) ก็คืนค่านั้นกลับไป (ถ้าอ่านง่ายพอ)
    if (error.message && !error.message.includes('Firebase')) {
        return error.message;
    }

    return fallbackMessage;
};
