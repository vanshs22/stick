"""Regenerates schemas/*.schema.json (the contracts between agents and tools). Edit here, then: python3 scripts/make_schemas.py"""
import json
def obj(req, props, **k): return {"type": "object", "required": req, "properties": props, **k}
def arr(items, extra=None, **k): return {"type": "array", "items": items, **(extra or {}), **k}
ST = {"type": "string", "minLength": 1}
N = {"type": "number"}
PLAT = ["instagram-reels", "tiktok", "youtube-shorts", "youtube", "linkedin", "x"]
LID = {"type": "string", "pattern": "^L\\d{2,3}$"}
schemas = {
"production-brief": obj(["title", "topic", "platform", "duration_sec", "language", "style_pack"], {
  "title": ST, "topic": ST, "platform": {"type": "string", "enum": PLAT}, "aspect": {"type": "string", "enum": ["9:16", "16:9", "1:1", "4:5"]},
  "duration_sec": {"type": "number", "minimum": 10, "maximum": 180}, "language": ST, "audience": {"type": "string"}, "goal": {"type": "string"}, "style_pack": ST,
  "voice": obj(["engine"], {"engine": {"type": "string", "enum": ["kokoro", "own-recording", "captions-only"]}, "voice": {"type": "string"}, "speed": {"type": "number", "minimum": 0.7, "maximum": 1.6}, "own_recording": {"type": "string"}}),
  "music": obj([], {"direction": {"type": "string"}, "file": {"type": "string"}}), "captions": obj([], {"preset": {"type": "string"}}),
  "cta": obj([], {"keyword": {"type": "string"}, "text": {"type": "string"}}), "constraints": arr({"type": "string"}), "reference_videos": arr({"type": "string"}),
  "approvals": obj([], {"mode": {"type": "string", "enum": ["ask", "auto"]}})}),
"creator-profile": obj(["niche", "audience"], {"niche": ST, "subniches": arr({"type": "string"}), "audience": ST, "topics": arr({"type": "string"}), "tone": {"type": "string"}, "avoid": arr({"type": "string"}),
  "default_platform": {"type": "string", "enum": PLAT}, "default_duration_sec": N, "voice_defaults": {"type": "object"}, "approved_styles": arr({"type": "string"}), "knowledge_files": arr({"type": "string"}),
  "feedback_history": arr(obj(["video", "note"], {"video": ST, "note": ST, "at": {"type": "string"}}))}),
"research": obj(["topic", "angle", "claims", "sources"], {"topic": ST, "angle": ST,
  "claims": arr(obj(["id", "text", "status"], {"id": {"type": "string", "pattern": "^C\\d+$"}, "text": ST, "status": {"type": "string", "enum": ["verified", "unverified", "opinion"]}, "source_ids": arr({"type": "string"})})),
  "sources": arr(obj(["id", "url", "title", "captured_at"], {"id": {"type": "string", "pattern": "^SRC\\d+$"}, "url": ST, "title": ST, "captured_at": ST, "type": {"type": "string"}, "notes": {"type": "string"}, "license": {"type": "string"}})),
  "evidence_to_capture": arr(obj(["id", "url", "what"], {"id": ST, "url": ST, "what": ST, "actions": arr({"type": "string"})})),
  "hook_ideas": arr({"type": "string"}), "competitor_notes": arr({"type": "string"}), "limitations": arr({"type": "string"})}),
"script": obj(["title", "language", "lines"], {"title": ST, "language": ST, "lines": arr(obj(["id", "text", "beat"], {
  "id": LID, "text": ST, "beat": {"type": "string", "enum": ["hook", "stakes", "setup", "step", "mechanism", "proof", "objection", "twist", "cta", "save"]},
  "claims": arr({"type": "string"}), "emphasis": arr({"type": "string"}), "pause_after": {"type": "number", "minimum": 0, "maximum": 2}, "visual_hint": {"type": "string"}}), {"minItems": 4}),
  "est_seconds": N}),
"storyboard": obj(["style_pack", "shots"], {"style_pack": ST, "shots": arr(obj(["id", "line_ids", "visual_intent", "shot_type", "component"], {
  "id": {"type": "string", "pattern": "^S\\d{2,3}$"}, "line_ids": arr(LID, {"minItems": 1}), "visual_intent": ST,
  "shot_type": {"type": "string", "enum": ["screen-demo", "ui", "diagram", "data", "3d-scene", "character", "typography", "evidence", "metaphor", "mixed"]},
  "component": ST, "props": {"type": "object"},
  "evidence": obj([], {"required": {"type": "boolean"}, "source_id": {"type": "string"}, "capture_actions": arr({"type": "string"}), "asset_id": {"type": "string"}}),
  "camera": obj([], {"framing": {"type": "string"}, "movement": {"type": "string"}, "focus": {"type": "string"}}),
  "anchors": arr(obj(["name", "line", "word"], {"name": ST, "line": LID, "word": ST})),
  "overlay": {"type": "object"}, "transition_out": obj([], {"type": {"type": "string"}, "sound": {"type": "string"}}),
  "sfx": arr(obj(["type"], {"type": ST, "anchor": {"type": "string"}, "offset": N, "at": {"type": "string", "enum": ["start", "end"]}, "gain": {"type": "number", "minimum": 0, "maximum": 1.5}, "dur": N})),
  "bg": {"type": "string"}, "speaker": {"type": "string"}, "presenter": {"type": "object"}, "overlays": arr({"type": "object", "required": ["type"], "properties": {"type": ST}}),
  "notes": {"type": "string"}}), {"minItems": 3})}),
"audio-plan": obj(["voice", "music", "mix"], {"voice": obj(["engine"], {"engine": ST, "voice": {"type": "string"}, "speed": N, "pronunciations": {"type": "object"}}),
  "music": obj(["direction"], {"direction": ST, "file": {"type": "string"}, "bed": {"type": "string", "enum": ["bed", "tension", "upbeat", "none", "file"]}, "gain_db": N}),
  "mix": obj(["target_lufs", "true_peak_db"], {"target_lufs": {"type": "number", "minimum": -23, "maximum": -9}, "true_peak_db": {"type": "number", "maximum": 0}, "duck_db": N}), "notes": {"type": "string"}}),
"asset-manifest": obj(["assets"], {"assets": arr(obj(["id", "type", "path", "license", "original"], {"id": ST, "type": {"type": "string", "enum": ["image", "video", "font", "audio", "model", "texture", "screenshot", "recording", "icon"]}, "path": ST,
  "source_url": {"type": "string"}, "license": ST, "author": {"type": "string"}, "captured_at": {"type": "string"}, "original": {"type": "boolean"}, "used_in": arr({"type": "string"}), "notes": {"type": "string"}}))}),
"critic-report": obj(["critic", "target", "verdict", "score", "findings"], {"critic": ST, "target": ST, "verdict": {"type": "string", "enum": ["pass", "revise", "fail"]}, "score": {"type": "number", "minimum": 0, "maximum": 100},
  "findings": arr(obj(["id", "severity", "evidence", "expected", "fix", "fix_target"], {"id": ST, "severity": {"type": "string", "enum": ["blocker", "major", "minor"]}, "shot_id": {"type": "string"}, "line_id": {"type": "string"}, "timestamp_sec": N,
    "evidence": ST, "expected": ST, "fix": ST, "fix_target": {"type": "string", "enum": ["research", "script", "storyboard", "assets", "code", "audio", "render", "style"]}})), "checked_at": {"type": "string"}}),
"style-pack": obj(["id", "name", "family", "description", "tokens", "rules"], {"id": {"type": "string", "pattern": "^[a-z0-9-]+$"}, "name": ST, "family": {"type": "string", "enum": ["2d", "3d", "mixed"]}, "description": ST,
  "tokens": obj(["colors", "fonts"], {"colors": {"type": "object"}, "fonts": {"type": "object"}, "safe_zone": {"type": "object"}}), "rules": arr(ST, {"minItems": 1}),
  "components": arr({"type": "string"}), "camera_language": {"type": "string"}, "typography": {"type": "string"}, "transitions": arr({"type": "string"}), "audio_direction": {"type": "string"}, "pitfalls": arr({"type": "string"}), "references": arr({"type": "string"})}),
"timeline": obj(["fps", "width", "height", "duration", "shots", "captions", "words"], {"fps": N, "width": N, "height": N, "duration": {"type": "number", "minimum": 1}, "style": {"type": "string"},
  "shots": arr(obj(["id", "start", "end", "component"], {"id": ST, "start": {"type": "number", "minimum": 0}, "end": N, "component": ST, "props": {"type": "object"}, "lines": arr({"type": "string"}), "anchors": {"type": "object"}, "camera": {"type": "object"}, "transition_out": {"type": "object"}}), {"minItems": 1}),
  "captions": obj(["preset", "chunks"], {"preset": ST, "chunks": arr(obj(["t0", "t1", "words"], {"t0": N, "t1": N, "words": arr(obj(["w", "t", "hi"], {"w": ST, "t": N, "hi": {"type": "boolean"}}))}))}),
  "words": arr({"type": "object"}), "audio": {"type": "string"}}),
}
for k, v in schemas.items():
    v["$schema"] = "http://json-schema.org/draft-07/schema#"; v["title"] = k
    json.dump(v, open(f"schemas/{k}.schema.json", "w"), indent=1)
print(len(schemas), "schemas")
