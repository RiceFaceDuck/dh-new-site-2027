# Tier 3: Configuration & UI Schemas (ระดับตั้งค่าและการแสดงผล)

ไฟล์นี้รวบรวม Database Schema ที่เกี่ยวข้องกับการตั้งค่าระบบ (Settings), โปรโมชัน/การตลาด, และการควบคุม UI ของ Storefront หากข้อมูลส่วนนี้มีปัญหา มักจะกระทบแค่หน้าตาเว็บ (UI) หรือสิทธิพิเศษของลูกค้า ซึ่งสามารถแก้ไขกลับคืนได้ง่ายโดยไม่กระทบต่อฐานข้อมูลหลัก

## Table of Contents
- [1. Collection: `homepage_categories`](#1-collection-homepage_categories)
- [2. Document: `settings/product_categories`](#2-document-settingsproduct_categories)
- [3. Collection: `freebies`](#3-collection-freebies)
- [4. Collection: `promotions`](#4-collection-promotions)
- [5. Collection: `shipping_rules`](#5-collection-shipping_rules)
- [6. Documents: UI & Settings Configurations](#6-documents-ui--settings-configurations)
  - [`settings/manager_menus`](#settingsmanager_menus)
  - [`settings/footer_config`](#settingsfooter_config)
  - [`settings/featured_config`](#settingsfeatured_config)
  - [`settings/knowledge_config`](#settingsknowledge_config)
  - [`settings/hero_config`](#settingshero_config)
  - [`settings/squadConfig`](#settingssquadconfig)
  - [`settings/privacy_cookies_config`](#settingsprivacy_cookies_config)
  - [`settings/inventory`](#settingsinventory)
  - [`settings/marketing_ads`](#settingsmarketing_ads)
  - [`settings/platform_regex`](#settingsplatform_regex)
  - [`system_config/storefrontTheme`](#system_configstorefronttheme)
- [7. Third-party Integrations](#7-third-party-integrations)

---

## 1. Collection: `homepage_categories`
**Firestore Path:** `/homepage_categories/{categoryId}`
**Role:** Manages the display of categories on the Storefront. Managers can customize the layout, UI shape, and connection to backend product types.

### Schema Fields
| Field Name       | Type    | Description                                                                 | Example Value                       | Foreign Key / Ref |
|------------------|---------|-----------------------------------------------------------------------------|-------------------------------------|-------------------|
| `name`           | String  | The display name of the category shown to customers.                        | `"อุปกรณ์ภายใน (Inside)"`           | |
| `type`           | String  | The exact category type matching inventory products.                        | `"case"`                            | Ref: `products.category` |
| `buttonShape`    | String  | Visual style of the category button (`circle`, `rounded`, `square`).        | `"circle"`                          | |
| `imageUrl`       | String  | The URL of the uploaded category icon/image (Google Drive).                 | `"https://drive.google.com/..."`    | |
| `isActive`       | Boolean | Toggle for whether to show on Storefront.                                   | `true`                              | |
| `status`         | String  | String representation of status.                                            | `"active"`, `"inactive"`            | |
| `order`          | Number  | The display order sequence (drag and drop).                                 | `1`                                 | |

### TypeScript Interface
```typescript
export interface HomepageCategory {
  id?: string;
  name: string;
  type: string;
  buttonShape: "circle" | "rounded" | "square";
  imageUrl: string;
  isActive: boolean;
  status: "active" | "inactive";
  order: number;
}
```

---

## 2. Document: `settings/product_categories`
**Firestore Path:** `/settings/product_categories`
**Role:** An aggregated cache of all unique product categories that exist in the inventory. Optimizes reads for dropdown options.

### Schema Fields
| Field Name       | Type    | Description                                                                 | Example Value                       | Foreign Key / Ref |
|------------------|---------|-----------------------------------------------------------------------------|-------------------------------------|-------------------|
| `categories`     | Array   | List of unique category string names. Maintained via `arrayUnion`.          | `["case", "monitor", "ram"]`        | |

### TypeScript Interface
```typescript
export interface ProductCategoriesSettings {
  categories: string[];
}
```

---

## 3. Collection: `freebies`
**Firestore Path:** `/freebies/{freebieId}`
**Role:** Manages marketing incentives (free items).

### Schema Fields
| Field Name       | Type    | Description                                                                 | Example Value                       | Foreign Key / Ref |
|------------------|---------|-----------------------------------------------------------------------------|-------------------------------------|-------------------|
| `title`          | String  | The display name of the freebie campaign.                                   | `"แจกสายชาร์จฟรี"`                  | |
| `itemName`       | String  | The actual name of the item being given away.                               | `"สายชาร์จ Type-C"`                 | |
| `minSpend`       | Number  | The minimum subtotal required to unlock this freebie.                       | `5000`                              | |
| `qty`            | Number  | The quantity given per eligible threshold.                                  | `1`                                 | |
| `maxPerBill`     | Number  | The maximum quantity a customer can get per bill.                           | `3`                                 | |
| `startDate`      | String  | Optional start date for the campaign (ISO string).                          | `"2026-06-19T00:00:00Z"`            | |
| `endDate`        | String  | Optional end date for the campaign (ISO string).                            | `"2026-06-30T23:59:59Z"`            | |
| `customerType`   | String  | Target audience restriction (`ALL`, `RETAIL`, `VIP`, `WHOLESALE`).          | `"ALL"`                             | Ref: `users.role` (Logical) |
| `applicableSkus` | Array   | List of SKUs this campaign is restricted to. Empty means all products.      | `["CASE-01", "RAM-02"]`             | Ref: `products.sku` |
| `quotaLimit`     | Number  | Maximum number of times this freebie can be claimed overall.                | `100`                               | |
| `quotaUsed`      | Number  | Current number of times claimed.                                            | `15`                                | |
| `isActive`       | Boolean | Toggle for whether this freebie is currently active.                        | `true`                              | |
| `imageUrl`       | String  | (Optional) The URL of the uploaded freebie icon/image.                      | `"https://drive.google.com/..."`    | |

### TypeScript Interface
```typescript
export interface Freebie {
  id?: string;
  title: string;
  itemName: string;
  minSpend: number;
  qty: number;
  maxPerBill: number;
  startDate?: string;
  endDate?: string;
  customerType: "ALL" | "RETAIL" | "VIP" | "WHOLESALE";
  applicableSkus: string[];
  quotaLimit: number;
  quotaUsed: number;
  isActive: boolean;
  imageUrl?: string;
}
```

---

## 4. Collection: `promotions`
**Firestore Path:** `/promotions/{promoId}`
**Role:** Manages marketing discounts and promo codes.

### Schema Fields
| Field Name       | Type    | Description                                                                 | Example Value                       | Foreign Key / Ref |
|------------------|---------|-----------------------------------------------------------------------------|-------------------------------------|-------------------|
| `title`          | String  | The display name of the promotion.                                          | `"ลด 10% ฉลองเปิดร้าน"`             | |
| `code`           | String  | The optional promo code for manual override (Legacy).                       | `"OPEN10"`                          | |
| `type`           | String  | Type of discount.                                                           | `"PERCENTAGE"`, `"FIXED"`           | |
| `value`          | Number  | The discount value.                                                         | `10`                                | |
| `maxDiscount`    | Number  | The maximum discount amount allowed (used with PERCENTAGE).                 | `1000`                              | |
| `minSpend`       | Number  | The minimum subtotal required to unlock this promotion.                     | `10000`                             | |
| `startDate`      | String  | Optional start date for the campaign (ISO string).                          | `"2026-06-19T00:00:00Z"`            | |
| `endDate`        | String  | Optional end date for the campaign (ISO string).                            | `"2026-06-30T23:59:59Z"`            | |
| `customerType`   | String  | Target audience restriction.                                                | `"ALL"`                             | Ref: `users.role` |
| `applicableSkus` | Array   | List of SKUs this campaign is restricted to. Empty means all products.      | `["CASE-01"]`                       | Ref: `products.sku` |
| `quotaLimit`     | Number  | Maximum number of times this promo can be used overall.                     | `50`                                | |
| `quotaUsed`      | Number  | Current number of times used.                                               | `5`                                 | |
| `isActive`       | Boolean | Toggle for whether this promotion is currently active.                      | `true`                              | |

### TypeScript Interface
```typescript
export interface Promotion {
  id?: string;
  title: string;
  code?: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  maxDiscount?: number;
  minSpend: number;
  startDate?: string;
  endDate?: string;
  customerType: "ALL" | "RETAIL" | "VIP" | "WHOLESALE";
  applicableSkus: string[];
  quotaLimit: number;
  quotaUsed: number;
  isActive: boolean;
}
```

---

## 5. Collection: `shipping_rules`
**Firestore Path:** `/shipping_rules/{ruleId}`
**Role:** Manages dynamic shipping cost calculation rules based on company, product type, and quantity.

### Schema Fields
| Field Name       | Type    | Description                                                                 | Example Value                       | Foreign Key / Ref |
|------------------|---------|-----------------------------------------------------------------------------|-------------------------------------|-------------------|
| `company`        | String  | Shipping provider name.                                                     | `"Kerry Express"`                   | |
| `productType`    | String  | Product category to apply to (or 'All').                                    | `"All"`                             | |
| `minQty`         | Number  | Minimum items in cart to trigger rule.                                      | `1`                                 | |
| `maxQty`         | Number  | Maximum items in cart for this rule.                                        | `5`                                 | |
| `shippingFee`    | Number  | Flat fee applied when conditions are met.                                   | `50`                                | |
| `isActive`       | Boolean | Toggle to enable/disable the rule.                                          | `true`                              | |
| `updatedAt`      | Date    | Server timestamp of last update.                                            | `Timestamp`                         | |

### TypeScript Interface
```typescript
export interface ShippingRule {
  id?: string;
  company: string;
  productType: string;
  minQty: number;
  maxQty: number;
  shippingFee: number;
  isActive: boolean;
  updatedAt: any;
}
```

---

## 6. Documents: UI & Settings Configurations

### `settings/manager_menus`
Stores the layout configuration (Drag & Drop grouping) for Quick Access Tools in Manager Dashboard.
```typescript
export interface ManagerMenusConfig {
  zones: {
    id: string;
    title: string;
    menuIds: string[];
  }[];
}
```

### `settings/footer_config`
Dynamic layout for Storefront Footer.
```typescript
export interface FooterConfig {
  colors: { bgDark: string; primaryAccent: string; };
  company: { logoUrl: string; description: string; address: string; lineId: string; phone: string; lineAddFriendUrl: string; };
  quickLinks: { id: string; label: string; url: string; }[];
  supportLinks: { id: string; label: string; url: string; }[];
}
```

### `settings/featured_config`
Config for the "Featured Spares" section.
```typescript
export interface FeaturedConfig {
  isActive: boolean;
  displayLimit: number;
}
```

### `settings/knowledge_config`
Config for "Add Knowledge" rewards.
```typescript
export interface KnowledgeConfig {
  compatibleCreditReward: number; // e.g. 2
}
```

### `settings/hero_config`
Config for main Hero Billboard.
```typescript
export interface HeroConfig {
  isActive: boolean;
  title: string; // Supports basic HTML e.g. <br />
  imageUrl: string;
  primaryButton: { label: string; link: string; isActive: boolean; };
  secondaryButton: { label: string; link: string; isActive: boolean; };
}
```

### `settings/squadConfig`
Config for "Squad Highlight" section.
```typescript
export interface SquadConfig {
  isActive: boolean;
  displayLimit: number;
}
```

### `settings/privacy_cookies_config`
PDPA Cookie Consent Banner.
```typescript
import { Timestamp } from "firebase/firestore";

export interface PrivacyCookiesConfig {
  logoUrl: string;
  bannerText: string;
  policyLinks: { privacyPolicyUrl: string; cookiePolicyUrl: string; };
  cookieTypes: { id: string; [key: string]: any }[];
  updatedAt: Timestamp;
}
```

### `settings/inventory`
Global buffer stock configuration.
```typescript
export interface InventoryConfig {
  defaultBufferStock: number; // e.g., 2
}
```

### `settings/marketing_ads`
Credit deduction rates for ads.
```typescript
export interface AdsConfig {
  costPerView: number; // e.g., 1
  costPerClick: number; // e.g., 5
  displayRatio: number; // e.g., 10 (1 ad per 10 items)
}
```

### `settings/platform_regex`
Regex validation rules for external platform links.
```typescript
export interface PlatformRegexConfig {
  shopee: string;
  lazada: string;
  tiktok: string;
  facebook: string;
}
```

### `system_config/storefrontTheme`
Global frontend theme settings.
```typescript
export interface StorefrontTheme {
  themeId: string; // e.g. "theme-trusted-partner"
  backgroundUrl: string;
  blurLevel: string;
  opacityTop: number;
  opacityMid: number;
  opacityBottom: number;
}
```

---

## 7. Third-party Integrations

### Email System (Gmail Proxy)
- **Document**: `system_config/gmail_auth`
- Contains `refresh_token` and `client_secret`. Client caches `web_app_url` to avoid reads.
- **Emails are not stored in Firestore.** Fetched dynamically via Cloud Functions.

### Google Calendar Integration
- Operates entirely via GAS (`fetchFromGAS`).
- 0 data stored in Firestore. Uses `history_logs` to record audit trail.

### Big Seller Export Integration
- **Zero-Quota Export**: Flushes pending changes, then fetches data directly from Google Sheets (`fetchBackupInventory()`) via GAS.
- Consumes **0 Firebase Reads**. Tracks history via `history_logs`.
