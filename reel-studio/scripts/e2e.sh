#!/usr/bin/env bash
# Whole pipeline for a project made by tools/run_example.mjs (or any project with brief/script/storyboard/audio-plan):
#   bash scripts/e2e.sh <projectDir> [--no-voice] [--scale 0.5]
# --no-voice uses estimated timing (no Kokoro, no Whisper) for a fast test; --scale 0.5 renders at half size.
set -euo pipefail
TK="$(cd "$(dirname "$0")/.." && pwd)"; P="$(cd "$1" && pwd)"; shift; VOICE=1; SCALE=1; PY="${PY:-python3}"
while [ $# -gt 0 ]; do case "$1" in --no-voice) VOICE=0; shift;; --scale) SCALE="$2"; shift 2;; *) echo "unknown $1"; exit 2;; esac; done
step() { echo; echo "== $*"; }
node "$TK/tools/rs.mjs" --path >/dev/null 2>&1 || node "$TK/scripts/install_remotion_skills.mjs"   # official Remotion skills must be present
step "1 install Remotion deps"; (cd "$P/remotion" && [ -d node_modules ] || npm install --no-audit --no-fund --loglevel=error)
step "2 check storyboard against the component manifest"; node "$TK/tools/check_storyboard.mjs" "$P"
step "3 voice + word timing"; node "$TK/tools/audio/build_tts_input.mjs" "$P"; cd "$P"; export TTS_SCRIPT=data/tts.json
if [ "$VOICE" = 1 ]; then "$PY" "$TK/tools/audio/voice.py" . | tail -3; "$PY" "$TK/tools/audio/words.py" . | tail -1; else "$PY" "$TK/tools/audio/estimate.py" . | tail -1; fi
step "4 timeline + sound cues + mix"; node "$TK/tools/timing/build_timeline.mjs" "$P"; node "$TK/tools/audio/build_cues.mjs" "$P"; "$PY" "$TK/tools/audio/mix.py" .
step "5 one still per shot (LOOK at review/storyboard.jpg)"; node "$TK/tools/preview_shots.mjs" "$P"; node "$TK/tools/qa/frame_stats.mjs" "$P/review/storyboard" || echo "(frame_stats flagged something: read it)"
step "6 render"; mkdir -p renders; N="$(basename "$P")"; (cd remotion && npx remotion render src/index.ts Reel "../renders/$N.raw.mp4" --scale "$SCALE" --concurrency "${REMOTION_CONCURRENCY:-2}")
step "7 loudness + QA"; node "$TK/tools/qa/final_qa.mjs" "renders/$N.raw.mp4" "renders/$N.mp4"; node "$TK/tools/qa/audio_check.mjs" "renders/$N.mp4" || true
node "$TK/tools/qa/contact_sheet.mjs" "renders/$N.mp4" review/final.jpg --every 1; echo "DONE renders/$N.mp4 and review/final.jpg"
