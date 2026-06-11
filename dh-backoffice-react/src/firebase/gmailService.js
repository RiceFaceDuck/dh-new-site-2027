import { db } from './config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Check if the Gmail credentials have been set up by the admin.
 */
export const checkGmailConfigured = async () => {
  try {
    const docRef = doc(db, 'system_config', 'gmail_auth');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return false;
    
    return !!docSnap.data().web_app_url;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * Admin: Save the Web App URL.
 */
export const saveGmailCredentials = async (webAppUrl) => {
  const docRef = doc(db, 'system_config', 'gmail_auth');
  await setDoc(docRef, {
    web_app_url: webAppUrl,
    updated_at: serverTimestamp()
  }, { merge: true });
};

/**
 * Helper to fetch from GAS Web App
 */
const fetchFromGAS = async (action, data = {}) => {
  const docRef = doc(db, 'system_config', 'gmail_auth');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists() || !docSnap.data().web_app_url) {
    throw new Error("ระบบยังไม่ได้ตั้งค่า Web App URL");
  }
  
  const url = docSnap.data().web_app_url;
  
  // Using POST method. For GAS Web App, we use text/plain to avoid CORS preflight issues 
  // if standard headers cause problems, but we added CORS to the GAS script so JSON is fine.
  // Actually, standard fetch with no-cors doesn't return data. We must use standard cors.
  // GAS requires following redirects. fetch does this by default.
  
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ action, data }),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8', // GAS handles text/plain better for CORS
    }
  });

  const result = await response.json();
  if (result.error) throw new Error(result.error);
  return result;
};

/**
 * Fetch unread email count
 */
export const getUnreadCount = async () => {
  const res = await fetchFromGAS('getUnreadCount');
  return res.count || 0;
};

/**
 * Fetch list of emails
 */
export const fetchEmailsList = async (start = 0, maxResults = 20, query = 'in:inbox') => {
  const res = await fetchFromGAS('fetchEmails', { start, maxResults, query });
  return {
    emails: res.emails || [],
    nextStart: res.nextStart,
    hasMore: res.hasMore
  };
};

/**
 * Fetch full email detail
 */
export const fetchEmailDetail = async (id) => {
  const res = await fetchFromGAS('fetchDetail', { id });
  return res.email;
};

/**
 * Mark email as read
 */
export const markAsRead = async (id) => {
  await fetchFromGAS('markAsRead', { id });
};

/**
 * Mark email as unread
 */
export const markAsUnread = async (id) => {
  await fetchFromGAS('markAsUnread', { id });
};

/**
 * Mark all as read
 */
export const markAllAsRead = async () => {
  await fetchFromGAS('markAllAsRead');
};

/**
 * Toggle Star
 */
export const toggleStar = async (id, isStarred) => {
  await fetchFromGAS('toggleStar', { id, isStarred });
};

/**
 * Toggle Important
 */
export const toggleImportant = async (id, isImportant) => {
  await fetchFromGAS('toggleImportant', { id, isImportant });
};

/**
 * Send an email
 */
export const sendEmail = async (to, subject, body, threadId = null) => {
  await fetchFromGAS('sendEmail', { to, subject, body, threadId });
};
