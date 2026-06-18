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
├── functions/ # Firebase Cloud Functions Backend
│   ├── index.js # Cloud Functions for Gmail API and others
│   └── package.json
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
│       │   │   ├── InventoryHeader.jsx
│       │   │   ├── ProductTable.jsx
│       │   │   ├── ProductTableRow.jsx
│       │   │   ├── ProductModal.jsx
│       │   │   ├── InventoryImportModal.jsx
│       │   │   ├── InventoryExportModal.jsx
│       │   │   ├── import/ # Extracted Import components
│       │   │   │   ├── ImportConfig.jsx
│       │   │   │   ├── ImportPreviewTable.jsx
│       │   │   │   ├── ImportResultSummary.jsx
│       │   │   │   └── ImportUploader.jsx
│       │   │   ├── export/ # Extracted Export components
│       │   │   │   ├── ExportColumnsTab.jsx
│       │   │   │   ├── ExportFiltersTab.jsx
│       │   │   │   └── ExportSkusTab.jsx
│       │   │   ├── hooks/
│       │   │   │   ├── useProductForm.js
│       │   │   │   └── useExcelImport.js
│       │   │   └── modal/
│       │   │       ├── ProductBasicInfo.jsx
│       │   │       ├── ProductImageUpload.jsx
│       │   │       ├── ProductLinks.jsx
│       │   │       ├── ProductPricingStock.jsx
│       │   │       └── ProductTags.jsx
│       │   ├── managers/ # Manager specific components
│       │   │   └── category/
│       │   │       ├── CategoryCard.jsx
│       │   │       ├── CategoryFormModal.jsx
│       │   │       ├── CategoryManager.jsx
│       │   │       └── form/ # Extracted form sections
│       │   │           ├── ImageUploadSection.jsx
│       │   │           ├── BasicInfoSection.jsx
│       │   │           └── DisplaySettingsSection.jsx
│       │   ├── search/ # Advanced Search UI
│       │   │   ├── HighlightText.jsx
│       │   │   ├── HistoryLogPanel.jsx
│       │   │   ├── ProductDetailPanel.jsx
│       │   │   ├── ProductListPanel.jsx
│       │   │   ├── SearchHeader.jsx
│       │   │   └── detail/
│       │   │       ├── ProductDetailAttributes.jsx
│       │   │       ├── ProductDetailComments.jsx
│       │   │       ├── ProductDetailHeader.jsx
│       │   │       └── ProductDetailSubstitutes.jsx
│       │   ├── login/ # Refactored Login Components
│       │   │   ├── index.jsx
│       │   │   ├── LoginForm.jsx
│       │   │   ├── RegisterForm.jsx
│       │   │   ├── StatusView.jsx
│       │   │   └── hooks/
│       │   │       └── useAuthFlow.js
│       │   ├── todo/ # Task management UI
│       │   │   ├── HistoryPanel.jsx
│       │   │   ├── ManagerTodoSummary.jsx
│       │   │   ├── ManualTaskCard.jsx
│       │   │   ├── PaymentCard.jsx
│       │   │   ├── ServiceTaskCard.jsx
│       │   │   ├── TaxInvoiceCard.jsx
│       │   │   ├── TodoFilters.jsx
│       │   │   ├── TodoHeader.jsx
│       │   │   ├── TodoItem.jsx
│       │   │   ├── WholesaleCard.jsx
│       │   │   ├── cards/
│       │   │   │   ├── AdApprovalCard.jsx
│       │   │   │   ├── GenericTodoCard.jsx
│       │   │   │   ├── ManagerBadge.jsx
│       │   │   │   ├── StaffApprovalCard.jsx
│       │   │   │   └── wholesale/
│       │   │   │       ├── WholesaleSummary.jsx
│       │   │   │       ├── WholesaleTable.jsx
│       │   │   │       └── useWholesaleCalculator.js
│       │   │   └── forms/
│       │   │       └── NewTaskModal.jsx
│       ├── contexts/
│       │   └── AuthContext.jsx # Global Auth and Role state
│       ├── firebase/ # Firebase connection and logic
│       │   ├── adManagementService.js
│       │   ├── managerActionService.js # 🚀 Handles Manager Approval SRP
│       │   ├── billingService.js # Facade for billing queries and commands
│       │   ├── billingQueryService.js # Read operations for Billing
│       │   ├── billingTransactionService.js # Transaction operations (checkout) for Billing
│       │   ├── billingStatusTransaction.js # Facade for status updates
│       │   ├── billing/
│       │   │   ├── statusSalesHandler.js
│       │   │   ├── statusStockHandler.js
│       │   │   └── statusWalletHandler.js
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
│       │   ├── gmailService.js # Gmail API Integration (Client-side)
│       │   ├── historyService.js # Legacy proxy to GAS for backward compatibility
│       │   ├── gasHistoryService.js # Main batching logger to Google Apps Script
│       │   ├── inventoryService.js
│       │   ├── inventory/
│       │   │   ├── inventoryQueryService.js
│       │   │   ├── inventoryMutationService.js
│       │   │   ├── inventoryAdjustmentService.js # 🚀 Handles special manual stock adjustments
│       │   │   ├── inventorySourcingService.js
│       │   │   ├── inventoryImportService.js
│       │   │   └── inventoryExportService.js
│       │   ├── menuConfigService.js # Service for managing Manager Dashboard Layout
│       │   ├── pricingService.js
│       │   ├── promotionService.js
│       │   ├── settingsService.js
│       │   ├── footerSettingsService.js
│       │   ├── todoService.js # Facade pattern for todo services
│       │   ├── todo/ # Refactored single responsibility todo services
│       │   │   ├── todoActionService.js
│       │   │   ├── todoPaymentService.js
│       │   │   ├── todoQueryService.js
│       │   │   ├── todoStaffService.js
│       │   │   ├── todoWalletService.js
│       │   │   └── todoWholesaleService.js
│       │   ├── transactionService.js
│       │   ├── userManagementService.js
│       │   ├── userProfileService.js
│       │   ├── userService.js
│       │   ├── userStaffService.js
│       │   ├── warrantyService.js
│       │   └── warrantyService.test.js
│       ├── layouts/ # App Layouts
│       │   ├── AdminLayout.jsx
│       │   └── components/
│       │       ├── Sidebar.jsx # Extracted Sidebar
│       │       └── GatekeeperUI.jsx # Auth checking and denied UI
│       ├── components/ # Global Components
│       │   ├── overview/ # Overview page components
│       │   │   ├── hooks/
│       │   │   │   └── useOverviewData.js
│       │   │   ├── BestSellersPanel.jsx
│       │   │   ├── OverviewHeader.jsx
│       │   │   ├── SalesTargetCard.jsx
│       │   │   ├── SocialFeedPanel.jsx
│       │   │   └── StatCard.jsx
│       │   ├── routing/
│       │   │   └── ManagerRoute.jsx # Route protection
│       │   └── ... (other component folders)
│       └── pages/ # Main Pages
│           ├── managers/
│           │   ├── GlobalAdsConfig.jsx
│           │   ├── GlobalBufferSettings.jsx
│           │   ├── GlobalCategorySettings.jsx
│           │   ├── GlobalFooterSettings.jsx
│           │   ├── GlobalRegexSettings.jsx
│           │   ├── GlobalThemeSettings.jsx
│           │   ├── GlobalWarrantySettings.jsx
│           │   │   └── StockAdjustment.jsx # 🚀 Manager tool for handling manual stock adjustments
│           │   ├── GlobalThemeSettings.jsx
│           │   ├── components/
│           │   │   └── theme/ # Extracted Theme settings
│           │   │       ├── ThemeConfigTab.jsx
│           │   │       └── HeroConfigTab.jsx
│           │   └── ... (other manager pages)
│           ├── emails/ # Gmail API Integration
│           │   ├── EmailMain.jsx
│           │   ├── components/
│           │   │   ├── EmailSidebar.jsx
│           │   │   ├── EmailHeader.jsx
│           │   │   ├── EmailList.jsx
│           │   │   ├── EmailDetail.jsx
│           │   │   └── EmailReplyForm.jsx
│           │   └── hooks/
│           │       └── useGmail.js
│           ├── Customers/
│           │   ├── index.jsx
│           │   ├── components/
│           │   │   ├── details/
│           │   │   │   ├── DetailPanel.jsx
│           │   │   │   ├── ContactInfo.jsx
│           │   │   │   ├── ShippingInfo.jsx
│           │   │   │   ├── TaxInfo.jsx
│           │   │   │   ├── StatsInfo.jsx
│           │   │   │   └── HistoryInfo.jsx
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
│           │   ├── components/
│           │   │   ├── GlobalSettingsHeader.jsx
│           │   │   ├── ManagerTaskSection.jsx
│           │   │   ├── MenuLayoutManager.jsx
│           │   │   ├── StaffApprovalModal.jsx
│           │   │   ├── VipManagementModal.jsx
│           │   │   └── EmailSetupModal.jsx # Admin setup for Gmail API
│           │   ├── index.jsx
│           │   ├── QuickAccessTools.jsx
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
│           │   ├── pricing/
│           │   │   ├── hooks/
│           │   │   │   └── usePricingSettings.js
│           │   │   ├── PricingHistoryLog.jsx
│           │   │   ├── PricingRulesTable.jsx
│           │   │   ├── PricingSimulation.jsx
│           │   │   └── SmartRoundingPolicy.jsx
│           │   ├── PromotionManagement.jsx
│           │   ├── ShippingManagement.jsx
│           │   ├── StaffManagement.jsx
│           │   ├── components/
│           │   │   └── staff/
│           │   │       ├── StaffAddModal.jsx
│           │   │       ├── StaffDetailModal.jsx
│           │   │       ├── StaffEditModal.jsx
│           │   │       └── StaffTable.jsx
│           │   ├── WalletManagement.jsx
│           │   ├── wallet/
│           │   │   ├── hooks/
│           │   │   │   └── useWalletManagement.js
│           │   │   ├── components/
│           │   │   │   ├── WalletStatusCard.jsx
│           │   │   │   ├── TransactionTable.jsx
│           │   │   │   └── PointTransactionTable.jsx
│           │   │   ├── CustomerSearchList.jsx
│           │   │   ├── PendingWithdrawals.jsx
│           │   │   ├── WalletDashboardStats.jsx
│           │   │   ├── WalletDetailPanel.jsx
│           │   │   └── WalletModals.jsx
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
│           │       ├── useManagerTodo.js
│           │       └── useWholesalePrices.js
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
│           ├── hooks/
│           │   └── useProductSearch.js
│           ├── Todo.jsx
│           ├── todo/
│           │   ├── components/
│           │   │   ├── TodoPageFilterBar.jsx
│           │   │   ├── TodoPageHeader.jsx
│           │   │   └── TodoPageList.jsx
│           └── Squad/ # Fantasy Squad Selection UI
│               ├── Squad.jsx
│               ├── hooks/
│               │   └── useSquadSelection.js
│               └── components/
│                   ├── SquadHeader.jsx
│                   ├── Pitch.jsx
│                   ├── PlayerNode.jsx
│                   ├── SquadActions.jsx
│                   └── SquadBottomNav.jsx
│
├── dh-frontend/ # Client-facing Next.js/Vite application
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/ # 🚀 Extracted components for Chat UI SRP
│   │   │   │   ├── FloatingMessenger.jsx
│   │   │   │   ├── MessengerMenu.jsx
│   │   │   │   ├── MessengerRadar.jsx
│   │   │   │   └── MessengerResult.jsx
│   │   │   ├── cart/ # 🚀 Extracted components for Cart page SRP
│   │   │   │   ├── CartEmptyState.jsx
│   │   │   │   ├── CartFreebieProgress.jsx
│   │   │   │   ├── CartItemCard.jsx
│   │   │   │   └── CartSummaryPanel.jsx
│   │   │   ├── checkout/ # 🚀 Extracted Checkout components
│   │   │   │   ├── AddressSelector.jsx
│   │   │   │   ├── PaymentMethod.jsx
│   │   │   │   ├── ShippingMethod.jsx
│   │   │   │   ├── TaxInvoiceForm.jsx
│   │   │   │   ├── tax-invoice/
│   │   │   │   │   ├── TaxTypeSelector.jsx
│   │   │   │   │   └── TaxFormFields.jsx
│   │   │   │   ├── CreditToggleBox.jsx
│   │   │   │   ├── TrustBadges.jsx
│   │   │   │   └── hooks/
│   │   │   │       └── useCheckoutLogic.js
│   │   │   ├── footer/
│   │   │   │   ├── FooterBrand.jsx
│   │   │   │   ├── FooterContact.jsx
│   │   │   │   └── FooterLinkZone.jsx
│   │   │   ├── product/ # 🚀 Extracted Product Detail components
│   │   │   │   ├── ProductDescriptionSection.jsx
│   │   │   │   ├── ProductVideoSection.jsx
│   │   │   │   ├── ProductPricingSection.jsx
│   │   │   │   └── ... (other product sections)
│   │   │   ├── profile/ # 🚀 Extracted Profile Components
│   │   │   │   ├── forms/
│   │   │   │   │   ├── PersonalInfoForm.jsx
│   │   │   │   │   ├── ProfileTaxForm.jsx
│   │   │   │   │   └── sections/
│   │   │   │   │       ├── ContactInfoSection.jsx
│   │   │   │   │       ├── ShippingAddressSection.jsx
│   │   │   │   │       └── MapEcosystemSection.jsx
│   │   │   │   └── tabs/
│   │   │   │       ├── TabAdManager.jsx
│   │   │   │       ├── history/
│   │   │   │       │   ├── HistoryFilterBar.jsx
│   │   │   │       │   ├── HistoryItemCard.jsx
│   │   │   │       │   ├── HistoryList.jsx
│   │   │   │       │   ├── HistoryStatusUtil.js
│   │   │   │       │   ├── ServiceActionModal.jsx
│   │   │   │       │   ├── UploadSlipModal.jsx
│   │   │   │       │   ├── useHistoryOrders.js
│   │   │   │       │   ├── useServiceAction.js
│   │   │   │       │   └── useUploadSlip.js
│   │   │   │       ├── wallet/
│   │   │   │       │   ├── WalletCard.jsx
│   │   │   │       │   ├── WalletHistory.jsx
│   │   │   │       │   ├── WithdrawModal.jsx
│   │   │   │       │   └── useWalletData.js
│   │   │   ├── checkout/
│   │   │   │   ├── checkoutOrderActionService.js
│   │   │   │   ├── checkoutSubmitService.js
│   │   │   │   └── checkoutWholesaleService.js
│   │   │   ├── credit/
│   │   │   │   ├── creditActionService.js
│   │   │   │   ├── creditConfig.js
│   │   │   │   ├── creditFormatService.js
│   │   │   │   ├── creditHistoryService.js
│   │   │   │   └── creditRealtimeService.js
│   │   │   ├── productService.js # 🚀 Extracted Product Fetch & Smart Mapper
│   │   │   ├── marketingService.js
│   │   │   ├── marketingAnalyticsService.js
│   │   │   └── footerClientService.js
│   │   ├── pages/
│   │   │   ├── Home/
│   │   │   │   ├── Home.jsx
│   │   │   │   ├── components/
│   │   │   │   │   ├── HeroSection.jsx
│   │   │   │   │   ├── QuickActions.jsx
│   │   │   │   │   ├── FeaturedSpares.jsx
│   │   │   │   │   ├── SquadHighlight.jsx
│   │   │   │   │   └── PartnerCard.jsx # 🚀 Extracted component for displaying nearby partner with distance
│   │   │   │   └── hooks/
│   │   │   │       ├── useHomeProducts.js
│   │   │   │       └── useNearbyPartners.js # 🚀 Hook for mapping and local UI state
│   │   ├── hooks/
│   │   │   └── useGeolocation.js # 🚀 Custom hook for interacting with Browser GPS
│   │   ├── utils/
│   │   │   └── geoUtils.js # 🚀 Pure functions for mathematical distance calculations
│   │   ├── pages/
│   │   │   ├── StoreProfile/
│   │   │   │   └── StoreProfilePage.jsx # 🚀 New premium public page for viewing technician profiles
│   │   │   └── CategoryPage.jsx # New dedicated category routing page
│   │   └── App.jsx
│   └── ... (omitted for brevity)
│
└── dh-staff-app/ # Mobile-first staff utility application
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── packing/
        │   │   ├── PackingTaskCard.jsx
        │   │   └── TrackingModal.jsx
        │   └── stock/
        │       ├── BarcodeScanner.jsx
        │       ├── CategoryFilter.jsx
        │       └── ProductCard.jsx
        ├── firebase/
        │   ├── config.js
        │   ├── inventoryService.js
        │   └── packingService.js
        ├── layouts/
        │   └── MobileLayout.jsx
        └── pages/
            ├── PackingTasks.jsx
            └── StockMain.jsx