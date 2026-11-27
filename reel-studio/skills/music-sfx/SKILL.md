---
name: music-sfx
description: Choose and build the music, sound effects and voice emotion so they fit the field, the tempo of what works and the picture. Use at the sound gate and when audio feels generic.
---
# Music and sound
Read `docs/AUDIO-MUSIC.md`. Steps: (1) tempo and genre from evidence: `node tools/audio/library.mjs trend "<niche>"` and/or `python tools/reference/overlay_scan.py <reference>` then `library.mjs match ...`; (2) a CC0 track that fits (`library.mjs music`) OR a genre bed (`"bed":"genre:phonk@140"`); (3) sound effects tied to visual events: procedural for UI, recorded CC0 (`library.mjs sfx`) for whooshes and impacts; (4) voice: Kokoro for speed, Chatterbox (`--with-voice2`) for emotion or a cloned reference voice; give every line an `emotion`; (5) listen or run `audio/ears.py`; critics `voice`, `music`, `sfx`.
Never reuse a named commercial track without a licence.
