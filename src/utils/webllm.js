// Dynamically imported to avoid bundling in the main chunk
let webllm = null
async function getWebLLM() {
  if (!webllm) webllm = await import('@mlc-ai/web-llm')
  return webllm
}

// Prebuilt model — no conversion needed, downloads from HuggingFace CDN
const MODEL_ID = 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC'

const SYSTEM_PROMPT = `You are an expert Strudel live-coding musician. Your goal is musical quality, not technical complexity.
Output ONLY a single line of valid Strudel code. No explanation, no markdown, no code fences.

AVAILABLE SOUNDS — use no others:
  Drums  (s()): bd sd hh ho cp mt ht lt rim cb
  Samples (s()): arpy pluck bass moog juno gtr jazz sitar
  Synths (note().s()): sawtooth square triangle sine supersaw pulse

MINI-NOTATION:
  "a b c d"   → 4 events per cycle
  "~"         → rest
  "[a b]"     → subdivide one step into two
  "<a b c>"   → alternate each cycle
  stack(a, b) → layer two patterns

RULES:
- Do NOT use .gain() .lpf() .room() .delay() .orbit() .fast() .slow() .voicings()
- Never use struct() when notes already contain ~ rests
- For chords: note("[c3,e3,g3]")
- Use at most ONE every() or sometimes()

STYLE ARCHETYPES:
  Rock bass:      note("c2 ~ ~ c2 ~ c2 eb2 ~").s("sawtooth")
  Funk bass:      note("c2 c2 ~ eb2 ~ c2 ~ bb1").s("bass")
  Ambient pad:    note("<[c3,eb3,g3] [ab2,c3,eb3] [f2,ab2,c3]>").s("supersaw")
  Melodic arp:    note("c4 eb4 g4 bb4 g4 eb4 c4 ~").s("pluck")
  Drum groove:    s("bd ~ sd ~ bd bd sd ~")

Generate a SINGLE line of Strudel code that creates a satisfying looping musical pattern.`

let engine = null
let loadingPromise = null

export function isWebGPUAvailable() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

export async function loadEngine(onProgress) {
  if (engine) return engine

  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    const { MLCEngine } = await getWebLLM()
    engine = new MLCEngine()
    engine.setInitProgressCallback(report => {
      onProgress?.(report.text, report.progress)
    })
    await engine.reload(MODEL_ID)
    return engine
  })()

  return loadingPromise
}

export function unloadEngine() {
  if (engine) {
    engine.unload()
    engine = null
    loadingPromise = null
  }
}

export async function generatePatternLocal(description, onStep, globalKey, onProgress) {
  onStep?.('Loading local model…')
  const eng = await loadEngine(onProgress)

  onStep?.('Generating pattern…')
  const keyHint = globalKey ? ` Use ${globalKey.root} ${globalKey.scale} key.` : ''
  const userMessage = description + keyHint

  const reply = await eng.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.9,
    max_tokens: 256,
  })

  const code = reply.choices[0].message.content.trim()
    .replace(/^```[a-z]*\n?/i, '')
    .replace(/```$/, '')
    .trim()

  return { code, analysis: { character: description } }
}
