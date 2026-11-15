# The 14 critics and where they live

| critic | skill | tool support | fix_target usually |
|---|---|---|---|
| research | video-research | validate research | research |
| script | script-critique | validate script, claims vs research | script |
| visual concept | storyboard-critique | timeline, stills | storyboard |
| storyboard | storyboard-critique | build_timeline checks (coverage, order, anchors) | storyboard |
| character | visual-critique | stills | code, style |
| typography | visual-critique, typography | stills | code, style |
| evidence | visual-critique, playwright-capture | asset manifest, stills | assets |
| transition | storyboard-critique, visual-critique | cues, stills | storyboard |
| voice | audio-production | words.txt, audio_check | audio |
| music | audio-production | audio_check | audio |
| sfx | audio-production | build_cues guard rails, audio_check | storyboard, audio |
| frame | visual-critique | frame_stats, contact_sheet | code, style |
| editorial | final-quality-control | contact_sheet, script | script, storyboard |
| final | final-quality-control | final_qa, audio_check | render |

Every critic writes `review/<critic>-critic.json` (schema `critic-report`): verdict, score, findings with evidence, expected, fix and `fix_target`.
Score = 100 - 25 per blocker - 10 per major - 3 per minor; pass needs >= 80 and no blocker. Max 3 rounds per critic, then the user decides.
Tools give numbers; the agent's eyes and judgement give the verdict. A model that cannot view images says so and asks the user to look.
