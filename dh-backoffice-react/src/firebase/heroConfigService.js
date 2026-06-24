import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './config';
import { historyService } from './historyService';

const HERO_DOC = 'hero_config'; // 🖼️ อ้างอิงเอกสารสำหรับป้ายโฆษณาหน้าแรก

// 💡 Default Hero Banner Config
export const DEFAULT_HERO_CONFIG = {
  isActive: true,
  title: '<span class="text-yellow-400">TEQFIX:</span> YOUR CERTIFIED PARTNER <br class="hidden md:block" /> FOR ELECTRONIC REPAIRS & <br class="hidden md:block" /> GENUINE SPARES.',
  titleSegments: [
    { text: 'TEQFIX: ', isHighlight: true, breakDesktop: false, breakAll: false },
    { text: 'YOUR CERTIFIED PARTNER ', isHighlight: false, breakDesktop: true, breakAll: false },
    { text: 'FOR ELECTRONIC REPAIRS & ', isHighlight: false, breakDesktop: true, breakAll: false },
    { text: 'GENUINE SPARES.', isHighlight: false, breakDesktop: false, breakAll: false }
  ],
  imageUrl: 'https://images.unsplash.com/photo-1591405351990-4726e331f14c?w=1200&q=80',
  primaryButton: {
    label: 'BOOK A SQUAD',
    link: '/squad',
    isActive: true
  },
  secondaryButton: {
    label: 'SHOP SPARES',
    link: '/category/all',
    isActive: true
  },
  overlay: {
    color: '#1f2937',
    opacity: 90
  }
};

// Helper to migrate legacy HTML title to Segments
const parseHtmlToSegments = (html) => {
    if (!html) return [];
    try {
        const div = document.createElement('div');
        div.innerHTML = html;
        const segments = [];
        Array.from(div.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                if (text) { // keep spaces
                    segments.push({ text: text, isHighlight: false, breakDesktop: false, breakAll: false });
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName.toLowerCase() === 'span') {
                    const classes = node.className || '';
                    segments.push({ 
                        text: node.textContent, 
                        isHighlight: classes.includes('text-yellow-400'),
                        isBold: classes.includes('font-black'),
                        isItalic: classes.includes('italic'),
                        isUnderline: classes.includes('underline'),
                        isStrikethrough: classes.includes('line-through'),
                        color: node.style.color || '',
                        breakDesktop: false, 
                        breakAll: false 
                    });
                } else if (node.tagName.toLowerCase() === 'br') {
                    if (segments.length > 0) {
                        if (node.className.includes('hidden') && node.className.includes('md:block')) {
                            segments[segments.length - 1].breakDesktop = true;
                        } else {
                            segments[segments.length - 1].breakAll = true;
                        }
                    }
                }
            }
        });
        return segments.length > 0 ? segments : [{ text: html.replace(/<[^>]*>?/gm, ''), isHighlight: false, breakDesktop: false, breakAll: false }];
    } catch (e) {
        return [{ text: html.replace(/<[^>]*>?/gm, ''), isHighlight: false, breakDesktop: false, breakAll: false }];
    }
};

export const heroConfigService = {
  // ==========================================
  // ระบบจัดการป้ายโฆษณาหน้าแรก (Hero Billboard)
  // ==========================================
  
  getHeroConfig: async () => {
    try {
      const docRef = doc(db, 'settings', HERO_DOC);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const merged = { ...DEFAULT_HERO_CONFIG, ...data };
        
        // 🔄 Migration: จัดการกรณีที่ข้อมูล title กับ titleSegments ไม่ตรงกัน
        const isDefaultSegments = merged.titleSegments && merged.titleSegments[0] && merged.titleSegments[0].text.includes('TEQFIX');
        const isCustomTitle = data.title && !data.title.includes('TEQFIX');

        if ((data.title && !data.titleSegments) || (isCustomTitle && isDefaultSegments)) {
            merged.titleSegments = parseHtmlToSegments(data.title);
        }
        
        return merged;
      }
      return DEFAULT_HERO_CONFIG;
    } catch (error) {
      console.error("🔥 Error fetching hero config:", error);
      return DEFAULT_HERO_CONFIG;
    }
  },

  updateHeroConfig: async (heroConfig, changesDiff = []) => {
    try {
      const docRef = doc(db, 'settings', HERO_DOC);
      await setDoc(docRef, {
        ...heroConfig,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      let logDetail = 'อัปเดตป้ายโฆษณาหน้าแรก';
      if (changesDiff && changesDiff.length > 0) {
          const diffMsg = changesDiff.map(c => `${c.label}: ${c.oldVal}->${c.newVal}`).join(', ');
          logDetail += ` | ${diffMsg}`;
      }
      
      await historyService.addLog('Settings', 'Update', HERO_DOC, logDetail, auth.currentUser?.uid);
      return { success: true, message: 'บันทึกการตั้งค่าป้ายหน้าแรกสำเร็จ' };
    } catch (error) {
      console.error("🔥 Error updating hero config:", error);
      throw error;
    }
  }
};

export default heroConfigService;
