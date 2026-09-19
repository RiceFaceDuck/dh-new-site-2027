checks = [
    ("firebase.json", 48, 76),
    ("firestore.rules", 49, 76),
    ("ga4AdSyncCron.js", 50, 81),
    ("AdCard.jsx", 86, 88),
    ("useAdManager.js", 87, 88),
    ("useClaimData.js", 111, 119),
    ("customerSyncService.js", 113, 114),
    ("storage.rules", 174, 190),
    ("storageService.js", 180, 183),
    ("slipStorageService.js", 186, 188),
    ("verifySlipOcr.js", 195, 196),
    ("walletFunctions.js", 199, 200),
    ("purgeOldSlips.js", 207, 208)
]

print(f"{'FILE':<25} | {'FIRST VIEW (ORIGINAL)':<22} | {'FIRST MUTATION':<15} | STATUS")
print("-" * 75)
for f, view_step, edit_step in checks:
    status = "VERIFIED BEFORE AUDIT/MUTATION" if view_step < edit_step else "FAILED"
    print(f"{f:<25} | Step {view_step:<16} | Step {edit_step:<10} | {status}")
