# Test Infrastructure Specification: Storefront Retro/Classic Redesign (dh-frontend)

**Project**: DH Notebook Storefront UI/UX Retro/Classic Redesign  
**Scope**: `Management System/dh-frontend` (`http://localhost:8988/`)  
**Document**: `Management System/tests/docs/TEST_INFRA.md`  
**Test Hub**: `Management System/tests/`  
**Author**: E2E Test Writer  
**Status**: ACTIVE  

---

## 1. Executive Summary & Test Mission

The purpose of this test infrastructure is to provide a rigorous, automated, and requirement-driven testing harness for the **Storefront UI/UX Retro/Classic Redesign** on DH Notebook (`dh-frontend`).

The redesign transitions the customer-facing storefront from generic, modern AI bubble/pill styling (excessive border radiuses of 16px–24px, pure white washed-out surfaces, and pill buttons) into a refined, human-crafted retro/classic professional aesthetic characterized by:
- **Calibrated Border Radius**: 0.3rem – 0.5rem (4px – 8px / Tailwind `rounded-sm` to `rounded-md`), strictly reserving `rounded-full` for legitimate circular avatars, status dots, spinner rings, and toggle thumbs.
- **Anti-Whiteout Tactile Depth**: Replacing washed-out `border-gray-100` and `border-slate-100` on white surfaces with crisp `border-slate-200` (cards) and `border-slate-300` (inputs/borders), backed by a `slate-50` body canvas.
- **Zero Build Regressions**: 100% Vite build compilation with zero syntax or style breakage.

---

## 2. Testing Methodology: Systematic 4-Tier Matrix

The test infrastructure enforces a comprehensive 4-Tier verification hierarchy. Every test case is derived directly from the authoritative specifications in `ORIGINAL_REQUEST.md` and `PROJECT.md`.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      4-TIER TEST ARCHITECTURE                          │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 1: Feature Coverage                                               │
│   • Global CSS Token Clamping (--radius-*)                             │
│   • Deduplication & Base Canvas Calibration                            │
│   • Component-Level Border Radius Limits (<= 0.5rem / 8px)             │
│   • Anti-Whiteout Contrast Boundaries (slate-200/300)                  │
│   • Vite Production Build Integrity                                    │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 2: Boundary & Corner Cases                                        │
│   • Legitimate Circular Element Protection (100% rounded-full)         │
│   • Dual-Theme Toggle Parity (Trusted Partner & Tech Professional)     │
│   • Null / Missing Props & Edge Resiliency                             │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 3: Cross-Feature Interactions                                     │
│   • Funnel Continuity (Navbar -> Product -> Detail -> Cart -> Checkout)│
│   • Mobile Sticky Clearance Coordination                               │
│   • Tactile Depth & Interactive State Transitions                      │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 4: Real-World Scenarios                                           │
│   • Full Customer Journey Desktop (1280px) & Mobile (375px)            │
│   • Viewport Overflow & Scrollbar Leak Guard                           │
│   • Touch Target Ergonomics & Accessibility Sizing                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tier-by-Tier Specification & Assertion Contracts

### Tier 1: Feature Coverage (Core Design & Token System)

| Test ID | Target Scope | Specification Contract | Verification Target |
|---------|--------------|------------------------|---------------------|
| `T1-CSS-01` | `src/index.css` | Deduplication: Exactly ONE `@theme` block and ONE `@layer base` fallback block. | Count of `@theme` == 1, `@layer base` fallback == 1 |
| `T1-CSS-02` | `src/index.css` | Radius Clamping: `--radius-md` remapped to `0.375rem` (6px); `--radius-lg`, `--radius-xl`, `--radius-2xl`, `--radius-3xl`, `--radius-4xl` clamped to `<= 0.5rem` (8px). | Regex AST match on `@theme { ... --radius-* ... }` |
| `T1-CSS-03` | `src/index.css` | Anti-Whiteout Canvas: `body` background set to `slate-50` (`#f8fafc`). | `body` style declaration in `@layer base` |
| `T1-CSS-04` | `src/index.css` | Base Border Elevation: fallback `border-color` elevated to `var(--color-slate-200)` or `#e2e8f0` (replaces `gray-200`). | `border-color: var(--color-slate-200...)` in `@layer base` |
| `T1-CSS-05` | `src/index.css` | Card Utility: `@utility card-premium` upgraded to `border-slate-200` (`#e2e8f0`), eliminating `#f3f4f6`. | `@utility card-premium` border declaration |
| `T1-CMP-01` | Card Containers | Primary card containers in Home, Products, Categories, Cart, Profile clamp to `rounded-md` / `rounded-sm`. | Exclusion of `rounded-2xl` / `rounded-3xl` on container wrappers |
| `T1-CMP-02` | Rectangular Controls | Search input, search buttons, filter chips, cart buttons refactored from `rounded-full` to `rounded-md`. | Search inputs in `Navbar.jsx`, `FeaturedSpares.jsx`, `SearchPage.jsx` |
| `T1-CMP-03` | `ProductPricingSection` | CTA curvature rebalanced from `rounded-xs` (2px) to `rounded-md` (6px); marketplace buttons clamped from `rounded-xl` to `rounded-md`. | Line 170, 198, 222, 238, 255, 270 in `ProductPricingSection.jsx` |
| `T1-CMP-04` | Contrast Boundaries | Elimination of washed-out `border-gray-100` and `border-slate-100` on white surfaces across primary card components. | No `border-gray-100` or `border-slate-100` on white cards |
| `T1-BLD-01` | Tooling & Build | `cmd /c "npm run build"` in `Management System/dh-frontend` completes with code 0 and zero errors. | Vite build execution check |

### Tier 2: Boundary & Corner Cases

| Test ID | Target Scope | Specification Contract | Verification Target |
|---------|--------------|------------------------|---------------------|
| `T2-CIR-01` | Status Dots | Pulse indicators in `ProductCard`, `PartnerCard`, `ProductAdCard`, `FloatingMessenger` preserve `rounded-full`. | Unmutilated `rounded-full` on dot elements (`w-1.5`, `w-2`) |
| `T2-CIR-02` | Avatars & Badges | Circular avatars and count badges in `Navbar`, `ProfileSidebar`, `ProductCommunitySection` preserve `rounded-full`. | Avatar containers preserve `rounded-full` |
| `T2-CIR-03` | Spinners & Loaders | Loading indicator rings in `CartSummaryPanel`, `ProductPricingSection`, `TopLoadingBar` preserve `rounded-full`. | Spinner elements maintain `rounded-full` / circular animation |
| `T2-CIR-04` | Switch Thumbs | Toggle switch thumbs in `CreditToggleBox`, `TaxInvoiceForm`, `CookieConsentBanner` preserve `rounded-full`. | Toggle thumbs preserve `rounded-full` |
| `T2-THM-01` | Theme Palettes | `theme-trusted-partner` and `theme-tech-professional` color palettes declared with valid hex and contrast. | `--color-brand`, `--color-brand-dark`, `--color-brand-accent` |
| `T2-THM-02` | Dark Header Contrast | Dark header in `Navbar.jsx` maintains solid readability (`bg-brand-dark border-b border-white/10`) across both themes. | Navbar header background and border contrast check |
| `T2-NUL-01` | Missing Props Resilience | Card and banner components handle null images, missing titles, undefined prices gracefully without style failure. | Component contract assertions |

### Tier 3: Cross-Feature Interactions

| Test ID | Target Scope | Specification Contract | Verification Target |
|---------|--------------|------------------------|---------------------|
| `T3-FLO-01` | Funnel Continuity | Navbar -> ProductCard -> ProductDetail -> CartItemCard -> CheckoutSummary maintain continuous retro radius rhythm (<= 8px). | End-to-end radius consistency along funnel |
| `T3-FLO-02` | Surface Continuity | All funnel step surfaces maintain tactile separation (`border-slate-200` / `border-slate-300`), eliminating whiteout dips. | Surface border consistency along funnel |
| `T3-CLR-01` | Mobile Sticky Clearances | `BottomNav` (`h-[60px]`), `ProductDetail` bottom bar (`bottom-[60px]`), and `FloatingMessenger` (`bottom-[85px]`/`[135px]`) maintain non-overlapping z-index and clearance. | Height and bottom offset class coordination |

### Tier 4: Real-World Scenarios

| Test ID | Target Scope | Specification Contract | Verification Target |
|---------|--------------|------------------------|---------------------|
| `T4-RES-01` | Desktop Layout | Container max-widths (`max-w-7xl mx-auto`), desktop gutters (`px-4 sm:px-6 lg:px-8`), grid breakpoints remain intact. | `MainLayout.jsx` and page grids |
| `T4-RES-02` | Mobile Navigation | `BottomNav.jsx` visible on mobile (`lg:hidden`) and hidden on desktop; zero horizontal viewport overflow (`overflow-x-hidden`). | Mobile navigation layout constraints |
| `T4-ACC-01` | Touch Targets | Interactive buttons and search bars maintain minimum height of 40px (`py-2.5` / `h-10`) for ergonomic touch targets. | Sizing checks on interactive controls |

---

## 4. Test Hub Structure & Artifact Locations

Following the project's strict **Centralized Test Management** rule:
- All test suites reside in `Management System/tests/`.
- No test files in repository root or `scripts/`.
- No `.bak` files.

```
Management System/tests/
├── docs/
│   ├── TEST_INFRA.md          # This architecture specification document
│   └── TEST_READY.md          # Test suite readiness certification & execution logs
├── verifications/
│   └── verify_storefront_retro_design.mjs   # Automated 4-tier verification test suite
└── e2e/
    └── e2e_storefront_retro_journey.mjs     # End-to-end customer journey & layout suite
```

---

## 5. Execution Commands & Test Runner Usage

### Command 1: Run 4-Tier Verification Suite
```powershell
cd "c:\_DH Notebook\Management System"
node tests/verifications/verify_storefront_retro_design.mjs
```
*Optional Flags*:
- `--mode=baseline`: Outputs complete audit status without failing process exit code (used for baseline benchmarking).
- `--mode=strict`: Fails with exit code 1 if any test fails (used for gatekeeping milestone completion).

### Command 2: Run End-to-End Storefront Journey Suite
```powershell
cd "c:\_DH Notebook\Management System"
node tests/e2e/e2e_storefront_retro_journey.mjs
```

### Command 3: Full Storefront Test Suite & Build Verification
```powershell
cd "c:\_DH Notebook\Management System"
node tests/verifications/verify_storefront_retro_design.mjs --mode=baseline
node tests/e2e/e2e_storefront_retro_journey.mjs --mode=baseline
cd dh-frontend
cmd /c "npm run build"
```

---

## 6. Defect Taxonomy & Escalation Protocol

When tests fail during milestone development:
1. **CSS Token Defect (Tier 1)**: Escalate to Milestone 1 Worker (`src/index.css`).
2. **Layout & Navigation Defect (Tier 1/2/3)**: Escalate to Milestone 2 Worker (`Navbar.jsx`, `MainLayout.jsx`, `BottomNav.jsx`, `FloatingMessenger.jsx`).
3. **Product & Catalog Card Defect (Tier 1/2/3)**: Escalate to Milestone 3 Worker (`ProductCard.jsx`, `PartnerCard.jsx`, `ProductPricingSection.jsx`, `Categories/`).
4. **Cart, Checkout & Profile Defect (Tier 1/2/3)**: Escalate to Milestone 4 Worker (`cart/`, `checkout/`, `profile/`, `AuthForm.jsx`).
5. **Legitimate Circular Exception Breakage (Tier 2)**: Priority 1 Regression — escalate immediately to the modifying agent to restore `rounded-full`.
