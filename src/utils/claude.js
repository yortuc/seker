import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'

// Turkish maqam interval patterns (semitones from root)
const MAQAM_INTERVALS = {
  'nihavend': [0, 2, 3, 5, 7, 8, 11],
  'hicaz':    [0, 1, 4, 5, 7, 8, 10],
  'hicazkar': [0, 1, 4, 5, 7, 8, 11],
  'kürdi':    [0, 1, 3, 5, 7, 8, 10],
}

const CHROMATIC = ['c', 'c#', 'd', 'eb', 'e', 'f', 'f#', 'g', 'ab', 'a', 'bb', 'b']
const ROOT_TO_INDEX = {
  'C': 0, 'C#': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5,
  'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11,
}

function getMaqamNotes(root, maqam) {
  const intervals = MAQAM_INTERVALS[maqam.toLowerCase()]
  if (!intervals) return null
  const rootIdx = ROOT_TO_INDEX[root]
  if (rootIdx === undefined) return null
  return intervals.map(i => CHROMATIC[(rootIdx + i) % 12]).join(' ')
}

const MODEL_ID = 'us.anthropic.claude-sonnet-4-6'

const ANALYSIS_PROMPT = `You are a music theory expert and composer. Given a description, song reference, or style, produce a detailed compositional brief that will guide a Strudel code generator.

Return ONLY a valid JSON object — no explanation, no markdown — with these fields:
{
  "key": "e.g. C minor  (root + scale name)",
  "notes": "e.g. c2 eb2 g2 bb2  (concrete pitched notes, space-separated, lowercase with octave, appropriate for the register)",
  "chord_progression": ["i", "VII", "VI", "VII"],
  "rhythmic_character": "e.g. driving straight 8ths, syncopated 16ths with ghost notes, half-time feel",
  "genre_primary": "e.g. punk, jazz, baroque, drum and bass",
  "genre_influences": ["e.g. Bach", "e.g. metal"],
  "compositional_techniques": [
    "e.g. chromatic descending bass line",
    "e.g. call and response between melody and bass",
    "e.g. pedal tone on root with moving upper voices"
  ],
  "register": "low | mid | high",
  "character": "e.g. tense and driving, melancholic, euphoric",
  "strudel_functions_needed": ["note", "s", "struct", "stack"]
}

For strudel_functions_needed, choose only from: note s n freq stack cat struct mask every sometimes rev chunk add scale`

const CODEGEN_PROMPT = `You are an expert Strudel live-coding musician. Your goal is musical quality, not technical complexity.
Output ONLY a single line of valid Strudel code. No explanation, no markdown.

PHILOSOPHY:
- Groove first: rhythm should feel intentional and locked-in
- Less is more: a 4–8 note riff that loops is better than 16 different notes
- Leave space: rests (~) are as important as notes
- One strong idea: don't demonstrate every technique at once
- Repetition is musical: a short riff that loops creates groove, not boredom

AVAILABLE SOUNDS — use no others:
  Drums  (s()): bd sd hh ho cp mt ht lt rim cb
  Samples (s()): arpy pluck bass moog juno gtr jazz sitar
  Synths (note().s()): sawtooth square triangle sine supersaw pulse

MINI-NOTATION REFERENCE:
  "a b c d"   → 4 events per cycle (sequence) — main pattern building block
  "~"         → rest for one step
  "[a b]"     → subdivide one step into two quick events
  "a*2"       → play a twice in one step
  "<a b c>"   → alternate each cycle: a on cycle 1, b on cycle 2 — use ONLY for slow chord changes
  stack(a, b) → layer two patterns simultaneously

RULES:
- Do NOT use .gain() .lpf() .room() .delay() .orbit() — added by the app
- Do NOT use .fast() .slow() .bank() .voicings() .distort() .crush() .coarse() .play()
- NEVER use struct() when the note pattern already contains ~ rests — it double-mangles the rhythm
- Use struct() ONLY on a pattern of plain notes with no ~, to impose rhythm from outside
- Use at most ONE every() or sometimes() — chaining multiple creates chaotic unmusical results
- Never write <...>*N — it creates extreme speed
- For chords use bracket notation: note("[c3,e3,g3]") — never voicings()
- For piano/keys use arpy or pluck (NOT "piano")

STYLE ARCHETYPES — use as direct inspiration for the pattern shape:
  Rock/Muse bass:      note("c2 ~ ~ c2 ~ c2 eb2 ~").s("sawtooth")
  Funk bass:           note("c2 c2 ~ eb2 ~ c2 ~ bb1").s("bass")
  Synth bass:          note("c2 ~ ~ ~ eb2 ~ g2 ~").s("supersaw")
  Ambient pad:         note("<[c3,eb3,g3] [ab2,c3,eb3] [f2,ab2,c3] [g2,bb2,d3]>").s("supersaw")
  Baroque counterpoint: stack(note("e4 d4 c4 b3 a3 b3 c4 d4").s("arpy"), note("c3 ~ g2 ~ f2 ~ c2 ~").s("arpy"))
  Melodic arp:         note("c4 eb4 g4 bb4 g4 eb4 c4 ~").s("pluck")
  Drum groove:         s("bd ~ sd ~ bd bd sd ~")
  Broken beat:         s("bd ~ ~ sd [~ hh] ~ bd ~")

TURKISH MAQAM SCALES — when the analysis specifies a maqam, use the exact note sequence provided:
  Nihavend: melancholic, like harmonic minor but with distinct ornamental feel
  Hicaz: tense, exotic — the augmented 2nd (b2→nat3) is its signature
  Hicazkar: Hicaz with a leading tone, more resolved cadences
  Kürdi: dark, Phrygian-like, heavy descending lines`

function createClient() {
  const credentials = {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  }
  if (import.meta.env.VITE_AWS_SESSION_TOKEN) {
    credentials.sessionToken = import.meta.env.VITE_AWS_SESSION_TOKEN
  }
  return new BedrockRuntimeClient({
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    credentials,
  })
}

async function converse(client, systemPrompt, userMessage, maxTokens = 512) {
  const command = new ConverseCommand({
    modelId: MODEL_ID,
    system: [{ text: systemPrompt }],
    messages: [{ role: 'user', content: [{ text: userMessage }] }],
    inferenceConfig: { maxTokens },
  })
  const response = await client.send(command)
  return response.output.message.content[0].text.trim()
}

// Two-step generation: music analysis → Strudel code
// Returns { code, analysis }
export async function generatePattern(description, onStep, globalKey, onLog) {
  const sessionId = crypto.randomUUID()
  onLog?.('start', sessionId, description)
  try {
    return await _generate(description, onStep, globalKey, onLog, sessionId)
  } catch (err) {
    onLog?.('error', sessionId, err.message)
    throw err
  }
}

async function _generate(description, onStep, globalKey, onLog, sessionId) {
  const client = createClient()

  // Step 1 — music theory analysis
  onStep?.('Analyzing style…')
  const maqamNotes = globalKey ? getMaqamNotes(globalKey.root, globalKey.scale) : null
  const keyConstraint = globalKey
    ? `\n\nConstraint: The project key is fixed as ${globalKey.root} ${globalKey.scale}. Use this key — do not choose a different one.` +
      (maqamNotes ? ` The scale notes are: ${maqamNotes}. Use only these pitch classes.` : '')
    : ''
  const analysisText = await converse(client, ANALYSIS_PROMPT, description + keyConstraint, 1024)

  let analysis = {}
  try {
    // strip potential markdown fences if the model wraps in ```json
    const cleaned = analysisText.replace(/^```[a-z]*\n?/i, '').replace(/```$/,'').trim()
    analysis = JSON.parse(cleaned)
  } catch {
    analysis = { character: analysisText }
  }

  onLog?.('analysis', sessionId, analysis)

  // Step 2 — Strudel code generation, grounded in the analysis
  onStep?.('Generating pattern…')
  const keyLine = globalKey
    ? `${globalKey.root} ${globalKey.scale} (project key — must match)`
    : analysis.key || 'not specified'
  const maqamLine = maqamNotes
    ? `\n- Maqam note sequence (use ONLY these pitch classes): ${maqamNotes}`
    : ''
  const techniques = Array.isArray(analysis.compositional_techniques) && analysis.compositional_techniques.length
    ? analysis.compositional_techniques.map(t => `  • ${t}`).join('\n')
    : '  not specified'
  const influences = Array.isArray(analysis.genre_influences) && analysis.genre_influences.length
    ? analysis.genre_influences.join(', ')
    : 'none'
  const strudelFns = Array.isArray(analysis.strudel_functions_needed) && analysis.strudel_functions_needed.length
    ? analysis.strudel_functions_needed.join(' ')
    : 'note s'
  const chords = Array.isArray(analysis.chord_progression) && analysis.chord_progression.length
    ? analysis.chord_progression.join(' → ')
    : 'not specified'
  const userMessage = `Description: ${description}

Musical brief:
- Key/Scale: ${keyLine}${maqamLine}
- Notes to use: ${analysis.notes || 'not specified'}
- Chord progression: ${chords}
- Rhythmic character: ${analysis.rhythmic_character || analysis.rhythm || 'not specified'}
- Genre: ${analysis.genre_primary || 'not specified'} (influences: ${influences})
- Register: ${analysis.register || 'not specified'}
- Character: ${analysis.character || 'not specified'}
- Compositional techniques to capture:
${techniques}

Generate a single line of Strudel code. Keep it simple and groovy — 8–16 steps, one clear idea, strong rhythm. The pattern should loop satisfyingly.`

  const code = await converse(client, CODEGEN_PROMPT, userMessage)
  onLog?.('code', sessionId, code)
  return { code, analysis }
}
