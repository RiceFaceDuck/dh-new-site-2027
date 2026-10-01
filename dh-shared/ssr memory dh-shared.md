# 📜 SSR Local Grimoire — Shared Business Engines & Utilities (dh-shared)

<grimoire>
  <flow_and_entry>
    1. Entry Point: `Management System/dh-shared/index.js` aggregating all core calculation engines and utilities.
    2. Data Flow: Pure functional library; receives raw numerical, string, or entity payloads -> returns calculated financial, tax, shipping, and parsed entity models.
    3. Architecture: Agnostic Foundation Layer. Strictly zero imports from frontend UI features (`dh-backoffice-react`, `dh-staff-app`).
  </flow_and_entry>

  <core_schema>
    1. Parsed Customer Address: `accountName`, `contactName`, `phone`, `formattedPhone`, `email`, `lineId`, `facebook`, `addressLine`, `subDistrict`, `district`, `province`, `postalCode`, `preferredCourier`, `shippingNotes`, `rawText`.
    2. Vat Calculation Result: `finalTotal`, `amountBeforeVat`, `vatAmount`, `rate`.
    3. Price / Fraud Schema: `basePrice`, `discount`, `netPrice`, `fraudFlags`.
    4. Credit Config Schema: `unwrapCreditConfig` parses nested `{ config: { pointsEarningRate, skuBonusRules } }` with legacy flat fallback.
  </core_schema>

  <business_rules>
    1. Zero Side-Effect Rule: All utilities must remain pure functions without direct Firestore mutation calls.
    2. Deployment Lockdown: Absolutely no deployment to hosting or cloud functions (`Severity ⚫ / Priority 🚫 block`).
    3. Currency & Arithmetic Precision: Monetary calculations must round satangs using `Math.round(val * 100) / 100`.
    4. Thai Address Hierarchy: Must strictly isolate `subDistrict` (ตำบล/แขวง), `district` (อำเภอ/เขต), `province` (จังหวัด), and 5-digit `postalCode`.
  </business_rules>

  <cross_impact>
    1. `dh-backoffice-react`: Primary consumer for POS checkout, customer quick-paste wizard, and billing dashboard.
    2. `dh-staff-app`: Consumes shared engines for mobile sales operations.
    3. Centralized Test Hub: Verified via `Management System/tests/` and Vitest suites.
  </cross_impact>

  <pitfalls_and_lessons>
    1. ⚠️ Address Normalization: Thai phone numbers prefixed with `+66` or `66` must normalize to leading `0` with 9-10 digits.
    2. ⚠️ Fallback Naming: If parsed customer name matches 'ลูกค้าทั่วไป' or empty, fallback to leading name tokens or 'ลูกค้าใหม่'.
    3. ⚠️ Courier Extraction: Normalize common shorthand such as 'ปณ' to 'ไปรษณีย์ไทย'.
    4. ⚠️ Credit Config Unwrapping: `settings/credit_config` nests parameters inside `.config`; always use `unwrapCreditConfig` so custom earning rates and SKU bonuses are not dropped.
  </pitfalls_and_lessons>
</grimoire>
