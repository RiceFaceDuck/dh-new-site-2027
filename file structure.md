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
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── components/
│       │   ├── billing/
│       │   │   ├── BillingDashboard.jsx
│       │   │   ├── PosSystem.jsx
│       │   │   └── pos/
│       │   │       ├── CartPanel.jsx
│       │   │       ├── PaymentPanel.jsx
│       │   │       ├── ReceiptTemplate.jsx
│       │   │       └── SettingsPanel.jsx
│       │   ├── gallery/
│       │   │   ├── ImageCard.jsx
│       │   │   ├── InspectionBay.jsx
│       │   │   └── UploadModal.jsx
│       │   ├── inventory/
│       │   │   ├── ProductModal.jsx
│       │   │   └── ProductTable.jsx
│       │   ├── managers/
│       │   │   ├── GlobalSettingsPanel.jsx
│       │   │   └── category/
│       │   │       ├── CategoryCard.jsx
│       │   │       ├── CategoryFormModal.jsx
│       │   │       └── CategoryManager.jsx
│       │   ├── search/
│       │   │   ├── HistoryLogPanel.jsx
│       │   │   ├── ProductDetailPanel.jsx
│       │   │   ├── ProductListPanel.jsx
│       │   │   └── SearchHeader.jsx
│       │   └── todo/
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
│       ├── firebase/
│       │   ├── adManagementService.js
│       │   ├── billingService.js
│       │   ├── categoryService.js
│       │   ├── claimService.js
│       │   ├── config.js
│       │   ├── creditService.js
│       │   ├── driveService.js
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
│       ├── layouts/
│       │   └── AdminLayout.jsx
│       └── pages/
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
│           │   └── BillingMain.jsx
│           ├── claims/
│           │   └── ClaimMain.jsx
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
│           ├── History.jsx
│           ├── Inventory.jsx
│           ├── Login.jsx
│           ├── Overview.jsx
│           ├── ProfileSetup.jsx
│           ├── Search.jsx
│           └── Todo.jsx
│
├── dh-frontend/
│   ├── .env.example
│   ├── .gitignore
│   ├── README.md
│   ├── bun.lock
│   ├── eslint.config.js
│   ├── frontend_screenshot.png
│   ├── index.html
│   ├── main site run dev.bat
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── icons.svg
│   │   ├── logo.jpg
│   │   └── logo.png
│   └── src/
│       ├── App.css
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── assets/
│       │   ├── hero.png
│       │   ├── logo.jpg
│       │   ├── logo.png
│       │   ├── react.svg
│       │   └── vite.svg
│       ├── components/
│       │   ├── CategoryList.jsx
│       │   ├── Footer.jsx
│       │   ├── HeroBanner.jsx
│       │   ├── Navbar.jsx
│       │   ├── ProductList.jsx
│       │   ├── ads/
│       │   │   ├── BannerAdWidget.jsx
│       │   │   ├── BusinessCardAdWidget.jsx
│       │   │   └── ProductAdCard.jsx
│       │   ├── chat/
│       │   │   └── FloatingMessenger.jsx
│       │   ├── checkout/
│       │   │   ├── AddressSelector.jsx
│       │   │   ├── CheckoutForms.jsx
│       │   │   ├── CheckoutSuccess.jsx
│       │   │   ├── CheckoutSummary.jsx
│       │   │   ├── PaymentMethod.jsx
│       │   │   ├── PaymentUploader.jsx
│       │   │   ├── PrivilegeSelector.jsx
│       │   │   ├── ShippingMethod.jsx
│       │   │   ├── TaxInvoiceForm.jsx
│       │   │   └── WholesaleRequestModal.jsx
│       │   ├── navigation/
│       │   │   └── BottomNav.jsx
│       │   ├── partner/
│       │   │   ├── PartnerSupportBox.jsx
│       │   │   └── TopPartnerBanner.jsx
│       │   └── profile/
│       │       ├── AuthForm.jsx
│       │       ├── ProfileSidebar.jsx
│       │       ├── forms/
│       │       │   ├── PersonalInfoForm.jsx
│       │       │   ├── ProfileTaxForm.jsx
│       │       │   ├── SocialLinksForm.jsx
│       │       │   └── SupportSettings.jsx
│       │       └── tabs/
│       │           ├── TabAdManager.jsx
│       │           ├── TabFavorites.jsx
│       │           ├── TabHistory.jsx
│       │           ├── TabOverview.jsx
│       │           ├── TabWallet.jsx
│       │           └── ad-manager/
│       │               ├── AdFormModal.jsx
│       │               ├── AdListTable.jsx
│       │               ├── AdPreviewCard.jsx
│       │               └── AdStatsOverview.jsx
│       ├── context/
│       │   ├── CartContext.jsx
│       │   ├── CartProvider.jsx
│       │   └── OrderContext.jsx
│       ├── data/
│       │   └── mockData.js
│       ├── firebase/
│       │   ├── authService.js
│       │   ├── cartService.js
│       │   ├── categoryService.js
│       │   ├── checkoutService.js
│       │   ├── config.js
│       │   ├── creditService.js
│       │   ├── driveService.js
│       │   ├── marketingService.js
│       │   ├── partnerLocationService.js
│       │   ├── partnerService.js
│       │   ├── userService.js
│       │   └── walletService.js
│       ├── hooks/
│       │   ├── useAdInjection.js
│       │   └── useCart.js
│       ├── layouts/
│       │   └── MainLayout.jsx
│       └── pages/
│           ├── Cart.jsx
│           ├── Checkout.jsx
│           ├── Home.jsx
│           ├── ProductDetail.jsx
│           └── Profile.jsx
│
└── dh-staff-app/
    ├── .env.example
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── firebase/
        │   └── config.js
        ├── layouts/
        │   └── MobileLayout.jsx
        └── pages/
            └── PackingTasks.jsx