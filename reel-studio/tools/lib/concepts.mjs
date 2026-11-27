// concept -> picture lexicon for the overlay brain: a word the rules know nothing about still gets a prop (a Noto emoji picture, overlay type "prop").
// CONCRETE: a thing the camera can show. ABSTRACT: an idea shown through its classic physical metaphor (docs/OVERLAY-BRAIN.md, "Unusual ideas").
// Entries are "emoji: word word ...". A plural or -ing/-ed form of a listed word matches. Pure data + one function; no I/O.
const parse = (txt) => { const m = new Map(); for (const ln of txt.trim().split('\n')) { const i = ln.indexOf(':'); const e = ln.slice(0, i).trim(); for (const w of ln.slice(i + 1).trim().split(/\s+/)) m.set(w, e); } return m; };
const CONCRETE = parse(`
💰: money cash savings wallet income salary profit revenue
💸: spend spending spent waste wasted expensive bills
🏦: bank loan mortgage debt
💳: card credit payment checkout subscription
🛒: cart shopping store shop groceries
📦: package box shipping delivery parcel order
🚚: truck delivery logistics
✈: plane flight airline travel airport
🚗: car driving driver traffic
🚲: bike bicycle cycling
🚆: train railway commute
🚀: rocket launch startup liftoff
🛰: satellite orbit
🌍: world global planet earth
🏠: home house rent apartment
🏢: office company building corporation
🏭: factory manufacturing plant
🏥: hospital clinic
🏫: school classroom university college
📚: book books reading library study textbook
✏: pencil write writing draft
📝: note notes list checklist todo
📧: email inbox newsletter
📱: phone mobile smartphone app apps notification
💻: laptop computer code coding software developer program
⌨: keyboard typing
🖥: desktop monitor screen display
🖱: mouse click
🌐: website web internet browser online
📡: signal broadcast antenna wifi
🔋: battery charge power energy
🔌: plug outlet electricity
💡: idea lightbulb insight inspiration
🔦: flashlight spotlight
🔥: fire burn burning flame hot
💧: water drop leak droplet
🌊: wave flood ocean tide
❄: snow ice cold freeze frozen
☀: sun sunny daylight summer
🌙: moon night midnight sleep
⭐: star stars rating favorite
🌈: rainbow
⚡: lightning electric spark fast instant
🌪: tornado chaos storm
🌱: seed sprout plant growing grow growth
🌳: tree forest
🌸: flower blossom
🍎: apple fruit
🍕: pizza
🍔: burger fastfood
☕: coffee espresso caffeine
🍜: noodles ramen soup
🍞: bread toast bakery
🥚: egg
🍷: wine
🍺: beer
🎂: cake birthday
🎁: gift present reward
🎉: party celebrate celebration win victory
🏆: trophy champion winner award prize
🥇: first gold podium
🎯: target goal aim bullseye
⚽: soccer football
🏀: basketball
🎮: game games gaming controller player
🎲: dice gamble luck random chance odds
🃏: card-game poker joker
🎬: movie film cinema scene
📷: camera photo picture photograph
🎥: video recording footage
🎤: microphone mic podcast speaker voice speech
🎧: headphones listening audio
🎵: music song melody
🎸: guitar band
🔔: bell alert notification reminder
📣: megaphone announce announcement marketing advertise ad
📢: loudspeaker shout
📈: chart growth rising increase trend
📉: decline falling drop decrease crash
📊: stats statistics analytics data metrics
🗂: folder files file filing archive
🗑: trash delete garbage
📎: attachment clip
📌: pin pinned
🔍: search magnifier look investigate research
🔎: details zoom closer inspect
🔒: lock locked secure security private privacy password
🔓: unlock unlocked open exposed
🔑: key access credential
🛡: shield protect protection defense safe
🔧: wrench fix repair tool tools
🔨: hammer build construct
⚙: gear settings engine machine mechanism process
🧰: toolbox toolkit
🧲: magnet attract attention
⚖: scale balance law fair justice tradeoff
🧪: experiment lab test testing
🔬: microscope detail science scientist
💊: pill medicine drug
🩺: doctor health checkup
🧠: brain mind memory think thinking learn learning smart intelligence
👀: eyes watch watching look see
👂: ear hear
👄: mouth talk
👍: like approve thumbs
👎: dislike reject
👏: applause clap
🙌: hooray praise
🤝: deal handshake agreement partner partnership trust
💪: strength strong muscle effort
🧑‍💻: engineer programmer hacker
🧑‍🍳: chef cook
👶: baby child kid
👨‍👩‍👧: family parents
👥: team people crowd users audience customers
👤: user person account profile
👑: king queen crown boss
🕵: detective spy secret mystery
🤖: robot bot ai agent automation assistant
👻: ghost ghosting
💀: dead death skull
🦄: unicorn
🐛: bug insect error
🐍: snake python
🐌: slow snail sluggish
🐢: turtle
🐇: rabbit
🐕: dog
🐈: cat
🐟: fish
🦈: shark predator
🐝: bee busy
🕸: web network trap
🧱: brick wall block blocks
🪜: ladder steps climb career
🏔: mountain summit peak challenge
🧭: compass direction navigate guide
🗺: map route roadmap plan
⛓: chain chained link dependency
🧵: thread
🧶: tangled yarn mess spaghetti complicated complexity
🪤: trap catch
🕳: hole gap void
🪞: mirror reflection
📅: calendar date schedule deadline
⏰: alarm clock morning early
⏳: hourglass time waiting wait patience
⌛: timer countdown
🚦: traffic-light signal-light
🚧: construction roadblock obstacle blocked
🛑: stop halt
✅: done correct yes complete checked passed
❌: wrong no failed fail incorrect
⚠: warning caution risk danger
❓: question confusion unknown
❗: important alert urgent
♻: recycle reuse
🧹: clean cleanup sweep
🧼: soap wash
🎭: acting mask fake pretend drama
🎨: art design paint creative
🖼: gallery frame
📺: tv television broadcast
📰: news newspaper headline press
🗞: article
🧾: receipt invoice tax taxes
🏷: tag label price discount sale cheap
🪙: coin coins
💎: diamond premium valuable gem
📜: contract scroll rules policy terms
✉: letter mail message
🗳: vote election ballot
🏛: government court institution
🪖: army soldier military
🔫: weapon
🔮: prediction forecast future crystal
🧩: puzzle piece pieces
🎢: rollercoaster volatile volatility ups-and-downs
🪂: parachute backup fallback safety-net
🧯: extinguisher emergency firefighting
🛠: maintenance
🪄: magic trick wizard
🚶: queue line-up pedestrian walking
`);
// idea -> physical metaphor. [emoji, animation, one-line why]. Used when the line has an abstract word and nothing concrete.
const ABSTRACT = {
  memory: ['🧠', 'pop', 'the brain as the store'], risk: ['🎲', 'shake', 'dice: an outcome you do not control'], speed: ['⚡', 'drop', 'a lightning bolt'], slow: ['🐌', 'float', 'a snail'], trust: ['🤝', 'pop', 'a handshake'],
  complexity: ['🧶', 'shake', 'a tangle'], complicated: ['🧶', 'shake', 'a tangle'], simple: ['🧩', 'pop', 'one piece that fits'], time: ['⏳', 'float', 'an hourglass'], cost: ['💸', 'drop', 'money leaving'], price: ['🏷', 'pop', 'a price tag'],
  scale: ['📈', 'pop', 'a rising chart'], hierarchy: ['🪜', 'pop', 'a ladder'], network: ['🕸', 'pop', 'a web'], connection: ['⛓', 'pop', 'a link'], dependency: ['⛓', 'shake', 'a chain'], cause: ['🎯', 'pop', 'a target'],
  effect: ['💥', 'pop', 'an impact'], result: ['🏆', 'pop', 'a trophy'], decision: ['⚖', 'shake', 'a balance'], choice: ['🧭', 'spin', 'a compass'], tradeoff: ['⚖', 'shake', 'a balance'], balance: ['⚖', 'shake', 'a balance'],
  growth: ['🌱', 'pop', 'a sprout'], decline: ['📉', 'drop', 'a falling chart'], failure: ['💥', 'shake', 'a crash'], success: ['🏆', 'pop', 'a trophy'], mistake: ['🧯', 'shake', 'an emergency'], bug: ['🐛', 'shake', 'a bug'],
  secret: ['🤫', 'pop', 'a hush'], hidden: ['🕵', 'pop', 'a detective'], truth: ['🔍', 'pop', 'a magnifier'], lie: ['🎭', 'spin', 'a mask'], fake: ['🎭', 'spin', 'a mask'], attention: ['👀', 'shake', 'eyes on it'], focus: ['🎯', 'pop', 'a target'],
  habit: ['♻', 'spin', 'a loop'], loop: ['♻', 'spin', 'a loop'], repeat: ['♻', 'spin', 'a loop'], pressure: ['🌋', 'shake', 'a volcano'], stress: ['🌋', 'shake', 'a volcano'], anxiety: ['🌪', 'shake', 'a storm'],
  freedom: ['🕊', 'float', 'a dove'], peace: ['🕊', 'float', 'a dove'], love: ['❤', 'pop', 'a heart'], fear: ['😱', 'shake', 'a scream'], anger: ['😡', 'shake', 'a red face'], joy: ['😄', 'pop', 'a laugh'], surprise: ['😮', 'pop', 'a gasp'],
  boring: ['🥱', 'float', 'a yawn'], confusing: ['😵', 'spin', 'dizzy'], confused: ['😵', 'spin', 'dizzy'], overwhelmed: ['🌊', 'shake', 'a wave'], overwhelming: ['🌊', 'shake', 'a wave'], opportunity: ['🚪', 'pop', 'a door'], door: ['🚪', 'pop', 'a door'],
  foundation: ['🧱', 'stack', 'bricks stacked'], layers: ['🧱', 'stack', 'bricks stacked'], layer: ['🧱', 'stack', 'bricks stacked'], pile: ['📦', 'stack', 'boxes stacked'], stack: ['📦', 'stack', 'boxes stacked'], pattern: ['🧩', 'pop', 'a piece'],
  strategy: ['🗺', 'pop', 'a map'], plan: ['🗺', 'pop', 'a map'], roadmap: ['🗺', 'pop', 'a map'], direction: ['🧭', 'spin', 'a compass'], lost: ['🧭', 'spin', 'a compass'], bottleneck: ['🚧', 'shake', 'a roadblock'], blocker: ['🚧', 'shake', 'a roadblock'],
  shortcut: ['🚀', 'drop', 'a rocket'], hack: ['🪄', 'spin', 'a trick'], magic: ['🪄', 'spin', 'a wand'], expert: ['🎓', 'pop', 'a graduation cap'], beginner: ['🌱', 'pop', 'a sprout'], quality: ['💎', 'pop', 'a gem'], value: ['💎', 'pop', 'a gem'],
  competition: ['🏁', 'pop', 'a finish flag'], race: ['🏁', 'drop', 'a finish flag'], deadline: ['⏰', 'shake', 'an alarm'], urgent: ['⏰', 'shake', 'an alarm'], noise: ['📢', 'shake', 'a loudspeaker'], distraction: ['📱', 'shake', 'a phone'],
  energy: ['🔋', 'pop', 'a battery'], tired: ['🪫', 'drop', 'a low battery'], burnout: ['🪫', 'drop', 'a low battery'], inflation: ['🎈', 'float', 'a balloon'], bubble: ['🫧', 'float', 'a bubble'], debt: ['⛓', 'shake', 'a chain'],
  scam: ['🎣', 'drop', 'bait on a hook'], phishing: ['🎣', 'drop', 'a hook'], trap: ['🪤', 'shake', 'a trap'], filter: ['🧪', 'pop', 'a funnel of tests'], algorithm: ['⚙', 'spin', 'a gear'], system: ['⚙', 'spin', 'a gear'], automation: ['🤖', 'pop', 'a robot'],
};
// verbs and fillers that are in the table for their noun sense but would fire on almost every sentence
const SKIP = new Set('look see watch watching click open drop test testing like first win fast hot cold think thinking talk hear write writing build grow growing process right card game power machine place left idea show make made take work works good great best sure real start'.split(' '));
const stem = (w) => w.replace(/(ing|ed|es|s)$/, '');
const CKEYS = new Map([...CONCRETE].flatMap(([w, e]) => [[w, e], [stem(w), e]]));
/** the best picture for a word: { emoji, anim, why, abstract } or null. Longer, rarer words win upstream (the caller ranks). */
export function propFor(word) {
  const w = String(word).toLowerCase().replace(/[^a-z-]/g, ''); if (w.length < 3 || SKIP.has(w)) return null;
  const ak = [w, w.replace(/(es|s)$/, ''), w.replace(/s$/, '')].find((k) => ABSTRACT[k]);
  if (ak) { const [emoji, anim, why] = ABSTRACT[ak]; return { emoji, anim, why: `${w}: ${why}`, abstract: true }; }
  const e = CONCRETE.get(w) || CKEYS.get(stem(w)) || (w.endsWith('s') ? CONCRETE.get(w.slice(0, -1)) : null);
  return e ? { emoji: e, anim: 'pop', why: `${w}: a picture of the thing`, abstract: false } : null;
}
export const LEXICON_SIZE = CONCRETE.size + Object.keys(ABSTRACT).length;
