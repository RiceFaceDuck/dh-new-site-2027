# System Architecture & Guidelines

This document serves as the high-level architecture guide for the DH Management System.
It is designed to give developers (and AI agents) a rapid understanding of the system's structure, design patterns, and core domains.

## 1. Monorepo Structure

The project is structured as a monorepo containing several interconnected applications:

- **`dh-backoffice-react/`**: The core administrative and operational system. Built with React, Vite, and Tailwind CSS. Handles POS (Point of Sale), Billing, Inventory Management, Claim processing, Manager approvals, and system settings.
- **`dh-frontend/`**: The client-facing web application. Handles customer portals, checkout flows, product catalog, hardware scanner landing pages, and profile management.
- **`dh-staff-app/`**: A mobile-first utility application used by staff for packing tasks and stock scanning.
- **`dh-shared/`**: A local package containing shared business logic and utilities across applications. Critical core logic like VAT calculation (`taxEngine.js`) and price/discount calculations (`priceEngine.js`) live here.
- **`functions/`**: Firebase Cloud Functions acting as the secure backend for tasks like Gmail API integration and other server-side operations.

## 2. Tech Stack

- **Frontend**: React (Vite / Next.js)
- **Styling**: Tailwind CSS
- **Backend / Database**: Firebase (Firestore, Authentication, Cloud Storage, Cloud Functions)
- **State Management**: React Context API & Custom Hooks

## 3. Core Design Patterns

To maintain a clean and scalable codebase, this project enforces the following patterns:

### Single Responsibility Principle (SRP)
Services and Hooks are aggressively refactored to handle single tasks. 
*Example: Instead of a massive `inventoryService.js`, the logic is split into `inventoryMutationService.js`, `inventoryQueryService.js`, `inventoryImportService.js`, etc.*

### Facade Pattern
Complex Firebase operations are often hidden behind a Facade service that provides a simplified API to the UI.
*Example: `billingService.js` acts as a facade, delegating to `billingQueryService.js` and `billingTransactionService.js`.*

### Custom Hooks for Business Logic
UI components (`.jsx` files) should remain as "dumb" as possible (purely presentational). Business logic, state management, and side effects are extracted into custom hooks (`use*.js`).
*Example: `usePosState.js` handles POS orchestration, keeping the UI components clean.*

### Data & Quota Optimization
Firebase reads/writes are a primary cost driver. The system enforces:
- **Server-side Pagination**: Fetching data using `limit` and `startAfter` instead of downloading massive collections (e.g., Category Page, POS Search).
- **Optimistic UI**: Updating local state instantly without awaiting server responses for a snappy UX, while background-syncing (e.g., Cart quantity updates).

## 4. Key Business Domains

- **Billing & POS**: The financial core. Handles transactions, receipts, discounts, and payment methods. Heavily interacts with `dh-shared` for price calculations.
- **Inventory & Stock**: Manages product data, stock adjustments, imports/exports (Excel), and syncing with external platforms (like Big Seller).
- **Claims & Warranty**: Handles customer claims, inspection bays, and warranty tracking.
- **Manager Tasks & Approvals**: A robust system for managers to approve tasks, manage ads, and configure global settings. 
  - *Note on Global Settings:* Global settings UI components are structured inside `src/pages/managers/settings/{domain}/` (e.g., `ads`, `inventory`, `shipping`) to ensure Single Responsibility Principle and ease of AI discovery. Each domain contains its UI component, custom hooks, and guide components.

## 5. Coding Rules & Conventions

1. **In-App Documentation**: Any new backoffice feature MUST include in-app guidance (e.g., Guide Modal, Tooltip) explaining what the feature is, how to use it, and expected results.
2. **Safe Deletion**: Do not delete existing Firebase data arbitrarily; prefer soft deletes or logging history (e.g., `historyService.js`).
3. **Routing**: Manager-specific routes must be protected via `ManagerRoute.jsx`.
4. **Imports**: Utilize `dh-shared` for any mathematical or business logic that might be needed by more than one application.

---
*Note: For finding specific files or code, rely on global search (e.g., `grep`) rather than maintaining a manual file tree, as the structure is highly dynamic.*
