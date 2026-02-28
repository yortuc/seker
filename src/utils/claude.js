import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'

const MODEL_ID = 'us.anthropic.claude-sonnet-4-6'

const ANALYSIS_PROMPT = `You are a music theory expert. Given a description, song reference, or style, extract the musical characteristics needed to recreate a similar pattern.

Return ONLY a valid JSON object — no explanation, no markdown — with these fields:
{
  "key": "e.g. Eb minor",
  "notes": "e.g. eb2 db2 bb1 ab1  (space-separated, lowercase, with octave)",
  "rhythm": "e.g. driving 16th notes, syncopated, on the beat",
  "character": "e.g. heavy distorted bass, repetitive hook, melodic",
  "structure": "e.g. 2-bar repeating motif, ascending arpeggio"
}`

const CODEGEN_PROMPT = `You are a Strudel music pattern generator.
Output ONLY a single line of valid Strudel code. No explanation, no markdown.

AVAILABLE SOUNDS — use no others:
  Drums  (s()): bd sd hh ho cp mt ht lt rim cb
  Samples (s()): arpy pluck bass moog juno gtr jazz sitar
  Synths (note().s()): sawtooth square triangle sine supersaw pulse

RULES:
- Do NOT use .bank() .voicings() .distort() .crush() .coarse() or .play()
- Do NOT add .gain() .lpf() .room() .delay() .orbit() — these are added by the app
- Do NOT add .fast() or .slow() — tempo is controlled externally
- For piano sounds use arpy or pluck (NOT "piano")
- For chords use bracket notation: note("[c3,e3,g3]") — never voicings()
- Use the provided notes and rhythm from the musical analysis

MINI-NOTATION — critical distinction:
  "a b c d"     → 4 events per cycle (sequence) — USE THIS for rhythmic/melodic lines
  <a b c d>     → 1 event per cycle, alternating (slowcat) — USE THIS only for slow chord changes
  NEVER write <...>*N — it creates extreme speed; use "a b c d" for sequences instead

Examples:
  s("bd sd hh bd")
  s("bd ~ sd ~")
  s("bd*2 ~ sd [hh ho]")
  note("e2 ~ e2 ~ g2 a2 ~ e2").s("sawtooth")
  note("c2 ~ ~ ~ a1 ~ ~ ~ f1 ~ ~ ~ g1 ~ ~ ~").s("supersaw")
  note("<[c3,e3,g3] [a2,c3,e3] [f2,a2,c3] [g2,b2,d3]>").s("arpy")
  note("c4 ~ e4 ~ g4 ~ e4 ~").s("moog")
  s("arpy").n("0 2 4 7")`

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
export async function generatePattern(description, onStep) {
  const client = createClient()

  // Step 1 — music theory analysis
  onStep?.('Analyzing style…')
  const analysisText = await converse(client, ANALYSIS_PROMPT, description)

  let analysis = {}
  try {
    // strip potential markdown fences if the model wraps in ```json
    const cleaned = analysisText.replace(/^```[a-z]*\n?/i, '').replace(/```$/,'').trim()
    analysis = JSON.parse(cleaned)
  } catch {
    analysis = { character: analysisText }
  }

  // Step 2 — Strudel code generation, grounded in the analysis
  onStep?.('Generating pattern…')
  const userMessage = `Description: ${description}

Musical analysis:
- Key/Scale: ${analysis.key || 'not specified'}
- Notes: ${analysis.notes || 'not specified'}
- Rhythm: ${analysis.rhythm || 'not specified'}
- Character: ${analysis.character || 'not specified'}
- Structure: ${analysis.structure || 'not specified'}

Generate a single line of Strudel code that captures this.`

  const code = await converse(client, CODEGEN_PROMPT, userMessage)
  return { code, analysis }
}
