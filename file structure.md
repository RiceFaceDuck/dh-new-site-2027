dh-new-site-2027/
├── .firebaserc
├── .gitignore
├── .vscode/
│   └── settings.json
├── Auto-Push-GitHub.bat
├── FULL run dev all.bat
├── deploy-all.bat
├── deploy-backoffice.bat
├── deploy-frontend.bat
├── deploy-staff.bat
├── firebase.json
│
├── dh-backoffice-react/
│   ├── .env.example
│   ├── .firebaserc
│   ├── .gitignore
│   ├── Run Dev Server.bat
│   ├── bun.lock
│   ├── firebase.json
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── public/
│   │   └── dh-logo.png
│   └── src/
│       ├── App.jsx # Main Application Wrapper
│       ├── index.css # Global Styles & Variables (Light/Dark Theme)
│       ├── main.jsx # Entry Point
│       ├── components/
│       │   ├── billing/
│       │   │   ├── BillingDashboard.jsx # Layout Container for Orders
│       │   │   ├── PosSystem.jsx # Layout Container for POS screen
│       │   │   ├── dashboard/
│       │   │   │   ├── OrderFilterBar.jsx # Search and Filter UI
│       │   │   │   ├── OrderListTable.jsx # Data Table for Orders
│       │   │   │   ├── OrderTableRow.jsx # Extracted table row for Orders
│       │   │   │   ├── OrderDetailModal.jsx # Detail and History Modal Layout
│       │   │   │   ├── OrderSummary.jsx # Invoice/Receipt content inside Modal
│       │   │   │   ├── order-summary/
│       │   │   │   │   ├── OrderSummaryItems.jsx # Table list of purchased items
│       │   │   │   │   ├── OrderSummaryTotals.jsx # Totals summary UI
│       │   │   │   │   └── ClaimActionForm.jsx # Claim submission form
│       │   │   │   └── OrderActions.jsx # Action buttons for Modal
│       │   │   ├── hooks/
│       │   │   │   └── useBillingOrders.js # State management for Orders list
│       │   │   └── pos/
│       │   │       ├── CartPanel.jsx # POS Cart UI container
│       │   │       ├── cart/ # Extracted Cart components
│       │   │       │   ├── SearchArea.jsx
│       │   │       │   ├── CartTable.jsx
│       │   │       │   └── CartTableRow.jsx
│       │   │       ├── layout/ # Extracted POS layouts
│       │   │       │   ├── PosHeader.jsx
│       │   │       │   ├── PromoModal.jsx
│       │   │       │   └── GuideModal.jsx
│       │   │       ├── PaymentPanel.jsx # POS Payment logic container
│       │   │       ├── payment/ # Extracted payment components
│       │   │       │   ├── BillSummary.jsx
│       │   │       │   ├── PaymentMethods.jsx
│       │   │       │   └── PaymentActions.jsx
│       │   │       ├── ReceiptTemplate.jsx # Print Layout
│       │   │       ├── receipt/ # Extracted receipt components
│       │   │       │   ├── ReceiptHeader.jsx
│       │   │       │   ├── ReceiptItems.jsx
│       │   │       │   └── ReceiptFooter.jsx
│       │   │       ├── SettingsPanel.jsx # Customer and Pricing settings
│       │   │       ├── settings/
│       │   │       │   ├── CustomerSection.jsx
│       │   │       │   ├── TerminalConfigDropdown.jsx
│       │   │       │   ├── customer/
│       │   │       │   │   ├── CustomerSearchInput.jsx
│       │   │       │   │   ├── WalkInCustomerCard.jsx
│       │   │       │   │   └── ActiveCustomerCard.jsx
│       │   │       │   └── panel/
│       │   │       │       ├── LogisticsSettings.jsx
│       │   │       │       ├── DiscountSettings.jsx
│       │   │       │       ├── PromotionSettings.jsx
│       │   │       │       ├── NoteSettings.jsx
│       │   │       │       └── ToggleGroup.jsx
│       │   │       └── hooks/
│       │   │           ├── usePosState.js # Extracted complex state for POS
│       │   │           ├── usePosActions.js # Extracted shortcuts & actions
│       │   │           └── usePosShortcuts.js # Extracted keyboard event listeners
│       │   ├── gallery/ # Image management components
│       │   │   ├── ImageCard.jsx
│       │   │   ├── InspectionBay.jsx
│       │   │   └── UploadModal.jsx
│       │   ├── inventory/ # Inventory UI components
│       │   │   ├── ProductModal.jsx
│       │   │   └── ProductTable.jsx
│       │   ├── managers/ # Manager specific components
│       │   │   ├── GlobalSettingsPanel.jsx
│       │   │   └── category/
│       │   │       ├── CategoryCard.jsx
│       │   │       ├── CategoryFormModal.jsx
│       │   │       └── CategoryManager.jsx
│       │   ├── search/ # Advanced Search UI
│       │   │   ├── HistoryLogPanel.jsx
│       │   │   ├── ProductDetailPanel.jsx
│       │   │   ├── ProductListPanel.jsx
│       │   │   └── SearchHeader.jsx
│       │   └── todo/ # Task management UI
│       │       ├── HistoryPanel.jsx
│       │       ├── ManagerTodoSummary.jsx
│       │       ├── ManualTaskCard.jsx
│       │       ├── PaymentCard.jsx
│       │       ├── ServiceTaskCard.jsx
│       │       ├── TaxInvoiceCard.jsx
│       │       ├── TodoFilters.jsx
│       │       ├── TodoHeader.jsx
│       │       ├── TodoItem.jsx
│       │       ├── WholesaleCard.jsx
│       │       └── forms/
│       │           └── NewTaskModal.jsx
│       ├── firebase/ # Firebase connection and logic
│       │   ├── adManagementService.js
│       │   ├── billingService.js # Facade for billing queries and commands
│       │   ├── billingQueryService.js # Read operations for Billing
│       │   ├── billingTransactionService.js # Transaction operations (checkout) for Billing
│       │   ├── billingStatusTransaction.js # Handle status update & inventory/wallet adjustment
│       │   ├── billingDeleteService.js # Handle delete operations for billing
│       │   ├── billingPrintService.js # Handle print count updates
│       │   ├── categoryService.js
│       │   ├── claimService.js
│       │   ├── claim/
│       │   │   ├── claimRequestService.js
│       │   │   └── claimManagerService.js
│       │   ├── config.js # DB initialization
│       │   ├── creditService.js
│       │   ├── driveService.js # Upload handling
│       │   ├── freebieService.js
│       │   ├── historyService.js
│       │   ├── inventoryService.js
│       │   ├── pricingService.js
│       │   ├── promotionService.js
│       │   ├── settingsService.js
│       │   ├── todoService.js
│       │   ├── transactionService.js
│       │   ├── userService.js
│       │   ├── warrantyService.js
│       │   └── warrantyService.test.js
│       ├── layouts/ # App Layouts
│       │   └── AdminLayout.jsx
│       └── pages/ # Main Pages
│           ├── Customers/
│           │   ├── index.jsx
│           │   ├── components/
│           │   │   ├── details/
│           │   │   │   └── DetailPanel.jsx
│           │   │   ├── forms/
│           │   │   │   └── CustomerModal.jsx
│           │   │   └── layout/
│           │   │       ├── CustomerHeader.jsx
│           │   │       ├── CustomerRow.jsx
│           │   │       └── CustomerTable.jsx
│           │   └── hooks/
│           │       ├── useCustomerActions.js
│           │       ├── useCustomerData.js
│           │       ├── useCustomerFilters.js
│           │       ├── useCustomerHistory.js
│           │       └── useCustomers.js
│           ├── ManagersOverview/
│           │   ├── ExecutiveStats.jsx
│           │   ├── QuickAccessTools.jsx
│           │   ├── StaffApprovalModal.jsx
│           │   ├── VipManagementModal.jsx
│           │   ├── index.jsx
│           │   └── useManagerDashboard.js
│           ├── ads/
│           │   └── ManagerAds.jsx
│           ├── billing/
│           │   └── BillingMain.jsx # Wrapper switching between Dashboard and POS
│           ├── claims/
│           │   ├── ClaimMain.jsx
│           │   ├── components/
│           │   │   ├── detail/
│           │   │   │   ├── ClaimDetailModal.jsx
│           │   │   │   ├── CustomerInfo.jsx
│           │   │   │   ├── ProductInfo.jsx
│           │   │   │   ├── ImageGallery.jsx
│           │   │   │   └── ModalFooter.jsx
│           │   │   ├── table/
│           │   │   │   ├── ClaimTable.jsx
│           │   │   │   └── ClaimTableRow.jsx
│           │   │   ├── ClaimHeader.jsx
│           │   │   ├── ClaimPrintView.jsx
│           │   │   └── ClaimStatsRow.jsx
│           │   ├── hooks/
│           │   │   └── useClaimData.js
│           │   └── utils/
│           │       └── claimFormatters.jsx
│           ├── gallery/
│           │   └── GalleryMain.jsx
│           ├── managers/
│           │   ├── AdManagement.jsx
│           │   ├── FreebieManagement.jsx
│           │   ├── PartnerSettings.jsx
│           │   ├── PricingSettings.jsx
│           │   ├── PromotionManagement.jsx
│           │   ├── ShippingManagement.jsx
│           │   ├── StaffManagement.jsx
│           │   ├── WalletManagement.jsx
│           │   └── CreditDashboard/
│           │       ├── index.jsx
│           │       ├── components/
│           │       │   ├── DashboardTabs.jsx
│           │       │   ├── LedgerStatsCards.jsx
│           │       │   ├── SecurityFrameworkInfo.jsx
│           │       │   ├── SystemHealthPanel.jsx
│           │       │   └── tabs/
│           │       │       ├── CreditAdjustTab.jsx
│           │       │       ├── CreditHistoryTab.jsx
│           │       │       ├── CreditSettingsTab.jsx
│           │       │       └── PartnerCreditsTab.jsx
│           │       └── hooks/
│           │           ├── useLedgerStats.js
│           │           └── useSystemHealth.js
│           ├── todo/
│           │   ├── NonExistingProducts.jsx
│           │   └── hooks/
│           │       ├── useCentralTodo.js
│           │       └── useManagerTodo.js
│           ├── History/
│           │   ├── index.jsx
│           │   ├── components/
│           │   │   ├── HistoryHeader.jsx
│           │   │   └── HistoryTable.jsx
│           │   ├── hooks/
│           │   │   └── useHistoryLogs.js
│           │   └── utils/
│           │       └── historyFormatters.jsx
│           ├── Inventory.jsx
│           ├── Login.jsx
│           ├── Overview.jsx
│           ├── ProfileSetup.jsx
│           ├── Search.jsx
│           └── Todo.jsx
│
├── dh-frontend/ # Client-facing Next.js/Vite application
│   └── ... (omitted for brevity)
│
└── dh-staff-app/ # Mobile-first staff utility application
    └── ... (omitted for brevity)