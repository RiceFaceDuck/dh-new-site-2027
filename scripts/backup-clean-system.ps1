# ==============================================================================
# DH NOTEBOOK - DUAL TARGET SYSTEM BACKUP (5 Core Rules Compliant)
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   DH NOTEBOOK - DUAL TARGET SYSTEM BACKUP         " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Thai Month Short Names (No Dots, Unicode Safe)
$thaiMonths = @{
    1  = "$([char]0x0E21)$([char]0x0E04)"                  # มค
    2  = "$([char]0x0E01)$([char]0x0E1E)"                  # กพ
    3  = "$([char]0x0E21)$([char]0x0E35)$([char]0x0E04)"    # มีค
    4  = "$([char]0x0E40)$([char]0x0E21)$([char]0x0E22)"    # เมย
    5  = "$([char]0x0E1E)$([char]0x0E04)"                  # พค
    6  = "$([char]0x0E21)$([char]0x0E34)$([char]0x0E22)"    # มิย
    7  = "$([char]0x0E01)$([char]0x0E04)"                  # กค
    8  = "$([char]0x0E2A)$([char]0x0E04)"                  # สค
    9  = "$([char]0x0E01)$([char]0x0E22)"                  # กย
    10 = "$([char]0x0E15)$([char]0x0E04)"                  # ตค
    11 = "$([char]0x0E1E)$([char]0x0E22)"                  # พย
    12 = "$([char]0x0E18)$([char]0x0E04)"                  # ธค
}

$now = Get-Date
$day = $now.Day
$monthStr = $thaiMonths[$now.Month]
$year = $now.Year
$zipFileName = "DHsystem-$day-$monthStr-$year.zip"

Write-Host "[*] Timestamp: $day-$monthStr-$year" -ForegroundColor Yellow
Write-Host "[*] ZIP File Name: $zipFileName" -ForegroundColor Yellow
Write-Host ""

$sourceRoot = "C:\_DH Notebook"
$localLatest = "C:\_DH Notebook\backup save\latest"
$localBackupSave = "C:\_DH Notebook\backup save"
$externalDrive = "D:\"
$externalFolder = "D:\DH_Notebook_System"

# Ensure directories exist
if (-not (Test-Path $localLatest)) {
    New-Item -ItemType Directory -Path $localLatest -Force | Out-Null
}

# Exclusion rules for Robocopy
$excludeDirs = @("tests", "node_modules", "dist", ".vite", "_Backups", "scratch", ".firebase", ".git", "E2E_Bot")
$excludeFiles = @("*.log", "*.tmp", ".DS_Store", "*.bak")

function Sync-CleanFolder {
    param (
        [string]$TargetDir,
        [string]$TargetName
    )
    Write-Host "[>] Syncing clean files to $TargetName..." -ForegroundColor Green

    # 1. Sync Root Configs / Rules
    $rootFiles = @("AGENTS.md", "GEMINI.md", "PROJECT.md")
    foreach ($rf in $rootFiles) {
        $srcFile = Join-Path $sourceRoot $rf
        if (Test-Path $srcFile) {
            Copy-Item -Path $srcFile -Destination $TargetDir -Force
        }
    }

    # 2. Sync _agents (Agent Memory)
    $srcAgents = Join-Path $sourceRoot "_agents"
    $dstAgents = Join-Path $TargetDir "_agents"
    if (Test-Path $srcAgents) {
        robocopy $srcAgents $dstAgents /MIR /R:1 /W:1 /NFL /NDL /NP /NJH /NJS | Out-Null
    }

    # 3. Sync Management System (excluding tests, node_modules, etc.)
    $srcMgmt = Join-Path $sourceRoot "Management System"
    $dstMgmt = Join-Path $TargetDir "Management System"
    if (Test-Path $srcMgmt) {
        robocopy $srcMgmt $dstMgmt /MIR /XD $excludeDirs /XF $excludeFiles /R:1 /W:1 /NFL /NDL /NP /NJH /NJS | Out-Null
        
        # Guard: Explicitly purge tests directory if lingering from old backups
        $staleTests = Join-Path $dstMgmt "tests"
        if (Test-Path $staleTests) {
            Remove-Item $staleTests -Recurse -Force | Out-Null
        }
    }

    Write-Host "[OK] Sync completed for $TargetName" -ForegroundColor Green
}

# Step 1: Sync to Local (C:\_DH Notebook\backup save\latest)
Sync-CleanFolder -TargetDir $localLatest -TargetName "C:\_DH Notebook\backup save\latest"

# Step 2: Sync to External D:\ (if available)
$hasDriveD = Test-Path $externalDrive
if ($hasDriveD) {
    if (-not (Test-Path $externalFolder)) {
        New-Item -ItemType Directory -Path $externalFolder -Force | Out-Null
    }
    Sync-CleanFolder -TargetDir $externalFolder -TargetName "D:\DH_Notebook_System"
} else {
    Write-Host "[WARN] Drive D:\ not found, skipping external folder sync." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[>] Compressing to ZIP with tar..." -ForegroundColor Cyan

# Step 3: Fast Zip Local Archive with tar.exe
$localZipPath = Join-Path $localBackupSave $zipFileName
if (Test-Path $localZipPath) {
    Remove-Item $localZipPath -Force
}

# Run tar.exe to create zip
Push-Location $localLatest
try {
    & tar.exe -a -cf $localZipPath *
} finally {
    Pop-Location
}

if (Test-Path $localZipPath) {
    $localSize = [Math]::Round(((Get-Item $localZipPath).Length / 1MB), 2)
    Write-Host "[OK] Local ZIP created: $localZipPath ($localSize MB)" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to create local ZIP" -ForegroundColor Red
}

# Step 4: Copy ZIP to External D:
if ($hasDriveD -and (Test-Path $localZipPath)) {
    $externalZipPath = Join-Path $externalDrive $zipFileName
    if (Test-Path $externalZipPath) {
        Remove-Item $externalZipPath -Force
    }
    Copy-Item -Path $localZipPath -Destination $externalZipPath -Force
    $extSize = [Math]::Round(((Get-Item $externalZipPath).Length / 1MB), 2)
    Write-Host "[OK] External ZIP copied to D:\: $externalZipPath ($extSize MB)" -ForegroundColor Green
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " [SUCCESS] DUAL BACKUP COMPLETED (C:\ and D:\)     " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
