"""Generates examples/<name>/{brief,script,storyboard,audio-plan}.json. Four small, original, source-free videos used as end-to-end tests."""
import json, os
def L(*rows): return [{"id": f"L{i+1:02d}", "text": t, "beat": b, **({"emphasis": e} if e else {})} for i, (t, b, e) in enumerate(rows)]
def S(i, lines, intent, st, comp, props=None, anchors=None, sfx=None, tr=None, cam=None, **k):
    d = {"id": f"S{i:02d}", "line_ids": lines, "visual_intent": intent, "shot_type": st, "component": comp, "props": props or {}}
    if anchors: d["anchors"] = [{"name": n, "line": l, "word": w} for n, l, w in anchors]
    if sfx: d["sfx"] = sfx
    if tr: d["transition_out"] = {"type": tr[0], "sound": tr[1]}
    if cam: d["camera"] = cam
    d.update(k); return d
def brief(t, topic, pack, sec, kw, cap): return {"title": t, "topic": topic, "platform": "instagram-reels", "aspect": "9:16", "duration_sec": sec, "language": "en", "audience": "beginners who want to make things with free tools", "goal": "teach one idea clearly", "style_pack": pack, "voice": {"engine": "kokoro", "voice": "am_michael", "speed": 1.1}, "music": {"direction": "light"}, "captions": {"preset": cap}, "cta": {"keyword": kw, "text": f"Comment {kw}"}}
def plan(bed): return {"voice": {"engine": "kokoro", "voice": "am_michael", "speed": 1.1, "pronunciations": {}}, "music": {"direction": "light", "bed": bed, "gain_db": 0}, "mix": {"target_lufs": -14, "true_peak_db": -1.5}}
E = {}
E["software-explainer"] = (brief("Videos from React code", "making videos with Remotion", "editorial-notebook", 38, "REACT", "boxed"), L(
 ("You can make videos with React code.", "hook", ["React"]), ("No editor, no timeline, no credits.", "stakes", ["credits"]), ("Here is how it works.", "setup", None),
 ("Step one, create a project.", "step", ["one"]), ("Step two, describe a scene as a component.", "step", ["component"]), ("Step three, press render and get an MP4.", "step", ["MP4"]),
 ("It is free for individuals and small teams.", "proof", ["free"]), ("Comment REACT and I will send you the starter.", "cta", ["REACT"]), ("Save this so you can come back to it.", "save", None)), [
 S(1, ["L01"], "headline", "typography", "TitleCard", {"text": "Make videos with React code", "accent": "React"}, tr=("slide", "swish"), sfx=[{"type": "pop", "at": "start", "offset": 0.15}]),
 S(2, ["L02"], "three negatives pop in", "typography", "KineticList", {"items": ["No editor", "No timeline", "No credits"]}, [("item0", "L02", "editor"), ("item1", "L02", "timeline"), ("item2", "L02", "credits")], [{"type": "pop", "anchor": "item0"}, {"type": "pop", "anchor": "item1"}, {"type": "pop", "anchor": "item2"}], ("cut", "swish")),
 S(3, ["L03", "L04"], "terminal creates the project", "ui", "Terminal", {"lines": ["npx create-video@latest", "> Project created"]}, [("go", "L04", "create")], [{"type": "type", "anchor": "go", "dur": 1.2}], ("slide", "swish")),
 S(4, ["L05"], "a scene is a component", "diagram", "NotebookPage", {"title": "A scene is a component", "bullets": ["text", "shapes", "motion"]}, [("b0", "L05", "describe"), ("b1", "L05", "scene"), ("b2", "L05", "component")], [{"type": "tick", "anchor": "b0"}, {"type": "tick", "anchor": "b1"}, {"type": "tick", "anchor": "b2"}], ("cut", "none")),
 S(5, ["L06"], "render command", "ui", "Terminal", {"lines": ["npx remotion render", "> out/video.mp4 written"]}, [("r", "L06", "render")], [{"type": "type", "anchor": "r", "dur": 1.0}], ("whip", "whoosh")),
 S(6, ["L07"], "licence verdict", "typography", "Stamp", {"text": "Free for small teams", "color": "#4E9A5B", "size": 90}, [("s", "L07", "free")], [{"type": "stamp", "anchor": "s"}], ("cut", "none")),
 S(7, ["L08", "L09"], "comment call to action", "ui", "CommentBox", {"keyword": "REACT"}, [("k", "L08", "REACT")], [{"type": "ding", "anchor": "k", "offset": 0.4}])], plan("upbeat"))
E["character-story"] = (brief("The three blues", "a launch-day story with an AI helper", "stylized-3d-presenter", 32, "BLUES", "phrase"), L(
 ("The client wants to launch tomorrow.", "hook", ["tomorrow"]), ("So I asked my AI helper for a hand.", "setup", ["helper"]), ("It built the login page in one minute.", "step", ["minute"]),
 ("Then it asked about the three different blues.", "twist", ["blues"]), ("I had no answer.", "twist", None), ("Lesson: write the design down first.", "proof", ["design"]),
 ("Comment BLUES and I will send the checklist.", "cta", ["BLUES"]), ("Save this for your next launch.", "save", None)), [
 S(1, ["L01"], "worried close-up", "character", "Scene3D", {"set": "desk-night", "characters": [{"variant": "lowpoly", "pose": "think", "mood": "worried", "glasses": True, "skin": "#F1CBA8", "shirt": "#F4CB3A", "hair": "#3a2418"}], "camera": {"shot": "close", "move": "push"}}, tr=("cut", "swish"), sfx=[{"type": "thud", "at": "start", "offset": 0.1, "gain": 0.4}]),
 S(2, ["L02"], "helper hops when asked", "character", "Scene3D", {"set": "desk-night", "characters": [{"variant": "lowpoly", "pose": [[0, "idle"], [0.6, "open"]], "mood": "calm", "glasses": True, "skin": "#F1CBA8", "shirt": "#F4CB3A", "hair": "#3a2418"}], "creatures": [{"kind": "cloud", "x": -0.5, "y": 0.83, "z": 0.9, "scale": 0.9, "color": "#4a46c9", "kickAnchor": "helper"}], "camera": {"shot": "desk", "move": "drift"}}, [("helper", "L02", "helper")], [{"type": "pop", "anchor": "helper"}], ("cut", "swish")),
 S(3, ["L03"], "typing on a terminal", "screen-demo", "Terminal", {"lines": ["build login page", "> done in 1 minute"]}, [("go", "L03", "built")], [{"type": "type", "anchor": "go", "dur": 1.0}], ("cut", "none")),
 S(4, ["L04"], "surprised reaction", "character", "Scene3D", {"set": "desk-night", "characters": [{"variant": "lowpoly", "pose": "panic", "mood": "surprised", "glasses": True, "skin": "#F1CBA8", "shirt": "#F4CB3A", "hair": "#3a2418"}], "creatures": [{"kind": "screen", "x": -0.9, "y": 0.83, "z": 0.9, "scale": 0.9, "color": "#232329", "kickAnchor": "blues"}], "camera": {"shot": "close", "move": "push"}}, [("blues", "L04", "blues")], [{"type": "boing", "anchor": "blues", "gain": 0.5}], ("dip", "none")),
 S(5, ["L05", "L06"], "shrug then lesson", "character", "Scene3D", {"set": "desk-night", "characters": [{"variant": "lowpoly", "pose": [[0, "shrug"], [2.0, "point"]], "mood": [[0, "sad"], [2.0, "smirk"]], "glasses": True, "skin": "#F1CBA8", "shirt": "#F4CB3A", "hair": "#3a2418"}], "camera": {"shot": "medium", "move": "pull"}}, tr=("cut", "swish")),
 S(6, ["L07", "L08"], "comment call to action", "ui", "CommentBox", {"keyword": "BLUES", "reward": "and I will send the checklist"}, [("k", "L07", "BLUES")], [{"type": "ding", "anchor": "k", "offset": 0.4}])], plan("bed"))
E["motion-graphics"] = (brief("Three caption mistakes", "readable captions", "editorial-notebook", 30, "CAPTIONS", "word-pop"), L(
 ("Most captions fail in three ways.", "hook", ["three"]), ("One, they are too small to read.", "step", ["small"]), ("Two, they sit on top of the face.", "step", ["face"]),
 ("Three, they highlight the wrong word.", "step", ["wrong"]), ("The fix: big, low, one accent word.", "proof", ["accent"]), ("Comment CAPTIONS for the checklist.", "cta", ["CAPTIONS"]), ("Save this for your next edit.", "save", None)), [
 S(1, ["L01"], "headline", "typography", "TitleCard", {"text": "Captions fail in three ways", "accent": "three"}, tr=("whip", "whoosh")),
 S(2, ["L02", "L03", "L04"], "three mistakes tick in", "diagram", "Checklist", {"items": ["Too small to read", "On top of the face", "Wrong word highlighted"]}, [("c0", "L02", "small"), ("c1", "L03", "face"), ("c2", "L04", "wrong")], [{"type": "tick", "anchor": "c0"}, {"type": "tick", "anchor": "c1"}, {"type": "tick", "anchor": "c2"}], ("slide", "swish")),
 S(3, ["L05"], "bad versus good", "diagram", "Versus", {"left": "small + centred", "right": "big + low + one accent", "badge": "VS"}, [("v", "L05", "fix")], [{"type": "pop", "anchor": "v"}], ("cut", "none")),
 S(4, ["L06", "L07"], "comment call to action", "ui", "CommentBox", {"keyword": "CAPTIONS"}, [("k", "L06", "CAPTIONS")], [{"type": "ding", "anchor": "k", "offset": 0.4}])], plan("upbeat"))
E["voxel-howto"] = (brief("Free videos with code", "a voxel how-to", "voxel-explainer", 30, "VIDEO", "word-pop"), L(
 ("No animator? No problem.", "hook", ["problem"]), ("You can make this style with code.", "setup", ["code"]), ("Step one, open a terminal.", "step", ["terminal"]),
 ("Step two, type one line.", "step", ["line"]), ("Step three, press enter and wait.", "step", ["enter"]), ("Comment VIDEO and I will send every step.", "cta", ["VIDEO"]), ("Save this so you can come back to it.", "save", None)), [
 S(1, ["L01", "L02"], "voxel presenter greets, creature hops", "character", "Scene3D", {"set": "starfield", "characters": [{"variant": "voxel", "pose": [[0, "open"], [1.5, "point"]], "mood": "happy", "skin": "#A8704A", "shirt": "#5a5a72", "hair": "#14100c", "beard": True, "badge": "#F2C12E"}], "creatures": [{"kind": "box", "x": 0.8, "z": 0.4, "scale": 1.1, "color": "#F0683C", "kickAnchor": "code"}], "camera": {"shot": "medium", "move": "push"}}, [("code", "L02", "code")], [{"type": "boing", "anchor": "code", "gain": 0.5}], ("cut", "swish")),
 S(2, ["L03"], "terminal opens", "screen-demo", "Terminal", {"lines": ["open terminal"]}, [("t", "L03", "terminal")], [{"type": "pop", "anchor": "t"}], ("zoom", "swish")),
 S(3, ["L04"], "one line typed", "ui", "Terminal", {"lines": ["make a 30 second video"]}, [("t", "L04", "line")], [{"type": "type", "anchor": "t", "dur": 1.0}], ("cut", "none")),
 S(4, ["L05"], "presenter waits", "character", "Scene3D", {"set": "starfield", "characters": [{"variant": "voxel", "pose": "think", "mood": "smirk", "skin": "#A8704A", "shirt": "#5a5a72", "hair": "#14100c", "beard": True}], "creatures": [{"kind": "box", "x": 0.8, "z": 0.4, "scale": 1.1, "color": "#F0683C", "kickAnchor": "enter"}], "camera": {"shot": "medium", "move": "drift"}}, [("enter", "L05", "enter")], [{"type": "tick", "anchor": "enter"}], ("whip", "whoosh")),
 S(5, ["L06", "L07"], "comment call to action", "ui", "CommentBox", {"keyword": "VIDEO"}, [("k", "L06", "VIDEO")], [{"type": "ding", "anchor": "k", "offset": 0.4}])], plan("upbeat"))
LBL = lambda l, r: {"type": "label", "left": l, "right": r}
EXTRA = {
 "software-explainer": {"S01": dict(presenter={"pose": "wave", "mood": "happy"}, overlays=[LBL("// 01 · the idea", "REACT")]),
   "S02": dict(presenter={"pose": "open", "mood": "calm"}, overlays=[LBL("// 02 · why", "$0")]),
   "S03": dict(presenter={"pose": "point", "mood": "calm"}, overlays=[LBL("// 03 · step one", "STEP 1/3"), {"type": "step-chip", "n": 1, "of": 3, "anchor": "go"}, {"type": "cursor", "from": [260, 900], "to": [520, 760], "anchor": "go"}]),
   "S04": dict(presenter={"pose": "think", "mood": "calm"}, overlays=[LBL("// 04 · step two", "STEP 2/3"), {"type": "step-chip", "n": 2, "of": 3, "anchor": "b0"}]),
   "S05": dict(presenter={"pose": "point", "mood": "happy"}, overlays=[LBL("// 05 · step three", "STEP 3/3"), {"type": "step-chip", "n": 3, "of": 3, "anchor": "r"}, {"type": "progress", "name": "video.mp4", "anchor": "r", "x": 540, "y": 1180}]),
   "S06": dict(bg="dark", presenter={"pose": "open", "mood": "happy"}, overlays=[LBL("// 06 · the licence", "CHECK IT")]),
   "S07": dict(presenter={"pose": "wave", "mood": "happy"}, overlays=[LBL("// 07 · get it", "COMMENT"), {"type": "hearts", "x": 800, "y": 1000, "anchor": "k"}])},
 "character-story": {"S01": dict(speaker="Me"), "S02": dict(speaker="Me"), "S04": dict(speaker="Helper"), "S05": dict(speaker="Me")},
 "motion-graphics": {"S01": dict(presenter={"pose": "wave", "mood": "happy"}, overlays=[LBL("// captions", "3 MISTAKES")]), "S02": dict(presenter={"pose": "think", "mood": "worried"}), "S03": dict(presenter={"pose": "open", "mood": "happy"}, overlays=[{"type": "sticker", "text": "FIX", "anchor": "v", "x": 800, "y": 470}]), "S04": dict(presenter={"pose": "wave", "mood": "happy"})},
 "voxel-howto": {"S01": dict(overlays=[{"type": "step-label", "text": "Make it with code", "n": 1, "of": 5}]), "S02": dict(overlays=[{"type": "step-label", "text": "Step 1 · open a terminal", "n": 1, "of": 5}]), "S03": dict(overlays=[{"type": "step-label", "text": "Step 2 · one line", "n": 2, "of": 5}, {"type": "tags", "items": [{"text": "free"}, {"text": "open source"}], "x": 540, "y": 820, "anchor": "t"}]),
   "S04": dict(overlays=[{"type": "step-label", "text": "Step 3 · press enter", "n": 3, "of": 5}, {"type": "callout", "text": "built from simple shapes", "x": 640, "y": 1050, "anchor": "enter"}]), "S05": dict(overlays=[{"type": "step-label", "text": "Comment to get every step", "n": 5, "of": 5}])},
}
CAPS = {"software-explainer": "headline", "character-story": "dialogue", "motion-graphics": "headline"}
for n, (b, lines, shots, ap) in E.items():
    for sid, ex in EXTRA.get(n, {}).items(): next(x for x in shots if x["id"] == sid).update(ex)
    if n in CAPS: b["captions"] = {"preset": CAPS[n]}
    if n == "voxel-howto":
        for x in shots:
            for ch in x["props"].get("characters", []): pass
            if x["component"] == "Scene3D": x["props"]["camera"] = {"shot": "presenter", "move": "push"}
    os.makedirs(f"examples/{n}", exist_ok=True)
    json.dump(b, open(f"examples/{n}/brief.json", "w"), indent=1)
    json.dump({"title": b["title"], "language": "en", "lines": lines, "est_seconds": round(sum(len(l["text"].split()) for l in lines) / 2.4)}, open(f"examples/{n}/script.json", "w"), indent=1)
    json.dump({"style_pack": b["style_pack"], "shots": shots}, open(f"examples/{n}/storyboard.json", "w"), indent=1)
    json.dump(ap, open(f"examples/{n}/audio-plan.json", "w"), indent=1)
print(len(E), "examples")
