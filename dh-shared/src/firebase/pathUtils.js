export const getAppId = () => {
    return typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";
};

export const isCanvasEnv = () => {
    return typeof window !== 'undefined' && window.location.hostname.includes('canvas') && typeof window.__app_id !== 'undefined';
};

/**
 * Get standard collection path
 * Uses artifacts/.../public/data in Canvas preview mode,
 * Uses Root Collection in Production mode.
 */
export const getCollectionPath = (collectionName) => {
    if (isCanvasEnv()) {
        return `artifacts/${getAppId()}/public/data/${collectionName}`;
    }
    return collectionName;
};

/**
 * Get User Collection path
 * Uses artifacts/.../public/data/users in Canvas preview mode,
 * Uses Root 'users' in Production mode.
 */
export const getUsersPath = () => {
    if (isCanvasEnv()) {
        return `artifacts/${getAppId()}/public/data/users`;
    }
    return 'users';
};

/**
 * Get Subcollection path under a User
 */
export const getUserSubcollectionPath = (uid, subcollectionName) => {
    return `${getUsersPath()}/${uid}/${subcollectionName}`;
};
