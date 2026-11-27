# Story brain: how to write a script people finish

No tool writes a good script. The tools here (`script_studio.mjs`, the script and viral critics) only measure; the writing is done by whatever model runs this toolkit. This page is the method that makes any capable model write well. Follow the order. Do not skip step 1: most weak scripts are weak because nobody decided what the video is about.

## 1. Decide before you write (fill `script/viral-plan.json`)

| Decision | Question | Bad | Good |
|---|---|---|---|
| Viewer | Who is watching, what do they already believe? | "everyone" | "a developer who thinks tests are a waste of time" |
| Promise | By the end they can ___ / feel ___ / know ___ | "learn about caching" | "explain why your page is slow in one sentence" |
| Gap | What do they NOT know that they want to know? | none | "the slow part is not the server" |
| Turn | The line where the obvious answer fails | none | "But the server answered in 40 ms." |
| Payoff | The image, number or sentence they will repeat | "so that is caching" | "Eleven requests. One was needed." |
| Share reason | Why would a stranger send it? useful, funny, outrageous, validating | none | "validating: you are not bad at this, it is a trap" |

If you cannot fill the Gap and the Turn, there is no story, only information. Information is a list; a story is a question that gets answered in a way you did not expect. Find the question first.

## 2. The engine: every line does a job

A line may do exactly one of these. A line that does none is cut.

1. **Open** a question the viewer now wants answered.
2. **Close** one question and open a sharper one ("So it is the database. Except the database was idle.").
3. **Show** proof: a number, a name, a place, a thing you can picture.
4. **Turn**: contradict what they just started to believe.
5. **Land**: the payoff line. Short.

Rhythm of a good 30-45 s reel: Open (line 1) -> Open/Show (2-3) -> Close+Open (4) -> Show (5) -> Turn (6, at 55-75 percent) -> Show (7) -> Land (last). Keep two questions open at once for most of the film; close the first one only after the second is open.

## 3. The hook (first 3 seconds, 8-14 words)

Pick the pattern for the topic, then write THREE and say them aloud. Keep the one you would stop scrolling for. The hook promises, it never answers.

| Pattern | Template | Example |
|---|---|---|
| Contradiction | "You do X. That is why Y." | "You fixed the bug. That is why it came back." |
| Specific loss | "This costs you N <unit> every <period>." | "One missing header costs you 300 milliseconds on every visit." |
| Odd number | "N <things> did <surprising>." | "Three lines of CSS took down a bank's website." |
| Forbidden / secret | "<Group> never tells you ___." | "Your bank will not tell you where the fee is hidden." |
| Cold open (story) | Start in the middle of the moment | "At 3 a.m. the server started answering in French." |
| Accusation | "You are using ___ wrong." | "You are holding the camera wrong, and it shows." |
| Challenge | "Guess how many ___" | "Guess how many requests one button press makes." |
| Before / after | "From A to B in T" | "From 14 minutes to 90 seconds, one change." (only if true) |
| Mystery object | Name an object, withhold why | "This padlock is lying to you." |
| Small stakes, big feeling | A tiny thing that hurts | "The loading spinner is the most expensive icon you own." |

Never: a greeting, "in this video", "today we", "let's talk about", a vague claim ("this will change everything"), a question whose answer is obviously "yes". The critic rejects greetings and hooks over 16 words.
First frame: the hook's subject, and its words as text within 1 second.

## 4. Structures (pick one, do not mix)

- **Explainer** (30-60 s): hook (question) -> stakes ("here is what it costs") -> setup (one picture) -> mechanism (2-3 steps) -> proof (a real number or page) -> turn ("but the reverse is true too") -> payoff -> one ask.
- **Story / mystery** (30-90 s): cold open -> who/where in one line -> trouble -> it gets worse -> reveal at 65-80 percent -> one reaction line -> echo the cold open.
- **Dialogue comedy**: premise in line 1, A misreads, B escalates, reversal at 70 percent, a tag shorter than everything before it. Reactions under 6 words.
- **Listicle**: best item second, last item reverses the list. Each item = one picture and one surprise.
- **Tutorial**: show the finished result in the hook; each step is one verb; the last step is the check that it worked.
- **Opinion / take**: claim -> the strongest objection, stated fairly -> why the claim survives -> what to do.

## 5. Line craft (the ear, not the eye)

- **Specific beats general.** Replace every vague noun with the answer to "which one, how many, who, where": "a lot of users" -> "73 thousand developers"; "a big company" -> "a grocery chain in Ohio"; "it is slow" -> "it takes 11 seconds". If you do not know the specific, you have not researched enough, or the claim is not worth making.
- **Verbs carry the line.** "The server chokes" beats "there is a performance issue". Use plain physical verbs: break, grab, drop, burn, hide, carry, wait.
- **One idea, one number per line**; 6-14 words; a 3-word line after two long ones lands hard.
- **Contractions and spoken order.** Subject, verb, object. No "furthermore", no passive voice, no nested clauses.
- **Cut list**: really, very, basically, literally, actually, amazing, incredible, game-changer, unlock, leverage, robust, seamless, "it is important to note". Hedges ("kind of", "sort of", "might") unless the doubt is the point.
- **Contrast pairs** make memorable lines: "Fast to write, slow to run." "Everyone checks the code. Nobody checks the clock."
- **Concrete images over concepts**: a thing the camera can show (a padlock, a queue, a counter, a hand) every line. If the line has no picture, it is narration: keep it under 2 seconds or cut.
- **TTS-friendly**: write numbers as spoken ("forty thousand"), spell hard names in the audio plan, use commas for breaths and full stops for beats, avoid parentheses and slashes.
- **Address one person**: "you", or "I" if telling a story. Never "folks", "guys".
- **The ending** echoes a word or image of the hook, then ONE ask (the brief's CTA keyword, or "save this"). The last line is short.

## 6. Feeling: pick one and build to it

Curiosity (open loops), surprise (a number that is too big or too small), relief ("it is not you"), anger (a fair target), delight (a clean visual metaphor), pride ("now you know"). Name the feeling in the plan; the payoff line must deliver it. A video that tries to deliver three feelings delivers none.

## 7. Unusual or abstract topics (the napkin protocol)

When the topic has no obvious pictures (an idea, a policy, a feeling, a concept):
1. **Find the object.** What physical thing is this about? (Debt: a bucket with a hole. Trust: a bridge made of one plank per promise. Latency: a queue at one counter.)
2. **Find the number.** One figure that makes it real (cost, count, time).
3. **Find the person.** A named, specific someone it happened to.
4. **Find the moment.** The 3 seconds where it went wrong or right.
5. Write the story of the object/person/moment; let the concept appear as the lesson. The overlay brain (docs/OVERLAY-BRAIN.md, "Unusual ideas") then has a prop for each line.

## 8. Worked example

Weak (info dump, 44 words): "In this video we will talk about caching. Caching is really important for website performance. It stores data so your site loads faster. There are many types of caching. Using caching can significantly improve your user experience. Let's dive in."
Why weak: greeting hook, no gap, vague nouns, no turn, no picture, no number, same start in 4 lines.

Strong (same topic, 62 words): "Your page loads in eleven seconds. The server answered in forty milliseconds. So where did ten seconds go? Your browser asked for the same logo eleven times. Eleven downloads, one image. Cache that logo and the page drops to two seconds. But here is the catch: cache it wrong and your users never see your update. One header decides which. Check yours today."
Why it works: a number in the hook, a gap ("where did ten seconds go"), a concrete culprit (the logo), a turn ("but here is the catch"), a payoff line ("one header decides"), one ask, echoes "eleven".

## 9. Self-edit pass (do it, in this order)

1. Say the promise in one sentence. Does the last line pay it off?
2. Read the hook aloud with a stopwatch: under 3 seconds? Would a stranger stop?
3. Mark each line O / C / S / T / L (open, close, show, turn, land). Any unmarked line goes. Is there a T between 55 and 75 percent?
4. Replace every vague noun and every filler word (the craft lint lists them).
5. Vary the openings and the lengths; add one 3-word line.
6. Does every line have a picture (`visual_hint`)? Does a claim line have a `claims` id?
7. Cut 10 percent. Read once more aloud.
8. `node tools/script_studio.mjs score $P`, then `node tools/critique.mjs $P stage:script`. Fix every major; fix or defend each minor in one line.

## 10. What the machine checks (so you can aim at it) and what it cannot

Checked: hook length and greeting, words per second, line length, repeated lines, acronyms, claims linked, CTA present, filler and vague words, repeated line openings, monotone rhythm, a turn in the middle, "you / I" address, echo of the hook in the last line. NOT checked, so your job: whether the hook is surprising, whether the story is true and original, whether the turn is earned, whether it is funny. Never fake a number to make a line land: an unsourced number is a failed script, however good it sounds.
