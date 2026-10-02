import { describe, it, expect } from 'vitest';
import {
  isSafeUrl,
  validateSocialUrl,
  FooterConfigSchema,
  CANONICAL_DEFAULT_FOOTER_CONFIG,
  DEFAULT_FOOTER_CONFIG
} from './footerConfigSchema.js';

describe('footerConfigSchema Security & Validation', () => {
  it('rejects malicious URL schemes (XSS, data, vbscript, protocol-relative)', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeUrl('//attacker.com/payload')).toBe(false);
    expect(isSafeUrl('')).toBe(false);
    expect(isSafeUrl(null)).toBe(false);
  });

  it('accepts safe internal paths, https, http, and tel links', () => {
    expect(isSafeUrl('/categories/inside')).toBe(true);
    expect(isSafeUrl('https://dhnotebook.com')).toBe(true);
    expect(isSafeUrl('http://dhnotebook.com')).toBe(true);
    expect(isSafeUrl('tel:02-xxx-xxxx')).toBe(true);
  });

  it('validates legitimate social URLs and rejects cross-platform/spoofs', () => {
    expect(validateSocialUrl('facebook', 'https://facebook.com/dhnotebook')).toBe(true);
    expect(validateSocialUrl('facebook', 'https://fb.me/dhnotebook')).toBe(true);
    expect(validateSocialUrl('tiktok', 'https://tiktok.com/@dhnotebook')).toBe(true);
    expect(validateSocialUrl('line', 'https://line.me/ti/p/~@dhnotebook')).toBe(true);
    expect(validateSocialUrl('line', 'https://lin.ee/xyz')).toBe(true);
    expect(validateSocialUrl('youtube', 'https://youtube.com/@dhnotebook')).toBe(true);
    expect(validateSocialUrl('youtube', 'https://youtu.be/xyz')).toBe(true);
    expect(validateSocialUrl('instagram', 'https://instagram.com/dhnotebook')).toBe(true);

    // Rejects spoofs and domain mismatches
    expect(validateSocialUrl('facebook', 'https://twitter.com/dhnotebook')).toBe(false);
    expect(validateSocialUrl('facebook', 'https://facebook.com.evil.com/dhnotebook')).toBe(false);
    expect(validateSocialUrl('tiktok', 'https://fake-tiktok.com')).toBe(false);
    expect(validateSocialUrl('line', 'https://lin.ee.phishing.com')).toBe(false);
  });

  it('hydrates empty object with canonical defaults without error', () => {
    const parsed = FooterConfigSchema.parse({});
    expect(parsed.colors.bgDark).toBe('slate-900');
    expect(parsed.company.logoUrl).toBe('/logo.png');
    expect(parsed.trustBadges.enabled).toBe(true);
    expect(Array.isArray(parsed.trustBadges.badges)).toBe(true);
    expect(parsed.businessHours.openHours).toBe('10:00');
    expect(parsed.marketingUsp.enabled).toBe(true);
  });

  it('preserves extra keys via passthrough fidelity', () => {
    const custom = {
      _customRevision: 99,
      colors: { bgDark: 'slate-800', customHex: '#123456' }
    };
    const parsed = FooterConfigSchema.parse(custom);
    expect(parsed._customRevision).toBe(99);
    expect(parsed.colors.bgDark).toBe('slate-800');
    expect(parsed.colors.customHex).toBe('#123456');
  });

  it('validates canonical default configuration passes schema completely', () => {
    const result = FooterConfigSchema.safeParse(CANONICAL_DEFAULT_FOOTER_CONFIG);
    expect(result.success).toBe(true);
    expect(result.data.trustBadges.badges.length).toBe(4);
    expect(result.data.marketingUsp.items.length).toBe(4);
  });
});
