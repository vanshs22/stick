#!/usr/bin/env bash
# Reel Studio installer (macOS / Linux / WSL).   bash install.sh [--skip-models] [--no-venv] [--minimal] [--into <project>]
# This file only checks Node and hands over to scripts/setup.mjs (one implementation for every OS).
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then echo "Node.js is missing. Install Node 22 LTS (https://nodejs.org or: brew install node / nvm install 22) and run this again."; exit 1; fi
V=$(node -p "process.versions.node.split('.')[0]")
if [ "$V" -lt 18 ]; then echo "Node $V is too old: Remotion needs 18 or newer (22 recommended)."; exit 1; fi
exec node scripts/setup.mjs "$@"
