import { describe, it, expect } from 'vitest';
import { StorefrontThemeSchema, HeroConfigSchema, HeroTitleSegmentSchema } from './themeSchema.js';
import { compileHeroTitle, parseHtmlToSegments } from '../firebase/heroConfigService.js';

describe('Theme & Hero Schema Contracts', () => {
  it('validates StorefrontThemeSchema with defaults', () => {
    const validTheme = {
      themeId: 'theme-trusted-partner',
      backgroundUrl: '/user-bg.jpg',
      blurLevel: '16',
      opacityTop: 75,
      opacityMid: 55,
      opacityBottom: 35
    };
    const result = StorefrontThemeSchema.safeParse(validTheme);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.themeId).toBe('theme-trusted-partner');
      expect(result.data.opacityTop).toBe(75);
    }
  });

  it('validates HeroConfigSchema with official DH brand defaults', () => {
    const validHero = {
      isActive: true,
      title: '<span style="color: #facc15" class="font-black">DH:</span> จำหน่ายอะไหล่',
      titleSegments: [
        { text: 'DH: ', color: '#facc15', isHighlight: true, isBold: true, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: false, breakAll: false },
        { text: 'จำหน่ายอะไหล่', color: '', isHighlight: false, isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: true, breakAll: false }
      ],
      badge: { text: 'โปรโมชั่น', isActive: true, color: '#facc15' },
      subtitle: { text: 'ศูนย์รวมอะไหล่แท้', isActive: true },
      imageUrl: 'https://images.unsplash.com/photo-1591405351990-4726e331f14c?w=1200&q=80',
      imageLayout: 'split',
      bannerHeight: 'standard',
      textAlignment: 'left',
      primaryButton: { label: 'BOOK A SQUAD', link: '/squad', isActive: true, variant: 'solid' },
      secondaryButton: { label: 'SHOP SPARES', link: '/category/all', isActive: true, variant: 'outline' },
      overlay: { enabled: true, color: '#1f2937', opacity: 90, direction: 'to-r' }
    };
    const result = HeroConfigSchema.safeParse(validHero);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.titleSegments.length).toBe(2);
      expect(result.data.badge.isActive).toBe(true);
      expect(result.data.secondaryButton.variant).toBe('outline');
    }
  });

  it('compiles titleSegments into clean HTML correctly', () => {
    const segments = [
      { text: 'DH: ', color: '#facc15', isHighlight: true, isBold: true, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: false, breakAll: false },
      { text: 'จำหน่ายอะไหล่โน๊ตบุ๊คทุกชนิด ', color: '', isHighlight: false, isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, breakDesktop: true, breakAll: false }
    ];
    const html = compileHeroTitle(segments);
    expect(html).toContain('class="font-black"');
    expect(html).toContain('style="color: #facc15"');
    expect(html).toContain('DH:');
    expect(html).toContain('<br class="hidden md:block" />');
  });

  it('parses HTML back into segments correctly', () => {
    const html = '<span style="color: #facc15" class="font-black">DH:</span> จำหน่ายอะไหล่';
    const segments = parseHtmlToSegments(html);
    expect(segments.length).toBeGreaterThan(0);
    expect(segments[0].text.trim()).toBe('DH:');
  });
});
