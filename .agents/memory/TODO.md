# 📌 DH Notebook: Project Roadmap & Tasks

This board tracks ongoing tasks and future features, providing a high-level overview of the current sprint and the backlog.

## 🏃 Current Sprint (In Progress)
- [x] **POS Billing Smart Quick Add Customer** — Yellow button "+ เพิ่มลูกค้าใหม่" with 2-step Smart Quick Paste text parser, role selection, and web account point binding.
- [x] Crystallize and document the Claims & Warranty Concept into `docs/claims_concept.md`
- [x] Discuss claims concepts (product replacement, S/N validation, warranty period) to prepare for the next development phase
- [x] Execute Stability Audit, fix Auth Block, and perform Firebase Clean Code (Stability Audit, Auth Bypass & Firebase Clean Code)
- [x] **Execute Frontend UX & Speed Audit** — Upgrade SearchPage (Zero-Read 5000 limit), Checkout (Memory Cache), Category (Infinite Scroll), and Image Optimization
- [/] **[PAUSED] E2E Black Horse Testing** — Paused testing at the "Add to Cart" step (Waiting to upgrade the bot's Force Click capabilities and mechanics)

## 📋 Backlog (Ready for Development)
*(Features or bugs with prepared requirements but not yet scheduled for a sprint)*
- [ ] **Email Ownership Verification Link (Future Backlog)** -> Send automated verification email *"ทางบริษัท DH Notebook ต้องการยืนยันว่านี่คือ Email ของคุณ"* with button `[นี่คือเมลของฉัน]` to confirm email ownership before linking points (Documented in `docs/company_workflow.md`).
- [ ] **Refactor Order ID Generator** -> Fix the `O1, O2, O3, O4` prefix system that resets the last 4 digits (e.g., back to 0001). The last 4 digits MUST **increment continuously** to maintain balance and avoid confusion. If prefixes are unnecessary, consider removing them for a simpler, continuous ID structure.
- [ ] Schedule Code Cleanup (ESLint Refactoring) -> Clear unused variables (no-unused-vars) and organize React Hooks to reduce system warnings.
- [ ] Install PWA (Service Worker) for Backoffice/POS to fully support offline usage (Refresh resilient).

## 💡 Future Backlog & Ideas
*(Concepts temporarily shelved. No immediate plans, kept for reference)*
- [ ] **Automated LINE Notify for Refund Slips** -> Send automated LINE messages to customers/admins when refund slip is uploaded and approved.
- [ ] SMS/LINE Notifications for completed claims or successful Wallet top-ups.
- [ ] General Ledger Dashboard summarizing Wallet and system credits for deep financial analysis.
- [ ] Cloud Functions Automated Backup to Google Drive.
- [ ] Production Monitoring (Sentry/Crashlytics) for real-time bug tracking.
- [ ] Fraud Alert System for abnormal order totals and manipulated prices (Paused due to inaccuracies).
- [ ] Dark Mode for Overview and Backoffice (Paused as per request).
- [ ] Frontend Analytics via GAS (Zero-Cost) -> Stealthily track page load speeds and Quota usage (Reads/Writes), saving data to Google Sheets via Apps Script for the backoffice Overview.
- [ ] Upgrade Firebase to Blaze Plan (Pay as you go) to enable Storage and deploy `storage.rules`.
- [ ] Deposit Invoice System -> Tracking and accounting for deposits.
- [ ] **Full Tax Invoice System (End-to-End Milestone)** -> Connect full lifecycle: Storefront checkout (`/checkout`) collects tax data -> triggers `issue_tax_invoice` Todo -> Backoffice (`TaxInvoiceCard.jsx`) uploads PDF via Drive -> Storefront Order History (`/profile`) provides instant "📄 ดาวน์โหลดใบกำกับภาษี (PDF)" button.
- [ ] Supplier Dispatch System (Claims) -> Deduct `defectQuantity` when sending broken items to Supplier, and increment `stockQuantity` when receiving replacements.
- [ ] Staff Mobile App -> All operational flows for staff inventory checks and packing.
- [ ] Attendance Clock In/Out -> QR code scanning for staff shifts.
- [ ] Ad Targeting Options -> Target specific radii or product categories to save ad credits.
- [ ] LINE Notify -> Instant B2B customer alerts when a manager approves a new wholesale price.
- [ ] Display Cost Price on Wholesale Requests -> Show Cost and % Margin on the Wholesale Table to prevent admins from setting prices below cost.
- [ ] Display Customer Tier & Total Spent on B2B Requests -> Show Tier and Total Successful Orders on B2B cards to help managers evaluate discount levels accurately.
- [ ] Advanced Security Rules & CSP -> XSS prevention, secure Headers, and strict file upload validation.
- [ ] Monitoring & Analytics -> Sentry/Crashlytics and Database Quota alerts.
- [ ] Extreme Auto-Refactor & SRP -> Completely separate Firebase Logic from UI Components into the Service Layer.
- [ ] UX Rendering Speed (Virtual Lists) -> Use Lazy Loading and Virtual Lists for massive data screens.
- [ ] Deep Wallet Audit -> Analyze all Business Logic for vulnerabilities and edge cases that could cause balance discrepancies.

## ✅ Recently Completed
*(Move completed sprint tasks here to maintain history)*
- [x] **Ad System Instant 0ms Toggle & Cross-Tab Dual-Sync** — Added 0ms Optimistic UI updates, removed blocking browser alerts, created mobile card-based responsive layout, implemented triple-collection atomic batch write in `marketingService.js`, and synchronized `businessCardAd` state in real-time across Store Profile and Ad Manager tabs.
- [x] **Ad System Dual-Sync & Toggle Campaign Engine** — Real-time 2-collection sync for Views/Clicks, auto out-of-credit campaign suspension, and user UI Toggle switch for pausing/resuming ad campaigns.
- [x] **Stability Audit, Auth Bypass & Firebase Clean Code** — Fixed localhost reCAPTCHA/App Check via Debug Token across all 3 systems. Cleaned Firebase resource leaks and patched try/catch blocks in 6 core files. Resolved ISSUES.md #5 and #6 🟢 Done.
- [x] **System Stability Audit & squadConfig Hotfix** — Deep structural check. Fixed invalid document reference for squadConfig using `getCollectionPath`. Upgraded Audit Checklist to 85% coverage. Set AI Core Directives prioritizing frontend speed over quota in AGENTS.md.
- [x] **Phase 5: After-Sales & Data Integrity Mastery** — Claims & Warranty system (warranty checker, wallet refunds), Data Repair System, and Local Automated Backup scripts.
- [x] **Phase: Core System Repair & Dashboard Update** — Fixed Buffer Stock deduction bugs, Wallet/Credit history bugs, upgraded overall Dependencies (React 19, Vite 8), and reorganized the Overview page.
- [x] **Phase: Staff Gateway & Privilege Manager** — Staff Onboarding & Role Management with activity logging and UI fixes.

---
**Notes for AI (Antigravity):**
- Always update task statuses in this file when receiving new plans from the user.
- Upon deploying to Production, move the completed tasks to the "Recently Completed" section.
- **Sandbox Mode UI**: Create a UI toggle for staff/managers to switch sandbox modes without editing `.env`, including a clear yellow/red warning banner (Shelved for now).
