"""
Shared config: system prompt, quality scoring, prompt templates.
"""

# ── System prompt used for both synthetic generation AND fine-tuning ──────────

SYSTEM_PROMPT = """\
You are an expert Strudel live-coder and musician. Strudel is a JavaScript port \
of the TidalCycles algorithmic pattern language.

When given a musical description, you respond with ONLY valid Strudel code — \
no explanation, no markdown fences, just the raw code.

Rules for high-quality Strudel:
- Use euclidean rhythms (`euclid`), polymeter, or polyrhythm for interesting timing
- Use modulation: `sine.range(a,b)`, `perlin.range(a,b)`, `rand`, `saw` applied to \
  parameters like `.lpf()`, `.gain()`, `.speed()`
- Use probability/variation: `sometimes`, `rarely`, `often`, `every(n, fn)`, `randcat`
- Layer voices with `stack(...)` for rhythmic depth
- Use mini-notation features: `<alt1 alt2>` for alternation, `[a b]*2` for speed, \
  `a(3,8)` for euclidean, `~` for rests
- Keep patterns generative — they should evolve over cycles, not repeat identically
- Use appropriate instruments: `s()` for samples, `note().s()` for pitched synths
- Available synths: sawtooth, square, triangle, sine, supersaw, pulse, \
  arpy, piano, moog, juno, jazz, pluck, gtr, bass
- Available drum sounds: bd, sd, hh, ho, cp, mt, ht, lt, rim, cb, casio
- Effects: .lpf() .hpf() .room() .delay() .reverb() .gain() .pan() \
  .crush() .phaser() .speed() .begin() .end()
"""

# ── Strudel docs pages to scrape ─────────────────────────────────────────────

SCRAPE_URLS = [
    "https://strudel.cc/learn/getting-started/",
    "https://strudel.cc/learn/notes/",
    "https://strudel.cc/learn/mini-notation/",
    "https://strudel.cc/learn/effects/",
    "https://strudel.cc/learn/audio-effects/",
    "https://strudel.cc/learn/samples/",
    "https://strudel.cc/learn/synths/",
    "https://strudel.cc/learn/patterns/",
    "https://strudel.cc/learn/time/",
    "https://strudel.cc/learn/chords/",
    "https://strudel.cc/learn/accumulation/",
    "https://strudel.cc/learn/tonal/",
    "https://strudel.cc/workshop/getting-started/",
    "https://strudel.cc/workshop/first-sounds/",
    "https://strudel.cc/workshop/first-notes/",
    "https://strudel.cc/workshop/first-effects/",
    "https://strudel.cc/workshop/first-patterns/",
    "https://strudel.cc/workshop/mini-notation/",
]

# ── Creativity scoring ────────────────────────────────────────────────────────
# Each entry: (regex_pattern, score, label)

FEATURE_SCORES = [
    # Euclidean / structural rhythm
    (r'\beuclid\b',          4, "euclidean"),
    (r'\bpolymeter\b',       4, "polymeter"),
    (r'\bpolyrhythm\b',      4, "polyrhythm"),
    (r'\bjux\b',             3, "jux"),
    (r'\boff\b',             2, "off"),
    (r'\bstutter\b',         2, "stutter"),
    (r'a\(\d+,\s*\d+\)',     3, "euclid_mini"),  # mini-notation a(n,k)

    # Probability / variation
    (r'\bsometimes\b',       2, "sometimes"),
    (r'\brarely\b',          2, "rarely"),
    (r'\boften\b',           2, "often"),
    (r'\bevery\b',           2, "every"),
    (r'\brandcat\b',         3, "randcat"),
    (r'\bdegrade\b',         2, "degrade"),
    (r'\bdegradeby\b',       2, "degradeby"),
    (r'\bsometimesBy\b',     2, "sometimesBy"),

    # Modulation / signals
    (r'\bsine\b',            2, "sine"),
    (r'\bperlin\b',          3, "perlin"),
    (r'\brand\b',            2, "rand"),
    (r'\bsaw\b',             2, "saw"),
    (r'\.range\(',           2, "range"),
    (r'\bslow\b',            1, "slow"),
    (r'\bfast\b',            1, "fast"),
    (r'\blinger\b',          2, "linger"),

    # Mini-notation features
    (r'<[^>]{4,}>',          2, "alternation"),   # <a b c> with content
    (r'\*\d',                1, "speed_mult"),

    # Structure
    (r'\bstack\b',           1, "stack"),
    (r'\bcat\b',             1, "cat"),
    (r'\bseq\b',             1, "seq"),
    (r'\biter\b',            2, "iter"),
    (r'\brev\b',             1, "rev"),

    # Effects
    (r'\.room\(',            1, "room"),
    (r'\.delay\(',           1, "delay"),
    (r'\.lpf\(',             1, "lpf"),
    (r'\.hpf\(',             1, "hpf"),
    (r'\.reverb\(',          1, "reverb"),
    (r'\.phaser\(',          1, "phaser"),
    (r'\.crush\(',           1, "crush"),
    (r'\.pan\(',             1, "pan"),

    # Pitched content
    (r'\bnote\b',            1, "note"),
    (r'\bn\b',               1, "n_func"),
    (r'scale\(',             2, "scale"),
]

MIN_QUALITY_SCORE = 6   # examples below this are dropped
MIN_CODE_LENGTH   = 40  # characters
MAX_CODE_LENGTH   = 1500

# ── Synthetic generation prompt list ─────────────────────────────────────────

GENERATION_PROMPTS = [
    # Drums & percussion
    "minimal techno kick pattern, four on the floor with occasional variation",
    "euclidean drum pattern with kick, snare and hi-hats — 3 voices, evolving",
    "jungle breakbeat with rapid hi-hats and syncopated snares",
    "hip-hop boom bap beat with swinging hi-hats",
    "polyrhythmic percussion — 3 against 4 feel with rimshots and cowbell",
    "trap-style hi-hat rolls with 808 kick, probabilistic variation",
    "afrobeat percussion with layered conga and clave patterns",
    "drum and bass amen break style pattern, fast and complex",
    "sparse minimal beat — lots of space, occasional rimshot surprises",
    "latin percussion pattern with timbales and bongos",
    "glitchy IDM beat with stutter and bit crush on snare",
    "reggae one drop rhythm pattern",
    "samba-inspired percussion with surdo and tamborim",

    # Bass
    "acid techno bassline with filter modulation using sine wave",
    "deep dub bass, slow and spacious with lots of reverb",
    "funky slap bass riff in dorian mode",
    "aggressive industrial bass with bit crush and distortion",
    "liquid drum and bass melodic bass with fast runs",
    "minimal bass pulse that slowly shifts pitch over 8 cycles",
    "breakbeat bass with pitched slides and portamento",
    "reggaeton bass pattern with characteristic bounce",
    "wobbly dubstep bass modulated with slow sine wave on lpf",

    # Melodies & leads
    "generative pentatonic melody with random note selection each cycle",
    "arpeggiated chord progression Am - F - C - G using sine synth",
    "modal melody in phrygian dominant, middle eastern feel",
    "fast glitchy melody that alternates between two octaves",
    "slow evolving melody using perlin noise for pitch modulation",
    "jazz-style improvised melody over ii-V-I progression",
    "gamelan-inspired pentatonic melody with gentle detuning",
    "melodic techno lead with supersaw and slow filter sweep",
    "chiptune melody with square wave and fast arpeggio",
    "lofi lo-fi guitar melody with reverb and slight pitch wobble",

    # Chords & pads
    "lush ambient pad with slow attack, long sustain, gentle chorus",
    "evolving chord pad that shifts between maj7 and min7 voicings",
    "dark drone pads in tritone intervals, very slow modulation",
    "glassy piano chord stabs with delay and reverb",
    "detuned supersaw chord with filter sweep over 4 bars",
    "warm analog pad modulated with perlin noise on cutoff",
    "tense dissonant string pad with clusters",
    "gospel-style organ chords with slight overdrive",

    # Full patterns / multi-voice
    "full minimal techno loop: kick, hats, bass and a simple lead",
    "ambient generative piece: evolving pad, slow melody, gentle percussion",
    "jungle track: breakbeat drums, reese bass, and lead synth arpeggio",
    "lo-fi hip-hop loop: boom bap drums, jazz chords, warm bass",
    "industrial techno: distorted kick, metallic percussion, acid bass",
    "four-voice generative pattern where each voice uses different euclidean rhythm",
    "drum and bass track with amen break, bass and a short vocal chop",
    "detroit techno: four on the floor kick, chord stabs, Detroit-style lead",
    "dub techno: sparse kick, deep pads with lots of echo and reverb",
    "polyrhythmic ambient: three voices in 3, 4, 5 cycle lengths respectively",

    # Modulation-focused
    "bass pattern where the filter cutoff is modulated by a slow sine wave",
    "melody where each note has randomised reverb size using rand",
    "percussion pattern where gain of hi-hats sweeps up and down with saw wave",
    "generative pattern using perlin noise to select notes from a scale",
    "chord pad that pans slowly left and right with a sine LFO",
    "pattern using every(4) to occasionally reverse the phrase",
    "euclidean pattern that degrades randomly every other cycle",
    "melody that sometimes plays staccato and sometimes legato using sometimesBy",

    # Special techniques
    "pattern using jux to create a stereo widening effect",
    "pattern combining polymeter of 3 and 4 to create evolving variation",
    "generative melody using randcat to pick from multiple sub-patterns",
    "off-beat pattern using the off function for syncopation",
    "slow iter pattern that rotates through pitch variations each cycle",
    "stacked pattern with rev applied sometimes to create call-response",
    "pattern using scale() to constrain random notes to pentatonic scale",
    "pattern using linger to extend certain notes and create rhythmic tension",
]
