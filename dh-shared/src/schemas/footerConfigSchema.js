import { z } from 'zod';

/**
 * 🛡️ Security Allowlist Validator for URL Schemes
 * Enforces dual-defense: blocks dangerous protocols and restricts to safe prefixes.
 */
export const isSafeUrl = (url) => {
  if (url === null || url === undefined || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '') return false;
  const lower = trimmed.toLowerCase();

  // Reject dangerous schemes and protocol-relative links
  if (
    trimmed.startsWith('//') ||
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  ) {
    return false;
  }

  // Allow safe web URLs, internal paths, and click-to-call phone schemes
  if (
    trimmed.startsWith('/') ||
    lower.startsWith('https://') ||
    lower.startsWith('http://') ||
    lower.startsWith('tel:')
  ) {
    return true;
  }

  return false;
};

/**
 * 🛡️ Platform Boundary and Domain Spoofing Validator for Social Links
 */
export const validateSocialUrl = (platform, url, options = { allowEmpty: true }) => {
  if (url === null || url === undefined || typeof url !== 'string') return false;
  const trimmed = url.trim();

  if (trimmed === '') {
    return options?.allowEmpty !== false;
  }

  if (!isSafeUrl(trimmed)) return false;

  const lower = trimmed.toLowerCase();
  // Social profiles strictly require http or https protocols (tel: is rejected)
  if (!lower.startsWith('https://') && !lower.startsWith('http://')) return false;

  let hostname = '';
  try {
    const parsed = new URL(trimmed);
    hostname = parsed.hostname.toLowerCase();
  } catch {
    return false;
  }

  const p = String(platform || '').toLowerCase().trim();

  if (p === 'facebook' || p === 'fb') {
    return /(^|\.)(facebook\.com|fb\.com|fb\.me|fb\.watch)$/i.test(hostname);
  }

  if (p === 'tiktok') {
    return /(^|\.)(tiktok\.com)$/i.test(hostname);
  }

  if (p === 'line' || p === 'line_oa' || p === 'line oa' || p === 'lineoa') {
    return /(^|\.)(line\.me|lin\.ee|naver\.jp)$/i.test(hostname);
  }

  if (p === 'youtube' || p === 'yt') {
    return /(^|\.)(youtube\.com|youtu\.be)$/i.test(hostname);
  }

  if (p === 'instagram' || p === 'ig') {
    return /(^|\.)(instagram\.com|instagr\.am)$/i.test(hostname);
  }

  return false;
};

// ============================================================================
// CANONICAL DEFAULTS DICTIONARY
// ============================================================================

export const DEFAULT_FOOTER_COLORS = {
  bgDark: 'slate-900',
  textMuted: 'slate-400',
  primaryAccent: 'cyber-blue'
};

export const DEFAULT_FOOTER_COMPANY = {
  logoUrl: '/logo.png',
  description: 'ผู้นำเข้าและจัดจำหน่ายอะไหล่โน๊ตบุ๊คครบวงจร พร้อมเครือข่ายช่างพันธมิตรทั่วประเทศ ที่พร้อมให้บริการคุณด้วยระบบปฏิบัติการอัจฉริยะ',
  address: 'ศูนย์การค้าเซียร์รังสิต ชั้น 3 ห้อง xxx ถ.พหลโยธิน จ.ปทุมธานี 12130',
  lineId: '@dhnotebook',
  lineAddFriendUrl: 'https://line.me/ti/p/~@dhnotebook',
  phone: '02-xxx-xxxx'
};

export const DEFAULT_SOCIAL_HUB = {
  enabled: true,
  facebook: 'https://facebook.com/dhnotebook',
  tiktok: 'https://tiktok.com/@dhnotebook',
  line: 'https://line.me/ti/p/~@dhnotebook',
  youtube: 'https://youtube.com/@dhnotebook',
  instagram: 'https://instagram.com/dhnotebook'
};

export const DEFAULT_TRUST_BADGES = {
  enabled: true,
  badges: [
    { id: 'b2bPartner', label: 'VERIFIED B2B PARTNER', icon: 'ShieldCheck', active: true, description: 'พันธมิตรช่างซ่อมและร้านค้าทั่วประเทศ' },
    { id: 'dbdRegistered', label: 'DBD REGISTERED', icon: 'Award', active: true, description: 'จดทะเบียนพาณิชย์อิเล็กทรอนิกส์ถูกต้อง' },
    { id: 'genuineWarranty', label: 'รับประกันของแท้ 100%', icon: 'CheckCircle2', active: true, description: 'มั่นใจในคุณภาพสินค้าทุกชิ้น' },
    { id: 'expressDelivery', label: 'จัดส่งด่วน 24 ชม.', icon: 'Truck', active: true, description: 'จัดส่งรวดเร็วทั่วไทย ถึงมือทันใจ' }
  ]
};

export const DEFAULT_BUSINESS_HOURS = {
  openHours: '10:00',
  closeHours: '19:30',
  days: 'เปิดบริการทุกวัน (จันทร์ - อาทิตย์)',
  note: 'ศูนย์บริการเซียร์รังสิตเปิดทำการตามเวลาห้างสรรพสินค้า',
  emergencyCare: {
    available: true,
    phone: '081-xxx-xxxx',
    label: 'สายด่วนช่าง 24 ชม.',
    note: 'ปรึกษาปัญหาฮาร์ดแวร์เร่งด่วนนอกเวลาทำการ'
  }
};

export const DEFAULT_MARKETING_USP = {
  enabled: true,
  items: [
    { id: 'm1', title: 'อะไหล่แท้มาตรฐานสากล', subtitle: 'คัดสรรคุณภาพเกรด A+ ทุกชิ้น', icon: 'Sparkles', active: true },
    { id: 'm2', title: 'เครือข่ายช่างครอบคลุม', subtitle: 'บริการส่งด่วนถึงร้านช่างทั่วประเทศ', icon: 'Truck', active: true },
    { id: 'm3', title: 'รับประกันเคลมง่าย', subtitle: 'เปลี่ยนตัวใหม่ทันทีตามเงื่อนไข', icon: 'ShieldCheck', active: true },
    { id: 'm4', title: 'ปรึกษาเทคนิคฟรี', subtitle: 'ทีมวิศวกรผู้เชี่ยวชาญพร้อมดูแล', icon: 'HelpCircle', active: true }
  ]
};

export const DEFAULT_FOOTER_STYLING = {
  theme: 'executive-slate',
  containerBg: 'bg-slate-900',
  cardBg: 'bg-slate-900/90',
  borderColor: 'border-slate-800',
  accentColor: 'cyber-blue'
};

export const CANONICAL_QUICK_LINKS = [
  { id: 'q1', label: 'อะไหล่ภายใน', url: '/categories/inside' },
  { id: 'q2', label: 'อุปกรณ์ภายนอก', url: '/categories/outside' },
  { id: 'q3', label: 'เครื่องมือช่าง', url: '/categories/tools' },
  { id: 'q4', label: 'โปรโมชั่นพาร์ทเนอร์', url: '/promotions' }
];

export const CANONICAL_SUPPORT_LINKS = [
  { id: 's1', label: 'คู่มือการใช้งานระบบ', url: '/help/manual' },
  { id: 's2', label: 'เงื่อนไขการรับประกัน (Claim)', url: '/help/warranty' },
  { id: 's3', label: 'สมัครตัวแทนจำหน่าย', url: '/register/partner' },
  { id: 's4', label: 'ติดตามสถานะคำสั่งซื้อ', url: '/tracking' }
];

export const CANONICAL_DEFAULT_FOOTER_CONFIG = {
  colors: { ...DEFAULT_FOOTER_COLORS },
  company: { ...DEFAULT_FOOTER_COMPANY },
  socialHub: { ...DEFAULT_SOCIAL_HUB },
  trustBadges: { ...DEFAULT_TRUST_BADGES },
  businessHours: { ...DEFAULT_BUSINESS_HOURS },
  marketingUsp: { ...DEFAULT_MARKETING_USP },
  styling: { ...DEFAULT_FOOTER_STYLING },
  quickLinks: [...CANONICAL_QUICK_LINKS],
  supportLinks: [...CANONICAL_SUPPORT_LINKS]
};

export const DEFAULT_FOOTER_CONFIG = {
  colors: { ...DEFAULT_FOOTER_COLORS },
  company: { ...DEFAULT_FOOTER_COMPANY },
  socialHub: {
    enabled: true,
    facebook: '',
    tiktok: '',
    line: '',
    youtube: '',
    instagram: ''
  },
  trustBadges: {
    enabled: true,
    badges: []
  },
  businessHours: { ...DEFAULT_BUSINESS_HOURS },
  marketingUsp: {
    enabled: true,
    items: []
  },
  styling: { ...DEFAULT_FOOTER_STYLING },
  quickLinks: [],
  supportLinks: []
};

// ============================================================================
// SUB-SCHEMAS WITH PASSTHROUGH & SAFE VALIDATIONS
// ============================================================================

const safeUrlSchema = z.string().refine(val => !val || isSafeUrl(val), {
  message: 'Invalid or unsafe URL scheme. Must be an internal path (e.g. /categories) or safe protocol (https://, http://, tel:)'
});

const makeSocialUrlSchema = (platform) => z.string().refine(val => validateSocialUrl(platform, val), {
  message: `Invalid or unsafe ${platform} URL. Must be a legitimate ${platform} domain and valid protocol.`
});

export const FooterColorsSchema = z.object({
  bgDark: z.string().default('slate-900'),
  textMuted: z.string().default('slate-400'),
  primaryAccent: z.string().default('cyber-blue')
}).passthrough().default(() => ({ ...DEFAULT_FOOTER_COLORS }));

export const FooterCompanySchema = z.object({
  logoUrl: safeUrlSchema.default('/logo.png'),
  description: z.string().default(DEFAULT_FOOTER_COMPANY.description),
  address: z.string().default(DEFAULT_FOOTER_COMPANY.address),
  lineId: z.string().default('@dhnotebook'),
  lineAddFriendUrl: safeUrlSchema.refine(val => !val || validateSocialUrl('line', val), {
    message: 'Invalid or unsafe Line add friend URL'
  }).default(DEFAULT_FOOTER_COMPANY.lineAddFriendUrl),
  phone: z.string().default('02-xxx-xxxx')
}).passthrough().default(() => ({ ...DEFAULT_FOOTER_COMPANY }));

export const FooterLinkItemSchema = z.object({
  id: z.string().default(() => Date.now().toString()),
  label: z.string().default('เมนูใหม่'),
  url: safeUrlSchema.default('#')
}).passthrough();

export const FooterSocialHubSchema = z.object({
  enabled: z.boolean().default(true),
  facebook: makeSocialUrlSchema('facebook').default(''),
  tiktok: makeSocialUrlSchema('tiktok').default(''),
  line: makeSocialUrlSchema('line').default(''),
  youtube: makeSocialUrlSchema('youtube').default(''),
  instagram: makeSocialUrlSchema('instagram').default('')
}).passthrough().default(() => ({
  enabled: true,
  facebook: '',
  tiktok: '',
  line: '',
  youtube: '',
  instagram: ''
}));

export const TrustBadgeItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string().default('ShieldCheck'),
  active: z.boolean().default(true),
  description: z.string().default('')
}).passthrough();

export const FooterTrustBadgesSchema = z.object({
  enabled: z.boolean().default(true),
  badges: z.array(TrustBadgeItemSchema).default([])
}).passthrough().default(() => ({
  enabled: true,
  badges: []
}));

export const EmergencyCareSchema = z.object({
  available: z.boolean().default(true),
  phone: z.string().default(''),
  label: z.string().default('สายด่วนช่าง 24 ชม.'),
  note: z.string().default('')
}).passthrough().default(() => ({
  available: true,
  phone: '',
  label: 'สายด่วนช่าง 24 ชม.',
  note: ''
}));

export const FooterBusinessHoursSchema = z.object({
  openHours: z.string().default('10:00'),
  closeHours: z.string().default('19:30'),
  days: z.string().default('เปิดบริการทุกวัน (จันทร์ - อาทิตย์)'),
  note: z.string().default(''),
  emergencyCare: EmergencyCareSchema.default(() => ({
    available: true,
    phone: '',
    label: 'สายด่วนช่าง 24 ชม.',
    note: ''
  }))
}).passthrough().default(() => ({
  openHours: '10:00',
  closeHours: '19:30',
  days: 'เปิดบริการทุกวัน (จันทร์ - อาทิตย์)',
  note: '',
  emergencyCare: {
    available: true,
    phone: '',
    label: 'สายด่วนช่าง 24 ชม.',
    note: ''
  }
}));

export const MarketingUspItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().default(''),
  icon: z.string().default('Sparkles'),
  active: z.boolean().default(true)
}).passthrough();

export const FooterMarketingUspSchema = z.object({
  enabled: z.boolean().default(true),
  items: z.array(MarketingUspItemSchema).default([])
}).passthrough().default(() => ({
  enabled: true,
  items: []
}));

export const FooterStylingSchema = z.object({
  theme: z.string().default('executive-slate'),
  containerBg: z.string().default('bg-slate-900'),
  cardBg: z.string().default('bg-slate-900/90'),
  borderColor: z.string().default('border-slate-800'),
  accentColor: z.string().default('cyber-blue')
}).passthrough().default(() => ({ ...DEFAULT_FOOTER_STYLING }));

// ============================================================================
// ROOT MASTER SCHEMA
// ============================================================================

export const FooterConfigSchema = z.object({
  colors: FooterColorsSchema.default(() => ({ ...DEFAULT_FOOTER_COLORS })),
  company: FooterCompanySchema.default(() => ({ ...DEFAULT_FOOTER_COMPANY })),
  quickLinks: z.array(FooterLinkItemSchema).default([]),
  supportLinks: z.array(FooterLinkItemSchema).default([]),
  socialHub: FooterSocialHubSchema.default(() => ({
    enabled: true,
    facebook: '',
    tiktok: '',
    line: '',
    youtube: '',
    instagram: ''
  })),
  trustBadges: FooterTrustBadgesSchema.default(() => ({
    enabled: true,
    badges: []
  })),
  businessHours: FooterBusinessHoursSchema.default(() => ({
    openHours: '10:00',
    closeHours: '19:30',
    days: 'เปิดบริการทุกวัน (จันทร์ - อาทิตย์)',
    note: '',
    emergencyCare: {
      available: true,
      phone: '',
      label: 'สายด่วนช่าง 24 ชม.',
      note: ''
    }
  })),
  marketingUsp: FooterMarketingUspSchema.default(() => ({
    enabled: true,
    items: []
  })),
  styling: FooterStylingSchema.default(() => ({ ...DEFAULT_FOOTER_STYLING })),
  updatedAt: z.any().optional(),
  updatedBy: z.string().optional()
}).passthrough();

export default FooterConfigSchema;
