# Reel Studio installer (Windows PowerShell).   .\install.ps1 [--skip-models] [--no-venv] [--minimal] [--into <project>]
# Only checks Node, then hands over to scripts/setup.mjs (same code as install.sh).
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host 'Node.js is missing. Install Node 22 LTS from https://nodejs.org (or: winget install OpenJS.NodeJS.LTS) and run this again.'; exit 1 }
$v = [int](node -p "process.versions.node.split('.')[0]")
if ($v -lt 18) { Write-Host "Node $v is too old: Remotion needs 18 or newer (22 recommended)."; exit 1 }
node scripts/setup.mjs @args
exit $LASTEXITCODE
