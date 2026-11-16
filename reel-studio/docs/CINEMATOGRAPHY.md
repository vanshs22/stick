# Cinematography

The director decides every shot's length, framing, movement and transition from the story. Nothing in the toolkit cuts or moves
the camera on a timer. A shot may hold still for as long as the story needs; it may also stay locked while objects, UI, weather
or the actor's performance carry it.

## The camera spec (Stage3D `props.camera`)
```json
{
  "framing": "medium",              // extreme-wide wide medium-wide medium medium-close-up close-up extreme-close-up
                                    // over-the-shoulder pov insert top-down establishing
  "angle": "three-quarter",         // eye-level low-angle high-angle dutch three-quarter profile front-facing overhead
  "az": -18, "el": 0, "roll": 0,    // optional exact azimuth/elevation/roll in degrees (az 0 = in front of the subject)
  "subject": "hero",                // an id from cast/props3d or a world subject (desk, window, house...)
  "offset": [0.1, 0],               // frame offset as a fraction of the frame width/height (rule of thirds)
  "target": "box",                  // over-the-shoulder / pov: what we look at
  "focus": { "target": "hero", "aperture": 0.004 },
  "movement": { "type": "static" }
}
```

## Movement: only when it earns its place
`dolly-push dolly-pull tracking pan tilt orbit crane pedestal handheld focus-pull rack-focus subject-follow reveal`.
Every non-static movement must give:

| field | meaning |
|---|---|
| `why` | a sentence (40+ characters) naming what the move reveals, follows or emphasises. "More dynamic" is rejected |
| `from` / `to` | start and end poses (any camera-spec field; `from` defaults to the base pose). `to.distScale` = a fractional dolly (0.8 = 20 percent closer) |
| `target` | what the camera looks at or follows |
| `start`, `duration` | seconds inside the shot (>= 0.8 s) |
| `profile` | `constant ease-in ease-out ease-in-out` (speed profile) |
| `curve` | `linear sine cubic expo quint` (easing shape) |
| `focus` | `{target, aperture}`; `{from, to}` for a rack focus |
| `constraints` | what the composition must keep ("both eyes stay in frame", "box visible throughout") |

The critic checks the move does what its name says (a push gets closer, an orbit goes around), limits speed (22 percent of the
subject distance per second, 22 deg/s orbit, 28 deg/s pan), keeps the subject in the safe frame at the start, middle and end,
and refuses the same move twice in a row.

## Continuity (checked between consecutive shots)
* **Jump cut**: same framing, subject and an angle within 30 degrees of the last shot. Change both or declare `match_cut`.
* **Axis**: the camera stays on one side of the subject (sign of `az`) unless a neutral shot sits between.
* **Screen direction**: a character keeps facing the same way on screen unless they turn on screen.
* **Position/object/look**: a character or prop does not teleport, change size or change costume between shots of a scene.
* **Match cut**: `"match_cut": true` verifies the subject has the same screen position on both sides.
* **Transitions** other than a cut need `transition_out.why`.

## Run
```
node tools/check_cinematography.mjs <project>      # also runs inside tools/check_storyboard.mjs
node tools/selftest_cinematography.mjs             # proves the critic rejects planted defects
```
Output is a `critic-report` (schemas/critic-report.schema.json) with shot id, timestamp, evidence, expected result and fix.
