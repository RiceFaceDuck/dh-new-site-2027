# 🗺️ DH Notebook: Cognitive Index

This index serves as the Cognitive Map controlling the thinking direction and decision-making of the AI Agent for the DH Notebook project, ensuring exceptionally high accuracy.

---

## 1. 🧠 Brain Folder Schema

All memory within `.agents/memory/` is strictly categorized by role:

*   **Active Memory (Short-term / Current Tasks):**
    *   [TODO.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/TODO.md): Sprint plans, ongoing tasks, and backlog.
    *   [ISSUES.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/ISSUES.md): History and active bugs requiring urgent fixes.
*   **Core DNA (Strategic Architecture Core):**
    *   [ARCHITECTURE.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/ARCHITECTURE.md): Monorepo architecture and Coding Patterns.
    *   [DESIGN_SYSTEM_DNA.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/DESIGN_SYSTEM_DNA.md): Design System & UX Standards across 3 Monorepo apps (`dh-frontend`, `dh-backoffice-react`, `dh-staff-app`).
    *   [SUCCESS_PATTERNS.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/SUCCESS_PATTERNS.md): Reusable success code patterns (Vat engines, state hook facades, optimize query examples).
    *   [Schema Key/](file:///c:/DH%20Notebook/Management%20System/.agents/memory/Schema%20Key/Schema-Index.md): Firestore Schema Index (Tiers 1-3 based on importance and risk).
    *   **WALLET_DNA (Wallet Rules):** "Wallet" strictly means "Money DH owes the customer". There is NO top-up system for users. The admin function to "Add/Deduct" Wallet balance exists PURELY for **Error Correction** in accounting.
*   **Sensory Logs & Learned Lessons (Risk Assessments, Quotas, Lessons):**
    *   [SYSTEM_CAUTIONS.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/SYSTEM_CAUTIONS.md): Critical risks (🔴 Cautions!) and Breaking Changes.
    *   [FIRESTORE_QUOTA_ESTIMATION.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/FIRESTORE_QUOTA_ESTIMATION.md): Firestore Quota statistics and optimization guidelines.
    *   [E2E_BOT_AUDIT_CHECKLIST.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/E2E_BOT_AUDIT_CHECKLIST.md): Black Horse (E2E) testing history and checklists.
    *   [E2E_BOT_LESSONS.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/E2E_BOT_LESSONS.md): Lessons learned and solutions for E2E Bot testing.
*   **Project Documents & Reports (Located in root `docs/`):**
    *   [company_workflow.md](file:///c:/DH%20Notebook/Management%20System/docs/company_workflow.md): DH Notebook Company Operations & Business Workflow DNA (คู่มือขั้นตอนการทำงานและ Logic กติกาบริษัท).
    *   [claims_concept.md](file:///c:/DH%20Notebook/Management%20System/docs/claims_concept.md): Claims & Warranty policy and status cycles.
    *   [concept_notes.md](file:///c:/DH%20Notebook/Management%20System/docs/concept_notes.md): Deep conceptual repository for future phases (e.g., QR Code systems).
    *   [Audit Checklist.md](file:///c:/DH%20Notebook/Management%20System/docs/reports/Audit%20Checklist.md): System v1.0 quality audit (Moved to `docs/reports` to save brain space).
    *   **Note:** Completed audit reports (e.g., Audit Archive, Dependency Audit) are stored in `docs/reports/`.

---

## 2. 🧰 Available Skills

Invoke these skills from `.agents/skills/` when encountering related tasks:
*   [audit_and_logging](file:///c:/DH%20Notebook/Management%20System/.agents/skills/audit_and_logging/SKILL.md): When writing Audit logs, managing ISSUES, or tracking history.
*   [production_deployment](file:///c:/DH%20Notebook/Management%20System/.agents/skills/production_deployment/SKILL.md): When deploying to Production, containing risk assessment rules.
*   [optimize_firebase_query](file:///c:/DH%20Notebook/Management%20System/.agents/skills/optimize_firebase_query/SKILL.md): Guidelines for cost efficiency and writing optimized queries.
*   [create_manager_setting](file:///c:/DH%20Notebook/Management%20System/.agents/skills/create_manager_setting/SKILL.md): Rules for creating Manager settings pages (SRP and In-App Docs).
*   [analyze_e2e_results](file:///c:/DH%20Notebook/Management%20System/.agents/skills/analyze_e2e_results/SKILL.md): Deep UI/Log analysis for E2E testing without prematurely editing code.
*   [audit_ui_design](file:///c:/DH%20Notebook/Management%20System/.agents/skills/audit_ui_design/SKILL.md): UI/UX Design balance audit & proactive design advisory across 3 apps.
*   [manage_memory_pruning](file:///c:/DH%20Notebook/Management%20System/.agents/skills/manage_memory_pruning/SKILL.md): Automated memory pruning & failure lesson structuring procedure.

---

## 3. 🗂️ Monorepo Code Mapping & Direct Links

Navigate directly to these files when modifying the system's core:

*   **`dh-shared/`** (Core Logic/Engine):
    *   👉 `taxEngine.js`: VAT & Withholding Tax calculations.
    *   👉 `priceEngine.js`: Pricing and discount calculations.
    *   👉 `dbPath.js` or `getCollectionPath`: Firestore path manager.
*   **`dh-backoffice-react/`** (Backoffice/POS/Inventory/Claims):
    *   Quick Search: `src/pages/managers/settings/` (Manager Settings).
*   **`dh-frontend/`** (B2B Customers):
    *   Cart, Checkout, Credit Points, Wallet.
*   **`dh-staff-app/`** (Mobile Staff App):
    *   Status updates, Camera Stock checks, QR scanning.

---

## 3.5 🔌 Development Environment Ports

To prevent conflicts between manual `npm run dev` and `FULL run dev all.bat`, all ports are strictly locked in `vite.config.js`:
*   **dh-frontend:** `http://localhost:8988`
*   **dh-backoffice-react:** `http://localhost:3168`
*   **dh-staff-app:** `http://localhost:3122`

---

## 4. 🛡️ High-IQ Security & Safe Execution

To prevent system crashes and protect Financial Consistency:

1.  **NO Hardcoded Firestore Collections:** MUST use `getCollectionPath` always to prevent Test data bleeding into Live data.
2.  **Transactions ONLY for Financial/Points:** Money transfers, Wallet balances, or `creditPoints` MUST run inside `runTransaction` to prevent Race Conditions.
3.  **No Destructive Edits:** If old code works, DO NOT delete it. Comment it out or create a new file.
4.  **Stop & Ask on Risk:** If a potential crash risk is found, stop editing code and immediately use `ask_question` to seek a decision from the user.
5.  **Workspace Organization:** Test scripts (scratch/audit/fix) MUST go into `scripts/`. Report files (txt/md) MUST go into `docs/reports/`. Never clutter the root directory.
6.  **Automated Memory Pruning & Lesson Structuring:** Keep the memory center pristine. Automatically archive resolved bugs from `ISSUES.md` and prune obsolete cautions from `SYSTEM_CAUTIONS.md` after task completion to maintain high-precision context without bloating.

---

## 🚀 5. AI Session Bootstrap (Metacognitive OS Engine v2.0)

Upon starting a new Turn, the bot must silently execute:
1.  Read [AGENTS.md](file:///c:/DH%20Notebook/Management%20System/.agents/AGENTS.md) to internalize the Prismatic OS philosophy & Metacognitive Triad Engine.
2.  Read this index [COGNITIVE_INDEX.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/COGNITIVE_INDEX.md).
3.  Review active memory: [TODO.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/TODO.md) and [ISSUES.md](file:///c:/DH%20Notebook/Management%20System/.agents/memory/ISSUES.md).
4.  Execute Subagent Delegation Protocol if task spans >5 files or multiple monorepo packages.
5.  Run Metacognitive Triad Simulation & Dual-Hypothesis Verification before writing code or proposing plans.
6.  If anomalies are found or a plan is needed, NEVER edit code immediately until user approval is obtained via `ask_question` choices.
