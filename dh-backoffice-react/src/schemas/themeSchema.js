import { z } from 'zod';

/**
 * Zod Schema for Storefront Theme Configuration (settings/storefrontTheme & settings/storefront_config.theme)
 */
export const StorefrontThemeSchema = z.object({
  themeId: z.enum(['theme-trusted-partner', 'theme-tech-professional']).default('theme-trusted-partner'),
  backgroundUrl: z.string().default('/user-bg.jpg'),
  blurLevel: z.string().default('16'),
  opacityTop: z.number().min(0).max(100).default(75),
  opacityMid: z.number().min(0).max(100).default(55),
  opacityBottom: z.number().min(0).max(100).default(35),
  updatedAt: z.any().optional()
});

/**
 * Zod Schema for Individual Segment in Hero Title
 */
export const HeroTitleSegmentSchema = z.object({
  text: z.string().default(''),
  color: z.string().default(''),
  isHighlight: z.boolean().default(false),
  isBold: z.boolean().default(false),
  isItalic: z.boolean().default(false),
  isUnderline: z.boolean().default(false),
  isStrikethrough: z.boolean().default(false),
  breakDesktop: z.boolean().default(false),
  breakAll: z.boolean().default(false)
});

/**
 * Zod Schema for Call-to-Action Buttons on Hero Billboard
 */
export const HeroButtonSchema = z.object({
  label: z.string().default(''),
  link: z.string().default(''),
  isActive: z.boolean().default(true),
  variant: z.enum(['solid', 'outline']).default('solid')
});

/**
 * Zod Schema for Hero Gradient Overlay
 */
export const HeroOverlaySchema = z.object({
  enabled: z.boolean().default(true),
  color: z.string().default('#1f2937'),
  opacity: z.number().min(0).max(100).default(90),
  direction: z.enum(['to-r', 'to-t', 'full']).default('to-r')
});

/**
 * Zod Schema for Individual Banner Item in Hero Billboard Carousel
 */
export const HeroBannerItemSchema = z.object({
  id: z.string().default(() => `banner_${Date.now()}`),
  title: z.string().default(''),
  titleSegments: z.array(HeroTitleSegmentSchema).default([]),
  badge: z.object({
    text: z.string().default(''),
    isActive: z.boolean().default(false),
    color: z.string().default('#facc15')
  }).default({ text: '', isActive: false, color: '#facc15' }),
  subtitle: z.object({
    text: z.string().default(''),
    isActive: z.boolean().default(false)
  }).default({ text: '', isActive: false }),
  imageUrl: z.string().default('https://images.unsplash.com/photo-1591405351990-4726e331f14c?w=1200&q=80'),
  imageLayout: z.enum(['split', 'full', 'contain']).default('full'),
  imageFit: z.enum(['contain', 'cover']).default('contain'), // 'contain' = เห็นครบทั้งภาพ, 'cover' = เต็มกล่อง
  textAlignment: z.enum(['left', 'center']).default('left'),
  isActive: z.boolean().default(true),
  order: z.number().default(1),
  primaryButton: HeroButtonSchema.default({
    label: 'BOOK A SQUAD',
    link: '/squad',
    isActive: true,
    variant: 'solid'
  }),
  secondaryButton: HeroButtonSchema.default({
    label: 'SHOP SPARES',
    link: '/categories',
    isActive: true,
    variant: 'solid'
  }),
  overlay: HeroOverlaySchema.default({
    enabled: true,
    color: '#1f2937',
    opacity: 90,
    direction: 'to-r'
  })
});

/**
 * Zod Schema for Complete Hero Billboard Configuration (settings/hero_config)
 */
export const HeroConfigSchema = z.object({
  isActive: z.boolean().default(true),
  aspectRatio: z.enum(['16:9', '3:1', '21:9', 'auto']).default('16:9'),
  autoplay: z.boolean().default(true),
  autoplaySpeed: z.number().min(1000).max(30000).default(5000),
  transitionEffect: z.enum(['slide', 'fade']).default('slide'),
  banners: z.array(HeroBannerItemSchema).default([]),
  // Legacy / fallback fields for single-banner compatibility
  title: z.string().default(''),
  titleSegments: z.array(HeroTitleSegmentSchema).default([]),
  badge: z.object({
    text: z.string().default(''),
    isActive: z.boolean().default(false),
    color: z.string().default('#facc15')
  }).default({ text: '', isActive: false, color: '#facc15' }),
  subtitle: z.object({
    text: z.string().default(''),
    isActive: z.boolean().default(false)
  }).default({ text: '', isActive: false }),
  imageUrl: z.string().default('https://images.unsplash.com/photo-1591405351990-4726e331f14c?w=1200&q=80'),
  imageLayout: z.enum(['split', 'full', 'contain']).default('split'),
  imageFit: z.enum(['contain', 'cover']).default('contain'),
  bannerHeight: z.enum(['compact', 'standard', 'tall', 'large']).default('standard'),
  textAlignment: z.enum(['left', 'center']).default('left'),
  primaryButton: HeroButtonSchema.default({
    label: 'BOOK A SQUAD',
    link: '/squad',
    isActive: true,
    variant: 'solid'
  }),
  secondaryButton: HeroButtonSchema.default({
    label: 'SHOP SPARES',
    link: '/categories',
    isActive: true,
    variant: 'solid'
  }),
  overlay: HeroOverlaySchema.default({
    enabled: true,
    color: '#1f2937',
    opacity: 90,
    direction: 'to-r'
  }),
  updatedAt: z.any().optional()
});
