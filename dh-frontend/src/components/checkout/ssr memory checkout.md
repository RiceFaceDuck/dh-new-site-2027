<grimoire>
<flow_and_entry>
- Entry: `dh-frontend/src/pages/Checkout.jsx` (Route: `/checkout`).
- Hook: `components/checkout/hooks/useCheckoutLogic.js` bridges Cart context, Auth, Wallet, and Submission.
- Service: `firebase/checkoutService.js` -> `checkoutSubmitService.js` handles atomic order creation and wallet ledger writes.
</flow_and_entry>

<core_schema>
- `users/{uid}`: { walletBalance: number, creditPoints: number, lastWalletTxId: string }
- `users/{uid}/wallet_transactions/{txId}`: { transactionId: string, type: 'SPEND', amount: number, balanceAfter: number, status: 'SUCCESS', timestamp: serverTimestamp }
- `orders/{orderId}`: { paymentMethod: string, walletUsed: number, grandTotal: number, customer: object }
- Local Checkout State: { customerData, taxData, paymentMethod, shippingCost, appliedPromotions, discountAmount, useWallet, wholesaleReason }
</core_schema>

<business_rules>
- Domain Separation: `walletBalance` is cash liability (1 THB = 1 THB) used as discount via `useWallet`, while `creditPoints` is loyalty rewards points. Never mix them.
- Firestore Security Strictness: Client wallet deductions must specify `type: 'SPEND'`, matching `transactionId` doc ID, `balanceAfter`, and update `lastWalletTxId` on user doc atomically.
- Deployment Lockdown: Absolute deployment ban. All testing and runs remain purely local.
- Zero Ghost Transactions: Ledger doc ID must be deterministic (`TXW-${orderRef.id}`) to guarantee transaction idempotency.
</business_rules>

<cross_impact>
- Backoffice Wallet Dashboard: Customer deductions immediately reduce global liability and reflect on manager dashboards.
- Firestore Security Rules: Non-compliance with required fields (`balanceAfter`, `type == 'SPEND'`) results in `permission-denied` at checkout.
- Order Summary & POS: `useWallet` directly offsets payable grand total before slip payment verification.
- Backoffice Tax Invoice Todo: `taxData` must bridge cleanly from `TaxInvoiceForm` to `checkoutSubmitService` to trigger `issue_tax_invoice` todo for staff fulfillment.
</cross_impact>

<pitfalls_and_lessons>
- ⚠️ Terminology Confusion: Formerly aliased `walletBalance` as `creditBalance` in `useCheckoutLogic.js` causing confusion with reward points; resolved with clean `walletBalance`/`useWalletToggle` and backward-compatible aliases.
- ⚠️ Rules Violation Bug: Storefront previously created random transaction doc ID and omitted `balanceAfter`, triggering permission-denied in client SDK; resolved in `checkoutSubmitService.js`.
- ⚠️ Backward Compatibility: `CreditToggleBox.jsx` and `index.js` preserve legacy prop and component aliases (`CreditToggleBox` / `WalletToggleBox`) to protect existing UI callers.
- ⚠️ Buffer Stock Resolution: Always use `resolveEffectiveBuffer(bufferStock, globalBuffer)` in `checkoutSubmitService.js`; never check `!== undefined` directly because `null !== undefined` evaluates to true in JS and clobbers global buffer.
- ⚠️ Tax Invoice Prop Disconnect: `TaxInvoiceForm.jsx` omitted `onUpdate` prop forwarding, leading to dropped tax data; must ensure two-way prop and context sync.
- ⚠️ Shipping Method & Customer Fallback: `ShippingMethod.jsx` must pass the complete option object (`{ id, cost }`) to prevent `shippingMethod` defaulting to "standard", and `checkoutSubmitService.js` must prioritize freshly entered checkout customerData (phone/address/fullName) over empty user profile documents.
- ⚠️ Double Compression: `PaymentMethod.jsx` already compresses slip images via HTML5 Canvas; avoid re-compressing in `useCheckoutLogic.js` to prevent image degradation.
- ⚠️ Quota Leak in Order Transaction: `checkoutSubmitService.js` was reading `DH_CREDIT_POOL` unconditionally inside the transaction without consuming it; removed to save 1 read quota on every order checkout.
- ⚠️ Wallet Cap Math Consistency: `useCheckoutLogic.js` must incorporate `insuranceCost` alongside shipping and discount into `currentNetBeforeCredit` so the wallet cap accurately reflects the final payable balance calculated in `checkoutSubmitService.js`.
- ⚠️ Freebie Transaction Reference & Quota: In `checkoutSubmitService.js`, real-time freebie validation requires declaring `const freebieRef = doc(db, getCollectionPath('freebies'), freebie.id)` before `transaction.get(freebieRef)`. Additionally, the quota lock increment must use `Number(f.calculatedQty || f.qty) || 1` to correctly account for multi-quantity freebie eligibility.
- ⚠️ Accordion Last Step Navigation: `AccordionSection.jsx` now supports `isLastStep` and `actionLabel`. The final step (`วิธีการชำระเงิน`) uses `isLastStep={true}` to render "บันทึก" and collapses the section cleanly (`setActiveStep(null)`), instead of incrementing to a non-existent step 5.
- ⚠️ Net Total & Shipping Parity: `useCheckoutLogic.js` must initialize and sync `shippingCost` from `contextCheckoutState` (defaulting to 50, not 0) to ensure shipping is included in `calculateNetTotal`. In `checkoutSubmitService.js`, `totals.grandTotal` must be explicitly overwritten with `finalNetTotal`, and `HistoryItemCard.jsx` must prioritize `netTotal` consistently across header and expanded breakdown.
- ⚠️ Wholesale Technician LINE Quick Access: `CheckoutSummaryActions.jsx` incorporates a compact official LINE logo (20px) inside the "ฉันเป็นร้านช่าง ต้องการ ราคาส่ง" button, directly routing inquiries to `https://line.me/R/ti/p/@dhnotebook` without requiring prior retail terms consent.
</pitfalls_and_lessons>
</grimoire>
