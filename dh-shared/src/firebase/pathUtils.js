export const getAppId = () => {
    return typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";
};

// 🌟 กู้คืนระบบให้กลับไปดึงข้อมูลจากโครงสร้างเดิมทั้งหมด เพื่อให้โฆษณาและพนักงานกลับมา
export const getCollectionPath = (collectionName) => {
    if (typeof window !== "undefined" && window.location && window.location.hostname.includes('canvas')) {
        return `artifacts/${getAppId()}/public/data/${collectionName}`;
    }
    return collectionName;
};

export const getUsersPath = () => {
    return getCollectionPath('users');
};

export const getUserSubcollectionPath = (uid, subcollectionName) => {
    return `${getUsersPath()}/${uid}/${subcollectionName}`;
};
