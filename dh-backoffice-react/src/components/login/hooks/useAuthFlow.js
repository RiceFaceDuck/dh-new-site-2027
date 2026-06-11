import { useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../../../firebase/config';
import { userService } from '../../../firebase/userService';
import { todoService } from '../../../firebase/todoService';

const getCollectionPath = (colName) => {
    if (typeof __app_id !== 'undefined' && window.location.hostname.includes('canvas')) {
        return `artifacts/${__app_id}/public/data/${colName}`;
    }
    return colName; 
};

export const useAuthFlow = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [statusText, setStatusText] = useState('');
    const [attemptedEmail, setAttemptedEmail] = useState('');
    const [viewMode, setViewMode] = useState('login'); // 'login', 'register', 'status'
    const [statusData, setStatusData] = useState({ type: '', title: '', message: '' }); // type: 'pending', 'unauthorized', 'success'

    // ==========================================
    // 🔐 1. โหมดเข้าสู่ระบบ (LOGIN)
    // ==========================================
    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        setStatusText('กำลังเชื่อมต่อบัญชี Google...');
        setAttemptedEmail('');

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            setAttemptedEmail(user.email); 

            setStatusText('กำลังตรวจสอบข้อมูลในระบบ...');
            const profile = await userService.syncUserProfile(user);

            // 🛑 ตรวจสอบว่าพนักงานรายนี้รออนุมัติอยู่หรือไม่?
            if (profile?.role === 'pending_approval' || profile?.role === 'pending') {
                await signOut(auth); // เตะออกเพื่อความปลอดภัย
                setStatusData({
                    type: 'pending',
                    title: 'ผู้มีอำนาจกำลังตัดสินใจ',
                    message: 'บัญชีของคุณอยู่ระหว่างรอการตรวจสอบและอนุมัติจากผู้จัดการ'
                });
                setViewMode('status');
                setLoading(false);
                return;
            }

            // 🛡️ ตรวจสอบกลุ่มเจ้าของร้าน
            const userEmail = (user.email || '').toLowerCase();
            const isOwner = [
                'dh1notebook@gmail.com', 
                'dh2notebook@gmail.com', 
                'zhoulinjuan1@gmail.com'
            ].includes(userEmail);

            if (isOwner) {
                setStatusText('กำลังเปิดสิทธิ์ระดับผู้ดูแลสูงสุด (Owner)...');
                try {
                    await userService.updateUserRole(user.uid, 'owner');
                    const userRef = doc(db, getCollectionPath('users'), user.uid);
                    await updateDoc(userRef, { isStaff: true, isActive: true, role: 'owner', roles: ['Owner'] });
                } catch (e) { console.error("Force owner role failed", e); }
            } else if (!profile?.isStaff && !['admin', 'manager', 'staff', 'packer'].includes(profile?.role)) {
                // กรณีมีบัญชีแต่ไม่มีสิทธิ์เป็นพนักงาน
                await signOut(auth);
                setStatusData({
                    type: 'unauthorized',
                    title: 'คุณไม่มีสิทธิ์',
                    message: 'คุณไม่ใช้เจ้าหน้าที่พนักงานของ DH Notebook'
                });
                setViewMode('status');
                setLoading(false);
                return;
            }

            setStatusData({
                type: 'success',
                title: 'ยืนยันตัวตนสำเร็จ',
                message: 'กำลังพาท่านเข้าสู่พื้นที่ทำงาน...',
                user: { name: user.displayName || 'พนักงาน', photo: user.photoURL }
            });
            setViewMode('status');

            setTimeout(() => {
                window.location.replace('/overview'); 
            }, 1500);

        } catch (err) {
            console.error("Login Error:", err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError('คุณได้ยกเลิกการเข้าระบบก่อนทำรายการเสร็จ');
            } else {
                setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google กรุณาลองใหม่');
            }
            setLoading(false);
        }
    };

    // ==========================================
    // 📝 2. โหมดลงทะเบียนพนักงานใหม่ (REGISTER)
    // ==========================================
    const handleStaffRegistration = async (regForm) => {
        // Basic Validation
        if (!regForm.firstName || !regForm.lastName || !regForm.nickname || !regForm.startDate || !regForm.age) {
            setError('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
            return;
        }

        setError('');
        setLoading(true);
        setStatusText('กำลังเชื่อมต่อบัญชี Google ของคุณ...');

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            setAttemptedEmail(user.email);

            // เช็คว่ามีบัญชีแล้วหรือยัง
            const existingProfile = await userService.getUserProfile(user.uid);
            if (existingProfile && existingProfile.role && existingProfile.role !== 'user') {
                if (existingProfile.role === 'pending_approval' || existingProfile.role === 'pending') {
                    setStatusData({
                        type: 'pending',
                        title: 'ส่งคำขอสำเร็จแล้ว',
                        message: 'บัญชีของคุณเคยส่งคำขอแล้ว และผู้มีอำนาจกำลังตัดสินใจ'
                    });
                    setViewMode('status');
                    await signOut(auth);
                    setLoading(false);
                    return;
                } else {
                    // ถ้าเป็นพนักงานอยู่แล้ว ให้เข้าสู่ระบบเลย
                    window.location.replace('/overview');
                    return;
                }
            }

            setStatusText('กำลังส่งคำร้องขอเข้าทำงานไปยังผู้จัดการ...');
            
            // 1. ลงทะเบียนเป็นสถานะ Pending
            await userService.registerPendingStaff(user.uid, user.email, regForm);
            
            // 2. สร้าง To-do ให้ผู้จัดการอนุมัติ
            await todoService.createStaffApprovalTask({
                uid: user.uid,
                email: user.email,
                ...regForm
            });

            setStatusData({
                type: 'pending',
                title: 'ส่งคำขอสำเร็จ',
                message: 'ข้อมูลของคุณถูกส่งไปยังผู้จัดการแล้ว คุณจะสามารถเข้าใช้งานระบบได้ทันทีหลังจากได้รับการอนุมัติ',
                user: { name: `${regForm.firstName} ${regForm.lastName}`, photo: user.photoURL }
            });
            setViewMode('status');
            
            // เตะออกจากระบบ Auth ป้องกันไม่ให้แอบเข้าแอปโดยไม่ตั้งใจ
            await signOut(auth);

        } catch (err) {
            console.error("Registration Error:", err);
            if (err.code === 'auth/popup-closed-by-user') {
              setError('คุณได้ยกเลิกการเข้าระบบก่อนทำรายการเสร็จ');
            } else {
              setError('ไม่สามารถลงทะเบียนได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
            }
            setLoading(false);
        }
    };

    const resetFlow = () => {
        setViewMode('login');
        setError('');
        setAttemptedEmail('');
    };

    return {
        viewMode,
        setViewMode,
        loading,
        error,
        setError,
        statusText,
        attemptedEmail,
        statusData,
        handleGoogleLogin,
        handleStaffRegistration,
        resetFlow
    };
};
