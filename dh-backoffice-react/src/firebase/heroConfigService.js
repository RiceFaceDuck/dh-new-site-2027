import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './config.js';
import { historyService } from './historyService.js';
import { getCollectionPath } from 'dh-shared';

const HERO_DOC = 'hero_config'; // 🖼️ อ้างอิงเอกสารสำหรับป้ายโฆษณาหน้าแรก

// 💡 Default Hero Banner Config (Official DH Notebook Schema & Copy)
export const DEFAULT_HERO_CONFIG = {
  isActive: true,
  badge: { text: '', isActive: false, color: '#facc15' },
  title: '<span style="color: #facc15" class="font-black">DH:</span> จำหน่ายอะไหล่โน๊ตบุ๊คทุกชนิด <br class="hidden md:block" /> ราคาส่งสำหรับช่าง & <br class="hidden md:block" /> SPARES.',
  titleSegments: [
    { text: 'DH: ', color: '#facc15', isHighlight: true, isBold: true, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: false, breakAll: false },
    { text: 'จำหน่ายอะไหล่โน๊ตบุ๊คทุกชนิด ', color: '', isHighlight: false, isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: true, breakAll: false },
    { text: 'ราคาส่งสำหรับช่าง & ', color: '', isHighlight: false, isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: true, breakAll: false },
    { text: 'SPARES.', color: '', isHighlight: false, isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: false, breakAll: false }
  ],
  subtitle: { text: '', isActive: false },
  imageUrl: 'https://images.unsplash.com/photo-1591405351990-4726e331f14c?w=1200&q=80',
  imageLayout: 'split',
  bannerHeight: 'standard',
  textAlignment: 'left',
  primaryButton: {
    label: 'BOOK A SQUAD',
    link: '/squad',
    isActive: true,
    variant: 'solid'
  },
  secondaryButton: {
    label: 'SHOP SPARES',
    link: '/category/all',
    isActive: true,
    variant: 'solid'
  },
  overlay: {
    enabled: true,
    color: '#1f2937',
    opacity: 90,
    direction: 'to-r'
  }
};

/**
 * Compile title segments into standardized HTML string
 */
export const compileHeroTitle = (segments = []) => {
  if (!Array.isArray(segments) || segments.length === 0) return '';
  return segments.map(seg => {
    let text = seg.text || '';
    const classes = [];
    if (seg.isBold) classes.push('font-black');
    if (seg.isItalic) classes.push('italic');
    if (seg.isUnderline) classes.push('underline');
    if (seg.isStrikethrough) classes.push('line-through');

    const color = seg.color || (seg.isHighlight ? '#facc15' : '');
    const classStr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
    const styleStr = color ? ` style="color: ${color}"` : '';

    if (classStr || styleStr) {
      text = `<span${classStr}${styleStr}>${text}</span>`;
    }

    if (seg.breakAll) {
      text += `<br />`;
    } else if (seg.breakDesktop) {
      text += `<br class="hidden md:block" />`;
    }
    return text;
  }).join(' ').replace(/\s+/g, ' ').trim();
};

// Helper to migrate legacy HTML title to Segments
export const parseHtmlToSegments = (html) => {
    if (!html) return [];
    try {
        const div = document.createElement('div');
        div.innerHTML = html;
        const segments = [];
        Array.from(div.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                if (text) {
                    segments.push({ text: text, color: '', isHighlight: false, isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: false, breakAll: false });
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName.toLowerCase() === 'span') {
                    const classes = node.className || '';
                    segments.push({ 
                        text: node.textContent, 
                        isHighlight: classes.includes('text-yellow-400') || node.style.color === '#facc15',
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
        return segments.length > 0 ? segments : [{ text: html.replace(/<[^>]*>?/gm, ''), color: '', isHighlight: false, isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: false, breakAll: false }];
    } catch (e) {
        return [{ text: html.replace(/<[^>]*>?/gm, ''), color: '', isHighlight: false, isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: false, breakAll: false }];
    }
};

export const heroConfigService = {
  // ==========================================
  // ระบบจัดการป้ายโฆษณาหน้าแรก (Hero Billboard)
  // ==========================================
  
  getHeroConfig: async () => {
    try {
      const docRef = doc(db, getCollectionPath('settings'), HERO_DOC);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const merged = { ...DEFAULT_HERO_CONFIG, ...data };
        
        // 🔄 Migration: จัดการกรณีที่ข้อมูล title กับ titleSegments ไม่ตรงกัน
        const isDefaultSegments = merged.titleSegments && merged.titleSegments[0] && merged.titleSegments[0].text.includes('DH:');
        const isCustomTitle = data.title && !data.title.includes('DH:');

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
      const docRef = doc(db, getCollectionPath('settings'), HERO_DOC);
      const cleanData = JSON.parse(JSON.stringify(heroConfig));
      
      // Auto compile title from titleSegments
      if (cleanData.titleSegments && Array.isArray(cleanData.titleSegments) && cleanData.titleSegments.length > 0) {
        cleanData.title = compileHeroTitle(cleanData.titleSegments);
      }

      await setDoc(docRef, {
        ...cleanData,
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
