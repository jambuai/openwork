# OpenWork install (Windows). Run in PowerShell (keep window open).
#   irm https://raw.githubusercontent.com/jgabriellima/openwork/main/scripts/install-openwork.ps1 | iex
#
# Default: npm global @jgabriellima/openwork (Node + npm).
# Source: $env:OPENWORK_INSTALL_CHANNEL = "source" (Git + Bun + Node).

$ErrorActionPreference = "Stop"

function Die($msg) {
    Write-Host ""
    Write-Host "openwork install: $msg" -ForegroundColor Red
    exit 1
}

function Get-NpmGlobalBin {
    $p = (npm prefix -g).Trim()
    if ($env:OS -match "Windows") { return $p }
    return (Join-Path $p "bin")
}

$Channel = if ($env:OPENWORK_INSTALL_CHANNEL) { $env:OPENWORK_INSTALL_CHANNEL } else { "npm" }

if ($Channel -eq "npm") {
    foreach ($cmd in @("node", "npm")) {
        if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
            Die "$cmd not found. Install Node.js LTS (includes npm)."
        }
    }

    $NpmPkg = if ($env:OPENWORK_NPM_PACKAGE) { $env:OPENWORK_NPM_PACKAGE } else { "@jgabriellima/openwork" }
    $NpmTag = if ($env:OPENWORK_NPM_TAG) { $env:OPENWORK_NPM_TAG } else { "latest" }

    Write-Host "OpenWork installer (npm)"
    Write-Host "  Package: ${NpmPkg}@${NpmTag}"
    Write-Host ""

    npm install -g "${NpmPkg}@${NpmTag}"
    if ($LASTEXITCODE -ne 0) { Die "npm install -g failed" }

    $npmBin = Get-NpmGlobalBin
    if ($env:OPENWORK_SKIP_PATH_HOOK -ne "1") {
        $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if ($userPath -notlike "*$npmBin*") {
            $newPath = if ($userPath) { "$userPath;$npmBin" } else { $npmBin }
            [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
            Write-Host "Added $npmBin to your user PATH (new terminals will see it)."
        }
    }

    $env:Path = "$npmBin;$env:Path"
    $ow = Get-Command openwork -ErrorAction SilentlyContinue
    if (-not $ow) { Die "openwork not on PATH after install. Add $npmBin to PATH." }
    & openwork --version

    Write-Host ""
    Write-Host "Done. Open a new terminal if needed."
    Write-Host "Next: openwork configure   then   openwork"
    Write-Host ""

    if ($env:OPENWORK_PAUSE -eq "1") {
        Read-Host "Press Enter to exit"
    }
    exit 0
}

if ($Channel -ne "source") {
    Die "unknown OPENWORK_INSTALL_CHANNEL=$Channel (use npm or source)"
}

$RepoUrl = if ($env:OPENWORK_REPO_URL) { $env:OPENWORK_REPO_URL } else { "https://github.com/jgabriellima/openwork.git" }
$Ref = if ($env:OPENWORK_GITHUB_REF) { $env:OPENWORK_GITHUB_REF } else { "main" }
$InstallDir = if ($env:OPENWORK_INSTALL_DIR) { $env:OPENWORK_INSTALL_DIR } else { Join-Path $HOME ".openwork-source" }
$BinDir = if ($env:OPENWORK_BIN_DIR) { $env:OPENWORK_BIN_DIR } else { Join-Path $HOME ".local\bin" }

foreach ($cmd in @("git", "node", "bun")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Die "$cmd not found on PATH. Install Git, Node.js LTS, and Bun (https://bun.sh)."
    }
}

Write-Host "OpenWork installer (source)"
Write-Host "  Repo:  $RepoUrl ($Ref)"
Write-Host "  Path:  $InstallDir"
Write-Host "  Bin:   $BinDir\openwork.cmd"
Write-Host ""

if (Test-Path (Join-Path $InstallDir ".git")) {
    Write-Host "Updating existing clone..."
    Push-Location $InstallDir
    try {
        git fetch origin $Ref 2>$null
        git checkout $Ref 2>$null
        git pull --ff-only origin $Ref 2>$null
        if ($LASTEXITCODE -ne 0) { git pull --ff-only 2>$null }
    } finally {
        Pop-Location
    }
} else {
    if (Test-Path $InstallDir) { Remove-Item -Recurse -Force $InstallDir }
    Write-Host "Cloning..."
    git clone --depth 1 --branch $Ref $RepoUrl $InstallDir
    if ($LASTEXITCODE -ne 0) { Die "git clone failed" }
}

Set-Location $InstallDir
$InstallAbs = (Get-Location).Path

Write-Host "bun install..."
bun install
if ($LASTEXITCODE -ne 0) { Die "bun install failed" }

Write-Host "bun run build..."
bun run build
if ($LASTEXITCODE -ne 0) { Die "bun run build failed" }

if (-not (Test-Path "dist/cli.mjs")) { Die "dist/cli.mjs missing after build" }

Write-Host "Installing launcher (user directory, no admin)..."
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

$rootFile = Join-Path $BinDir ".openwork-root"
[System.IO.File]::WriteAllText($rootFile, $InstallAbs, [System.Text.UTF8Encoding]::new($false))

$cmdPath = Join-Path $BinDir "openwork.cmd"
@"
@echo off
setlocal
set /p OWROOT=<"%~dp0.openwork-root"
node "%OWROOT%\dist\cli.mjs" %*
"@ | Set-Content -Path $cmdPath -Encoding ASCII

if ($env:OPENWORK_SKIP_PATH_HOOK -ne "1") {
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -notlike "*$BinDir*") {
        $newPath = if ($userPath) { "$userPath;$BinDir" } else { $BinDir }
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        Write-Host "Added $BinDir to your user PATH (new terminals will see it)."
    }
}

$env:Path = "$BinDir;$env:Path"

$ow = Get-Command openwork.cmd -ErrorAction SilentlyContinue
if (-not $ow) {
    Die "openwork.cmd not found after install"
}
& openwork.cmd --version

Write-Host ""
Write-Host "Done. If openwork is not found later, sign out or open a new terminal."
Write-Host "Next: openwork configure   then   openwork"
Write-Host ""

if ($env:OPENWORK_PAUSE -eq "1") {
    Read-Host "Press Enter to exit"
}
