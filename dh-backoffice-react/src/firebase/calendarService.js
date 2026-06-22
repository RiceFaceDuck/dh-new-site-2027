import { db, auth } from './config';
import { doc, getDoc } from 'firebase/firestore';
import { historyService } from './historyService';

let cachedWebAppUrl = null;

/**
 * Helper to fetch from GAS Web App
 */
const fetchFromGAS = async (action, data = {}) => {
  let url = cachedWebAppUrl;
  
  if (!url) {
    // ใช้ Web App URL ตัวเดียวกับที่แอดมินตั้งไว้ให้ระบบ Gmail (เพื่อให้แอดมินแก้ไขจุดเดียวจบ)
    const docRef = doc(db, 'system_config', 'gmail_auth');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || !docSnap.data().web_app_url) {
      throw new Error("ระบบยังไม่ได้ตั้งค่า Google Web App URL (กรุณาไปที่หน้า Email Setup)");
    }
    url = docSnap.data().web_app_url;
    cachedWebAppUrl = url;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ action, data }),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8', 
    }
  });

  const result = await response.json();
  if (result.error) throw new Error(result.error);
  return result;
};

export const calendarService = {
  /**
   * สร้างเหตุการณ์และส่งคำเชิญไปยังพนักงาน
   * @param {Object} eventData 
   * @param {string} eventData.title 
   * @param {string} eventData.startTime (ISO String)
   * @param {string} eventData.endTime (ISO String)
   * @param {string} eventData.description 
   * @param {Array<string>} eventData.guests (array of emails)
   */
  createEvent: async (eventData) => {
    const res = await fetchFromGAS('createCalendarEvent', eventData);
    await historyService.addLog('Calendar', 'CreateEvent', res.eventId || 'Unknown', `สร้างกิจกรรม: ${eventData.title}`, auth.currentUser?.uid);
    return res;
  }
};
