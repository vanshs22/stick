#!/bin/bash
# Download a reference video (yt-dlp, the same tool Agent-Reach installs), measure it, and draft a style preset from it.
#   bash refs/fetch_ref.sh <url|local.mp4> <style-id> [--base cartoon-comedy]
# Needs: pip install yt-dlp opencv-python-headless soundfile numpy   (use a venv)
set -eu
HERE="$(cd "$(dirname "$0")" && pwd)"; SRC="${1:?url or file}"; ID="${2:?style id}"; shift 2
PY="${PYBIN:-python3}"
if [[ "$SRC" == http* ]]; then mkdir -p "$HERE/downloads"; "$PY" -m yt_dlp -f "mp4[height<=720]/best[height<=720]" -o "$HERE/downloads/$ID.%(ext)s" "$SRC"; SRC="$(ls "$HERE"/downloads/$ID.* | head -1)"; fi
"$PY" "$HERE/analyze_style.py" "$SRC"
M="$(ls -t "$HERE"/*.measure.json | head -1)"
"$PY" "$HERE/new_style.py" "$M" "$ID" "$@"
