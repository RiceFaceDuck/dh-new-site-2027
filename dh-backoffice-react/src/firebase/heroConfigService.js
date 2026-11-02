import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './config.js';
import { historyService } from './historyService.js';
import { getCollectionPath } from 'dh-shared';

const HERO_DOC = 'hero_config'; // 🖼️ อ้างอิงเอกสารสำหรับป้ายโฆษณาหน้าแรก

// 💡 Single Banner Template
export const DEFAULT_HERO_BANNER = {
  id: 'banner_default_1',
  title: '<span style="color: #facc15" class="font-black">DH:</span> จำหน่ายอะไหล่โน๊ตบุ๊คทุกชนิด <br class="hidden md:block" /> ราคาส่งสำหรับช่าง & <br class="hidden md:block" /> SPARES.',
  titleSegments: [
    { text: 'DH: ', color: '#facc15', isHighlight: true, isBold: true, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: false, breakAll: false },
    { text: 'จำหน่ายอะไหล่โน๊ตบุ๊คทุกชนิด ', color: '', isHighlight: false, isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: true, breakAll: false },
    { text: 'ราคาส่งสำหรับช่าง & ', color: '', isHighlight: false, isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: true, breakAll: false },
    { text: 'SPARES.', color: '', isHighlight: false, isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: false, breakAll: false }
  ],
  badge: { text: '', isActive: false, color: '#facc15' },
  subtitle: { text: '', isActive: false },
  imageUrl: '/user-bg.jpg',
  imageLayout: 'full',
  imageFit: 'contain',
  textAlignment: 'left',
  isActive: true,
  order: 1,
  primaryButton: {
    label: 'BOOK A SQUAD',
    link: '/squad',
    isActive: true,
    variant: 'solid'
  },
  secondaryButton: {
    label: 'SHOP SPARES',
    link: '/categories',
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

// 💡 Default Hero Banner Config (Official DH Notebook Schema & Copy)
export const DEFAULT_HERO_CONFIG = {
  isActive: true,
  aspectRatio: '16:9',
  autoplay: true,
  autoplaySpeed: 5000,
  transitionEffect: 'slide',
  bannerHeight: 'standard',
  banners: [DEFAULT_HERO_BANNER],
  badge: { text: '', isActive: false, color: '#facc15' },
  title: '<span style="color: #facc15" class="font-black">DH:</span> จำหน่ายอะไหล่โน๊ตบุ๊คทุกชนิด <br class="hidden md:block" /> ราคาส่งสำหรับช่าง & <br class="hidden md:block" /> SPARES.',
  titleSegments: [
    { text: 'DH: ', color: '#facc15', isHighlight: true, isBold: true, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: false, breakAll: false },
    { text: 'จำหน่ายอะไหล่โน๊ตบุ๊คทุกชนิด ', color: '', isHighlight: false, isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: true, breakAll: false },
    { text: 'ราคาส่งสำหรับช่าง & ', color: '', isHighlight: false, isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: true, breakAll: false },
    { text: 'SPARES.', color: '', isHighlight: false, isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: false, breakAll: false }
  ],
  subtitle: { text: '', isActive: false },
  imageUrl: '/user-bg.jpg',
  imageLayout: 'full',
  imageFit: 'contain',
  textAlignment: 'left',
  primaryButton: {
    label: 'BOOK A SQUAD',
    link: '/squad',
    isActive: true,
    variant: 'solid'
  },
  secondaryButton: {
    label: 'SHOP SPARES',
    link: '/categories',
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

        // 🔄 Multi-Banner Migration: แปลงป้ายเดี่ยวเดิมเป็น Array of Banners
        if (!Array.isArray(merged.banners) || merged.banners.length === 0) {
          merged.banners = [{
            id: 'banner_migrated_1',
            title: merged.title || DEFAULT_HERO_BANNER.title,
            titleSegments: merged.titleSegments || DEFAULT_HERO_BANNER.titleSegments,
            badge: merged.badge || DEFAULT_HERO_BANNER.badge,
            subtitle: merged.subtitle || DEFAULT_HERO_BANNER.subtitle,
            imageUrl: merged.imageUrl || DEFAULT_HERO_BANNER.imageUrl,
            imageLayout: merged.imageLayout || 'full',
            imageFit: merged.imageFit || 'contain',
            textAlignment: merged.textAlignment || 'left',
            isActive: merged.isActive ?? true,
            order: 1,
            primaryButton: merged.primaryButton || DEFAULT_HERO_BANNER.primaryButton,
            secondaryButton: merged.secondaryButton || DEFAULT_HERO_BANNER.secondaryButton,
            overlay: merged.overlay || DEFAULT_HERO_BANNER.overlay
          }];
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
      
      // Auto compile title for all banners
      if (Array.isArray(cleanData.banners) && cleanData.banners.length > 0) {
        cleanData.banners = cleanData.banners.map((b, idx) => {
          const compiledTitle = (b.titleSegments && b.titleSegments.length > 0)
            ? compileHeroTitle(b.titleSegments)
            : (b.title || '');
          return {
            ...DEFAULT_HERO_BANNER,
            ...b,
            title: compiledTitle,
            order: b.order !== undefined ? b.order : idx + 1
          };
        });

        // Mirror first active (or first) banner to root properties for backward compatibility
        const primaryBanner = cleanData.banners.find(b => b.isActive) || cleanData.banners[0];
        if (primaryBanner) {
          cleanData.title = primaryBanner.title;
          cleanData.titleSegments = primaryBanner.titleSegments;
          cleanData.badge = primaryBanner.badge;
          cleanData.subtitle = primaryBanner.subtitle;
          cleanData.imageUrl = primaryBanner.imageUrl;
          cleanData.imageLayout = primaryBanner.imageLayout;
          cleanData.imageFit = primaryBanner.imageFit;
          cleanData.textAlignment = primaryBanner.textAlignment;
          cleanData.primaryButton = primaryBanner.primaryButton;
          cleanData.secondaryButton = primaryBanner.secondaryButton;
          cleanData.overlay = primaryBanner.overlay;
        }
      } else if (cleanData.titleSegments && Array.isArray(cleanData.titleSegments) && cleanData.titleSegments.length > 0) {
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
