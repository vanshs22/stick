#!/bin/bash
# Stickman Studio: plain script in -> finished narrated, captioned MP4 out. Zero AI credits (local voice, local render).
#   bash make.sh <script.txt> [--style auto|<id>] [--name my-video] [--voice am_michael] [--speed 1.05] [--draft] [--no-render]
#   bash make.sh --styles           list the saved styles
set -eu
STUDIO="$(cd "$(dirname "$0")" && pwd)"
[ -f "$STUDIO/studio.env" ] && . "$STUDIO/studio.env"
export FACELESS_HOME="${FACELESS_HOME:-/projects/sandbox/faceless-shorts/.faceless-home}"
export PATH="${FFMPEG_BIN:-/projects/sandbox/faceless-shorts/bin}:$PATH"
export CHROME="${CHROME:-$(ls /root/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)}"
PY="$FACELESS_HOME/venv/bin/python"
if [ "${1:-}" = "--styles" ]; then for f in "$STUDIO"/styles/*.json; do node -e "const s=require('$f');console.log(s.id.padEnd(20), s.description.slice(0,110))"; done; exit 0; fi
SCRIPT="${1:?usage: make.sh <script.txt> [--style id] [--name n] [--draft]}"; shift
STYLE=auto; NAME="video-$(date +%H%M%S)"; VOICE=""; SPEED=""; DRAFT=""; RENDER=1
while [ $# -gt 0 ]; do case "$1" in --style) STYLE="$2"; shift 2;; --name) NAME="$2"; shift 2;; --voice) VOICE="--voice $2"; shift 2;; --speed) SPEED="--speed $2"; shift 2;; --draft) DRAFT="--draft"; shift;; --no-render) RENDER=0; shift;; *) echo "unknown option $1" >&2; exit 2;; esac; done
P="$STUDIO/projects/$NAME"; [ -e "$P" ] && { echo "$P exists: choose another --name" >&2; exit 2; }
mkdir -p "$P/renders" "$P/review" "$P/data"; cp -R "$STUDIO/engine/index.html" "$STUDIO/engine/src" "$STUDIO/engine/fonts" "$STUDIO/engine/tools" "$P/"
echo "== 1. director (script -> plan)"; node "$STUDIO/director/director.mjs" "$SCRIPT" --style "$STYLE" --out "$P" $VOICE $SPEED > "$P/director.log"; head -40 "$P/director.log" | sed -n 1,12p
SID=$(node -e "console.log(require('$P/script.json').style)"); cp "$STUDIO/styles/$SID.json" "$P/style.json"; echo "style: $SID"
cd "$P"
echo "== 2. voice + word timing (local Kokoro + Whisper)"; "$PY" tools/voice.py . | tail -1; "$PY" tools/words.py . | tail -1
echo "== 3. validate"; node tools/capture.mjs check | grep -E "ERROR|EXCEPTION|CHECK" || true
echo "== 4. sound"; node tools/capture.mjs cues; "$PY" tools/mix.py .
node tools/capture.mjs sheet review/sheet.jpg 1.5 8 >/dev/null; echo "contact sheet: $P/review/sheet.jpg"
[ "$RENDER" = 1 ] && { echo "== 5. render"; node tools/capture.mjs video renders/$NAME.mp4 $DRAFT | tail -c 160; echo; echo "VIDEO: $P/renders/$NAME.mp4"; }
