# OpenWork install (Windows). Run in PowerShell (keep window open).
#   irm https://raw.githubusercontent.com/jambuai/openwork/main/scripts/install-openwork.ps1 | iex
#
# Installs the published npm package globally (Node + npm).

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

$NpmPkg = if ($env:OPENWORK_NPM_PACKAGE) { $env:OPENWORK_NPM_PACKAGE } else { "@jgabriellima/openwork" }
$NpmTag = if ($env:OPENWORK_NPM_TAG) { $env:OPENWORK_NPM_TAG } else { "latest" }

if ($env:OPENWORK_INSTALL_CHANNEL -and $env:OPENWORK_INSTALL_CHANNEL -ne "npm") {
    Die "OPENWORK_INSTALL_CHANNEL=$($env:OPENWORK_INSTALL_CHANNEL) is not supported (removed). Remove the variable. This installer only runs: npm install -g ${NpmPkg}@${NpmTag}. For a local build from a git clone: bun install; bun run build; node dist/cli.mjs"
}

foreach ($cmd in @("node", "npm")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Die "$cmd not found. Install Node.js LTS (includes npm)."
    }
}

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
