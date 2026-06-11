import { db } from './config';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

const getCollectionPath = (colName) => {
    if (typeof __app_id !== 'undefined' && window.location.hostname.includes('canvas')) {
        return `artifacts/${__app_id}/public/data/${colName}`;
    }
    return colName; 
};

const getUserDocRef = (uid) => doc(db, getCollectionPath('users'), uid);

export const syncUserProfile = async (user) => {
    if (!user) return null;
    
    try {
        const userRef = getUserDocRef(user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const newUserData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                photoURL: user.photoURL || null,
                role: 'user', 
                status: 'active',
                financials: { credit: 0, wallet: 0 },
                metadata: {
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    source: 'auto_sync'
                }
            };
            await setDoc(userRef, newUserData);
            console.log(`✅ [UserProfileService] Created new profile for: ${user.email}`);
            return newUserData;
        } else {
            const currentData = userSnap.data();
            await updateDoc(userRef, {
                'metadata.lastLogin': serverTimestamp()
            });
            return currentData;
        }
    } catch (error) {
        console.error("❌ [UserProfileService] Sync Profile Error:", error);
        throw error;
    }
};

export const createUserProfile = async (uid, profileData) => {
    try {
        const userRef = getUserDocRef(uid);
        await setDoc(userRef, {
            ...profileData,
            'metadata.updatedAt': serverTimestamp()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error("❌ [UserProfileService] Create User Profile Error:", error);
        throw error;
    }
};

export const listenToUserRole = (uid, callback) => {
    if (!uid) {
        callback('user', null, new Error('No UID provided'));
        return () => {};
    }
    
    const userRef = getUserDocRef(uid);
    
    return onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            let currentRole = data.role || 'user';
            if (data.isStaff === true && (currentRole === 'user' || !data.role)) {
                currentRole = 'staff'; 
            }
            
            callback(currentRole, data, null);
        } else {
            callback('user', null, null);
        }
    }, (error) => {
        console.error("❌ [UserProfileService] Listen Role Error:", error);
        callback('user', null, error); 
    });
};

export const getUserProfile = async (uid) => {
    try {
        const userRef = getUserDocRef(uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const data = snap.data();
            
            if (data.isStaff === true && (!data.role || data.role === 'user')) {
                data.role = 'staff';
            }
            return { id: snap.id, ...data };
        }
        return null;
    } catch (error) {
        console.error("❌ [UserProfileService] Get User Profile Error:", error);
        throw error;
    }
};

export const getUserById = getUserProfile;
